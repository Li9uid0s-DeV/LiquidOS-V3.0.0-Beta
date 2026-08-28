import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Icon } from '../Icon';

type GameMode = 'velocity' | 'maze' | 'slope';

export function GameApp() {
  const [mode, setMode] = useState<GameMode>('velocity');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('liquidos_velocity_high_score') || '0');
  });
  const [speedGauge, setSpeedGauge] = useState(120);
  const [gameOver, setGameOver] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>(0);

  // -------------------------------------------------------------
  // 1. Cosmic Velocity 3D Sci-Fi Racer Engine (Raw Three.js)
  // -------------------------------------------------------------
  const initVelocityRacer = (container: HTMLDivElement) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04020c);
    scene.fog = new THREE.FogExp2(0x04020c, 0.015);

    const camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 3.2, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // Dynamic Starfield Background
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 600;
      starPositions[i + 1] = (Math.random() - 0.5) * 600;
      starPositions[i + 2] = (Math.random() - 0.5) * 600;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x93c5fd, size: 1.5, transparent: true, opacity: 0.8 });
    const starField = new THREE.Points(starsGeo, starMat);
    scene.add(starField);

    // Ambient & Directional Lights
    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    dirLight.position.set(5, 12, 10);
    scene.add(dirLight);

    // Hovercraft Ship (Low-poly Sci-Fi Glider)
    const shipGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.ConeGeometry(0.8, 2.4, 4);
    const shipMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x0369a1,
      emissiveIntensity: 0.3,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, shipMat);
    bodyMesh.rotation.x = Math.PI / 2;
    bodyMesh.rotation.y = Math.PI / 4;
    shipGroup.add(bodyMesh);

    // Wings
    const wingGeo = new THREE.BoxGeometry(2.8, 0.08, 0.9);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });
    const wingMesh = new THREE.Mesh(wingGeo, wingMat);
    wingMesh.position.set(0, 0, 0.2);
    shipGroup.add(wingMesh);

    // Thruster Plasma Glow
    const thrusterGeo = new THREE.CylinderGeometry(0.18, 0.35, 0.5, 16);
    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
    const thrusterMesh = new THREE.Mesh(thrusterGeo, thrusterMat);
    thrusterMesh.rotation.x = Math.PI / 2;
    thrusterMesh.position.set(0, 0, 1.2);
    shipGroup.add(thrusterMesh);

    const thrusterLight = new THREE.PointLight(0x00f2ff, 4, 15);
    thrusterLight.position.set(0, 0, 1.5);
    shipGroup.add(thrusterLight);

    shipGroup.position.set(0, 0.8, 0);
    scene.add(shipGroup);

    // Modular Track System (Segment recycling pool)
    const trackWidth = 14;
    const trackSegments: THREE.Mesh[] = [];
    const segmentLength = 25;
    const totalSegments = 16;

    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x0b0e1b,
      metalness: 0.9,
      roughness: 0.3,
    });
    const trackEdgeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    for (let i = 0; i < totalSegments; i++) {
      const segGroup = new THREE.Group();
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(trackWidth, segmentLength), trackMat);
      floor.rotation.x = -Math.PI / 2;
      segGroup.add(floor);

      // Neon Guide Rails on left & right
      const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, segmentLength), trackEdgeMat);
      leftRail.position.set(-trackWidth / 2, 0.2, 0);
      segGroup.add(leftRail);

      const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, segmentLength), trackEdgeMat);
      rightRail.position.set(trackWidth / 2, 0.2, 0);
      segGroup.add(rightRail);

      segGroup.position.z = -i * segmentLength;
      scene.add(segGroup);
      trackSegments.push(segGroup as unknown as THREE.Mesh);
    }

    // Dynamic Obstacles and Boost Rings
    interface EntityItem {
      mesh: THREE.Mesh | THREE.Group;
      type: 'obstacle' | 'boost';
      box: THREE.Box3;
    }
    const entities: EntityItem[] = [];

    const obsGeo = new THREE.BoxGeometry(2.2, 1.8, 1.2);
    const obsMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });

    const boostGeo = new THREE.TorusGeometry(1.2, 0.15, 12, 24);
    const boostMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    const spawnEntity = (zPos: number) => {
      const lane = (Math.random() - 0.5) * (trackWidth - 4);
      const isBoost = Math.random() > 0.65;

      if (isBoost) {
        const boostMesh = new THREE.Mesh(boostGeo, boostMat);
        boostMesh.position.set(lane, 1.2, zPos);
        scene.add(boostMesh);
        entities.push({ mesh: boostMesh, type: 'boost', box: new THREE.Box3() });
      } else {
        const obsMesh = new THREE.Mesh(obsGeo, obsMat);
        obsMesh.position.set(lane, 0.9, zPos);
        scene.add(obsMesh);
        entities.push({ mesh: obsMesh, type: 'obstacle', box: new THREE.Box3() });
      }
    };

    // Initial entity spawns ahead
    for (let z = -30; z > -300; z -= 25) {
      spawnEntity(z);
    }

    // Input state
    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let shipX = 0;
    let shipSpeed = 1.2;
    let boostTime = 0;
    let currentScore = 0;

    const shipBox = new THREE.Box3();

    // Main Game Loop
    const animate = () => {
      gameLoopRef.current = requestAnimationFrame(animate);

      // Handle Left / Right Steering with roll banking
      const steerSpeed = 0.22;
      let targetRoll = 0;

      if (keys['ArrowLeft'] || keys['KeyA']) {
        shipX = Math.max(-trackWidth / 2 + 1.5, shipX - steerSpeed);
        targetRoll = 0.45;
      }
      if (keys['ArrowRight'] || keys['KeyD']) {
        shipX = Math.min(trackWidth / 2 - 1.5, shipX + steerSpeed);
        targetRoll = -0.45;
      }

      shipGroup.position.x = shipX;
      shipGroup.rotation.z += (targetRoll - shipGroup.rotation.z) * 0.15;
      shipGroup.rotation.y = -shipGroup.rotation.z * 0.4;
      shipGroup.position.y = 0.8 + Math.sin(Date.now() / 150) * 0.08;

      // Dynamic Speed & Boost Handling
      if (boostTime > 0) {
        boostTime--;
        shipSpeed = 2.4;
        thrusterMat.color.setHex(0x22c55e);
        thrusterLight.color.setHex(0x22c55e);
      } else {
        shipSpeed = Math.min(2.0, 1.2 + currentScore / 5000);
        thrusterMat.color.setHex(0x00f2ff);
        thrusterLight.color.setHex(0x00f2ff);
      }

      setSpeedGauge(Math.round(shipSpeed * 110));

      // Scroll Track Segments
      trackSegments.forEach((seg) => {
        seg.position.z += shipSpeed;
        if (seg.position.z > segmentLength * 2) {
          seg.position.z -= totalSegments * segmentLength;
        }
      });

      // Starfield parallax
      starField.position.z += shipSpeed * 0.2;
      if (starField.position.z > 200) starField.position.z = 0;

      // Update & check entities
      shipBox.setFromObject(shipGroup);

      for (let i = entities.length - 1; i >= 0; i--) {
        const ent = entities[i];
        ent.mesh.position.z += shipSpeed;
        if (ent.type === 'boost') {
          ent.mesh.rotation.z += 0.05;
        }

        ent.box.setFromObject(ent.mesh);

        // Check collision with ship
        if (shipBox.intersectsBox(ent.box)) {
          if (ent.type === 'boost') {
            boostTime = 90;
            currentScore += 250;
            scene.remove(ent.mesh);
            entities.splice(i, 1);
            continue;
          } else {
            // Hit obstacle -> Crash
            setGameOver(true);
            cancelAnimationFrame(gameLoopRef.current);
            return;
          }
        }

        // Despawn past camera and respawn ahead
        if (ent.mesh.position.z > 10) {
          scene.remove(ent.mesh);
          entities.splice(i, 1);
          spawnEntity(-totalSegments * segmentLength + 40);
        }
      }

      // Update Score
      currentScore += Math.round(shipSpeed * 2);
      setScore(currentScore);
      setHighScore((prev) => {
        const next = Math.max(prev, currentScore);
        localStorage.setItem('liquidos_velocity_high_score', String(next));
        return next;
      });

      // Dynamic Camera follow
      camera.position.x = shipX * 0.35;
      camera.lookAt(shipX * 0.5, 1.2, -15);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(gameLoopRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  };

  // -------------------------------------------------------------
  // 2. Cosmic Maze Game Engine (Puzzle Orb)
  // -------------------------------------------------------------
  const initMaze = (container: HTMLDivElement) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060212);
    scene.fog = new THREE.FogExp2(0x060212, 0.04);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 14, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xf97316, 2.5, 30);
    pointLight.position.set(0, 6, 0);
    scene.add(pointLight);

    const gridSize = 11;
    const cellSize = 1.4;
    const halfGrid = (gridSize * cellSize) / 2;

    const floorGeo = new THREE.PlaneGeometry(gridSize * cellSize + 2, gridSize * cellSize + 2);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f0b24, roughness: 0.4, metalness: 0.8 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.5;
    scene.add(floorMesh);

    const walls: THREE.Box3[] = [];
    const wallGeo = new THREE.BoxGeometry(cellSize, 1.2, cellSize);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, emissive: 0x312e81, roughness: 0.2, metalness: 0.9 });

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const isBorder = r === 0 || r === gridSize - 1 || c === 0 || c === gridSize - 1;
        const isInternalWall = (r % 2 === 0 && c % 2 === 0) || (r === 4 && c < 7) || (r === 6 && c > 3);
        const isStartOrEnd = (r === 1 && c === 1) || (r === gridSize - 2 && c === gridSize - 2);

        if ((isBorder || isInternalWall) && !isStartOrEnd) {
          const wall = new THREE.Mesh(wallGeo, wallMat);
          const wx = c * cellSize - halfGrid + cellSize / 2;
          const wz = r * cellSize - halfGrid + cellSize / 2;
          wall.position.set(wx, 0.1, wz);
          scene.add(wall);
          walls.push(new THREE.Box3().setFromObject(wall));
        }
      }
    }

    const playerGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.05, emissive: 0xf97316, emissiveIntensity: 0.4 });
    const player = new THREE.Mesh(playerGeo, playerMat);
    const startX = 1 * cellSize - halfGrid + cellSize / 2;
    const startZ = 1 * cellSize - halfGrid + cellSize / 2;
    player.position.set(startX, 0, startZ);
    scene.add(player);

    const targetGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32);
    const targetMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x15803d, emissiveIntensity: 0.8 });
    const target = new THREE.Mesh(targetGeo, targetMat);
    const endX = (gridSize - 2) * cellSize - halfGrid + cellSize / 2;
    const endZ = (gridSize - 2) * cellSize - halfGrid + cellSize / 2;
    target.position.set(endX, -0.4, endZ);
    scene.add(target);

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const playerBox = new THREE.Box3();
    const moveSpeed = 0.12;

    const animate = () => {
      gameLoopRef.current = requestAnimationFrame(animate);

      let dx = 0;
      let dz = 0;
      if (keys['ArrowUp'] || keys['KeyW']) dz -= moveSpeed;
      if (keys['ArrowDown'] || keys['KeyS']) dz += moveSpeed;
      if (keys['ArrowLeft'] || keys['KeyA']) dx -= moveSpeed;
      if (keys['ArrowRight'] || keys['KeyD']) dx += moveSpeed;

      const nextX = player.position.x + dx;
      const nextZ = player.position.z + dz;

      playerBox.setFromCenterAndSize(new THREE.Vector3(nextX, 0, player.position.z), new THREE.Vector3(0.7, 0.7, 0.7));
      let collideX = false;
      for (const w of walls) {
        if (playerBox.intersectsBox(w)) { collideX = true; break; }
      }
      if (!collideX) player.position.x = nextX;

      playerBox.setFromCenterAndSize(new THREE.Vector3(player.position.x, 0, nextZ), new THREE.Vector3(0.7, 0.7, 0.7));
      let collideZ = false;
      for (const w of walls) {
        if (playerBox.intersectsBox(w)) { collideZ = true; break; }
      }
      if (!collideZ) player.position.z = nextZ;

      target.rotation.y += 0.03;

      const distToEnd = player.position.distanceTo(target.position);
      if (distToEnd < 0.8) {
        setLevel((l) => l + 1);
        setScore((s) => s + 500);
        player.position.set(startX, 0, startZ);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(gameLoopRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  };

  // Mount active game engine
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let cleanup: (() => void) | undefined;

    setGameOver(false);
    setScore(0);

    if (mode === 'velocity') {
      cleanup = initVelocityRacer(container);
    } else if (mode === 'maze') {
      cleanup = initMaze(container);
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [mode, gameOver]);

  return (
    <div className="flex h-full w-full select-none flex-col bg-slate-950 text-white">
      {/* Game Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/60 px-4 py-2 text-xs backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('velocity')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              mode === 'velocity'
                ? 'bg-sky-500/30 text-sky-300 shadow-sm shadow-sky-500/20'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon name="Flame" size={14} /> Cosmic Velocity
          </button>
          <button
            onClick={() => setMode('maze')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              mode === 'maze'
                ? 'bg-sky-500/30 text-sky-300 shadow-sm shadow-sky-500/20'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon name="Compass" size={14} /> 3D Cosmic Maze
          </button>
        </div>

        {/* Telemetry Dashboard */}
        <div className="flex items-center gap-6 font-mono text-xs">
          {mode === 'velocity' && (
            <div className="flex items-center gap-2">
              <span className="text-white/50">SPEED:</span>
              <span className="font-bold text-sky-400">{speedGauge} KM/H</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-white/50">SCORE:</span>
            <span className="font-bold text-emerald-400">{score}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/50">RECORD:</span>
            <span className="font-bold text-amber-400">{highScore}</span>
          </div>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div className="relative flex-1 overflow-hidden" ref={containerRef}>
        {/* On-screen Controls Overlay */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-xl bg-black/40 p-2 text-xs text-white/70 backdrop-blur-md">
          <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px]">A / D / ← / →</span>
          <span>Steer Ship / Navigate</span>
        </div>

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 p-6 backdrop-blur-xl">
            <div className="text-4xl font-bold tracking-wider text-rose-500">HULL BREACHED!</div>
            <div className="mt-2 text-sm text-white/70">Final Cosmic Score: {score}</div>
            <button
              onClick={() => setGameOver(false)}
              className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-sky-500/30 transition-transform hover:scale-105"
            >
              <Icon name="RotateCcw" size={16} /> Relaunch Hovercraft
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
