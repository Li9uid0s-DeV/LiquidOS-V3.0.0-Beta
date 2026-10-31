import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { useOS } from './OSContext';

interface LockScreenProps {
  locked: boolean;
  onUnlock: () => void;
  expectedPassword?: string;
  userName?: string;
}

export function LockScreen({ locked, onUnlock, expectedPassword, userName }: LockScreenProps) {
  const { lockScreenStyle, playSound, triggerDynamicIsland, openApp } = useOS();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [now, setNow] = useState(new Date());
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(true);
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
        setTimeout(() => inputRef.current?.focus(), 400);
      }
    }
  }, [locked, expectedPassword]);

  // Animated background canvas
  useEffect(() => {
    if (!locked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let raf = 0;
    const stars: { x: number; y: number; z: number; s: number }[] = [];
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 3 + 0.5,
        s: Math.random() * 1.5 + 0.3,
      });
    }

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const render = () => {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
      if (lockScreenStyle === 'hyperos3') {
        grad.addColorStop(0, '#1a0b2e');
        grad.addColorStop(0.5, '#0d041a');
        grad.addColorStop(1, '#05010a');
      } else if (lockScreenStyle === 'miuix') {
        grad.addColorStop(0, '#1c1917');
        grad.addColorStop(0.5, '#0c0a09');
        grad.addColorStop(1, '#000000');
      } else {
        grad.addColorStop(0, '#0a0520');
        grad.addColorStop(0.5, '#050214');
        grad.addColorStop(1, '#020008');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        s.y += s.z * 0.25;
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
  }, [locked, lockScreenStyle]);

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

  const toggleFlashlight = () => {
    playSound('click');
    setFlashlightOn(!flashlightOn);
    triggerDynamicIsland(
      `Torch ${!flashlightOn ? 'Enabled' : 'Disabled'}`,
      'Lock Screen Control',
      'Flashlight'
    );
  };

  const handleLaunchCameraOrAI = () => {
    playSound('open');
    onUnlock();
    setTimeout(() => openApp('ai'), 150);
  };

  const hoursStr = now.toLocaleTimeString([], { hour: '2-digit', hour12: false });
  const minsStr = now.toLocaleTimeString([], { minute: '2-digit' });
  const timeStr = `${hoursStr}:${minsStr}`;
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <AnimatePresence>
      {locked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[99999] flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden font-sans"
        >
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

          {/* Flashlight screen illumination effect */}
          {flashlightOn && (
            <div className="absolute inset-0 bg-white/25 pointer-events-none backdrop-brightness-125 transition-all duration-300" />
          )}

          {/* ========================================================
              TOP BAR: Status Info, Weather Pill, Lock Icon
             ======================================================== */}
          <div className="relative z-10 flex items-center justify-between text-xs text-white/80 max-w-4xl w-full mx-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <Icon name="CloudSun" size={14} className="text-amber-400" />
              <span>Tokyo 21°C · Sunny</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                <Icon name="Lock" size={12} className="text-white" />
              </div>
              <span className="text-[11px] font-mono opacity-60">LiquidOS-4.1.0-Beta</span>
            </div>
          </div>

          {/* ========================================================
              MIDDLE: CLOCK & DEPTH EFFECT (HYPEROS 3 vs MIUIx vs CLASSIC)
             ======================================================== */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto">
            {/* HYPEROS 3 SIGNATURE DEPTH CLOCK */}
            {lockScreenStyle === 'hyperos3' && (
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 240, damping: 25 }}
                className="text-center"
              >
                <div className="text-[96px] sm:text-[140px] font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/95 to-white/70 leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] select-none">
                  {timeStr}
                </div>
                <div className="text-sm sm:text-base text-cyan-200/90 font-medium tracking-wide mt-2 flex items-center justify-center gap-2">
                  <span>{dateStr}</span>
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  <span className="text-xs font-mono text-cyan-300">HyperOS 3 Depth</span>
                </div>
              </motion.div>
            )}

            {/* MIUIx CLASSIC VERTICAL CLOCK */}
            {lockScreenStyle === 'miuix' && (
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 240, damping: 25 }}
                className="text-center"
              >
                <div className="text-7xl sm:text-9xl font-black tracking-tight text-white/95 leading-none">
                  {hoursStr}
                </div>
                <div className="text-7xl sm:text-9xl font-black tracking-tight text-orange-400 leading-none">
                  {minsStr}
                </div>
                <div className="text-xs sm:text-sm text-white/60 font-medium mt-3">
                  {dateStr} · MIUIx Flagship
                </div>
              </motion.div>
            )}

            {/* CLASSIC / WINDOWS HELLO / COSMIC STYLE */}
            {lockScreenStyle !== 'hyperos3' && lockScreenStyle !== 'miuix' && (
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 240, damping: 25 }}
                className="text-center"
              >
                <div className="text-6xl sm:text-8xl font-light text-white/90 tabular-nums">
                  {timeStr}
                </div>
                <div className="text-sm text-white/50 font-light mt-2">{dateStr}</div>
              </motion.div>
            )}

            {/* HYPEROS 3 DYNAMIC MUSIC CARD WIDGET */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-6 w-full max-w-sm rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/15 p-3 flex items-center justify-between shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center text-white shadow">
                  <Icon name="Music" size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white truncate max-w-[150px]">Singularity Lossless</div>
                  <div className="text-[10px] text-white/60">Monochrome Audio · Live</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => playSound('click')}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/80"
                >
                  <Icon name="SkipBack" size={14} />
                </button>
                <button
                  onClick={() => { playSound('click'); setMusicPlaying(!musicPlaying); }}
                  className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow"
                >
                  <Icon name={musicPlaying ? 'Pause' : 'Play'} size={14} />
                </button>
                <button
                  onClick={() => playSound('click')}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/80"
                >
                  <Icon name="SkipForward" size={14} />
                </button>
              </div>
            </motion.div>

            {/* Password input drawer (if password set or toggled) */}
            {showPasswordInput && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 flex flex-col items-center gap-2"
              >
                <div className="text-xs text-white/70 font-medium">{userName ?? 'Liquid User'}</div>
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 bg-white/15 backdrop-blur-xl border border-white/20 rounded-full px-4 py-2 transition ${error ? 'border-rose-400' : ''}`}>
                    <Icon name="Lock" size={14} className="text-white/60" />
                    <input
                      ref={inputRef}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password..."
                      className="bg-transparent text-xs text-white placeholder-white/40 outline-none w-40"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-8 h-8 rounded-full bg-cyan-400 text-black flex items-center justify-center font-bold shadow-md hover:bg-cyan-300 transition"
                  >
                    <Icon name="CornerDownLeft" size={14} />
                  </button>
                </form>
                {error && <span className="text-[11px] text-rose-400 font-medium">Incorrect password.</span>}
              </motion.div>
            )}
          </div>

          {/* ========================================================
              BOTTOM BAR: SWIPE/TAP TO UNLOCK & HYPEROS QUICK ACTIONS
             ======================================================== */}
          <div className="relative z-10 flex flex-col items-center gap-4 max-w-4xl w-full mx-auto">
            {/* Swipe up / Tap to unlock gesture bar */}
            <motion.div
              onClick={handleQuickUnlock}
              whileTap={{ scale: 0.96 }}
              className="flex flex-col items-center gap-1 cursor-pointer group"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              >
                <Icon name="ChevronDown" size={18} className="text-white/70 rotate-180 group-hover:text-cyan-300" />
              </motion.div>
              <div className="h-1 w-28 rounded-full bg-white/60 group-hover:bg-white group-hover:w-36 transition-all" />
              <span className="text-[11px] text-white/60 font-medium tracking-wider uppercase mt-1">
                {expectedPassword ? 'Tap or swipe to enter password' : 'Swipe up or tap to unlock'}
              </span>
            </motion.div>

            {/* Quick corner shortcuts (Flashlight & AI Assistant) */}
            <div className="w-full flex items-center justify-between px-2 pt-2">
              <button
                onClick={toggleFlashlight}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-2xl active:scale-90 ${
                  flashlightOn ? 'bg-amber-400 text-black' : 'bg-black/50 text-white/80 hover:bg-black/70 border border-white/20'
                }`}
                title="Torch"
              >
                <Icon name="Flashlight" size={20} />
              </button>

              <button
                onClick={handleLaunchCameraOrAI}
                className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 text-cyan-300 flex items-center justify-center transition shadow-2xl active:scale-90"
                title="Launch Liquid Copilot AI"
              >
                <Icon name="Bot" size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
