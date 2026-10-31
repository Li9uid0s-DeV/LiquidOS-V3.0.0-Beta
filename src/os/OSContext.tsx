import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import {
  AppId,
  WindowState,
  TaskbarAlign,
  ShellMode,
  WindowsTaskbarStyle,
  DesignEngine,
  NebulaPreset,
  LockScreenStyle,
  InstalledApp,
  StoreApp,
  STORE_CATALOG,
  StoreTheme,
  STORE_THEMES,
  CalendarTask,
  UserProfile,
  NotificationItem,
} from './types';
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

export interface CustomWallpaper {
  id: string;
  name: string;
  dataUrl: string;
}

export interface OpenOptions {
  title?: string;
  payload?: unknown;
  width?: number;
  height?: number;
  icon?: string;
}

export interface OSContextValue {
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
  createFolder: (path: string[], folderName: string) => void;
  deleteNode: (path: string[], nodeName: string) => void;
  openFileNode: (node: VirtualNode) => void;
  recycleFile: (path: string[], nodeName: string) => void;
  emptyRecycleBin: () => void;
  restoreRecycleFile: (nodeName: string) => void;

  wallpaper: Wallpaper;
  setWallpaper: (w: Wallpaper) => void;
  customWallpapers: CustomWallpaper[];
  addCustomWallpaper: (name: string, dataUrl: string) => void;
  selectedCustomId: string | null;
  setSelectedCustomId: (id: string | null) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;

  // Customization & Shell Engines
  shellMode: ShellMode;
  setShellMode: (mode: ShellMode) => void;
  taskbarStyle: WindowsTaskbarStyle;
  setTaskbarStyle: (style: WindowsTaskbarStyle) => void;
  designEngine: DesignEngine;
  setDesignEngine: (engine: DesignEngine) => void;
  nebulaPreset: NebulaPreset;
  setNebulaPreset: (preset: NebulaPreset) => void;

  // Fine-grain sliders
  blurAmount: number;
  setBlurAmount: (v: number) => void;
  cornerRadius: number;
  setCornerRadius: (v: number) => void;
  transparency: number;
  setTransparency: (v: number) => void;
  animSpeed: number;
  setAnimSpeed: (v: number) => void;

  quickSettings: { wifi: boolean; bluetooth: boolean; darkMode: boolean };
  toggleQuick: (key: 'wifi' | 'bluetooth' | 'darkMode') => void;

  // Android & iOS Mobile Quick Controls
  androidQuickSettings: {
    wifi: boolean;
    bluetooth: boolean;
    flashlight: boolean;
    airplane: boolean;
    batterySaver: boolean;
    doNotDisturb: boolean;
  };
  toggleAndroidQuick: (key: 'wifi' | 'bluetooth' | 'flashlight' | 'airplane' | 'batterySaver' | 'doNotDisturb') => void;
  volume: number;
  setVolume: (v: number) => void;
  brightness: number;
  setBrightness: (v: number) => void;

  // Dynamic Island
  dynamicIslandEvent: { title: string; subtitle?: string; icon?: string } | null;
  triggerDynamicIsland: (title: string, subtitle?: string, icon?: string) => void;

  liteMode: boolean;
  setLiteMode: (v: boolean) => void;
  taskbarAlign: TaskbarAlign;
  setTaskbarAlign: (a: TaskbarAlign) => void;

  startOpen: boolean;
  setStartOpen: (v: boolean) => void;
  toggleStart: () => void;

  // App Store & Installed Apps
  installedApps: InstalledApp[];
  installApp: (app: StoreApp) => void;
  uninstallApp: (appId: string) => void;
  launchInstalledApp: (appId: string) => void;
  isInstalled: (appId: string) => boolean;
  storeCatalog: StoreApp[];

  // Themes Catalog & Downloads
  storeThemes: StoreTheme[];
  installedThemeIds: string[];
  currentThemeId: string | null;
  installTheme: (themeId: string) => void;
  uninstallTheme: (themeId: string) => void;
  applyThemeConfig: (themeId: string) => void;
  isThemeInstalled: (themeId: string) => boolean;

  // Calendar & Task Scheduler
  calendarTasks: CalendarTask[];
  addTask: (task: Omit<CalendarTask, 'id'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  // Lock screen & Security
  locked: boolean;
  lockSystem: () => void;
  unlockSystem: () => void;

  // User Profile
  user: UserProfile | null;
  setUser: (u: UserProfile | null) => void;
  showWelcome: boolean;
  setWelcome: (v: boolean) => void;

  // Notification Center
  notifications: NotificationItem[];
  addNotification: (n: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  clearNotifications: () => void;
  dismissNotification: (id: string) => void;

  // System Flyouts
  widgetsOpen: boolean;
  toggleWidgets: () => void;
  copilotOpen: boolean;
  toggleCopilot: () => void;
  controlCenterOpen: boolean;
  toggleControlCenter: () => void;
  launchpadOpen: boolean;
  toggleLaunchpad: () => void;

  // Lock Screen Customizer & Touch Mode
  lockScreenStyle: LockScreenStyle;
  setLockScreenStyle: (style: LockScreenStyle) => void;
  touchMode: boolean;
  setTouchMode: (val: boolean | ((prev: boolean) => boolean)) => void;

  // Sound effects
  playSound: (type: 'open' | 'click' | 'lock' | 'notify') => void;
}

const OSContext = createContext<OSContextValue | null>(null);

const APP_DEFAULTS: Record<AppId, { title: string; icon: string; width: number; height: number }> = {
  explorer: { title: 'File Explorer', icon: 'FolderOpen', width: 800, height: 530 },
  browser: { title: 'Liquid Browser', icon: 'Globe', width: 920, height: 600 },
  terminal: { title: 'Terminal', icon: 'SquareTerminal', width: 700, height: 450 },
  settings: { title: 'Settings', icon: 'Settings', width: 780, height: 560 },
  notepad: { title: 'Notepad', icon: 'FileText', width: 640, height: 500 },
  game: { title: 'Cosmic Velocity 3D', icon: 'Flame', width: 880, height: 590 },
  appstore: { title: 'App Store', icon: 'Store', width: 850, height: 610 },
  calculator: { title: 'Calculator Pro', icon: 'Calculator', width: 380, height: 540 },
  taskmanager: { title: 'Task Manager', icon: 'Cpu', width: 740, height: 510 },
  sysmon: { title: 'System Monitor', icon: 'Activity', width: 740, height: 520 },
  calendar: { title: 'Calendar & Tasks', icon: 'Calendar', width: 820, height: 550 },
  synth: { title: 'Monochrome Music', icon: 'Music', width: 880, height: 580 },
  weather: { title: 'Cosmic Weather Forecast', icon: 'CloudSun', width: 840, height: 580 },
  clock: { title: 'Clock & Alarms', icon: 'Clock', width: 780, height: 540 },
  ai: { title: 'Liquid Copilot Pro AI', icon: 'Bot', width: 860, height: 600 },
};

const INITIAL_TASKS: CalendarTask[] = [
  { id: 'task-1', title: 'Calibrate Gravitational Lensing Shader', date: '2026-08-27', time: '14:00', category: 'system', completed: true, priority: 'high' },
  { id: 'task-2', title: 'Inspect Liquid Glass Refraction Scale', date: '2026-08-27', time: '16:30', category: 'work', completed: false, priority: 'medium' },
  { id: 'task-3', title: 'Synthesize Ambient Space Harmonics', date: '2026-08-28', time: '11:00', category: 'personal', completed: false, priority: 'low' },
];

const LS_KEY = 'liquid-os-v3-settings';
const LS_APPS_KEY = 'liquid-os-v3-installed-apps';
const LS_THEMES_KEY = 'liquid-os-v3-installed-themes';
const LS_CURRENT_THEME_KEY = 'liquid-os-v3-current-theme';
const LS_TASKS_KEY = 'liquid-os-v3-calendar-tasks';
const LS_FS_KEY = 'liquid-os-v3-filesystem';

function loadPersisted<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore parse error
  }
  return fallback;
}

export function OSProvider({ children }: { children: ReactNode }) {
  const persistedSettings = loadPersisted<Record<string, unknown>>(LS_KEY, {});

  const [windows, setWindows] = useState<WindowState[]>([]);
  const zCounter = useRef(60);
  const idCounter = useRef(0);

  const [fileSystem, setFileSystem] = useState<VirtualFolder>(() =>
    loadPersisted<VirtualFolder>(LS_FS_KEY, getInitialFileSystem())
  );

  const [wallpaper, setWallpaper] = useState<Wallpaper>(persistedSettings.wallpaper ?? 'space');
  const [customWallpapers, setCustomWallpapers] = useState<CustomWallpaper[]>(persistedSettings.customWallpapers ?? []);
  const [selectedCustomId, setSelectedCustomId] = useState<string | null>(persistedSettings.selectedCustomId ?? null);
  const [theme, setTheme] = useState<Theme>(persistedSettings.theme ?? 'dark');

  // Shell & Design Engines — Automated Mobile/Touch Matrix Detection
  const [shellMode, setShellMode] = useState<ShellMode>(() => {
    if (typeof window !== 'undefined') {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth < 768;
      if (isMobile) return 'metro';
    }
    return (persistedSettings.shellMode as ShellMode) ?? 'windows';
  });
  const [taskbarStyle, setTaskbarStyle] = useState<WindowsTaskbarStyle>(persistedSettings.taskbarStyle ?? 'modern');
  const [designEngine, setDesignEngine] = useState<DesignEngine>(persistedSettings.designEngine ?? 'liquid-glass');
  const [nebulaPreset, setNebulaPreset] = useState<NebulaPreset>(persistedSettings.nebulaPreset ?? 'gargantua');

  // Touch Device Detection without forcefully breaking window management
  useEffect(() => {
    const handleTouch = (e: TouchEvent | PointerEvent) => {
      if ('pointerType' in e && e.pointerType !== 'touch') return;
      // Mark touchMode as enabled for touch-friendly UI spacing & controls
      setTouchMode(true);
    };

    window.addEventListener('touchstart', handleTouch, { passive: true });
    window.addEventListener('pointerdown', handleTouch, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('pointerdown', handleTouch);
    };
  }, []);

  // Sliders
  const [blurAmount, setBlurAmount] = useState<number>(persistedSettings.blurAmount ?? 24);
  const [cornerRadius, setCornerRadius] = useState<number>(persistedSettings.cornerRadius ?? 16);
  const [transparency, setTransparency] = useState<number>(persistedSettings.transparency ?? 75);
  const [animSpeed, setAnimSpeed] = useState<number>(persistedSettings.animSpeed ?? 1.0);

  const [quickSettings, setQuickSettings] = useState<{ wifi: boolean; bluetooth: boolean; darkMode: boolean }>(
    persistedSettings.quickSettings ?? { wifi: true, bluetooth: false, darkMode: true }
  );
  const [liteMode, setLiteMode] = useState<boolean>(persistedSettings.liteMode ?? false);
  const [taskbarAlign, setTaskbarAlign] = useState<TaskbarAlign>(persistedSettings.taskbarAlign ?? 'center');
  const [startOpen, setStartOpen] = useState(false);

  const [installedApps, setInstalledApps] = useState<InstalledApp[]>(() =>
    loadPersisted<InstalledApp[]>(LS_APPS_KEY, [
      {
        id: 'sysmon',
        appId: 'sysmon',
        name: 'System Monitor Pro',
        icon: 'Activity',
        description: 'Real-time CPU and FPS counter',
        author: 'Liquid Systems',
        category: 'utilities',
        installedAt: Date.now(),
        builtInAppId: 'sysmon',
      },
      {
        id: 'calendar',
        appId: 'calendar',
        name: 'Cosmic Calendar',
        icon: 'Calendar',
        description: 'Interactive agenda grid',
        author: 'Liquid Labs',
        category: 'utilities',
        installedAt: Date.now(),
        builtInAppId: 'calendar',
      },
      {
        id: 'synth',
        appId: 'synth',
        name: 'Monochrome Music',
        icon: 'Music',
        description: 'Hi-Fi music streaming and synced lyrics via Scramjet & Ultraviolet proxy',
        author: 'Monochrome Audio',
        category: 'utilities',
        installedAt: Date.now(),
        builtInAppId: 'synth',
      },
    ])
  );

  const [installedThemeIds, setInstalledThemeIds] = useState<string[]>(() =>
    loadPersisted<string[]>(LS_THEMES_KEY, ['win11-mica', 'vista-aero', 'xp-luna'])
  );
  const [currentThemeId, setCurrentThemeId] = useState<string | null>(() =>
    loadPersisted<string | null>(LS_CURRENT_THEME_KEY, 'win11-mica')
  );

  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>(() =>
    loadPersisted<CalendarTask[]>(LS_TASKS_KEY, INITIAL_TASKS)
  );

  // Dynamic Island state & trigger
  const [dynamicIslandEvent, setDynamicIslandEvent] = useState<{ title: string; subtitle?: string; icon?: string } | null>(null);
  const dynamicIslandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerDynamicIsland = useCallback((title: string, subtitle?: string, icon?: string) => {
    setDynamicIslandEvent({ title, subtitle, icon });
    if (dynamicIslandTimer.current) clearTimeout(dynamicIslandTimer.current);
    dynamicIslandTimer.current = setTimeout(() => {
      setDynamicIslandEvent(null);
    }, 4000);
  }, []);

  // Android Quick Settings & Mobile Controls
  const [androidQuickSettings, setAndroidQuickSettings] = useState({
    wifi: true,
    bluetooth: false,
    flashlight: false,
    airplane: false,
    batterySaver: false,
    doNotDisturb: false,
  });
  const [volume, setVolume] = useState(80);
  const [brightness, setBrightness] = useState(90);

  const toggleAndroidQuick = useCallback((key: 'wifi' | 'bluetooth' | 'flashlight' | 'airplane' | 'batterySaver' | 'doNotDisturb') => {
    setAndroidQuickSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      triggerDynamicIsland(`${key.toUpperCase()} ${next[key] ? 'Enabled' : 'Disabled'}`, 'Android Quick Settings', 'SlidersHorizontal');
      return next;
    });
  }, [triggerDynamicIsland]);

  const [locked, setLocked] = useState(false);
  const [lockScreenStyle, setLockScreenStyle] = useState<LockScreenStyle>(
    (persistedSettings.lockScreenStyle as LockScreenStyle) ?? 'hyperos3'
  );
  const [touchMode, setTouchMode] = useState<boolean>(persistedSettings.touchMode === true);
  const [user, setUserState] = useState<UserProfile | null>(persistedSettings.user ?? null);
  const [showWelcome, setWelcome] = useState(false);

  // Notifications State & Initial Seed
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => [
    {
      id: 'notif-welcome',
      title: 'System Ready',
      message: 'LiquidOS 4.1.0 workstation environment is active.',
      time: 'Just now',
      app: 'System',
      icon: 'Shield',
      unread: true,
      timestamp: Date.now(),
    },
    {
      id: 'notif-driver',
      title: 'Display Compositor',
      message: 'Hardware acceleration and fluid compositor enabled.',
      time: '2 mins ago',
      app: 'Settings',
      icon: 'Monitor',
      unread: false,
      timestamp: Date.now() - 120000,
    },
  ]);

  const addNotification = useCallback((n: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    const newNotif: NotificationItem = {
      ...n,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: Date.now(),
      unread: true,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // System Flyouts State
  const [widgetsOpen, setWidgetsOpen] = useState(false);
  const toggleWidgets = useCallback(() => setWidgetsOpen((v) => !v), []);

  const [copilotOpen, setCopilotOpen] = useState(false);
  const toggleCopilot = useCallback(() => setCopilotOpen((v) => !v), []);

  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const toggleControlCenter = useCallback(() => setControlCenterOpen((v) => !v), []);

  const [launchpadOpen, setLaunchpadOpen] = useState(false);
  const toggleLaunchpad = useCallback(() => setLaunchpadOpen((v) => !v), []);

  // Sync CSS variables with custom slider values
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-blur', `${blurAmount}px`);
    document.documentElement.style.setProperty('--theme-opacity', `${(100 - transparency) / 100}`);
    document.documentElement.style.setProperty('--theme-radius', `${cornerRadius}px`);
  }, [blurAmount, transparency, cornerRadius]);

  // Persist Settings
  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          wallpaper,
          customWallpapers,
          selectedCustomId,
          theme,
          shellMode,
          taskbarStyle,
          designEngine,
          nebulaPreset,
          blurAmount,
          cornerRadius,
          transparency,
          animSpeed,
          quickSettings,
          liteMode,
          taskbarAlign,
          user,
          lockScreenStyle,
          touchMode,
        })
      );
    } catch {
      // Ignore quota error
    }
  }, [
    wallpaper,
    customWallpapers,
    selectedCustomId,
    theme,
    shellMode,
    taskbarStyle,
    designEngine,
    nebulaPreset,
    blurAmount,
    cornerRadius,
    transparency,
    animSpeed,
    quickSettings,
    liteMode,
    taskbarAlign,
    user,
    lockScreenStyle,
    touchMode,
  ]);

  // Persist Apps
  useEffect(() => {
    try {
      localStorage.setItem(LS_APPS_KEY, JSON.stringify(installedApps));
    } catch {
      // Ignore quota error
    }
  }, [installedApps]);

  // Persist Themes
  useEffect(() => {
    try {
      localStorage.setItem(LS_THEMES_KEY, JSON.stringify(installedThemeIds));
    } catch {
      // Ignore quota error
    }
  }, [installedThemeIds]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_CURRENT_THEME_KEY, JSON.stringify(currentThemeId));
    } catch {
      // Ignore quota error
    }
  }, [currentThemeId]);

  // Persist Calendar Tasks
  useEffect(() => {
    try {
      localStorage.setItem(LS_TASKS_KEY, JSON.stringify(calendarTasks));
    } catch {
      // Ignore quota error
    }
  }, [calendarTasks]);

  // Persist File System
  useEffect(() => {
    try {
      localStorage.setItem(LS_FS_KEY, JSON.stringify(fileSystem));
    } catch {
      // Ignore quota error
    }
  }, [fileSystem]);

  // Synthetic Audio feedback using Web Audio API
  const playSound = useCallback((type: 'open' | 'click' | 'lock' | 'notify') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'open') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'lock') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'notify') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch {
      // AudioContext might be blocked until user gesture
    }
  }, []);

  const focusWindow = useCallback((id: string) => {
    zCounter.current += 1;
    const z = zCounter.current;
    setWindows((ws) =>
      ws.map((w) => (w.id === id ? { ...w, zIndex: z, minimized: false } : w))
    );
  }, []);

  const openApp = useCallback(
    (appId: AppId, opts?: OpenOptions) => {
      playSound('open');
      const existing = windows.find((w) => w.appId === appId);
      if (existing && appId !== 'notepad') {
        focusWindow(existing.id);
        return;
      }
      const def = APP_DEFAULTS[appId] ?? {
        title: 'Application',
        icon: 'Sparkles',
        width: 760,
        height: 520,
      };
      idCounter.current += 1;
      const id = `win-${idCounter.current}`;
      zCounter.current += 1;
      const count = windows.length;
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      const width = Math.min(vw - 20, opts?.width ?? def.width);
      const height = Math.min(vh - 70, opts?.height ?? def.height);
      const maxX = Math.max(10, vw - width - 20);
      const maxY = Math.max(10, vh - height - 60);
      const x = Math.max(10, Math.min(maxX, 32 + (count % 8) * 32));
      const y = Math.max(10, Math.min(maxY, 28 + (count % 8) * 26));
      const win: WindowState = {
        id,
        appId,
        title: opts?.title ?? def.title,
        icon: opts?.icon ?? def.icon,
        x,
        y,
        width,
        height,
        zIndex: zCounter.current,
        minimized: false,
        maximized: false,
        payload: opts?.payload,
      };
      setWindows((ws) => [...ws, win]);
    },
    [windows, focusWindow, playSound]
  );

  const launchInstalledApp = useCallback(
    (appId: string) => {
      playSound('open');
      const storeItem = STORE_CATALOG.find((s) => s.id === appId);
      if (storeItem?.builtInAppId) {
        openApp(storeItem.builtInAppId);
        return;
      }
      const app = installedApps.find((a) => a.appId === appId || a.id === appId);
      if (!app) return;
      if (app.builtInAppId) {
        openApp(app.builtInAppId);
        return;
      }
      const existing = windows.find((w) => w.appId === app.appId);
      if (existing) {
        focusWindow(existing.id);
        return;
      }
      idCounter.current += 1;
      const id = `win-${idCounter.current}`;
      zCounter.current += 1;
      const count = windows.length;
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      const width = Math.min(vw - 20, 840);
      const height = Math.min(vh - 70, 560);
      const maxX = Math.max(10, vw - width - 20);
      const maxY = Math.max(10, vh - height - 60);
      const x = Math.max(10, Math.min(maxX, 40 + (count % 8) * 32));
      const y = Math.max(10, Math.min(maxY, 32 + (count % 8) * 26));
      const win: WindowState = {
        id,
        appId: app.appId,
        title: app.name,
        icon: app.icon,
        x,
        y,
        width,
        height,
        zIndex: zCounter.current,
        minimized: false,
        maximized: false,
        payload: { appInfo: app },
      };
      setWindows((ws) => [...ws, win]);
    },
    [installedApps, windows, focusWindow, openApp, playSound]
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

  const createFolder = useCallback((path: string[], folderName: string) => {
    setFileSystem((fs) => {
      const clone: VirtualFolder = JSON.parse(JSON.stringify(fs));
      let folder = clone;
      for (const seg of path) {
        const next = folder.children.find((c) => c.name === seg && c.kind === 'folder');
        if (!next || next.kind !== 'folder') return fs;
        folder = next;
      }
      if (!folder.children.some((c) => c.name === folderName)) {
        folder.children.push({
          id: `folder-${Date.now()}`,
          name: folderName,
          kind: 'folder',
          children: [],
          createdAt: Date.now(),
        });
      }
      return clone;
    });
  }, []);

  const deleteNode = useCallback((path: string[], nodeName: string) => {
    setFileSystem((fs) => {
      const clone: VirtualFolder = JSON.parse(JSON.stringify(fs));
      let folder = clone;
      for (const seg of path) {
        const next = folder.children.find((c) => c.name === seg && c.kind === 'folder');
        if (!next || next.kind !== 'folder') return fs;
        folder = next;
      }
      folder.children = folder.children.filter((c) => c.name !== nodeName);
      return clone;
    });
  }, []);

  const recycleFile = useCallback((path: string[], nodeName: string) => {
    setFileSystem((fs) => {
      const clone: VirtualFolder = JSON.parse(JSON.stringify(fs));
      let folder = clone;
      for (const seg of path) {
        const next = folder.children.find((c) => c.name === seg && c.kind === 'folder');
        if (!next || next.kind !== 'folder') return fs;
        folder = next;
      }
      const targetIdx = folder.children.findIndex((c) => c.name === nodeName);
      if (targetIdx === -1) return fs;
      const [item] = folder.children.splice(targetIdx, 1);

      // Find or create recycle bin folder in root
      let trashFolder = clone.children.find((c) => c.id === 'trash' || c.name.toLowerCase().includes('recycle') || c.name.toLowerCase().includes('trash'));
      if (!trashFolder || trashFolder.kind !== 'folder') {
        trashFolder = { id: 'trash', name: 'Recycle Bin', kind: 'folder', children: [] };
        clone.children.push(trashFolder);
      }
      (trashFolder as VirtualFolder).children.push(item);
      return clone;
    });
    playSound('notify');
  }, [playSound]);

  const emptyRecycleBin = useCallback(() => {
    setFileSystem((fs) => {
      const clone: VirtualFolder = JSON.parse(JSON.stringify(fs));
      const trashFolder = clone.children.find((c) => c.id === 'trash' || c.name.toLowerCase().includes('recycle') || c.name.toLowerCase().includes('trash'));
      if (trashFolder && trashFolder.kind === 'folder') {
        trashFolder.children = [];
      }
      return clone;
    });
    playSound('click');
  }, [playSound]);

  const restoreRecycleFile = useCallback((nodeName: string) => {
    setFileSystem((fs) => {
      const clone: VirtualFolder = JSON.parse(JSON.stringify(fs));
      const trashFolder = clone.children.find((c) => c.id === 'trash' || c.name.toLowerCase().includes('recycle') || c.name.toLowerCase().includes('trash'));
      if (!trashFolder || trashFolder.kind !== 'folder') return fs;
      const targetIdx = trashFolder.children.findIndex((c) => c.name === nodeName);
      if (targetIdx === -1) return fs;
      const [item] = trashFolder.children.splice(targetIdx, 1);

      // Restore into Documents or root
      const docsFolder = clone.children.find((c) => c.id === 'documents' || c.name === 'Documents');
      if (docsFolder && docsFolder.kind === 'folder') {
        docsFolder.children.push(item);
      } else {
        clone.children.push(item);
      }
      return clone;
    });
    playSound('open');
  }, [playSound]);

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
          width: 640,
          height: 500,
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

  const installApp = useCallback((app: StoreApp) => {
    playSound('notify');
    setInstalledApps((list) => {
      if (list.some((a) => a.id === app.id)) return list;
      return [
        ...list,
        {
          id: app.id,
          appId: app.builtInAppId ?? app.id,
          name: app.name,
          icon: app.icon,
          description: app.description,
          author: app.author,
          category: app.category,
          installedAt: Date.now(),
          builtInAppId: app.builtInAppId,
        },
      ];
    });
  }, [playSound]);

  const uninstallApp = useCallback((appId: string) => {
    playSound('click');
    setInstalledApps((list) => list.filter((a) => a.id !== appId && a.appId !== appId));
  }, [playSound]);

  const isInstalled = useCallback(
    (appId: string) => installedApps.some((a) => a.id === appId || a.appId === appId),
    [installedApps]
  );

  // Theme Operations
  const isThemeInstalled = useCallback(
    (themeId: string) => installedThemeIds.includes(themeId),
    [installedThemeIds]
  );

  const installTheme = useCallback((themeId: string) => {
    playSound('notify');
    setInstalledThemeIds((prev) => (prev.includes(themeId) ? prev : [...prev, themeId]));
    const target = STORE_THEMES.find((t) => t.id === themeId);
    if (target) {
      addNotification({
        title: 'Theme Downloaded',
        message: `${target.name} has been added to your theme library.`,
        icon: 'Palette',
      });
      triggerDynamicIsland(target.name, 'Theme Downloaded', 'Palette');
    }
  }, [playSound, addNotification, triggerDynamicIsland]);

  const uninstallTheme = useCallback((themeId: string) => {
    playSound('click');
    setInstalledThemeIds((prev) => prev.filter((id) => id !== themeId));
    if (currentThemeId === themeId) {
      setCurrentThemeId(null);
    }
  }, [playSound, currentThemeId]);

  const applyThemeConfig = useCallback((themeId: string) => {
    const target = STORE_THEMES.find((t) => t.id === themeId);
    if (!target) return;
    playSound('open');
    setShellMode(target.config.shellMode);
    setDesignEngine(target.config.designEngine);
    setWallpaper(target.config.wallpaper);
    setTheme(target.config.theme);
    if (target.config.blurAmount !== undefined) setBlurAmount(target.config.blurAmount);
    if (target.config.cornerRadius !== undefined) setCornerRadius(target.config.cornerRadius);
    if (target.config.transparency !== undefined) setTransparency(target.config.transparency);
    setCurrentThemeId(themeId);

    setInstalledThemeIds((prev) => (prev.includes(themeId) ? prev : [...prev, themeId]));

    addNotification({
      title: 'Theme Applied',
      message: `Active theme changed to ${target.name}.`,
      icon: 'Palette',
    });
    triggerDynamicIsland(target.name, 'Theme Activated', 'Check');
  }, [playSound, addNotification, triggerDynamicIsland]);

  // Calendar Task Operations
  const addTask = useCallback((task: Omit<CalendarTask, 'id'>) => {
    const id = `task-${Date.now()}`;
    setCalendarTasks((prev) => [
      { id, ...task },
      ...prev,
    ]);
  }, []);

  const toggleTask = useCallback((id: string) => {
    setCalendarTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setCalendarTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const lockSystem = useCallback(() => {
    playSound('lock');
    setLocked(true);
  }, [playSound]);

  const unlockSystem = useCallback(() => {
    playSound('open');
    setLocked(false);
  }, [playSound]);

  const setUser = useCallback((u: UserProfile | null) => {
    setUserState(u);
    if (u) {
      setWelcome(true);
    }
  }, []);

  // System auto-sleep after 5 minutes of idle
  useEffect(() => {
    let timer: number;
    const resetIdle = () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!locked && user) {
          lockSystem();
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    window.addEventListener('mousemove', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    resetIdle();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
    };
  }, [locked, user, lockSystem]);

  // Global Keyboard Shortcuts (e.g. Win+L to lock system)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Super/Alt/Meta + L
      if ((e.metaKey || e.altKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        lockSystem();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lockSystem]);

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
    createFolder,
    deleteNode,
    openFileNode,
    recycleFile,
    emptyRecycleBin,
    restoreRecycleFile,
    wallpaper,
    setWallpaper,
    customWallpapers,
    addCustomWallpaper,
    selectedCustomId,
    setSelectedCustomId,
    theme,
    setTheme,
    shellMode,
    setShellMode,
    taskbarStyle,
    setTaskbarStyle,
    designEngine,
    setDesignEngine,
    nebulaPreset,
    setNebulaPreset,
    blurAmount,
    setBlurAmount,
    cornerRadius,
    setCornerRadius,
    transparency,
    setTransparency,
    animSpeed,
    setAnimSpeed,
    quickSettings,
    toggleQuick,
    androidQuickSettings,
    toggleAndroidQuick,
    volume,
    setVolume,
    brightness,
    setBrightness,
    dynamicIslandEvent,
    triggerDynamicIsland,
    liteMode,
    setLiteMode,
    taskbarAlign,
    setTaskbarAlign,
    startOpen,
    setStartOpen,
    toggleStart,
    installedApps,
    installApp,
    uninstallApp,
    launchInstalledApp,
    isInstalled,
    storeCatalog: STORE_CATALOG,
    storeThemes: STORE_THEMES,
    installedThemeIds,
    currentThemeId,
    installTheme,
    uninstallTheme,
    applyThemeConfig,
    isThemeInstalled,
    calendarTasks,
    addTask,
    toggleTask,
    deleteTask,
    locked,
    lockSystem,
    unlockSystem,
    user,
    setUser,
    showWelcome,
    setWelcome,
    notifications,
    addNotification,
    clearNotifications,
    dismissNotification,
    widgetsOpen,
    toggleWidgets,
    copilotOpen,
    toggleCopilot,
    controlCenterOpen,
    toggleControlCenter,
    launchpadOpen,
    toggleLaunchpad,
    lockScreenStyle,
    setLockScreenStyle,
    touchMode,
    setTouchMode,
    playSound,
  };

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
}

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used within OSProvider');
  return ctx;
}
