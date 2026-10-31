import { useEffect, useRef } from 'react';

interface Live2DWallpaperProps {
  lite?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  hue: number;
  phase: number;
}

export function Live2DWallpaper({ lite = false }: Live2DWallpaperProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (lite) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let rafId = 0;

    const mouse = { x: width * 0.5, y: height * 0.5, targetX: width * 0.5, targetY: height * 0.5 };

    // Initialize floating bokeh particles
    const particleCount = 42;
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -Math.random() * 0.4 - 0.1,
      radius: Math.random() * 2.6 + 0.8,
      alpha: Math.random() * 0.45 + 0.15,
      hue: 185 + Math.random() * 65, // Cyan to Indigo-Violet
      phase: Math.random() * Math.PI * 2,
    }));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e && e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    let t = 0;

    const drawRibbon = (
      yOffset: number,
      amplitude: number,
      freq: number,
      speed: number,
      colorStart: string,
      colorEnd: string,
      thickness: number
    ) => {
      ctx.save();
      ctx.beginPath();

      const steps = 36;
      const stepW = width / steps;

      for (let i = 0; i <= steps; i++) {
        const x = i * stepW;
        const normX = i / steps;
        const mouseInfluence =
          Math.exp(-Math.pow((x - mouse.x) / (width * 0.3), 2)) *
          ((mouse.y - height * 0.5) * 0.18);

        const y =
          yOffset +
          Math.sin(normX * freq + t * speed) * amplitude +
          Math.cos(normX * (freq * 0.6) - t * (speed * 0.7)) * (amplitude * 0.5) +
          mouseInfluence;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      for (let i = steps; i >= 0; i--) {
        const x = i * stepW;
        const normX = i / steps;
        const mouseInfluence =
          Math.exp(-Math.pow((x - mouse.x) / (width * 0.3), 2)) *
          ((mouse.y - height * 0.5) * 0.18);

        const y =
          yOffset +
          thickness +
          Math.sin(normX * freq + t * speed + 0.5) * (amplitude * 1.1) +
          Math.cos(normX * (freq * 0.6) - t * (speed * 0.7)) * (amplitude * 0.4) +
          mouseInfluence;

        ctx.lineTo(x, y);
      }

      ctx.closePath();
      const grad = ctx.createLinearGradient(0, yOffset - amplitude, width, yOffset + thickness + amplitude);
      grad.addColorStop(0, colorStart);
      grad.addColorStop(1, colorEnd);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      t += 0.012;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // 1. Deep Ambient Luxury Gradient Base
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#050816');
      bgGrad.addColorStop(0.45, '#09132c');
      bgGrad.addColorStop(1, '#071b2f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Soft Ambient Glow Orbs following mouse subtly
      const orb1 = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        10,
        mouse.x,
        mouse.y,
        Math.max(width, height) * 0.45
      );
      orb1.addColorStop(0, 'rgba(14, 165, 233, 0.13)');
      orb1.addColorStop(0.5, 'rgba(99, 102, 241, 0.05)');
      orb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = orb1;
      ctx.fillRect(0, 0, width, height);

      // 3. Layered 2D Flowing Silk Aurora Waves
      drawRibbon(
        height * 0.35,
        height * 0.09,
        4.2,
        0.9,
        'rgba(6, 182, 212, 0.16)',
        'rgba(59, 130, 246, 0.04)',
        height * 0.22
      );

      drawRibbon(
        height * 0.5,
        height * 0.11,
        3.5,
        -0.75,
        'rgba(99, 102, 241, 0.14)',
        'rgba(14, 165, 233, 0.06)',
        height * 0.26
      );

      drawRibbon(
        height * 0.64,
        height * 0.08,
        5.0,
        1.1,
        'rgba(16, 185, 129, 0.10)',
        'rgba(139, 92, 246, 0.12)',
        height * 0.2
      );

      // 4. Crisp Luminous Crest Line
      ctx.save();
      ctx.beginPath();
      const crestSteps = 48;
      for (let i = 0; i <= crestSteps; i++) {
        const x = (i / crestSteps) * width;
        const normX = i / crestSteps;
        const y =
          height * 0.48 +
          Math.sin(normX * 4.5 + t) * (height * 0.08) +
          Math.cos(normX * 2.5 - t * 0.8) * (height * 0.04);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 5. Floating Bioluminescent 2D Particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += 0.025;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const twinkle = p.alpha * (0.65 + 0.35 * Math.sin(p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 75%, ${twinkle})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [lite]);

  if (lite) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
