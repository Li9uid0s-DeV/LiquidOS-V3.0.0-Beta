import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Icon } from '../Icon';

type GameMode = 'velocity' | 'maze';

export function GameApp() {
  const [mode, setMode] = useState<GameMode>('velocity');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('liquidos_velocity_high_score') || '0');
  });
  const [speedGauge, setSpeedGauge] = useState(120);
  const [gameOver, setGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Touch and Keyboard control states
  const controlsRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    boost: false,
  });

  // Sound Synthesizer via Web Audio API
  const playSound = useCallback((type: 'boost' | 'crash' | 'score' | 'hum') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'boost') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'crash') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'score') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch {
      // Audio might be blocked until user interacts
    }
  }, [soundEnabled]);

  // Touch handlers for on-screen virtual buttons
  const setControl = (key: 'left' | 'right' | 'up' | 'down' | 'boost', state: boolean) => {
    controlsRef.current[key] = state;
  };

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

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Futuristic Player Hovercraft
    const shipGroup = new THREE.Group();

    // Hull (Aerodynamic arrowhead cockpit)
    const hullGeo = new THREE.ConeGeometry(0.85, 2.4, 4);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x0369a1,
      emissiveIntensity: 0.3,
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.rotation.x = Math.PI / 2;
    hull.rotation.y = Math.PI / 4;
    shipGroup.add(hull);

    // Wings
    const wingGeo = new THREE.BoxGeometry(2.4, 0.08, 0.9);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, -0.05, 0.2);
    shipGroup.add(wings);

    // Twin Plasma Thrusters
    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
    const thrusterGeo = new THREE.CylinderGeometry(0.18, 0.1, 0.4, 16);

    const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    leftThruster.rotation.x = Math.PI / 2;
    leftThruster.position.set(-0.45, 0, 1.1);
    shipGroup.add(leftThruster);

    const rightThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    rightThruster.rotation.x = Math.PI / 2;
    rightThruster.position.set(0.45, 0, 1.1);
    shipGroup.add(rightThruster);

    // Thruster Light
    const thrusterLight = new THREE.PointLight(0x00f2ff, 3, 8);
    thrusterLight.position.set(0, 0, 1.5);
    shipGroup.add(thrusterLight);

    shipGroup.position.set(0, 0.8, 0);
    scene.add(shipGroup);

    // Endless Sci-Fi Neon Highway Track
    const trackWidth = 14;
    const segmentLength = 25;
    const trackSegments: THREE.Mesh[] = [];
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
    const boostMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x16a34a,
      emissiveIntensity: 1.2,
      roughness: 0.1,
    });

    const lanes = [-4.5, -1.8, 1.8, 4.5];

    const spawnEntity = (zPos: number) => {
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
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

    // Keyboard state
    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Canvas Touch Drag Steering
    let touchStartX = 0;
    let isCanvasDragging = false;

    const handlePointerDown = (e: PointerEvent) => {
      touchStartX = e.clientX;
      isCanvasDragging = true;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isCanvasDragging) return;
      const dx = e.clientX - touchStartX;
      if (dx < -12) {
        controlsRef.current.left = true;
        controlsRef.current.right = false;
      } else if (dx > 12) {
        controlsRef.current.right = true;
        controlsRef.current.left = false;
      } else {
        controlsRef.current.left = false;
        controlsRef.current.right = false;
      }
    };

    const handlePointerUp = () => {
      isCanvasDragging = false;
      controlsRef.current.left = false;
      controlsRef.current.right = false;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    let shipX = 0;
    let shipSpeed = 1.2;
    let boostTime = 0;
    let currentScore = 0;

    const shipBox = new THREE.Box3();

    // Main Game Loop
    const animate = () => {
      gameLoopRef.current = requestAnimationFrame(animate);

      // Handle Left / Right Steering (Keyboard + Touch inputs)
      const steerSpeed = 0.24;
      let targetRoll = 0;

      const goLeft = keys['ArrowLeft'] || keys['KeyA'] || controlsRef.current.left;
      const goRight = keys['ArrowRight'] || keys['KeyD'] || controlsRef.current.right;
      const triggerBoost = keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || controlsRef.current.boost;

      if (goLeft) {
        shipX = Math.max(-trackWidth / 2 + 1.5, shipX - steerSpeed);
        targetRoll = 0.45;
      }
      if (goRight) {
        shipX = Math.min(trackWidth / 2 - 1.5, shipX + steerSpeed);
        targetRoll = -0.45;
      }
      if (triggerBoost && boostTime <= 0) {
        boostTime = 30;
        playSound('boost');
      }

      shipGroup.position.x = shipX;
      shipGroup.rotation.z += (targetRoll - shipGroup.rotation.z) * 0.15;
      shipGroup.rotation.y = -shipGroup.rotation.z * 0.4;
      shipGroup.position.y = 0.8 + Math.sin(Date.now() / 150) * 0.08;

      // Dynamic Speed & Boost Handling
      if (boostTime > 0) {
        boostTime--;
        shipSpeed = 2.5;
        thrusterMat.color.setHex(0x22c55e);
        thrusterLight.color.setHex(0x22c55e);
      } else {
        shipSpeed = Math.min(2.1, 1.2 + currentScore / 5000);
        thrusterMat.color.setHex(0x00f2ff);
        thrusterLight.color.setHex(0x00f2ff);
      }

      setSpeedGauge(Math.round(shipSpeed * 115));

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
            playSound('boost');
            scene.remove(ent.mesh);
            entities.splice(i, 1);
            continue;
          } else {
            // Hit obstacle -> Crash
            playSound('crash');
            setGameOver(true);
            cancelAnimationFrame(gameLoopRef.current);
            return;
          }
        }

        // Despawn past camera and respawn ahead
        if (ent.mesh.position.z > 12) {
          scene.remove(ent.mesh);
          entities.splice(i, 1);
          spawnEntity(-280 - Math.random() * 40);
        }
      }

      // Increment Score
      currentScore += 1;
      setScore(currentScore);
      if (currentScore > highScore) {
        setHighScore(currentScore);
        localStorage.setItem('liquidos_velocity_high_score', currentScore.toString());
      }

      renderer.render(scene, camera);
    };

    animate();

    // Window resize handler
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(gameLoopRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', onResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  };

  // -------------------------------------------------------------
  // 2. Cosmic Maze 3D Engine
  // -------------------------------------------------------------
  const initMaze = (container: HTMLDivElement) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 18, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(5, 12, 8);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x38bdf8, 0.5));

    // Maze Grid
    const gridSize = 11;
    const cellSize = 1.8;
    const halfGrid = (gridSize * cellSize) / 2;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(gridSize * cellSize, gridSize * cellSize),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    scene.add(floor);

    const wallGeo = new THREE.BoxGeometry(cellSize, 1.2, cellSize);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 });
    const walls: THREE.Box3[] = [];

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const isBorder = r === 0 || r === gridSize - 1 || c === 0 || c === gridSize - 1;
        const isInternalWall = (r % 2 === 0 && c % 2 === 0) && Math.random() > 0.25;
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
      if (keys['ArrowUp'] || keys['KeyW'] || controlsRef.current.up) dz -= moveSpeed;
      if (keys['ArrowDown'] || keys['KeyS'] || controlsRef.current.down) dz += moveSpeed;
      if (keys['ArrowLeft'] || keys['KeyA'] || controlsRef.current.left) dx -= moveSpeed;
      if (keys['ArrowRight'] || keys['KeyD'] || controlsRef.current.right) dx += moveSpeed;

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
        playSound('score');
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
    <div className="flex h-full w-full select-none flex-col bg-slate-950 text-white relative touch-none">
      {/* Game Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-4 py-2 text-xs backdrop-blur-md shrink-0 z-20">
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
        <div className="flex items-center gap-4 sm:gap-6 font-mono text-xs">
          {mode === 'velocity' && (
            <div className="flex items-center gap-1.5">
              <span className="text-white/50">SPEED:</span>
              <span className="font-bold text-sky-400">{speedGauge} KM/H</span>
            </div>
          )}
          {mode === 'maze' && (
            <div className="flex items-center gap-1.5">
              <span className="text-white/50">LVL:</span>
              <span className="font-bold text-amber-400">{level}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-white/50">SCORE:</span>
            <span className="font-bold text-emerald-400">{score}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-white/50">BEST:</span>
            <span className="font-bold text-amber-400">{highScore}</span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 rounded text-white/60 hover:text-white"
            title="Toggle Sound FX"
          >
            <Icon name={soundEnabled ? 'Volume2' : 'VolumeX'} size={14} />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div className="relative flex-1 overflow-hidden min-h-0 min-w-0" ref={containerRef}>
        {/* On-screen Controls Overlay & Instructions */}
        <div className="pointer-events-none absolute top-3 left-3 z-10 hidden sm:flex items-center gap-2 rounded-xl bg-black/50 p-2 text-xs text-white/80 backdrop-blur-md border border-white/10">
          <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px]">A / D / ← / → or Touch Buttons</span>
          <span>Steer & Boost</span>
        </div>

        {/* VIRTUAL TOUCH CONTROLS (Always active for touchscreens & mobile) */}
        <div className="absolute inset-x-4 bottom-4 z-20 flex items-end justify-between pointer-events-none">
          {/* Left / Right Steering Touch Pad */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onPointerDown={(e) => { e.preventDefault(); setControl('left', true); }}
              onPointerUp={() => setControl('left', false)}
              onPointerCancel={() => setControl('left', false)}
              className="w-14 h-14 rounded-2xl bg-black/60 active:bg-cyan-500/40 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white shadow-2xl active:scale-95 transition"
              title="Steer Left"
            >
              <Icon name="ChevronLeft" size={26} className="text-cyan-400" />
            </button>
            <button
              onPointerDown={(e) => { e.preventDefault(); setControl('right', true); }}
              onPointerUp={() => setControl('right', false)}
              onPointerCancel={() => setControl('right', false)}
              className="w-14 h-14 rounded-2xl bg-black/60 active:bg-cyan-500/40 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white shadow-2xl active:scale-95 transition"
              title="Steer Right"
            >
              <Icon name="ChevronRight" size={26} className="text-cyan-400" />
            </button>
          </div>

          {/* Maze D-Pad Up/Down if in Maze Mode */}
          {mode === 'maze' && (
            <div className="flex flex-col gap-2 pointer-events-auto">
              <button
                onPointerDown={(e) => { e.preventDefault(); setControl('up', true); }}
                onPointerUp={() => setControl('up', false)}
                onPointerCancel={() => setControl('up', false)}
                className="w-12 h-12 rounded-xl bg-black/60 active:bg-amber-500/40 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white shadow-xl active:scale-95 transition"
                title="Up"
              >
                <Icon name="ChevronUp" size={22} className="text-amber-400" />
              </button>
              <button
                onPointerDown={(e) => { e.preventDefault(); setControl('down', true); }}
                onPointerUp={() => setControl('down', false)}
                onPointerCancel={() => setControl('down', false)}
                className="w-12 h-12 rounded-xl bg-black/60 active:bg-amber-500/40 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white shadow-xl active:scale-95 transition"
                title="Down"
              >
                <Icon name="ChevronDown" size={22} className="text-amber-400" />
              </button>
            </div>
          )}

          {/* Velocity Nitro Boost Touch Button */}
          {mode === 'velocity' && (
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onPointerDown={(e) => { e.preventDefault(); setControl('boost', true); }}
                onPointerUp={() => setControl('boost', false)}
                onPointerCancel={() => setControl('boost', false)}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 text-black font-extrabold flex flex-col items-center justify-center shadow-2xl shadow-cyan-500/40 active:scale-90 transition border-2 border-white/40"
                title="Nitro Boost"
              >
                <Icon name="Zap" size={22} />
                <span className="text-[9px] font-mono tracking-tighter">NITRO</span>
              </button>
            </div>
          )}
        </div>

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/85 p-6 backdrop-blur-2xl">
            <div className="text-4xl sm:text-5xl font-black tracking-wider text-rose-500 animate-pulse drop-shadow-[0_4px_16px_rgba(244,63,94,0.6)]">
              HULL BREACHED!
            </div>
            <div className="mt-3 text-base text-white/90">Final Cosmic Score: <span className="font-mono text-cyan-300 font-bold">{score}</span></div>
            <div className="text-xs text-white/50 font-mono mt-1">High Score: {highScore}</div>
            <button
              onClick={() => setGameOver(false)}
              className="mt-6 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-8 py-3.5 font-bold text-white shadow-2xl shadow-sky-500/40 transition-transform hover:scale-105 active:scale-95"
            >
              <Icon name="RotateCcw" size={18} /> Relaunch Hovercraft
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
