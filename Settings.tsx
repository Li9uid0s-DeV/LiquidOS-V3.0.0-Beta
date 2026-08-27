import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useOS, Wallpaper, Theme } from '../OSContext';
import { WALLPAPERS } from '../wallpapers';
import { Icon } from '../Icon';

type Section = 'personalization' | 'system' | 'about';

const PRESET_WALLPAPERS: Wallpaper[] = ['space', 'aurora', 'sunset', 'ocean', 'forest', 'cosmic', 'bloom', 'shader'];

export function SettingsApp() {
  const {
    wallpaper, setWallpaper, theme, setTheme, quickSettings, toggleQuick,
    customWallpapers, addCustomWallpaper, selectedCustomId, setSelectedCustomId,
    liteMode, setLiteMode, taskbarAlign, setTaskbarAlign, transparency, setTransparency,
  } = useOS();
  const [section, setSection] = useState<Section>('personalization');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'personalization', label: 'Personalization', icon: 'Palette' },
    { id: 'system', label: 'System', icon: 'Monitor' },
    { id: 'about', label: 'About', icon: 'Info' },
  ];

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    // Validate type
    const valid = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!valid.includes(file.type)) {
      setUploadError('Please upload a JPG, PNG, GIF, or WebP file.');
      return;
    }
    // Limit to ~8MB to avoid localStorage quota issues
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File too large (max 8MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      addCustomWallpaper(file.name, dataUrl);
      // Switch off preset selection since we're using custom
    };
    reader.onerror = () => setUploadError('Failed to read file.');
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="flex h-full w-full min-w-0 min-h-0 bg-zinc-900/40">
      {/* Sidebar */}
      <div className="w-48 shrink-0 border-r border-white/10 p-2 overflow-y-auto">
        <div className="text-[11px] text-white/40 px-2 py-1 uppercase tracking-wider">Settings</div>
        {sections.map((s) => {
          const active = section === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded text-xs transition mb-0.5 ${
                active ? 'bg-brand-500/30 text-white' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              <Icon name={s.icon} size={15} className={active ? 'text-brand-300' : 'text-white/50'} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        {section === 'personalization' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <h2 className="text-lg text-white font-semibold mb-1">Personalization</h2>
              <p className="text-xs text-white/50">Customize the look of your desktop.</p>
            </div>

            {/* Preset Wallpapers */}
            <div>
              <h3 className="text-sm text-white/80 font-medium mb-3">Background wallpaper</h3>
              <div className="grid grid-cols-4 gap-2.5">
                {PRESET_WALLPAPERS.map((w) => (
                  <button
                    key={w}
                    onClick={() => { setWallpaper(w); setSelectedCustomId(null); }}
                    className={`relative rounded-lg overflow-hidden h-16 transition group ${
                      wallpaper === w && !selectedCustomId ? 'ring-2 ring-brand-400 liquid-glow' : 'ring-1 ring-white/10 hover:ring-white/30'
                    }`}
                    style={{ background: WALLPAPERS[w].style }}
                  >
                    {w === 'shader' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon name="Sparkles" size={16} className="text-white/70" />
                      </div>
                    )}
                    <span className="absolute bottom-0.5 left-1.5 text-[9px] text-white/90 drop-shadow leading-tight">
                      {WALLPAPERS[w].label.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Wallpaper Upload */}
            <div>
              <h3 className="text-sm text-white/80 font-medium mb-3 flex items-center gap-2">
                <Icon name="Upload" size={14} className="text-brand-300" /> Custom wallpaper
              </h3>
              <div className="glass-panel rounded-xl p-4">
                <p className="text-xs text-white/50 mb-3">
                  Upload your own image or GIF. It stays saved even after reload.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-brand-500/80 hover:bg-brand-500 text-white text-xs font-medium transition flex items-center gap-2"
                >
                  <Icon name="Upload" size={14} /> Choose file
                </button>
                {uploadError && (
                  <p className="text-xs text-red-400 mt-2">{uploadError}</p>
                )}
                {customWallpapers.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {customWallpapers.map((cw) => (
                      <button
                        key={cw.id}
                        onClick={() => { setSelectedCustomId(cw.id); setWallpaper('aurora'); }}
                        className={`relative rounded-lg overflow-hidden h-16 transition ${
                          selectedCustomId === cw.id ? 'ring-2 ring-brand-400 liquid-glow' : 'ring-1 ring-white/10 hover:ring-white/30'
                        }`}
                        style={{ backgroundImage: `url(${cw.dataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                      >
                        <span className="absolute bottom-0.5 left-1.5 text-[9px] text-white/90 drop-shadow bg-black/40 px-1 rounded truncate max-w-full">
                          {cw.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Theme */}
            <div>
              <h3 className="text-sm text-white/80 font-medium mb-3">Theme</h3>
              <div className="flex gap-3">
                {(['dark', 'light'] as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTheme(t);
                      if (t === 'dark' && !quickSettings.darkMode) toggleQuick('darkMode');
                      if (t === 'light' && quickSettings.darkMode) toggleQuick('darkMode');
                    }}
                    className={`px-4 py-2 rounded-lg text-xs capitalize transition ${
                      theme === t ? 'bg-brand-500 text-white liquid-glow' : 'glass-panel text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <Icon name={t === 'dark' ? 'Moon' : 'Sun'} size={14} className="inline mr-1" />
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Taskbar alignment */}
            <div>
              <h3 className="text-sm text-white/80 font-medium mb-3 flex items-center gap-2">
                <Icon name="AlignCenter" size={14} className="text-brand-300" /> Taskbar alignment
              </h3>
              <div className="flex gap-3">
                {(['center', 'left'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setTaskbarAlign(a)}
                    className={`px-4 py-2 rounded-lg text-xs capitalize transition flex items-center gap-1.5 ${
                      taskbarAlign === a ? 'bg-brand-500 text-white liquid-glow' : 'glass-panel text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <Icon name={a === 'center' ? 'AlignCenter' : 'AlignLeft'} size={14} />
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Transparency slider */}
            <div>
              <h3 className="text-sm text-white/80 font-medium mb-3">Glass transparency</h3>
              <div className="glass-panel rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/60">Opacity</span>
                  <span className="text-xs text-brand-300 font-bold tabular-nums">{transparency}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={transparency}
                  onChange={(e) => setTransparency(parseInt(e.target.value, 10))}
                  className="w-full accent-brand-400"
                />
              </div>
            </div>
          </motion.div>
        )}

        {section === 'system' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <h2 className="text-lg text-white font-semibold mb-1">System</h2>
              <p className="text-xs text-white/50">Performance, quick settings and device info.</p>
            </div>

            {/* Lite Mode */}
            <div className="glass-panel rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="Zap" size={18} className="text-amber-300" />
                <div>
                  <div className="text-sm text-white/80">Lite Mode</div>
                  <div className="text-[11px] text-white/50">Disables WebGL shader & reduces blur for better performance.</div>
                </div>
              </div>
              <button
                onClick={() => setLiteMode(!liteMode)}
                className={`relative w-11 h-6 rounded-full transition ${liteMode ? 'bg-amber-500' : 'bg-white/15'}`}
              >
                <motion.span
                  layout
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                  animate={{ left: liteMode ? 22 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Quick settings toggles */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'wifi' as const, label: 'Wi-Fi', icon: 'Wifi' },
                { key: 'bluetooth' as const, label: 'Bluetooth', icon: 'Bluetooth' },
                { key: 'darkMode' as const, label: 'Dark Mode', icon: 'Moon' },
              ].map((q) => (
                <div key={q.key} className="glass-panel rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name={q.icon} size={18} className="text-brand-300" />
                    <span className="text-sm text-white/80">{q.label}</span>
                  </div>
                  <button
                    onClick={() => toggleQuick(q.key)}
                    className={`relative w-11 h-6 rounded-full transition ${quickSettings[q.key] ? 'bg-brand-500' : 'bg-white/15'}`}
                  >
                    <motion.span
                      layout
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                      animate={{ left: quickSettings[q.key] ? 22 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="glass-panel rounded-xl p-4">
              <h3 className="text-sm text-white/80 font-medium mb-3">Display</h3>
              <div className="space-y-2 text-xs text-white/60">
                <div className="flex justify-between"><span>Resolution</span><span>{window.innerWidth} × {window.innerHeight}</span></div>
                <div className="flex justify-between"><span>Scaling</span><span>100%</span></div>
                <div className="flex justify-between"><span>Orientation</span><span>Landscape</span></div>
              </div>
            </div>

            {/* Keyboard shortcuts */}
            <div className="glass-panel rounded-xl p-4">
              <h3 className="text-sm text-white/80 font-medium mb-3 flex items-center gap-2">
                <Icon name="Keyboard" size={14} className="text-brand-300" /> Keyboard shortcuts
              </h3>
              <div className="space-y-2 text-xs text-white/60">
                <div className="flex justify-between"><span>Open Start menu</span><kbd className="px-2 py-0.5 rounded bg-white/10 text-white/80">Win / Meta</kbd></div>
                <div className="flex justify-between"><span>Close active window</span><kbd className="px-2 py-0.5 rounded bg-white/10 text-white/80">Alt + Q</kbd></div>
                <div className="flex justify-between"><span>Toggle maximize</span><kbd className="px-2 py-0.5 rounded bg-white/10 text-white/80">Double-click title bar</kbd></div>
              </div>
            </div>
          </motion.div>
        )}

        {section === 'about' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <h2 className="text-lg text-white font-semibold mb-1">About</h2>
              <p className="text-xs text-white/50">System specifications.</p>
            </div>
            <div className="glass-panel rounded-xl p-5 space-y-3 text-sm">
              <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-white/50">OS name</span><span className="text-white/90">Liquid OS</span></div>
              <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-white/50">Version</span><span className="text-white/90">2.0.0 (Glass)</span></div>
              <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-white/50">UI</span><span className="text-white/90">Liquid Glass</span></div>
              <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-white/50">Background engine</span><span className="text-white/90">{liteMode ? 'Static gradient (Lite)' : wallpaper === 'shader' ? 'WebGL Shader' : 'CSS Gradient'}</span></div>
              <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-white/50">Browser engine</span><span className="text-white/90">{navigator.userAgent.split(') ')[0].split('(').pop()}</span></div>
              <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-white/50">Cores</span><span className="text-white/90">{navigator.hardwareConcurrency ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Memory</span><span className="text-white/90">{(navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? '—'} GB</span></div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
