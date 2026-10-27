import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '../Icon';
import {
  ProxyEngine,
  MONOCHROME_CATALOG,
  MonochromeTrack,
} from '../proxyService';
import { useOS } from '../OSContext';

export function SynthVisualizerApp() {
  const { openApp } = useOS();

  // Active View Tab: 'player' (Monochrome Hi-Fi) | 'lyrics' (Full Synced Lyrics) | 'synth' (Translucent Synthesizer) | 'proxy' (Tunnel Diagnostics)
  const [activeTab, setActiveTab] = useState<'player' | 'lyrics' | 'synth' | 'proxy'>('player');

  // Proxy Engine State
  const [proxyEngine, setProxyEngine] = useState<ProxyEngine>('scramjet');
  const [proxyLatency, setProxyLatency] = useState(14);
  const [proxyPackets, setProxyPackets] = useState(1284);
  const [isBuffering, setIsBuffering] = useState(false);

  // Track & Playback State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const currentTrack: MonochromeTrack = MONOCHROME_CATALOG[currentTrackIndex] ?? MONOCHROME_CATALOG[0];

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Translucent Synth Controls
  const [waveform, setWaveform] = useState<OscillatorType>('sawtooth');
  const [baseFreq, setBaseFreq] = useState(220); // A3
  const [harmonics, setHarmonics] = useState(3);
  const [filterCutoff, setFilterCutoff] = useState(1200);

  // Audio Context & Nodes Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  // Procedural Synth Music Engine Refs
  const oscNodesRef = useRef<OscillatorNode[]>([]);
  const musicIntervalRef = useRef<number | null>(null);
  const playheadTimerRef = useRef<number | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Latency jitter simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setProxyLatency(Math.floor(10 + Math.random() * 8));
      if (isPlaying) {
        setProxyPackets((prev) => prev + Math.floor(12 + Math.random() * 18));
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Filter tracks by search query
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return MONOCHROME_CATALOG;
    const q = searchQuery.toLowerCase();
    return MONOCHROME_CATALOG.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.genre.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Find currently active lyric line based on currentTime
  const currentLyricIndex = useMemo(() => {
    if (!currentTrack.lyrics || currentTrack.lyrics.length === 0) return -1;
    let idx = 0;
    for (let i = 0; i < currentTrack.lyrics.length; i++) {
      if (currentTime >= currentTrack.lyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [currentTime, currentTrack]);

  // Auto-scroll active lyric into view
  useEffect(() => {
    if (activeTab === 'lyrics' || activeTab === 'player') {
      const activeEl = document.getElementById(`lyric-line-${currentLyricIndex}`);
      if (activeEl && lyricsContainerRef.current) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentLyricIndex, activeTab]);

  // -----------------------------------------------------------------------
  // Web Audio Context Setup
  // -----------------------------------------------------------------------
  const initAudioContext = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    analyserNodeRef.current = analyser;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterCutoff, ctx.currentTime);
    filterNodeRef.current = filter;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(isMuted ? 0 : volume, ctx.currentTime);
    masterGainRef.current = masterGain;

    filter.connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    return ctx;
  }, [filterCutoff, isMuted, volume]);

  // -----------------------------------------------------------------------
  // Procedural Hi-Fi Music Synthesis Engine for Monochrome Tracks
  // -----------------------------------------------------------------------
  const stopProceduralAudio = useCallback(() => {
    if (musicIntervalRef.current) {
      clearInterval(musicIntervalRef.current);
      musicIntervalRef.current = null;
    }
    oscNodesRef.current.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // Ignore stop error
      }
    });
    oscNodesRef.current = [];
  }, []);

  const startProceduralAudio = useCallback((track: MonochromeTrack) => {
    stopProceduralAudio();
    const ctx = initAudioContext();
    if (!ctx || !filterNodeRef.current) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const { synthParams } = track;
    const secondsPerBeat = 60 / synthParams.tempo;
    let step = 0;

    // Harmonic Chord Pad
    const playChordStep = () => {
      if (!ctx || !filterNodeRef.current) return;
      const chordIndex = Math.floor(step / 4) % synthParams.chords.length;
      const currentChord = synthParams.chords[chordIndex] ?? [110, 130.81, 164.81];
      const bassFreq = synthParams.bassFreqs[chordIndex] ?? 55;

      // Bass drone oscillator
      const bassOsc = ctx.createOscillator();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(bassFreq, ctx.currentTime);

      const bassGain = ctx.createGain();
      bassGain.gain.setValueAtTime(0.28, ctx.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + secondsPerBeat * 3.8);

      bassOsc.connect(bassGain);
      bassGain.connect(filterNodeRef.current);
      bassOsc.start();
      bassOsc.stop(ctx.currentTime + secondsPerBeat * 4);

      // Chord notes arpeggiated oscillators
      currentChord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = synthParams.leadType;
        osc.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);

        const chordGain = ctx.createGain();
        chordGain.gain.setValueAtTime(0.08 / (idx + 1), ctx.currentTime);
        chordGain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + secondsPerBeat * 1.8);

        osc.connect(chordGain);
        chordGain.connect(filterNodeRef.current!);
        osc.start();
        osc.stop(ctx.currentTime + secondsPerBeat * 2);
      });

      step++;
    };

    playChordStep();
    musicIntervalRef.current = window.setInterval(playChordStep, secondsPerBeat * 1000);
  }, [initAudioContext, stopProceduralAudio]);

  // -----------------------------------------------------------------------
  // Playback Toggle & Track Changing
  // -----------------------------------------------------------------------
  const playTrack = useCallback((index: number) => {
    setIsBuffering(true);
    setCurrentTrackIndex(index);
    setCurrentTime(0);

    setTimeout(() => {
      setIsBuffering(false);
      setIsPlaying(true);
      startProceduralAudio(MONOCHROME_CATALOG[index]);
    }, 250);
  }, [startProceduralAudio]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopProceduralAudio();
    } else {
      setIsBuffering(true);
      setTimeout(() => {
        setIsBuffering(false);
        setIsPlaying(true);
        startProceduralAudio(currentTrack);
      }, 200);
    }
  };

  const nextTrack = useCallback(() => {
    let nextIdx = currentTrackIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * MONOCHROME_CATALOG.length);
    } else if (nextIdx >= MONOCHROME_CATALOG.length) {
      nextIdx = 0;
    }
    playTrack(nextIdx);
  }, [currentTrackIndex, isShuffle, playTrack]);

  const prevTrack = () => {
    let prevIdx = currentTrackIndex - 1;
    if (prevIdx < 0) {
      prevIdx = MONOCHROME_CATALOG.length - 1;
    }
    playTrack(prevIdx);
  };

  // Playhead time tracking
  useEffect(() => {
    if (isPlaying) {
      playheadTimerRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= currentTrack.duration) {
            if (isRepeat) {
              return 0;
            } else {
              nextTrack();
              return 0;
            }
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (playheadTimerRef.current) {
        clearInterval(playheadTimerRef.current);
        playheadTimerRef.current = null;
      }
    }
    return () => {
      if (playheadTimerRef.current) {
        clearInterval(playheadTimerRef.current);
        playheadTimerRef.current = null;
      }
    };
  }, [isPlaying, currentTrack, isRepeat, nextTrack]);

  // Volume & Mute adjustments
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const targetGain = isMuted ? 0 : volume;
      masterGainRef.current.gain.setValueAtTime(targetGain, audioCtxRef.current.currentTime);
    }
  }, [volume, isMuted]);

  // Synth parameter live updates
  useEffect(() => {
    if (filterNodeRef.current && audioCtxRef.current) {
      filterNodeRef.current.frequency.setValueAtTime(filterCutoff, audioCtxRef.current.currentTime);
    }
  }, [filterCutoff]);

  // -----------------------------------------------------------------------
  // Liquid Visualizer Canvas Animation Loop
  // -----------------------------------------------------------------------
  useEffect(() => {
    let raf = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(128);

    const render = () => {
      const w = (canvas.width = canvas.clientWidth);
      const h = (canvas.height = canvas.clientHeight);

      ctx.clearRect(0, 0, w, h);

      if (analyserNodeRef.current && isPlaying) {
        analyserNodeRef.current.getByteFrequencyData(dataArray);
      } else {
        // Idle ambient wave
        const t = performance.now() * 0.0025;
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.floor(Math.sin(t + i * 0.12) * 22 + 28);
        }
      }

      // Draw Circular Liquid Pulse
      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = Math.min(w, h) * 0.28;

      ctx.beginPath();
      const numPoints = 64;
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const val = dataArray[i % dataArray.length] / 255;
        const r = baseRadius + val * 55;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const radialGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.3, cx, cy, baseRadius + 60);
      radialGrad.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
      radialGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.25)');
      radialGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
      ctx.fillStyle = radialGrad;
      ctx.fill();

      ctx.strokeStyle = isPlaying ? '#f97316' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Bottom Equalizer Bars
      const numBars = 36;
      const barWidth = w / numBars;
      for (let i = 0; i < numBars; i++) {
        const val = dataArray[i * 2] / 255;
        const barHeight = val * (h * 0.35);
        const x = i * barWidth;
        const y = h - barHeight;

        const barGrad = ctx.createLinearGradient(0, y, 0, h);
        barGrad.addColorStop(0, '#f97316');
        barGrad.addColorStop(1, 'rgba(249, 115, 22, 0.05)');
        ctx.fillStyle = barGrad;
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
      }

      raf = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopProceduralAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [stopProceduralAudio]);

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950 text-white select-none overflow-hidden font-sans">
      {/* -------------------------------------------------------------------
          Top Monochrome Hi-Fi Header & Proxy Tunnel Indicator
         ------------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/50 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-md shadow-orange-500/20">
            <Icon name="Music" size={16} className="text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-white">Monochrome Music</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                HI-FI LOSSLESS
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Streamed via <strong className="text-orange-400 uppercase">{proxyEngine}</strong> Proxy Tunnel ({proxyLatency}ms)
              </span>
            </div>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('player')}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              activeTab === 'player' ? 'bg-orange-500 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            <Icon name="Disc" size={13} />
            <span>Player</span>
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              activeTab === 'lyrics' ? 'bg-orange-500 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            <Icon name="Mic2" size={13} />
            <span>Synced Lyrics</span>
          </button>
          <button
            onClick={() => setActiveTab('synth')}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              activeTab === 'synth' ? 'bg-orange-500 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            <Icon name="Sliders" size={13} />
            <span>Translucent Synth</span>
          </button>
          <button
            onClick={() => setActiveTab('proxy')}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              activeTab === 'proxy' ? 'bg-orange-500 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            <Icon name="Server" size={13} />
            <span>Proxy Status</span>
          </button>
        </div>

        {/* Action: Open Current Track in Proxy Browser */}
        <button
          onClick={() =>
            openApp('browser', {
              payload: { url: `https://monochrome.liquid.fm/track/${currentTrack.id}` },
            })
          }
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-medium flex items-center gap-1.5 transition border border-white/10"
          title="Open in Proxy Browser (Ultraviolet / Scramjet)"
        >
          <Icon name="Globe" size={13} />
          <span>Open in Browser</span>
        </button>
      </div>

      {/* -------------------------------------------------------------------
          Main View Body
         ------------------------------------------------------------------- */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* =================================================================
            TAB 1: PLAYER & PLAYLIST VIEW
           ================================================================= */}
        {activeTab === 'player' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Left: Track list & Search */}
            <div className="w-full md:w-80 border-r border-white/10 flex flex-col bg-black/20 shrink-0">
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs">
                  <Icon name="Search" size={13} className="text-white/40" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tracks, artists, genres..."
                    className="bg-transparent text-white outline-none w-full text-xs"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white">
                      <Icon name="X" size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                {filteredTracks.map((track, idx) => {
                  const isCurrent = track.id === currentTrack.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => playTrack(idx)}
                      className={`p-3 flex items-center gap-3 cursor-pointer transition ${
                        isCurrent
                          ? 'bg-orange-500/15 border-l-2 border-orange-500'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${track.coverGradient} border border-white/15 flex items-center justify-center shrink-0 shadow-inner`}
                      >
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end gap-0.5 h-4">
                            <span className="w-1 bg-orange-400 animate-pulse h-3" />
                            <span className="w-1 bg-orange-400 animate-pulse h-4" />
                            <span className="w-1 bg-orange-400 animate-pulse h-2" />
                          </div>
                        ) : (
                          <Icon name="Music" size={16} className={isCurrent ? 'text-orange-400' : 'text-white/60'} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-semibold truncate ${isCurrent ? 'text-orange-400' : 'text-white'}`}>
                          {track.title}
                        </div>
                        <div className="text-[11px] text-white/50 truncate">{track.artist}</div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-white/40">{formatSecs(track.duration)}</span>
                        <div className="text-[9px] font-mono text-orange-400/80">FLAC</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Current Album Art, Waveform Visualizer & Live Lyrics Strip */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto items-center justify-center relative">
              <div className="max-w-md w-full flex flex-col items-center gap-5">
                {/* Album Cover & Circular Visualizer */}
                <div className="relative w-64 h-64 rounded-3xl glass-panel p-2 shadow-2xl flex items-center justify-center overflow-hidden border border-orange-500/20 group">
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                  {/* Album Artwork Centerpiece */}
                  <div
                    className={`w-40 h-40 rounded-2xl bg-gradient-to-br ${currentTrack.coverGradient} border border-white/20 flex flex-col items-center justify-center p-4 text-center shadow-xl group-hover:scale-105 transition`}
                  >
                    <Icon name="Disc" size={36} className="text-white/80 animate-spin-slow mb-2" />
                    <div className="text-xs font-bold text-white line-clamp-1">{currentTrack.title}</div>
                    <div className="text-[10px] text-white/60 line-clamp-1">{currentTrack.artist}</div>
                  </div>

                  {isBuffering && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2 text-xs font-mono text-orange-400">
                      <Icon name="RotateCw" size={16} className="animate-spin" />
                      <span>Decryption Stream...</span>
                    </div>
                  )}
                </div>

                {/* Track Details */}
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-bold text-white tracking-tight">{currentTrack.title}</h2>
                  <p className="text-sm text-white/60 font-medium">{currentTrack.artist}</p>
                  <p className="text-xs text-white/40 font-mono">
                    {currentTrack.album} • {currentTrack.format}
                  </p>
                </div>

                {/* Synchronized Live Lyrics Preview Strip */}
                <div
                  onClick={() => setActiveTab('lyrics')}
                  className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/40 hover:bg-white/10 transition cursor-pointer text-center space-y-1 group"
                >
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-orange-400">
                    <Icon name="Mic2" size={11} />
                    <span>Real-time Karaoke Lyrics Sync</span>
                    <Icon name="ChevronRight" size={11} className="group-hover:translate-x-0.5 transition" />
                  </div>
                  <div className="text-sm font-semibold text-white/90 transition">
                    {currentTrack.lyrics[currentLyricIndex]?.text ?? '♪ [Instrumental Passage] ♪'}
                  </div>
                  <div className="text-xs text-white/40 italic">
                    {currentTrack.lyrics[currentLyricIndex + 1]?.text ?? ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 2: FULL SYNCHRONIZED KARAOKE LYRICS VIEW
           ================================================================= */}
        {activeTab === 'lyrics' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black">
            {/* Track Info sidebar */}
            <div className="w-full md:w-72 p-6 border-r border-white/10 flex flex-col justify-between shrink-0 bg-black/30">
              <div className="space-y-4">
                <div
                  className={`w-36 h-36 rounded-2xl bg-gradient-to-br ${currentTrack.coverGradient} border border-white/20 flex items-center justify-center shadow-xl mx-auto`}
                >
                  <Icon name="Music" size={32} className="text-white/80" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-white">{currentTrack.title}</h3>
                  <p className="text-xs text-white/60">{currentTrack.artist}</p>
                  <p className="text-[11px] text-white/40 mt-1">{currentTrack.album}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] space-y-1 font-mono text-white/60">
                  <div className="flex justify-between">
                    <span>Source:</span>
                    <span className="text-emerald-400">Monochrome Hi-Fi</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LRC Protocol:</span>
                    <span className="text-orange-400">Millisecond Sync</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Proxy Bypass:</span>
                    <span className="text-purple-400 uppercase">{proxyEngine}</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-white/40 text-center">
                Click any line to jump audio directly to that timestamp.
              </div>
            </div>

            {/* Scrolling Lyrics Area */}
            <div ref={lyricsContainerRef} className="flex-1 overflow-y-auto p-8 space-y-5 text-center">
              <div className="py-12" />
              {currentTrack.lyrics.map((line, idx) => {
                const isActive = idx === currentLyricIndex;
                const isPassed = idx < currentLyricIndex;
                return (
                  <div
                    key={idx}
                    id={`lyric-line-${idx}`}
                    onClick={() => setCurrentTime(line.time)}
                    className={`cursor-pointer transition-all duration-300 py-1.5 px-4 rounded-xl ${
                      isActive
                        ? 'text-xl md:text-2xl font-bold text-white scale-105 bg-orange-500/10 text-shadow-orange'
                        : isPassed
                        ? 'text-sm md:text-base text-white/40 hover:text-white/70'
                        : 'text-sm md:text-base text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isActive && <Icon name="Play" size={14} className="text-orange-400 shrink-0" />}
                      <span>{line.text}</span>
                    </div>
                  </div>
                );
              })}
              <div className="py-24" />
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 3: TRANSLUCENT SYNTHESIZER & OSCILLATORS VIEW
           ================================================================= */}
        {activeTab === 'synth' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-zinc-950/80">
            {/* Visualizer center */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
              <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-semibold text-orange-400">
                <Icon name="Sliders" size={16} />
                <span>Web Audio Harmonic Oscillators</span>
              </div>

              <div className="h-64 w-full max-w-lg rounded-2xl glass-panel p-4 overflow-hidden relative border border-orange-500/20 shadow-2xl">
                <canvas ref={canvasRef} className="h-full w-full" />
              </div>

              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition shadow-lg ${
                    isPlaying
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                      : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30'
                  }`}
                >
                  <Icon name={isPlaying ? 'Pause' : 'Play'} size={16} />
                  <span>{isPlaying ? 'Pause Synthesis' : 'Start Synthesis'}</span>
                </button>
              </div>
            </div>

            {/* Synthesizer Control Knobs */}
            <div className="w-80 border-l border-white/10 p-5 flex flex-col justify-between bg-black/40 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                  Oscillator Configuration
                </h3>

                {/* Waveform Selector */}
                <div>
                  <label className="text-[11px] text-white/60 mb-1.5 block">Waveform Geometry</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1 rounded-lg border border-white/10">
                    {(['sawtooth', 'sine', 'triangle', 'square'] as OscillatorType[]).map((wf) => (
                      <button
                        key={wf}
                        onClick={() => setWaveform(wf)}
                        className={`py-1 text-xs rounded capitalize font-medium transition ${
                          waveform === wf ? 'bg-orange-500 text-white' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {wf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pitch Frequency Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60">Fundamental Frequency</span>
                    <span className="font-mono text-orange-400">{baseFreq} Hz</span>
                  </div>
                  <input
                    type="range"
                    min={55}
                    max={660}
                    value={baseFreq}
                    onChange={(e) => setBaseFreq(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                {/* Harmonics Multiplier */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60">Harmonics Count</span>
                    <span className="font-mono text-orange-400">{harmonics} Overtones</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={harmonics}
                    onChange={(e) => setHarmonics(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                {/* Lowpass Filter Cutoff */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60">Biquad Filter Cutoff</span>
                    <span className="font-mono text-orange-400">{filterCutoff} Hz</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={4000}
                    value={filterCutoff}
                    onChange={(e) => setFilterCutoff(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="text-[10px] text-white/40 pt-4 border-t border-white/10">
                Processed via LiquidOS Web Audio Pipeline with zero rendering latency.
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 4: PROXY DIAGNOSTICS & TUNNEL STATUS
           ================================================================= */}
        {activeTab === 'proxy' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-4xl mx-auto">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Icon name="Server" size={18} className="text-orange-400" />
                <span>Monochrome Music Proxy Architecture</span>
              </h2>
              <p className="text-xs text-white/60 mt-1">
                Monochrome Music utilizes client-side Scramjet and Ultraviolet proxy pipelines to stream lossless
                audio and real-time lyrics without CORS or domain restrictions.
              </p>
            </div>

            {/* Proxy Engine Switcher */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
              <span className="text-xs font-semibold text-white uppercase tracking-wider block">
                Active Proxy Engine:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setProxyEngine('scramjet')}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                    proxyEngine === 'scramjet'
                      ? 'bg-orange-500/20 border-orange-500 text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                  }`}
                >
                  <Icon name="Zap" size={20} className="text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">Scramjet Engine v1.5</div>
                    <div className="text-[11px] text-white/60 mt-0.5">
                      AST WebAssembly rewriter with DOM patching. Highest audio streaming throughput.
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setProxyEngine('ultraviolet')}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                    proxyEngine === 'ultraviolet'
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                  }`}
                >
                  <Icon name="Shield" size={20} className="text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">Ultraviolet Engine v2.0</div>
                    <div className="text-[11px] text-white/60 mt-0.5">
                      Service Worker XOR-based encoding with Bare Server WebSocket tunneling.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Diagnostic Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-white/40 uppercase font-mono">Tunnel Latency</div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-1">{proxyLatency} ms</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-white/40 uppercase font-mono">Data Transferred</div>
                <div className="text-base font-bold font-mono text-orange-400 mt-1">{proxyPackets} KB</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-white/40 uppercase font-mono">Audio Codec</div>
                <div className="text-base font-bold font-mono text-purple-400 mt-1">FLAC 24/96</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-white/40 uppercase font-mono">Lyrics Sync</div>
                <div className="text-base font-bold font-mono text-cyan-400 mt-1">LRC Live</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------
          Bottom Playback Controls & Progress Bar
         ------------------------------------------------------------------- */}
      <div className="p-3 bg-black/60 border-t border-white/10 shrink-0 flex flex-col gap-2">
        {/* Scrubber Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-white/40 w-9 text-right">{formatSecs(currentTime)}</span>
          <div
            className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative overflow-hidden group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              setCurrentTime(pos * currentTrack.duration);
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
              style={{ width: `${(currentTime / currentTrack.duration) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-white/40 w-9">{formatSecs(currentTrack.duration)}</span>
        </div>

        {/* Playback Action Buttons */}
        <div className="flex items-center justify-between">
          {/* Left: mini track info */}
          <div className="flex items-center gap-3 w-48 truncate">
            <div
              className={`w-9 h-9 rounded-lg bg-gradient-to-br ${currentTrack.coverGradient} border border-white/15 flex items-center justify-center shrink-0`}
            >
              <Icon name="Music" size={14} className="text-white/80" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{currentTrack.title}</div>
              <div className="text-[10px] text-white/50 truncate">{currentTrack.artist}</div>
            </div>
          </div>

          {/* Center: Play, Next, Prev, Shuffle, Repeat */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-1.5 rounded transition ${isShuffle ? 'text-orange-400' : 'text-white/40 hover:text-white'}`}
              title="Shuffle"
            >
              <Icon name="Shuffle" size={14} />
            </button>
            <button
              onClick={prevTrack}
              className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 transition"
              title="Previous Track"
            >
              <Icon name="SkipBack" size={18} />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 transition"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              <Icon name={isPlaying ? 'Pause' : 'Play'} size={18} />
            </button>
            <button
              onClick={nextTrack}
              className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 transition"
              title="Next Track"
            >
              <Icon name="SkipForward" size={18} />
            </button>
            <button
              onClick={() => setIsRepeat(!isRepeat)}
              className={`p-1.5 rounded transition ${isRepeat ? 'text-orange-400' : 'text-white/40 hover:text-white'}`}
              title="Repeat"
            >
              <Icon name="Repeat" size={14} />
            </button>
          </div>

          {/* Right: Volume slider */}
          <div className="flex items-center gap-2 w-48 justify-end">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-white/60 hover:text-white transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <Icon name={isMuted || volume === 0 ? 'VolumeX' : 'Volume2'} size={16} />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-20 accent-orange-500 cursor-pointer h-1 bg-white/20 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
