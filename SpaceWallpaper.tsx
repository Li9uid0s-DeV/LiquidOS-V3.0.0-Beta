import { useRef, useEffect } from 'react';

interface Props {
  lite: boolean;
}

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  twinkle: number;
}

interface Nebula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export function SpaceWallpaper({ lite }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const targetMouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const ripplesRef = useRef<Ripple[]>([]);

  useEffect(() => {
    if (lite) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let stars: Star[] = [];
    let nebulae: Nebula[] = [];
    let dust: DustParticle[] = [];
    let rotation = 0;

    const init = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = Math.floor(window.innerWidth * dpr);
      h = Math.floor(window.innerHeight * dpr);
      canvas.width = w;
      canvas.height = h;

      // Stars
      const starCount = Math.floor((w * h) / 4000);
      stars = Array.from({ length: starCount }, () => ({
        x: (Math.random() - 0.5) * w * 3,
        y: (Math.random() - 0.5) * h * 3,
        z: Math.random() * w + 50,
        size: Math.random() * 1.8 + 0.3,
        twinkle: Math.random() * Math.PI * 2,
      }));

      // Nebulae — deep indigo, violet, starlight white
      const nebColors = [
        'rgba(75, 0, 130, 0.25)',   // indigo
        'rgba(138, 43, 226, 0.18)', // violet
        'rgba(30, 0, 60, 0.3)',     // deep dark
        'rgba(100, 50, 200, 0.15)', // purple
        'rgba(200, 200, 255, 0.08)', // starlight
      ];
      nebulae = Array.from({ length: 5 }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        radius: (Math.random() * 0.35 + 0.2) * Math.max(w, h),
        color: nebColors[i % nebColors.length],
        alpha: Math.random() * 0.5 + 0.3,
      }));

      // Dust particles
      const dustCount = Math.floor((w * h) / 30000);
      dust = Array.from({ length: dustCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      }));
    };

    init();
    window.addEventListener('resize', init);

    const onMove = (e: MouseEvent) => {
      const prev = { ...targetMouseRef.current };
      targetMouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
      // Spawn a ripple when mouse moves significantly — accentuates the liquid lens
      const dist = Math.hypot(targetMouseRef.current.x - prev.x, targetMouseRef.current.y - prev.y);
      if (dist > 0.02) {
        ripplesRef.current.push({
          x: e.clientX * dpr,
          y: e.clientY * dpr,
          radius: 5,
          maxRadius: 200 * dpr,
          alpha: 0.4,
        });
        // Cap ripples
        if (ripplesRef.current.length > 12) ripplesRef.current.shift();
      }
    };
    window.addEventListener('mousemove', onMove);

    let raf = 0;
    const start = performance.now();

    const render = () => {
      const time = (performance.now() - start) / 1000;
      rotation += 0.0003;

      // Smooth mouse interpolation
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.04;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Deep space background gradient
      const bgGrad = ctx.createRadialGradient(
        w * (0.3 + mx * 0.1), h * (0.3 + my * 0.1), 0,
        w * 0.5, h * 0.5, Math.max(w, h) * 0.8
      );
      bgGrad.addColorStop(0, '#0a0520');
      bgGrad.addColorStop(0.5, '#050214');
      bgGrad.addColorStop(1, '#020008');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Nebulae
      ctx.globalCompositeOperation = 'screen';
      for (const neb of nebulae) {
        neb.x += neb.vx;
        neb.y += neb.vy;
        // Wrap around
        if (neb.x < -neb.radius) neb.x = w + neb.radius;
        if (neb.x > w + neb.radius) neb.x = -neb.radius;
        if (neb.y < -neb.radius) neb.y = h + neb.radius;
        if (neb.y > h + neb.radius) neb.y = -neb.radius;

        // Mouse parallax offset
        const ox = (mx - 0.5) * 40;
        const oy = (my - 0.5) * 40;

        const grad = ctx.createRadialGradient(
          neb.x + ox, neb.y + oy, 0,
          neb.x + ox, neb.y + oy, neb.radius
        );
        grad.addColorStop(0, neb.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = neb.alpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(neb.x + ox, neb.y + oy, neb.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // Stars — rotating 3D starfield
      const cx = w / 2;
      const cy = h / 2;
      const mouseParallaxX = (mx - 0.5) * 30;
      const mouseParallaxY = (my - 0.5) * 30;

      for (const star of stars) {
        // Rotate
        const cosR = Math.cos(rotation);
        const sinR = Math.sin(rotation);
        const rx = star.x * cosR - star.y * sinR;
        const ry = star.x * sinR + star.y * cosR;

        // Project (perspective)
        const scale = 300 / star.z;
        const sx = cx + rx * scale + mouseParallaxX * (1 - star.z / (w + 50));
        const sy = cy + ry * scale + mouseParallaxY * (1 - star.z / (w + 50));

        // Twinkle
        const tw = Math.sin(time * 2 + star.twinkle) * 0.3 + 0.7;
        const sz = star.size * scale * 0.8;

        if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue;

        ctx.fillStyle = `rgba(255, 255, 255, ${tw * 0.9})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sz, 0, Math.PI * 2);
        ctx.fill();

        // Bright stars get a glow
        if (star.size > 1.4) {
          ctx.fillStyle = `rgba(200, 220, 255, ${tw * 0.2})`;
          ctx.beginPath();
          ctx.arc(sx, sy, sz * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Depth cycling — move closer over time
        star.z -= 0.15;
        if (star.z < 1) {
          star.z = w + 50;
          star.x = (Math.random() - 0.5) * w * 3;
          star.y = (Math.random() - 0.5) * h * 3;
        }
      }

      // Dust particles
      ctx.globalCompositeOperation = 'screen';
      for (const p of dust) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const ox = (mx - 0.5) * 15;
        const oy = (my - 0.5) * 15;
        ctx.fillStyle = `rgba(180, 180, 255, ${p.alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x + ox, p.y + oy, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Ripples — cosmic dust warps when mouse moves, accentuating liquid glass refraction
      ctx.globalCompositeOperation = 'screen';
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 4 * dpr;
        r.alpha *= 0.96;
        if (r.alpha < 0.02 || r.radius > r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }
        const rg = ctx.createRadialGradient(r.x, r.y, r.radius * 0.3, r.x, r.y, r.radius);
        rg.addColorStop(0, `rgba(180, 160, 255, 0)`);
        rg.addColorStop(0.6, `rgba(140, 120, 255, ${r.alpha * 0.3})`);
        rg.addColorStop(1, `rgba(100, 80, 200, 0)`);
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', init);
      window.removeEventListener('mousemove', onMove);
    };
  }, [lite]);

  if (lite) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
