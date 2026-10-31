import { useEffect, useRef } from 'react';
import { useOS, AuroraColor } from './OSContext';

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

const AURORA_PALETTES: Record<
  AuroraColor,
  {
    bg: [string, string, string];
    orb: [string, string];
    r1: [string, string];
    r2: [string, string];
    r3: [string, string];
    crest: string;
    hueRange: [number, number];
  }
> = {
  'cyan-violet': {
    bg: ['#040714', '#08122b', '#061a2e'],
    orb: ['rgba(14, 165, 233, 0.16)', 'rgba(99, 102, 241, 0.06)'],
    r1: ['rgba(6, 182, 212, 0.24)', 'rgba(59, 130, 246, 0.05)'],
    r2: ['rgba(99, 102, 241, 0.20)', 'rgba(14, 165, 233, 0.08)'],
    r3: ['rgba(16, 185, 129, 0.14)', 'rgba(168, 85, 247, 0.16)'],
    crest: 'rgba(56, 189, 248, 0.30)',
    hueRange: [185, 260],
  },
  'emerald-sky': {
    bg: ['#02100d', '#041f1e', '#051929'],
    orb: ['rgba(16, 185, 129, 0.18)', 'rgba(6, 182, 212, 0.07)'],
    r1: ['rgba(16, 185, 129, 0.26)', 'rgba(20, 184, 166, 0.06)'],
    r2: ['rgba(56, 189, 248, 0.20)', 'rgba(16, 185, 129, 0.08)'],
    r3: ['rgba(52, 211, 153, 0.16)', 'rgba(14, 165, 233, 0.14)'],
    crest: 'rgba(52, 211, 153, 0.32)',
    hueRange: [145, 195],
  },
  'rose-gold': {
    bg: ['#130612', '#1f0b1d', '#1c1018'],
    orb: ['rgba(244, 63, 94, 0.16)', 'rgba(251, 191, 36, 0.06)'],
    r1: ['rgba(244, 63, 94, 0.24)', 'rgba(251, 146, 60, 0.06)'],
    r2: ['rgba(236, 72, 153, 0.20)', 'rgba(245, 158, 11, 0.08)'],
    r3: ['rgba(251, 191, 36, 0.14)', 'rgba(192, 132, 252, 0.16)'],
    crest: 'rgba(251, 113, 133, 0.30)',
    hueRange: [330, 390],
  },
  'ocean-blue': {
    bg: ['#020817', '#061531', '#08203e'],
    orb: ['rgba(56, 189, 248, 0.18)', 'rgba(37, 99, 235, 0.07)'],
    r1: ['rgba(56, 189, 248, 0.25)', 'rgba(37, 99, 235, 0.06)'],
    r2: ['rgba(59, 130, 246, 0.22)', 'rgba(6, 182, 212, 0.08)'],
    r3: ['rgba(14, 165, 233, 0.16)', 'rgba(99, 102, 241, 0.15)'],
    crest: 'rgba(125, 211, 252, 0.32)',
    hueRange: [195, 235],
  },
  'sunset-magenta': {
    bg: ['#0f051d', '#1d0933', '#270b26'],
    orb: ['rgba(192, 132, 252, 0.16)', 'rgba(244, 63, 94, 0.06)'],
    r1: ['rgba(168, 85, 247, 0.24)', 'rgba(236, 72, 153, 0.06)'],
    r2: ['rgba(244, 63, 94, 0.20)', 'rgba(139, 92, 246, 0.08)'],
    r3: ['rgba(251, 146, 60, 0.14)', 'rgba(217, 70, 239, 0.16)'],
    crest: 'rgba(232, 121, 249, 0.30)',
    hueRange: [275, 340],
  },
};

export function Live2DWallpaper({ lite = false }: Live2DWallpaperProps) {
  const { auroraColor, auroraSpeed, auroraIntensity, auroraParticles } = useOS();
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

    const palette = AURORA_PALETTES[auroraColor] ?? AURORA_PALETTES['cyan-violet'];
    const speedMult = auroraSpeed ?? 1.0;
    const intensityMult = (auroraIntensity ?? 78) / 78;

    const mouse = { x: width * 0.5, y: height * 0.5, targetX: width * 0.5, targetY: height * 0.5 };

    const particleCount = auroraParticles ? 48 : 0;
    const [hueMin, hueMax] = palette.hueRange;
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35 * speedMult,
      vy: (-Math.random() * 0.4 - 0.1) * speedMult,
      radius: Math.random() * 2.6 + 0.8,
      alpha: Math.random() * 0.45 + 0.15,
      hue: (hueMin + Math.random() * (hueMax - hueMin)) % 360,
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

      const steps = 40;
      const stepW = width / steps;
      const amp = amplitude * intensityMult;

      for (let i = 0; i <= steps; i++) {
        const x = i * stepW;
        const normX = i / steps;
        const mouseInfluence =
          Math.exp(-Math.pow((x - mouse.x) / (width * 0.3), 2)) *
          ((mouse.y - height * 0.5) * 0.2 * intensityMult);

        const y =
          yOffset +
          Math.sin(normX * freq + t * speed) * amp +
          Math.cos(normX * (freq * 0.6) - t * (speed * 0.7)) * (amp * 0.5) +
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
          ((mouse.y - height * 0.5) * 0.2 * intensityMult);

        const y =
          yOffset +
          thickness * intensityMult +
          Math.sin(normX * freq + t * speed + 0.5) * (amp * 1.1) +
          Math.cos(normX * (freq * 0.6) - t * (speed * 0.7)) * (amp * 0.4) +
          mouseInfluence;

        ctx.lineTo(x, y);
      }

      ctx.closePath();
      const grad = ctx.createLinearGradient(0, yOffset - amp, width, yOffset + thickness + amp);
      grad.addColorStop(0, colorStart);
      grad.addColorStop(1, colorEnd);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      t += 0.012 * speedMult;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // 1. Deep Ambient Luxury Gradient Base
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, palette.bg[0]);
      bgGrad.addColorStop(0.45, palette.bg[1]);
      bgGrad.addColorStop(1, palette.bg[2]);
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
      orb1.addColorStop(0, palette.orb[0]);
      orb1.addColorStop(0.5, palette.orb[1]);
      orb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = orb1;
      ctx.fillRect(0, 0, width, height);

      // 3. Layered 2D Flowing Silk Aurora Waves
      drawRibbon(
        height * 0.35,
        height * 0.09,
        4.2,
        0.9,
        palette.r1[0],
        palette.r1[1],
        height * 0.22
      );

      drawRibbon(
        height * 0.5,
        height * 0.11,
        3.5,
        -0.75,
        palette.r2[0],
        palette.r2[1],
        height * 0.26
      );

      drawRibbon(
        height * 0.64,
        height * 0.08,
        5.0,
        1.1,
        palette.r3[0],
        palette.r3[1],
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
          Math.sin(normX * 4.5 + t) * (height * 0.08 * intensityMult) +
          Math.cos(normX * 2.5 - t * 0.8) * (height * 0.04 * intensityMult);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = palette.crest;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 5. Floating Bioluminescent 2D Particles
      if (auroraParticles) {
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.phase += 0.025 * speedMult;

          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          const twinkle = p.alpha * (0.65 + 0.35 * Math.sin(p.phase)) * intensityMult;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 90%, 75%, ${Math.min(1, twinkle)})`;
          ctx.fill();
        }
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
  }, [lite, auroraColor, auroraSpeed, auroraIntensity, auroraParticles]);

  if (lite) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
