import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOS } from './OSContext';
import { WindowFrame } from './WindowFrame';
import { Taskbar } from './Taskbar';
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
  } = useOS();

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const customWallpaper = customWallpapers.find((c) => c.id === selectedCustomId);
  const useShader = wallpaper === 'shader' && !liteMode;
  const useSpace = wallpaper === 'space' && !liteMode;
  const shaderOpacity = transparency / 100;

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
          1. MAC DESKTOP SHELL: Top Bar + Magnified Bottom Dock
         ======================================================== */}
      {shellMode === 'mac' && (
        <>
          {/* Mac Top Global Bar */}
          <div className="fixed top-0 inset-x-0 h-7 bg-black/40 backdrop-blur-xl border-b border-white/10 z-40 px-4 flex items-center justify-between text-xs text-white/90">
            <div className="flex items-center gap-4">
              <Icon name="Apple" size={14} className="text-white" />
              <span className="font-bold">LiquidOS</span>
              <span className="text-white/60 hover:text-white cursor-pointer" onClick={() => openApp('explorer')}>File</span>
              <span className="text-white/60 hover:text-white cursor-pointer" onClick={() => openApp('settings')}>Edit</span>
              <span className="text-white/60 hover:text-white cursor-pointer" onClick={() => setShellMode('windows')}>View</span>
              <span className="text-white/60 hover:text-white cursor-pointer" onClick={() => openApp('terminal')}>Window</span>
            </div>

            <div className="flex items-center gap-3 font-medium text-[11px]">
              <span className="text-white/70">Engine: {designEngine}</span>
              <Icon name="Wifi" size={13} />
              <Icon name="Battery" size={13} />
              <span className="tabular-nums font-mono">{timeStr}</span>
            </div>
          </div>

          {/* Mac Magnified Bottom Dock */}
          <div className="fixed bottom-3 inset-x-0 flex justify-center z-40 pointer-events-none">
            <div className="liquid-glass-taskbar p-2 rounded-2xl flex items-center gap-2 pointer-events-auto shadow-2xl">
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
          2. UBUNTU LINUX SHELL: Left Vertical Launcher
         ======================================================== */}
      {shellMode === 'ubuntu' && (
        <div className="fixed left-0 top-0 bottom-0 w-16 bg-black/60 backdrop-blur-2xl border-r border-white/10 z-40 flex flex-col items-center py-3 justify-between">
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
          </div>

          <div className="flex flex-col items-center gap-3">
            <button onClick={lockSystem} className="p-2 text-white/60 hover:text-white" title="Lock">
              <Icon name="Lock" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          3. WINDOWS 8 METRO LIVE TILES DASHBOARD (TRUE LIQUID GLASS)
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
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white flex items-center gap-2 transition active:scale-95"
            >
              <Icon name="Monitor" size={14} className="text-cyan-300" />
              <span>Desktop View</span>
            </button>
          </div>

          {/* Responsive Liquid Glass Live Tiles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 my-auto max-w-6xl w-full mx-auto py-4">
            {/* Tile 1: 3D Black Hole */}
            <div
              onClick={() => { openApp('settings'); setShellMode('windows'); }}
              className="glass p-5 rounded-2xl cursor-pointer flex flex-col justify-between h-40 hover:scale-[1.02] active:scale-98 transition group bg-gradient-to-br from-amber-500/20 to-orange-600/30"
            >
              <div className="flex justify-between items-start">
                <Icon name="Sparkles" size={26} className="text-amber-400 group-hover:rotate-12 transition" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300/70">Singularity</span>
              </div>
              <div>
                <div className="text-base font-semibold text-white">Gargantua Singularity</div>
                <div className="text-xs text-white/70">Raymarched 60 FPS Physics</div>
              </div>
            </div>

            {/* Tile 2: System Monitor */}
            <div
              onClick={() => { openApp('sysmon'); setShellMode('windows'); }}
              className="glass p-5 rounded-2xl cursor-pointer flex flex-col justify-between h-40 hover:scale-[1.02] active:scale-98 transition group bg-gradient-to-br from-cyan-500/20 to-blue-600/30"
            >
              <div className="flex justify-between items-start">
                <Icon name="Activity" size={26} className="text-cyan-400 group-hover:scale-110 transition" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-300/70">Telemetry</span>
              </div>
              <div>
                <div className="text-base font-semibold text-white">System Monitor Pro</div>
                <div className="text-xs text-white/70">GPU & Memory Telemetry Active</div>
              </div>
            </div>

            {/* Tile 3: Calendar & Tasks */}
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

            {/* Tile 4: 3D Games Matrix */}
            <div
              onClick={() => { openApp('game'); setShellMode('windows'); }}
              className="glass p-5 rounded-2xl cursor-pointer flex flex-col justify-between h-40 hover:scale-[1.02] active:scale-98 transition group bg-gradient-to-br from-purple-500/20 to-pink-600/30"
            >
              <div className="flex justify-between items-start">
                <Icon name="Gamepad2" size={26} className="text-purple-400 group-hover:scale-110 transition" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-purple-300/70">Arcade</span>
              </div>
              <div>
                <div className="text-base font-semibold text-white">Space Runner 3D</div>
                <div className="text-xs text-white/70">Cosmic Physics Slope Maze</div>
              </div>
            </div>

            {/* Tile 5: Translucent Synth */}
            <div
              onClick={() => { openApp('synth'); setShellMode('windows'); }}
              className="glass p-5 rounded-2xl cursor-pointer flex flex-col justify-between h-40 hover:scale-[1.02] active:scale-98 transition group bg-gradient-to-br from-violet-500/20 to-indigo-600/30"
            >
              <div className="flex justify-between items-start">
                <Icon name="Music" size={26} className="text-violet-400 group-hover:scale-110 transition" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-violet-300/70">Audio FX</span>
              </div>
              <div>
                <div className="text-base font-semibold text-white">Synthesizer Studio</div>
                <div className="text-xs text-white/70">Web Audio Harmonic Synthesizer</div>
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

          <div className="flex items-center justify-between text-xs text-white/50 font-mono shrink-0 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <AppLogo size={16} />
              <span>LiquidOS v3.1 Touch Engine</span>
            </div>
            <div>Swipe or click to launch tiles</div>
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
              Welcome back, {user.name}! 3D Gargantua Singularity initialized at 60 FPS.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Windows Shell Mode Taskbar */}
      {shellMode === 'windows' && <Taskbar onLock={lockSystem} />}

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
