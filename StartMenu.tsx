import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOS } from './OSContext';
import { TASKBAR_APPS, AppId } from './types';
import { Icon } from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  startPos?: { x: number; width: number } | null;
}

interface SearchResult {
  type: 'app' | 'file';
  label: string;
  icon: string;
  appId?: AppId;
  customAppId?: string;
  filePath?: string[];
  fileName?: string;
}

const PINNED: { appId: AppId; label: string; icon: string }[] = [
  { appId: 'explorer', label: 'Explorer', icon: 'FolderOpen' },
  { appId: 'browser', label: 'Browser', icon: 'Globe' },
  { appId: 'terminal', label: 'Terminal', icon: 'SquareTerminal' },
  { appId: 'notepad', label: 'Notepad', icon: 'FileText' },
  { appId: 'game', label: 'Space Runner', icon: 'Gamepad2' },
  { appId: 'appstore', label: 'App Store', icon: 'Store' },
  { appId: 'settings', label: 'Settings', icon: 'Settings' },
];

// Flatten the file system for search
function flattenFiles(
  folder: { children: Array<{ name: string; kind: string; type?: string; content?: string; children?: unknown[] }> },
  path: string[] = []
): { name: string; path: string[]; type: string }[] {
  const results: { name: string; path: string[]; type: string }[] = [];
  for (const child of folder.children) {
    const childPath = [...path, child.name];
    if (child.kind === 'file') {
      results.push({ name: child.name, path: childPath, type: child.type ?? 'text' });
    } else if (child.kind === 'folder' && Array.isArray(child.children)) {
      results.push(...flattenFiles(child as never, childPath));
    }
  }
  return results;
}

export function StartMenu({ open, onClose, startPos }: Props) {
  const { openApp, installedApps, launchInstalledApp, fileSystem } = useOS();
  const [query, setQuery] = useState('');

  const installedEntries = installedApps.map((a) => ({
    appId: a.appId as AppId,
    label: a.name,
    icon: a.icon,
    isCustom: true,
  }));

  const allPinned = [...PINNED, ...installedEntries];

  // Predictive search: combines apps and file system files
  const searchResults = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    // Search apps
    const appResults: SearchResult[] = [...TASKBAR_APPS, ...allPinned]
      .filter((a) => a.label.toLowerCase().includes(q))
      .filter((v, i, arr) => arr.findIndex((x) => x.appId === v.appId) === i)
      .slice(0, 4)
      .map((a) => ({
        type: 'app' as const,
        label: a.label,
        icon: a.icon,
        appId: a.appId as AppId,
        customAppId: (a as { isCustom?: boolean }).isCustom ? a.appId as string : undefined,
      }));

    // Search files in virtual file system
    const allFiles = flattenFiles(fileSystem);
    const fileResults: SearchResult[] = allFiles
      .filter((f) => f.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((f) => ({
        type: 'file' as const,
        label: f.name,
        icon: 'FileText',
        filePath: f.path.slice(0, -1),
        fileName: f.name,
      }));

    return [...appResults, ...fileResults];
  }, [query, fileSystem, allPinned, installedApps]);

  const filtered = query
    ? [...TASKBAR_APPS, ...allPinned].filter((a) =>
        a.label.toLowerCase().includes(query.toLowerCase())
      ).filter((v, i, arr) => arr.findIndex((x) => x.appId === v.appId) === i)
    : allPinned;

  const launch = (entry: { appId: AppId; isCustom?: boolean }) => {
    if (entry.isCustom) {
      launchInstalledApp(entry.appId as string);
    } else {
      openApp(entry.appId as AppId);
    }
    onClose();
    setQuery('');
  };

  const launchSearchResult = (result: SearchResult) => {
    if (result.type === 'app') {
      if (result.customAppId) {
        launchInstalledApp(result.customAppId);
      } else if (result.appId) {
        openApp(result.appId);
      }
    } else if (result.type === 'file' && result.fileName) {
      openApp('notepad', {
        title: result.fileName,
        payload: { fileName: result.fileName, content: '' },
      });
    }
    onClose();
    setQuery('');
  };

  // Position: align above the start button if we have its position
  const menuStyle: React.CSSProperties = startPos
    ? { left: Math.max(8, Math.min(startPos.x, window.innerWidth - 580)), bottom: 64 }
    : { bottom: 64, left: '50%', transform: 'translateX(-50%)' };

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="liquid-glass-taskbar fixed z-50 w-[560px] max-w-[92vw] rounded-2xl p-5"
            style={menuStyle}
          >
            {/* Search */}
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 mb-5 focus-within:border-brand-400 transition">
              <Icon name="Search" size={16} className="text-white/40" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search apps, files, and settings"
                className="flex-1 bg-transparent text-sm text-white/90 outline-none"
              />
            </div>

            {/* Predictive search results */}
            {query.trim() && searchResults.length > 0 && (
              <div className="mb-5">
                <div className="text-xs text-white/50 mb-2 font-medium flex items-center gap-1">
                  <Icon name="Sparkles" size={11} className="text-violet-300" /> Predicted results
                </div>
                <div className="space-y-1">
                  {searchResults.map((result, i) => (
                    <button
                      key={`${result.type}-${result.label}-${i}`}
                      onClick={() => launchSearchResult(result)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition text-left group"
                    >
                      <div className="h-8 w-8 rounded-lg glass-panel flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                        <Icon name={result.icon} size={14} className="text-brand-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white/90 truncate">{result.label}</div>
                        <div className="text-[10px] text-white/40">
                          {result.type === 'app' ? 'Application' : `File · ${result.filePath?.join('/') ?? '/'}`}
                        </div>
                      </div>
                      <Icon name="ChevronRight" size={14} className="text-white/30 group-hover:text-white/60 transition" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pinned / filtered apps */}
            <div className="text-xs text-white/50 mb-3 font-medium">
              {query ? 'All results' : 'Pinned'}
            </div>
            <div className="grid grid-cols-6 gap-3 mb-5 max-h-[280px] overflow-y-auto">
              {filtered.map((app) => (
                <button
                  key={app.appId}
                  onClick={() => launch(app)}
                  className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition group"
                >
                  <div className="h-12 w-12 rounded-xl glass-panel flex items-center justify-center group-hover:scale-110 group-hover:liquid-glow transition-all">
                    <Icon name={app.icon} size={22} className="text-brand-300" />
                  </div>
                  <span className="text-[10px] text-white/80 text-center leading-tight truncate max-w-full">{app.label}</span>
                </button>
              ))}
              {filtered.length === 0 && searchResults.length === 0 && (
                <div className="col-span-6 text-center text-white/40 text-sm py-6">
                  No results found
                </div>
              )}
            </div>

            {/* User + power */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-sm font-semibold">
                  <Icon name="User" size={18} />
                </div>
                <span className="text-sm text-white/80">Liquid User</span>
              </div>
              <button className="p-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition" title="Power">
                <Icon name="Power" size={18} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
