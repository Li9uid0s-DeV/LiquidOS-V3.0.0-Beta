import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useOS, Wallpaper } from '../OSContext';
import {
  ShellMode,
  DesignEngine,
  NebulaPreset,
  LockScreenStyle,
} from '../types';
import { WALLPAPERS } from '../wallpapers';
import { Icon } from '../Icon';

type Section = 'personalization' | 'shells' | 'lockscreen' | 'touch' | 'nebula' | 'account' | 'about';

const PRESET_WALLPAPERS: Wallpaper[] = ['space', 'aurora', 'sunset', 'ocean', 'forest', 'cosmic', 'bloom', 'shader'];

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
    lockScreenStyle,
    setLockScreenStyle,
    touchMode,
    setTouchMode,
    lockSystem,
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
    { id: 'lockscreen', label: 'Lock Screen & Sleep', icon: 'Lock' },
    { id: 'touch', label: 'Touch & Tablet Mode', icon: 'Hand' },
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

            {/* Theme Store shortcut banner */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/60 via-blue-950/40 to-slate-900 border border-cyan-500/30 shadow-md">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Icon name="Palette" size={14} className="text-cyan-300" />
                  <span>Theme Store & Visual Shell Catalog</span>
                </div>
                <p className="text-[11px] text-white/60">
                  Download Windows XP Luna, Vista Aero Glass, Samsung DeX, ChromeOS, and Cyberpunk themes from the App Store.
                </p>
              </div>
              <button
                onClick={() => openApp('appstore')}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shrink-0 transition shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
              >
                <Icon name="Download" size={13} />
                <span>Theme Store</span>
              </button>
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

              {/* Touch Operation Mode Toggle */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs text-white font-semibold flex items-center gap-2">
                    <Icon name="Hand" size={14} className="text-orange-400" />
                    Touch & Tablet Optimization Mode
                  </div>
                  <div className="text-[11px] text-white/50">Enlarges hit targets (44px+) and optimizes touch swiping across all apps.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setTouchMode(!touchMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                    touchMode ? 'bg-orange-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${touchMode ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Lock Screen & Sleep Customizer (HyperOS 3 / MIUIx / Windows Hello) */}
            <div className="glass-panel p-4 rounded-xl space-y-3 border border-orange-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-400">Lock Screen & Sleep Style</h3>
                  <p className="text-[11px] text-white/50">Customize clock typography, depth physics, and unlock gestures.</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-300">
                  {lockScreenStyle}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'hyperos3', label: 'HyperOS 3 Flagship', desc: 'Bold depth clock, dynamic music player, swipe up gesture, quick torch.' },
                  { id: 'miuix', label: 'MIUIx Classic', desc: 'Stacked vertical bold numerals, squircle indicators, Xiaomi glass.' },
                  { id: 'windows-hello', label: 'Windows Hello', desc: 'Modern acrylic card with facial biometrics glyph.' },
                  { id: 'cosmic-liquid', label: 'Cosmic Starfield', desc: 'Deep liquid glow with starfield particles canvas.' },
                ].map((ls) => (
                  <button
                    key={ls.id}
                    type="button"
                    onClick={() => setLockScreenStyle(ls.id as never)}
                    className={`p-3 rounded-xl text-left border transition ${
                      lockScreenStyle === ls.id
                        ? 'border-orange-400 bg-orange-500/20 text-white shadow-md'
                        : 'border-white/10 hover:bg-white/5 text-white/70'
                    }`}
                  >
                    <div className="text-xs font-bold mb-1">{ls.label}</div>
                    <div className="text-[10px] text-white/50 leading-relaxed">{ls.desc}</div>
                  </button>
                ))}
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
                  id: 'zorin',
                  name: 'Zorin OS 17 Pro',
                  desc: 'Clean Linux desktop with floating pill dock, categorized quick launcher, and vibrant cyan accents.',
                  icon: 'Navigation',
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

        {/* SECTION: LOCK SCREEN & HYPEROS 3 SLEEP CUSTOMIZER */}
        {section === 'lockscreen' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div>
              <h2 className="text-lg text-white font-bold">Lock Screen & Sleep Engine</h2>
              <p className="text-xs text-white/50">Configure HyperOS 3 depth clock, MIUIx flagship layout, and sleep gestures.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'hyperos3' as LockScreenStyle,
                  name: 'HyperOS 3 Signature Depth',
                  desc: 'Ultra-bold depth typography with date pill, dynamic lossless audio card, and tactile swipe unlock.',
                  badge: 'Flagship Xiaomi',
                },
                {
                  id: 'miuix' as LockScreenStyle,
                  name: 'MIUIx Dual-Stacked Clock',
                  desc: 'Iconic stacked hour & orange minute layout with classic circular battery percentage.',
                  badge: 'MIUI Classic',
                },
                {
                  id: 'windows-hello' as LockScreenStyle,
                  name: 'Windows Hello Modern',
                  desc: 'Clean center-aligned light font with blur acrylic background and key wake.',
                  badge: 'Windows 11',
                },
                {
                  id: 'cosmic-liquid' as LockScreenStyle,
                  name: 'Cosmic Singularity Minimal',
                  desc: 'Minimal glowing cyan time with orbital starfield canvas and subtle status glyphs.',
                  badge: 'LiquidOS',
                },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setLockScreenStyle(style.id)}
                  className={`glass-panel p-4 rounded-xl text-left flex flex-col justify-between transition border ${
                    lockScreenStyle === style.id
                      ? 'border-orange-400 bg-orange-500/20 text-white shadow-lg shadow-orange-500/20'
                      : 'border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-white">{style.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-orange-300">
                        {style.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed">{style.desc}</p>
                  </div>
                  {lockScreenStyle === style.id && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-orange-400 font-semibold">
                      <Icon name="Check" size={14} /> Active Style
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Test Lock Screen Button */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Test Lock Screen & Sleep Mode</div>
                <div className="text-[11px] text-white/50">Immediately lock the workstation to preview your selected lock screen.</div>
              </div>
              <button
                onClick={lockSystem}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-rose-500/30 active:scale-95"
              >
                <Icon name="Lock" size={14} />
                <span>Sleep / Lock Now</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* SECTION: TOUCH & TABLET MODE */}
        {section === 'touch' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div>
              <h2 className="text-lg text-white font-bold">Touch Interaction & Tablet Optimization</h2>
              <p className="text-xs text-white/50">Manage finger gesture targets, virtual joysticks, and Windows 8/11 tablet layouts.</p>
            </div>

            <div className="glass-panel p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Touch-Optimized Mode</div>
                  <div className="text-[11px] text-white/50">Enlarges titlebars, window controls, and reveals virtual touch buttons in games.</div>
                </div>
                <button
                  onClick={() => setTouchMode(!touchMode)}
                  className={`w-12 h-6 rounded-full transition p-0.5 flex items-center ${
                    touchMode ? 'bg-cyan-500 justify-end' : 'bg-white/20 justify-start'
                  }`}
                >
                  <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Tablet Shell Paradigm</div>
                  <div className="text-[11px] text-white/50">Switch immediately to full-screen Windows 8 Metro live tiles.</div>
                </div>
                <button
                  onClick={() => setShellMode('metro')}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-500/30 text-sky-300 border border-sky-400/40 text-xs font-semibold hover:bg-sky-500/40 transition"
                >
                  Launch Windows 8 Metro
                </button>
              </div>
            </div>
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
              <p className="text-xs text-white/50">LiquidOS-4.1.0-Beta (Quantum Singularity Edition)</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/40">
                  <Icon name="Sparkles" size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">LiquidOS-4.1.0-Beta</h3>
                  <p className="text-white/50 text-[11px]">Volumetric Raymarched Gravitational Lensing & Autonomous AI Engine</p>
                </div>
              </div>
              <p className="text-white/70 leading-relaxed">
                LiquidOS-4.1.0-Beta delivers pure Three.js GLSL raymarching of a high-mass black hole, authentic Einstein ring
                distortions, HyperOS 3 depth clock lock screen, Zorin OS Linux shell, and full autonomous Gemini 3.8 Flash AI Studio integration.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
