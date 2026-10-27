import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useOS, Wallpaper } from '../OSContext';
import {
  ShellMode,
  DesignEngine,
  NebulaPreset,
} from '../types';
import { WALLPAPERS } from '../wallpapers';
import { Icon } from '../Icon';

type Section = 'personalization' | 'shells' | 'nebula' | 'account' | 'about';

const PRESET_WALLPAPERS: Wallpaper[] = ['space', 'aurora', 'sunset', 'ocean', 'forest', 'cosmic', 'bloom', 'shader'];

export function SettingsApp() {
  const {
    wallpaper,
    setWallpaper,
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
    customWallpapers,
    addCustomWallpaper,
    selectedCustomId,
    setSelectedCustomId,
    user,
    setUser,
  } = useOS();

  const [section, setSection] = useState<Section>('personalization');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');

  // Account editing state
  const [nameInput, setNameInput] = useState(user?.name ?? 'Admin');
  const [avatarInput, setAvatarInput] = useState(user?.avatar ?? 'astronaut');
  const [passInput, setPassInput] = useState(user?.password ?? '');
  const [savedMsg, setSavedMsg] = useState(false);

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'personalization', label: 'Liquid Personalization', icon: 'Palette' },
    { id: 'shells', label: 'Cross-Platform Shells', icon: 'Layout' },
    { id: 'nebula', label: 'Gargantua Nebula Physics', icon: 'Sparkles' },
    { id: 'account', label: 'User Security & Profile', icon: 'Shield' },
    { id: 'about', label: 'System Architecture', icon: 'Info' },
  ];

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File too large (max 8MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      addCustomWallpaper(file.name, dataUrl);
    };
    reader.onerror = () => setUploadError('Failed to read file.');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      name: nameInput.trim() || 'Admin',
      avatar: avatarInput,
      password: passInput.trim() || undefined,
      createdAt: user?.createdAt ?? Date.now(),
    });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <div className="flex h-full w-full min-w-0 min-h-0 bg-zinc-950/70 text-white select-none">
      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r border-white/10 p-3 overflow-y-auto bg-black/20">
        <div className="text-[11px] text-white/40 px-2 py-1 uppercase tracking-wider font-semibold">Settings</div>
        {sections.map((s) => {
          const active = section === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition mb-1 ${
                active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              <Icon name={s.icon} size={16} className={active ? 'text-white' : 'text-white/50'} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Content Body */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        {/* SECTION 1: PERSONALIZATION & SLIDERS */}
        {section === 'personalization' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <h2 className="text-lg text-white font-bold">Liquid Personalization</h2>
              <p className="text-xs text-white/50">Tune dynamic refraction optics, frosted blur, and glass themes.</p>
            </div>

            {/* Design Engine Selector */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-2">Design Rendering Engine</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'liquid-glass', name: 'Liquid Glass (Dynamic SVG Refraction)', desc: 'Full Mikhail-Bespalov physics refraction map' },
                  { id: 'frosted-blur', name: 'Static Frosted Blur (Pure CSS)', desc: 'High-performance ultra-smooth backdrop blur' },
                  { id: 'windows-mica', name: 'Windows Mica Elegance', desc: 'Opaque Windows 11 style tinted blur' },
                  { id: 'dark-slate', name: 'Material Dark Slate', desc: 'Minimalist high-contrast dark surface' },
                  { id: 'cyberpunk-neon', name: 'Cyberpunk Neon Matrix', desc: 'Glowing electric cyan & magenta borders' },
                ].map((eng) => (
                  <button
                    key={eng.id}
                    onClick={() => setDesignEngine(eng.id as DesignEngine)}
                    className={`glass-panel p-3 rounded-xl text-left transition border ${
                      designEngine === eng.id
                        ? 'border-orange-400 bg-orange-500/20 text-white shadow-md'
                        : 'border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-xs font-semibold">{eng.name}</div>
                    <div className="text-[10px] text-white/50 mt-0.5">{eng.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Granular Sliders */}
            <div className="glass-panel p-4 rounded-xl space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-400">Glass Optics & Curvature Sliders</h3>

              {/* Blur Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/70 font-medium">Backdrop Blur Radius</span>
                  <span className="font-mono text-orange-400">{blurAmount}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={blurAmount}
                  onChange={(e) => setBlurAmount(Number(e.target.value))}
                  className="w-full accent-orange-500 bg-white/10 rounded-lg h-1.5"
                />
              </div>

              {/* Transparency Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/70 font-medium">Surface Transparency</span>
                  <span className="font-mono text-orange-400">{transparency}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={95}
                  value={transparency}
                  onChange={(e) => setTransparency(Number(e.target.value))}
                  className="w-full accent-orange-500 bg-white/10 rounded-lg h-1.5"
                />
              </div>

              {/* Corner Radius Squircles Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/70 font-medium">Window Corner Squircle Radius</span>
                  <span className="font-mono text-orange-400">{cornerRadius}px</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={48}
                  value={cornerRadius}
                  onChange={(e) => setCornerRadius(Number(e.target.value))}
                  className="w-full accent-orange-500 bg-white/10 rounded-lg h-1.5"
                />
              </div>

              {/* Animation Speed Scalar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/70 font-medium">UI Animation Speed Rate</span>
                  <span className="font-mono text-orange-400">{animSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={animSpeed}
                  onChange={(e) => setAnimSpeed(Number(e.target.value))}
                  className="w-full accent-orange-500 bg-white/10 rounded-lg h-1.5"
                />
              </div>
            </div>

            {/* Preset Background Wallpapers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-400">Wallpaper Presets & Uploads</h3>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <Icon name="Plus" size={13} />
                    Upload Image / GIF
                  </button>
                </div>
              </div>

              {uploadError && <p className="text-xs text-red-400 mb-2">{uploadError}</p>}

              <div className="grid grid-cols-4 gap-2.5">
                {PRESET_WALLPAPERS.map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      setWallpaper(w);
                      setSelectedCustomId(null);
                    }}
                    className={`relative rounded-xl overflow-hidden h-16 transition border ${
                      wallpaper === w && !selectedCustomId
                        ? 'border-orange-400 ring-2 ring-orange-400/50 shadow-lg'
                        : 'border-white/10 hover:border-white/40'
                    }`}
                    style={{ background: WALLPAPERS[w].style }}
                  >
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] text-white font-medium truncate">
                      {WALLPAPERS[w].label}
                    </div>
                  </button>
                ))}

                {/* Custom Wallpapers */}
                {customWallpapers.map((cw) => (
                  <button
                    key={cw.id}
                    onClick={() => setSelectedCustomId(cw.id)}
                    className={`relative rounded-xl overflow-hidden h-16 transition border bg-cover bg-center ${
                      selectedCustomId === cw.id
                        ? 'border-orange-400 ring-2 ring-orange-400/50 shadow-lg'
                        : 'border-white/10 hover:border-white/40'
                    }`}
                    style={{ backgroundImage: `url(${cw.dataUrl})` }}
                  >
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] text-white font-medium truncate">
                      {cw.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 2: SHELL MODES & WINDOWS 8 METRO UI */}
        {section === 'shells' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div>
              <h2 className="text-lg text-white font-bold">Cross-Platform Desktop Shells</h2>
              <p className="text-xs text-white/50">Seamlessly switch between famous OS desktop paradigms.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  id: 'windows11',
                  name: 'Windows 11 Fluent',
                  desc: 'Mica rounded windows, centered taskbar, floating start menu with pinned & recommended grid.',
                  icon: 'Monitor',
                },
                {
                  id: 'windows10',
                  name: 'Windows 10 Hybrid',
                  desc: 'Sharp taskbar, Cortana search bar, split Start Menu with live tiles & alphabetical list.',
                  icon: 'Grid3x3',
                },
                {
                  id: 'metro',
                  name: 'Windows 8 Metro Live',
                  desc: 'Full-screen liquid glass live tiles dashboard with dynamic application cards.',
                  icon: 'LayoutGrid',
                },
                {
                  id: 'vista',
                  name: 'Windows Vista Aero Glass',
                  desc: 'Translucent Aero Glass windows, iconic glowing Start Orb, and live desktop Sidebar gadgets (Analog Clock, CPU Gauge).',
                  icon: 'Sparkles',
                },
                {
                  id: 'xp',
                  name: 'Windows XP Luna Blue',
                  desc: 'Legendary Luna Blue taskbar, curved green Start button, classic 2-column menu, and beveled windows.',
                  icon: 'Flame',
                },
                {
                  id: 'dex',
                  name: 'Samsung DeX Desktop',
                  desc: 'Galaxy desktop environment with bottom DeX bar, app drawer, multi-window layout, and system status.',
                  icon: 'Layers',
                },
                {
                  id: 'chromeos',
                  name: 'ChromeOS Material Shelf',
                  desc: 'Minimalist shelf with circular Everything Button launcher, centered apps, and quick settings pill.',
                  icon: 'Globe',
                },
                {
                  id: 'mac',
                  name: 'macOS Liquid Dock',
                  desc: 'Floating magnified bottom dock with top global utility menu bar and traffic lights.',
                  icon: 'Apple',
                },
                {
                  id: 'ubuntu',
                  name: 'Ubuntu Linux 24.04',
                  desc: 'Left vertical launcher sidebar with activity indicators and top system bar.',
                  icon: 'SlidersHorizontal',
                },
                {
                  id: 'android',
                  name: 'Android Material You',
                  desc: 'Top status bar, Google search pill, Material You app grid, and gesture pill.',
                  icon: 'Smartphone',
                },
                {
                  id: 'ios',
                  name: 'iOS SpringBoard',
                  desc: 'Dynamic Island status bar, 4x6 squircle grid, glass dock, and swipe home bar.',
                  icon: 'Tablet',
                },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setShellMode(s.id as ShellMode)}
                  className={`glass-panel p-4 rounded-xl text-left flex flex-col gap-2 transition border ${
                    shellMode === s.id || (s.id === 'windows11' && shellMode === 'windows') || (s.id === 'metro' && shellMode === 'windows8')
                      ? 'border-orange-400 bg-orange-500/20 text-white shadow-lg shadow-orange-500/20'
                      : 'border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon name={s.icon} size={20} className={shellMode === s.id ? 'text-orange-400' : 'text-white/60'} />
                    <span className="text-sm font-bold">{s.name}</span>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed">{s.desc}</p>
                </button>
              ))}
            </div>

            {/* Windows Shell Customizations */}
            {shellMode === 'windows' && (
              <div className="glass-panel p-4 rounded-xl space-y-3 border border-orange-500/20">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-400">Windows Taskbar Mode</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTaskbarStyle('modern')}
                    className={`flex-1 p-2.5 rounded-lg border text-xs font-medium transition ${
                      taskbarStyle === 'modern' ? 'bg-orange-500 text-white border-orange-400' : 'bg-black/30 text-white/60 border-white/10'
                    }`}
                  >
                    Modern Centered Icons
                  </button>
                  <button
                    onClick={() => setTaskbarStyle('classic')}
                    className={`flex-1 p-2.5 rounded-lg border text-xs font-medium transition ${
                      taskbarStyle === 'classic' ? 'bg-orange-500 text-white border-orange-400' : 'bg-black/30 text-white/60 border-white/10'
                    }`}
                  >
                    Classic Text Label Tabs
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* SECTION 3: NEBULA PHYSICS PRESETS */}
        {section === 'nebula' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div>
              <h2 className="text-lg text-white font-bold">Gargantua Gravitational Lensing Presets</h2>
              <p className="text-xs text-white/50">Choose cosmic radiation signatures and accretion disk plasma hues.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  id: 'gargantua',
                  name: 'Gargantua Supernova (Interstellar Classic)',
                  desc: 'Incandescent gold core with blistering neon-orange relativistic beaming.',
                  color: 'from-amber-500 via-orange-600 to-red-900',
                },
                {
                  id: 'ultraviolet',
                  name: 'Cosmic Ultraviolet Singularity',
                  desc: 'Electric neon purple filaments and deep ultraviolet synchrotron radiation.',
                  color: 'from-purple-500 via-fuchsia-600 to-indigo-950',
                },
                {
                  id: 'indigo',
                  name: 'Deep Galactic Indigo Sapphire',
                  desc: 'Dark oceanic sapphire plasma with cosmic navy dust rings.',
                  color: 'from-blue-400 via-indigo-600 to-slate-950',
                },
                {
                  id: 'cyan-quasar',
                  name: 'Cyan Quasar Pulsar Stream',
                  desc: 'Blazing electric cyan jets and turquoise relativistic plasma vortices.',
                  color: 'from-cyan-400 via-teal-500 to-slate-950',
                },
                {
                  id: 'solar-flare',
                  name: 'Solar Flare Hyper-Nova',
                  desc: 'Blazing crimson coronal mass ejection with radiant amber photon sphere.',
                  color: 'from-yellow-400 via-red-600 to-stone-950',
                },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setNebulaPreset(p.id as NebulaPreset)}
                  className={`glass-panel p-4 rounded-xl flex items-center justify-between transition border ${
                    nebulaPreset === p.id
                      ? 'border-orange-400 bg-orange-500/20 text-white shadow-lg'
                      : 'border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${p.color} shrink-0 shadow-inner`} />
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">{p.name}</div>
                      <div className="text-[11px] text-white/50">{p.desc}</div>
                    </div>
                  </div>
                  {nebulaPreset === p.id && (
                    <span className="text-xs bg-orange-500 text-white px-2.5 py-1 rounded-lg font-semibold">Active</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* SECTION 4: USER PROFILE & SECURITY */}
        {section === 'account' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div>
              <h2 className="text-lg text-white font-bold">User Security & Administrator Profile</h2>
              <p className="text-xs text-white/50">Manage local workstation login, password wake, and cosmic avatar.</p>
            </div>

            <form onSubmit={handleSaveAccount} className="glass-panel p-5 rounded-2xl space-y-4 max-w-md">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Administrator Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 mb-1 block">Lock Screen Password (Optional)</label>
                <input
                  type="password"
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  placeholder="Leave empty for password-less instant wake"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-400 placeholder-white/30"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 mb-1.5 block">Select Cosmic Avatar Icon</label>
                <div className="flex gap-2">
                  {['User', 'Shield', 'Rocket', 'Sparkles', 'Cpu'].map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatarInput(av)}
                      className={`h-10 w-10 rounded-xl flex items-center justify-center border transition ${
                        avatarInput === av ? 'bg-orange-500 border-orange-400 text-white shadow-lg' : 'bg-black/30 border-white/10 text-white/60'
                      }`}
                    >
                      <Icon name={av} size={18} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition shadow-md shadow-orange-500/30"
                >
                  Save Profile Settings
                </button>
                {savedMsg && <span className="text-xs text-emerald-400 font-medium">Changes Persisted!</span>}
              </div>
            </form>
          </motion.div>
        )}

        {/* SECTION 5: ABOUT */}
        {section === 'about' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <h2 className="text-lg text-white font-bold">LiquidOS Workstation Architecture</h2>
              <p className="text-xs text-white/50">Version 3.0.0 (Interstellar Gargantua Edition)</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/40">
                  <Icon name="Sparkles" size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">LiquidOS v3.0.0-Beta</h3>
                  <p className="text-white/50 text-[11px]">Volumetric Raymarched Gravitational Lensing Engine</p>
                </div>
              </div>
              <p className="text-white/70 leading-relaxed">
                LiquidOS v3.0.0 delivers pure Three.js GLSL raymarching of a high-mass black hole, authentic Einstein ring
                distortions, and volumetric Keplerian accretion disk plasma churn at a smooth 60fps.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
