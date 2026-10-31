import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { useOS, AuroraColor } from './OSContext';

interface LockScreenProps {
  locked: boolean;
  onUnlock: () => void;
  expectedPassword?: string;
  userName?: string;
}

const SLEEP_AURORA_COLORS: Record<AuroraColor, [string, string, string]> = {
  'cyan-violet': ['rgba(34, 211, 238, 0.35)', 'rgba(99, 102, 241, 0.3)', 'rgba(168, 85, 247, 0.28)'],
  'emerald-sky': ['rgba(52, 211, 153, 0.35)', 'rgba(20, 184, 166, 0.3)', 'rgba(56, 189, 248, 0.28)'],
  'rose-gold': ['rgba(251, 113, 133, 0.35)', 'rgba(245, 158, 11, 0.28)', 'rgba(217, 70, 239, 0.25)'],
  'ocean-blue': ['rgba(56, 189, 248, 0.35)', 'rgba(37, 99, 235, 0.32)', 'rgba(6, 182, 212, 0.28)'],
  'sunset-magenta': ['rgba(244, 114, 182, 0.35)', 'rgba(147, 51, 234, 0.32)', 'rgba(99, 102, 241, 0.28)'],
};

export function LockScreen({ locked, onUnlock, expectedPassword, userName }: LockScreenProps) {
  const { lockScreenStyle, auroraColor, playSound, openApp } = useOS();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [now, setNow] = useState(new Date());
  const [ambientLight, setAmbientLight] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [locked]);

  useEffect(() => {
    if (locked) {
      setPassword('');
      setError(false);
      setShowPasswordInput(!!expectedPassword);
      if (expectedPassword) {
        setTimeout(() => inputRef.current?.focus(), 350);
      }
    }
  }, [locked, expectedPassword]);

  // Smooth Aurora & Floating Glass Orbs Sleep Canvas
  useEffect(() => {
    if (!locked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let raf = 0;
    let t = 0;

    const orbs = Array.from({ length: 5 }, (_, i) => ({
      x: (w * (i + 1)) / 6,
      y: h * (0.3 + (i % 3) * 0.2),
      r: Math.min(w, h) * (0.28 + (i % 3) * 0.08),
      vx: (i % 2 === 0 ? 1 : -1) * (0.25 + i * 0.05),
      vy: (i % 2 === 0 ? -1 : 1) * (0.18 + i * 0.04),
    }));

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const palette = SLEEP_AURORA_COLORS[auroraColor] || SLEEP_AURORA_COLORS['cyan-violet'];

    const render = () => {
      t += 0.008;
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#030712');
      bg.addColorStop(0.5, '#070d1f');
      bg.addColorStop(1, '#02040a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      orbs.forEach((orb, idx) => {
        orb.x += orb.vx + Math.sin(t + idx) * 0.3;
        orb.y += orb.vy + Math.cos(t * 0.8 + idx) * 0.25;
        if (orb.x < -orb.r * 0.5) orb.x = w + orb.r * 0.5;
        if (orb.x > w + orb.r * 0.5) orb.x = -orb.r * 0.5;
        if (orb.y < -orb.r * 0.5) orb.y = h + orb.r * 0.5;
        if (orb.y > h + orb.r * 0.5) orb.y = -orb.r * 0.5;

        const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        g.addColorStop(0, palette[idx % palette.length]);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [locked, auroraColor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expectedPassword || password === expectedPassword) {
      playSound('open');
      onUnlock();
    } else {
      playSound('notify');
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleQuickUnlock = () => {
    if (expectedPassword) {
      setShowPasswordInput(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      playSound('open');
      onUnlock();
    }
  };

  const hoursStr = String(now.getHours()).padStart(2, '0');
  const minsStr = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${hoursStr}:${minsStr}`;
  const dateStr = now.toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <AnimatePresence>
      {locked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: 'blur(16px)' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => {
            if (!expectedPassword && !showPasswordInput) handleQuickUnlock();
          }}
          className="fixed inset-0 z-[99999] flex flex-col justify-between p-8 sm:p-12 select-none overflow-hidden font-sans"
        >
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

          {ambientLight && (
            <div className="absolute inset-0 bg-white/15 pointer-events-none backdrop-brightness-125 transition-all duration-500" />
          )}

          {/* TOP BAR */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 flex items-center justify-between max-w-4xl w-full mx-auto"
          >
            <div className="px-4 py-1.5 rounded-full glass-jelly flex items-center gap-2 text-xs text-white/90">
              <Icon name="Moon" size={13} className="text-sky-300" />
              <span>スリープ中</span>
            </div>

            <div className="px-4 py-1.5 rounded-full glass-jelly text-xs text-white/90 font-medium">
              {dateStr}
            </div>
          </div>

          {/* CENTER 3D LIQUID GLASS CLOCK */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 flex flex-col items-center justify-center my-auto"
          >
            {lockScreenStyle === 'miuix' ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                onClick={handleQuickUnlock}
                className="px-14 py-10 rounded-[40px] glass-jelly cursor-pointer text-center"
              >
                <div className="text-7xl sm:text-8xl font-black tracking-tight text-white leading-none drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                  {hoursStr}
                </div>
                <div className="text-7xl sm:text-8xl font-black tracking-tight text-sky-300 leading-none mt-1 drop-shadow-[0_8px_24px_rgba(56,189,248,0.35)]">
                  {minsStr}
                </div>
              </motion.div>
            ) : lockScreenStyle === 'cosmic-liquid' ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={handleQuickUnlock}
                className="cursor-pointer text-center"
              >
                <div className="text-7xl sm:text-9xl font-extralight tracking-tight text-white/95 tabular-nums drop-shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
                  {timeStr}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                onClick={handleQuickUnlock}
                className="px-12 sm:px-16 py-8 sm:py-10 rounded-[44px] glass-jelly cursor-pointer text-center"
              >
                <div className="text-7xl sm:text-[116px] font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/95 to-sky-200/80 leading-none tabular-nums drop-shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
                  {timeStr}
                </div>
              </motion.div>
            )}

            {/* Password input when enabled */}
            {showPasswordInput && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-7 flex flex-col items-center gap-2.5"
              >
                {userName && <div className="text-xs text-white/80 font-medium">{userName}</div>}
                <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
                  <div
                    className={`flex items-center gap-2.5 glass-jelly rounded-full px-5 py-2.5 transition ${
                      error ? 'ring-2 ring-rose-400' : ''
                    }`}
                  >
                    <Icon name="Lock" size={14} className="text-white/70" />
                    <input
                      ref={inputRef}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="パスワード"
                      className="bg-transparent text-xs text-white placeholder-white/45 outline-none w-40"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-10 h-10 rounded-full glass-jelly text-white flex items-center justify-center"
                  >
                    <Icon name="CornerDownLeft" size={15} />
                  </button>
                </form>
                {error && <span className="text-xs text-rose-300">パスワードが正しくありません</span>}
              </motion.div>
            )}
          </div>

          {/* BOTTOM WAKE CONTROLS */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 flex items-center justify-between max-w-4xl w-full mx-auto"
          >
            <button
              onClick={() => {
                playSound('click');
                setAmbientLight(!ambientLight);
              }}
              className={`w-12 h-12 rounded-2xl glass-jelly flex items-center justify-center transition ${
                ambientLight ? 'text-amber-300 ring-1 ring-amber-300/60' : 'text-white/80'
              }`}
              title="アンビエントライト"
            >
              <Icon name="Sun" size={18} />
            </button>

            <button
              onClick={handleQuickUnlock}
              className="px-7 py-3 rounded-full glass-jelly flex items-center gap-2.5 text-xs font-semibold text-white"
            >
              <span>タップしてスリープ解除</span>
              <Icon name="ChevronRight" size={14} className="text-sky-300" />
            </button>

            <button
              onClick={() => {
                playSound('open');
                onUnlock();
                setTimeout(() => openApp('ai'), 150);
              }}
              className="w-12 h-12 rounded-2xl glass-jelly flex items-center justify-center text-sky-300"
              title="AI アシスタント"
            >
              <Icon name="Bot" size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
