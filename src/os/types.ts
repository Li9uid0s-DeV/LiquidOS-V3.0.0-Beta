export type AppId =
  | 'explorer'
  | 'browser'
  | 'terminal'
  | 'settings'
  | 'notepad'
  | 'game'
  | 'appstore'
  | 'sysmon'
  | 'calendar'
  | 'synth'
  | 'calculator'
  | 'taskmanager';

// Custom installed apps use a string ID prefixed with 'custom:'
export type WindowAppId = AppId | string;

export interface WindowState {
  id: string;
  appId: WindowAppId;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  prevRect?: { x: number; y: number; width: number; height: number };
  payload?: unknown;
}

export interface TaskbarApp {
  appId: AppId;
  label: string;
  icon: string;
}

export const TASKBAR_APPS: TaskbarApp[] = [
  { appId: 'explorer', label: 'File Explorer', icon: 'FolderOpen' },
  { appId: 'browser', label: 'Liquid Browser', icon: 'Globe' },
  { appId: 'terminal', label: 'Terminal', icon: 'SquareTerminal' },
  { appId: 'notepad', label: 'Notepad', icon: 'FileText' },
  { appId: 'calculator', label: 'Calculator Pro', icon: 'Calculator' },
  { appId: 'taskmanager', label: 'Task Manager', icon: 'Cpu' },
  { appId: 'game', label: '3D Arcadium Engine', icon: 'Gamepad2' },
  { appId: 'appstore', label: 'App Store', icon: 'Store' },
  { appId: 'sysmon', label: 'System Monitor', icon: 'Activity' },
  { appId: 'calendar', label: 'Calendar & Tasks', icon: 'Calendar' },
  { appId: 'synth', label: 'Translucent Synth', icon: 'Music' },
  { appId: 'settings', label: 'Settings', icon: 'Settings' },
];

export type TaskbarAlign = 'center' | 'left';
export type ShellMode = 'windows' | 'mac' | 'ubuntu' | 'android' | 'ios' | 'metro';
export type WindowsTaskbarStyle = 'modern' | 'classic';
export type DesignEngine = 'liquid-glass' | 'frosted-blur' | 'windows-mica' | 'dark-slate' | 'cyberpunk-neon';
export type NebulaPreset = 'gargantua' | 'ultraviolet' | 'indigo' | 'cyan-quasar' | 'solar-flare';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  icon: string;
  appId?: AppId;
  read?: boolean;
}

export interface SnapZone {
  side: 'left' | 'right' | 'top';
  preview: { x: number; y: number; width: number; height: number };
}

export interface SnapLayout {
  id: string;
  label: string;
  zones: { x: number; y: number; width: number; height: number }[];
}

export interface CalendarTask {
  id: string;
  title: string;
  date: string;
  time?: string;
  category: 'system' | 'work' | 'personal';
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface UserProfile {
  name: string;
  avatar: string;
  password?: string;
  createdAt: number;
}

// Pre-configured App Store catalog (100% local, offline)
export interface StoreApp {
  id: string;
  name: string;
  description: string;
  category: 'utilities' | 'games';
  icon: string;
  author: string;
  rating: number;
  size: string;
  version: string;
  builtInAppId?: AppId;
}

export const STORE_CATALOG: StoreApp[] = [
  {
    id: 'sysmon',
    name: 'System Monitor Pro',
    description: 'Real-time client-side CPU clock fluctuations, RAM pools, and rendering FPS counter.',
    category: 'utilities',
    icon: 'Activity',
    author: 'Liquid Systems',
    rating: 4.9,
    size: '1.2 MB',
    version: '3.0.0',
    builtInAppId: 'sysmon',
  },
  {
    id: 'calendar',
    name: 'Cosmic Calendar & Tasks',
    description: 'Interactive agenda grid and system task scheduler with priority tags and local persistence.',
    category: 'utilities',
    icon: 'Calendar',
    author: 'Liquid Labs',
    rating: 4.8,
    size: '1.8 MB',
    version: '3.0.0',
    builtInAppId: 'calendar',
  },
  {
    id: 'synth',
    name: 'Translucent Audio Synth',
    description: 'Web Audio API oscillator synth and liquid canvas frequency visualizer.',
    category: 'utilities',
    icon: 'Music',
    author: 'Aura Audio',
    rating: 5.0,
    size: '2.4 MB',
    version: '3.0.0',
    builtInAppId: 'synth',
  },
  {
    id: 'cosmic-maze',
    name: '3D Cosmic Maze',
    description: 'Navigate a neon metallic sphere through 3D floating labyrinth corridors.',
    category: 'games',
    icon: 'Gamepad2',
    author: 'Cosmic Interactive',
    rating: 4.9,
    size: '3.5 MB',
    version: '3.0.0',
    builtInAppId: 'game',
  },
  {
    id: 'slope-runner',
    name: 'Neon Slope Runner',
    description: 'High-velocity endless 3D physics runner down tilting ramps toward the event horizon.',
    category: 'games',
    icon: 'Zap',
    author: 'Velocity Studios',
    rating: 4.9,
    size: '2.8 MB',
    version: '3.0.0',
    builtInAppId: 'game',
  },
  {
    id: 'markdown-studio',
    name: 'Markdown Pro Studio',
    description: 'Distraction-free markdown workspace with live preview and syntax formatting.',
    category: 'utilities',
    icon: 'PenTool',
    author: 'TextCraft',
    rating: 4.7,
    size: '1.5 MB',
    version: '2.4.1',
  },
  {
    id: 'retro-2048',
    name: '2048 Hologram Edition',
    description: 'Slide and merge radiant liquid tiles to reach the 2048 singularity.',
    category: 'games',
    icon: 'Grid3x3',
    author: 'PuzzleCraft',
    rating: 4.8,
    size: '950 KB',
    version: '2.0.0',
  },
  {
    id: 'retro-snake',
    name: 'Neon Quantum Snake',
    description: 'Classic snake with cybernetic neon powerups and particle explosions.',
    category: 'games',
    icon: 'Sparkles',
    author: 'RetroByte',
    rating: 4.6,
    size: '800 KB',
    version: '1.9.0',
  },
];

export interface InstalledApp {
  id: string;          // unique install ID
  appId: string;       // window app ID
  name: string;
  icon: string;
  description: string;
  author: string;
  category: 'utilities' | 'games';
  installedAt: number;
  isCustom?: boolean;
  builtInAppId?: AppId;
}
