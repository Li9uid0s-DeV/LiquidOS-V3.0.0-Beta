import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Icon } from '../Icon';

type GameMode = 'maze' | 'slope';

export function GameApp() {
  const [mode, setMode] = useState<GameMode>('maze');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('liquid-os-game-highscore') || '0');
  });
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>(0);

  // -------------------------------------------------------------
  // 3D Cosmic Maze Game Engine (Three.js)
  // -------------------------------------------------------------
  const initMaze = (container: HTMLDivElement) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060212);
    scene.fog = new THREE.FogExp2(0x060212, 0.05);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 14, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xf97316, 2.5, 30);
    pointLight.position.set(0, 6, 0);
    scene.add(pointLight);

    // Maze Grid (11 x 11)
    const gridSize = 11;
    const cellSize = 1.4;
    const halfGrid = (gridSize * cellSize) / 2;

    // Maze Floor
    const floorGeo = new THREE.PlaneGeometry(gridSize * cellSize + 2, gridSize * cellSize + 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f0b24,
      roughness: 0.4,
      metalness: 0.8,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.5;
    scene.add(floorMesh);

    // Generate Simple Procedural Maze Walls
    const walls: THREE.Box3[] = [];
    const wallGeo = new THREE.BoxGeometry(cellSize, 1.2, cellSize);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x312e81,
      roughness: 0.2,
      metalness: 0.9,
    });

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        // Outer borders or maze internal blocks
        const isBorder = r === 0 || r === gridSize - 1 || c === 0 || c === gridSize - 1;
        const isInternalWall = (r % 2 === 0 && c % 2 === 0) || (r === 4 && c < 7) || (r === 6 && c > 3);
        const isStartOrEnd = (r === 1 && c === 1) || (r === gridSize - 2 && c === gridSize - 2);

        if ((isBorder || isInternalWall) && !isStartOrEnd) {
          const wall = new THREE.Mesh(wallGeo, wallMat);
          const wx = c * cellSize - halfGrid + cellSize / 2;
          const wz = r * cellSize - halfGrid + cellSize / 2;
          wall.position.set(wx, 0.1, wz);
          scene.add(wall);

          const box = new THREE.Box3().setFromObject(wall);
          walls.push(box);
        }
      }
    }

    // Chrome Metallic Player Sphere
    const playerGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const playerMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.95,
      roughness: 0.05,
      emissive: 0xf97316,
      emissiveIntensity: 0.3,
    });
    const player = new THREE.Mesh(playerGeo, playerMat);
    const startX = 1 * cellSize - halfGrid + cellSize / 2;
    const startZ = 1 * cellSize - halfGrid + cellSize / 2;
    player.position.set(startX, 0, startZ);
    scene.add(player);

    // Exit Goal Portal (Glowing Star)
    const goalGeo = new THREE.OctahedronGeometry(0.45);
    const goalMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, wireframe: false });
    const goal = new THREE.Mesh(goalGeo, goalMat);
    const endX = (gridSize - 2) * cellSize - halfGrid + cellSize / 2;
    const endZ = (gridSize - 2) * cellSize - halfGrid + cellSize / 2;
    goal.position.set(endX, 0.2, endZ);
    scene.add(goal);

    // Goal Glow Light
    const goalLight = new THREE.PointLight(0x00ffcc, 2.0, 8);
    goalLight.position.copy(goal.position);
    scene.add(goalLight);

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let currentScore = 0;

    const animate = () => {
      gameLoopRef.current = requestAnimationFrame(animate);

      // Player Movement Physics & Wall Collision
      const speed = 0.09;
      let dx = 0;
      let dz = 0;

      if (keys['ArrowUp'] || keys['w'] || keys['W']) dz -= speed;
      if (keys['ArrowDown'] || keys['s'] || keys['S']) dz += speed;
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= speed;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += speed;

      const oldX = player.position.x;
      const oldZ = player.position.z;

      player.position.x += dx;
      const playerBoxX = new THREE.Box3().setFromCenterAndSize(player.position, new THREE.Vector3(0.65, 0.65, 0.65));
      for (const wall of walls) {
        if (playerBoxX.intersectsBox(wall)) {
          player.position.x = oldX;
          break;
        }
      }

      player.position.z += dz;
      const playerBoxZ = new THREE.Box3().setFromCenterAndSize(player.position, new THREE.Vector3(0.65, 0.65, 0.65));
      for (const wall of walls) {
        if (playerBoxZ.intersectsBox(wall)) {
          player.position.z = oldZ;
          break;
        }
      }

      // Rotate goal
      goal.rotation.x += 0.03;
      goal.rotation.y += 0.04;

      // Check Goal Reached
      const distToGoal = player.position.distanceTo(goal.position);
      if (distToGoal < 0.6) {
        currentScore += 100;
        setScore(currentScore);
        setLevel((l) => l + 1);
        player.position.set(startX, 0, startZ);

        if (currentScore > highScore) {
          setHighScore(currentScore);
          localStorage.setItem('liquid-os-game-highscore', String(currentScore));
        }
      }

      // Smooth camera follow
      camera.position.x += (player.position.x - camera.position.x) * 0.05;
      camera.position.z += (player.position.z + 8 - camera.position.z) * 0.05;
      camera.lookAt(player.position.x, 0, player.position.z);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(gameLoopRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  };

  // -------------------------------------------------------------
  // 3D Neon Slope Runner Game Engine (Three.js)
  // -------------------------------------------------------------
  const initSlope = (container: HTMLDivElement) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04010a);
    scene.fog = new THREE.FogExp2(0x04010a, 0.025);

    const camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 3.5, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // Glowing Neon Ball Player
    const playerGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const playerMat = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00ffcc,
      emissiveIntensity: 0.6,
      roughness: 0.1,
    });
    const player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(0, 0.5, 0);
    scene.add(player);

    const playerLight = new THREE.PointLight(0x00ffcc, 3, 15);
    playerLight.position.set(0, 1.5, 0);
    scene.add(playerLight);

    // Road Track Platform Tiles
    const trackWidth = 8;
    const trackTileLen = 20;
    const trackTiles: THREE.Mesh[] = [];
    const trackGeo = new THREE.PlaneGeometry(trackWidth, trackTileLen);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x120826,
      roughness: 0.3,
      metalness: 0.8,
    });

    for (let i = 0; i < 6; i++) {
      const tile = new THREE.Mesh(trackGeo, trackMat);
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(0, 0, -i * trackTileLen);
      scene.add(tile);
      trackTiles.push(tile);
    }

    // Red Hazard Obstacles
    const obstacles: THREE.Mesh[] = [];
    const obsGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const obsMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xff0055,
      emissiveIntensity: 0.8,
    });

    const spawnObstacle = (z: number) => {
      const obs = new THREE.Mesh(obsGeo, obsMat);
      const laneX = (Math.random() - 0.5) * (trackWidth - 2.5);
      obs.position.set(laneX, 0.6, z);
      scene.add(obs);
      obstacles.push(obs);
    };

    for (let z = -30; z > -120; z -= 14) {
      spawnObstacle(z);
    }

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let speed = 0.35;
    let currentScore = 0;
    let isDead = false;

    const animate = () => {
      if (isDead) return;
      gameLoopRef.current = requestAnimationFrame(animate);

      // Player Steer
      if ((keys['ArrowLeft'] || keys['a'] || keys['A']) && player.position.x > -trackWidth / 2 + 0.8) {
        player.position.x -= 0.16;
      }
      if ((keys['ArrowRight'] || keys['d'] || keys['D']) && player.position.x < trackWidth / 2 - 0.8) {
        player.position.x += 0.16;
      }

      // Move Track Forward
      trackTiles.forEach((tile) => {
        tile.position.z += speed;
        if (tile.position.z > trackTileLen) {
          tile.position.z -= trackTiles.length * trackTileLen;
        }
      });

      // Move Obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.position.z += speed;

        // Collision Check with Player
        const dist = player.position.distanceTo(obs.position);
        if (dist < 1.0) {
          isDead = true;
          setGameOver(true);
          return;
        }

        // Recycle Obstacles
        if (obs.position.z > 10) {
          obs.position.z = -110 - Math.random() * 15;
          obs.position.x = (Math.random() - 0.5) * (trackWidth - 2.5);
        }
      }

      // Score accumulation
      currentScore += 1;
      setScore(currentScore);
      if (currentScore > highScore) {
        setHighScore(currentScore);
        localStorage.setItem('liquid-os-game-highscore', String(currentScore));
      }

      // Gradual acceleration
      speed = Math.min(0.85, speed + 0.0001);

      playerLight.position.x = player.position.x;
      camera.position.x += (player.position.x * 0.4 - camera.position.x) * 0.1;
      camera.lookAt(player.position.x * 0.2, 1.0, -10);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(gameLoopRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setScore(0);
    setGameOver(false);

    if (mode === 'maze') {
      return initMaze(container);
    } else {
      return initSlope(container);
    }
  }, [mode]);

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950 text-white select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 bg-black/40">
        <div className="flex items-center gap-3">
          <Icon name="Gamepad2" size={20} className="text-orange-400" />
          <div>
            <h2 className="text-xs font-bold tracking-wide">3D Games Matrix</h2>
            <span className="text-[10px] text-white/40 font-mono">Powered by Three.js</span>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-1 bg-black/60 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setMode('maze')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition ${
              mode === 'maze' ? 'bg-orange-500 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            3D Cosmic Maze
          </button>
          <button
            onClick={() => setMode('slope')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition ${
              mode === 'slope' ? 'bg-orange-500 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Neon Slope Runner
          </button>
        </div>

        {/* Scores */}
        <div className="flex items-center gap-4 text-xs font-mono">
          {mode === 'maze' && (
            <div>
              <span className="text-white/40 mr-1.5">Sector:</span>
              <span className="text-cyan-400 font-bold">{level}</span>
            </div>
          )}
          <div>
            <span className="text-white/40 mr-1.5">Score:</span>
            <span className="text-orange-400 font-bold">{score}</span>
          </div>
          <div>
            <span className="text-white/40 mr-1.5">Best:</span>
            <span className="text-emerald-400 font-bold">{highScore}</span>
          </div>
        </div>
      </div>

      {/* 3D Game Canvas Viewport */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />

        {/* Controls Overlay Hint */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] text-white/70 flex items-center gap-2">
          <Icon name="Keyboard" size={14} />
          <span>Steer with WASD or Arrow Keys</span>
        </div>

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Simulation Terminated</h2>
            <p className="text-xs text-white/60 mb-4 font-mono">Final Distance Score: {score}</p>
            <button
              onClick={() => {
                setGameOver(false);
                setMode((m) => (m === 'maze' ? 'maze' : 'slope'));
              }}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition shadow-lg shadow-orange-500/30"
            >
              Restart Simulation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
