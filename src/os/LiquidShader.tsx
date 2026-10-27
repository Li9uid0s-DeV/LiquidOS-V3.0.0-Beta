import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface Props {
  lite: boolean;
  opacity: number;
}

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uOpacity;

varying vec2 vUv;

#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define MAX_STEPS 64
#define STEP_SIZE 0.05
#define RS 0.65       // Schwarzschild radius (Event Horizon)
#define ISCO (3.0 * RS) // Innermost Stable Circular Orbit
#define DISK_ROUT (7.5 * RS) // Outer disk radius

// -------------------------------------------------------------------------
// Pseudo-Random & Fractal Noise Math
// -------------------------------------------------------------------------
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float hash3(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      mix(hash3(i + vec3(0,0,0)), hash3(i + vec3(1,0,0)), f.x),
      mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x),
      f.y
    ),
    mix(
      mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
      mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x),
      f.y
    ),
    f.z
  );
}

// Multi-layered Fractal Brownian Motion (fBm) for viscous plasma
float fbm3(vec3 p) {
  float v = 0.0;
  float a = 0.55;
  vec3 shift = vec3(100.0);
  for (int i = 0; i < 4; i++) {
    v += a * noise3(p);
    p = p * 2.04 + shift;
    a *= 0.48;
  }
  return v;
}

// -------------------------------------------------------------------------
// Background Distant Starfield & Nebula
// -------------------------------------------------------------------------
vec3 getStarfield(vec3 dir) {
  vec2 uv = vec2(atan(dir.z, dir.x) / TWO_PI + 0.5, asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5);
  
  // Base cosmic nebula background
  float neb = noise3(dir * 2.5 + vec3(uTime * 0.01));
  vec3 nebCol = mix(vec3(0.01, 0.02, 0.08), vec3(0.12, 0.03, 0.22), neb);
  
  // Stars
  vec2 grid = fract(uv * 180.0) - 0.5;
  float h = hash(floor(uv * 180.0));
  float star = smoothstep(0.06, 0.0, length(grid)) * step(0.97, h);
  
  return nebCol + vec3(star * (0.8 + 0.5 * sin(uTime * 2.0 + h * 6.28)));
}

// -------------------------------------------------------------------------
// Plasma Disk Volumetric Color Palette
// -------------------------------------------------------------------------
vec3 getPlasmaColor(float temp, float doppler) {
  // Relativistic heat spectrum: deep orange -> intense gold -> hot white -> blue shift
  vec3 c0 = vec3(0.05, 0.01, 0.0);
  vec3 c1 = vec3(0.85, 0.22, 0.02); // Blaze Orange
  vec3 c2 = vec3(1.00, 0.72, 0.12); // Amber Gold
  vec3 c3 = vec3(1.00, 0.98, 0.85); // Incandescent Core
  vec3 c4 = vec3(0.35, 0.65, 1.00); // Relativistic Blueshift

  vec3 col = mix(c0, c1, smoothstep(0.0, 0.35, temp));
  col = mix(col, c2, smoothstep(0.35, 0.7, temp));
  col = mix(col, c3, smoothstep(0.7, 1.1, temp));
  col = mix(col, c4, clamp((doppler - 1.2) * 1.5, 0.0, 1.0));

  return col * doppler;
}

// -------------------------------------------------------------------------
// Raymarching Singularity & Accretion Disk Simulation
// -------------------------------------------------------------------------
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);

  // Mouse camera tilt
  vec2 m = (uMouse / uResolution) * 2.0 - 1.0;
  float camRotX = m.y * 0.35 - 0.2; // slight inclination
  float camRotY = -m.x * 0.45;

  // Ray origin and direction setup
  vec3 ro = vec3(0.0, 1.6, -5.2);
  
  // Rotate camera
  mat3 rotY = mat3(
    cos(camRotY), 0.0, sin(camRotY),
    0.0, 1.0, 0.0,
    -sin(camRotY), 0.0, cos(camRotY)
  );
  mat3 rotX = mat3(
    1.0, 0.0, 0.0,
    0.0, cos(camRotX), -sin(camRotX),
    0.0, sin(camRotX), cos(camRotX)
  );
  ro = rotY * rotX * ro;

  vec3 target = vec3(0.0, 0.0, 0.0);
  vec3 forward = normalize(target - ro);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
  vec3 up = cross(forward, right);
  vec3 rd = normalize(forward * 1.6 + right * uv.x + up * uv.y);

  // Raymarching variables
  vec3 p = ro;
  vec3 dir = rd;
  vec3 accumColor = vec3(0.0);
  float accumDensity = 0.0;
  bool hitHorizon = false;

  float diskSpin = uTime * 0.4;

  for (int i = 0; i < MAX_STEPS; i++) {
    float r = length(p);

    // Hit the black hole Event Horizon
    if (r < RS) {
      hitHorizon = true;
      break;
    }

    // Escape beyond bounding sphere
    if (r > 12.0) {
      break;
    }

    // Gravitational light deflection / Einstein Ring Lensing
    // Acceleration vector towards singularity ~ G*M / r^3
    vec3 gravity = -normalize(p) * (1.6 * RS / (r * r + 0.01));
    dir = normalize(dir + gravity * STEP_SIZE);

    // Accretion disk coordinate check
    // Disk is centered around the equatorial plane y = 0
    float diskThickness = 0.12 * (1.0 + smoothstep(ISCO, DISK_ROUT, r) * 0.8);
    float distToPlane = abs(p.y);

    if (distToPlane < diskThickness && r >= RS * 1.05 && r <= DISK_ROUT) {
      // Cylindrical coordinates
      float phi = atan(p.z, p.x);
      
      // Keplerian differential rotation: v ~ 1 / sqrt(r)
      float omega = diskSpin * (2.0 / sqrt(max(r, 0.1)));
      float rotatedPhi = phi - omega;

      // 3D coordinates on rotating disk frame
      vec3 diskP = vec3(r * cos(rotatedPhi), p.y * 3.0, r * sin(rotatedPhi));

      // Multi-layer turbulent plasma density via fBm
      float plasmaNoise = fbm3(diskP * 1.8 + vec3(0.0, uTime * 0.2, 0.0));
      float radialFalloff = smoothstep(ISCO * 0.8, ISCO * 1.4, r) * (1.0 - smoothstep(DISK_ROUT * 0.6, DISK_ROUT, r));
      float verticalFalloff = exp(-pow(distToPlane / diskThickness, 2.0) * 3.5);

      float density = plasmaNoise * radialFalloff * verticalFalloff * 0.55;

      if (density > 0.01) {
        // Relativistic Doppler beaming
        // Approaching matter (x > 0 depending on rotation) is amplified & blueshifted
        vec3 orbitalVel = normalize(vec3(-p.z, 0.0, p.x));
        float dopplerFactor = 1.0 + 0.45 * dot(orbitalVel, -dir);
        dopplerFactor = clamp(dopplerFactor, 0.4, 2.2);

        float temp = density * (3.2 / (r - RS + 0.3));
        vec3 plasmaCol = getPlasmaColor(temp, dopplerFactor);

        // Volumetric emission accumulation
        accumColor += plasmaCol * density * (1.0 - accumDensity) * 1.4;
        accumDensity += density * 0.7;

        if (accumDensity >= 0.98) {
          break;
        }
      }
    }

    // Step forward along curved null geodesic
    p += dir * STEP_SIZE;
  }

  // Background starfield if ray did not terminate into the event horizon
  vec3 finalColor = vec3(0.0);
  if (!hitHorizon) {
    vec3 backgroundStars = getStarfield(dir);
    finalColor = mix(backgroundStars, accumColor, clamp(accumDensity, 0.0, 1.0));
  } else {
    // Pitch black event horizon with faint photons clinging to the edge
    finalColor = accumColor * clamp(accumDensity, 0.0, 1.0);
  }

  // Volumetric Einstein Ring photon sphere glow
  float centerDist = length(uv);
  float photonRing = exp(-pow((centerDist - 0.28) * 16.0, 2.0)) * 0.25;
  finalColor += vec3(1.0, 0.6, 0.2) * photonRing;

  // Vignette
  float vig = 1.0 - dot(uv, uv) * 0.4;
  finalColor *= clamp(vig, 0.0, 1.0);

  // Apply user opacity setting
  finalColor *= uOpacity;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export function LiquidShader({ lite, opacity }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));

  useEffect(() => {
    if (lite) return;
    const container = containerRef.current;
    if (!container) return;

    // Initialize Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Uniforms for the Raymarching Shader
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth * dpr, window.innerHeight * dpr) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uOpacity: { value: opacity },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Handle Window Resizing
    const handleResize = () => {
      const currentDpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setPixelRatio(currentDpr);
      renderer.setSize(width, height);
      uniforms.uResolution.value.set(width * currentDpr, height * currentDpr);
    };
    window.addEventListener('resize', handleResize);

    // Track Cursor Motion
    const handleMouseMove = (e: MouseEvent) => {
      const currentDpr = Math.min(window.devicePixelRatio || 1, 1.5);
      mouseRef.current.set(e.clientX * currentDpr, (window.innerHeight - e.clientY) * currentDpr);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation Render Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      uniforms.uMouse.value.lerp(mouseRef.current, 0.06);
      uniforms.uOpacity.value = opacity;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // Cleanup resources on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [lite, opacity]);

  if (lite) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
