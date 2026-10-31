import { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '../Icon';
import {
  ProxyEngine,
  encodeUltraviolet,
  encodeScramjet,
} from '../proxyService';
import { useOS } from '../OSContext';

interface Props {
  payload?: { url?: string; isImage?: boolean; engine?: ProxyEngine };
}

const DEFAULT_HOME = 'about:start';

const SPEED_DIAL = [
  { label: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: 'Search', desc: 'Privacy-focused Web Search' },
  { label: 'jsDelivr CDN', url: 'https://www.jsdelivr.com', icon: 'Server', desc: 'Open Source CDN & GitHub Viewer' },
  { label: 'GitHub', url: 'https://github.com', icon: 'GitBranch', desc: 'Developer Platform & Pages' },
  { label: 'Wikipedia', url: 'https://en.wikipedia.org', icon: 'FileText', desc: 'The Free Encyclopedia' },
  { label: 'MDN Web Docs', url: 'https://developer.mozilla.org', icon: 'BookOpen', desc: 'Web Technologies' },
  { label: 'Archive.org', url: 'https://archive.org', icon: 'HardDrive', desc: 'Internet Wayback Machine' },
  { label: 'Hacker News', url: 'https://news.ycombinator.com', icon: 'Radio', desc: 'Tech & Engineering News' },
  { label: 'Three.js Gallery', url: 'https://threejs.org', icon: 'Sparkles', desc: '3D WebGL Library' },
];

function normalizeUrl(input: string): string {
  const v = input.trim();
  if (!v || v === 'about:start' || v === 'about:blank') return v;
  // Support jsdelivr:owner/repo or gh:owner/repo
  if (/^(jsdelivr|gh):/i.test(v)) {
    const repoPath = v.replace(/^(jsdelivr|gh):\/+/i, '').replace(/^(jsdelivr|gh):/i, '');
    const parts = repoPath.split('/');
    if (parts.length >= 2) {
      const owner = parts[0];
      const repo = parts[1].replace(/\.git$/i, '');
      const rest = parts.slice(2).join('/') || 'index.html';
      return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@latest/${rest}`;
    }
  }
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w-]+(\.[\w-]+)+/.test(v)) return 'https://' + v;
  return 'https://duckduckgo.com/?q=' + encodeURIComponent(v);
}

export function BrowserApp({ payload }: Props) {
  const { openApp } = useOS();
  const initialUrl = payload?.url ?? DEFAULT_HOME;
  const isImage = payload?.isImage;

  const [address, setAddress] = useState(initialUrl);
  const [loadedUrl, setLoadedUrl] = useState(initialUrl);
  const [inputVal, setInputVal] = useState(initialUrl === 'about:start' ? '' : initialUrl);
  const [engine, setEngine] = useState<ProxyEngine>(payload?.engine ?? 'scramjet');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [latency, setLatency] = useState(14);
  const [frameError, setFrameError] = useState(false);
  const [logs, setLogs] = useState<{ time: string; text: string; type: 'info' | 'proxy' | 'sec' }[]>([
    { time: '00:00', text: '[Scramjet] Initializing Wasm AST Proxy Runtime...', type: 'info' },
    { time: '00:01', text: '[UV] ServiceWorker registered scope: /service/uv/', type: 'sec' },
    { time: '00:02', text: '[Proxy] Established WebSocket tunnel with bare-server v3', type: 'proxy' },
  ]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Dynamic latency ping simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setLatency(Math.floor(10 + Math.random() * 8));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const addLog = (text: string, type: 'info' | 'proxy' | 'sec' = 'proxy') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [...prev.slice(-20), { time, text, type }]);
  };

  const navigateTo = (url: string) => {
    const norm = normalizeUrl(url);
    setIsLoading(true);
    setFrameError(false);
    setAddress(norm);
    setInputVal(norm === 'about:start' ? '' : norm);
    setLoadedUrl(norm);

    addLog(`[${engine.toUpperCase()}] Rewriting request -> ${norm}`, 'proxy');

    setHistory((prev) => {
      const next = prev.slice(0, historyIdx + 1);
      return [...next, norm];
    });
    setHistoryIdx((prev) => prev + 1);

    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  const goBack = () => {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      setHistoryIdx(prevIdx);
      const url = history[prevIdx];
      setAddress(url);
      setInputVal(url === 'about:start' ? '' : url);
      setLoadedUrl(url);
      setFrameError(false);
      addLog(`[Navigation] History back to ${url}`, 'info');
    }
  };

  const goForward = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      const url = history[nextIdx];
      setAddress(url);
      setInputVal(url === 'about:start' ? '' : url);
      setLoadedUrl(url);
      setFrameError(false);
      addLog(`[Navigation] History forward to ${url}`, 'info');
    }
  };

  const refreshPage = () => {
    setIsLoading(true);
    setFrameError(false);
    addLog(`[Cache] Cache-bypass refresh -> ${loadedUrl}`, 'info');
    setTimeout(() => {
      if (iframeRef.current && loadedUrl !== 'about:start') {
        iframeRef.current.src = `/api/proxy?url=${encodeURIComponent(loadedUrl)}&_t=${Date.now()}`;
      }
      setIsLoading(false);
    }, 350);
  };

  // Compute encoded proxy URL representation
  const encodedProxyString = useMemo(() => {
    if (loadedUrl === 'about:start') return 'about:start';
    if (engine === 'ultraviolet') return encodeUltraviolet(loadedUrl);
    if (engine === 'scramjet') return encodeScramjet(loadedUrl);
    return loadedUrl;
  }, [engine, loadedUrl]);

  const resolvedIframeSrc = useMemo(() => {
    if (!loadedUrl || loadedUrl === 'about:start' || loadedUrl === 'about:blank') return '';
    return `/api/proxy?url=${encodeURIComponent(loadedUrl)}`;
  }, [loadedUrl]);

  const isStartPage = loadedUrl === 'about:start';

  return (
    <div className="flex h-full w-full min-w-0 min-h-0 flex-col bg-zinc-950 text-white select-none">
      {/* -------------------------------------------------------------------
          Top Browser Toolbar & Proxy Engine Bar
         ------------------------------------------------------------------- */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-black/50 backdrop-blur-md">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={goBack}
            disabled={historyIdx === 0}
            className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Back"
          >
            <Icon name="ArrowLeft" size={15} />
          </button>
          <button
            onClick={goForward}
            disabled={historyIdx >= history.length - 1}
            className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Forward"
          >
            <Icon name="ArrowRight" size={15} />
          </button>
          <button
            onClick={refreshPage}
            className={`p-1.5 rounded-lg text-white/70 hover:bg-white/10 transition ${isLoading ? 'animate-spin text-cyan-400' : ''}`}
            title="Reload Page"
          >
            <Icon name="RefreshCw" size={14} />
          </button>
          <button
            onClick={() => navigateTo('about:start')}
            className={`p-1.5 rounded-lg transition ${isStartPage ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10'}`}
            title="Home / Start Page"
          >
            <Icon name="Home" size={14} />
          </button>
        </div>

        {/* Address & Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateTo(inputVal);
          }}
          className="flex-1 flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 focus-within:border-white/30 focus-within:bg-black/60 transition"
        >
          <div className="flex items-center gap-1.5 text-white/40">
            {isStartPage ? (
              <Icon name="Sparkles" size={14} className="text-white/60" />
            ) : loadedUrl.startsWith('https://') ? (
              <Icon name="Lock" size={13} className="text-emerald-400" />
            ) : (
              <Icon name="Globe" size={14} className="text-white/60" />
            )}
          </div>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search DuckDuckGo or enter URL (e.g. wikipedia.org)..."
            className="flex-1 bg-transparent text-xs text-white placeholder-white/40 outline-none font-sans"
          />
          {inputVal && (
            <button
              type="button"
              onClick={() => setInputVal('')}
              className="text-white/40 hover:text-white p-0.5"
            >
              <Icon name="X" size={12} />
            </button>
          )}
          <button
            type="submit"
            className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white/80 transition"
            title="Go"
          >
            <Icon name="CornerDownLeft" size={12} />
          </button>
        </form>

        {/* Engine Switcher (Scramjet vs Ultraviolet vs Direct) */}
        <div className="hidden sm:flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.06]">
          <button
            onClick={() => {
              setEngine('scramjet');
              addLog('[Engine] Switched to Scramjet v3 (Wasm AST Rewriter)', 'proxy');
            }}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition ${
              engine === 'scramjet' ? 'bg-cyan-500 text-black font-semibold shadow-sm' : 'text-white/60 hover:text-white'
            }`}
            title="Scramjet Proxy Engine (High Performance WebAssembly Rewriting)"
          >
            <Icon name="Zap" size={12} />
            <span>Scramjet</span>
          </button>

          <button
            onClick={() => {
              setEngine('ultraviolet');
              addLog('[Engine] Switched to Ultraviolet v2.0 (ServiceWorker XOR)', 'sec');
            }}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition ${
              engine === 'ultraviolet' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
            title="Ultraviolet Proxy Engine (Service Worker Bare Server Tunnel)"
          >
            <Icon name="Shield" size={12} />
            <span>Ultraviolet</span>
          </button>

          <button
            onClick={() => {
              setEngine('direct');
              addLog('[Engine] Switched to Direct Native Gateway', 'info');
            }}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              engine === 'direct' ? 'bg-zinc-700 text-white' : 'text-white/50 hover:text-white'
            }`}
            title="Direct Connection (Without Proxy Rewrite)"
          >
            Direct
          </button>
        </div>

        {/* Live Proxy Ping / Diagnostics Pill */}
        <button
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition shrink-0 ${
            showDiagnostics
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
          }`}
          title="Toggle Proxy Diagnostics & Headers"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{latency}ms</span>
          <Icon name="SlidersHorizontal" size={12} className="text-white/60" />
        </button>
      </div>

      {/* -------------------------------------------------------------------
          Proxy Diagnostics Panel (Flyout)
         ------------------------------------------------------------------- */}
      {showDiagnostics && (
        <div className="bg-zinc-900 border-b border-cyan-500/30 p-3 text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Server" size={14} className="text-cyan-400" />
              <span className="font-semibold text-white">Proxy Architecture Status</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                {engine.toUpperCase()} ACTIVE
              </span>
            </div>
            <button
              onClick={() => setShowDiagnostics(false)}
              className="text-white/50 hover:text-white p-1"
            >
              <Icon name="X" size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px]">
            <div className="bg-black/40 p-2 rounded border border-white/5">
              <span className="text-white/50 block text-[10px]">BARE SERVER GATEWAY</span>
              <span className="text-cyan-300 truncate block">wss://bare.liquid-proxy.io/v3/</span>
            </div>
            <div className="bg-black/40 p-2 rounded border border-white/5">
              <span className="text-white/50 block text-[10px]">ENCRYPTION / PROTOCOL</span>
              <span className="text-purple-300">AES-256-GCM + XOR 2-Byte</span>
            </div>
            <div className="bg-black/40 p-2 rounded border border-white/5">
              <span className="text-white/50 block text-[10px]">CORS & FRAME BYPASS</span>
              <span className="text-emerald-300">X-Frame-Options: Stripped</span>
            </div>
          </div>

          <div className="bg-black/60 p-2 rounded border border-white/10 font-mono text-[10px] text-white/70 max-h-24 overflow-y-auto space-y-1">
            <div className="text-white/40 pb-1 border-b border-white/10 font-bold uppercase tracking-wider">
              Real-time Proxy Intercept Logs:
            </div>
            {logs.map((log, idx) => (
              <div key={idx} className="flex gap-2 leading-relaxed">
                <span className="text-white/40 shrink-0">[{log.time}]</span>
                <span
                  className={
                    log.type === 'sec' ? 'text-purple-300' : log.type === 'proxy' ? 'text-cyan-300' : 'text-white/70'
                  }
                >
                  {log.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------
          Quick Bookmarks / Tunnels Bar
         ------------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/[0.06] bg-zinc-950/70 overflow-x-auto shrink-0">
        <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono mr-1">Tunnels:</span>
        {SPEED_DIAL.slice(0, 6).map((b) => (
          <button
            key={b.url}
            onClick={() => navigateTo(b.url)}
            className="px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1.5 whitespace-nowrap transition text-white/70 hover:bg-white/[0.06] hover:text-white"
          >
            <Icon name={b.icon} size={12} />
            <span>{b.label}</span>
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/40">Proxy Engine:</span>
          <span className="text-[10px] font-mono text-white/60 bg-white/[0.04] px-2 py-0.5 rounded-md truncate max-w-xs border border-white/[0.06]">
            {engine.toUpperCase()} ({encodedProxyString.length > 20 ? encodedProxyString.slice(0, 20) + '...' : encodedProxyString})
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------------
          Main View Area (Clean Web Browser View)
         ------------------------------------------------------------------- */}
      <div className="flex-1 relative bg-zinc-950 min-h-0 overflow-hidden">
        {isImage ? (
          <div className="h-full w-full flex items-center justify-center bg-zinc-900 overflow-auto p-4">
            <img src={loadedUrl} alt={address} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          </div>
        ) : isStartPage ? (
          /* ===============================================================
             Clean Browser Start Page & Speed Dial Grid
             =============================================================== */
          <div className="h-full w-full overflow-y-auto p-6 md:p-10 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-950 via-zinc-900/60 to-black">
            <div className="w-full max-w-3xl space-y-8">
              {/* Logo & Headline */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/10 mb-1">
                  <Icon name="Globe" size={26} />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">Liquid Web Browser</h1>
                <p className="text-xs text-white/50">
                  Unrestricted web access via streaming reverse proxy tunnel
                </p>
              </div>

              {/* Central Search Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inputVal.trim()) navigateTo(inputVal);
                }}
                className="flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.06] focus-within:bg-black/80 focus-within:ring-1 focus-within:ring-white/20 rounded-2xl px-5 py-3.5 border border-white/[0.08] shadow-2xl transition"
              >
                <Icon name="Search" size={17} className="text-white/40 shrink-0" />
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Search the web or type a URL..."
                  className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium shrink-0 transition border border-white/[0.08]"
                >
                  Browse
                </button>
              </form>

              {/* Speed Dial Grid */}
              <div className="space-y-3">
                <div className="text-xs font-medium text-white/50 px-1">
                  Speed Dial & Bookmarks
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SPEED_DIAL.map((item) => (
                    <button
                      key={item.url}
                      onClick={() => navigateTo(item.url)}
                      className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition text-left flex flex-col justify-between h-28 group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/80 group-hover:text-white transition">
                        <Icon name={item.icon} size={15} />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white group-hover:text-cyan-300 transition">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-white/40 truncate">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dedicated Music App Cross-link (Keeping apps strictly separate) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-zinc-900 to-black border border-orange-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-black shrink-0">
                    <Icon name="Music" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Looking for Monochrome Music?</h3>
                    <p className="text-[11px] text-white/60">
                      Music & Synced Karaoke lyrics now run in their own dedicated LiquidOS Music App.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openApp('synth')}
                  className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-semibold flex items-center gap-2 shrink-0 transition"
                >
                  <Icon name="Disc" size={14} />
                  <span>Launch Music App</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ===============================================================
             Active Webpage Frame via Proxy
             =============================================================== */
          <div className="h-full w-full relative bg-white">
            <iframe
              ref={iframeRef}
              src={resolvedIframeSrc}
              className="h-full w-full border-0 bg-white"
              title="proxy-browser"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onError={() => setFrameError(true)}
            />

            {frameError && (
              <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Icon name="Shield" size={24} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Direct Frame Blocked by Origin</h2>
                  <p className="text-xs text-white/60 max-w-md mt-1">
                    {loadedUrl} enforces strict X-Frame-Options or CSP. Switch to Ultraviolet or Scramjet proxy to strip frame restrictions.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEngine('scramjet');
                      refreshPage();
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-semibold text-xs transition hover:bg-cyan-400"
                  >
                    Retry with Scramjet
                  </button>
                  <button
                    onClick={() => navigateTo('about:start')}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs hover:bg-white/20 transition"
                  >
                    Back to Start
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
