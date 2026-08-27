import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useOS } from '../OSContext';
import { Icon } from '../Icon';

export function SystemMonitorApp() {
  const { windows, closeWindow, focusWindow } = useOS();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fps, setFps] = useState(60);
  const [cpuUsage, setCpuUsage] = useState(18);
  const [ramUsage, setRamUsage] = useState(2.4);
  const [activeTab, setActiveTab] = useState<'performance' | 'processes' | 'specs'>('performance');

  const historyRef = useRef<{ cpu: number[]; fps: number[] }>({
    cpu: Array(40).fill(15),
    fps: Array(40).fill(60),
  });

  useEffect(() => {
    let frameCount = 0;
    let fpsTimer = performance.now();
    let raf = 0;

    const tick = () => {
      const now = performance.now();
      frameCount++;

      if (now - fpsTimer >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / (now - fpsTimer));
        setFps(currentFps);
        frameCount = 0;
        fpsTimer = now;

        // Simulate dynamic CPU fluctuation based on window count and activity
        const baseCpu = 12 + windows.length * 4.2 + (Math.sin(now * 0.002) * 6 + Math.random() * 8);
        const clampedCpu = Math.min(98, Math.max(5, Math.round(baseCpu)));
        setCpuUsage(clampedCpu);

        // Memory pool in GB
        const baseRam = 2.1 + windows.length * 0.35 + Math.sin(now * 0.001) * 0.2;
        setRamUsage(parseFloat(baseRam.toFixed(2)));

        historyRef.current.cpu.shift();
        historyRef.current.cpu.push(clampedCpu);

        historyRef.current.fps.shift();
        historyRef.current.fps.push(Math.min(60, currentFps));
      }

      // Draw real-time performance graphs
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = (canvas.width = canvas.clientWidth);
          const h = (canvas.height = canvas.clientHeight);

          ctx.clearRect(0, 0, w, h);

          // Background Grid
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1;
          for (let y = 0; y < h; y += 24) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }

          // CPU Line Chart (Neon Orange)
          const cpuHist = historyRef.current.cpu;
          const step = w / (cpuHist.length - 1);

          ctx.beginPath();
          ctx.moveTo(0, h - (cpuHist[0] / 100) * (h - 20) - 10);
          for (let i = 1; i < cpuHist.length; i++) {
            const x = i * step;
            const y = h - (cpuHist[i] / 100) * (h - 20) - 10;
            ctx.lineTo(x, y);
          }

          // Gradient Fill under CPU
          const grad = ctx.createLinearGradient(0, 0, 0, h);
          grad.addColorStop(0, 'rgba(249, 115, 22, 0.4)');
          grad.addColorStop(1, 'rgba(249, 115, 22, 0.0)');
          ctx.lineTo(w, h);
          ctx.lineTo(0, h);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.fill();

          // Stroke line
          ctx.beginPath();
          ctx.moveTo(0, h - (cpuHist[0] / 100) * (h - 20) - 10);
          for (let i = 1; i < cpuHist.length; i++) {
            const x = i * step;
            const y = h - (cpuHist[i] / 100) * (h - 20) - 10;
            ctx.lineTo(x, y);
          }
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }

      lastTime = now;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [windows.length]);

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/60 text-white select-none">
      {/* Top Header Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 bg-white/5">
        <div className="flex items-center gap-2">
          <Icon name="Activity" size={18} className="text-orange-400" />
          <span className="text-sm font-semibold tracking-wide">System Monitor Pro</span>
        </div>

        <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/10">
          {(['performance', 'processes', 'specs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs rounded-md capitalize font-medium transition ${
                activeTab === tab
                  ? 'bg-orange-500/80 text-white shadow'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'performance' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-panel p-3.5 rounded-xl flex flex-col justify-between border border-orange-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60 font-medium">CPU Load</span>
                  <Icon name="Cpu" size={16} className="text-orange-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-orange-400">{cpuUsage}%</span>
                  <span className="text-[11px] text-white/40">3.80 GHz (4 Cores)</span>
                </div>
                <div className="w-full bg-black/40 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${cpuUsage}%` }}
                  />
                </div>
              </div>

              <div className="glass-panel p-3.5 rounded-xl flex flex-col justify-between border border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60 font-medium">Memory Allocation</span>
                  <Icon name="HardDrive" size={16} className="text-cyan-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-cyan-400">{ramUsage} GB</span>
                  <span className="text-[11px] text-white/40">of 16.0 GB</span>
                </div>
                <div className="w-full bg-black/40 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(ramUsage / 16) * 100}%` }}
                  />
                </div>
              </div>

              <div className="glass-panel p-3.5 rounded-xl flex flex-col justify-between border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60 font-medium">GPU Render Rate</span>
                  <Icon name="Zap" size={16} className="text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-400">{fps} FPS</span>
                  <span className="text-[11px] text-white/40">WebGL 2.0 Engine</span>
                </div>
                <div className="w-full bg-black/40 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(fps / 60) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Live Chart Canvas */}
            <div className="glass-panel p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/80">CPU Clock & Utilization History</span>
                <span className="text-[11px] text-orange-400 font-mono">Real-time Stream (60s)</span>
              </div>
              <div className="h-44 w-full rounded-lg bg-black/40 border border-white/10 overflow-hidden relative">
                <canvas ref={canvasRef} className="h-full w-full" />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'processes' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <div className="flex justify-between text-[11px] text-white/50 px-3 pb-1 border-b border-white/10 font-semibold uppercase">
              <span>Process Name</span>
              <div className="flex gap-16 mr-12">
                <span>Memory</span>
                <span>Actions</span>
              </div>
            </div>

            <div className="space-y-1">
              {/* Kernel system process */}
              <div className="glass-panel p-2.5 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Icon name="Shield" size={15} className="text-blue-400" />
                  <span className="font-medium text-white">LiquidOS Gravitational Kernel</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">SYSTEM</span>
                </div>
                <div className="flex items-center gap-12">
                  <span className="text-white/60 font-mono">142 MB</span>
                  <span className="text-white/30 text-[11px] mr-4">Protected</span>
                </div>
              </div>

              {/* Black Hole Shader process */}
              <div className="glass-panel p-2.5 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Icon name="Sparkles" size={15} className="text-orange-400" />
                  <span className="font-medium text-white">Three.js Gargantua Raymarcher</span>
                  <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded">GPU</span>
                </div>
                <div className="flex items-center gap-12">
                  <span className="text-white/60 font-mono">284 MB</span>
                  <span className="text-white/30 text-[11px] mr-4">Active</span>
                </div>
              </div>

              {/* Windows Processes */}
              {windows.map((win) => (
                <div key={win.id} className="glass-panel p-2.5 rounded-lg flex items-center justify-between text-xs group hover:bg-white/10 transition">
                  <div className="flex items-center gap-2.5">
                    <Icon name={win.icon} size={15} className="text-brand-300" />
                    <span className="font-medium text-white">{win.title}</span>
                    <span className="text-[10px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded font-mono">PID: {win.id}</span>
                  </div>
                  <div className="flex items-center gap-8">
                    <span className="text-white/60 font-mono">{(65 + win.width * 0.08).toFixed(0)} MB</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => focusWindow(win.id)}
                        className="px-2 py-1 text-[11px] bg-white/10 hover:bg-white/20 text-white rounded transition"
                      >
                        Focus
                      </button>
                      <button
                        onClick={() => closeWindow(win.id)}
                        className="px-2 py-1 text-[11px] bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded transition"
                      >
                        Kill
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'specs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="glass-panel p-4 rounded-xl space-y-3">
              <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Host Architecture</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                  <div className="text-white/50 text-[11px]">Operating System</div>
                  <div className="font-medium text-white mt-0.5">LiquidOS v3.0.0 (Gargantua Beta)</div>
                </div>
                <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                  <div className="text-white/50 text-[11px]">3D Graphics Engine</div>
                  <div className="font-medium text-white mt-0.5">Three.js 0.185 + GLSL Raymarching</div>
                </div>
                <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                  <div className="text-white/50 text-[11px]">UI Composition Matrix</div>
                  <div className="font-medium text-white mt-0.5">Dynamic Liquid Glass Refraction SVG</div>
                </div>
                <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                  <div className="text-white/50 text-[11px]">Environment Sandbox</div>
                  <div className="font-medium text-white mt-0.5">100% Offline Local Browser Storage</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
