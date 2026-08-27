import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOS } from './OSContext';
import { Icon } from './Icon';
import { AppId } from './types';

export interface AISuggestion {
  id: string;
  type: 'snap' | 'grammar' | 'search' | 'app';
  title: string;
  description: string;
  actionLabel: string;
  action: () => void;
}

interface UsageEvent {
  appId: string;
  timestamp: number;
  action: 'open' | 'close' | 'focus' | 'snap';
}

interface AIAssistantProps {
  onLock?: () => void;
}

export function AIAssistant({ onLock }: AIAssistantProps) {
  const {
    windows, openApp, updateWindowRect,
  } = useOS();

  const [expanded, setExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const usageLog = useRef<UsageEvent[]>([]);
  const lastOpenTime = useRef<Record<string, number>>({});

  // Track window open events
  useEffect(() => {
    for (const win of windows) {
      if (!lastOpenTime.current[win.appId]) {
        lastOpenTime.current[win.appId] = Date.now();
        usageLog.current.push({ appId: win.appId, timestamp: Date.now(), action: 'open' });
      }
    }
    const openIds = new Set(windows.map((w) => w.appId));
    for (const appId of Object.keys(lastOpenTime.current)) {
      if (!openIds.has(appId)) {
        delete lastOpenTime.current[appId];
        usageLog.current.push({ appId, timestamp: Date.now(), action: 'close' });
      }
    }
  }, [windows]);

  // Generate suggestions based on current state
  const generateSuggestions = useCallback((): AISuggestion[] => {
    const out: AISuggestion[] = [];
    const now = Date.now();

    // Pattern: user opens Notepad frequently → suggest snapping it left
    const notepadWin = windows.find((w) => w.appId === 'notepad' && !w.minimized);
    if (notepadWin && !notepadWin.maximized) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const TASKBAR_H = 56;
      const GAP = 8;
      const isAlreadyLeft = notepadWin.x < 50 && notepadWin.width < vw * 0.6;
      if (!isAlreadyLeft) {
        out.push({
          id: `snap-notepad-left-${notepadWin.id}`,
          type: 'snap',
          title: 'Snap Notepad to the left?',
          description: 'You often keep Notepad on the left side while working.',
          actionLabel: 'Snap Left',
          action: () => {
            updateWindowRect(notepadWin.id, {
              x: GAP, y: GAP, width: vw / 2 - GAP * 1.5, height: vh - TASKBAR_H - GAP * 1.5,
            });
          },
        });
      }
    }

    // Pattern: Terminal + Browser open → suggest side-by-side
    const terminalWin = windows.find((w) => w.appId === 'terminal' && !w.minimized);
    const browserWin = windows.find((w) => w.appId === 'browser' && !w.minimized);
    if (terminalWin && browserWin && !terminalWin.maximized && !browserWin.maximized) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const TASKBAR_H = 56;
      const GAP = 8;
      const alreadySplit = terminalWin.x < 50 && browserWin.x > vw / 2 - 50;
      if (!alreadySplit) {
        out.push({
          id: `split-term-browser-${terminalWin.id}-${browserWin.id}`,
          type: 'snap',
          title: 'Split Terminal and Browser?',
          description: 'Side-by-side layout works well for development tasks.',
          actionLabel: 'Split',
          action: () => {
            updateWindowRect(terminalWin.id, {
              x: GAP, y: GAP, width: vw / 2 - GAP * 1.5, height: vh - TASKBAR_H - GAP * 1.5,
            });
            updateWindowRect(browserWin.id, {
              x: vw / 2 + GAP * 0.5, y: GAP, width: vw / 2 - GAP * 1.5, height: vh - TASKBAR_H - GAP * 1.5,
            });
          },
        });
      }
    }

    // Pattern: Frequent app recommendation based on usage history
    const recentOpens = usageLog.current.filter(
      (e) => e.action === 'open' && now - e.timestamp < 300000 // 5 min window
    );
    const appCounts: Record<string, number> = {};
    for (const e of recentOpens) {
      appCounts[e.appId] = (appCounts[e.appId] ?? 0) + 1;
    }
    const openAppIds = new Set(windows.map((w) => w.appId));
    const frequentApp = Object.entries(appCounts)
      .sort((a, b) => b[1] - a[1])
      .find(([id]) => !openAppIds.has(id));
    if (frequentApp) {
      const appId = frequentApp[0] as AppId;
      const appNames: Record<string, string> = {
        explorer: 'File Explorer', browser: 'Browser', terminal: 'Terminal',
        notepad: 'Notepad', settings: 'Settings', game: 'Space Runner', appstore: 'App Store',
      };
      out.push({
        id: `suggest-app-${appId}`,
        type: 'app',
        title: `Open ${appNames[appId] ?? appId}?`,
        description: 'You frequently use this app during your current session.',
        actionLabel: 'Open',
        action: () => openApp(appId),
      });
    }

    return out;
  }, [windows, openApp, updateWindowRect]);

  // Refresh suggestions periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const fresh = generateSuggestions().filter((s) => !dismissed.has(s.id));
      setSuggestions(fresh);
    }, 4000);
    return () => clearInterval(interval);
  }, [generateSuggestions, dismissed]);

  // Generate initial suggestions
  useEffect(() => {
    setSuggestions(generateSuggestions().filter((s) => !dismissed.has(s.id)));
  }, [generateSuggestions, dismissed]);

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const visibleSuggestions = suggestions.slice(0, 3);
  const hasSuggestions = visibleSuggestions.length > 0;

  return (
    <>
      {/* Floating AI orb in system tray */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="relative h-9 w-9 rounded-xl flex items-center justify-center transition shrink-0 hover:bg-white/10 group"
        title="AI Assistant"
      >
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Icon name="Sparkles" size={18} className="text-violet-300" />
        </motion.div>
        {hasSuggestions && !expanded && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-violet-400 border border-white/30"
          />
        )}
        {/* Pulsing glow ring when suggestions available */}
        {hasSuggestions && !expanded && (
          <motion.span
            className="absolute inset-0 rounded-xl"
            animate={{ boxShadow: ['0 0 0px rgba(167,139,250,0)', '0 0 12px rgba(167,139,250,0.6)', '0 0 0px rgba(167,139,250,0)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </button>

      {/* AI suggestion panel */}
      <AnimatePresence>
        {expanded && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setExpanded(false)} />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="glass liquid-glass-taskbar fixed bottom-16 right-3 z-50 w-80 rounded-2xl p-4"
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center liquid-glow">
                  <Icon name="Sparkles" size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white/90 font-medium">AI Assistant</div>
                  <div className="text-[10px] text-white/50">Observing your desktop patterns</div>
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="p-1 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>

              {/* Suggestions list */}
              {hasSuggestions ? (
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {visibleSuggestions.map((s) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="glass-panel rounded-xl p-3 group"
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 shrink-0">
                          <SuggestionIcon type={s.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-white/90 font-medium leading-tight">{s.title}</div>
                          <div className="text-[10px] text-white/50 mt-0.5 leading-tight">{s.description}</div>
                          <div className="flex gap-1.5 mt-2">
                            <button
                              onClick={() => {
                                s.action();
                                dismiss(s.id);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] bg-violet-500/80 hover:bg-violet-400 text-white transition font-medium"
                            >
                              {s.actionLabel}
                            </button>
                            <button
                              onClick={() => dismiss(s.id)}
                              className="px-2.5 py-1 rounded-lg text-[10px] text-white/50 hover:bg-white/10 transition"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2">
                    <Icon name="Check" size={18} className="text-white/30" />
                  </div>
                  <div className="text-xs text-white/40">No suggestions right now</div>
                  <div className="text-[10px] text-white/30 mt-1">I'm learning your patterns</div>
                </div>
              )}

              {/* Quick actions footer */}
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => { openApp('settings'); setExpanded(false); }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-white/60 hover:bg-white/10 transition"
                >
                  <Icon name="Settings" size={12} /> Settings
                </button>
                <button
                  onClick={() => { openApp('terminal'); setExpanded(false); }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-white/60 hover:bg-white/10 transition"
                >
                  <Icon name="SquareTerminal" size={12} /> Terminal
                </button>
                {onLock && (
                  <button
                    onClick={() => { onLock(); setExpanded(false); }}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-white/60 hover:bg-white/10 transition"
                  >
                    <Icon name="Lock" size={12} /> Lock
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SuggestionIcon({ type }: { type: AISuggestion['type'] }) {
  const iconMap: Record<string, { icon: string; color: string }> = {
    snap: { icon: 'Layers', color: 'text-sky-300' },
    grammar: { icon: 'Check', color: 'text-emerald-300' },
    search: { icon: 'Search', color: 'text-amber-300' },
    app: { icon: 'LayoutGrid', color: 'text-violet-300' },
  };
  const { icon, color } = iconMap[type] ?? iconMap.app;
  return (
    <div className="h-6 w-6 rounded-lg bg-white/5 flex items-center justify-center">
      <Icon name={icon} size={12} className={color} />
    </div>
  );
}
