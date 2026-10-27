import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOS } from '../OSContext';
import { STORE_CATALOG, StoreApp, InstalledApp, StoreTheme } from '../types';
import { Icon } from '../Icon';

type Tab = 'featured' | 'themes' | 'utilities' | 'games' | 'library';
type ThemeCategory = 'all' | 'retro' | 'modern' | 'minimal' | 'cyber' | 'nature';

function parseGitHubUrl(url: string): { valid: boolean; owner?: string; repo?: string; pagesUrl?: string } {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (!m) return { valid: false };
  const owner = m[1];
  const repo = m[2].replace(/\.git$/, '');
  const pagesUrl = `https://${owner}.github.io/${repo}/`;
  return { valid: true, owner, repo, pagesUrl };
}

export function AppStoreApp() {
  const {
    installedApps,
    installApp,
    uninstallApp,
    launchInstalledApp,
    isInstalled,
    storeThemes,
    installedThemeIds,
    currentThemeId,
    installTheme,
    uninstallTheme,
    applyThemeConfig,
    isThemeInstalled,
  } = useOS();

  const [tab, setTab] = useState<Tab>('featured');
  const [librarySubTab, setLibrarySubTab] = useState<'themes' | 'apps'>('themes');
  const [themeCat, setThemeCat] = useState<ThemeCategory>('all');
  const [themeSearch, setThemeSearch] = useState('');
  const [downloadingThemes, setDownloadingThemes] = useState<Record<string, number>>({});
  const [repoUrl, setRepoUrl] = useState('');
  const [repoError, setRepoError] = useState('');
  const [installing, setInstalling] = useState(false);
  const [detailApp, setDetailApp] = useState<StoreApp | InstalledApp | null>(null);
  const [detailTheme, setDetailTheme] = useState<StoreTheme | null>(null);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'featured', label: 'Featured', icon: 'Star' },
    { id: 'themes', label: 'Themes & Skins', icon: 'Palette' },
    { id: 'utilities', label: 'Utilities', icon: 'LayoutGrid' },
    { id: 'games', label: 'Games', icon: 'Gamepad2' },
    { id: 'library', label: 'Library', icon: 'Download' },
  ];

  const handleInstallApp = (app: StoreApp) => {
    installApp(app);
  };

  const handleDownloadTheme = (theme: StoreTheme) => {
    if (downloadingThemes[theme.id]) return;
    setDownloadingThemes((prev) => ({ ...prev, [theme.id]: 15 }));
    const t1 = setTimeout(() => setDownloadingThemes((prev) => ({ ...prev, [theme.id]: 60 })), 300);
    const t2 = setTimeout(() => {
      setDownloadingThemes((prev) => ({ ...prev, [theme.id]: 100 }));
      installTheme(theme.id);
      setTimeout(() => {
        setDownloadingThemes((prev) => {
          const next = { ...prev };
          delete next[theme.id];
          return next;
        });
      }, 400);
    }, 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  };

  const handleGitHubInstall = () => {
    const url = repoUrl.trim();
    if (!url) { setRepoError('Please paste a GitHub repository URL.'); return; }
    const parsed = parseGitHubUrl(url);
    if (!parsed.valid || !parsed.pagesUrl) {
      setRepoError('Invalid URL. Use https://github.com/owner/repo');
      return;
    }
    setRepoError('');
    setInstalling(true);
    const repoName = parsed.repo ?? 'Custom App';
    installApp({
      name: repoName,
      url: parsed.pagesUrl,
      icon: 'GitBranch',
      description: `GitHub app from ${parsed.owner}/${parsed.repo}. Runs via GitHub Pages.`,
      author: parsed.owner ?? 'GitHub',
      category: 'utilities',
    });
    setTimeout(() => setInstalling(false), 600);
    setRepoUrl('');
  };

  const filteredThemes = storeThemes.filter((t) => {
    const matchesCat = themeCat === 'all' || t.category === themeCat;
    const matchesSearch =
      !themeSearch.trim() ||
      t.name.toLowerCase().includes(themeSearch.toLowerCase()) ||
      t.nameJa.includes(themeSearch) ||
      t.description.toLowerCase().includes(themeSearch.toLowerCase()) ||
      t.descriptionJa.includes(themeSearch);
    return matchesCat && matchesSearch;
  });

  const catalogFiltered = tab === 'featured' ? STORE_CATALOG : STORE_CATALOG.filter((a) => a.category === tab);

  const renderThemeCard = (theme: StoreTheme) => {
    const installed = isThemeInstalled(theme.id);
    const isActive = currentThemeId === theme.id;
    const progress = downloadingThemes[theme.id];
    const isDownloading = progress !== undefined;

    return (
      <div
        key={theme.id}
        className={`glass-panel rounded-2xl overflow-hidden flex flex-col border transition duration-200 group ${
          isActive
            ? 'border-cyan-400/60 shadow-lg shadow-cyan-500/10 bg-cyan-950/20'
            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
        }`}
      >
        {/* Visual Preview Header */}
        <div className={`relative h-28 bg-gradient-to-br ${theme.previewGradient} p-3 flex flex-col justify-between overflow-hidden`}>
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-black/50 text-white/90 border border-white/20 backdrop-blur-md">
              {theme.badge}
            </span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 text-[10px] text-amber-300 font-medium backdrop-blur-md">
              <Icon name="Star" size={11} className="fill-amber-400 text-amber-400" />
              <span>{theme.rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="relative z-10 flex items-end justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className="h-3.5 w-3.5 rounded-full border border-white/40 shadow-sm"
                style={{ backgroundColor: theme.accentColor }}
                title={`Accent: ${theme.accentColor}`}
              />
              <span className="text-[11px] font-mono text-white/80 drop-shadow">
                {theme.config.shellMode.toUpperCase()}
              </span>
            </div>
            <span className="text-[10px] text-white/70 font-mono drop-shadow">
              {theme.downloads} dl
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 flex flex-col gap-2">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm text-white font-semibold group-hover:text-cyan-300 transition truncate">
                {theme.name}
              </h3>
            </div>
            <div className="text-[11px] text-cyan-400/90 font-medium">
              {theme.nameJa}
            </div>
            <p className="text-[10px] text-white/40 mt-0.5">{theme.author} • v{theme.version} ({theme.size})</p>
          </div>

          <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
            {theme.descriptionJa || theme.description}
          </p>

          <div className="flex flex-wrap gap-1 mt-1">
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 border border-white/10 text-white/60">
              {theme.config.wallpaper}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 border border-white/10 text-white/60">
              {theme.config.designEngine}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 border border-white/10 text-white/60">
              {theme.config.theme} mode
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
            <button
              onClick={() => setDetailTheme(theme)}
              className="text-xs text-white/50 hover:text-white transition flex items-center gap-1"
            >
              <Icon name="Eye" size={13} />
              <span>Preview</span>
            </button>

            {isDownloading ? (
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-cyan-300 font-mono">{progress}%</span>
              </div>
            ) : isActive ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                <Icon name="Check" size={13} />
                <span>Active</span>
              </div>
            ) : installed ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => applyThemeConfig(theme.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
                >
                  <Icon name="Check" size={13} />
                  <span>Apply</span>
                </button>
                <button
                  onClick={() => uninstallTheme(theme.id)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition"
                  title="Remove theme"
                >
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleDownloadTheme(theme)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-cyan-500 hover:text-slate-950 text-white font-medium text-xs transition flex items-center gap-1.5 border border-white/10"
              >
                <Icon name="Download" size={13} />
                <span>Get</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAppCard = (app: StoreApp, installed: boolean) => (
    <div
      key={app.id}
      className="glass-panel rounded-xl p-4 flex flex-col gap-3 hover:bg-white/8 transition group"
    >
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl glass-panel flex items-center justify-center shrink-0 group-hover:scale-105 transition">
          <Icon name={app.icon} size={24} className="text-brand-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm text-white font-medium truncate">{app.name}</h3>
          <p className="text-[11px] text-white/50 truncate">{app.author}</p>
        </div>
      </div>
      <p className="text-[11px] text-white/60 leading-relaxed line-clamp-2">{app.description}</p>
      <div className="flex items-center justify-between mt-auto">
        <button
          onClick={() => setDetailApp(app)}
          className="text-[11px] text-white/50 hover:text-white/80 transition"
        >
          Details
        </button>
        {installed ? (
          <div className="flex gap-1.5">
            <button
              onClick={() => launchInstalledApp(app.id)}
              className="px-3 py-1.5 rounded-lg text-[11px] bg-brand-500/80 hover:bg-brand-500 text-white font-medium transition"
            >
              Open
            </button>
            <button
              onClick={() => uninstallApp(app.id)}
              className="px-2 py-1.5 rounded-lg text-[11px] text-white/50 hover:text-red-400 hover:bg-white/8 transition"
            >
              <Icon name="Trash2" size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleInstallApp(app)}
            className="px-4 py-1.5 rounded-lg text-[11px] bg-brand-500 hover:bg-brand-400 text-white font-medium transition liquid-glow"
          >
            Get
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-full min-w-0 min-h-0 bg-zinc-950/40">
      {/* Sidebar */}
      <div className="w-48 shrink-0 border-r border-white/10 p-3 overflow-y-auto flex flex-col justify-between">
        <div>
          <div className="text-[11px] text-white/40 px-2 py-1 uppercase tracking-wider mb-2 font-semibold">
            Liquid Store
          </div>
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition mb-1 ${
                  active ? 'bg-cyan-500/25 text-cyan-300 font-semibold border border-cyan-400/30' : 'text-white/70 hover:bg-white/10'
                }`}
              >
                <Icon name={t.icon} size={16} className={active ? 'text-cyan-300' : 'text-white/50'} />
                <span>{t.label}</span>
                {t.id === 'themes' && (
                  <span className="ml-auto text-[9px] bg-cyan-500/30 text-cyan-300 px-1.5 py-0.2 rounded-full font-bold">
                    {storeThemes.length}
                  </span>
                )}
                {t.id === 'library' && (
                  <span className="ml-auto text-[10px] bg-white/15 px-1.5 rounded-full">
                    {installedApps.length + installedThemeIds.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* GitHub loader */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="text-[11px] text-white/40 px-2 py-1 uppercase tracking-wider mb-2">Developer</div>
          <div className="glass-panel rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon name="GitBranch" size={13} className="text-brand-300" />
              <span className="text-[11px] text-white/70 font-medium">GitHub App</span>
            </div>
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGitHubInstall()}
              placeholder="github.com/owner/repo"
              className="w-full bg-black/30 border border-white/15 rounded-lg px-2 py-1.5 text-[11px] text-white/90 outline-none focus:border-brand-400 mb-1.5"
              spellCheck={false}
            />
            {repoError && <p className="text-[10px] text-red-400 mb-1.5">{repoError}</p>}
            <button
              onClick={handleGitHubInstall}
              disabled={installing}
              className="w-full px-2 py-1.5 rounded-lg text-[11px] bg-brand-500/80 hover:bg-brand-500 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {installing ? (
                <><Icon name="RefreshCw" size={12} className="animate-spin" /> Installing...</>
              ) : (
                <><Icon name="Rocket" size={12} /> Install</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 overflow-y-auto p-5">
        {/* Tab: Featured */}
        {tab === 'featured' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Top Themes Hero Banner */}
            <div className="relative rounded-2xl overflow-hidden p-6 border border-white/15 bg-gradient-to-r from-blue-900/60 via-purple-900/40 to-slate-900/80 shadow-2xl">
              <div className="relative z-10 max-w-lg space-y-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/30 text-cyan-300 border border-cyan-400/30">
                  New Visual Shells & Themes
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Transform LiquidOS Experience
                </h2>
                <p className="text-xs text-white/70 leading-relaxed">
                  Download authentic OS themes: Windows XP Luna, Windows Vista Aero Glass with live gadgets, Windows 10 & 11, Samsung DeX, Cyberpunk 3D Black Hole, and more.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => setTab('themes')}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/25 flex items-center gap-2"
                  >
                    <Icon name="Palette" size={14} />
                    <span>Browse Themes Catalog</span>
                  </button>
                  <button
                    onClick={() => applyThemeConfig('vista-aero')}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition border border-white/10"
                  >
                    Quick Apply Vista Aero
                  </button>
                </div>
              </div>
            </div>

            {/* Featured Themes Preview Row */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Icon name="Sparkles" size={16} className="text-cyan-400" />
                  <span>Trending Themes</span>
                </h3>
                <button
                  onClick={() => setTab('themes')}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  View all ({storeThemes.length}) →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {storeThemes.slice(0, 3).map((theme) => renderThemeCard(theme))}
              </div>
            </div>

            {/* Featured Apps Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Icon name="LayoutGrid" size={16} className="text-brand-300" />
                  <span>Featured Apps</span>
                </h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {STORE_CATALOG.slice(0, 6).map((app) => renderAppCard(app, isInstalled(app.id)))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Themes & Skins */}
        {tab === 'themes' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
              <div>
                <h2 className="text-lg text-white font-semibold flex items-center gap-2">
                  <Icon name="Palette" size={20} className="text-cyan-300" />
                  <span>Visual Themes & Shells</span>
                  <span className="text-xs font-normal text-white/50">({filteredThemes.length} available)</span>
                </h2>
                <p className="text-xs text-white/50">
                  Instantly download and apply complete OS shells, wallpapers, and design engines.
                </p>
              </div>

              {/* Theme search */}
              <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-cyan-400/50 w-full sm:w-64">
                <Icon name="Search" size={14} className="text-white/40" />
                <input
                  value={themeSearch}
                  onChange={(e) => setThemeSearch(e.target.value)}
                  placeholder="Search themes (XP, Vista, Cyber, DeX)..."
                  className="bg-transparent text-xs text-white outline-none w-full placeholder:text-white/40"
                />
                {themeSearch && (
                  <button onClick={() => setThemeSearch('')} className="text-white/40 hover:text-white">
                    <Icon name="X" size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Category filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  { id: 'all', label: 'All Themes' },
                  { id: 'retro', label: 'Retro (XP / Vista / Win8)' },
                  { id: 'modern', label: 'Modern (Win10 / Win11 / DeX)' },
                  { id: 'minimal', label: 'Minimal (macOS / ChromeOS)' },
                  { id: 'cyber', label: 'Cyber & 3D (Neon / OLED)' },
                  { id: 'nature', label: 'Aesthetic / Nature' },
                ] as { id: ThemeCategory; label: string }[]
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setThemeCat(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition ${
                    themeCat === cat.id
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Themes Grid */}
            {filteredThemes.length === 0 ? (
              <div className="py-16 text-center text-white/40">
                <Icon name="Palette" size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No themes found matching your filter</p>
                <button
                  onClick={() => { setThemeCat('all'); setThemeSearch(''); }}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredThemes.map((theme) => renderThemeCard(theme))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab: Utilities & Games */}
        {(tab === 'utilities' || tab === 'games') && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-lg text-white font-semibold mb-4 capitalize flex items-center gap-2">
              <Icon name={tab === 'games' ? 'Gamepad2' : 'LayoutGrid'} size={20} className="text-brand-300" />
              <span>{tab}</span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {catalogFiltered.map((app) => renderAppCard(app, isInstalled(app.id)))}
            </div>
          </motion.div>
        )}

        {/* Tab: Library */}
        {tab === 'library' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h2 className="text-lg text-white font-semibold flex items-center gap-2">
                <Icon name="Download" size={20} className="text-cyan-300" />
                <span>Installed Library</span>
              </h2>

              <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setLibrarySubTab('themes')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    librarySubTab === 'themes' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Themes ({installedThemeIds.length})
                </button>
                <button
                  onClick={() => setLibrarySubTab('apps')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    librarySubTab === 'apps' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Apps ({installedApps.length})
                </button>
              </div>
            </div>

            {librarySubTab === 'themes' ? (
              <div className="space-y-3">
                {installedThemeIds.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-white/40">
                    <Icon name="Palette" size={40} className="mb-3 opacity-30" />
                    <p className="text-sm">No themes installed</p>
                    <button
                      onClick={() => setTab('themes')}
                      className="mt-3 px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                    >
                      Browse Store Themes
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {storeThemes
                      .filter((t) => installedThemeIds.includes(t.id))
                      .map((theme) => renderThemeCard(theme))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {installedApps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-white/40">
                    <Icon name="Download" size={40} className="mb-3 opacity-40" />
                    <p className="text-sm">No apps installed yet</p>
                    <p className="text-xs mt-1">Browse the store and install apps to see them here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {installedApps.map((app) => (
                      <div key={app.id} className="glass-panel rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-12 w-12 rounded-xl glass-panel flex items-center justify-center shrink-0">
                            <Icon name={app.icon} size={24} className="text-brand-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm text-white font-medium truncate">{app.name}</h3>
                            <p className="text-[11px] text-white/50 truncate">{app.author}</p>
                            {app.isCustom && (
                              <span className="inline-block mt-0.5 text-[9px] bg-accent-500/30 text-accent-400 px-1.5 rounded">GitHub</span>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-white/60 leading-relaxed line-clamp-2">{app.description}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-[10px] text-white/40">
                            {new Date(app.installedAt).toLocaleDateString()}
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => launchInstalledApp(app.appId)}
                              className="px-3 py-1.5 rounded-lg text-[11px] bg-brand-500/80 hover:bg-brand-500 text-white font-medium transition"
                            >
                              Open
                            </button>
                            <button
                              onClick={() => setDetailApp(app)}
                              className="px-2 py-1.5 rounded-lg text-[11px] text-white/50 hover:bg-white/8 transition"
                            >
                              <Icon name="Info" size={13} />
                            </button>
                            <button
                              onClick={() => uninstallApp(app.appId)}
                              className="px-2 py-1.5 rounded-lg text-[11px] text-white/50 hover:text-red-400 hover:bg-white/8 transition"
                            >
                              <Icon name="Trash2" size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Theme Detail Preview Modal */}
      <AnimatePresence>
        {detailTheme && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setDetailTheme(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="glass-panel rounded-2xl max-w-lg w-full overflow-hidden border border-white/20 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header preview banner */}
              <div className={`h-36 bg-gradient-to-br ${detailTheme.previewGradient} p-4 flex flex-col justify-between relative`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 flex justify-between items-start">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-black/60 text-white border border-white/20">
                    {detailTheme.badge}
                  </span>
                  <button
                    onClick={() => setDetailTheme(null)}
                    className="p-1 rounded-full bg-black/50 text-white/80 hover:text-white"
                  >
                    <Icon name="X" size={16} />
                  </button>
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white drop-shadow">{detailTheme.name}</h3>
                  <div className="text-xs text-white/90 drop-shadow">{detailTheme.nameJa}</div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Author: <strong className="text-white">{detailTheme.author}</strong></span>
                  <span>Version: <strong className="text-white">v{detailTheme.version}</strong></span>
                  <span>Size: <strong className="text-white">{detailTheme.size}</strong></span>
                </div>

                <p className="text-xs text-white/80 leading-relaxed">
                  {detailTheme.descriptionJa}
                </p>
                <p className="text-[11px] text-white/50 leading-relaxed italic">
                  {detailTheme.description}
                </p>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs text-white/70">
                  <div className="font-semibold text-white/90 mb-1">Theme Specifications:</div>
                  <div className="flex justify-between">
                    <span>Shell Mode:</span>
                    <span className="font-mono text-cyan-300 font-semibold">{detailTheme.config.shellMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Design Engine:</span>
                    <span className="font-mono text-white/90">{detailTheme.config.designEngine}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wallpaper:</span>
                    <span className="font-mono text-white/90">{detailTheme.config.wallpaper}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accent Tone:</span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full inline-block border border-white/30" style={{ backgroundColor: detailTheme.accentColor }} />
                      <span className="font-mono text-white/90">{detailTheme.accentColor}</span>
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setDetailTheme(null)}
                    className="px-4 py-2 rounded-xl text-xs text-white/70 hover:bg-white/10 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      applyThemeConfig(detailTheme.id);
                      setDetailTheme(null);
                    }}
                    className="px-5 py-2 rounded-xl text-xs bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                  >
                    <Icon name="Check" size={14} />
                    <span>Apply Theme</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* App Detail Modal */}
      <AnimatePresence>
        {detailApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setDetailApp(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="glass-panel rounded-2xl p-6 w-96 max-w-[90%]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-2xl glass-panel flex items-center justify-center">
                  <Icon name={detailApp.icon} size={32} className="text-brand-300" />
                </div>
                <div>
                  <h3 className="text-lg text-white font-semibold">{detailApp.name}</h3>
                  <p className="text-xs text-white/50">{detailApp.author}</p>
                </div>
              </div>
              <p className="text-sm text-white/70 leading-relaxed mb-4">{detailApp.description}</p>
              <div className="space-y-1.5 text-xs text-white/50 mb-5">
                <div className="flex justify-between"><span>Category</span><span className="text-white/80 capitalize">{detailApp.category}</span></div>
                {'url' in detailApp && (
                  <div className="flex justify-between"><span>URL</span><span className="text-white/60 truncate ml-2 max-w-[200px]">{(detailApp as { url?: string }).url}</span></div>
                )}
                {'installedAt' in detailApp && (
                  <div className="flex justify-between"><span>Installed</span><span className="text-white/80">{new Date((detailApp as InstalledApp).installedAt).toLocaleString()}</span></div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDetailApp(null)}
                  className="px-4 py-2 rounded-lg text-xs text-white/70 hover:bg-white/10 transition"
                >
                  Close
                </button>
                {'appId' in detailApp ? (
                  <button
                    onClick={() => { launchInstalledApp((detailApp as InstalledApp).appId); setDetailApp(null); }}
                    className="px-4 py-2 rounded-lg text-xs bg-brand-500 hover:bg-brand-400 text-white font-medium transition liquid-glow"
                  >
                    Open App
                  </button>
                ) : !isInstalled((detailApp as StoreApp).id) ? (
                  <button
                    onClick={() => { handleInstallApp(detailApp as StoreApp); setDetailApp(null); }}
                    className="px-4 py-2 rounded-lg text-xs bg-brand-500 hover:bg-brand-400 text-white font-medium transition liquid-glow"
                  >
                    Install
                  </button>
                ) : (
                  <button
                    onClick={() => { launchInstalledApp((detailApp as StoreApp).id); setDetailApp(null); }}
                    className="px-4 py-2 rounded-lg text-xs bg-brand-500 hover:bg-brand-400 text-white font-medium transition liquid-glow"
                  >
                    Open
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
