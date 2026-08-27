import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOS } from '../OSContext';
import { STORE_CATALOG, StoreApp, InstalledApp } from '../types';
import { Icon } from '../Icon';

type Tab = 'featured' | 'utilities' | 'games' | 'library';

function parseGitHubUrl(url: string): { valid: boolean; owner?: string; repo?: string; pagesUrl?: string } {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (!m) return { valid: false };
  const owner = m[1];
  const repo = m[2].replace(/\.git$/, '');
  const pagesUrl = `https://${owner}.github.io/${repo}/`;
  return { valid: true, owner, repo, pagesUrl };
}

export function AppStoreApp() {
  const { installedApps, installApp, uninstallApp, launchInstalledApp, isInstalled } = useOS();
  const [tab, setTab] = useState<Tab>('featured');
  const [repoUrl, setRepoUrl] = useState('');
  const [repoError, setRepoError] = useState('');
  const [installing, setInstalling] = useState(false);
  const [detailApp, setDetailApp] = useState<StoreApp | InstalledApp | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'featured', label: 'Featured', icon: 'Star' },
    { id: 'utilities', label: 'Utilities', icon: 'LayoutGrid' },
    { id: 'games', label: 'Games', icon: 'Gamepad2' },
    { id: 'library', label: 'Library', icon: 'Download' },
  ];

  const handleInstall = (app: StoreApp) => {
    installApp(app);
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

  const catalogFiltered = tab === 'featured' ? STORE_CATALOG : STORE_CATALOG.filter((a) => a.category === tab);

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
            onClick={() => handleInstall(app)}
            className="px-4 py-1.5 rounded-lg text-[11px] bg-brand-500 hover:bg-brand-400 text-white font-medium transition liquid-glow"
          >
            Get
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-full min-w-0 min-h-0 bg-zinc-950/30">
      {/* Sidebar */}
      <div className="w-44 shrink-0 border-r border-white/10 p-2 overflow-y-auto">
        <div className="text-[11px] text-white/40 px-2 py-1 uppercase tracking-wider mb-1">App Store</div>
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded text-xs transition mb-0.5 ${
                active ? 'bg-brand-500/30 text-white' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              <Icon name={t.icon} size={15} className={active ? 'text-brand-300' : 'text-white/50'} />
              {t.label}
              {t.id === 'library' && installedApps.length > 0 && (
                <span className="ml-auto text-[10px] bg-white/15 px-1.5 rounded-full">{installedApps.length}</span>
              )}
            </button>
          );
        })}

        {/* GitHub loader */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="text-[11px] text-white/40 px-2 py-1 uppercase tracking-wider mb-2">Developer</div>
          <div className="glass-panel rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon name="GitBranch" size={13} className="text-brand-300" />
              <span className="text-[11px] text-white/70 font-medium">GitHub App</span>
            </div>
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGitHubInstall()}
              placeholder="github.com/owner/repo"
              className="w-full bg-black/30 border border-white/15 rounded px-2 py-1.5 text-[11px] text-white/90 outline-none focus:border-brand-400 mb-1.5"
              spellCheck={false}
            />
            {repoError && <p className="text-[10px] text-red-400 mb-1.5">{repoError}</p>}
            <button
              onClick={handleGitHubInstall}
              disabled={installing}
              className="w-full px-2 py-1.5 rounded text-[11px] bg-brand-500/80 hover:bg-brand-500 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-1.5"
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

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto p-5">
        {tab === 'featured' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-5">
              <h2 className="text-lg text-white font-semibold mb-1 flex items-center gap-2">
                <Icon name="Sparkles" size={18} className="text-brand-300" /> Featured Apps
              </h2>
              <p className="text-xs text-white/50">Discover web apps and games for your desktop.</p>
            </div>
          </motion.div>
        )}

        {tab === 'library' ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-lg text-white font-semibold mb-4 flex items-center gap-2">
              <Icon name="Download" size={18} className="text-brand-300" /> Your Library
            </h2>
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
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {catalogFiltered.map((app) => renderAppCard(app, isInstalled(app.id)))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {detailApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20"
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
                <div className="flex justify-between"><span>URL</span><span className="text-white/60 truncate ml-2 max-w-[200px]">{detailApp.url}</span></div>
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
                    onClick={() => { handleInstall(detailApp as StoreApp); setDetailApp(null); }}
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
