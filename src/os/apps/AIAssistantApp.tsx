import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '../Icon';
import { useOS } from '../OSContext';
import { AppId, ShellMode } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  action?: {
    type: string;
    target?: string;
    label?: string;
  };
}

const TEMPLATES = [
  { label: '🎨 Zorin OSにする', prompt: 'UIをZorin OS 17 Proのエレガンススタイルに変更して' },
  { label: '🔥 HyperOS 3を適用', prompt: 'MIUIx / HyperOS 3のフラッグシップテーマを適用して' },
  { label: '⚡ Windows 8 Metro', prompt: 'Windows 8のメトロ・ライブタイルUIに切り替えて' },
  { label: '🎮 ゲームを起動', prompt: 'Cosmic Velocity 3D レーサーを起動して' },
  { label: '🌦️ 天気予報を確認', prompt: 'Cosmic Weatherアプリを開いて天気をチェックして' },
  { label: '⏰ アラームを設定', prompt: 'Clock & Alarmsアプリを開いて' },
  { label: '💻 システム診断', prompt: 'Task ManagerとSystem Monitorを開いてCPUとメモリを監視して' },
];

export function AIAssistantApp() {
  const {
    openApp,
    setShellMode,
    applyThemeConfig,
    setTheme,
    playSound,
    addNotification,
    triggerDynamicIsland,
  } = useOS();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'こんにちは！**Liquid Copilot AI Studio** (Gemini 3.8 Flash搭載) へようこそ。\n\nOSのテーマ変更（Zorin OS, HyperOS, Windows 8, Vista, XPなど）、ウィンドウの整理、アプリの起動、コード生成や日常の質問など、どんなことでもお気軽にご指示ください。',
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [model, setModel] = useState('gemini-3.8-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Execute an action returned by AI
  const executeAction = useCallback(
    (act: { type: string; target?: string; label?: string }) => {
      playSound('open');
      if (act.type === 'open_app' && act.target) {
        openApp(act.target as AppId);
        triggerDynamicIsland(act.label || `Launched ${act.target}`, 'AI Studio Action', 'Bot');
      } else if (act.type === 'set_shell' && act.target) {
        setShellMode(act.target as ShellMode);
        addNotification({
          title: 'Shell Updated',
          message: `Switched shell layout to ${act.target}.`,
          icon: 'SlidersHorizontal',
        });
      } else if (act.type === 'apply_theme' && act.target) {
        applyThemeConfig(act.target);
      } else if (act.type === 'set_theme' && act.target) {
        setTheme(act.target === 'light' ? 'light' : 'dark');
      }
    },
    [openApp, setShellMode, applyThemeConfig, setTheme, playSound, addNotification, triggerDynamicIsland]
  );

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isThinking) return;

    playSound('click');
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-8).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.text,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: data.reply || '応答を受信できませんでした。',
        timestamp: Date.now(),
        action: data.action,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If action is provided, automatically trigger or let user click
      if (data.action && data.action.type !== 'none') {
        // Auto-run non-destructive theme / navigation action if high confidence
        if (['apply_theme', 'open_app', 'set_shell'].includes(data.action.type)) {
          executeAction(data.action);
        }
      }
    } catch {
      // Offline fallback smart responder
      let fallbackText = `承知いたしました。「${textToSend}」の処理を実行します。`;
      let fallbackAction: { type: string; target?: string; label?: string } | undefined;

      const lower = textToSend.toLowerCase();
      if (lower.includes('zorin')) {
        fallbackText = 'Zorin OS 17 ProのエレガントなLinuxシェルを適用しました！';
        fallbackAction = { type: 'set_shell', target: 'zorin', label: 'Zorin OS Shell' };
        executeAction(fallbackAction);
      } else if (lower.includes('hyperos') || lower.includes('miuix')) {
        fallbackText = 'HyperOS 3 / MIUIx フラッグシップテーマを適用しました！スクワークルアイコンと立体感のある深度時計をお楽しみください。';
        fallbackAction = { type: 'apply_theme', target: 'hyperos-miuix', label: 'HyperOS 3 Theme' };
        executeAction(fallbackAction);
      } else if (lower.includes('windows 8') || lower.includes('metro') || lower.includes('メトロ')) {
        fallbackText = 'Windows 8のメトロ・ライブタイル全画面モードに切り替えました！カードをスクロールしてアプリを起動できます。';
        fallbackAction = { type: 'set_shell', target: 'windows8', label: 'Windows 8 Metro' };
        executeAction(fallbackAction);
      } else if (lower.includes('game') || lower.includes('ゲーム') || lower.includes('velocity')) {
        fallbackText = 'Cosmic Velocity 3D レーサーを起動しました！タッチ操作または矢印キーで操作可能です。';
        fallbackAction = { type: 'open_app', target: 'game', label: 'Cosmic Velocity' };
        executeAction(fallbackAction);
      } else if (lower.includes('weather') || lower.includes('天気')) {
        fallbackText = 'Cosmic Weather 予報アプリを起動しました！リアルタイム気象レーダーと7日間予報を表示します。';
        fallbackAction = { type: 'open_app', target: 'weather', label: 'Cosmic Weather' };
        executeAction(fallbackAction);
      } else if (lower.includes('clock') || lower.includes('時計') || lower.includes('アラーム')) {
        fallbackText = 'Clock & Alarms アプリを起動しました！世界時計、ストップウォッチ、タイマーをお使いいただけます。';
        fallbackAction = { type: 'open_app', target: 'clock', label: 'Clock & Alarms' };
        executeAction(fallbackAction);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: fallbackText,
          timestamp: Date.now(),
          action: fallbackAction,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const clearChat = () => {
    playSound('click');
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: 'チャット履歴を消去しました。何かお手伝いできることはありますか？',
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 text-white select-none overflow-hidden">
      {/* App Header */}
      <div className="h-14 px-4 bg-slate-950/80 border-b border-white/[0.06] flex items-center justify-between shrink-0 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Icon name="Bot" size={17} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              Liquid Copilot
              <span className="text-[10px] text-white/40 font-mono">
                {model}
              </span>
            </div>
            <div className="text-[10px] text-white/40">Intelligent OS Assistant & Automation</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModel(model === 'gemini-3.8-flash' ? 'gemini-2.5-pro' : 'gemini-3.8-flash')}
            className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-white/60 font-mono transition border border-white/[0.06]"
            title="Toggle Engine"
          >
            {model}
          </button>
          <button
            onClick={clearChat}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white transition border border-white/[0.06]"
            title="Clear Chat"
          >
            <Icon name="Trash2" size={14} />
          </button>
        </div>
      </div>

      {/* Quick Prompts Chips Carousel */}
      <div className="p-2.5 border-b border-white/[0.04] bg-white/[0.01] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider px-2 shrink-0">
          Suggested:
        </span>
        {TEMPLATES.map((t, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(t.prompt)}
            className="px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-xs text-white/70 hover:text-white whitespace-nowrap transition border border-white/[0.05] active:scale-95 shrink-0"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <Icon name="Bot" size={15} className="text-cyan-400" />
                </div>
              )}

              <div
                className={`rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-cyan-500 text-black font-medium rounded-tr-none shadow-md shadow-cyan-500/10'
                    : 'bg-white/[0.03] border border-white/[0.06] text-white/90 rounded-tl-none backdrop-blur-xl shadow-lg'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* Optional interactive action button attached to message */}
                {m.action && m.action.type !== 'none' && (
                  <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center gap-2">
                    <button
                      onClick={() => executeAction(m.action!)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-400 text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-cyan-300 transition shadow-sm active:scale-95"
                    >
                      <Icon name="Zap" size={12} />
                      <span>{m.action.label || 'Execute Action'}</span>
                    </button>
                    <span className="text-[10px] text-white/40 font-mono">
                      Type: {m.action.type}
                    </span>
                  </div>
                )}

                <div className={`text-[10px] mt-1.5 ${isUser ? 'text-black/50' : 'text-white/30'} text-right font-mono`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center shrink-0 border border-white/[0.08]">
                  <Icon name="User" size={15} className="text-white/80" />
                </div>
              )}
            </div>
          );
        })}

        {isThinking && (
          <div className="flex gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
              <Icon name="Bot" size={15} className="text-cyan-400 animate-pulse" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2 text-xs text-white/70">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer (Touch Friendly) */}
      <div className="p-3 sm:p-4 border-t border-white/[0.06] bg-slate-950/70 backdrop-blur-xl shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <div className="flex-1 flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-2.5 focus-within:border-white/25 focus-within:bg-white/[0.05] transition">
            <Icon name="Sparkles" size={15} className="text-white/40" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything or control OS (e.g. 'Zorin OSにして', 'ゲームを起動', '天気を教えて')..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="h-11 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition flex items-center gap-1.5 border border-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            <Icon name="Send" size={14} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
