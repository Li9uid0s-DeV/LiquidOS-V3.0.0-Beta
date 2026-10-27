import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOS } from './OSContext';
import { Icon } from './Icon';
import { AppId, ShellMode } from './types';

export interface AISuggestion {
  id: string;
  type: 'snap' | 'grammar' | 'search' | 'app';
  title: string;
  description: string;
  actionLabel: string;
  action: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  action?: () => void;
  actionLabel?: string;
  timestamp: number;
}

const QUICK_PROMPTS = [
  { label: 'XPテーマを適用', query: 'Windows XPのルナテーマにして' },
  { label: 'Vista Aeroにする', query: 'Vista Aeroテーマを適用して' },
  { label: 'ブラウザを開く', query: 'Liquid Browserを起動して' },
  { label: 'DeXモード起動', query: 'Samsung DeXモードにして' },
  { label: '音楽を再生', query: '音楽プレイヤーを開いて' },
  { label: 'ウィンドウ整列', query: 'ウィンドウをきれいにスナップして' },
];

export function AIAssistant() {
  const {
    windows,
    openApp,
    updateWindowRect,
    setTheme,
    setShellMode,
    shellMode,
    theme,
    wallpaper,
    currentThemeId,
    applyThemeConfig,
    playSound,
  } = useOS();

  const [expanded, setExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.8-flash');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: 'こんにちは！LiquidOS Copilot (Gemini 3.8 Flash搭載) です。\nアプリの起動、XP/Vista/DeXテーマの適用、ウィンドウのスナップ整列、プログラミングや日常の疑問など何でもお手伝いします。',
      timestamp: Date.now(),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (expanded) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isThinking, expanded]);

  // Execute OS Action from Gemini response
  const executeAction = useCallback(
    (action: { type: string; target?: string; label?: string }) => {
      if (!action || !action.type || action.type === 'none') return;

      if (action.type === 'open_app' && action.target) {
        openApp(action.target as AppId);
      } else if (action.type === 'set_shell' && action.target) {
        setShellMode(action.target as ShellMode);
      } else if (action.type === 'set_theme' && action.target) {
        setTheme(action.target === 'light' ? 'light' : 'dark');
      } else if (action.type === 'apply_theme' && action.target) {
        applyThemeConfig(action.target);
      } else if (action.type === 'snap_windows') {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const TASKBAR_H = 56;
        const GAP = 8;
        const nonMin = windows.filter((w) => !w.minimized);
        if (nonMin.length >= 2) {
          updateWindowRect(nonMin[0].id, {
            x: GAP,
            y: GAP,
            width: vw / 2 - GAP * 1.5,
            height: vh - TASKBAR_H - GAP * 1.5,
          });
          updateWindowRect(nonMin[1].id, {
            x: vw / 2 + GAP * 0.5,
            y: GAP,
            width: vw / 2 - GAP * 1.5,
            height: vh - TASKBAR_H - GAP * 1.5,
          });
        }
      } else if (action.type === 'play_music') {
        openApp('synth');
      }
    },
    [openApp, setShellMode, setTheme, applyThemeConfig, windows, updateWindowRect]
  );

  // Send message to Gemini server API
  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isThinking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsThinking(true);
    playSound?.('click');

    try {
      const historyPayload = chatMessages.slice(-6).map((m) => ({
        role: m.sender === 'ai' ? 'assistant' : 'user',
        content: m.text,
      }));

      const contextPayload = {
        activeWindows: windows.filter((w) => !w.minimized).map((w) => w.title),
        shellMode,
        theme,
        wallpaper,
        currentThemeId,
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload,
          context: contextPayload,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.model) {
        setActiveModel(data.model);
      }

      const aiReply = data.reply || '応答を受信しました。';
      let actionCallback: (() => void) | undefined;
      let actionBtnLabel: string | undefined;

      if (data.action && data.action.type && data.action.type !== 'none') {
        actionCallback = () => executeAction(data.action);
        actionBtnLabel = data.action.label || '実行する';
        // Auto-execute if clear user intent
        setTimeout(() => executeAction(data.action), 300);
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          action: actionCallback,
          actionLabel: actionBtnLabel,
          timestamp: Date.now(),
        },
      ]);
      playSound?.('notify');
    } catch (err: unknown) {
      console.warn('AI Assistant fetch failed, using local dispatch:', err);
      // Fallback response with immediate local dispatch
      const query = trimmed.toLowerCase();
      let fallbackText = 'コマンドを解析して実行します。';
      let localAction: (() => void) | undefined;
      let localLabel: string | undefined;

      if (query.includes('xp') || query.includes('ルナ')) {
        fallbackText = 'Windows XP ルナ・クラシックテーマを適用しました！';
        localAction = () => applyThemeConfig('xp-luna');
        localLabel = 'XPテーマを適用';
      } else if (query.includes('vista') || query.includes('エアロ')) {
        fallbackText = 'Windows Vista アルティメット・エアロテーマを適用しました！サイドバーガジェットも動作中です。';
        localAction = () => applyThemeConfig('vista-aero');
        localLabel = 'Vistaテーマを適用';
      } else if (query.includes('browser') || query.includes('ブラウザ') || query.includes('web')) {
        fallbackText = 'Liquid Browserを起動しました。';
        localAction = () => openApp('browser');
        localLabel = 'ブラウザを開く';
      } else if (query.includes('dex') || query.includes('サムスン')) {
        fallbackText = 'Samsung DeXデスクトップシェルに切り替えました。';
        localAction = () => setShellMode('dex');
        localLabel = 'DeXシェルに切替';
      } else if (query.includes('music') || query.includes('音楽')) {
        fallbackText = 'Monochrome Musicプレイヤーを起動しました。';
        localAction = () => openApp('synth');
        localLabel = '音楽を再生';
      } else {
        fallbackText = `LiquidOS Copilotです。\nアクティブなウィンドウ: [${windows.map((w) => w.title).join(', ') || 'なし'}]。\nテーマ切替やアプリ起動などを指示してください！`;
      }

      if (localAction) {
        setTimeout(localAction, 200);
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: fallbackText,
          action: localAction,
          actionLabel: localLabel,
          timestamp: Date.now(),
        },
      ]);
      playSound?.('notify');
    } finally {
      setIsThinking(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(chatInput);
  };

  const clearChat = () => {
    setChatMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: 'チャット履歴をクリアしました。何かお手伝いできることはありますか？',
        timestamp: Date.now(),
      },
    ]);
  };

  // Generate intelligent suggestions based on current state
  const generateSuggestions = useCallback((): AISuggestion[] => {
    const out: AISuggestion[] = [];

    const nonMin = windows.filter((w) => !w.minimized);
    if (nonMin.length >= 2) {
      out.push({
        id: `snap-multi-${Date.now()}`,
        type: 'snap',
        title: 'ウィンドウを左右50:50に整列',
        description: `「${nonMin[0].title}」と「${nonMin[1].title}」を並べて作業効率を高めます。`,
        actionLabel: '並べてスナップ',
        action: () => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const TASKBAR_H = 56;
          const GAP = 8;
          updateWindowRect(nonMin[0].id, {
            x: GAP,
            y: GAP,
            width: vw / 2 - GAP * 1.5,
            height: vh - TASKBAR_H - GAP * 1.5,
          });
          updateWindowRect(nonMin[1].id, {
            x: vw / 2 + GAP * 0.5,
            y: GAP,
            width: vw / 2 - GAP * 1.5,
            height: vh - TASKBAR_H - GAP * 1.5,
          });
        },
      });
    }

    if (shellMode !== 'xp' && shellMode !== 'vista') {
      out.push({
        id: `try-xp-${Date.now()}`,
        type: 'app',
        title: 'クラシックXPテーマを試す',
        description: '懐かしのLuna Blueタスクバーと草原壁紙に切り替えます。',
        actionLabel: 'XPテーマへ',
        action: () => applyThemeConfig('xp-luna'),
      });
    }

    return out;
  }, [windows, shellMode, updateWindowRect, applyThemeConfig]);

  // Refresh suggestions periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const fresh = generateSuggestions().filter((s) => !dismissed.has(s.id));
      setSuggestions(fresh);
    }, 5000);
    return () => clearInterval(interval);
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
        title="LiquidOS Copilot (Gemini AI)"
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
              className="liquid-glass-card fixed top-0 right-0 bottom-10 z-50 w-84 sm:w-96 flex flex-col justify-between p-4 border-l border-white/15 shadow-2xl rounded-l-2xl rounded-r-none backdrop-blur-2xl bg-slate-950/85"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                    <Icon name="Sparkles" size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                      <span>LiquidOS Copilot</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/30 text-cyan-300 font-mono font-semibold">
                        AI
                      </span>
                    </div>
                    <div className="text-[10px] text-cyan-300/80 font-mono flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{activeModel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={clearChat}
                    className="p-1.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition"
                    title="チャットを消去"
                  >
                    <Icon name="RotateCcw" size={14} />
                  </button>
                  <button
                    onClick={() => setExpanded(false)}
                    className="p-1.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition"
                  >
                    <Icon name="X" size={16} />
                  </button>
                </div>
              </div>

              {/* Quick Prompt Chips */}
              <div className="py-2 border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar flex items-center gap-1.5">
                {QUICK_PROMPTS.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(qp.query)}
                    className="px-2.5 py-1 rounded-full text-[10px] bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 text-white/70 border border-white/10 whitespace-nowrap transition flex items-center gap-1"
                  >
                    <Icon name="Zap" size={10} className="text-cyan-400" />
                    <span>{qp.label}</span>
                  </button>
                ))}
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-3">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.sender === 'user'
                          ? 'bg-cyan-500/35 text-white border border-cyan-400/40 shadow-md'
                          : 'bg-white/8 border border-white/12 text-white/95 shadow-lg'
                      }`}
                    >
                      {msg.text}
                      {msg.action && (
                        <div className="mt-2.5 pt-2 border-t border-white/10">
                          <button
                            onClick={msg.action}
                            className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-[11px] transition shadow-md flex items-center gap-1.5"
                          >
                            <Icon name="Play" size={12} />
                            <span>{msg.actionLabel || '実行する'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-white/30 mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}

                {/* Thinking animation indicator */}
                {isThinking && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 w-fit">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[11px] text-cyan-300/80 font-mono">思考中...</span>
                  </div>
                )}

                {/* Intelligent Workspace Suggestions */}
                {visibleSuggestions.length > 0 && !isThinking && (
                  <div className="mt-2 pt-2 border-t border-white/5 space-y-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/70 flex items-center gap-1">
                      <Icon name="Sparkles" size={11} />
                      <span>スマート推奨アクション</span>
                    </div>
                    {visibleSuggestions.map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5"
                      >
                        <SuggestionIcon type={s.type} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-white">{s.title}</div>
                          <div className="text-[10px] text-white/60 mt-0.5">{s.description}</div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => {
                                s.action();
                                dismiss(s.id);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-[10px] font-bold transition shadow-sm"
                            >
                              {s.actionLabel}
                            </button>
                            <button
                              onClick={() => dismiss(s.id)}
                              className="px-2 py-1 rounded-lg text-[10px] text-white/50 hover:bg-white/10 transition"
                            >
                              非表示
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
                <div className="flex items-center gap-2 bg-white/5 border border-white/12 rounded-xl px-3 py-2 focus-within:border-cyan-400/60 focus-within:bg-white/10 transition">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="AIに質問・操作を依頼 (例: 'XPテーマにして', 'ブラウザ開いて')..."
                    className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/40"
                    disabled={isThinking}
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition disabled:opacity-30 flex items-center justify-center shadow-md shadow-cyan-500/20"
                    disabled={!chatInput.trim() || isThinking}
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
    <div className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
      <Icon name={icon} size={12} className={color} />
    </div>
  );
}
