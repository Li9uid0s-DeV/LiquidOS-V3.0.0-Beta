import { useState, useRef, useEffect } from 'react';
import { Icon } from '../Icon';

export function SynthVisualizerApp() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveform, setWaveform] = useState<OscillatorType>('sine');
  const [baseFreq, setBaseFreq] = useState(220); // A3
  const [harmonics, setHarmonics] = useState(3);
  const [filterCutoff, setFilterCutoff] = useState(800);
  const [volume, setVolume] = useState(0.25);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscNodesRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  const startAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserNodeRef.current = analyser;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterCutoff, ctx.currentTime);
      filterNodeRef.current = filter;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      gainNodeRef.current = masterGain;

      filter.connect(masterGain);
      masterGain.connect(analyser);
      analyser.connect(ctx.destination);

      // Create rich chord drone oscillators
      const ratios = [1.0, 1.5, 2.0, 2.5]; // Fundamental, 5th, Octave, Major 3rd above octave
      const oscs: OscillatorNode[] = [];

      for (let i = 0; i < harmonics; i++) {
        const osc = ctx.createOscillator();
        osc.type = waveform;
        osc.frequency.setValueAtTime(baseFreq * (ratios[i % ratios.length] ?? 1.0), ctx.currentTime);

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.3 / (i + 1), ctx.currentTime);

        osc.connect(subGain);
        subGain.connect(filter);
        osc.start();
        oscs.push(osc);
      }

      oscNodesRef.current = oscs;
      setIsPlaying(true);
    } catch {
      // User gesture needed
    }
  };

  const stopAudio = () => {
    oscNodesRef.current.forEach((o) => {
      try {
        o.stop();
        o.disconnect();
      } catch {
        // Ignore stop error
      }
    });
    oscNodesRef.current = [];
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  // Update audio parameters on the fly
  useEffect(() => {
    if (filterNodeRef.current && audioCtxRef.current) {
      filterNodeRef.current.frequency.setValueAtTime(filterCutoff, audioCtxRef.current.currentTime);
    }
  }, [filterCutoff]);

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Visualizer Animation Loop
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
        // Idle decorative wave
        const t = performance.now() * 0.003;
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.floor(Math.sin(t + i * 0.1) * 30 + 35);
        }
      }

      // Draw Circular Liquid Visualizer
      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = Math.min(w, h) * 0.25;

      ctx.beginPath();
      const numPoints = 64;
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const val = dataArray[i % dataArray.length] / 255;
        const r = baseRadius + val * 45;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const radialGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.5, cx, cy, baseRadius + 50);
      radialGrad.addColorStop(0, 'rgba(249, 115, 22, 0.5)');
      radialGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.3)');
      radialGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
      ctx.fillStyle = radialGrad;
      ctx.fill();

      ctx.strokeStyle = isPlaying ? '#f97316' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Spectrum frequency bars along the bottom
      const barWidth = w / 32;
      for (let i = 0; i < 32; i++) {
        const val = dataArray[i * 3] / 255;
        const barHeight = val * (h * 0.4);
        const x = i * barWidth;
        const y = h - barHeight;

        const barGrad = ctx.createLinearGradient(0, y, 0, h);
        barGrad.addColorStop(0, '#f97316');
        barGrad.addColorStop(1, 'rgba(249, 115, 22, 0.1)');
        ctx.fillStyle = barGrad;
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
      }

      raf = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  return (
    <div className="flex h-full w-full bg-zinc-950/70 text-white select-none">
      {/* Visualizer Canvas Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Icon name="Music" size={18} className="text-orange-400" />
          <span className="text-xs font-semibold uppercase tracking-wider">Aura Harmonic Oscillations</span>
        </div>

        <div className="h-64 w-full max-w-lg rounded-2xl glass-panel p-4 overflow-hidden relative border border-orange-500/20 shadow-2xl">
          <canvas ref={canvasRef} className="h-full w-full" />
        </div>

        {/* Play / Stop Master Button */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={() => (isPlaying ? stopAudio() : startAudio())}
            className={`px-6 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition shadow-lg ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30'
            }`}
          >
            <Icon name={isPlaying ? 'Pause' : 'Play'} size={16} />
            {isPlaying ? 'Halt Ambient Drone' : 'Initialize Synthesizer'}
          </button>
        </div>
      </div>

      {/* Control Knobs Sidebar */}
      <div className="w-72 border-l border-white/10 p-5 flex flex-col justify-between bg-black/30 overflow-y-auto">
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-400">Harmonic Controls</h3>

          {/* Waveform Selector */}
          <div>
            <label className="text-[11px] text-white/60 mb-1.5 block">Waveform Geometry</label>
            <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1 rounded-lg border border-white/10">
              {(['sine', 'triangle', 'sawtooth', 'square'] as OscillatorType[]).map((wf) => (
                <button
                  key={wf}
                  onClick={() => {
                    setWaveform(wf);
                    if (isPlaying) {
                      stopAudio();
                      setTimeout(startAudio, 50);
                    }
                  }}
                  className={`py-1 text-xs rounded capitalize font-medium transition ${
                    waveform === wf ? 'bg-orange-500 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {wf}
                </button>
              ))}
            </div>
          </div>

          {/* Base Frequency Pitch Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/60">Pitch Frequency</span>
              <span className="font-mono text-orange-400">{baseFreq} Hz</span>
            </div>
            <input
              type="range"
              min={55}
              max={660}
              value={baseFreq}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBaseFreq(val);
                if (isPlaying) {
                  stopAudio();
                  setTimeout(startAudio, 50);
                }
              }}
              className="w-full accent-orange-500 bg-white/10 rounded-lg h-1.5"
            />
          </div>

          {/* Harmonic Chord Layers */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/60">Harmonic Layers</span>
              <span className="font-mono text-orange-400">{harmonics} Voices</span>
            </div>
            <input
              type="range"
              min={1}
              max={4}
              value={harmonics}
              onChange={(e) => {
                const val = Number(e.target.value);
                setHarmonics(val);
                if (isPlaying) {
                  stopAudio();
                  setTimeout(startAudio, 50);
                }
              }}
              className="w-full accent-orange-500 bg-white/10 rounded-lg h-1.5"
            />
          </div>

          {/* Filter Cutoff */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/60">Lowpass Cutoff</span>
              <span className="font-mono text-orange-400">{filterCutoff} Hz</span>
            </div>
            <input
              type="range"
              min={200}
              max={3000}
              value={filterCutoff}
              onChange={(e) => setFilterCutoff(Number(e.target.value))}
              className="w-full accent-orange-500 bg-white/10 rounded-lg h-1.5"
            />
          </div>

          {/* Volume */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/60">Master Amplitude</span>
              <span className="font-mono text-orange-400">{(volume * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={0.5}
              step={0.02}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-orange-500 bg-white/10 rounded-lg h-1.5"
            />
          </div>
        </div>

        <div className="glass-panel p-3 rounded-xl text-[11px] text-white/50 space-y-1">
          <div className="text-white font-medium">Cosmic Web Audio Engine</div>
          <p>Real-time client-side synthesis with zero latency.</p>
        </div>
      </div>
    </div>
  );
}
