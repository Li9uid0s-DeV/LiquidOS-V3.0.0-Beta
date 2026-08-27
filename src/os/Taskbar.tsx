import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOS } from './OSContext';
import { TASKBAR_APPS, AppId } from './types';
import { Icon } from './Icon';
import { StartMenu } from './StartMenu';
import { AIAssistant } from './AIAssistant';
import { AppLogo } from './AppLogo';

interface TaskbarProps {
  onLock?: () => void;
}

export function Taskbar({ onLock }: TaskbarProps) {
  const {
    windows, openApp, focusWindow, minimizeWindow, restoreWindow,
    quickSettings, toggleQuick, taskbarAlign, startOpen, setStartOpen,
    installedApps, launchInstalledApp, setShellMode,
  } = useOS();
  const [trayOpen, setTrayOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const startBtnRef = useRef<HTMLButtonElement>(null);
  const [startPos, setStartPos] = useState<{ x: number; width: number } | null>(null);

  const updateStartPos = useCallback(() => {
    if (startBtnRef.current) {
      const rect = startBtnRef.current.getBoundingClientRect();
      setStartPos({ x: rect.left, width: rect.width });
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    window.addEventListener('resize', updateStartPos);
    updateStartPos();
    return () => {
      clearInterval(t);
      window.removeEventListener('resize', updateStartPos);
    };
  }, [updateStartPos, taskbarAlign]);

  const handleStartClick = () => {
    updateStartPos();
    setStartOpen(!startOpen);
  };

  const handleAppClick = (appId: AppId) => {
    const wins = windows.filter((w) => w.appId === appId);
    if (wins.length === 0) {
      openApp(appId);
    } else {
      const top = wins.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
      if (top.minimized) restoreWindow(top.id);
      else {
        const isTopmost = windows.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).id === top.id;
        if (isTopmost) minimizeWindow(top.id);
        else focusWindow(top.id);
      }
    }
  };

  const handleInstalledAppClick = (appId: string) => {
    const wins = windows.filter((w) => w.appId === appId);
    if (wins.length === 0) {
      launchInstalledApp(appId);
    } else {
      const top = wins.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
      if (top.minimized) restoreWindow(top.id);
      else {
        const isTopmost = windows.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).id === top.id;
        if (isTopmost) minimizeWindow(top.id);
        else focusWindow(top.id);
      }
    }
  };

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      <StartMenu open={startOpen} onClose={() => setStartOpen(false)} startPos={startPos} />

      {/* Locked Full-Width Bottom Taskbar */}
      <div
        className="fixed bottom-0 inset-x-0 h-12 w-screen z-30 liquid-glass-taskbar flex items-center justify-between px-3 select-none"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, width: '100vw', borderRadius: 0 }}
      >
        {/* Left: Weather & Widgets / Spacing / Tablet Mode Switch */}
        <div className="flex items-center gap-2 min-w-0 w-36 sm:w-44">
          <div
            onClick={() => setShellMode('metro')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer text-xs group"
            title="Switch to Windows 8 Metro Live Tiles"
          >
            <Icon name="LayoutGrid" size={14} className="text-cyan-400 group-hover:scale-110 transition" />
            <span className="font-medium text-[11px] hidden sm:inline">Tiles</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer text-xs">
            <Icon name="Sun" size={13} className="text-amber-400 shrink-0" />
            <span className="font-medium text-[11px]">21°C</span>
          </div>
        </div>

        {/* Center: Windows 11 Fluent Center Launcher & App Icons */}
        <div className={`flex items-center gap-1.5 ${taskbarAlign === 'left' ? 'justify-start' : 'justify-center'} flex-1 max-w-2xl px-2`}>
          {/* Start Button with Official LiquidOS Fluid Logo */}
          <button
            ref={startBtnRef}
            onClick={handleStartClick}
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition shrink-0 ${
              startOpen
                ? 'bg-white/20 shadow-inner scale-95'
                : 'hover:bg-white/10 active:scale-95'
            }`}
            title="LiquidOS Start"
          >
            <AppLogo size={22} glow={startOpen} />
          </button>

          <div className="h-5 w-px bg-white/10 mx-0.5 shrink-0" />

          {/* Built-in apps */}
          {TASKBAR_APPS.map((app) => {
            const wins = windows.filter((w) => w.appId === app.appId);
            const active = wins.length > 0;
            const anyVisible = wins.some((w) => !w.minimized);
            return (
              <button
                key={app.appId}
                onClick={() => handleAppClick(app.appId)}
                className={`relative h-9 w-9 rounded-xl flex items-center justify-center transition shrink-0 ${
                  anyVisible ? 'bg-white/15' : 'hover:bg-white/10 active:scale-95'
                }`}
                title={app.label}
              >
                <Icon name={app.icon} size={18} className="text-white/90" />
                {active && (
                  <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-cyan-400 transition-all ${anyVisible ? 'w-3.5' : 'w-1.5 opacity-60'}`} />
                )}
              </button>
            );
          })}

          {/* Installed custom apps */}
          {installedApps.length > 0 && (
            <div className="h-5 w-px bg-white/10 mx-0.5 shrink-0" />
          )}
          {installedApps.map((app) => {
            const wins = windows.filter((w) => w.appId === app.appId);
            const active = wins.length > 0;
            const anyVisible = wins.some((w) => !w.minimized);
            return (
              <button
                key={app.appId}
                onClick={() => handleInstalledAppClick(app.appId)}
                className={`relative h-9 w-9 rounded-xl flex items-center justify-center transition shrink-0 ${
                  anyVisible ? 'bg-white/15' : 'hover:bg-white/10 active:scale-95'
                }`}
                title={app.name}
              >
                <Icon name={app.icon} size={18} className="text-white/90" />
                {active && (
                  <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-cyan-400 transition-all ${anyVisible ? 'w-3.5' : 'w-1.5 opacity-60'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: System Tray */}
        <div className="flex items-center gap-1 min-w-0 w-36 sm:w-44 justify-end">
          <AIAssistant onLock={onLock} />
          <div className="h-5 w-px bg-white/10 mx-0.5 shrink-0" />
          <button
            onClick={() => setTrayOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/10 transition"
            title="Quick settings"
          >
            <div className="flex items-center gap-1 text-white/70">
              <Icon name="Wifi" size={13} />
              <Icon name={quickSettings.sound ? 'Volume2' : 'VolumeX'} size={13} />
              <Icon name="Battery" size={13} />
            </div>
            <div className="text-right leading-tight hidden lg:block">
              <div className="text-[11px] text-white/90 tabular-nums font-mono">{timeStr}</div>
              <div className="text-[9px] text-white/40">{dateStr}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Quick settings panel */}
      <AnimatePresence>
        {trayOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setTrayOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="glass fixed bottom-14 right-3 z-50 w-72 rounded-2xl p-4"
            >
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { key: 'wifi' as const, label: 'Wi-Fi', icon: 'Wifi' },
                  { key: 'bluetooth' as const, label: 'Bluetooth', icon: 'Bluetooth' },
                  { key: 'darkMode' as const, label: 'Dark Mode', icon: 'Moon' },
                ].map((q) => (
                  <button
                    key={q.key}
                    onClick={() => toggleQuick(q.key)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition ${
                      quickSettings[q.key] ? 'bg-cyan-500/30 border border-cyan-400/40 text-cyan-300' : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <Icon name={q.icon} size={16} />
                    <span className="text-[10px]">{q.label}</span>
                  </button>
                ))}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 text-xs text-white/70 mb-2">
                  <Icon name="Sun" size={14} className="text-amber-400" /> Brightness
                </div>
                <input type="range" defaultValue={80} className="w-full accent-cyan-400" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-2">
                <div className="flex items-center gap-2 text-xs text-white/70 mb-2">
                  <Icon name="Volume2" size={14} className="text-cyan-400" /> Volume
                </div>
                <input type="range" defaultValue={65} className="w-full accent-cyan-400" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
