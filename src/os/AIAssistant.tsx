import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOS, AuroraColor, Wallpaper } from './OSContext';
import { Icon } from './Icon';
import { AppId, ShellMode } from './types';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  action?: () => void;
  actionLabel?: string;
  timestamp: number;
}

const QUICK_PROMPTS = [
  { label: 'オーロラをエメラルドに', query: 'オーロラのカラーをエメラルド＆スカイに変更して' },
  { label: 'ガラスの湾曲を強く', query: '3Dガラスの湾曲度とプルプル感を強めにして' },
  { label: 'ゲームを起動', query: 'ゲームを起動して' },
  { label: 'スリープ画面', query: 'スリープにして' },
  { label: 'ウィンドウ整列', query: 'ウィンドウを並べて整列して' },
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
    setWallpaper,
    setAuroraColor,
    setGlassCurvature,
    setGlassWobble,
    lockSystem,
    currentThemeId,
    applyThemeConfig,
    playSound,
  } = useOS();

  const [expanded, setExpanded] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: 'こんにちは。質問や計算、コード作成、オーロラ・3Dガラス設定の変更、アプリの起動など何でもお任せください。',
      timestamp: Date.now(),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isThinking, expanded]);

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
      } else if (action.type === 'set_wallpaper' && action.target) {
        setWallpaper(action.target as Wallpaper);
      } else if (action.type === 'set_aurora' && action.target) {
        setWallpaper('live2d');
        setAuroraColor(action.target as AuroraColor);
      } else if (action.type === 'set_glass' && action.target) {
        const val = Number(action.target) || 75;
        setGlassCurvature(val);
        setGlassWobble(Math.min(100, val + 10));
      } else if (action.type === 'lock_system') {
        lockSystem();
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
    [
      openApp,
      setShellMode,
      setTheme,
      applyThemeConfig,
      setWallpaper,
      setAuroraColor,
      setGlassCurvature,
      setGlassWobble,
      lockSystem,
      windows,
      updateWindowRect,
    ]
  );

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
      const historyPayload = chatMessages.slice(-8).map((m) => ({
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
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const aiReply = data.reply || '応答を受信しました。';
      let actionCallback: (() => void) | undefined;
      let actionBtnLabel: string | undefined;

      if (data.action && data.action.type && data.action.type !== 'none') {
        actionCallback = () => executeAction(data.action);
        actionBtnLabel = data.action.label || '実行する';
        setTimeout(() => executeAction(data.action), 250);
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
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: '通信エラーが発生しました。もう一度お試しください。',
          timestamp: Date.now(),
        },
      ]);
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
        text: 'チャット履歴をクリアしました。何でもお気軽にお尋ねください。',
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <>
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`relative h-8 w-8 rounded-lg flex items-center justify-center transition shrink-0 ${
          expanded ? 'glass-jelly text-sky-300' : 'hover:bg-white/10 text-white/80'
        }`}
        title="AI アシスタント"
      >
        <Icon name="Sparkles" size={16} className="text-sky-300" />
      </button>

      <AnimatePresence>
        {expanded && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setExpanded(false)} />
            <motion.div
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className="liquid-glass-card fixed top-3 right-3 bottom-14 z-50 w-84 sm:w-96 flex flex-col justify-between p-4 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl glass-jelly flex items-center justify-center text-sky-300">
                    <Icon name="Bot" size={16} />
                  </div>
                  <div className="text-sm font-semibold text-white">AI アシスタント</div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setExpanded(false);
                      openApp('ai');
                    }}
                    className="p-1.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition"
                    title="ウィンドウで開く"
                  >
                    <Icon name="ExternalLink" size={14} />
                  </button>
                  <button
                    onClick={clearChat}
                    className="p-1.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition"
                    title="履歴を消去"
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
              <div className="py-2.5 border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar flex items-center gap-1.5">
                {QUICK_PROMPTS.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(qp.query)}
                    className="px-2.5 py-1 rounded-xl text-[11px] glass-jelly text-white/85 whitespace-nowrap"
                  >
                    {qp.label}
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
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap select-text ${
                        msg.sender === 'user'
                          ? 'glass-jelly bg-sky-500/25 text-white'
                          : 'glass-panel text-white/95'
                      }`}
                    >
                      {msg.text}
                      {msg.action && (
                        <div className="mt-2.5 pt-2 border-t border-white/10">
                          <button
                            onClick={msg.action}
                            className="px-3 py-1.5 rounded-xl glass-jelly text-sky-300 font-semibold text-[11px] flex items-center gap-1.5"
                          >
                            <Icon name="Sparkles" size={12} />
                            <span>{msg.actionLabel || '実行する'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isThinking && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-panel w-fit text-xs text-white/80">
                    <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
                    <span>考え中...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleChatSubmit} className="pt-2 border-t border-white/10 shrink-0">
                <div className="flex items-center gap-2 glass-panel rounded-2xl px-3 py-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="質問やOSの操作を入力..."
                    className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/40"
                    disabled={isThinking}
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl glass-jelly text-sky-300 disabled:opacity-30 flex items-center justify-center"
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
