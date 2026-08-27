export type AppId =
  | 'explorer'
  | 'browser'
  | 'terminal'
  | 'settings'
  | 'notepad'
  | 'game'
  | 'appstore';

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
  { appId: 'browser', label: 'Browser', icon: 'Globe' },
  { appId: 'terminal', label: 'Terminal', icon: 'SquareTerminal' },
  { appId: 'notepad', label: 'Notepad', icon: 'FileText' },
  { appId: 'game', label: 'Space Runner', icon: 'Gamepad2' },
  { appId: 'appstore', label: 'App Store', icon: 'Store' },
  { appId: 'settings', label: 'Settings', icon: 'Settings' },
];

export type TaskbarAlign = 'center' | 'left';

export interface SnapZone {
  side: 'left' | 'right' | 'top';
  preview: { x: number; y: number; width: number; height: number };
}

export interface SnapLayout {
  id: string;
  label: string;
  zones: { x: number; y: number; width: number; height: number }[];
}

// Pre-configured App Store catalog
export interface StoreApp {
  id: string;
  name: string;
  description: string;
  category: 'utilities' | 'games';
  icon: string;
  url: string;
  author: string;
}

export const STORE_CATALOG: StoreApp[] = [
  {
    id: 'excalidraw',
    name: 'Excalidraw',
    description: 'Virtual whiteboard for sketching hand-drawn diagrams.',
    category: 'utilities',
    icon: 'PenTool',
    url: 'https://excalidraw.com',
    author: 'Excalidraw Team',
  },
  {
    id: 'photopea',
    name: 'Photopea',
    description: 'Online image editor — Photoshop alternative in the browser.',
    category: 'utilities',
    icon: 'ImageIcon',
    url: 'https://www.photopea.com',
    author: 'Photopea',
  },
  {
    id: 'tetr',
    name: 'Tetris',
    description: 'Classic block-stacking puzzle game.',
    category: 'games',
    icon: 'Gamepad2',
    url: 'https://erezgrinberg.github.io/tetris/',
    author: 'Open Source',
  },
  {
    id: '2048',
    name: '2048',
    description: 'Slide and merge numbered tiles to reach 2048.',
    category: 'games',
    icon: 'Grid3x3',
    url: 'https://play2048.co/',
    author: 'Gabriele Cirulli',
  },
  {
    id: 'markdown',
    name: 'Markdown Editor',
    description: 'Live markdown editor with preview pane.',
    category: 'utilities',
    icon: 'FileText',
    url: 'https://stackedit.io/app',
    author: 'Benoit Schweblin',
  },
  {
    id: 'snake',
    name: 'Snake Game',
    description: 'Classic snake game — eat, grow, survive.',
    category: 'games',
    icon: 'Gamepad2',
    url: 'https://www.google.com/logos/2010/pacman10-i.html',
    author: 'Open Source',
  },
];

export interface InstalledApp {
  id: string;          // unique install ID
  appId: string;       // window app ID (custom:<name> or catalog id)
  name: string;
  icon: string;
  url: string;
  description: string;
  author: string;
  category: 'utilities' | 'games';
  installedAt: number;
  isCustom: boolean;   // true = from GitHub URL, false = from catalog
}
