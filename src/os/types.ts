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
  { appId: 'synth', label: 'Monochrome Music', icon: 'Music' },
  { appId: 'settings', label: 'Settings', icon: 'Settings' },
];

export type TaskbarAlign = 'center' | 'left';
export type ShellMode =
  | 'windows'
  | 'windows11'
  | 'windows10'
  | 'windows8'
  | 'vista'
  | 'xp'
  | 'dex'
  | 'chromeos'
  | 'mac'
  | 'ubuntu'
  | 'android'
  | 'ios'
  | 'metro';
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
    name: 'Monochrome Music & Synced Lyrics',
    description: 'Stream Hi-Fi lossless music and real-time lyrics via Scramjet & Ultraviolet proxy tunnel.',
    category: 'utilities',
    icon: 'Music',
    author: 'Monochrome Audio',
    rating: 5.0,
    size: '3.1 MB',
    version: '4.0.0',
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

export interface StoreTheme {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  descriptionJa: string;
  author: string;
  category: 'retro' | 'modern' | 'minimal' | 'cyber' | 'nature';
  rating: number;
  downloads: string;
  version: string;
  size: string;
  badge: string;
  previewGradient: string;
  accentColor: string;
  config: {
    shellMode: ShellMode;
    designEngine: DesignEngine;
    wallpaper: 'space' | 'aurora' | 'sunset' | 'ocean' | 'forest' | 'cosmic' | 'bloom' | 'shader';
    theme: 'dark' | 'light';
    blurAmount?: number;
    cornerRadius?: number;
    transparency?: number;
    accentColor?: string;
  };
}

export const STORE_THEMES: StoreTheme[] = [
  {
    id: 'xp-luna',
    name: 'Windows XP Luna Classic',
    nameJa: 'Windows XP ルナ・クラシック',
    description: 'Iconic royal blue taskbar, emerald green Start button, Bliss rolling hills wallpaper, and nostalgic Luna titlebars.',
    descriptionJa: '象徴的なロイヤルブルータスクバー、エメラルドグリーンのスタートボタン、草原の壁紙、懐かしのルナUI。',
    author: 'Microsoft Retro Archives',
    category: 'retro',
    rating: 4.9,
    downloads: '1.4M',
    version: '5.1.2600',
    size: '4.2 MB',
    badge: 'Retro Classic',
    previewGradient: 'from-blue-600 via-sky-500 to-emerald-500',
    accentColor: '#22c55e',
    config: {
      shellMode: 'xp',
      designEngine: 'liquid-glass',
      wallpaper: 'forest',
      theme: 'light',
      blurAmount: 6,
      cornerRadius: 6,
      transparency: 15,
      accentColor: '#16a34a',
    },
  },
  {
    id: 'vista-aero',
    name: 'Windows Vista Aero Glass',
    nameJa: 'Windows Vista アルティメット・エアロ',
    description: 'Frosted smoked glass translucency, radiant Start Orb, and live desktop Sidebar with analog clock and real-time CPU gauges.',
    descriptionJa: 'すりガラスのエアロ透過、光るスタートオーブ、アナログ時計とCPUメーターが動く本物のデスクトップサイドバー。',
    author: 'Aero Design Labs',
    category: 'retro',
    rating: 4.8,
    downloads: '980K',
    version: '6.0.6002',
    size: '5.8 MB',
    badge: 'Aero Glass',
    previewGradient: 'from-slate-900 via-cyan-900 to-teal-500',
    accentColor: '#0ea5e9',
    config: {
      shellMode: 'vista',
      designEngine: 'frosted-blur',
      wallpaper: 'aurora',
      theme: 'dark',
      blurAmount: 18,
      cornerRadius: 8,
      transparency: 28,
      accentColor: '#38bdf8',
    },
  },
  {
    id: 'win10-fluent',
    name: 'Windows 10 Fluent Dark',
    nameJa: 'Windows 10 フルエント・ダーク',
    description: 'Flat sleek dark taskbar, live tiles matrix Start menu, Cortana search pill, and crisp high-contrast window frames.',
    descriptionJa: 'フラットな黒のタスクバー、ライブタイル搭載スタートメニュー、Cortana検索バー、洗練されたダークテーマ。',
    author: 'Redmond Studios',
    category: 'modern',
    rating: 4.9,
    downloads: '2.1M',
    version: '22H2',
    size: '3.6 MB',
    badge: 'Popular',
    previewGradient: 'from-zinc-950 via-slate-900 to-sky-700',
    accentColor: '#0284c7',
    config: {
      shellMode: 'windows10',
      designEngine: 'dark-slate',
      wallpaper: 'bloom',
      theme: 'dark',
      blurAmount: 12,
      cornerRadius: 4,
      transparency: 18,
      accentColor: '#0284c7',
    },
  },
  {
    id: 'win11-mica',
    name: 'Windows 11 Mica Pro',
    nameJa: 'Windows 11 マイカ・プロ',
    description: 'Centered fluent taskbar, floating rounded Mica start surface, subtle glass refractions, and fluid tactile physics.',
    descriptionJa: 'センター配置のタスクバー、角丸フローティングスタート、マイカガラスの屈折と洗練されたモダンUI。',
    author: 'Liquid Systems',
    category: 'modern',
    rating: 5.0,
    downloads: '3.4M',
    version: '23H2',
    size: '6.1 MB',
    badge: 'Flagship',
    previewGradient: 'from-blue-950 via-indigo-950 to-cyan-800',
    accentColor: '#38bdf8',
    config: {
      shellMode: 'windows',
      designEngine: 'windows-mica',
      wallpaper: 'cosmic',
      theme: 'dark',
      blurAmount: 20,
      cornerRadius: 14,
      transparency: 22,
      accentColor: '#38bdf8',
    },
  },
  {
    id: 'win8-metro',
    name: 'Windows 8 Metro Live Tiles',
    nameJa: 'Windows 8 メトロ・ライブタイル',
    description: 'Full-screen animated dynamic tiles, gesture-optimized touch navigation, high-speed app switching, and bold typography.',
    descriptionJa: '全画面で動くアニメーションライブタイル、タッチ操作に特化したジェスチャーUIと大胆なタイポグラフィ。',
    author: 'Metro Interactive',
    category: 'retro',
    rating: 4.7,
    downloads: '750K',
    version: '8.1',
    size: '3.1 MB',
    badge: 'Touch Optimized',
    previewGradient: 'from-teal-950 via-emerald-900 to-cyan-700',
    accentColor: '#06b6d4',
    config: {
      shellMode: 'windows8',
      designEngine: 'dark-slate',
      wallpaper: 'ocean',
      theme: 'dark',
      blurAmount: 8,
      cornerRadius: 2,
      transparency: 10,
      accentColor: '#06b6d4',
    },
  },
  {
    id: 'samsung-dex',
    name: 'Samsung DeX Desktop Pro',
    nameJa: 'Samsung DeX デスクトップ・プロ',
    description: 'Flagship Galaxy multi-window workstation shell with expandable App Drawer, status pill tray, and mobile productivity bar.',
    descriptionJa: 'GalaxyのマルチウィンドウPC体験。アプリドロワー、ステータスピル、モバイルとPCが融合した高生産性バー。',
    author: 'Galaxy Ecosystem',
    category: 'modern',
    rating: 4.8,
    downloads: '1.2M',
    version: 'DeX 5.0',
    size: '4.8 MB',
    badge: 'Productivity',
    previewGradient: 'from-blue-950 via-slate-900 to-indigo-700',
    accentColor: '#3b82f6',
    config: {
      shellMode: 'dex',
      designEngine: 'liquid-glass',
      wallpaper: 'sunset',
      theme: 'dark',
      blurAmount: 16,
      cornerRadius: 12,
      transparency: 25,
      accentColor: '#3b82f6',
    },
  },
  {
    id: 'chromeos-m3',
    name: 'ChromeOS Material You',
    nameJa: 'ChromeOS マテリアル・ユー',
    description: 'Material 3 pill shelf, Everything search button, pastel ambient widgets, quick status tray, and cloud-native speed.',
    descriptionJa: 'Material 3のピルシェルフ、Everythingボタン、パステル調ウィジェットと軽快なクラウドUI。',
    author: 'Chromium Design',
    category: 'minimal',
    rating: 4.7,
    downloads: '890K',
    version: 'M120',
    size: '3.3 MB',
    badge: 'Material 3',
    previewGradient: 'from-violet-950 via-purple-900 to-sky-700',
    accentColor: '#8b5cf6',
    config: {
      shellMode: 'chromeos',
      designEngine: 'frosted-blur',
      wallpaper: 'bloom',
      theme: 'dark',
      blurAmount: 14,
      cornerRadius: 16,
      transparency: 24,
      accentColor: '#8b5cf6',
    },
  },
  {
    id: 'macos-sonoma',
    name: 'macOS Sonoma Liquid Aqua',
    nameJa: 'macOS ソノマ・リキッドアクア',
    description: 'Reflective frosted glass Dock with bounce animations, top system status menu bar, and candy-colored window controls.',
    descriptionJa: '跳ねるフロストガラスDock、トップメニューバー、赤黄緑のキャンディウィンドウボタン。',
    author: 'Cupertino Design Guild',
    category: 'minimal',
    rating: 4.9,
    downloads: '2.8M',
    version: '14.4',
    size: '5.2 MB',
    badge: 'Aqua Glass',
    previewGradient: 'from-pink-950 via-rose-900 to-purple-800',
    accentColor: '#f43f5e',
    config: {
      shellMode: 'mac',
      designEngine: 'liquid-glass',
      wallpaper: 'sunset',
      theme: 'dark',
      blurAmount: 22,
      cornerRadius: 18,
      transparency: 26,
      accentColor: '#f43f5e',
    },
  },
  {
    id: 'cyberpunk-singularity',
    name: 'Cyberpunk 2077 Singularity',
    nameJa: 'サイバーパンク・シンギュラリティ',
    description: 'High-tech neon cyan and toxic green HUD overlays, dark carbon textures, and 3D Raymarching Einstein Ring black hole canvas.',
    descriptionJa: '高輝度ネオンHUD、ダークカーボン質感、アインシュタインリング3Dブラックホールシェーダーが連動。',
    author: 'NightCity Netrunner',
    category: 'cyber',
    rating: 5.0,
    downloads: '1.9M',
    version: '2.077',
    size: '7.5 MB',
    badge: 'Neon 3D',
    previewGradient: 'from-black via-emerald-950 to-cyan-900',
    accentColor: '#10b981',
    config: {
      shellMode: 'windows',
      designEngine: 'cyberpunk-neon',
      wallpaper: 'shader',
      theme: 'dark',
      blurAmount: 16,
      cornerRadius: 4,
      transparency: 30,
      accentColor: '#10b981',
    },
  },
  {
    id: 'sakura-vaporwave',
    name: 'Tokyo Sakura 80s Vaporwave',
    nameJa: '東京 夜桜ヴェイパーウェイヴ',
    description: 'Dreamy pastel magenta and lavender neon gradients, retro wireframes, aesthetic Japanese typography, and lo-fi vibes.',
    descriptionJa: 'マゼンタとラベンダーの夢想的グラデーション、レトロワイヤーフレームとローファイな美学。',
    author: 'Synthwave Society',
    category: 'nature',
    rating: 4.8,
    downloads: '640K',
    version: '1.8.4',
    size: '4.0 MB',
    badge: 'Aesthetic',
    previewGradient: 'from-fuchsia-950 via-purple-900 to-rose-700',
    accentColor: '#ec4899',
    config: {
      shellMode: 'windows10',
      designEngine: 'liquid-glass',
      wallpaper: 'bloom',
      theme: 'dark',
      blurAmount: 20,
      cornerRadius: 12,
      transparency: 24,
      accentColor: '#ec4899',
    },
  },
  {
    id: 'ubuntu-lunar',
    name: 'Ubuntu Linux Cosmic Yaru',
    nameJa: 'Ubuntu Linux コスミック・ヤル',
    description: 'Aubergine and warm orange accents, permanent left application dock launcher, clean status bar, and open-source spirit.',
    descriptionJa: 'オーバージンとオレンジの温かいアクセント、左側の常駐ランチャードック、オープンソースの自由な操作性。',
    author: 'Canonical Community',
    category: 'modern',
    rating: 4.8,
    downloads: '1.1M',
    version: '24.04 LTS',
    size: '3.8 MB',
    badge: 'Linux',
    previewGradient: 'from-amber-950 via-orange-950 to-purple-950',
    accentColor: '#f97316',
    config: {
      shellMode: 'ubuntu',
      designEngine: 'dark-slate',
      wallpaper: 'aurora',
      theme: 'dark',
      blurAmount: 10,
      cornerRadius: 8,
      transparency: 16,
      accentColor: '#ea580c',
    },
  },
  {
    id: 'gargantua-oled',
    name: 'Gargantua Deep Space OLED',
    nameJa: '宇宙ガルガンチュア OLED ピュアブラック',
    description: 'Pure OLED #000000 blacks, high-contrast violet nebula accents, and cinematic 60fps black hole accretion disk.',
    descriptionJa: '完全な漆黒OLEDブラック、高コントラストな紫の星雲、シネマティックな降着円盤3Dシェーダー。',
    author: 'Astrophysics Lab',
    category: 'cyber',
    rating: 5.0,
    downloads: '2.5M',
    version: '3.0.0',
    size: '6.8 MB',
    badge: 'OLED Master',
    previewGradient: 'from-black via-zinc-950 to-violet-950',
    accentColor: '#a855f7',
    config: {
      shellMode: 'windows',
      designEngine: 'liquid-glass',
      wallpaper: 'space',
      theme: 'dark',
      blurAmount: 24,
      cornerRadius: 16,
      transparency: 32,
      accentColor: '#a855f7',
    },
  },
];
