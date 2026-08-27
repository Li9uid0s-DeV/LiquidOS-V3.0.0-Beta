import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOS } from './OSContext';
import { TASKBAR_APPS, AppId } from './types';
import { Icon } from './Icon';
import { StartMenu } from './StartMenu';
import { AIAssistant } from './AIAssistant';

interface TaskbarProps {
  onLock?: () => void;
}

export function Taskbar({ onLock }: TaskbarProps) {
  const {
    windows, openApp, focusWindow, minimizeWindow, restoreWindow,
    quickSettings, toggleQuick, taskbarAlign, startOpen, setStartOpen,
    installedApps, launchInstalledApp,
  } = useOS();
  const [trayOpen, setTrayOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const startBtnRef = useRef<HTMLButtonElement>(null);
  const [startPos, setStartPos] = useState<{ x: number; width: number } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleStartClick = () => {
    if (startBtnRef.current) {
      const rect = startBtnRef.current.getBoundingClientRect();
      setStartPos({ x: rect.left, width: rect.width });
    }
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
  const dockJustify = taskbarAlign === 'center' ? 'justify-center' : 'justify-start';

  return (
    <>
      <StartMenu open={startOpen} onClose={() => setStartOpen(false)} startPos={startPos} />

      <div className="fixed bottom-0 left-0 right-0 h-14 z-30 flex items-center px-2">
        <div className={`flex-1 flex items-center gap-2 ${dockJustify}`}>
          <div className="liquid-glass-taskbar rounded-2xl flex items-center gap-1 px-2 py-1.5 max-w-full overflow-hidden">
            {/* Start button */}
            <button
              ref={startBtnRef}
              onClick={handleStartClick}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition shrink-0 ${
                startOpen ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              title="Start"
            >
              <div className="grid grid-cols-2 gap-0.5">
                <div className="h-2 w-2 rounded-[2px] bg-brand-400" />
                <div className="h-2 w-2 rounded-[2px] bg-accent-400" />
                <div className="h-2 w-2 rounded-[2px] bg-sky-400" />
                <div className="h-2 w-2 rounded-[2px] bg-emerald-400" />
              </div>
            </button>

            <div className="h-6 w-px bg-white/15 mx-1 shrink-0" />

            {/* Built-in apps */}
            {TASKBAR_APPS.map((app) => {
              const wins = windows.filter((w) => w.appId === app.appId);
              const active = wins.length > 0;
              const anyVisible = wins.some((w) => !w.minimized);
              return (
                <button
                  key={app.appId}
                  onClick={() => handleAppClick(app.appId)}
                  className={`relative h-10 w-10 rounded-xl flex items-center justify-center transition shrink-0 ${
                    anyVisible ? 'bg-white/15' : 'hover:bg-white/10'
                  }`}
                  title={app.label}
                >
                  <Icon name={app.icon} size={20} className="text-white/85" />
                  {active && (
                    <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 rounded-full bg-brand-300 transition-all ${anyVisible ? 'w-4' : 'w-1.5 opacity-60'}`} />
                  )}
                </button>
              );
            })}

            {/* Installed custom apps */}
            {installedApps.length > 0 && (
              <div className="h-6 w-px bg-white/15 mx-0.5 shrink-0" />
            )}
            {installedApps.map((app) => {
              const wins = windows.filter((w) => w.appId === app.appId);
              const active = wins.length > 0;
              const anyVisible = wins.some((w) => !w.minimized);
              return (
                <button
                  key={app.appId}
                  onClick={() => handleInstalledAppClick(app.appId)}
                  className={`relative h-10 w-10 rounded-xl flex items-center justify-center transition shrink-0 ${
                    anyVisible ? 'bg-white/15' : 'hover:bg-white/10'
                  }`}
                  title={app.name}
                >
                  <Icon name={app.icon} size={20} className="text-white/85" />
                  {active && (
                    <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 rounded-full bg-brand-300 transition-all ${anyVisible ? 'w-4' : 'w-1.5 opacity-60'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: system tray */}
        <div className="flex items-center">
          <div className="liquid-glass-taskbar rounded-2xl flex items-center gap-1 px-2 py-1.5">
            {/* AI Assistant */}
            <AIAssistant onLock={onLock} />
            <div className="h-6 w-px bg-white/15 mx-0.5 shrink-0" />
            <button
              onClick={() => setTrayOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition"
              title="Quick settings"
            >
              <Icon name="Wifi" size={15} className={`text-white/80 ${quickSettings.wifi ? '' : 'opacity-30'}`} />
              <Icon name="Bluetooth" size={15} className={`text-white/80 ${quickSettings.bluetooth ? '' : 'opacity-30'}`} />
              <Icon name={quickSettings.darkMode ? 'Moon' : 'Sun'} size={15} className="text-white/80" />
              <Icon name="Volume2" size={15} className="text-white/80" />
              <Icon name="Battery" size={15} className="text-white/80" />
            </button>
            <button
              onClick={() => setTrayOpen((v) => !v)}
              className="flex flex-col items-end px-2 py-0.5 rounded-lg hover:bg-white/10 transition leading-tight"
            >
              <span className="text-[11px] text-white/90 tabular-nums">{timeStr}</span>
              <span className="text-[10px] text-white/60">{dateStr}</span>
            </button>
          </div>
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
              className="glass liquid-glass-taskbar fixed bottom-16 right-3 z-50 w-72 rounded-2xl p-4"
            >
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { key: 'wifi' as const, label: 'Wi-Fi', icon: 'Wifi' },
                  { key: 'bluetooth' as const, label: 'Bluetooth', icon: 'Bluetooth' },
                  { key: 'darkMode' as const, label: 'Dark Mode', icon: 'Moon' },
                ].map((q) => (
                  <button
                    key={q.key}
                    onClick={() => toggleQuick(q.key)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition ${
                      quickSettings[q.key] ? 'bg-brand-500 text-white liquid-glow' : 'glass-panel text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <Icon name={q.icon} size={18} />
                    <span className="text-[11px]">{q.label}</span>
                  </button>
                ))}
              </div>
              <div className="glass-panel rounded-xl p-3">
                <div className="flex items-center gap-2 text-xs text-white/70 mb-2">
                  <Icon name="Sun" size={14} /> Brightness
                </div>
                <input type="range" defaultValue={80} className="w-full accent-brand-400" />
              </div>
              <div className="glass-panel rounded-xl p-3 mt-2">
                <div className="flex items-center gap-2 text-xs text-white/70 mb-2">
                  <Icon name="Volume2" size={14} /> Volume
                </div>
                <input type="range" defaultValue={65} className="w-full accent-brand-400" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
