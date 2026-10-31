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

type Section = 'system' | 'personalization' | 'shells' | 'lockscreen' | 'touch' | 'accounts' | 'about';

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
  const [deviceName, setDeviceName] = useState('LiquidOS-PC');
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempDeviceName, setTempDeviceName] = useState('LiquidOS-PC');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');

  // Account editing state
  const [nameInput, setNameInput] = useState(user?.name ?? 'Admin');
  const [avatarInput, setAvatarInput] = useState(user?.avatar ?? 'User');
  const [passInput, setPassInput] = useState(user?.password ?? '');
  const [savedMsg, setSavedMsg] = useState(false);

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'system', label: 'System', icon: 'Monitor' },
    { id: 'personalization', label: 'Personalization', icon: 'Palette' },
    { id: 'shells', label: 'Cross-Platform Shells', icon: 'Layout' },
    { id: 'lockscreen', label: 'Lock screen & sleep', icon: 'Lock' },
    { id: 'touch', label: 'Touch & tablet', icon: 'Hand' },
    { id: 'accounts', label: 'Accounts', icon: 'User' },
    { id: 'about', label: 'About', icon: 'Info' },
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
    });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
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
    <div className="flex h-full w-full select-none overflow-hidden font-sans bg-[#1c1c1c]/95 text-white/90">
      {/* -------------------------------------------------------------
          1. AUTHENTIC WINDOWS 11 SETTINGS LEFT NAVIGATION SIDEBAR
         ------------------------------------------------------------- */}
      <div className="w-64 shrink-0 flex flex-col p-3 border-r border-white/[0.05] bg-black/20 backdrop-blur-xl">
        {/* User Account Profile Header */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</div>
            <div className="text-[11px] text-white/40 truncate">Local Account · Administrator</div>
          </div>
        </div>

        {/* Find a setting search input */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-white/40">
            <Icon name="Search" size={13} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find a setting"
            className="w-full bg-white/[0.04] hover:bg-white/[0.07] focus:bg-black/60 focus:ring-1 focus:ring-cyan-400/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 outline-none transition"
          />
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
          {filteredSections.map((s) => {
            const active = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition text-left ${
                  active
                    ? 'bg-white/[0.08] text-white font-semibold shadow-sm'
                    : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <div className={`p-1 rounded ${active ? 'text-cyan-400' : 'text-white/60'}`}>
                  <Icon name={s.icon} size={16} />
                </div>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Windows 11 Build Version Info */}
        <div className="pt-3 border-t border-white/[0.05] text-[10px] text-white/40 flex items-center justify-between px-2">
          <span>LiquidOS-4.1.0-Beta</span>
          <span>Build 26100</span>
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. AUTHENTIC WINDOWS 11 SETTINGS RIGHT CONTENT AREA
         ------------------------------------------------------------- */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6 sm:p-8 space-y-6">
        {/* =========================================================
            WINDOWS 11 SIGNATURE HERO DEVICE CARD (Appears on top)
           ========================================================= */}
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.05] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600/30 to-blue-700/20 border border-cyan-400/20 flex items-center justify-center text-cyan-300 shrink-0">
              <Icon name="Monitor" size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">{deviceName}</span>
                <button
                  onClick={() => setIsRenaming(true)}
                  className="text-[11px] text-cyan-400 hover:underline font-medium"
                >
                  Rename
                </button>
              </div>
              <div className="text-xs text-white/50 mt-0.5">
                Liquid Singularity Core · 32.0 GB RAM · 60 FPS GLSL Engine
              </div>
            </div>
          </div>

          {/* Quick Status Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] text-xs text-white/70 flex items-center gap-2">
              <Icon name="Wifi" size={13} className="text-cyan-400" />
              <span>5 GHz Connected</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] text-xs text-white/70 flex items-center gap-2">
              <Icon name="Check" size={13} className="text-emerald-400" />
              <span>Up to date</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] text-xs text-white/70 flex items-center gap-2">
              <Icon name="Battery" size={13} className="text-emerald-400" />
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Rename Modal */}
        {isRenaming && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleRenameSubmit} className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/10 p-5 shadow-2xl space-y-4">
              <div className="text-sm font-bold text-white">Rename your PC</div>
              <input
                type="text"
                value={tempDeviceName}
                onChange={(e) => setTempDeviceName(e.target.value)}
                autoFocus
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRenaming(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================
            SECTION 1: SYSTEM (Display, Sound, Lensing, Performance)
           ========================================================= */}
        {section === 'system' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">System</h2>
              <p className="text-xs text-white/50">Display, relativistic black hole optics, sound, and notifications.</p>
            </div>

            {/* Display / Black Hole Lensing Preset Card */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.04] transition">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                  <Icon name="Sparkles" size={20} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Gargantua Gravitational Lensing Physics</div>
                  <div className="text-[11px] text-white/50">Current relativistic accretion disk hue: {nebulaPreset.toUpperCase()}</div>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { id: 'gargantua', label: 'Gold' },
                  { id: 'ultraviolet', label: 'Violet' },
                  { id: 'indigo', label: 'Sapphire' },
                  { id: 'cyan-quasar', label: 'Quasar' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setNebulaPreset(p.id as NebulaPreset)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                      nebulaPreset === p.id
                        ? 'bg-cyan-500 text-black font-bold'
                        : 'bg-white/[0.05] text-white/70 hover:bg-white/[0.1]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Synthesizer Card */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 flex items-center justify-between hover:bg-white/[0.04] transition">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Icon name="Volume2" size={20} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">System Acoustic Harmonics</div>
                  <div className="text-[11px] text-white/50">Lossless synthesized audio feedback for window interactions</div>
                </div>
              </div>
              <button
                onClick={() => openApp('synth')}
                className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-white font-medium transition flex items-center gap-1.5"
              >
                <Icon name="Music" size={13} />
                <span>Monochrome Music</span>
              </button>
            </div>

            {/* Task Manager & System Diagnostics */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 flex items-center justify-between hover:bg-white/[0.04] transition">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Icon name="Cpu" size={20} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Diagnostics & Performance Monitoring</div>
                  <div className="text-[11px] text-white/50">CPU load, 60fps frame rate, memory allocation telemetry</div>
                </div>
              </div>
              <button
                onClick={() => openApp('taskmanager')}
                className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-white font-medium transition"
              >
                Open Task Manager
              </button>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            SECTION 2: PERSONALIZATION (Background, Glass, Sliders)
           ========================================================= */}
        {section === 'personalization' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Personalization</h2>
              <p className="text-xs text-white/50">Background wallpaper, design engine, refraction optics, and glass blur.</p>
            </div>

            {/* Theme Store Action Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-transparent border border-white/[0.06] flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Icon name="Palette" size={14} className="text-cyan-400" />
                  <span>Download Themes from App Store</span>
                </div>
                <div className="text-[11px] text-white/50">
                  Windows XP Luna, Vista Aero Glass, Samsung DeX, ChromeOS, and Cyberpunk.
                </div>
              </div>
              <button
                onClick={() => openApp('appstore')}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition"
              >
                Open Theme Store
              </button>
            </div>

            {/* Design Engine Selector Card */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 space-y-3">
              <div className="text-xs font-semibold text-white">Design Rendering Engine</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'liquid-glass', name: 'Liquid Glass (SVG Physics Refraction)', desc: 'Real Mikhail-Bespalov physics refraction map' },
                  { id: 'frosted-blur', name: 'Static Frosted Blur (Pure CSS)', desc: 'Ultra-smooth GPU backdrop blur' },
                  { id: 'windows-mica', name: 'Windows Mica Elegance', desc: 'Windows 11 style translucent mica surface' },
                  { id: 'dark-slate', name: 'Material Dark Slate', desc: 'Minimalist high-contrast dark surface' },
                ].map((eng) => (
                  <button
                    key={eng.id}
                    onClick={() => setDesignEngine(eng.id as DesignEngine)}
                    className={`p-3 rounded-lg text-left transition border ${
                      designEngine === eng.id
                        ? 'border-cyan-400/80 bg-cyan-500/10 text-white'
                        : 'border-white/[0.04] bg-white/[0.02] text-white/70 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="text-xs font-semibold">{eng.name}</div>
                    <div className="text-[11px] text-white/40 mt-0.5">{eng.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Granular Sliders Card (Without harsh dividing lines) */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-5 space-y-5">
              <div className="text-xs font-semibold text-white">Glass Optics & Surface Controls</div>

              {/* Blur Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white/70">Backdrop Blur Radius</span>
                  <span className="font-mono text-cyan-400">{blurAmount}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={blurAmount}
                  onChange={(e) => setBlurAmount(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-white/10 rounded-lg h-1.5"
                />
              </div>

              {/* Transparency Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white/70">Surface Transparency</span>
                  <span className="font-mono text-cyan-400">{transparency}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={95}
                  value={transparency}
                  onChange={(e) => setTransparency(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-white/10 rounded-lg h-1.5"
                />
              </div>

              {/* Corner Radius Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white/70">Window Corner Squircle Radius</span>
                  <span className="font-mono text-cyan-400">{cornerRadius}px</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={32}
                  value={cornerRadius}
                  onChange={(e) => setCornerRadius(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-white/10 rounded-lg h-1.5"
                />
              </div>
            </div>

            {/* Background Wallpapers */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-white">Desktop Wallpaper Presets</div>
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-xs font-medium text-white transition flex items-center gap-1.5"
                  >
                    <Icon name="Plus" size={12} />
                    <span>Upload Image</span>
                  </button>
                </div>
              </div>

              {uploadError && <p className="text-xs text-rose-400">{uploadError}</p>}

              <div className="grid grid-cols-4 gap-2">
                {PRESET_WALLPAPERS.map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      setWallpaper(w);
                      setSelectedCustomId(null);
                    }}
                    className={`relative rounded-xl overflow-hidden h-16 transition border ${
                      wallpaper === w && !selectedCustomId
                        ? 'border-cyan-400 ring-2 ring-cyan-400/40'
                        : 'border-white/[0.05] hover:border-white/30'
                    }`}
                    style={{ background: WALLPAPERS[w].style }}
                  >
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-0.5 text-[10px] text-white truncate">
                      {WALLPAPERS[w].label}
                    </div>
                  </button>
                ))}

                {customWallpapers.map((cw) => (
                  <button
                    key={cw.id}
                    onClick={() => setSelectedCustomId(cw.id)}
                    className={`relative rounded-xl overflow-hidden h-16 transition border bg-cover bg-center ${
                      selectedCustomId === cw.id
                        ? 'border-cyan-400 ring-2 ring-cyan-400/40'
                        : 'border-white/[0.05] hover:border-white/30'
                    }`}
                    style={{ backgroundImage: `url(${cw.dataUrl})` }}
                  >
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-0.5 text-[10px] text-white truncate">
                      {cw.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            SECTION 3: SHELLS (Cross-Platform OS Environments)
           ========================================================= */}
        {section === 'shells' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Cross-Platform Shells</h2>
              <p className="text-xs text-white/50">Switch your desktop environment instantly between major OS designs.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: 'windows11', name: 'Windows 11 Fluent', desc: 'Mica rounded windows, centered taskbar, floating start menu.', icon: 'Monitor' },
                { id: 'windows10', name: 'Windows 10 Hybrid', desc: 'Sharp taskbar, Cortana search bar, split Start Menu with live tiles.', icon: 'Grid3x3' },
                { id: 'metro', name: 'Windows 8 Metro Live', desc: 'Full-screen flat live tiles dashboard with dynamic application cards.', icon: 'LayoutGrid' },
                { id: 'vista', name: 'Windows Vista Aero Glass', desc: 'Aero Glass windows, glowing Start Orb, and live desktop Sidebar gadgets.', icon: 'Sparkles' },
                { id: 'xp', name: 'Windows XP Luna Blue', desc: 'Luna Blue taskbar, green Start button, and classic 2-column menu.', icon: 'Flame' },
                { id: 'dex', name: 'Samsung DeX Desktop', desc: 'Galaxy environment with bottom DeX bar, app drawer, and multi-window.', icon: 'Layers' },
                { id: 'chromeos', name: 'ChromeOS Material Shelf', desc: 'Minimalist shelf with circular Everything Button and quick settings.', icon: 'Globe' },
                { id: 'mac', name: 'macOS Liquid Aqua', desc: 'Top global menu bar, floating bottom dock, and authentic traffic light beads.', icon: 'Apple' },
                { id: 'ubuntu', name: 'Ubuntu Linux 24.04', desc: 'Left vertical launcher sidebar with activity indicators and top bar.', icon: 'SlidersHorizontal' },
                { id: 'zorin', name: 'Zorin OS 17 Pro', desc: 'Clean Linux desktop with floating pill dock and categorized launcher.', icon: 'Navigation' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setShellMode(s.id as ShellMode)}
                  className={`p-4 rounded-xl text-left flex flex-col justify-between transition border ${
                    shellMode === s.id || (s.id === 'windows11' && shellMode === 'windows') || (s.id === 'metro' && shellMode === 'windows8')
                      ? 'border-cyan-400/80 bg-cyan-500/10 text-white shadow-md'
                      : 'border-white/[0.04] bg-white/[0.02] text-white/70 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <Icon name={s.icon} size={18} className={shellMode === s.id ? 'text-cyan-400' : 'text-white/60'} />
                    <span className="text-xs font-bold text-white">{s.name}</span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">{s.desc}</p>
                </button>
              ))}
            </div>

            {shellMode === 'windows' && (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Windows Taskbar Alignment</div>
                  <div className="text-[11px] text-white/50">Choose between modern centered icons or classic left alignment</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTaskbarStyle('modern')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      taskbarStyle === 'modern' ? 'bg-cyan-500 text-black font-bold' : 'bg-white/[0.05] text-white/60'
                    }`}
                  >
                    Centered
                  </button>
                  <button
                    onClick={() => setTaskbarStyle('classic')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      taskbarStyle === 'classic' ? 'bg-cyan-500 text-black font-bold' : 'bg-white/[0.05] text-white/60'
                    }`}
                  >
                    Left
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* =========================================================
            SECTION 4: LOCK SCREEN & SLEEP (HyperOS 3, MIUIx)
           ========================================================= */}
        {section === 'lockscreen' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Lock screen & sleep</h2>
              <p className="text-xs text-white/50">Customize your lock screen clock typography, status widgets, and sleep gesture.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'hyperos3' as LockScreenStyle,
                  name: 'HyperOS 3 Signature Depth',
                  desc: 'Ultra-bold depth clock typography, date pill, dynamic lossless audio card, and swipe unlock.',
                },
                {
                  id: 'miuix' as LockScreenStyle,
                  name: 'MIUIx Dual-Stacked Clock',
                  desc: 'Stacked hour & orange minute layout with signature battery indicator and clean font.',
                },
                {
                  id: 'windows-hello' as LockScreenStyle,
                  name: 'Windows Hello Modern',
                  desc: 'Centered light typography with acrylic blur background and password unlock.',
                },
                {
                  id: 'cosmic-liquid' as LockScreenStyle,
                  name: 'Cosmic Singularity Minimal',
                  desc: 'Minimal glowing cyan time with orbital starfield canvas and subtle status glyphs.',
                },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setLockScreenStyle(style.id)}
                  className={`p-4 rounded-xl text-left flex flex-col justify-between transition border ${
                    lockScreenStyle === style.id
                      ? 'border-cyan-400/80 bg-cyan-500/10 text-white shadow-md'
                      : 'border-white/[0.04] bg-white/[0.02] text-white/70 hover:bg-white/[0.05]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white mb-1">{style.name}</div>
                    <p className="text-[11px] text-white/50 leading-relaxed">{style.desc}</p>
                  </div>
                  {lockScreenStyle === style.id && (
                    <div className="mt-3 text-xs text-cyan-400 font-semibold flex items-center gap-1.5">
                      <Icon name="Check" size={13} /> Active
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Test Sleep / Lock Now Card */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Sleep Workstation Immediately</div>
                <div className="text-[11px] text-white/50">Lock screen will immediately activate with your selected style.</div>
              </div>
              <button
                onClick={lockSystem}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition flex items-center gap-1.5"
              >
                <Icon name="Lock" size={13} />
                <span>Lock / Sleep Now</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            SECTION 5: TOUCH & TABLET MODE
           ========================================================= */}
        {section === 'touch' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Touch & tablet</h2>
              <p className="text-xs text-white/50">Optimize window sizing, gesture hit-targets, and virtual joysticks.</p>
            </div>

            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Touch-Optimized Window Chrome</div>
                  <div className="text-[11px] text-white/50">Expands titlebars to 48px and enlarges window controls for fingers.</div>
                </div>
                <button
                  onClick={() => setTouchMode(!touchMode)}
                  className={`w-11 h-6 rounded-full transition p-0.5 flex items-center ${
                    touchMode ? 'bg-cyan-500 justify-end' : 'bg-white/20 justify-start'
                  }`}
                >
                  <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Windows 8 Tablet Mode</div>
                  <div className="text-[11px] text-white/50">Switch to full-screen scrollable live tiles mode.</div>
                </div>
                <button
                  onClick={() => setShellMode('metro')}
                  className="px-3.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-white font-medium transition"
                >
                  Launch Windows 8 Metro
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            SECTION 6: ACCOUNTS & PROFILE
           ========================================================= */}
        {section === 'accounts' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Accounts</h2>
              <p className="text-xs text-white/50">Manage your local administrator account, name, and wake password.</p>
            </div>

            <form onSubmit={handleSaveAccount} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-5 space-y-4 max-w-md">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Account Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 mb-2 block">Profile Icon</label>
                <div className="flex items-center gap-2">
                  {['User', 'Sparkles', 'Shield', 'Bot', 'Terminal'].map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatarInput(av)}
                      className={`p-2.5 rounded-xl border transition ${
                        avatarInput === av
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:text-white'
                      }`}
                    >
                      <Icon name={av} size={16} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60 mb-1 block">Wake / Lock Password (Optional)</label>
                <input
                  type="password"
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  placeholder="Leave empty for instant wake"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder-white/30"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition"
                >
                  Save Account Changes
                </button>
                {savedMsg && <span className="text-xs text-emerald-400 font-medium">Saved</span>}
              </div>
            </form>
          </motion.div>
        )}

        {/* =========================================================
            SECTION 7: ABOUT (Windows 11 Specifications)
           ========================================================= */}
        {section === 'about' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">About</h2>
              <p className="text-xs text-white/50">Device specifications and Windows specifications.</p>
            </div>

            {/* Device specs */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-5 space-y-3 text-xs">
              <div className="font-semibold text-white mb-2">Device specifications</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-white/70">
                <div><span className="text-white/40">Device name:</span> {deviceName}</div>
                <div><span className="text-white/40">Processor:</span> Quantum Singularity Core (GLSL Raymarching)</div>
                <div><span className="text-white/40">Installed RAM:</span> 32.0 GB (31.8 GB usable)</div>
                <div><span className="text-white/40">System type:</span> 64-bit operating system, ARM/x64-based processor</div>
                <div><span className="text-white/40">Pen and touch:</span> Touch support with multi-touch gestures</div>
              </div>
            </div>

            {/* Windows specs */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-5 space-y-3 text-xs">
              <div className="font-semibold text-white mb-2">Windows specifications</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-white/70">
                <div><span className="text-white/40">Edition:</span> LiquidOS 11 Pro Workstation</div>
                <div><span className="text-white/40">Version:</span> LiquidOS-4.1.0-Beta</div>
                <div><span className="text-white/40">Installed on:</span> 2026/10/31</div>
                <div><span className="text-white/40">OS build:</span> 26100.1882</div>
                <div><span className="text-white/40">Experience:</span> Windows Feature Experience Pack 1000.26100.32.0</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
