import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { AppId, WindowState, TaskbarAlign, InstalledApp, StoreApp, STORE_CATALOG } from './types';
import { VirtualFolder, getInitialFileSystem, VirtualNode } from './fileSystem';

export type Wallpaper =
  | 'space'
  | 'aurora'
  | 'sunset'
  | 'ocean'
  | 'forest'
  | 'cosmic'
  | 'bloom'
  | 'shader';

export type Theme = 'dark' | 'light';

interface CustomWallpaper {
  id: string;
  name: string;
  dataUrl: string;
}

interface OpenOptions {
  title?: string;
  payload?: unknown;
  width?: number;
  height?: number;
  icon?: string;
}

interface OSContextValue {
  windows: WindowState[];
  openApp: (appId: AppId, opts?: OpenOptions) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  updateWindowRect: (id: string, rect: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height'>>) => void;
  restoreWindow: (id: string) => void;
  getTopWindowId: () => string | null;

  fileSystem: VirtualFolder;
  saveFile: (path: string[], name: string, content: string) => void;
  openFileNode: (node: VirtualNode) => void;

  wallpaper: Wallpaper;
  setWallpaper: (w: Wallpaper) => void;
  customWallpapers: CustomWallpaper[];
  addCustomWallpaper: (name: string, dataUrl: string) => void;
  selectedCustomId: string | null;
  setSelectedCustomId: (id: string | null) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;

  quickSettings: { wifi: boolean; bluetooth: boolean; darkMode: boolean };
  toggleQuick: (key: 'wifi' | 'bluetooth' | 'darkMode') => void;

  liteMode: boolean;
  setLiteMode: (v: boolean) => void;
  taskbarAlign: TaskbarAlign;
  setTaskbarAlign: (a: TaskbarAlign) => void;
  transparency: number;
  setTransparency: (v: number) => void;

  startOpen: boolean;
  setStartOpen: (v: boolean) => void;
  toggleStart: () => void;

  // App Store
  installedApps: InstalledApp[];
  installApp: (app: StoreApp | { name: string; url: string; icon: string; description: string; author: string; category: 'utilities' | 'games' }) => void;
  uninstallApp: (appId: string) => void;
  launchInstalledApp: (appId: string) => void;
  isInstalled: (appId: string) => boolean;
  storeCatalog: StoreApp[];

  // Lock screen
  locked: boolean;
  lockSystem: () => void;
  unlockSystem: () => void;

  // User account
  user: { name: string; avatar?: string; password?: string } | null;
  setUser: (u: { name: string; avatar?: string; password?: string } | null) => void;
  showWelcome: boolean;
  setWelcome: (v: boolean) => void;
}

const OSContext = createContext<OSContextValue | null>(null);

const APP_DEFAULTS: Record<AppId, { title: string; icon: string; width: number; height: number }> = {
  explorer: { title: 'File Explorer', icon: 'FolderOpen', width: 780, height: 520 },
  browser: { title: 'Liquid Browser', icon: 'Globe', width: 900, height: 600 },
  terminal: { title: 'Terminal', icon: 'SquareTerminal', width: 680, height: 440 },
  settings: { title: 'Settings', icon: 'Settings', width: 720, height: 540 },
  notepad: { title: 'Notepad', icon: 'FileText', width: 600, height: 480 },
  game: { title: 'Space Runner', icon: 'Gamepad2', width: 640, height: 520 },
  appstore: { title: 'App Store', icon: 'Store', width: 820, height: 600 },
};

// ---- LocalStorage persistence ----
const LS_KEY = 'liquid-os-settings';
const LS_APPS_KEY = 'liquid-os-installed-apps';

function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}
function saveSettings(data: unknown) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch { /* ignore - quota */ }
}
function loadInstalledApps(): InstalledApp[] {
  try {
    const raw = localStorage.getItem(LS_APPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}
function saveInstalledApps(apps: InstalledApp[]) {
  try {
    localStorage.setItem(LS_APPS_KEY, JSON.stringify(apps));
  } catch { /* ignore */ }
}

const persisted = loadSettings();

export function OSProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const zCounter = useRef(10);
  const idCounter = useRef(0);

  const [fileSystem, setFileSystem] = useState<VirtualFolder>(getInitialFileSystem());

  const [wallpaper, setWallpaper] = useState<Wallpaper>(persisted?.wallpaper ?? 'space');
  const [customWallpapers, setCustomWallpapers] = useState<CustomWallpaper[]>(persisted?.customWallpapers ?? []);
  const [selectedCustomId, setSelectedCustomId] = useState<string | null>(persisted?.selectedCustomId ?? null);
  const [theme, setTheme] = useState<Theme>(persisted?.theme ?? 'dark');
  const [quickSettings, setQuickSettings] = useState<{ wifi: boolean; bluetooth: boolean; darkMode: boolean }>(
    persisted?.quickSettings ?? { wifi: true, bluetooth: false, darkMode: true }
  );
  const [liteMode, setLiteMode] = useState<boolean>(persisted?.liteMode ?? false);
  const [taskbarAlign, setTaskbarAlign] = useState<TaskbarAlign>(persisted?.taskbarAlign ?? 'center');
  const [transparency, setTransparency] = useState<number>(persisted?.transparency ?? 70);
  const [startOpen, setStartOpen] = useState(false);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>(loadInstalledApps);
  const [locked, setLocked] = useState(false);
  const [user, setUserState] = useState<{ name: string; avatar?: string; password?: string } | null>(persisted?.user ?? null);
  const [showWelcome, setWelcome] = useState(false);

  useEffect(() => {
    saveSettings({
      wallpaper, customWallpapers, selectedCustomId, theme, quickSettings,
      liteMode, taskbarAlign, transparency, user,
    });
  }, [wallpaper, customWallpapers, selectedCustomId, theme, quickSettings, liteMode, taskbarAlign, transparency, user]);

  useEffect(() => {
    saveInstalledApps(installedApps);
  }, [installedApps]);

  const focusWindow = useCallback((id: string) => {
    zCounter.current += 1;
    const z = zCounter.current;
    setWindows((ws) =>
      ws.map((w) => (w.id === id ? { ...w, zIndex: z, minimized: false } : w))
    );
  }, []);

  const openApp = useCallback(
    (appId: AppId, opts?: OpenOptions) => {
      const existing = windows.find((w) => w.appId === appId);
      if (existing && appId !== 'notepad') {
        focusWindow(existing.id);
        return;
      }
      const def = APP_DEFAULTS[appId];
      idCounter.current += 1;
      const id = `win-${idCounter.current}`;
      zCounter.current += 1;
      const count = windows.length;
      const width = opts?.width ?? def.width;
      const height = opts?.height ?? def.height;
      const win: WindowState = {
        id,
        appId,
        title: opts?.title ?? def.title,
        icon: opts?.icon ?? def.icon,
        x: 120 + count * 32,
        y: 80 + count * 28,
        width,
        height,
        zIndex: zCounter.current,
        minimized: false,
        maximized: false,
        payload: opts?.payload,
      };
      setWindows((ws) => [...ws, win]);
    },
    [windows, focusWindow]
  );

  // Open a custom installed app (from App Store)
  const launchInstalledApp = useCallback(
    (appId: string) => {
      const app = installedApps.find((a) => a.appId === appId);
      if (!app) return;
      const existing = windows.find((w) => w.appId === appId);
      if (existing) {
        focusWindow(existing.id);
        return;
      }
      idCounter.current += 1;
      const id = `win-${idCounter.current}`;
      zCounter.current += 1;
      const count = windows.length;
      const win: WindowState = {
        id,
        appId: app.appId,
        title: app.name,
        icon: app.icon,
        x: 140 + count * 32,
        y: 90 + count * 28,
        width: 860,
        height: 580,
        zIndex: zCounter.current,
        minimized: false,
        maximized: false,
        payload: { url: app.url, isCustomApp: true },
      };
      setWindows((ws) => [...ws, win]);
    },
    [installedApps, windows, focusWindow]
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((ws) => ws.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
  }, []);

  const restoreWindow = useCallback(
    (id: string) => {
      setWindows((ws) =>
        ws.map((w) => (w.id === id ? { ...w, minimized: false } : w))
      );
      focusWindow(id);
    },
    [focusWindow]
  );

  const toggleMaximize = useCallback((id: string) => {
    setWindows((ws) =>
      ws.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized && w.prevRect) {
          const { x, y, width, height } = w.prevRect;
          return { ...w, maximized: false, x, y, width, height, prevRect: undefined };
        }
        return {
          ...w,
          maximized: true,
          prevRect: { x: w.x, y: w.y, width: w.width, height: w.height },
        };
      })
    );
  }, []);

  const updateWindowRect = useCallback(
    (id: string, rect: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height'>>) => {
      setWindows((ws) =>
        ws.map((w) => (w.id === id ? { ...w, ...rect } : w))
      );
    },
    []
  );

  const getTopWindowId = useCallback(() => {
    let topId: string | null = null;
    let topZ = -1;
    for (const w of windows) {
      if (!w.minimized && w.zIndex > topZ) {
        topZ = w.zIndex;
        topId = w.id;
      }
    }
    return topId;
  }, [windows]);

  const saveFile = useCallback((path: string[], name: string, content: string) => {
    setFileSystem((fs) => {
      const clone: VirtualFolder = JSON.parse(JSON.stringify(fs));
      let folder = clone;
      for (const seg of path) {
        const next = folder.children.find((c) => c.name === seg && c.kind === 'folder');
        if (!next || next.kind !== 'folder') return fs;
        folder = next;
      }
      const existing = folder.children.find((c) => c.name === name && c.kind === 'file');
      if (existing && existing.kind === 'file') {
        existing.content = content;
      } else {
        folder.children.push({
          id: `file-${Date.now()}`,
          name,
          kind: 'file',
          type: 'text',
          content,
          createdAt: Date.now(),
        });
      }
      return clone;
    });
  }, []);

  const openFileNode = useCallback(
    (node: VirtualNode) => {
      if (node.kind === 'folder') {
        openApp('explorer', { payload: { folderPath: [node.name] } });
        return;
      }
      if (node.type === 'text') {
        openApp('notepad', {
          title: node.name,
          payload: { fileName: node.name, content: node.content },
          width: 600,
          height: 480,
        });
      } else {
        openApp('browser', {
          title: node.name,
          payload: { url: node.content, isImage: true },
        });
      }
    },
    [openApp]
  );

  const toggleQuick = useCallback((key: 'wifi' | 'bluetooth' | 'darkMode') => {
    setQuickSettings((q) => {
      const next = { ...q, [key]: !q[key] };
      if (key === 'darkMode') setTheme(next.darkMode ? 'dark' : 'light');
      return next;
    });
  }, []);

  const addCustomWallpaper = useCallback((name: string, dataUrl: string) => {
    const id = `custom-${Date.now()}`;
    setCustomWallpapers((list) => [...list, { id, name, dataUrl }]);
    setSelectedCustomId(id);
  }, []);

  const toggleStart = useCallback(() => setStartOpen((v) => !v), []);

  // App Store operations
  const installApp = useCallback(
    (app: StoreApp | { name: string; url: string; icon: string; description: string; author: string; category: 'utilities' | 'games' }) => {
      const isCustom = !STORE_CATALOG.some((c) => c.id === (app as StoreApp).id);
      const appId = isCustom ? `custom:${app.name.toLowerCase().replace(/\s+/g, '-')}` : (app as StoreApp).id;
      // Don't reinstall
      setInstalledApps((list) => {
        if (list.some((a) => a.appId === appId)) return list;
        return [
          ...list,
          {
            id: `install-${Date.now()}`,
            appId,
            name: app.name,
            icon: app.icon,
            url: app.url,
            description: app.description,
            author: app.author,
            category: app.category,
            installedAt: Date.now(),
            isCustom,
          },
        ];
      });
    },
    []
  );

  const uninstallApp = useCallback((appId: string) => {
    setInstalledApps((list) => list.filter((a) => a.appId !== appId));
  }, []);

  const isInstalled = useCallback(
    (appId: string) => installedApps.some((a) => a.appId === appId),
    [installedApps]
  );

  const lockSystem = useCallback(() => setLocked(true), []);
  const unlockSystem = useCallback(() => setLocked(false), []);
  const setUser = useCallback((u: { name: string; avatar?: string; password?: string } | null) => {
    setUserState(u);
    if (u) setWelcome(true);
  }, []);

  const value: OSContextValue = {
    windows,
    openApp,
    closeWindow,
    focusWindow,
    minimizeWindow,
    toggleMaximize,
    updateWindowRect,
    restoreWindow,
    getTopWindowId,
    fileSystem,
    saveFile,
    openFileNode,
    wallpaper,
    setWallpaper,
    customWallpapers,
    addCustomWallpaper,
    selectedCustomId,
    setSelectedCustomId,
    theme,
    setTheme,
    quickSettings,
    toggleQuick,
    liteMode,
    setLiteMode,
    taskbarAlign,
    setTaskbarAlign,
    transparency,
    setTransparency,
    startOpen,
    setStartOpen,
    toggleStart,
    installedApps,
    installApp,
    uninstallApp,
    launchInstalledApp,
    isInstalled,
    storeCatalog: STORE_CATALOG,
    locked,
    lockSystem,
    unlockSystem,
    user,
    setUser,
    showWelcome,
    setWelcome,
  };

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
}

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used within OSProvider');
  return ctx;
}
