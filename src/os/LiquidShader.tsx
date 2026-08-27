import { useRef, useEffect } from 'react';

interface Props {
  lite: boolean;
  opacity: number;
}

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uRes;
uniform float uOpacity;

// Simplex-style noise
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m; m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0;
  vec3 h=abs(x)-0.5;
  vec3 ox=floor(x+0.5);
  vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x=a0.x*x0.x+h.x*x0.y;
  g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}

float fbm(vec2 p){
  float v=0.0; float a=0.5;
  for(int i=0;i<5;i++){ v+=a*snoise(p); p*=2.0; a*=0.5; }
  return v;
}

void main(){
  vec2 uv=vUv;
  vec2 p=uv*2.0-1.0;
  p.x*=uRes.x/uRes.y;

  float t=uTime*0.06;

  // Mouse influence — subtle warp
  vec2 m=(uMouse/uRes)*2.0-1.0;
  m.x*=uRes.x/uRes.y;
  float md=distance(p,m);
  vec2 warp=p+vec2(0.0,0.0)+m*0.08*exp(-md*1.5);

  // Layered domain-warped fbm for organic morphing
  vec2 q=vec2(fbm(warp+t), fbm(warp-t+5.2));
  vec2 r=vec2(fbm(warp+q+vec2(1.7,9.2)+t*1.3), fbm(warp+q+vec2(8.3,2.8)-t*1.1));
  float n=fbm(warp+r*0.8);

  // Color palette: deep blues, electric purples, neon pinks
  vec3 c1=vec3(0.04,0.08,0.28);      // deep blue
  vec3 c2=vec3(0.35,0.18,0.75);      // electric purple
  vec3 c3=vec3(0.95,0.22,0.55);      // neon pink
  vec3 c4=vec3(0.08,0.45,0.85);      // blue accent

  vec3 col=mix(c1,c2,smoothstep(-0.3,0.5,n));
  col=mix(col,c3,smoothstep(0.2,0.8,fbm(r*1.2+t)));
  col=mix(col,c4,smoothstep(0.4,1.0,length(r))*0.5);

  // Subtle glow near mouse
  col+=c3*0.06*exp(-md*2.0);

  // Vignette
  float vig=1.0-length(p)*0.35;
  col*=vig;

  col*=uOpacity;

  gl_FragColor=vec4(col,1.0);
}
`;

export function LiquidShader({ lite, opacity }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (lite) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uMouse = gl.getUniformLocation(prog, 'uMouse');
    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uOpacity = gl.getUniformLocation(prog, 'uOpacity');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      mouseRef.current = { x: e.clientX * dpr, y: (window.innerHeight - e.clientY) * dpr };
    };
    window.addEventListener('mousemove', onMove);

    let raf = 0;
    const start = performance.now();
    const render = () => {
      const time = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uOpacity, opacity);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [lite, opacity]);

  if (lite) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
