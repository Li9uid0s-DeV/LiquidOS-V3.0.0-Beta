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
    installedApps, launchInstalledApp, shellMode,
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

  const isXP = shellMode === 'xp';
  const isVista = shellMode === 'vista';
  const isWin10 = shellMode === 'windows10';
  const isDeX = shellMode === 'dex';
  const isChromeOS = shellMode === 'chromeos';

  return (
    <>
      <StartMenu open={startOpen} onClose={() => setStartOpen(false)} startPos={startPos} />

      {/* ==============================================================
          1. WINDOWS XP LUNA BLUE TASKBAR
         ============================================================== */}
      {isXP && (
        <div
          className="fixed bottom-0 inset-x-0 h-10 w-screen z-30 flex items-center justify-between select-none shadow-2xl font-sans"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100vw',
            background: 'linear-gradient(to bottom, #245edb 0%, #3f88f8 8%, #1f57ce 50%, #1545ad 100%)',
            borderTop: '2px solid #3876fc',
          }}
        >
          {/* XP Start Button (Curved Green Pill) */}
          <div className="flex items-center h-full">
            <button
              ref={startBtnRef}
              onClick={handleStartClick}
              className="h-full px-4 rounded-r-2xl flex items-center gap-2 shadow-lg transition active:brightness-95 group font-bold italic"
              style={{
                background: 'linear-gradient(to bottom, #388200 0%, #5aa700 20%, #3c8200 80%, #205900 100%)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6), 2px 0 4px rgba(0,0,0,0.4)',
                borderRight: '1px solid #1a4d00',
              }}
              title="Windows XP Start"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                  <path d="M2 4l9-1.5v8.5H2V4z" fill="#f25022" />
                  <path d="M13 2.3l9-1.3v10H13V2.3z" fill="#7fba00" />
                  <path d="M2 13h9v8.5L2 20v-7z" fill="#00a4ef" />
                  <path d="M13 13h9v10l-9-1.3V13z" fill="#ffb900" />
                </svg>
              </div>
              <span className="text-white text-base tracking-wide font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                start
              </span>
            </button>

            {/* XP Quick Launch icons */}
            <div className="flex items-center gap-1 px-2 border-r border-[#1545ad]">
              <button onClick={() => openApp('browser')} className="p-1 hover:brightness-125" title="Internet Explorer">
                <Icon name="Globe" size={16} className="text-white" />
              </button>
              <button onClick={() => openApp('explorer')} className="p-1 hover:brightness-125" title="Windows Explorer">
                <Icon name="FolderOpen" size={16} className="text-amber-300" />
              </button>
              <button onClick={() => openApp('synth')} className="p-1 hover:brightness-125" title="Windows Media Player">
                <Icon name="Music" size={16} className="text-orange-300" />
              </button>
            </div>

            {/* XP Window Buttons on Taskbar */}
            <div className="flex items-center gap-1 px-2 overflow-x-auto max-w-xl">
              {windows.map((win) => {
                const isActive = !win.minimized;
                return (
                  <button
                    key={win.id}
                    onClick={() => {
                      if (win.minimized) restoreWindow(win.id);
                      else focusWindow(win.id);
                    }}
                    className={`h-7 px-2.5 rounded-sm flex items-center gap-1.5 text-xs text-white max-w-[140px] truncate border font-medium ${
                      isActive
                        ? 'bg-[#1545ad] border-[#0e307c] shadow-inner font-bold'
                        : 'bg-[#2f71cd] hover:bg-[#3d83e6] border-[#4b8ff5]'
                    }`}
                    title={win.title}
                  >
                    <Icon name={win.icon} size={13} className="text-amber-200 shrink-0" />
                    <span className="truncate">{win.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* XP Notification Area (Royal Blue Tray) */}
          <div
            className="flex items-center gap-2 h-full px-3 text-white border-l-2 border-[#1545ad]"
            style={{ background: 'linear-gradient(to bottom, #092484 0%, #153fb5 50%, #0d2e96 100%)' }}
          >
            <div className="flex items-center gap-1.5 text-white/90">
              <Icon name="Volume2" size={14} className="hover:text-amber-300 cursor-pointer" onClick={() => setTrayOpen(!trayOpen)} />
              <Icon name="Wifi" size={14} />
            </div>
            <div className="text-xs font-bold text-white tabular-nums tracking-wide font-mono pl-1">
              {timeStr}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          2. WINDOWS VISTA AERO GLASS TASKBAR
         ============================================================== */}
      {isVista && (
        <div
          className="fixed bottom-0 inset-x-0 h-10 w-screen z-30 flex items-center justify-between select-none shadow-2xl font-sans"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100vw',
            background: 'linear-gradient(to bottom, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(56, 189, 248, 0.35)',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.5)',
          }}
        >
          {/* Vista Start Orb (Protruding circular pearl sphere) */}
          <div className="flex items-center h-full pl-2">
            <button
              ref={startBtnRef}
              onClick={handleStartClick}
              className="relative -top-1 w-11 h-11 rounded-full flex items-center justify-center transition active:scale-95 group shadow-xl"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #60a5fa 0%, #2563eb 50%, #1d4ed8 85%, #0f172a 100%)',
                boxShadow: '0 0 10px rgba(56,189,248,0.6), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.6)',
                border: '1.5px solid rgba(255,255,255,0.6)',
              }}
              title="Windows Vista Start Orb"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  <path d="M3 4l8-1.5v8.5H3V4z" fill="#f25022" />
                  <path d="M12 2.3l9-1.3v10H12V2.3z" fill="#7fba00" />
                  <path d="M3 12h8v8.5L3 19v-7z" fill="#00a4ef" />
                  <path d="M12 12h9v10l-9-1.3V12z" fill="#ffb900" />
                </svg>
              </div>
            </button>

            {/* Vista Quick Launch */}
            <div className="flex items-center gap-1 px-3 border-r border-white/10">
              <button onClick={() => openApp('browser')} className="p-1 hover:bg-white/10 rounded" title="Internet Explorer">
                <Icon name="Globe" size={16} className="text-sky-300" />
              </button>
              <button onClick={() => openApp('synth')} className="p-1 hover:bg-white/10 rounded" title="Windows Media Player">
                <Icon name="Music" size={16} className="text-orange-400" />
              </button>
              <button onClick={() => openApp('explorer')} className="p-1 hover:bg-white/10 rounded" title="Windows Explorer">
                <Icon name="FolderOpen" size={16} className="text-amber-300" />
              </button>
            </div>

            {/* Vista Running App Tabs */}
            <div className="flex items-center gap-1.5 px-3 overflow-x-auto max-w-xl">
              {windows.map((win) => {
                const isActive = !win.minimized;
                return (
                  <button
                    key={win.id}
                    onClick={() => {
                      if (win.minimized) restoreWindow(win.id);
                      else focusWindow(win.id);
                    }}
                    className={`h-7 px-3 rounded-md flex items-center gap-2 text-xs text-white max-w-[150px] truncate border transition ${
                      isActive
                        ? 'bg-sky-500/25 border-sky-400/60 shadow-lg shadow-sky-500/20 font-semibold'
                        : 'bg-white/5 hover:bg-white/10 border-white/10'
                    }`}
                    title={win.title}
                  >
                    <Icon name={win.icon} size={14} className="text-sky-300 shrink-0" />
                    <span className="truncate">{win.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vista System Tray */}
          <div className="flex items-center gap-3 h-full px-4 text-white">
            <AIAssistant onLock={onLock} />
            <div className="flex items-center gap-1.5 text-white/80 cursor-pointer" onClick={() => setTrayOpen(!trayOpen)}>
              <Icon name="Wifi" size={14} />
              <Icon name="Volume2" size={14} />
            </div>
            <div className="text-right leading-tight">
              <div className="text-xs font-semibold text-white/95 tabular-nums font-mono">{timeStr}</div>
              <div className="text-[9px] text-white/50">{dateStr}</div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          3. WINDOWS 10 SHARP TASKBAR
         ============================================================== */}
      {isWin10 && (
        <div
          className="fixed bottom-0 inset-x-0 h-10 w-screen z-30 flex items-center justify-between select-none shadow-2xl font-sans bg-zinc-950 border-t border-zinc-800 text-white"
          style={{ position: 'fixed', bottom: 0, left: 0, right: 0, width: '100vw', borderRadius: 0 }}
        >
          <div className="flex items-center h-full">
            {/* Windows 10 Start button (Slanted 4-pane logo) */}
            <button
              ref={startBtnRef}
              onClick={handleStartClick}
              className={`h-10 w-12 flex items-center justify-center hover:bg-white/10 transition ${
                startOpen ? 'bg-white/20' : ''
              }`}
              title="Windows 10 Start"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M0 3.449L9.75 2.1v8.526H0V3.449zm0 17.102l9.75 1.349V12H0v8.551zM11.025 1.925L24 0v10.626H11.025V1.925zm0 18.626L24 24V12H11.025v8.551z" />
              </svg>
            </button>

            {/* Cortana / Type here to search Box */}
            <div
              onClick={handleStartClick}
              className="hidden md:flex items-center gap-2 h-8 bg-zinc-900 border border-zinc-700 px-3 text-xs text-white/50 w-56 cursor-pointer hover:border-zinc-500 transition mr-2"
            >
              <Icon name="Search" size={14} className="text-white/60" />
              <span>Type here to search</span>
            </div>

            {/* Task View Icon */}
            <button onClick={() => openApp('taskmanager')} className="h-10 w-10 flex items-center justify-center hover:bg-white/10 text-white/70" title="Task View">
              <Icon name="Cpu" size={16} />
            </button>

            {/* Windows 10 Taskbar Icons */}
            <div className="flex items-center h-full">
              {TASKBAR_APPS.map((app) => {
                const wins = windows.filter((w) => w.appId === app.appId);
                const active = wins.length > 0;
                const anyVisible = wins.some((w) => !w.minimized);
                return (
                  <button
                    key={app.appId}
                    onClick={() => handleAppClick(app.appId)}
                    className={`relative h-10 w-11 flex items-center justify-center hover:bg-white/10 transition ${
                      anyVisible ? 'bg-white/15' : ''
                    }`}
                    title={app.label}
                  >
                    <Icon name={app.icon} size={16} className="text-white" />
                    {active && (
                      <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 ${anyVisible ? 'opacity-100' : 'opacity-50'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Windows 10 Right System Tray */}
          <div className="flex items-center h-full px-2 gap-1 text-white">
            <AIAssistant onLock={onLock} />
            <div className="flex items-center gap-1.5 px-2 hover:bg-white/10 h-full cursor-pointer" onClick={() => setTrayOpen(!trayOpen)}>
              <Icon name="Wifi" size={13} />
              <Icon name="Volume2" size={13} />
            </div>
            <div className="px-2 hover:bg-white/10 h-full flex flex-col justify-center text-right leading-tight cursor-pointer" onClick={() => openApp('calendar')}>
              <div className="text-[11px] font-mono">{timeStr}</div>
              <div className="text-[9px] text-white/60">{dateStr}</div>
            </div>
            {/* Windows 10 Action Center Icon */}
            <div className="px-2.5 hover:bg-white/10 h-full flex items-center justify-center text-white/70 cursor-pointer" onClick={() => setTrayOpen(!trayOpen)}>
              <Icon name="Bell" size={14} />
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          4. SAMSUNG DEX BOTTOM TASKBAR
         ============================================================== */}
      {isDeX && (
        <div
          className="fixed bottom-0 inset-x-0 h-11 w-screen z-30 flex items-center justify-between px-3 select-none shadow-2xl font-sans bg-black/85 backdrop-blur-2xl border-t border-white/10 text-white"
          style={{ position: 'fixed', bottom: 0, left: 0, right: 0, width: '100vw', borderRadius: 0 }}
        >
          {/* DeX Left Apps & Recents */}
          <div className="flex items-center gap-1.5">
            <button
              ref={startBtnRef}
              onClick={handleStartClick}
              className={`h-9 px-3 rounded-xl flex items-center gap-1.5 font-bold text-xs transition ${
                startOpen ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Samsung DeX Apps"
            >
              <div className="w-3.5 h-3.5 rounded bg-cyan-400" />
              <span>Apps</span>
            </button>

            <button onClick={() => openApp('taskmanager')} className="h-9 w-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/70" title="Recent Apps">
              <Icon name="Layers" size={16} />
            </button>

            <button onClick={() => openApp('browser')} className="h-9 w-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/70" title="Search DeX">
              <Icon name="Search" size={16} />
            </button>

            <div className="h-4 w-px bg-white/20 mx-1" />

            {/* DeX Running Apps */}
            <div className="flex items-center gap-1">
              {TASKBAR_APPS.slice(0, 8).map((app) => {
                const wins = windows.filter((w) => w.appId === app.appId);
                const active = wins.length > 0;
                return (
                  <button
                    key={app.appId}
                    onClick={() => handleAppClick(app.appId)}
                    className={`relative h-9 w-9 rounded-xl flex items-center justify-center transition ${
                      active ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                    title={app.label}
                  >
                    <Icon name={app.icon} size={17} className="text-white" />
                    {active && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DeX Right System Pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTrayOpen(!trayOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-mono"
            >
              <div className="flex items-center gap-1.5 text-white/80">
                <Icon name="Wifi" size={13} />
                <Icon name="Volume2" size={13} />
                <span className="text-[10px] text-cyan-400 font-bold">100%</span>
              </div>
              <span className="text-white font-medium">{timeStr}</span>
            </button>
          </div>
        </div>
      )}

      {/* ==============================================================
          5. CHROMEOS BOTTOM SHELF
         ============================================================== */}
      {isChromeOS && (
        <div
          className="fixed bottom-0 inset-x-0 h-12 w-screen z-30 flex items-center justify-between px-3 select-none font-sans bg-zinc-950/80 backdrop-blur-2xl border-t border-white/10 text-white"
          style={{ position: 'fixed', bottom: 0, left: 0, right: 0, width: '100vw', borderRadius: 0 }}
        >
          {/* ChromeOS Launcher (Circular Everything Button) */}
          <div className="flex items-center">
            <button
              ref={startBtnRef}
              onClick={handleStartClick}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                startOpen ? 'bg-white text-black' : 'hover:bg-white/15 text-white'
              }`}
              title="Launcher (Everything Button)"
            >
              <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>
            </button>
          </div>

          {/* Centered Shelf Apps */}
          <div className="flex items-center gap-2">
            {TASKBAR_APPS.map((app) => {
              const wins = windows.filter((w) => w.appId === app.appId);
              const active = wins.length > 0;
              return (
                <button
                  key={app.appId}
                  onClick={() => handleAppClick(app.appId)}
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center transition ${
                    active ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                  title={app.label}
                >
                  <Icon name={app.icon} size={18} className="text-white" />
                  {active && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-cyan-400" />}
                </button>
              );
            })}
          </div>

          {/* ChromeOS Quick Settings Pill */}
          <div className="flex items-center">
            <button
              onClick={() => setTrayOpen(!trayOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs transition"
            >
              <span className="font-semibold text-white/90">{timeStr}</span>
              <Icon name="Wifi" size={13} className="text-white/80" />
              <Icon name="Battery" size={13} className="text-white/80" />
            </button>
          </div>
        </div>
      )}

      {/* ==============================================================
          6. WINDOWS 11 / STANDARD MODERN FLUENT TASKBAR
         ============================================================== */}
      {!isXP && !isVista && !isWin10 && !isDeX && !isChromeOS && (
        <div
          className="fixed bottom-0 inset-x-0 h-10 w-screen z-30 liquid-glass-taskbar flex items-center justify-between px-3 select-none"
          style={{ position: 'fixed', bottom: 0, left: 0, right: 0, width: '100vw', borderRadius: 0 }}
        >
          {/* Left: Weather & Status Widget */}
          <div className="flex items-center gap-2 min-w-0 w-32 sm:w-40">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-white/75 hover:bg-white/10 hover:text-white transition cursor-pointer text-xs">
              <Icon name="Sun" size={13} className="text-amber-400 shrink-0" />
              <span className="font-medium text-[11px]">21°C</span>
              <span className="text-[10px] text-white/40 hidden sm:inline">Singularity</span>
            </div>
          </div>

          {/* Center: Windows 11 Fluent Center Launcher & App Icons */}
          <div className={`flex items-center gap-1 ${taskbarAlign === 'left' ? 'justify-start' : 'justify-center'} flex-1 max-w-2xl px-1`}>
            {/* Start Button with Official LiquidOS Fluid Logo */}
            <button
              ref={startBtnRef}
              onClick={handleStartClick}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition shrink-0 ${
                startOpen
                  ? 'bg-white/20 shadow-inner scale-95'
                  : 'hover:bg-white/10 active:scale-95'
              }`}
              title="LiquidOS Start"
            >
              <AppLogo size={18} glow={startOpen} />
            </button>

            <div className="h-4 w-px bg-white/10 mx-0.5 shrink-0" />

            {/* Built-in apps */}
            {TASKBAR_APPS.map((app) => {
              const wins = windows.filter((w) => w.appId === app.appId);
              const active = wins.length > 0;
              const anyVisible = wins.some((w) => !w.minimized);
              return (
                <button
                  key={app.appId}
                  onClick={() => handleAppClick(app.appId)}
                  className={`relative h-8 w-8 rounded-lg flex items-center justify-center transition shrink-0 ${
                    anyVisible ? 'bg-white/15' : 'hover:bg-white/10 active:scale-95'
                  }`}
                  title={app.label}
                >
                  <Icon name={app.icon} size={16} className="text-white/90" />
                  {active && (
                    <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-cyan-400 transition-all ${anyVisible ? 'w-3' : 'w-1 opacity-60'}`} />
                  )}
                </button>
              );
            })}

            {/* Installed custom apps */}
            {installedApps.length > 0 && (
              <div className="h-4 w-px bg-white/10 mx-0.5 shrink-0" />
            )}
            {installedApps.map((app) => {
              const wins = windows.filter((w) => w.appId === app.appId);
              const active = wins.length > 0;
              const anyVisible = wins.some((w) => !w.minimized);
              return (
                <button
                  key={app.appId}
                  onClick={() => handleInstalledAppClick(app.appId)}
                  className={`relative h-8 w-8 rounded-lg flex items-center justify-center transition shrink-0 ${
                    anyVisible ? 'bg-white/15' : 'hover:bg-white/10 active:scale-95'
                  }`}
                  title={app.name}
                >
                  <Icon name={app.icon} size={16} className="text-white/90" />
                  {active && (
                    <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-cyan-400 transition-all ${anyVisible ? 'w-3' : 'w-1 opacity-60'}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: System Tray */}
          <div className="flex items-center gap-1 min-w-0 w-32 sm:w-40 justify-end">
            <AIAssistant onLock={onLock} />
            <div className="h-4 w-px bg-white/10 mx-0.5 shrink-0" />
            <button
              onClick={() => setTrayOpen((v) => !v)}
              className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg hover:bg-white/10 transition"
              title="Quick settings"
            >
              <div className="flex items-center gap-1 text-white/70">
                <Icon name="Wifi" size={12} />
                <Icon name="Battery" size={12} />
              </div>
              <div className="text-right leading-tight hidden lg:block">
                <div className="text-[11px] text-white/90 tabular-nums font-mono">{timeStr}</div>
                <div className="text-[9px] text-white/40">{dateStr}</div>
              </div>
            </button>
          </div>
        </div>
      )}

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
              className="glass fixed bottom-14 right-3 z-50 w-72 rounded-2xl p-4 shadow-2xl border border-white/20"
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
