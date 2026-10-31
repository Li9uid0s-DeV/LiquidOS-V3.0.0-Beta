import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Icon } from '../Icon';

export type GameMode = 'velocity' | 'maze' | '2048' | 'snake' | 'breaker';

interface GameAppProps {
  payload?: { gameId?: string };
}

function mapPayloadToMode(gameId?: string): GameMode {
  if (!gameId) return 'velocity';
  if (gameId.includes('2048')) return '2048';
  if (gameId.includes('snake')) return 'snake';
  if (gameId.includes('maze')) return 'maze';
  if (gameId.includes('breaker') || gameId.includes('brick')) return 'breaker';
  return 'velocity';
}

export function GameApp({ payload }: GameAppProps) {
  const [mode, setMode] = useState<GameMode>(() => mapPayloadToMode(payload?.gameId));
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('liquidos_velocity_high_score') || '0');
  });
  const [speedGauge, setSpeedGauge] = useState(120);
  const [gameOver, setGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 2048 state
  const [grid2048, setGrid2048] = useState<number[][]>(() => createInitial2048Grid());

  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (payload?.gameId) {
      setMode(mapPayloadToMode(payload.gameId));
    }
  }, [payload?.gameId]);

  const controlsRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    boost: false,
  });

  const playSound = useCallback(
    (type: 'boost' | 'crash' | 'score' | 'hum') => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
        } else if (type === 'crash') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(40, now + 0.45);
          gain.gain.setValueAtTime(0.24, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.45);
          osc.start(now);
          osc.stop(now + 0.45);
        } else if (type === 'score') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.07);
          osc.frequency.setValueAtTime(783.99, now + 0.14);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.24);
          osc.start(now);
          osc.stop(now + 0.24);
        }
      } catch {
        // Ignore audio context autoplay block
      }
    },
    [soundEnabled]
  );

  const setControl = (key: 'left' | 'right' | 'up' | 'down' | 'boost', state: boolean) => {
    controlsRef.current[key] = state;
  };

  // =============================================================
  // 1. Velocity 3D Sci-Fi Hovercraft Racer (Three.js)
  // =============================================================
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

    const starsGeo = new THREE.BufferGeometry();
    const starCount = 1000;
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const shipGroup = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.ConeGeometry(0.85, 2.4, 4),
      new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        metalness: 0.9,
        roughness: 0.15,
        emissive: 0x0369a1,
        emissiveIntensity: 0.3,
      })
    );
    hull.rotation.x = Math.PI / 2;
    hull.rotation.y = Math.PI / 4;
    shipGroup.add(hull);

    const wings = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.08, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
    );
    wings.position.set(0, -0.05, 0.2);
    shipGroup.add(wings);

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

    const thrusterLight = new THREE.PointLight(0x00f2ff, 3, 8);
    thrusterLight.position.set(0, 0, 1.5);
    shipGroup.add(thrusterLight);
    shipGroup.position.set(0, 0.8, 0);
    scene.add(shipGroup);

    const trackWidth = 14;
    const segmentLength = 25;
    const trackSegments: THREE.Group[] = [];
    const totalSegments = 16;

    const trackMat = new THREE.MeshStandardMaterial({ color: 0x0b0e1b, metalness: 0.9, roughness: 0.3 });
    const trackEdgeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    for (let i = 0; i < totalSegments; i++) {
      const segGroup = new THREE.Group();
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(trackWidth, segmentLength), trackMat);
      floor.rotation.x = -Math.PI / 2;
      segGroup.add(floor);

      const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, segmentLength), trackEdgeMat);
      leftRail.position.set(-trackWidth / 2, 0.2, 0);
      segGroup.add(leftRail);

      const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, segmentLength), trackEdgeMat);
      rightRail.position.set(trackWidth / 2, 0.2, 0);
      segGroup.add(rightRail);

      segGroup.position.z = -i * segmentLength;
      scene.add(segGroup);
      trackSegments.push(segGroup);
    }

    interface EntityItem {
      mesh: THREE.Mesh;
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

    for (let z = -30; z > -300; z -= 25) {
      spawnEntity(z);
    }

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let shipX = 0;
    let shipSpeed = 1.2;
    let boostTime = 0;
    let currentScore = 0;
    const shipBox = new THREE.Box3();

    const animate = () => {
      gameLoopRef.current = requestAnimationFrame(animate);
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

      trackSegments.forEach((seg) => {
        seg.position.z += shipSpeed;
        if (seg.position.z > segmentLength * 2) {
          seg.position.z -= totalSegments * segmentLength;
        }
      });

      starField.position.z += shipSpeed * 0.2;
      if (starField.position.z > 200) starField.position.z = 0;

      shipBox.setFromObject(shipGroup);

      for (let i = entities.length - 1; i >= 0; i--) {
        const ent = entities[i];
        ent.mesh.position.z += shipSpeed;
        if (ent.type === 'boost') {
          ent.mesh.rotation.z += 0.05;
        }
        ent.box.setFromObject(ent.mesh);

        if (shipBox.intersectsBox(ent.box)) {
          if (ent.type === 'boost') {
            boostTime = 90;
            currentScore += 250;
            playSound('boost');
            scene.remove(ent.mesh);
            entities.splice(i, 1);
            continue;
          } else {
            playSound('crash');
            setGameOver(true);
            cancelAnimationFrame(gameLoopRef.current);
            return;
          }
        }

        if (ent.mesh.position.z > 12) {
          scene.remove(ent.mesh);
          entities.splice(i, 1);
          spawnEntity(-280 - Math.random() * 40);
        }
      }

      currentScore += 1;
      setScore(currentScore);
      if (currentScore > highScore) {
        setHighScore(currentScore);
        localStorage.setItem('liquidos_velocity_high_score', currentScore.toString());
      }

      renderer.render(scene, camera);
    };

    animate();

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
      window.removeEventListener('resize', onResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  };

  // =============================================================
  // 2. 3D Maze Engine (Three.js)
  // =============================================================
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
        const isInternalWall = r % 2 === 0 && c % 2 === 0 && Math.random() > 0.25;
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

    const player = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.95,
        roughness: 0.05,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.4,
      })
    );
    const startX = 1 * cellSize - halfGrid + cellSize / 2;
    const startZ = 1 * cellSize - halfGrid + cellSize / 2;
    player.position.set(startX, 0, startZ);
    scene.add(player);

    const target = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x15803d, emissiveIntensity: 0.8 })
    );
    const endX = (gridSize - 2) * cellSize - halfGrid + cellSize / 2;
    const endZ = (gridSize - 2) * cellSize - halfGrid + cellSize / 2;
    target.position.set(endX, -0.4, endZ);
    scene.add(target);

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
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

      playerBox.setFromCenterAndSize(
        new THREE.Vector3(nextX, 0, player.position.z),
        new THREE.Vector3(0.7, 0.7, 0.7)
      );
      let collideX = false;
      for (const w of walls) {
        if (playerBox.intersectsBox(w)) {
          collideX = true;
          break;
        }
      }
      if (!collideX) player.position.x = nextX;

      playerBox.setFromCenterAndSize(
        new THREE.Vector3(player.position.x, 0, nextZ),
        new THREE.Vector3(0.7, 0.7, 0.7)
      );
      let collideZ = false;
      for (const w of walls) {
        if (playerBox.intersectsBox(w)) {
          collideZ = true;
          break;
        }
      }
      if (!collideZ) player.position.z = nextZ;

      target.rotation.y += 0.03;

      if (player.position.distanceTo(target.position) < 0.8) {
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

  // =============================================================
  // 3. Neon Snake (2D Canvas Cyber Glass Snake)
  // =============================================================
  const initSnake = (container: HTMLDivElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;

    const cols = 22;
    const rows = 16;
    const snake = [
      { x: 10, y: 8 },
      { x: 9, y: 8 },
      { x: 8, y: 8 },
    ];
    let dir = { x: 1, y: 0 };
    let nextDir = { x: 1, y: 0 };
    let food = { x: 15, y: 8 };
    let currentScore = 0;
    let lastTick = performance.now();

    const spawnFood = () => {
      food = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowUp' || e.key === 'w') && dir.y === 0) nextDir = { x: 0, y: -1 };
      if ((e.key === 'ArrowDown' || e.key === 's') && dir.y === 0) nextDir = { x: 0, y: 1 };
      if ((e.key === 'ArrowLeft' || e.key === 'a') && dir.x === 0) nextDir = { x: -1, y: 0 };
      if ((e.key === 'ArrowRight' || e.key === 'd') && dir.x === 0) nextDir = { x: 1, y: 0 };
    };
    window.addEventListener('keydown', handleKeyDown);

    const loop = (now: number) => {
      gameLoopRef.current = requestAnimationFrame(loop);

      if (controlsRef.current.up && dir.y === 0) nextDir = { x: 0, y: -1 };
      if (controlsRef.current.down && dir.y === 0) nextDir = { x: 0, y: 1 };
      if (controlsRef.current.left && dir.x === 0) nextDir = { x: -1, y: 0 };
      if (controlsRef.current.right && dir.x === 0) nextDir = { x: 1, y: 0 };

      if (now - lastTick > 115) {
        lastTick = now;
        dir = nextDir;
        const head = {
          x: (snake[0].x + dir.x + cols) % cols,
          y: (snake[0].y + dir.y + rows) % rows,
        };

        if (snake.some((s) => s.x === head.x && s.y === head.y)) {
          playSound('crash');
          setGameOver(true);
          cancelAnimationFrame(gameLoopRef.current);
          return;
        }

        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
          currentScore += 100;
          setScore(currentScore);
          playSound('score');
          spawnFood();
        } else {
          snake.pop();
        }
      }

      const w = canvas.width;
      const h = canvas.height;
      const cellSize = Math.min(Math.floor((w - 40) / cols), Math.floor((h - 40) / rows));
      const offsetX = Math.floor((w - cols * cellSize) / 2);
      const offsetY = Math.floor((h - rows * cellSize) / 2);

      ctx.fillStyle = '#040711';
      ctx.fillRect(0, 0, w, h);

      // Subtle Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + r * cellSize);
        ctx.lineTo(offsetX + cols * cellSize, offsetY + r * cellSize);
        ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + c * cellSize, offsetY);
        ctx.lineTo(offsetX + c * cellSize, offsetY + rows * cellSize);
        ctx.stroke();
      }

      // Food Orb
      const fx = offsetX + food.x * cellSize + cellSize / 2;
      const fy = offsetY + food.y * cellSize + cellSize / 2;
      const fg = ctx.createRadialGradient(fx, fy, 2, fx, fy, cellSize * 0.7);
      fg.addColorStop(0, '#ffffff');
      fg.addColorStop(0.4, '#34d399');
      fg.addColorStop(1, 'rgba(16,185,129,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(fx, fy, cellSize * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Snake 3D Glass Segments
      snake.forEach((seg, idx) => {
        const sx = offsetX + seg.x * cellSize + 2;
        const sy = offsetY + seg.y * cellSize + 2;
        const sw = cellSize - 4;
        ctx.fillStyle = idx === 0 ? '#38bdf8' : `rgba(56, 189, 248, ${Math.max(0.28, 0.85 - idx * 0.03)})`;
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, sw, 6);
        ctx.fill();
      });
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(gameLoopRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  };

  // =============================================================
  // 4. Glass Breaker (3D Glass Arkanoid / Brick Breaker)
  // =============================================================
  const initBreaker = (container: HTMLDivElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;

    let w = canvas.width;
    let h = canvas.height;
    let paddleW = Math.min(130, w * 0.24);
    const paddleH = 14;
    let paddleX = (w - paddleW) / 2;

    const ball = { x: w / 2, y: h - 60, vx: 4.2, vy: -4.4, r: 8 };
    const brickRows = 5;
    const brickCols = 8;
    const colors = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#34d399'];

    interface Brick {
      r: number;
      c: number;
      alive: boolean;
      color: string;
    }
    const bricks: Brick[] = [];
    for (let r = 0; r < brickRows; r++) {
      for (let c = 0; c < brickCols; c++) {
        bricks.push({ r, c, alive: true, color: colors[r % colors.length] });
      }
    }

    let currentScore = 0;
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      paddleX = Math.max(12, Math.min(w - paddleW - 12, e.clientX - rect.left - paddleW / 2));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointermove', onPointerMove);

    const loop = () => {
      gameLoopRef.current = requestAnimationFrame(loop);

      if (keys['ArrowLeft'] || keys['KeyA'] || controlsRef.current.left) {
        paddleX = Math.max(12, paddleX - 7);
      }
      if (keys['ArrowRight'] || keys['KeyD'] || controlsRef.current.right) {
        paddleX = Math.min(w - paddleW - 12, paddleX + 7);
      }

      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - ball.r < 8 || ball.x + ball.r > w - 8) ball.vx *= -1;
      if (ball.y - ball.r < 8) ball.vy *= -1;

      // Paddle bounce
      const py = h - 38;
      if (
        ball.vy > 0 &&
        ball.y + ball.r >= py &&
        ball.y - ball.r <= py + paddleH &&
        ball.x >= paddleX &&
        ball.x <= paddleX + paddleW
      ) {
        const hitOffset = (ball.x - (paddleX + paddleW / 2)) / (paddleW / 2);
        ball.vx = hitOffset * 5.5;
        ball.vy = -Math.abs(ball.vy);
        playSound('boost');
      }

      if (ball.y - ball.r > h) {
        playSound('crash');
        setGameOver(true);
        cancelAnimationFrame(gameLoopRef.current);
        return;
      }

      // Bricks layout & collision
      const padX = 28;
      const padY = 42;
      const gap = 8;
      const bw = (w - padX * 2 - gap * (brickCols - 1)) / brickCols;
      const bh = 22;

      for (const b of bricks) {
        if (!b.alive) continue;
        const bx = padX + b.c * (bw + gap);
        const by = padY + b.r * (bh + gap);
        if (ball.x + ball.r > bx && ball.x - ball.r < bx + bw && ball.y + ball.r > by && ball.y - ball.r < by + bh) {
          b.alive = false;
          ball.vy *= -1;
          currentScore += 50;
          setScore(currentScore);
          playSound('score');
          break;
        }
      }

      if (bricks.every((b) => !b.alive)) {
        bricks.forEach((b) => (b.alive = true));
        ball.vy *= 1.1;
        setLevel((l) => l + 1);
      }

      ctx.fillStyle = '#040712';
      ctx.fillRect(0, 0, w, h);

      // Draw Glass Bricks
      for (const b of bricks) {
        if (!b.alive) continue;
        const bx = padX + b.c * (bw + gap);
        const by = padY + b.r * (bh + gap);
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 7);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.roundRect(bx + 2, by + 2, bw - 4, bh * 0.35, 4);
        ctx.fill();
      }

      // Draw Glass Paddle
      const pg = ctx.createLinearGradient(paddleX, py, paddleX, py + paddleH);
      pg.addColorStop(0, '#7dd3fc');
      pg.addColorStop(1, '#0284c7');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.roundRect(paddleX, py, paddleW, paddleH, 8);
      ctx.fill();

      // Draw Ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    const onResize = () => {
      w = canvas.width = container.clientWidth;
      h = canvas.height = container.clientHeight;
      paddleW = Math.min(130, w * 0.24);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(gameLoopRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointermove', onPointerMove);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  };

  // =============================================================
  // 5. 2048 Glass Puzzle Logic
  // =============================================================
  const move2048 = useCallback(
    (dir: 'left' | 'right' | 'up' | 'down') => {
      setGrid2048((prev) => {
        const next = prev.map((r) => [...r]);
        let moved = false;
        let gained = 0;

        const slideLine = (line: number[]) => {
          const filtered = line.filter((v) => v !== 0);
          const merged: number[] = [];
          for (let i = 0; i < filtered.length; i++) {
            if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
              const val = filtered[i] * 2;
              merged.push(val);
              gained += val;
              i++;
            } else {
              merged.push(filtered[i]);
            }
          }
          while (merged.length < 4) merged.push(0);
          return merged;
        };

        if (dir === 'left' || dir === 'right') {
          for (let r = 0; r < 4; r++) {
            const row = dir === 'left' ? next[r] : [...next[r]].reverse();
            const newRow = slideLine(row);
            if (dir === 'right') newRow.reverse();
            if (newRow.some((v, idx) => v !== next[r][idx])) moved = true;
            next[r] = newRow;
          }
        } else {
          for (let c = 0; c < 4; c++) {
            const col = [next[0][c], next[1][c], next[2][c], next[3][c]];
            if (dir === 'down') col.reverse();
            const newCol = slideLine(col);
            if (dir === 'down') newCol.reverse();
            for (let r = 0; r < 4; r++) {
              if (next[r][c] !== newCol[r]) moved = true;
              next[r][c] = newCol[r];
            }
          }
        }

        if (moved) {
          addRandomTile2048(next);
          if (gained > 0) {
            setScore((s) => s + gained);
            playSound('score');
          }
        }
        return moved ? next : prev;
      });
    },
    [playSound]
  );

  useEffect(() => {
    if (mode !== '2048') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') move2048('left');
      if (e.key === 'ArrowRight' || e.key === 'd') move2048('right');
      if (e.key === 'ArrowUp' || e.key === 'w') move2048('up');
      if (e.key === 'ArrowDown' || e.key === 's') move2048('down');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, move2048]);

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
    } else if (mode === 'snake') {
      cleanup = initSnake(container);
    } else if (mode === 'breaker') {
      cleanup = initBreaker(container);
    } else if (mode === '2048') {
      setGrid2048(createInitial2048Grid());
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [mode, gameOver]);

  const GAME_TABS: { id: GameMode; label: string; icon: string }[] = [
    { id: 'velocity', label: 'Velocity 3D', icon: 'Flame' },
    { id: 'maze', label: '3D Maze', icon: 'Compass' },
    { id: '2048', label: '2048 Glass', icon: 'LayoutGrid' },
    { id: 'snake', label: 'Neon Snake', icon: 'Zap' },
    { id: 'breaker', label: 'Glass Breaker', icon: 'Sparkles' },
  ];

  return (
    <div className="flex h-full w-full select-none flex-col bg-slate-950 text-white relative touch-none">
      {/* Top Game Switcher Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-3 py-2 text-xs backdrop-blur-md shrink-0 z-20 gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          {GAME_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition-all ${
                mode === t.id
                  ? 'glass-jelly text-sky-300 font-semibold'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon name={t.icon} size={13} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 font-mono text-xs shrink-0">
          {mode === 'velocity' && (
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-white/50">SPEED</span>
              <span className="font-bold text-sky-400">{speedGauge}</span>
            </div>
          )}
          {(mode === 'maze' || mode === 'breaker') && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-white/50">LVL</span>
              <span className="font-bold text-amber-300">{level}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-white/50">SCORE</span>
            <span className="font-bold text-emerald-400">{score}</span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg glass-jelly text-white/80 hover:text-white"
            title="サウンド切替"
          >
            <Icon name={soundEnabled ? 'Volume2' : 'VolumeX'} size={14} />
          </button>
        </div>
      </div>

      {/* Main Game Viewport */}
      <div className="relative flex-1 overflow-hidden min-h-0 min-w-0 flex items-center justify-center" ref={containerRef}>
        {/* 2048 3D Liquid Glass UI */}
        {mode === '2048' && (
          <div className="flex flex-col items-center gap-5 p-4 z-10">
            <div className="grid grid-cols-4 gap-3 p-4 rounded-3xl glass-panel border border-white/15 shadow-2xl">
              {grid2048.flat().map((val, idx) => (
                <div
                  key={idx}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-extrabold text-lg sm:text-2xl transition-all ${
                    val === 0
                      ? 'bg-white/[0.03] text-transparent'
                      : val <= 4
                      ? 'glass-jelly text-white'
                      : val <= 32
                      ? 'glass-jelly text-sky-300 ring-1 ring-sky-400/40'
                      : 'glass-jelly text-amber-300 ring-1 ring-amber-400/50'
                  }`}
                >
                  {val || ''}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => move2048('left')} className="px-4 py-2 rounded-xl glass-jelly text-xs">
                ←
              </button>
              <div className="flex flex-col gap-2">
                <button onClick={() => move2048('up')} className="px-4 py-2 rounded-xl glass-jelly text-xs">
                  ↑
                </button>
                <button onClick={() => move2048('down')} className="px-4 py-2 rounded-xl glass-jelly text-xs">
                  ↓
                </button>
              </div>
              <button onClick={() => move2048('right')} className="px-4 py-2 rounded-xl glass-jelly text-xs">
                →
              </button>
              <button
                onClick={() => {
                  setScore(0);
                  setGrid2048(createInitial2048Grid());
                }}
                className="ml-3 px-4 py-2 rounded-xl glass-jelly text-xs text-sky-300 font-semibold"
              >
                リセット
              </button>
            </div>
          </div>
        )}

        {/* Touch Controls for Velocity / Maze / Snake / Breaker */}
        {mode !== '2048' && (
          <div className="absolute inset-x-4 bottom-4 z-20 flex items-end justify-between pointer-events-none">
            <div className="flex items-center gap-2.5 pointer-events-auto">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  setControl('left', true);
                }}
                onPointerUp={() => setControl('left', false)}
                onPointerCancel={() => setControl('left', false)}
                className="w-12 h-12 rounded-2xl glass-jelly flex items-center justify-center text-sky-300"
              >
                <Icon name="ChevronLeft" size={22} />
              </button>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  setControl('right', true);
                }}
                onPointerUp={() => setControl('right', false)}
                onPointerCancel={() => setControl('right', false)}
                className="w-12 h-12 rounded-2xl glass-jelly flex items-center justify-center text-sky-300"
              >
                <Icon name="ChevronRight" size={22} />
              </button>
            </div>

            {(mode === 'maze' || mode === 'snake') && (
              <div className="flex flex-col gap-2 pointer-events-auto">
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setControl('up', true);
                  }}
                  onPointerUp={() => setControl('up', false)}
                  onPointerCancel={() => setControl('up', false)}
                  className="w-12 h-12 rounded-2xl glass-jelly flex items-center justify-center text-amber-300"
                >
                  <Icon name="ChevronUp" size={20} />
                </button>
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setControl('down', true);
                  }}
                  onPointerUp={() => setControl('down', false)}
                  onPointerCancel={() => setControl('down', false)}
                  className="w-12 h-12 rounded-2xl glass-jelly flex items-center justify-center text-amber-300"
                >
                  <Icon name="ChevronDown" size={20} />
                </button>
              </div>
            )}

            {mode === 'velocity' && (
              <div className="pointer-events-auto">
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setControl('boost', true);
                  }}
                  onPointerUp={() => setControl('boost', false)}
                  onPointerCancel={() => setControl('boost', false)}
                  className="w-14 h-14 rounded-full glass-jelly text-emerald-300 font-bold flex flex-col items-center justify-center"
                >
                  <Icon name="Zap" size={20} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 p-6 backdrop-blur-2xl">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">GAME OVER</div>
            <div className="mt-2 text-sm text-white/80">
              スコア: <span className="font-mono text-sky-300 font-bold">{score}</span>
            </div>
            <button
              onClick={() => setGameOver(false)}
              className="mt-6 flex items-center gap-2 rounded-2xl glass-jelly px-7 py-3 font-semibold text-white text-sm"
            >
              <Icon name="RotateCcw" size={16} /> もう一度プレイ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function addRandomTile2048(grid: number[][]) {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function createInitial2048Grid(): number[][] {
  const g = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  addRandomTile2048(g);
  addRandomTile2048(g);
  return g;
}
