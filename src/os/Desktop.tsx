import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOS } from './OSContext';
import { WindowFrame } from './WindowFrame';
import { Taskbar } from './Taskbar';
import { NotificationCenter } from './NotificationCenter';
import { WALLPAPERS, WallpaperOrbs } from './wallpapers';
import { LiquidShader } from './LiquidShader';
import { SpaceWallpaper } from './SpaceWallpaper';
import { LockScreen } from './LockScreen';
import { TerminalApp } from './apps/Terminal';
import { NotepadApp } from './apps/Notepad';
import { FileExplorerApp } from './apps/FileExplorer';
import { BrowserApp } from './apps/Browser';
import { SettingsApp } from './apps/Settings';
import { GameApp } from './apps/Game';
import { AppStoreApp } from './apps/AppStore';
import { SystemMonitorApp } from './apps/SystemMonitor';
import { CalendarApp } from './apps/CalendarApp';
import { SynthVisualizerApp } from './apps/SynthVisualizer';
import { Calculator } from './apps/Calculator';
import { TaskManager } from './apps/TaskManager';
import { Icon } from './Icon';
import { AppId, TASKBAR_APPS } from './types';
import { AppLogo } from './AppLogo';

function renderApp(appId: string, payload?: unknown) {
  switch (appId) {
    case 'terminal':
      return <TerminalApp />;
    case 'notepad':
      return <NotepadApp payload={payload as { fileName?: string; content?: string }} />;
    case 'explorer':
      return <FileExplorerApp payload={payload as { folderPath?: string[] }} />;
    case 'browser':
      return <BrowserApp payload={payload as { url?: string; isImage?: boolean }} />;
    case 'settings':
      return <SettingsApp />;
    case 'game':
      return <GameApp />;
    case 'appstore':
      return <AppStoreApp />;
    case 'calculator':
      return <Calculator />;
    case 'taskmanager':
      return <TaskManager />;
    case 'sysmon':
      return <SystemMonitorApp />;
    case 'calendar':
      return <CalendarApp />;
    case 'synth':
      return <SynthVisualizerApp />;
    default:
      return <CustomAppView payload={payload as { url?: string; isCustomApp?: boolean }} />;
  }
}

function CustomAppView({ payload }: { payload?: { url?: string; isCustomApp?: boolean } }) {
  if (!payload?.url) {
    return <div className="flex h-full w-full items-center justify-center text-white/40 text-sm">Unable to load app.</div>;
  }
  return (
    <div className="h-full w-full min-w-0 min-h-0 bg-white">
      <iframe
        src={payload.url}
        className="h-full w-full border-0"
        title="custom app"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  );
}

export function Desktop() {
  const {
    windows,
    wallpaper,
    customWallpapers,
    selectedCustomId,
    liteMode,
    transparency,
    locked,
    lockSystem,
    unlockSystem,
    user,
    showWelcome,
    setWelcome,
    shellMode,
    setShellMode,
    designEngine,
    nebulaPreset,
    openApp,
    focusWindow,
    minimizeWindow,
    restoreWindow,
    installedApps,
    launchInstalledApp,
    calendarTasks,
    dynamicIslandEvent,
    androidQuickSettings,
    toggleAndroidQuick,
  } = useOS();

  const [time, setTime] = useState(new Date());
  const [notifCenterOpen, setNotifCenterOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const customWallpaper = customWallpapers.find((c) => c.id === selectedCustomId);
  const useShader = wallpaper === 'shader' && !liteMode;
  const useSpace = wallpaper === 'space' && !liteMode;
  const shaderOpacity = transparency / 100;

  const handleAppClick = (appId: string) => {
    if (appId === 'recycle') {
      openApp('explorer', { payload: { folderPath: ['Recycle Bin'] } });
      return;
    }
    const wins = windows.filter((w) => w.appId === appId);
    if (wins.length === 0) {
      openApp(appId as AppId);
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

  const DESKTOP_APPS_LIST = [
    { id: 'recycle', label: 'Recycle Bin', icon: 'Trash2' },
    { id: 'settings', label: 'Settings & OS', icon: 'Sparkles' },
    { id: 'game', label: 'Cosmic Velocity', icon: 'Flame' },
    { id: 'calculator', label: 'Calculator Pro', icon: 'Calculator' },
    { id: 'taskmanager', label: 'Task Manager', icon: 'Cpu' },
    { id: 'sysmon', label: 'System Monitor', icon: 'Activity' },
    { id: 'explorer', label: 'File Explorer', icon: 'FolderOpen' },
    { id: 'browser', label: 'Liquid Browser', icon: 'Globe' },
    { id: 'terminal', label: 'Terminal', icon: 'SquareTerminal' },
    { id: 'appstore', label: 'App Store', icon: 'Store' },
    { id: 'synth', label: 'Monochrome Music', icon: 'Music' },
  ];

  return (
    <div className={`relative h-full w-full overflow-hidden select-none engine-${designEngine} ${liteMode ? 'lite-mode' : ''}`}>
      {/* Base wallpaper gradient */}
      <div
        className="absolute inset-0 animated-gradient"
        style={{ background: WALLPAPERS[wallpaper].style }}
      />

      {/* Custom wallpaper image overlay */}
      {customWallpaper && (
        <div
          className="absolute inset-0 z-0"
          style={{ backgroundImage: `url(${customWallpaper.dataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}

      {/* 3D Black Hole Raymarching Space live wallpaper */}
      {useSpace && <SpaceWallpaper lite={false} preset={nebulaPreset} />}

      {/* WebGL liquid shader overlay */}
      {useShader && <LiquidShader lite={false} opacity={shaderOpacity} />}

      {/* Floating orbs */}
      {!liteMode && !useShader && !useSpace && !customWallpaper && <WallpaperOrbs />}

      {/* ========================================================
          1. MAC DESKTOP SHELL: Top Menu Bar + Magnified Bottom Dock
         ======================================================== */}
      {shellMode === 'mac' && (
        <>
          {/* Mac Top Global Bar */}
          <div className="fixed top-0 inset-x-0 h-7 bg-black/40 backdrop-blur-xl border-b border-white/10 z-40 px-4 flex items-center justify-between text-xs text-white/90">
            <div className="flex items-center gap-4">
              <Icon name="Apple" size={14} className="text-white cursor-pointer hover:opacity-80" onClick={() => openApp('settings')} />
              <span className="font-bold tracking-tight">LiquidOS</span>
              <span className="text-white/60 hover:text-white cursor-pointer" onClick={() => openApp('explorer')}>Finder</span>
              <span className="text-white/60 hover:text-white cursor-pointer" onClick={() => openApp('settings')}>Preferences</span>
              <span className="text-white/60 hover:text-white cursor-pointer" onClick={() => setShellMode('windows')}>View</span>
              <span className="text-white/60 hover:text-white cursor-pointer" onClick={() => openApp('terminal')}>Terminal</span>
            </div>

            <div className="flex items-center gap-3 font-medium text-[11px]">
              <span className="text-white/60">v4.0.0</span>
              <Icon name="Wifi" size={13} />
              <Icon name="Battery" size={13} />
              <button
                onClick={() => setNotifCenterOpen(!notifCenterOpen)}
                className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 hover:bg-white/10"
              >
                <Icon name="Bell" size={12} />
                <span className="tabular-nums font-mono">{timeStr}</span>
              </button>
            </div>
          </div>

          {/* Mac Magnified Bottom Dock */}
          <div className="fixed bottom-3 inset-x-0 flex justify-center z-40 pointer-events-none">
            <div className="liquid-glass-card p-2 rounded-2xl flex items-center gap-2 pointer-events-auto shadow-2xl">
              {TASKBAR_APPS.map((app) => {
                const wins = windows.filter((w) => w.appId === app.appId);
                const active = wins.length > 0;
                return (
                  <button
                    key={app.appId}
                    onClick={() => handleAppClick(app.appId)}
                    className="mac-dock-item relative h-11 w-11 rounded-xl glass-panel flex items-center justify-center text-white hover:border-orange-400"
                    title={app.label}
                  >
                    <Icon name={app.icon} size={22} className="text-white" />
                    {active && <span className="app-active-pip" />}
                  </button>
                );
              })}

              <button
                onClick={() => handleAppClick('calculator')}
                className="mac-dock-item relative h-11 w-11 rounded-xl glass-panel flex items-center justify-center text-white"
                title="Calculator Pro"
              >
                <Icon name="Calculator" size={22} className="text-amber-400" />
              </button>

              <button
                onClick={() => handleAppClick('taskmanager')}
                className="mac-dock-item relative h-11 w-11 rounded-xl glass-panel flex items-center justify-center text-white"
                title="Task Manager"
              >
                <Icon name="Cpu" size={22} className="text-sky-400" />
              </button>

              {installedApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => launchInstalledApp(app.id)}
                  className="mac-dock-item relative h-11 w-11 rounded-xl glass-panel flex items-center justify-center text-white hover:border-orange-400"
                  title={app.name}
                >
                  <Icon name={app.icon} size={22} className="text-white" />
                  <span className="app-active-pip" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ========================================================
          2. UBUNTU LINUX SHELL: Left Vertical Launcher + Top Activity Bar
         ======================================================== */}
      {shellMode === 'ubuntu' && (
        <>
          {/* Top Activity Bar */}
          <div className="fixed top-0 inset-x-0 h-7 bg-slate-950/80 backdrop-blur-md border-b border-white/10 z-40 px-3 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-orange-400 cursor-pointer" onClick={() => openApp('terminal')}>Activities</span>
              <span className="text-white/60">LiquidOS Ubuntu 24.04 LTS</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px]">{dateStr} {timeStr}</span>
              <button onClick={() => setNotifCenterOpen(!notifCenterOpen)} className="p-1 hover:bg-white/10 rounded">
                <Icon name="Bell" size={13} />
              </button>
              <button onClick={lockSystem} className="p-1 hover:bg-white/10 rounded" title="Power / Lock">
                <Icon name="Power" size={13} className="text-rose-400" />
              </button>
            </div>
          </div>

          {/* Left Vertical Launcher */}
          <div className="fixed left-0 top-7 bottom-0 w-16 bg-black/60 backdrop-blur-2xl border-r border-white/10 z-40 flex flex-col items-center py-3 justify-between">
            <div className="flex flex-col items-center gap-2 w-full">
              <button
                onClick={() => openApp('settings')}
                className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/40 mb-2"
                title="Ubuntu Grid"
              >
                <Icon name="SlidersHorizontal" size={20} />
              </button>

              {TASKBAR_APPS.map((app) => {
                const wins = windows.filter((w) => w.appId === app.appId);
                const active = wins.length > 0;
                return (
                  <button
                    key={app.appId}
                    onClick={() => handleAppClick(app.appId)}
                    className={`relative h-11 w-11 rounded-xl flex items-center justify-center transition ${
                      active ? 'bg-white/20 border-l-2 border-orange-400' : 'hover:bg-white/10'
                    }`}
                    title={app.label}
                  >
                    <Icon name={app.icon} size={20} className="text-white" />
                  </button>
                );
              })}

              <button
                onClick={() => handleAppClick('calculator')}
                className="relative h-11 w-11 rounded-xl flex items-center justify-center hover:bg-white/10 text-amber-400"
                title="Calculator"
              >
                <Icon name="Calculator" size={20} />
              </button>

              <button
                onClick={() => handleAppClick('taskmanager')}
                className="relative h-11 w-11 rounded-xl flex items-center justify-center hover:bg-white/10 text-sky-400"
                title="Task Manager"
              >
                <Icon name="Cpu" size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button onClick={() => setShellMode('windows')} className="p-2 text-white/60 hover:text-white" title="Switch to Windows 11">
                <Icon name="LayoutGrid" size={16} />
              </button>
              <button onClick={lockSystem} className="p-2 text-white/60 hover:text-white" title="Lock">
                <Icon name="Lock" size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========================================================
          3. ANDROID SHELL: Top Status Bar + Material You App Grid + Bottom Nav Pill
         ======================================================== */}
      {shellMode === 'android' && (
        <div className="fixed inset-0 z-30 flex flex-col justify-between bg-black/40 backdrop-blur-md select-none p-4">
          {/* Android Status Bar */}
          <div className="flex items-center justify-between text-xs text-white px-2">
            <span className="font-semibold">{timeStr}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-sky-400">5G</span>
              <Icon name="Wifi" size={14} />
              <Icon name="BatteryCharging" size={14} className="text-emerald-400" />
            </div>
          </div>

          {/* Android Google Search Pill */}
          <div
            onClick={() => openApp('browser')}
            className="mx-auto mt-3 flex w-full max-w-md cursor-pointer items-center justify-between rounded-full bg-white/10 px-4 py-2.5 backdrop-blur-xl ring-1 ring-white/15 hover:bg-white/15"
          >
            <div className="flex items-center gap-2 text-white/70 text-xs">
              <Icon name="Search" size={15} className="text-sky-400" />
              <span>Search LiquidOS or type URL...</span>
            </div>
            <Icon name="Mic" size={15} className="text-white/60" />
          </div>

          {/* Android Quick Settings Pill Row */}
          <div className="mx-auto mt-2 flex w-full max-w-md items-center justify-between gap-1.5 px-1">
            <button
              onClick={() => toggleAndroidQuick('wifi')}
              className={`flex-1 py-1.5 rounded-xl text-[10px] font-medium flex items-center justify-center gap-1 transition ${
                androidQuickSettings.wifi ? 'bg-sky-500/30 text-sky-300 ring-1 ring-sky-400/40' : 'bg-white/5 text-white/50'
              }`}
            >
              <Icon name="Wifi" size={12} />
              <span>Wi-Fi</span>
            </button>
            <button
              onClick={() => toggleAndroidQuick('bluetooth')}
              className={`flex-1 py-1.5 rounded-xl text-[10px] font-medium flex items-center justify-center gap-1 transition ${
                androidQuickSettings.bluetooth ? 'bg-sky-500/30 text-sky-300 ring-1 ring-sky-400/40' : 'bg-white/5 text-white/50'
              }`}
            >
              <Icon name="Bluetooth" size={12} />
              <span>BT</span>
            </button>
            <button
              onClick={() => toggleAndroidQuick('flashlight')}
              className={`flex-1 py-1.5 rounded-xl text-[10px] font-medium flex items-center justify-center gap-1 transition ${
                androidQuickSettings.flashlight ? 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-400/40' : 'bg-white/5 text-white/50'
              }`}
            >
              <Icon name="Flashlight" size={12} />
              <span>Torch</span>
            </button>
            <button
              onClick={() => toggleAndroidQuick('dnd')}
              className={`flex-1 py-1.5 rounded-xl text-[10px] font-medium flex items-center justify-center gap-1 transition ${
                androidQuickSettings.dnd ? 'bg-rose-500/30 text-rose-300 ring-1 ring-rose-400/40' : 'bg-white/5 text-white/50'
              }`}
            >
              <Icon name="Moon" size={12} />
              <span>DND</span>
            </button>
          </div>

          {/* Android Material You App Grid */}
          <div className="my-auto grid grid-cols-4 sm:grid-cols-5 gap-4 max-w-xl mx-auto w-full py-4">
            {DESKTOP_APPS_LIST.map((item) => (
              <button
                key={item.id}
                onClick={() => handleAppClick(item.id as AppId)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl transition active:scale-90 hover:bg-white/10"
              >
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-purple-500/30 flex items-center justify-center ring-1 ring-white/20 shadow-lg shadow-sky-500/10">
                  <Icon name={item.icon} size={26} className="text-sky-300" />
                </div>
                <span className="text-[11px] font-medium text-white/90 text-center truncate max-w-[70px]">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Android Bottom Navigation Gesture Bar */}
          <div className="flex items-center justify-center gap-12 pb-2">
            <button onClick={() => setShellMode('windows')} className="p-2 text-white/70 hover:text-white" title="Back / Desktop">
              <Icon name="ChevronLeft" size={20} />
            </button>
            <button onClick={() => setNotifCenterOpen(true)} className="h-1.5 w-32 rounded-full bg-white/60 hover:bg-white transition" title="Home Bar" />
            <button onClick={() => openApp('taskmanager')} className="p-2 text-white/70 hover:text-white" title="Recent Apps">
              <Icon name="Square" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          4. iOS SPRINGBOARD SHELL: Dynamic Island + 4x6 App Grid + Home Bar
         ======================================================== */}
      {shellMode === 'ios' && (
        <div className="fixed inset-0 z-30 flex flex-col justify-between bg-black/40 backdrop-blur-md select-none p-4">
          {/* iOS Dynamic Island Status Bar */}
          <div className="flex items-center justify-between text-xs text-white px-3">
            <span className="font-semibold">{timeStr}</span>
            {/* Dynamic Island Pill */}
            <div
              onClick={() => setNotifCenterOpen(!notifCenterOpen)}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-black/90 px-4 py-1.5 text-white ring-1 ring-white/25 shadow-2xl hover:scale-105 transition"
            >
              <span className={`h-2 w-2 rounded-full ${dynamicIslandEvent ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="text-[11px] font-medium font-sans">
                {dynamicIslandEvent ? `${dynamicIslandEvent.title}${dynamicIslandEvent.subtitle ? ` · ${dynamicIslandEvent.subtitle}` : ''}` : 'LiquidOS v4.0.0 Active'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="Wifi" size={13} />
              <Icon name="Battery" size={13} />
            </div>
          </div>

          {/* iOS SpringBoard Grid */}
          <div className="my-auto grid grid-cols-4 sm:grid-cols-4 gap-4 max-w-sm mx-auto w-full py-4">
            {DESKTOP_APPS_LIST.map((item) => (
              <button
                key={item.id}
                onClick={() => handleAppClick(item.id as AppId)}
                className="flex flex-col items-center gap-1.5 p-1 rounded-2xl transition active:scale-85 hover:opacity-80"
              >
                <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-xl flex items-center justify-center ring-1 ring-white/20 shadow-xl">
                  <Icon name={item.icon} size={26} className="text-white" />
                </div>
                <span className="text-[10px] font-medium text-white/90 text-center truncate max-w-[65px]">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* iOS Bottom Dock */}
          <div className="mx-auto w-full max-w-sm rounded-3xl bg-white/10 backdrop-blur-2xl p-2.5 flex items-center justify-around ring-1 ring-white/15 shadow-2xl">
            <button onClick={() => openApp('browser')} className="h-12 w-12 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md">
              <Icon name="Globe" size={24} />
            </button>
            <button onClick={() => openApp('notepad')} className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md">
              <Icon name="FileText" size={24} />
            </button>
            <button onClick={() => openApp('terminal')} className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center text-white shadow-md">
              <Icon name="SquareTerminal" size={24} />
            </button>
            <button onClick={() => openApp('settings')} className="h-12 w-12 rounded-xl bg-slate-600 flex items-center justify-center text-white shadow-md">
              <Icon name="Settings" size={24} />
            </button>
          </div>

          {/* iOS Bottom Home Bar */}
          <div className="flex justify-center pt-2">
            <div
              onClick={() => setShellMode('windows')}
              className="h-1 w-36 rounded-full bg-white/70 hover:bg-white cursor-pointer transition"
              title="Swipe Up to Switch Shell"
            />
          </div>
        </div>
      )}

      {/* ========================================================
          5. WINDOWS 8 METRO LIVE TILES DASHBOARD (TRUE LIQUID GLASS)
         ======================================================== */}
      {shellMode === 'metro' && (
        <div className="fixed inset-0 z-30 p-6 sm:p-10 overflow-x-auto overflow-y-auto flex flex-col justify-between bg-black/40 backdrop-blur-md select-none">
          <div className="flex items-center justify-between shrink-0 mb-6">
            <div className="flex items-center gap-3">
              <AppLogo size={36} glow />
              <div>
                <div className="text-2xl sm:text-3xl font-light text-white tracking-wider flex items-center gap-2">
                  Start <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">Metro Live</span>
                </div>
                <div className="text-xs text-white/50">Fluid Touch Grid Matrix</div>
              </div>
            </div>
            <button
              onClick={() => setShellMode('windows')}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white flex items-center gap-2 transition active:scale-95"
            >
              <Icon name="Monitor" size={14} className="text-cyan-300" />
              <span>Desktop View</span>
            </button>
          </div>

          {/* Responsive Liquid Glass Live Tiles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 my-auto max-w-6xl w-full mx-auto py-4">
            {/* Tile 1: 3D Cosmic Velocity */}
            <div
              onClick={() => { openApp('game'); setShellMode('windows'); }}
              className="glass p-5 rounded-2xl cursor-pointer flex flex-col justify-between h-40 hover:scale-[1.02] active:scale-98 transition group bg-gradient-to-br from-rose-500/20 to-orange-600/30"
            >
              <div className="flex justify-between items-start">
                <Icon name="Flame" size={26} className="text-orange-400 group-hover:rotate-12 transition" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-orange-300/70">Arcade 3D</span>
              </div>
              <div>
                <div className="text-base font-semibold text-white">Cosmic Velocity</div>
                <div className="text-xs text-white/70">Raw Three.js Hovercraft Racer</div>
              </div>
            </div>

            {/* Tile 2: Calculator Pro */}
            <div
              onClick={() => { openApp('calculator'); setShellMode('windows'); }}
              className="glass p-5 rounded-2xl cursor-pointer flex flex-col justify-between h-40 hover:scale-[1.02] active:scale-98 transition group bg-gradient-to-br from-amber-500/20 to-yellow-600/30"
            >
              <div className="flex justify-between items-start">
                <Icon name="Calculator" size={26} className="text-amber-400 group-hover:scale-110 transition" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300/70">Utility</span>
              </div>
              <div>
                <div className="text-base font-semibold text-white">Calculator Pro</div>
                <div className="text-xs text-white/70">Scientific & Memory Precision</div>
              </div>
            </div>

            {/* Tile 3: Task Manager */}
            <div
              onClick={() => { openApp('taskmanager'); setShellMode('windows'); }}
              className="glass p-5 rounded-2xl cursor-pointer flex flex-col justify-between h-40 hover:scale-[1.02] active:scale-98 transition group bg-gradient-to-br from-cyan-500/20 to-blue-600/30"
            >
              <div className="flex justify-between items-start">
                <Icon name="Cpu" size={26} className="text-cyan-400 group-hover:scale-110 transition" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-300/70">System</span>
              </div>
              <div>
                <div className="text-base font-semibold text-white">Task Manager</div>
                <div className="text-xs text-white/70">Live Process Telemetry & Kill</div>
              </div>
            </div>

            {/* Tile 4: Calendar & Tasks */}
            <div
              onClick={() => { openApp('calendar'); setShellMode('windows'); }}
              className="glass p-5 rounded-2xl cursor-pointer flex flex-col justify-between h-40 hover:scale-[1.02] active:scale-98 transition group bg-gradient-to-br from-emerald-500/20 to-teal-600/30"
            >
              <div className="flex justify-between items-start">
                <Icon name="Calendar" size={26} className="text-emerald-400 group-hover:scale-110 transition" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-300/70">{timeStr}</span>
              </div>
              <div>
                <div className="text-base font-semibold text-white">Agenda & Tasks</div>
                <div className="text-xs text-white/70">{calendarTasks.length} Scheduled Operations</div>
              </div>
            </div>

            {/* Tile 5: Monochrome Music */}
            <div
              onClick={() => { openApp('synth'); setShellMode('windows'); }}
              className="glass p-5 rounded-2xl cursor-pointer flex flex-col justify-between h-40 hover:scale-[1.02] active:scale-98 transition group bg-gradient-to-br from-orange-500/20 to-amber-600/30"
            >
              <div className="flex justify-between items-start">
                <Icon name="Music" size={26} className="text-orange-400 group-hover:scale-110 transition" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-orange-300/70">Hi-Fi Proxy</span>
              </div>
              <div>
                <div className="text-base font-semibold text-white">Monochrome Music</div>
                <div className="text-xs text-white/70">Lossless Streaming & Synced Lyrics</div>
              </div>
            </div>

            {/* Tile 6: Liquid Browser */}
            <div
              onClick={() => { openApp('browser'); setShellMode('windows'); }}
              className="glass p-5 rounded-2xl cursor-pointer flex flex-col justify-between h-40 hover:scale-[1.02] active:scale-98 transition group bg-gradient-to-br from-blue-500/20 to-sky-600/30"
            >
              <div className="flex justify-between items-start">
                <Icon name="Globe" size={26} className="text-sky-400 group-hover:scale-110 transition" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-sky-300/70">Web</span>
              </div>
              <div>
                <div className="text-base font-semibold text-white">Liquid Browser</div>
                <div className="text-xs text-white/70">Ultra-fast Portal Navigation</div>
              </div>
            </div>

            {/* Tile 7: File Explorer */}
            <div
              onClick={() => { openApp('explorer'); setShellMode('windows'); }}
              className="glass p-5 rounded-2xl cursor-pointer flex flex-col justify-between h-40 hover:scale-[1.02] active:scale-98 transition group bg-gradient-to-br from-teal-500/20 to-cyan-600/30"
            >
              <div className="flex justify-between items-start">
                <Icon name="FolderOpen" size={26} className="text-teal-400 group-hover:scale-110 transition" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-teal-300/70">VFS</span>
              </div>
              <div>
                <div className="text-base font-semibold text-white">File Explorer</div>
                <div className="text-xs text-white/70">Cloud & Virtual Disk Storage</div>
              </div>
            </div>

            {/* Tile 8: Terminal */}
            <div
              onClick={() => { openApp('terminal'); setShellMode('windows'); }}
              className="glass p-5 rounded-2xl cursor-pointer flex flex-col justify-between h-40 hover:scale-[1.02] active:scale-98 transition group bg-gradient-to-br from-slate-500/20 to-zinc-700/30"
            >
              <div className="flex justify-between items-start">
                <Icon name="SquareTerminal" size={26} className="text-emerald-400 group-hover:scale-110 transition" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-300/70">Shell</span>
              </div>
              <div>
                <div className="text-base font-semibold text-white">Liquid Terminal</div>
                <div className="text-xs text-white/70">Interactive CLI & Scripts</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/50 font-mono shrink-0 pt-3">
            <div className="flex items-center gap-2">
              <AppLogo size={16} />
              <span>LiquidOS v4.0.0 Metro Engine</span>
            </div>
            <div>Swipe or tap to launch tiles</div>
          </div>
        </div>
      )}

      {/* ========================================================
          DESKTOP ICONS GRID (Windows, XP, Vista, 10, 11, DeX, ChromeOS)
         ======================================================== */}
      {['windows', 'windows11', 'windows10', 'vista', 'xp', 'dex', 'chromeos'].includes(shellMode) && (
        <div className="absolute top-4 left-4 z-10 flex flex-col flex-wrap gap-2 max-h-[calc(100vh-64px)] pointer-events-auto">
          {DESKTOP_APPS_LIST.map((item) => (
            <button
              key={item.id}
              onClick={() => handleAppClick(item.id as AppId)}
              className="flex flex-col items-center gap-1 w-20 p-2 rounded-xl text-white/90 hover:bg-white/10 hover:shadow-lg active:scale-95 transition group"
              title={item.label}
            >
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/15 transition shrink-0">
                <Icon name={item.icon} size={18} className={shellMode === 'xp' ? 'text-amber-300' : shellMode === 'vista' ? 'text-sky-300' : 'text-cyan-300'} />
              </div>
              <span className={`text-[11px] font-medium text-center truncate max-w-full px-0.5 leading-tight select-none ${
                shellMode === 'xp' ? 'text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]' : 'text-white/90'
              }`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ========================================================
          WINDOWS VISTA SIDEBAR WITH LIVE GADGETS (AERO GLASS)
         ======================================================== */}
      {shellMode === 'vista' && (
        <div className="hidden lg:flex fixed right-0 top-0 bottom-10 w-44 z-20 flex-col items-center p-3 gap-4 bg-gradient-to-l from-slate-950/70 to-transparent border-l border-sky-400/20 backdrop-blur-md pointer-events-auto">
          {/* Vista Gadget 1: Analog Clock */}
          <div className="w-36 h-36 rounded-full bg-slate-900/80 border-2 border-sky-400/50 shadow-2xl relative flex items-center justify-center p-2 ring-2 ring-white/10">
            {/* Clock Face Notches */}
            <div className="absolute inset-2 rounded-full border border-sky-400/20 flex items-center justify-center">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <div
                  key={deg}
                  className="absolute w-0.5 h-2 bg-sky-300/60"
                  style={{
                    transform: `rotate(${deg}deg) translateY(-54px)`,
                  }}
                />
              ))}
            </div>

            {/* Hour hand */}
            <div
              className="absolute w-1 h-9 bg-white rounded-full origin-bottom"
              style={{
                transform: `rotate(${(time.getHours() % 12 + time.getMinutes() / 60) * 30}deg) translateY(-50%)`,
                boxShadow: '0 0 4px rgba(0,0,0,0.8)',
              }}
            />

            {/* Minute hand */}
            <div
              className="absolute w-0.5 h-12 bg-sky-200 rounded-full origin-bottom"
              style={{
                transform: `rotate(${(time.getMinutes() + time.getSeconds() / 60) * 6}deg) translateY(-50%)`,
                boxShadow: '0 0 4px rgba(0,0,0,0.8)',
              }}
            />

            {/* Second hand */}
            <div
              className="absolute w-0.5 h-14 bg-orange-500 rounded-full origin-bottom"
              style={{
                transform: `rotate(${time.getSeconds() * 6}deg) translateY(-40%)`,
              }}
            />

            {/* Center Cap */}
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400 border border-white z-10 shadow" />
            <div className="absolute bottom-6 text-[8px] font-mono text-sky-300/80 uppercase tracking-widest">
              VISTA
            </div>
          </div>

          {/* Vista Gadget 2: Dual CPU & RAM Meter */}
          <div className="w-36 rounded-2xl bg-slate-900/80 border border-sky-400/30 p-2.5 flex flex-col gap-2 shadow-xl">
            <div className="flex items-center justify-between text-[10px] text-sky-300 font-semibold uppercase tracking-wider">
              <span>CPU Meter</span>
              <Icon name="Activity" size={12} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              {/* CPU dial */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-sky-400/40 relative flex items-center justify-center bg-black/40">
                  <div
                    className="absolute w-0.5 h-5 bg-sky-400 origin-bottom"
                    style={{ transform: `rotate(${-60 + (time.getSeconds() * 3) % 120}deg) translateY(-50%)` }}
                  />
                  <div className="w-1.5 h-1.5 rounded-full bg-white z-10" />
                </div>
                <span className="text-[9px] text-white/60 mt-1">CPU 24%</span>
              </div>

              {/* RAM dial */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-400/40 relative flex items-center justify-center bg-black/40">
                  <div
                    className="absolute w-0.5 h-5 bg-emerald-400 origin-bottom"
                    style={{ transform: `rotate(${-30 + (time.getSeconds() * 2) % 100}deg) translateY(-50%)` }}
                  />
                  <div className="w-1.5 h-1.5 rounded-full bg-white z-10" />
                </div>
                <span className="text-[9px] text-white/60 mt-1">RAM 3.4G</span>
              </div>
            </div>
          </div>

          {/* Vista Gadget 3: Quick Weather Note */}
          <div className="w-36 rounded-2xl bg-amber-500/10 border border-amber-400/30 p-2.5 text-xs text-amber-200/90 shadow-xl flex items-center gap-2">
            <Icon name="Sun" size={18} className="text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-white">Singularity</div>
              <div className="text-[9px] text-amber-300/80">21°C · Sunny Aero</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          ACTIVE FLOATING WINDOWS
         ======================================================== */}
      <AnimatePresence>
        {windows.map((win) => (
          <WindowFrame key={win.id} win={win}>
            {renderApp(win.appId, win.payload)}
          </WindowFrame>
        ))}
      </AnimatePresence>

      {/* Welcome Banner */}
      <AnimatePresence>
        {showWelcome && user && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onAnimationComplete={() => {
              setTimeout(() => setWelcome(false), 5000);
            }}
            className="liquid-glass-taskbar fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-2xl px-6 py-3 flex items-center gap-3"
          >
            <Icon name="Sparkles" size={18} className="text-orange-400" />
            <span className="text-sm text-white/90 font-medium">
              Welcome back, {user.name}! LiquidOS v4.0.0 initialized with #glass-distortion.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Shell Mode Taskbar (Windows 11, 10, Vista, XP, DeX, ChromeOS) */}
      {['windows', 'windows11', 'windows10', 'vista', 'xp', 'dex', 'chromeos'].includes(shellMode) && (
        <Taskbar onLock={lockSystem} />
      )}

      {/* Notification Center Overlay */}
      <NotificationCenter isOpen={notifCenterOpen} onClose={() => setNotifCenterOpen(false)} />

      {/* Lock screen overlay */}
      <LockScreen
        locked={locked}
        onUnlock={unlockSystem}
        expectedPassword={user?.password}
        userName={user?.name}
      />
    </div>
  );
}
