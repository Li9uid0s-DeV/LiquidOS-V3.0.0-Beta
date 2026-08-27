import { useEffect } from 'react';
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
import { Icon } from './Icon';
import { AppId } from './types';

function renderApp(appId: string, payload?: unknown) {
  switch (appId) {
    case 'terminal': return <TerminalApp />;
    case 'notepad': return <NotepadApp payload={payload as { fileName?: string; content?: string }} />;
    case 'explorer': return <FileExplorerApp payload={payload as { folderPath?: string[] }} />;
    case 'browser': return <BrowserApp payload={payload as { url?: string; isImage?: boolean }} />;
    case 'settings': return <SettingsApp />;
    case 'game': return <GameApp />;
    case 'appstore': return <AppStoreApp />;
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
    windows, wallpaper, customWallpapers, selectedCustomId,
    liteMode, transparency, setStartOpen, getTopWindowId, closeWindow,
    locked, lockSystem, unlockSystem, user, showWelcome, setWelcome,
  } = useOS();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Win/Meta toggles Start
      if (e.key === 'Meta' || (e.key === 'OS' && !e.ctrlKey && !e.altKey)) {
        e.preventDefault();
        setStartOpen(true);
      }
      // Alt+Q closes active window
      if (e.key === 'q' && e.altKey) {
        e.preventDefault();
        const topId = getTopWindowId();
        if (topId) closeWindow(topId);
      }
      // Win+L locks the system
      if ((e.key === 'l' || e.key === 'L') && (e.metaKey || (e.key === 'l' && e.altKey && e.ctrlKey))) {
        e.preventDefault();
        lockSystem();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setStartOpen, getTopWindowId, closeWindow, lockSystem]);

  // Auto-lock after 5 minutes of inactivity
  useEffect(() => {
    if (locked) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => lockSystem(), 300000); // 5 min
    };
    const events = ['mousemove', 'keydown', 'click', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [locked, lockSystem]);

  const customWallpaper = customWallpapers.find((c) => c.id === selectedCustomId);
  const useShader = wallpaper === 'shader' && !liteMode;
  const useSpace = wallpaper === 'space' && !liteMode;
  const shaderOpacity = transparency / 100;

  return (
    <div className={`relative h-full w-full overflow-hidden ${liteMode ? 'lite-mode' : ''}`}>
      {/* Base wallpaper gradient (always present) */}
      <div
        className="absolute inset-0 animated-gradient"
        style={{ background: WALLPAPERS[wallpaper].style }}
      />

      {/* Custom wallpaper image/GIF overlay */}
      {customWallpaper && (
        <div
          className="absolute inset-0 z-0"
          style={{ backgroundImage: `url(${customWallpaper.dataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}

      {/* Space live wallpaper */}
      {useSpace && <SpaceWallpaper lite={false} />}

      {/* WebGL liquid shader overlay */}
      {useShader && <LiquidShader lite={false} opacity={shaderOpacity} />}

      {/* Floating orbs (only for non-special wallpapers, non-lite) */}
      {!liteMode && !useShader && !useSpace && !customWallpaper && <WallpaperOrbs />}

      {/* Windows */}
      <AnimatePresence>
        {windows.map((win) => (
          <WindowFrame key={win.id} win={win}>
            {renderApp(win.appId, win.payload)}
          </WindowFrame>
        ))}
      </AnimatePresence>

      {/* Welcome banner */}
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
            <Icon name="Sparkles" size={18} className="text-violet-300" />
            <span className="text-sm text-white/90 font-medium">
              Welcome back, {user.name}! Initializing your high-density Liquid Glass space workstation...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Taskbar */}
      <Taskbar onLock={lockSystem} />

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
