import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useOS, Wallpaper, AuroraColor } from '../OSContext';
import {
  ShellMode,
  DesignEngine,
  LockScreenStyle,
} from '../types';
import { WALLPAPERS } from '../wallpapers';
import { Icon } from '../Icon';

type Section = 'glass' | 'aurora' | 'personalization' | 'shells' | 'lockscreen' | 'system' | 'accounts';

const PRESET_WALLPAPERS: Wallpaper[] = [
  'live2d',
  'aurora',
  'ocean',
  'sunset',
  'forest',
  'bloom',
  'cosmic',
  'space',
  'shader',
];

const AURORA_THEMES: { id: AuroraColor; label: string; preview: string }[] = [
  {
    id: 'cyan-violet',
    label: 'シアン & バイオレット',
    preview: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 50%, #a855f7 100%)',
  },
  {
    id: 'emerald-sky',
    label: 'エメラルド & スカイ',
    preview: 'linear-gradient(135deg, #34d399 0%, #14b8a6 50%, #38bdf8 100%)',
  },
  {
    id: 'rose-gold',
    label: 'ローズ & アンバー',
    preview: 'linear-gradient(135deg, #fb7185 0%, #f59e0b 50%, #d946ef 100%)',
  },
  {
    id: 'ocean-blue',
    label: 'ディープオーシャン',
    preview: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 50%, #06b6d4 100%)',
  },
  {
    id: 'sunset-magenta',
    label: 'マゼンタ & サンセット',
    preview: 'linear-gradient(135deg, #f472b6 0%, #9333ea 50%, #6366f1 100%)',
  },
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
    glassCurvature,
    setGlassCurvature,
    glassSpecular,
    setGlassSpecular,
    glassWobble,
    setGlassWobble,
    auroraColor,
    setAuroraColor,
    auroraSpeed,
    setAuroraSpeed,
    auroraIntensity,
    setAuroraIntensity,
    auroraParticles,
    setAuroraParticles,
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
    soundEnabled,
    setSoundEnabled,
  } = useOS();

  const [section, setSection] = useState<Section>('glass');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');

  const [nameInput, setNameInput] = useState(user?.name ?? 'User');
  const [avatarInput, setAvatarInput] = useState(user?.avatar ?? 'User');
  const [passInput, setPassInput] = useState(user?.password ?? '');
  const [savedMsg, setSavedMsg] = useState(false);

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'glass', label: '3D ガラス造形', icon: 'Sparkles' },
    { id: 'aurora', label: 'オーロラ背景', icon: 'Sun' },
    { id: 'personalization', label: '壁紙・テーマ', icon: 'Palette' },
    { id: 'shells', label: 'レイアウト', icon: 'Layout' },
    { id: 'lockscreen', label: 'スリープ画面', icon: 'Moon' },
    { id: 'system', label: 'システム操作', icon: 'SlidersHorizontal' },
    { id: 'accounts', label: 'プロフィール', icon: 'User' },
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
      name: nameInput.trim() || 'User',
      avatar: avatarInput,
      password: passInput.trim() || undefined,
    });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <div className="flex h-full w-full select-none overflow-hidden font-sans bg-black/25 backdrop-blur-2xl text-zinc-100">
      {/* LEFT NAVIGATION SIDEBAR */}
      <div className="w-52 shrink-0 flex flex-col p-3 bg-white/[0.02] border-r border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl glass-jelly mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-md">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {sections.map((s) => {
            const active = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                  active
                    ? 'glass-jelly text-white font-semibold'
                    : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                }`}
              >
                <div className={`${active ? 'text-sky-300' : 'text-zinc-500'}`}>
                  <Icon name={s.icon} size={15} />
                </div>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6 sm:p-8 space-y-6">
        {/* =========================================================
            SECTION 1: 3D ガラス造形 (Curvature, Wobble, Specular, Blur)
           ========================================================= */}
        {section === 'glass' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white tracking-tight">3D ガラス造形・質感</h2>
              <button
                onClick={() => {
                  setGlassCurvature(42);
                  setGlassSpecular(65);
                  setGlassWobble(60);
                  setBlurAmount(24);
                  setTransparency(78);
                  setCornerRadius(18);
                }}
                className="px-3 py-1.5 rounded-xl glass-jelly text-xs text-zinc-200 font-medium"
              >
                標準に戻す
              </button>
            </div>

            {/* Interactive 3D Jelly Preview Card */}
            <div
              className="p-5 rounded-3xl glass-jelly flex items-center justify-between gap-4 overflow-hidden"
              style={{
                borderRadius: `${cornerRadius}px`,
              }}
            >
              <div className="space-y-1">
                <div className="text-xs font-semibold text-white">3D ガラス プレビュー</div>
                <div className="text-[11px] text-zinc-300/80">
                  ホバーやクリックでプルプルとした立体弾性とレンズ屈折を体感できます
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-12 h-12 rounded-2xl glass-jelly flex items-center justify-center text-sky-300 cursor-pointer">
                  <Icon name="Sparkles" size={20} />
                </div>
              </div>
            </div>

            {/* Fine-grained 3D Glass Controls */}
            <div className="rounded-2xl glass-panel p-5 space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-200 font-medium">ガラスの湾曲度（レンズ屈折）</span>
                  <span className="font-mono text-sky-300">{glassCurvature}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={glassCurvature}
                  onChange={(e) => setGlassCurvature(Number(e.target.value))}
                  className="glass-slider"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-200 font-medium">3D 立体エッジ光沢</span>
                  <span className="font-mono text-sky-300">{glassSpecular}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={glassSpecular}
                  onChange={(e) => setGlassSpecular(Number(e.target.value))}
                  className="glass-slider"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-200 font-medium">プルプル弾性（揺らぎ感度）</span>
                  <span className="font-mono text-sky-300">{glassWobble}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={glassWobble}
                  onChange={(e) => setGlassWobble(Number(e.target.value))}
                  className="glass-slider"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-200 font-medium">背景ぼかし（フロスト深度）</span>
                  <span className="font-mono text-sky-300">{blurAmount}px</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={48}
                  value={blurAmount}
                  onChange={(e) => setBlurAmount(Number(e.target.value))}
                  className="glass-slider"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-200 font-medium">ガラス透過度</span>
                  <span className="font-mono text-sky-300">{transparency}%</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={95}
                  value={transparency}
                  onChange={(e) => setTransparency(Number(e.target.value))}
                  className="glass-slider"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-200 font-medium">角の丸み（ドーム曲率）</span>
                  <span className="font-mono text-sky-300">{cornerRadius}px</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={36}
                  value={cornerRadius}
                  onChange={(e) => setCornerRadius(Number(e.target.value))}
                  className="glass-slider"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            SECTION 2: オーロラ背景 (Aurora Customization)
           ========================================================= */}
        {section === 'aurora' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white tracking-tight">オーロラ ライブ背景</h2>
              {wallpaper !== 'live2d' && (
                <button
                  onClick={() => {
                    setWallpaper('live2d');
                    setSelectedCustomId(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl glass-jelly text-xs text-sky-300 font-semibold"
                >
                  オーロラ背景を適用
                </button>
              )}
            </div>

            {/* Aurora Color Palette */}
            <div className="rounded-2xl glass-panel p-5 space-y-3.5">
              <div className="text-xs font-medium text-zinc-200">カラーパレット</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AURORA_THEMES.map((t) => {
                  const active = auroraColor === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setAuroraColor(t.id);
                        if (wallpaper !== 'live2d') {
                          setWallpaper('live2d');
                          setSelectedCustomId(null);
                        }
                      }}
                      className={`p-3 rounded-2xl flex items-center gap-3 text-left transition ${
                        active ? 'glass-jelly ring-1 ring-sky-400/60' : 'bg-white/[0.03] hover:bg-white/[0.06]'
                      }`}
                    >
                      <div
                        className="w-9 h-9 rounded-xl shrink-0 shadow-inner border border-white/25"
                        style={{ background: t.preview }}
                      />
                      <span className="text-xs font-medium text-white">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aurora Sliders & Switch */}
            <div className="rounded-2xl glass-panel p-5 space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-200 font-medium">オーロラの揺らぎ速度</span>
                  <span className="font-mono text-sky-300">{auroraSpeed}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={auroraSpeed}
                  onChange={(e) => setAuroraSpeed(Number(e.target.value))}
                  className="glass-slider"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-200 font-medium">発光の強さ</span>
                  <span className="font-mono text-sky-300">{auroraIntensity}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={auroraIntensity}
                  onChange={(e) => setAuroraIntensity(Number(e.target.value))}
                  className="glass-slider"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-xs font-medium text-zinc-200">光の粒子エフェクト</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAuroraParticles(!auroraParticles)}
                  className={`glass-switch ${auroraParticles ? 'is-on' : ''}`}
                  aria-label="光の粒子エフェクト"
                >
                  <div className="glass-switch-thumb" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            SECTION 3: 壁紙・テーマ
           ========================================================= */}
        {section === 'personalization' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl">
            <h2 className="text-base font-semibold text-white tracking-tight">壁紙・テーマ</h2>

            {/* Design Engine Selector */}
            <div className="rounded-2xl glass-panel p-5 space-y-3">
              <div className="text-xs font-medium text-zinc-200">ガラス レンダリング</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'liquid-glass', name: 'Liquid 3D' },
                  { id: 'windows-mica', name: 'Pure Lens' },
                  { id: 'frosted-blur', name: 'Frosted' },
                  { id: 'dark-slate', name: 'Dark Glass' },
                ].map((eng) => (
                  <button
                    key={eng.id}
                    onClick={() => setDesignEngine(eng.id as DesignEngine)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium transition text-center ${
                      designEngine === eng.id
                        ? 'glass-jelly text-sky-300 font-semibold ring-1 ring-sky-400/50'
                        : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200'
                    }`}
                  >
                    {eng.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Wallpapers */}
            <div className="rounded-2xl glass-panel p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-zinc-200">背景コレクション</div>
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 glass-jelly rounded-xl text-xs text-zinc-200 flex items-center gap-1.5"
                  >
                    <Icon name="Plus" size={12} />
                    <span>画像を追加</span>
                  </button>
                </div>
              </div>

              {uploadError && <p className="text-xs text-rose-400">{uploadError}</p>}

              <div className="grid grid-cols-3 gap-2.5">
                {PRESET_WALLPAPERS.map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      setWallpaper(w);
                      setSelectedCustomId(null);
                    }}
                    className={`relative rounded-xl overflow-hidden h-16 transition border ${
                      wallpaper === w && !selectedCustomId
                        ? 'border-sky-400 ring-2 ring-sky-400/40 scale-[1.02]'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                    style={{ background: (WALLPAPERS[w] ?? WALLPAPERS.live2d).style }}
                  >
                    <div className="absolute inset-x-0 bottom-0 bg-black/55 backdrop-blur-sm px-2 py-1 text-[10px] text-zinc-100 truncate text-center">
                      {(WALLPAPERS[w] ?? WALLPAPERS.live2d).label}
                    </div>
                  </button>
                ))}

                {customWallpapers.map((cw) => (
                  <button
                    key={cw.id}
                    onClick={() => setSelectedCustomId(cw.id)}
                    className={`relative rounded-xl overflow-hidden h-16 transition border bg-cover bg-center ${
                      selectedCustomId === cw.id
                        ? 'border-sky-400 ring-2 ring-sky-400/40 scale-[1.02]'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                    style={{ backgroundImage: `url(${cw.dataUrl})` }}
                  >
                    <div className="absolute inset-x-0 bottom-0 bg-black/55 backdrop-blur-sm px-2 py-1 text-[10px] text-zinc-100 truncate text-center">
                      {cw.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            SECTION 4: レイアウト (SHELLS)
           ========================================================= */}
        {section === 'shells' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl">
            <h2 className="text-base font-semibold text-white tracking-tight">デスクトップ レイアウト</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'windows11', name: 'Windows 11', icon: 'Monitor' },
                { id: 'mac', name: 'macOS', icon: 'Apple' },
                { id: 'windows10', name: 'Windows 10', icon: 'Grid3x3' },
                { id: 'metro', name: 'タイル画面', icon: 'LayoutGrid' },
                { id: 'vista', name: 'Aero Glass', icon: 'Sparkles' },
                { id: 'xp', name: 'クラシック', icon: 'Flame' },
                { id: 'dex', name: 'DeX モード', icon: 'Layers' },
                { id: 'chromeos', name: 'ChromeOS', icon: 'Globe' },
                { id: 'ubuntu', name: 'Ubuntu', icon: 'SlidersHorizontal' },
              ].map((s) => {
                const isSelected =
                  shellMode === s.id ||
                  (s.id === 'windows11' && shellMode === 'windows') ||
                  (s.id === 'metro' && shellMode === 'windows8');
                return (
                  <button
                    key={s.id}
                    onClick={() => setShellMode(s.id as ShellMode)}
                    className={`p-3.5 rounded-2xl text-left transition flex items-center gap-3 ${
                      isSelected
                        ? 'glass-jelly text-white ring-1 ring-sky-400/50'
                        : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200'
                    }`}
                  >
                    <Icon name={s.icon} size={16} className={isSelected ? 'text-sky-300' : 'text-zinc-500'} />
                    <span className="text-xs font-semibold">{s.name}</span>
                  </button>
                );
              })}
            </div>

            {['windows', 'windows11', 'windows10'].includes(shellMode) && (
              <div className="p-4 rounded-2xl glass-panel flex items-center justify-between">
                <div className="text-xs font-medium text-zinc-200">タスクバーの位置</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTaskbarStyle('modern')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                      taskbarStyle === 'modern' ? 'glass-jelly text-sky-300 font-semibold' : 'bg-white/[0.04] text-zinc-400'
                    }`}
                  >
                    中央
                  </button>
                  <button
                    onClick={() => setTaskbarStyle('classic')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                      taskbarStyle === 'classic' ? 'glass-jelly text-sky-300 font-semibold' : 'bg-white/[0.04] text-zinc-400'
                    }`}
                  >
                    左端
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* =========================================================
            SECTION 5: スリープ画面
           ========================================================= */}
        {section === 'lockscreen' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl">
            <h2 className="text-base font-semibold text-white tracking-tight">スリープ画面</h2>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'hyperos3' as LockScreenStyle, name: '3D ガラスクロック' },
                { id: 'miuix' as LockScreenStyle, name: '縦型スタッククロック' },
                { id: 'windows-hello' as LockScreenStyle, name: 'センターガラス' },
                { id: 'cosmic-liquid' as LockScreenStyle, name: 'ミニマルクロック' },
              ].map((style) => {
                const active = lockScreenStyle === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => setLockScreenStyle(style.id)}
                    className={`p-4 rounded-2xl text-left transition flex items-center justify-between ${
                      active
                        ? 'glass-jelly text-white ring-1 ring-sky-400/50'
                        : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xs font-semibold">{style.name}</span>
                    {active && <Icon name="Check" size={14} className="text-sky-300" />}
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl glass-panel flex items-center justify-between">
              <div className="text-xs font-medium text-zinc-200">スリープモードを起動</div>
              <button
                onClick={lockSystem}
                className="px-4 py-2 rounded-xl glass-jelly text-xs text-white font-semibold flex items-center gap-2"
              >
                <Icon name="Moon" size={14} className="text-sky-300" />
                <span>スリープにする</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            SECTION 6: システム操作 (Switches & Quick Launch)
           ========================================================= */}
        {section === 'system' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-2xl">
            <h2 className="text-base font-semibold text-white tracking-tight">システム操作</h2>

            <div className="rounded-2xl glass-panel p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="Volume2" size={17} className="text-sky-300" />
                <span className="text-xs font-medium text-zinc-200">システム効果音</span>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`glass-switch ${soundEnabled ? 'is-on' : ''}`}
                aria-label="システム効果音"
              >
                <div className="glass-switch-thumb" />
              </button>
            </div>

            <div className="rounded-2xl glass-panel p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="Hand" size={17} className="text-sky-300" />
                <span className="text-xs font-medium text-zinc-200">タッチ操作の拡大</span>
              </div>
              <button
                type="button"
                onClick={() => setTouchMode(!touchMode)}
                className={`glass-switch ${touchMode ? 'is-on' : ''}`}
                aria-label="タッチ操作の拡大"
              >
                <div className="glass-switch-thumb" />
              </button>
            </div>

            <div className="rounded-2xl glass-panel p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="Cpu" size={17} className="text-sky-300" />
                <span className="text-xs font-medium text-zinc-200">タスク マネージャー</span>
              </div>
              <button
                onClick={() => openApp('taskmanager')}
                className="px-3.5 py-1.5 rounded-xl glass-jelly text-xs text-zinc-100"
              >
                開く
              </button>
            </div>

            <div className="rounded-2xl glass-panel p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="Activity" size={17} className="text-emerald-300" />
                <span className="text-xs font-medium text-zinc-200">システム モニター</span>
              </div>
              <button
                onClick={() => openApp('sysmon')}
                className="px-3.5 py-1.5 rounded-xl glass-jelly text-xs text-zinc-100"
              >
                開く
              </button>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            SECTION 7: プロフィール
           ========================================================= */}
        {section === 'accounts' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-md">
            <h2 className="text-base font-semibold text-white tracking-tight">プロフィール</h2>

            <form onSubmit={handleSaveAccount} className="rounded-2xl glass-panel p-5 space-y-4">
              <div>
                <label className="text-xs text-zinc-300 mb-1.5 block">表示名</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 mb-1.5 block">アイコン</label>
                <div className="flex items-center gap-2">
                  {['User', 'Sparkles', 'Shield', 'Bot', 'Terminal'].map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatarInput(av)}
                      className={`p-2.5 rounded-xl transition ${
                        avatarInput === av
                          ? 'glass-jelly text-sky-300 ring-1 ring-sky-400/50'
                          : 'bg-white/[0.03] text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Icon name={av} size={16} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-300 mb-1.5 block">ロック解除パスワード</label>
                <input
                  type="password"
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  placeholder="空欄でパスワードなし"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 placeholder-zinc-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl glass-jelly text-xs text-white font-semibold"
                >
                  保存
                </button>
                {savedMsg && <span className="text-xs text-emerald-400">保存しました</span>}
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
