import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOS } from './OSContext';
import { Icon } from './Icon';

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

export function AIAssistant() {
  const {
    windows, openApp, updateWindowRect, closeWindow, setTheme, setShellMode,
  } = useOS();

  const [expanded, setExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; action?: () => void; actionLabel?: string }>>([
    {
      sender: 'ai',
      text: 'Hello! I am LiquidOS Copilot. Ask me to snap windows, open apps, change themes, or analyze active tasks.',
    },
  ]);
  const usageLog = useRef<UsageEvent[]>([]);
  const lastOpenTime = useRef<Record<string, number>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll chat
  useEffect(() => {
    if (expanded) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, expanded]);

  // Handle Copilot Chat Submission with context-aware responses and macros
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const query = chatInput.trim().toLowerCase();
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);

    setTimeout(() => {
      let aiText = '';
      let macroAction: (() => void) | undefined;
      let macroLabel: string | undefined;

      const activeWinsList = windows.filter((w) => !w.minimized).map((w) => w.title).join(', ');

      if (query.includes('snap') || query.includes('split') || query.includes('tile')) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const TASKBAR_H = 56;
        const GAP = 8;
        const nonMin = windows.filter((w) => !w.minimized);
        if (nonMin.length >= 2) {
          macroAction = () => {
            updateWindowRect(nonMin[0].id, { x: GAP, y: GAP, width: vw / 2 - GAP * 1.5, height: vh - TASKBAR_H - GAP * 1.5 });
            updateWindowRect(nonMin[1].id, { x: vw / 2 + GAP * 0.5, y: GAP, width: vw / 2 - GAP * 1.5, height: vh - TASKBAR_H - GAP * 1.5 });
          };
          macroLabel = 'Split 50/50';
          aiText = `I have staged a side-by-side snap for "${nonMin[0].title}" and "${nonMin[1].title}".`;
        } else {
          aiText = `You currently have ${nonMin.length} active window(s). Open another app to snap side by side!`;
        }
      } else if (query.includes('terminal') || query.includes('cli') || query.includes('cmd')) {
        aiText = 'Opening Liquid Terminal CLI with full command suite.';
        macroAction = () => openApp('terminal');
        macroLabel = 'Launch Terminal';
      } else if (query.includes('calc') || query.includes('calculator') || query.includes('math')) {
        aiText = 'Opening Calculator Pro with scientific memory registers.';
        macroAction = () => openApp('calculator');
        macroLabel = 'Launch Calculator';
      } else if (query.includes('task') || query.includes('process') || query.includes('kill') || query.includes('perf')) {
        aiText = 'Opening Task Manager to inspect live process telemetry and RAM.';
        macroAction = () => openApp('taskmanager');
        macroLabel = 'Launch Task Manager';
      } else if (query.includes('game') || query.includes('race') || query.includes('cosmic') || query.includes('3d')) {
        aiText = 'Opening Cosmic Velocity 3D arcade racer in Three.js!';
        macroAction = () => openApp('game');
        macroLabel = 'Play Cosmic Velocity';
      } else if (query.includes('dark') || query.includes('light') || query.includes('theme')) {
        aiText = 'Toggling system visual theme mode.';
        macroAction = () => setTheme(query.includes('light') ? 'light' : 'dark');
        macroLabel = 'Apply Theme';
      } else if (query.includes('metro') || query.includes('windows 8') || query.includes('touch')) {
        aiText = 'Switching workspace shell to Windows 8 Metro Live Tiles Matrix.';
        macroAction = () => setShellMode('metro');
        macroLabel = 'Switch to Metro';
      } else if (query.includes('mac') || query.includes('apple') || query.includes('dock')) {
        aiText = 'Switching workspace shell to macOS Liquid Dock & Top Menu Bar.';
        macroAction = () => setShellMode('mac');
        macroLabel = 'Switch to macOS';
      } else if (query.includes('ubuntu') || query.includes('linux')) {
        aiText = 'Switching workspace shell to Ubuntu Linux side launcher.';
        macroAction = () => setShellMode('ubuntu');
        macroLabel = 'Switch to Ubuntu';
      } else if (query.includes('close all') || query.includes('clear windows')) {
        aiText = 'Terminating all active window instances.';
        macroAction = () => {
          windows.forEach((w) => closeWindow(w.id));
        };
        macroLabel = 'Close All Windows';
      } else {
        aiText = `Analyzing workspace: active processes are [${activeWinsList || 'None'}]. You can ask me to snap windows, switch shells, or launch apps.`;
      }

      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: aiText, action: macroAction, actionLabel: macroLabel },
      ]);
    }, 400);
  };

  // Generate suggestions based on current state
  const generateSuggestions = useCallback((): AISuggestion[] => {
    const out: AISuggestion[] = [];

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

    return out;
  }, [windows, updateWindowRect]);

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

  const visibleSuggestions = suggestions.slice(0, 2);
  const hasSuggestions = visibleSuggestions.length > 0;

  return (
    <>
      {/* Floating Copilot Icon in system tray */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`relative h-8 w-8 rounded-lg flex items-center justify-center transition shrink-0 ${
          expanded ? 'bg-cyan-500/30 text-cyan-300' : 'hover:bg-white/10 text-white/80'
        }`}
        title="Windows Copilot Assistant"
      >
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <Icon name="Sparkles" size={16} className="text-cyan-300" />
        </motion.div>
        {hasSuggestions && !expanded && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
        )}
      </button>

      {/* Docked Windows Copilot Right Panel */}
      <AnimatePresence>
        {expanded && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setExpanded(false)} />
            <motion.div
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="liquid-glass-card fixed top-0 right-0 bottom-10 z-50 w-84 sm:w-96 flex flex-col justify-between p-4 border-l border-white/10 shadow-2xl rounded-l-2xl rounded-r-none backdrop-blur-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Icon name="Sparkles" size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white tracking-wide">Windows Copilot</div>
                    <div className="text-[10px] text-cyan-300/80 font-mono">Offline AI Companion</div>
                  </div>
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="p-1.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition"
                >
                  <Icon name="X" size={16} />
                </button>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-3">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-cyan-500/30 text-white border border-cyan-400/30 shadow-md'
                          : 'bg-white/5 border border-white/10 text-white/90 shadow-lg'
                      }`}
                    >
                      {msg.text}
                      {msg.action && msg.actionLabel && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <button
                            onClick={msg.action}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/80 hover:bg-cyan-400 text-slate-950 font-semibold text-[11px] transition shadow-md flex items-center gap-1.5"
                          >
                            <Icon name="Play" size={12} />
                            <span>{msg.actionLabel}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Intelligent Workspace Suggestions */}
                {visibleSuggestions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5 space-y-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/70">
                      Smart Desktop Actions
                    </div>
                    {visibleSuggestions.map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5"
                      >
                        <SuggestionIcon type={s.type} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white">{s.title}</div>
                          <div className="text-[10px] text-white/50">{s.description}</div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => {
                                s.action();
                                dismiss(s.id);
                              }}
                              className="px-2.5 py-1 rounded-md bg-cyan-500/80 hover:bg-cyan-400 text-slate-950 text-[10px] font-bold transition"
                            >
                              {s.actionLabel}
                            </button>
                            <button
                              onClick={() => dismiss(s.id)}
                              className="px-2 py-1 rounded-md text-[10px] text-white/50 hover:bg-white/10 transition"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleChatSubmit} className="pt-2 border-t border-white/10 shrink-0">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-cyan-400/50 focus-within:bg-white/10 transition">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask Copilot (e.g. 'snap apps', 'open terminal')..."
                    className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/40"
                  />
                  <button
                    type="submit"
                    className="p-1 rounded-lg bg-cyan-500/80 hover:bg-cyan-400 text-slate-950 transition disabled:opacity-30"
                    disabled={!chatInput.trim()}
                  >
                    <Icon name="Send" size={13} />
                  </button>
                </div>
              </form>
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
