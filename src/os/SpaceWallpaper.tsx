import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { NebulaPreset } from './types';

interface Props {
  lite: boolean;
  preset?: NebulaPreset;
  interactiveWarp?: number;
}

const BLACK_HOLE_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const BLACK_HOLE_FRAG = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uPreset; // 0: gargantua, 1: ultraviolet, 2: indigo, 3: cyan-quasar, 4: solar-flare
uniform float uWarpIntensity;

varying vec2 vUv;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

// -------------------------------------------------------------------------
// Fast pseudo-random & noise
// -------------------------------------------------------------------------
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.02 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

// -------------------------------------------------------------------------
// Color Palettes for Presets - Void Black Space with Saturated Plasma Disks
// -------------------------------------------------------------------------
void getColors(float preset, out vec3 diskCore, out vec3 diskMid, out vec3 diskOuter, out vec3 nebColor) {
  if (preset < 0.5) {
    // Gargantua Singularity (Interstellar Pure Black Space Void + Relativistic Gold/Amber Plasma)
    diskCore = vec3(1.0, 0.98, 0.92);
    diskMid = vec3(1.0, 0.58, 0.08);
    diskOuter = vec3(0.92, 0.22, 0.02);
    nebColor = vec3(0.015, 0.025, 0.06); // Deep cosmic indigo void
  } else if (preset < 1.5) {
    // Cosmic Ultraviolet
    diskCore = vec3(0.98, 0.92, 1.0);
    diskMid = vec3(0.78, 0.25, 1.0);
    diskOuter = vec3(0.48, 0.06, 0.85);
    nebColor = vec3(0.02, 0.01, 0.05);
  } else if (preset < 2.5) {
    // Deep Indigo
    diskCore = vec3(0.92, 0.98, 1.0);
    diskMid = vec3(0.22, 0.58, 1.0);
    diskOuter = vec3(0.06, 0.18, 0.65);
    nebColor = vec3(0.01, 0.02, 0.05);
  } else if (preset < 3.5) {
    // Cyan Quasar
    diskCore = vec3(0.94, 1.0, 1.0);
    diskMid = vec3(0.08, 0.94, 0.90);
    diskOuter = vec3(0.02, 0.48, 0.85);
    nebColor = vec3(0.01, 0.03, 0.04);
  } else {
    // Solar Flare
    diskCore = vec3(1.0, 0.98, 0.75);
    diskMid = vec3(1.0, 0.40, 0.06);
    diskOuter = vec3(0.95, 0.10, 0.12);
    nebColor = vec3(0.03, 0.015, 0.01);
  }
}

// -------------------------------------------------------------------------
// Procedural Starfield, Celestial Bodies & Deep Space Nebula
// -------------------------------------------------------------------------
vec3 renderSkybox(vec3 rayDir, vec3 nebCol) {
  // Map 3D direction to spherical coordinates
  vec2 skyUv = vec2(atan(rayDir.z, rayDir.x) / TWO_PI + 0.5, asin(clamp(rayDir.y, -1.0, 1.0)) / PI + 0.5);
  
  // 1. Chilling pitch-black cosmic space vacuum with subtle dust streaks
  float nebNoise = fbm(skyUv * 6.0 + vec2(uTime * 0.003, -uTime * 0.0015));
  float nebNoise2 = fbm(skyUv * 12.0 - vec2(uTime * 0.005, uTime * 0.004));
  float darkDust = smoothstep(0.32, 0.88, fbm(skyUv * 4.0 + vec2(0.4, 0.6)));
  vec3 nebula = nebCol * (nebNoise * 1.6 + nebNoise2 * 0.8) * (1.0 - darkDust * 0.85);
  
  // 2. High-precision background stars
  vec2 starGrid1 = fract(skyUv * 260.0) - 0.5;
  vec2 starId1 = floor(skyUv * 260.0);
  float h1 = hash(starId1);
  float s1 = 0.0;
  if (h1 > 0.84) {
    float d = length(starGrid1);
    s1 = smoothstep(0.07 * h1, 0.0, d) * (0.7 + 0.3 * sin(uTime * 2.5 + h1 * 40.0));
  }

  vec2 starGrid2 = fract(skyUv * 500.0) - 0.5;
  vec2 starId2 = floor(skyUv * 500.0);
  float h2 = hash(starId2);
  float s2 = 0.0;
  if (h2 > 0.92) {
    float d = length(starGrid2);
    s2 = smoothstep(0.05 * h2, 0.0, d) * (0.8 + 0.2 * cos(uTime * 3.0 + h2 * 60.0));
  }

  vec3 starColor = vec3(s1 + s2 * 1.4) * mix(vec3(0.85, 0.92, 1.0), vec3(1.0, 0.9, 0.75), h1);

  // 3. Radiant Blue-White Hypergiant Star (Einstein Lensed)
  vec3 starDir = normalize(vec3(2.4, 0.85, -2.9));
  float starDot = max(0.0, dot(rayDir, starDir));
  float starCore = pow(starDot, 3600.0) * 22.0;
  float starCorona = pow(starDot, 72.0) * 2.4;
  float starSpike1 = pow(max(0.0, abs(dot(rayDir, normalize(cross(starDir, vec3(0.0, 1.0, 0.0)))))), 80.0) * pow(starDot, 24.0) * 1.5;
  float starSpike2 = pow(max(0.0, abs(dot(rayDir, vec3(0.0, 1.0, 0.0)))), 80.0) * pow(starDot, 24.0) * 1.5;
  vec3 hypergiant = vec3(0.80, 0.90, 1.0) * (starCore + starCorona) + vec3(0.65, 0.85, 1.0) * (starSpike1 + starSpike2);

  // 4. Gas Giant Planet with Atmospheric Rayleigh Scattering
  vec3 planetDir = normalize(vec3(-3.0, -0.62, 3.4));
  float planetDot = dot(rayDir, planetDir);
  float planetAngularSize = 0.988;
  vec3 planetCol = vec3(0.0);
  if (planetDot > planetAngularSize) {
    float pDist = (planetDot - planetAngularSize) / (1.0 - planetAngularSize);
    float pRad = sqrt(clamp(1.0 - pDist, 0.0, 1.0));
    vec3 planetNorm = normalize(rayDir - planetDir * planetDot);
    vec3 planetLightDir = normalize(vec3(0.8, 0.5, -0.6));
    float pIllum = clamp(dot(planetNorm, planetLightDir) * 0.85 + 0.15, 0.0, 1.0);
    float band = sin(rayDir.y * 70.0 + fbm(rayDir.xy * 16.0) * 2.8) * 0.5 + 0.5;
    vec3 planetBase = mix(vec3(0.08, 0.20, 0.38), vec3(0.28, 0.50, 0.74), band);
    float limb = pow(1.0 - pRad, 2.4);
    planetCol = planetBase * pIllum * 1.8 + vec3(0.35, 0.70, 1.0) * limb * 2.2;
  }

  return nebula + starColor + hypergiant + planetCol;
}

// -------------------------------------------------------------------------
// Volumetric Accretion Disk Sampler
// -------------------------------------------------------------------------
float sampleDisk(vec3 pos, float rIn, float rOut, float time) {
  float r = length(pos.xz);
  if (r < rIn || r > rOut) return 0.0;
  
  // Thin vertical profile with subtle geometric flare
  float hScale = 0.035 + 0.025 * ((r - rIn) / (rOut - rIn));
  float hFalloff = exp(-abs(pos.y) / hScale);
  if (hFalloff < 0.003) return 0.0;

  // Keplerian orbital speed ~ 1 / sqrt(r)
  float angle = atan(pos.z, pos.x);
  float speed = 2.8 / (sqrt(r) + 0.2);
  float rotAngle = angle - time * speed;

  // Multi-frequency plasma streaks
  vec2 diskUv = vec2(r * 2.8, rotAngle * 2.0);
  float plasma1 = fbm(diskUv + vec2(time * 0.45, -time * 0.22));
  float plasma2 = fbm(diskUv * 2.4 - vec2(time * 0.65, time * 0.35));
  float plasma = mix(plasma1, plasma2, 0.5);
  plasma = pow(plasma, 1.25) * 2.4;

  // Radial brightness distribution & photon ring boost near ISCO
  float radialFalloff = smoothstep(rIn, rIn + 0.22, r) * smoothstep(rOut, rOut - 1.4, r);
  float photonRingBoost = 1.0 + 1.8 * exp(-abs(r - (rIn + 0.08)) * 14.0);

  return plasma * hFalloff * radialFalloff * photonRingBoost;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);
  
  // Parallax camera tilt from mouse
  vec2 mouseOffset = (uMouse - 0.5) * 0.4;
  
  // 1. Cinematic 3D Gargantua Camera Setup
  // Elevated angle looking down onto the equatorial plane to reveal both front disk and top/bottom lensed rings
  vec3 ro = vec3(mouseOffset.x * 2.0, 1.15 + mouseOffset.y * 1.0, -8.2);
  vec3 ta = vec3(0.0, 0.0, 0.0);
  
  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
  vec3 vv = normalize(cross(uu, ww));
  
  // Wide-angle cinematic FOV
  vec3 rd = normalize(uv.x * uu + uv.y * vv + 2.1 * ww);

  // Black Hole & Accretion Disk Physical Constants
  const float rs = 0.64;          // Schwarzschild Event Horizon Radius
  const float rDiskIn = rs * 1.45; // Innermost Stable Circular Orbit (ISCO)
  const float rDiskOut = rs * 5.8;

  vec3 diskCore, diskMid, diskOuter, nebColor;
  getColors(uPreset, diskCore, diskMid, diskOuter, nebColor);

  // Raymarching Variables
  vec3 p = ro;
  vec3 dir = rd;
  vec3 col = vec3(0.0);
  float transmittance = 1.0;
  bool captured = false;

  const int MAX_STEPS = 110;
  float stepSize = 0.085;

  for (int i = 0; i < MAX_STEPS; i++) {
    float r = length(p);

    // 2. Absolute Pitch-Black Event Horizon Hit
    // When the ray falls inside rs, the black hole absorbs all background light behind it.
    // Notice: Any foreground accretion disk light already accumulated in front of the black hole is preserved!
    if (r < rs) {
      captured = true;
      transmittance = 0.0;
      break;
    }

    // Gravitational Lensing Deflection: bends rays around the singularity toward (0,0,0)
    float gravity = (1.52 * rs) / (r * r * r);
    vec3 deflection = -normalize(p) * gravity * stepSize * (1.0 + uWarpIntensity * 0.25);
    dir = normalize(dir + deflection);

    // Volumetric Accretion Disk Sampling (Both Front and Gravitationally Lensed Back Split)
    if (abs(p.y) < 0.38 && r >= rDiskIn && r <= rDiskOut) {
      float dens = sampleDisk(p, rDiskIn, rDiskOut, uTime * 0.35);
      if (dens > 0.01) {
        // Relativistic Doppler Beaming: Approaching plasma (left side) is significantly amplified
        float doppler = 1.0 + clamp(-p.x / r, -0.65, 0.85) * 0.75;
        
        // Thermal plasma color ramp
        float heat = clamp(dens * doppler, 0.0, 2.4);
        vec3 emitCol = mix(diskOuter, diskMid, smoothstep(0.06, 0.65, heat));
        emitCol = mix(emitCol, diskCore, smoothstep(0.65, 1.6, heat));
        
        // Volumetric emission accumulation
        float stepAbsorption = dens * 1.2 * stepSize;
        col += emitCol * stepAbsorption * transmittance * doppler * 2.5;
        transmittance *= max(0.0, 1.0 - stepAbsorption * 1.5);
        
        if (transmittance < 0.015) break;
      }
    }

    // Step along curved geodesic path
    p += dir * stepSize;
    
    // Adaptive step size far away from black hole
    if (r > 6.0 && i > 40) {
      stepSize = 0.22;
    }
  }

  // 3. Gravitationally warped celestial background (only for rays that escaped the horizon)
  if (!captured && transmittance > 0.001) {
    vec3 sky = renderSkybox(dir, nebColor);
    col += sky * transmittance;
  }

  // Film-grade ACES Tonemapping & contrast calibration
  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  col = pow(clamp(col, 0.0, 1.0), vec3(0.92));

  gl_FragColor = vec4(col, 1.0);
}
`;

export function SpaceWallpaper({ lite, preset = 'gargantua', interactiveWarp = 0 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0.5,
    y: 0.5,
    targetX: 0.5,
    targetY: 0.5,
  });

  useEffect(() => {
    if (lite) return;
    const container = containerRef.current;
    if (!container) return;

    const presetIndexMap: Record<NebulaPreset, number> = {
      gargantua: 0.0,
      ultraviolet: 1.0,
      indigo: 2.0,
      'cyan-quasar': 3.0,
      'solar-flare': 4.0,
    };

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: 'high-performance',
        precision: 'highp',
        depth: false,
        stencil: false,
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uPreset: { value: presetIndexMap[preset] ?? 0.0 },
      uWarpIntensity: { value: interactiveWarp },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: BLACK_HOLE_VERT,
      fragmentShader: BLACK_HOLE_FRAG,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Mouse Tracking for Smooth Parallax
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX / window.innerWidth;
      mouseRef.current.targetY = 1.0 - e.clientY / window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop (Smooth 60fps)
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      uniforms.uTime.value = elapsedTime;

      // Smooth mouse lerping
      const m = mouseRef.current;
      m.x += (m.targetX - m.x) * 0.04;
      m.y += (m.targetY - m.y) * 0.04;
      uniforms.uMouse.value.set(m.x, m.y);

      uniforms.uPreset.value = presetIndexMap[preset] ?? 0.0;
      uniforms.uWarpIntensity.value = interactiveWarp;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [lite, preset, interactiveWarp]);

  if (lite) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-orange-950" />
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ contain: 'strict' }}
    />
  );
}
