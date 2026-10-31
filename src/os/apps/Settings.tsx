import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useOS, Wallpaper } from '../OSContext';
import {
  ShellMode,
  DesignEngine,
  LockScreenStyle,
} from '../types';
import { WALLPAPERS } from '../wallpapers';
import { Icon } from '../Icon';

type Section = 'system' | 'personalization' | 'shells' | 'lockscreen' | 'touch' | 'accounts' | 'about';

const PRESET_WALLPAPERS: Wallpaper[] = [
  'live2d',
  'space',
  'aurora',
  'sunset',
  'ocean',
  'forest',
  'cosmic',
  'bloom',
  'shader',
];

export function SettingsApp() {
  const {
    openApp,
    wallpaper,
    setWallpaper,
    shellMode,
    setShellMode,
    taskbarStyle,
    setTaskbarStyle,
    designEngine,
    setDesignEngine,
    blurAmount,
    setBlurAmount,
    cornerRadius,
    setCornerRadius,
    transparency,
    setTransparency,
    customWallpapers,
    addCustomWallpaper,
    selectedCustomId,
    setSelectedCustomId,
    user,
    setUser,
    lockScreenStyle,
    setLockScreenStyle,
    touchMode,
    setTouchMode,
    lockSystem,
  } = useOS();

  const [section, setSection] = useState<Section>('system');
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceName, setDeviceName] = useState('Liquid-Studio');
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempDeviceName, setTempDeviceName] = useState('Liquid-Studio');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');

  // Account editing state
  const [nameInput, setNameInput] = useState(user?.name ?? 'Admin');
  const [avatarInput, setAvatarInput] = useState(user?.avatar ?? 'User');
  const [passInput, setPassInput] = useState(user?.password ?? '');
  const [savedMsg, setSavedMsg] = useState(false);

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'system', label: 'システム', icon: 'Monitor' },
    { id: 'personalization', label: '個人用設定', icon: 'Palette' },
    { id: 'shells', label: 'デスクトップスタイル', icon: 'Layout' },
    { id: 'lockscreen', label: 'ロック画面・スリープ', icon: 'Lock' },
    { id: 'touch', label: 'タッチ操作', icon: 'Hand' },
    { id: 'accounts', label: 'アカウント', icon: 'User' },
    { id: 'about', label: 'バージョン情報', icon: 'Info' },
  ];

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('8MB以内の画像を選択してください');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      addCustomWallpaper(file.name, dataUrl);
    };
    reader.onerror = () => setUploadError('画像の読み込みに失敗しました');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      name: nameInput.trim() || 'Admin',
      avatar: avatarInput,
      password: passInput.trim() || undefined,
    });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempDeviceName.trim()) {
      setDeviceName(tempDeviceName.trim());
    }
    setIsRenaming(false);
  };

  const filteredSections = searchQuery.trim()
    ? sections.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : sections;

  return (
    <div className="flex h-full w-full select-none overflow-hidden font-sans bg-[#111113] text-zinc-100">
      {/* -------------------------------------------------------------
          LEFT MINIMAL NAVIGATION SIDEBAR (WINDOWS 11 MICA STYLE)
         ------------------------------------------------------------- */}
      <div className="w-56 shrink-0 flex flex-col p-2.5 bg-black/40 backdrop-blur-2xl border-r border-white/[0.04]">
        {/* User Mini Profile */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] mb-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-sm">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-zinc-100 truncate">{user?.name || 'Administrator'}</div>
            <div className="text-[10px] text-zinc-500 truncate">ローカル アカウント</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2 px-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
            <Icon name="Search" size={13} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="設定の検索"
            className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] focus:ring-1 focus:ring-sky-500/50 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition"
          />
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto space-y-0.5 px-1">
          {filteredSections.map((s) => {
            const active = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition text-left ${
                  active
                    ? 'bg-white/[0.08] text-white'
                    : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
                }`}
              >
                <div className={`${active ? 'text-sky-400' : 'text-zinc-500'}`}>
                  <Icon name={s.icon} size={15} />
                </div>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* System Version */}
        <div className="pt-2 text-[10px] text-zinc-600 flex items-center justify-between px-3">
          <span>LiquidOS</span>
          <span>4.1.0-Beta</span>
        </div>
      </div>

      {/* -------------------------------------------------------------
          RIGHT CONTENT AREA (CLEAN, MINIMAL, SOPHISTICATED)
         ------------------------------------------------------------- */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6 sm:p-8 space-y-6">
        {/* Device Header Card */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Icon name="Monitor" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-100">{deviceName}</span>
                <button
                  onClick={() => setIsRenaming(true)}
                  className="text-[11px] text-sky-400 hover:underline"
                >
                  名前の変更
                </button>
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">LiquidOS 11 Pro · 64-bit</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-white/[0.03] text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Icon name="Wifi" size={12} className="text-sky-400" /> 接続中
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white/[0.03] text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Icon name="Check" size={12} className="text-emerald-400" /> 最新
            </span>
          </div>
        </div>

        {/* Rename Modal */}
        {isRenaming && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleRenameSubmit} className="w-full max-w-xs rounded-xl bg-zinc-900 border border-white/10 p-4 shadow-2xl space-y-3">
              <div className="text-xs font-semibold text-zinc-200">PC 名の変更</div>
              <input
                type="text"
                value={tempDeviceName}
                onChange={(e) => setTempDeviceName(e.target.value)}
                autoFocus
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-400"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRenaming(false)}
                  className="px-3 py-1 rounded-lg text-xs text-zinc-400 hover:text-white"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold text-xs"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================
            SECTION 1: システム
           ========================================================= */}
        {section === 'system' && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-0.5">システム設定</div>

            {/* Performance / Task Manager */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3.5 flex items-center justify-between hover:bg-white/[0.03] transition">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                  <Icon name="Cpu" size={17} />
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-200">タスク マネージャー</div>
                  <div className="text-[11px] text-zinc-500">プロセスの稼働状況やリソースを確認</div>
                </div>
              </div>
              <button
                onClick={() => openApp('taskmanager')}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-200 transition"
              >
                起動
              </button>
            </div>

            {/* System Monitor */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3.5 flex items-center justify-between hover:bg-white/[0.03] transition">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Icon name="Activity" size={17} />
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-200">システム モニター</div>
                  <div className="text-[11px] text-zinc-500">CPU・メモリ・描画フレームレートの計測</div>
                </div>
              </div>
              <button
                onClick={() => openApp('sysmon')}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-200 transition"
              >
                起動
              </button>
            </div>

            {/* Sound & Music */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3.5 flex items-center justify-between hover:bg-white/[0.03] transition">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Icon name="Volume2" size={17} />
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-200">サウンド</div>
                  <div className="text-[11px] text-zinc-500">システム効果音と音楽プレイヤー</div>
                </div>
              </div>
              <button
                onClick={() => openApp('synth')}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-200 transition"
              >
                開く
              </button>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            SECTION 2: 個人用設定
           ========================================================= */}
        {section === 'personalization' && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-0.5">個人用設定</div>

            {/* Design Engine Selector */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 space-y-3">
              <div className="text-xs font-medium text-zinc-200">ウィンドウ デザイン</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'windows-mica', name: 'Windows Mica' },
                  { id: 'liquid-glass', name: 'Liquid Glass' },
                  { id: 'frosted-blur', name: 'Frosted Blur' },
                  { id: 'dark-slate', name: 'Dark Slate' },
                ].map((eng) => (
                  <button
                    key={eng.id}
                    onClick={() => setDesignEngine(eng.id as DesignEngine)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition text-center ${
                      designEngine === eng.id
                        ? 'bg-sky-500 text-zinc-950 font-semibold shadow-sm'
                        : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200'
                    }`}
                  >
                    {eng.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Wallpapers */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-zinc-200">デスクトップの背景</div>
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg text-xs text-zinc-300 transition flex items-center gap-1"
                  >
                    <Icon name="Plus" size={12} />
                    <span>画像を追加</span>
                  </button>
                </div>
              </div>

              {uploadError && <p className="text-xs text-rose-400">{uploadError}</p>}

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {PRESET_WALLPAPERS.map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      setWallpaper(w);
                      setSelectedCustomId(null);
                    }}
                    className={`relative rounded-lg overflow-hidden h-14 transition border ${
                      wallpaper === w && !selectedCustomId
                        ? 'border-sky-400 ring-2 ring-sky-400/40'
                        : 'border-white/[0.05] hover:border-white/20'
                    }`}
                    style={{ background: (WALLPAPERS[w] ?? WALLPAPERS.live2d).style }}
                  >
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-0.5 text-[9px] text-zinc-200 truncate text-center">
                      {(WALLPAPERS[w] ?? WALLPAPERS.live2d).label}
                    </div>
                  </button>
                ))}

                {customWallpapers.map((cw) => (
                  <button
                    key={cw.id}
                    onClick={() => setSelectedCustomId(cw.id)}
                    className={`relative rounded-lg overflow-hidden h-14 transition border bg-cover bg-center ${
                      selectedCustomId === cw.id
                        ? 'border-sky-400 ring-2 ring-sky-400/40'
                        : 'border-white/[0.05] hover:border-white/20'
                    }`}
                    style={{ backgroundImage: `url(${cw.dataUrl})` }}
                  >
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-0.5 text-[9px] text-zinc-200 truncate text-center">
                      {cw.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders: Blur & Transparency */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 space-y-4">
              <div className="text-xs font-medium text-zinc-200">透明度とぼかし</div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>背景のぼかし</span>
                  <span className="font-mono text-zinc-200">{blurAmount}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={blurAmount}
                  onChange={(e) => setBlurAmount(Number(e.target.value))}
                  className="w-full accent-sky-400 bg-white/10 rounded-lg h-1"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>ウィンドウの透明度</span>
                  <span className="font-mono text-zinc-200">{transparency}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={95}
                  value={transparency}
                  onChange={(e) => setTransparency(Number(e.target.value))}
                  className="w-full accent-sky-400 bg-white/10 rounded-lg h-1"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>角の丸み</span>
                  <span className="font-mono text-zinc-200">{cornerRadius}px</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={28}
                  value={cornerRadius}
                  onChange={(e) => setCornerRadius(Number(e.target.value))}
                  className="w-full accent-sky-400 bg-white/10 rounded-lg h-1"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            SECTION 3: デスクトップスタイル (SHELLS)
           ========================================================= */}
        {section === 'shells' && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-0.5">デスクトップスタイル</div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'windows11', name: 'Windows 11', desc: 'センター配置のタスクバーとモダンUI', icon: 'Monitor' },
                { id: 'windows10', name: 'Windows 10', desc: 'フラットデザインと左下スタート', icon: 'Grid3x3' },
                { id: 'metro', name: 'Windows 8', desc: '全画面スクロールのライブタイル', icon: 'LayoutGrid' },
                { id: 'vista', name: 'Windows Vista', desc: 'エアログラスとサイドバーガジェット', icon: 'Sparkles' },
                { id: 'xp', name: 'Windows XP', desc: '懐かしのルナブルーとクラシックUI', icon: 'Flame' },
                { id: 'mac', name: 'macOS', desc: 'トップバーとマグニファイドDock', icon: 'Apple' },
                { id: 'dex', name: 'Samsung DeX', desc: 'モバイルワークステーション', icon: 'Layers' },
                { id: 'chromeos', name: 'ChromeOS', desc: 'ミニマルなマテリアルシェルフ', icon: 'Globe' },
                { id: 'ubuntu', name: 'Ubuntu Linux', desc: '左サイドバーランチャー', icon: 'SlidersHorizontal' },
                { id: 'zorin', name: 'Zorin OS', desc: '洗練されたエレガントLinux', icon: 'Navigation' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setShellMode(s.id as ShellMode)}
                  className={`p-3 rounded-xl text-left transition border ${
                    shellMode === s.id || (s.id === 'windows11' && shellMode === 'windows') || (s.id === 'metro' && shellMode === 'windows8')
                      ? 'border-sky-500/70 bg-sky-500/10 text-white'
                      : 'border-white/[0.04] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name={s.icon} size={15} className={shellMode === s.id ? 'text-sky-400' : 'text-zinc-500'} />
                    <span className="text-xs font-semibold text-zinc-200">{s.name}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-normal">{s.desc}</p>
                </button>
              ))}
            </div>

            {/* Taskbar Alignment (for Windows mode) */}
            {['windows', 'windows11', 'windows10'].includes(shellMode) && (
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-zinc-200">タスクバーの配置</div>
                  <div className="text-[11px] text-zinc-500">アイコンの配置を中央または左揃えに設定</div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setTaskbarStyle('modern')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      taskbarStyle === 'modern' ? 'bg-sky-500 text-zinc-950 font-semibold' : 'bg-white/[0.04] text-zinc-400'
                    }`}
                  >
                    中央揃え
                  </button>
                  <button
                    onClick={() => setTaskbarStyle('classic')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      taskbarStyle === 'classic' ? 'bg-sky-500 text-zinc-950 font-semibold' : 'bg-white/[0.04] text-zinc-400'
                    }`}
                  >
                    左揃え
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* =========================================================
            SECTION 4: ロック画面・スリープ
           ========================================================= */}
        {section === 'lockscreen' && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-0.5">ロック画面・スリープ</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'hyperos3' as LockScreenStyle,
                  name: 'HyperOS 3',
                  desc: '立体感ある深度時計とスワイプロック解除',
                },
                {
                  id: 'miuix' as LockScreenStyle,
                  name: 'MIUIx',
                  desc: '2段スタック時計とミニマルなタイポグラフィ',
                },
                {
                  id: 'windows-hello' as LockScreenStyle,
                  name: 'Windows Hello',
                  desc: 'アクリルブラーと中央時計のモダンデザイン',
                },
                {
                  id: 'cosmic-liquid' as LockScreenStyle,
                  name: 'Liquid Minimal',
                  desc: 'シンプルな発光デジタル時計',
                },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setLockScreenStyle(style.id)}
                  className={`p-3.5 rounded-xl text-left flex flex-col justify-between transition border ${
                    lockScreenStyle === style.id
                      ? 'border-sky-500/70 bg-sky-500/10 text-white'
                      : 'border-white/[0.04] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-zinc-200 mb-0.5">{style.name}</div>
                    <p className="text-[10px] text-zinc-500">{style.desc}</p>
                  </div>
                  {lockScreenStyle === style.id && (
                    <div className="mt-2 text-[11px] text-sky-400 font-medium flex items-center gap-1">
                      <Icon name="Check" size={12} /> 適用中
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Lock / Sleep button */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200">画面のロック / スリープ</div>
                <div className="text-[11px] text-zinc-500">ロック画面を表示してスリープ状態にします</div>
              </div>
              <button
                onClick={lockSystem}
                className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-200 font-medium transition flex items-center gap-1.5"
              >
                <Icon name="Lock" size={13} />
                <span>ロック</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            SECTION 5: タッチ操作
           ========================================================= */}
        {section === 'touch' && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-0.5">タッチ & タブレット設定</div>

            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200">タッチ操作モード</div>
                <div className="text-[11px] text-zinc-500">タイトルバーやボタンのタッチ領域を拡大</div>
              </div>
              <button
                onClick={() => setTouchMode(!touchMode)}
                className={`w-10 h-5 rounded-full transition p-0.5 flex items-center ${
                  touchMode ? 'bg-sky-500 justify-end' : 'bg-white/20 justify-start'
                }`}
              >
                <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200">Windows 8 タブレットモード</div>
                <div className="text-[11px] text-zinc-500">全画面ライブタイル表示に切り替え</div>
              </div>
              <button
                onClick={() => setShellMode('metro')}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-200 transition"
              >
                切り替え
              </button>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            SECTION 6: アカウント
           ========================================================= */}
        {section === 'accounts' && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-0.5">ユーザー アカウント</div>

            <form onSubmit={handleSaveAccount} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 space-y-3.5 max-w-sm">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">ユーザー名</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">アイコン</label>
                <div className="flex items-center gap-2">
                  {['User', 'Sparkles', 'Shield', 'Bot', 'Terminal'].map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatarInput(av)}
                      className={`p-2 rounded-lg border transition ${
                        avatarInput === av
                          ? 'bg-sky-500/20 border-sky-400 text-sky-400'
                          : 'bg-white/[0.02] border-white/[0.04] text-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      <Icon name={av} size={15} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">パスワード（省略可）</label>
                <input
                  type="password"
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  placeholder="未設定の場合はそのまま起動"
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-400 placeholder-zinc-600"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold text-xs transition"
                >
                  変更を保存
                </button>
                {savedMsg && <span className="text-xs text-emerald-400">保存しました</span>}
              </div>
            </form>
          </motion.div>
        )}

        {/* =========================================================
            SECTION 7: バージョン情報
           ========================================================= */}
        {section === 'about' && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-0.5">システム情報</div>

            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 text-xs space-y-2 text-zinc-400">
              <div className="flex justify-between py-1 border-b border-white/[0.02]">
                <span>デバイス名</span>
                <span className="text-zinc-200 font-mono">{deviceName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.02]">
                <span>OS バージョン</span>
                <span className="text-zinc-200">LiquidOS 4.1.0-Beta</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.02]">
                <span>エディション</span>
                <span className="text-zinc-200">LiquidOS 11 Pro</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.02]">
                <span>プラットフォーム</span>
                <span className="text-zinc-200">Web・PWA</span>
              </div>
              <div className="flex justify-between py-1">
                <span>ビルド番号</span>
                <span className="text-zinc-200 font-mono">26100.1882</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
