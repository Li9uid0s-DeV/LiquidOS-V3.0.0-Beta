import { useRef, useEffect, useState } from 'react';
import { Icon } from '../Icon';

type Vec3 = { x: number; y: number; z: number };

interface Obstacle {
  pos: Vec3;
  lane: number;
}

const LANES = [-2, 0, 2];
const ROAD_WIDTH = 6;
const SPEED_START = 0.18;
const SPEED_MAX = 0.5;

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    const s = localStorage.getItem('liquid-os-best');
    return s ? parseInt(s, 10) : 0;
  });

  const stateRef = useRef({
    playerLane: 1,
    obstacles: [] as Obstacle[],
    speed: SPEED_START,
    distance: 0,
    score: 0,
    keys: { left: false, right: false },
    lastSpawn: 0,
    raf: 0,
    started: false,
    dead: false,
    cameraTilt: 0,
  });

  const reset = () => {
    const s = stateRef.current;
    s.playerLane = 1;
    s.obstacles = [];
    s.speed = SPEED_START;
    s.distance = 0;
    s.score = 0;
    s.lastSpawn = 0;
    s.dead = false;
    s.started = true;
    setScore(0);
    setGameOver(false);
    setRunning(true);
  };

  const stop = () => {
    cancelAnimationFrame(stateRef.current.raf);
    stateRef.current.started = false;
    setRunning(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const project = (world: Vec3, w: number, h: number) => {
      const camZ = world.z + 12;
      const scale = 200 / Math.max(camZ, 0.1);
      const sx = w / 2 + world.x * scale;
      const sy = h / 2 - world.y * scale + h * 0.15 - camZ * 4;
      return { x: sx, y: sy, scale };
    };

    const drawCube = (cx: number, cy: number, size: number, color: string, top: string) => {
      const s = size;
      ctx.fillStyle = color;
      ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
      // top face
      ctx.fillStyle = top;
      ctx.beginPath();
      ctx.moveTo(cx - s / 2, cy - s / 2);
      ctx.lineTo(cx - s / 2 + s * 0.2, cy - s / 2 - s * 0.2);
      ctx.lineTo(cx + s / 2 + s * 0.2, cy - s / 2 - s * 0.2);
      ctx.lineTo(cx + s / 2, cy - s / 2);
      ctx.closePath();
      ctx.fill();
      // right face
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.moveTo(cx + s / 2, cy - s / 2);
      ctx.lineTo(cx + s / 2 + s * 0.2, cy - s / 2 - s * 0.2);
      ctx.lineTo(cx + s / 2 + s * 0.2, cy + s / 2 - s * 0.2);
      ctx.lineTo(cx + s / 2, cy + s / 2);
      ctx.closePath();
      ctx.fill();
    };

    const draw = () => {
      const s = stateRef.current;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0a0a2e');
      grad.addColorStop(0.5, '#16213e');
      grad.addColorStop(1, '#1a1a3a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 137.5 + s.distance * 2) % w;
        const sy = (i * 73.3) % (h * 0.4);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Road
      const roadY = h * 0.62;
      ctx.fillStyle = 'rgba(20,20,50,0.6)';
      ctx.beginPath();
      ctx.moveTo(w / 2 - 20, roadY);
      ctx.lineTo(w / 2 + 20, roadY);
      ctx.lineTo(w / 2 + ROAD_WIDTH * 80, h);
      ctx.lineTo(w / 2 - ROAD_WIDTH * 80, h);
      ctx.closePath();
      ctx.fill();

      // Lane lines
      ctx.strokeStyle = 'rgba(120,140,255,0.3)';
      ctx.lineWidth = 1.5;
      for (const lx of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(w / 2 + lx * 1.5 * 20, roadY);
        ctx.lineTo(w / 2 + lx * ROAD_WIDTH * 80, h);
        ctx.stroke();
      }

      // Lane dashes
      for (let i = 0; i < 8; i++) {
        const z = (i * 2 - (s.distance % 2)) - 4;
        if (z < -4) continue;
        const p1 = project({ x: -0.5, y: 0, z }, w, h);
        const p2 = project({ x: 0.5, y: 0, z }, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = Math.max(1, p1.scale * 0.04);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Obstacles
      const sorted = [...s.obstacles].sort((a, b) => b.pos.z - a.pos.z);
      for (const ob of sorted) {
        const p = project(ob.pos, w, h);
        const size = Math.max(4, p.scale * 0.5);
        drawCube(p.x, p.y, size, '#e81123', '#ff5566');
      }

      // Player
      const px = LANES[s.playerLane];
      const pp = project({ x: px, y: 0, z: 0 }, w, h);
      const psize = Math.max(10, pp.scale * 0.55);
      drawCube(pp.x, pp.y, psize, '#4f46e5', '#818cf8');
      // glow
      ctx.shadowColor = 'rgba(99,102,241,0.6)';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(pp.x - psize / 4, pp.y - psize / 4, psize / 2, psize / 2);
      ctx.shadowBlur = 0;

      if (s.dead) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, w, h);
      }

      s.raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(stateRef.current.raf);
  }, []);

  // Game loop
  useEffect(() => {
    let mounted = true;
    const loop = () => {
      if (!mounted) return;
      const s = stateRef.current;
      if (s.started && !s.dead) {
        s.distance += s.speed;
        s.speed = Math.min(SPEED_MAX, s.speed + 0.0003);
        s.score = Math.floor(s.distance);
        setScore(s.score);

        // spawn
        if (s.distance - s.lastSpawn > 3 + Math.random() * 2) {
          s.lastSpawn = s.distance;
          const lane = Math.floor(Math.random() * 3);
          s.obstacles.push({ pos: { x: LANES[lane], y: 0, z: -30 }, lane });
        }

        // move obstacles
        s.obstacles.forEach((ob) => { ob.pos.z += s.speed * 8; });
        s.obstacles = s.obstacles.filter((ob) => ob.pos.z < 4);

        // collision
        for (const ob of s.obstacles) {
          if (ob.pos.z > -0.8 && ob.pos.z < 0.8 && ob.lane === s.playerLane) {
            s.dead = true;
            setGameOver(true);
            setRunning(false);
            if (s.score > best) {
              setBest(s.score);
              localStorage.setItem('liquid-os-best', String(s.score));
            }
            break;
          }
        }
      }
      requestAnimationFrame(loop);
    };
    const rafId = requestAnimationFrame(loop);
    return () => { mounted = false; cancelAnimationFrame(rafId); };
  }, [best]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        s.playerLane = Math.max(0, s.playerLane - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        s.playerLane = Math.min(2, s.playerLane + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative h-full w-full bg-zinc-950 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* HUD */}
      <div className="absolute top-3 left-3 flex gap-4 z-10 pointer-events-none">
        <div className="glass-panel rounded-lg px-3 py-1.5 text-xs text-white/90">
          Score: <span className="text-brand-300 font-bold tabular-nums">{score}</span>
        </div>
        <div className="glass-panel rounded-lg px-3 py-1.5 text-xs text-white/90">
          Best: <span className="text-amber-300 font-bold tabular-nums">{best}</span>
        </div>
      </div>

      {/* Touch controls */}
      {running && !gameOver && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3 z-10">
          <button
            onClick={() => { stateRef.current.playerLane = Math.max(0, stateRef.current.playerLane - 1); }}
            className="glass rounded-xl w-12 h-12 flex items-center justify-center text-white/80 hover:bg-white/15 transition"
          >
            <Icon name="ArrowLeft" size={22} />
          </button>
          <button
            onClick={() => { stateRef.current.playerLane = Math.min(2, stateRef.current.playerLane + 1); }}
            className="glass rounded-xl w-12 h-12 flex items-center justify-center text-white/80 hover:bg-white/15 transition"
          >
            <Icon name="ArrowRight" size={22} />
          </button>
        </div>
      )}

      {/* Start / Game Over overlay */}
      {(!running || gameOver) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              {gameOver ? 'Game Over' : 'Space Runner'}
            </h2>
            {gameOver && (
              <p className="text-sm text-white/70 mb-4">
                Score: <span className="text-brand-300 font-bold">{score}</span>
              </p>
            )}
            {!gameOver && (
              <p className="text-xs text-white/60 mb-4 max-w-xs">
                Steer your block left and right to dodge the red obstacles. Use arrow keys, A/D, or the on-screen buttons.
              </p>
            )}
            <button
              onClick={reset}
              className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold transition liquid-glow"
            >
              {gameOver ? 'Play Again' : 'Start Game'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
