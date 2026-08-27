import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';

interface LockScreenProps {
  locked: boolean;
  onUnlock: () => void;
  expectedPassword?: string;
  userName?: string;
}

export function LockScreen({ locked, onUnlock, expectedPassword, userName }: LockScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [now, setNow] = useState(new Date());
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
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [locked]);

  // Animated cosmic lock background
  useEffect(() => {
    if (!locked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    let raf = 0;
    const stars: { x: number; y: number; z: number; s: number }[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({ x: Math.random() * w, y: Math.random() * h, z: Math.random() * 3 + 0.5, s: Math.random() * 1.5 + 0.3 });
    }

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);

    const render = () => {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
      grad.addColorStop(0, '#0a0520');
      grad.addColorStop(0.5, '#050214');
      grad.addColorStop(1, '#020008');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        s.y += s.z * 0.3;
        if (s.y > h) s.y = 0;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 / s.z})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [locked]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expectedPassword || password === expectedPassword) {
      onUnlock();
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 2000);
    }
  };

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <AnimatePresence>
      {locked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
        >
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

          {/* Giant flowing clock */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
            className="relative text-center mb-12"
          >
            <div className="text-[120px] font-extralight text-white/90 tabular-nums leading-none tracking-tight">
              {timeStr}
            </div>
            <div className="text-lg text-white/50 font-light mt-2">{dateStr}</div>
          </motion.div>

          {/* User avatar + unlock */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative flex flex-col items-center gap-4"
          >
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white shadow-2xl">
              <Icon name="User" size={36} />
            </div>
            <div className="text-white/80 text-sm font-medium">{userName ?? 'Liquid User'}</div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 glass-panel rounded-full px-4 py-2.5 transition ${error ? 'border-red-400/60' : ''}`}>
                <Icon name="Lock" size={16} className="text-white/50" />
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="bg-transparent text-sm text-white/90 outline-none w-48 placeholder:text-white/30"
                  spellCheck={false}
                />
              </div>
              <button
                type="submit"
                className="h-10 w-10 rounded-full bg-violet-500/80 hover:bg-violet-400 flex items-center justify-center transition liquid-glow"
              >
                <Icon name="CornerDownLeft" size={16} className="text-white" />
              </button>
            </form>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs"
              >
                Incorrect password. Try again.
              </motion.div>
            )}

            {!expectedPassword && (
              <div className="text-white/30 text-[10px]">No password set — press Enter to unlock</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
