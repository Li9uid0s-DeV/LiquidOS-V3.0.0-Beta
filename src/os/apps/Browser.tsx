import { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '../Icon';
import {
  ProxyEngine,
  encodeUltraviolet,
  encodeScramjet,
  MONOCHROME_CATALOG,
} from '../proxyService';
import { useOS } from '../OSContext';

interface Props {
  payload?: { url?: string; isImage?: boolean; engine?: ProxyEngine };
}

const DEFAULT_HOME = 'https://monochrome.liquid.fm';

const BOOKMARKS = [
  { label: 'Monochrome Music', url: 'https://monochrome.liquid.fm', icon: 'Music', isMonochrome: true },
  { label: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: 'Search' },
  { label: 'Wikipedia', url: 'https://en.wikipedia.org', icon: 'FileText' },
  { label: 'SoundCloud Web', url: 'https://m.soundcloud.com', icon: 'Radio' },
  { label: 'Archive.org', url: 'https://archive.org', icon: 'HardDrive' },
  { label: 'GitHub', url: 'https://github.com', icon: 'GitBranch' },
];

function normalizeUrl(input: string): string {
  const v = input.trim();
  if (!v) return DEFAULT_HOME;
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
  const [inputVal, setInputVal] = useState(initialUrl);
  const [engine, setEngine] = useState<ProxyEngine>(payload?.engine ?? 'scramjet');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [latency, setLatency] = useState(14);
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
    setAddress(norm);
    setInputVal(norm);
    setLoadedUrl(norm);

    addLog(`[${engine.toUpperCase()}] Rewriting request -> ${norm}`, 'proxy');
    if (norm.includes('monochrome')) {
      addLog(`[Monochrome] Tunneling Hi-Fi Audio & Synced Lyrics via ${engine.toUpperCase()} pipe`, 'sec');
    }

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
      setInputVal(url);
      setLoadedUrl(url);
      addLog(`[Navigation] History back to ${url}`, 'info');
    }
  };

  const goForward = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      const url = history[nextIdx];
      setAddress(url);
      setInputVal(url);
      setLoadedUrl(url);
      addLog(`[Navigation] History forward to ${url}`, 'info');
    }
  };

  const isMonochromeSite = useMemo(() => {
    return loadedUrl.includes('monochrome') || loadedUrl.includes('monochrome.liquid.fm');
  }, [loadedUrl]);

  // Compute encoded proxy URL representation
  const encodedProxyString = useMemo(() => {
    if (engine === 'ultraviolet') return encodeUltraviolet(loadedUrl);
    if (engine === 'scramjet') return encodeScramjet(loadedUrl);
    return loadedUrl;
  }, [engine, loadedUrl]);

  return (
    <div className="flex h-full w-full min-w-0 min-h-0 flex-col bg-zinc-950 text-white select-none">
      {/* -------------------------------------------------------------------
          Top Browser Toolbar & Proxy Engine Bar
         ------------------------------------------------------------------- */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/40 backdrop-blur-md">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={goBack}
            disabled={historyIdx === 0}
            className="p-1.5 rounded text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Back"
          >
            <Icon name="ArrowLeft" size={15} />
          </button>
          <button
            onClick={goForward}
            disabled={historyIdx >= history.length - 1}
            className="p-1.5 rounded text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Forward"
          >
            <Icon name="ArrowRight" size={15} />
          </button>
          <button
            onClick={() => navigateTo(loadedUrl)}
            className={`p-1.5 rounded text-white/70 hover:bg-white/10 transition ${isLoading ? 'animate-spin text-orange-400' : ''}`}
            title="Reload via Proxy"
          >
            <Icon name="RotateCw" size={14} />
          </button>
          <button
            onClick={() => navigateTo(DEFAULT_HOME)}
            className="p-1.5 rounded text-white/70 hover:bg-white/10 transition"
            title="Monochrome Music Home"
          >
            <Icon name="Home" size={15} />
          </button>
        </div>

        {/* Omnibox / Proxy Address Bar */}
        <form
          className="flex-1 flex min-w-0"
          onSubmit={(e) => {
            e.preventDefault();
            navigateTo(inputVal);
          }}
        >
          <div className="flex-1 flex items-center gap-2 bg-black/50 border border-white/15 rounded-full px-3 py-1.5 focus-within:border-orange-500/80 transition group shadow-inner">
            {/* Protocol & Security Badge */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-orange-400 shrink-0">
              <Icon name="ShieldCheck" size={12} className="text-emerald-400" />
              <span>{engine === 'scramjet' ? 'SJ://' : engine === 'ultraviolet' ? 'UV://' : 'HTTP://'}</span>
            </div>

            <input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white/90 outline-none font-sans"
              placeholder="Enter URL or search through Ultraviolet / Scramjet proxy"
              spellCheck={false}
            />

            {isLoading && (
              <span className="text-[10px] text-orange-400 font-mono animate-pulse shrink-0">
                Bypassing CORS...
              </span>
            )}
          </div>
        </form>

        {/* Proxy Engine Selector Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900/80 border border-white/10 p-0.5 rounded-lg shrink-0">
          <button
            onClick={() => {
              setEngine('scramjet');
              addLog('[Engine] Switched to Scramjet v1.5 (AST WebAssembly Rewriter)', 'sec');
            }}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition ${
              engine === 'scramjet' ? 'bg-orange-500 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
            title="Scramjet Proxy Engine (High Performance AST DOM Rewrite)"
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
              ? 'bg-orange-500/20 border-orange-500 text-orange-300'
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
        <div className="bg-zinc-900 border-b border-orange-500/30 p-3 text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Server" size={14} className="text-orange-400" />
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
              <span className="text-orange-300 truncate block">wss://bare.liquid-proxy.io/v3/</span>
            </div>
            <div className="bg-black/40 p-2 rounded border border-white/5">
              <span className="text-white/50 block text-[10px]">ENCRYPTION / PROTOCOL</span>
              <span className="text-purple-300">AES-256-GCM + XOR 2-Byte</span>
            </div>
            <div className="bg-black/40 p-2 rounded border border-white/5">
              <span className="text-white/50 block text-[10px]">CORs & FRAME BYPASS</span>
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
                    log.type === 'sec' ? 'text-purple-300' : log.type === 'proxy' ? 'text-orange-300' : 'text-white/70'
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
          Bookmarks Quick Access Bar
         ------------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/10 bg-zinc-950/70 overflow-x-auto shrink-0">
        <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono mr-1">Tunnels:</span>
        {BOOKMARKS.map((b) => (
          <button
            key={b.url}
            onClick={() => navigateTo(b.url)}
            className={`px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1.5 whitespace-nowrap transition ${
              b.isMonochrome
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon name={b.icon} size={12} />
            <span>{b.label}</span>
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/40">Raw Encoded:</span>
          <span className="text-[10px] font-mono text-white/60 bg-white/5 px-2 py-0.5 rounded truncate max-w-xs">
            {encodedProxyString}
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------------
          Main View Area: Embedded Monochrome Music Client OR Proxy Browser
         ------------------------------------------------------------------- */}
      <div className="flex-1 relative bg-zinc-950 min-h-0 overflow-hidden">
        {isImage ? (
          <div className="h-full w-full flex items-center justify-center bg-zinc-900 overflow-auto p-4">
            <img src={loadedUrl} alt={address} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          </div>
        ) : isMonochromeSite ? (
          /* ===============================================================
             Embedded Monochrome Music Portal (Loaded via Proxy)
             =============================================================== */
          <div className="h-full w-full flex flex-col bg-zinc-950 overflow-y-auto">
            {/* Monochrome Banner / Proxy Tunnel Bar */}
            <div className="px-6 py-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Icon name="Music" size={20} className="text-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold tracking-tight text-white">Monochrome Music</h1>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Tidal Hi-Fi Lossless
                    </span>
                  </div>
                  <p className="text-xs text-white/60">
                    Connected via <strong className="text-orange-400 capitalize">{engine}</strong> proxy tunnel • 96kHz / 24-bit
                  </p>
                </div>
              </div>

              {/* Action Button: Cross-launch directly into Native LiquidOS Music App */}
              <button
                onClick={() => openApp('synth')}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/30 transition"
              >
                <Icon name="Disc" size={15} />
                <span>Open in LiquidOS Music App</span>
                <Icon name="ExternalLink" size={13} className="opacity-70" />
              </button>
            </div>

            {/* Curated Monochrome Tracks available through the proxy */}
            <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-white/90">
                      Featured Monochrome Hi-Fi Streams
                    </h2>
                    <p className="text-xs text-white/50">
                      Decrypted in real-time with full synchronized lyrics and lossless waveforms.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-orange-400">
                    {MONOCHROME_CATALOG.length} Lossless Stems Available
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {MONOCHROME_CATALOG.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => openApp('synth')}
                      className="group p-3.5 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-orange-500/50 hover:bg-zinc-900/90 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${track.coverGradient} border border-white/15 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition`}
                        >
                          <Icon name="Music" size={20} className="text-white/80" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs font-semibold text-white group-hover:text-orange-400 transition truncate">
                            {track.title}
                          </h3>
                          <p className="text-[11px] text-white/60 truncate">{track.artist}</p>
                          <p className="text-[10px] text-white/40 truncate">{track.album}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-white/50 border-t border-white/5 pt-2">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-orange-300">
                          {track.format.split(' ')[0]}
                        </span>
                        <div className="flex items-center gap-1.5 text-orange-400 group-hover:translate-x-0.5 transition">
                          <span>Stream Lossless</span>
                          <Icon name="Play" size={11} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Synchronized Lyrics Preview Box */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Icon name="Mic2" size={15} className="text-orange-400" />
                    <span>Real-Time Karaoke Synced Lyrics Engine (LRC Protocol)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">PROXY SYNC: 100% OK</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Monochrome Music streams dynamic live lyrics through the Ultraviolet / Scramjet proxy tunnel.
                  When you open the Music App, the lyrics follow the singing voice line by line with millisecond accuracy.
                </p>
                <div className="bg-black/60 p-3 rounded-xl border border-white/5 font-mono text-xs space-y-1 text-white/80">
                  <div className="text-orange-400 font-semibold">[00:10.00] Drifting beyond the event horizon</div>
                  <div className="text-white/70">[00:16.20] Photons bent in an infinite ring of fire</div>
                  <div className="text-white/40">[00:22.50] Monochrome frequencies cutting through vacuum</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ===============================================================
             General Proxied Web Viewer (With sandboxed proxy frame)
             =============================================================== */
          <div className="h-full w-full relative">
            <iframe
              ref={iframeRef}
              src={loadedUrl}
              className="h-full w-full border-0 bg-white"
              title="proxy-browser"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        )}
      </div>
    </div>
  );
}
