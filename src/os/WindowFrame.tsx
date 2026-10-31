import { ReactNode, useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { WindowState, SnapZone } from './types';
import { useOS } from './OSContext';
import { Icon } from './Icon';

interface Props {
  win: WindowState;
  children: ReactNode;
}

const TASKBAR_H = 48;
const SNAP_THRESHOLD = 28;
const SNAP_GAP = 8;

function computeSnap(x: number, y: number, w: number, h: number, vw: number, vh: number): SnapZone | null {
  if (x <= SNAP_THRESHOLD) {
    return { side: 'left', preview: { x: SNAP_GAP, y: SNAP_GAP, width: vw / 2 - SNAP_GAP * 1.5, height: vh - TASKBAR_H - SNAP_GAP * 1.5 } };
  }
  if (x + w >= vw - SNAP_THRESHOLD) {
    return { side: 'right', preview: { x: vw / 2 + SNAP_GAP * 0.5, y: SNAP_GAP, width: vw / 2 - SNAP_GAP * 1.5, height: vh - TASKBAR_H - SNAP_GAP * 1.5 } };
  }
  if (y <= SNAP_THRESHOLD) {
    return { side: 'top', preview: { x: SNAP_GAP, y: SNAP_GAP, width: vw - SNAP_GAP * 2, height: vh - TASKBAR_H - SNAP_GAP * 1.5 } };
  }
  return null;
}

interface SnapPreset {
  id: string;
  label: string;
  zones: { x: number; y: number; width: number; height: number }[];
}

function getSnapPresets(vw: number, vh: number): SnapPreset[] {
  const h = vh - TASKBAR_H - SNAP_GAP * 1.5;
  const fullW = vw - SNAP_GAP * 2;
  return [
    {
      id: 'half',
      label: '50/50',
      zones: [
        { x: SNAP_GAP, y: SNAP_GAP, width: fullW / 2 - SNAP_GAP * 0.5, height: h },
        { x: vw / 2 + SNAP_GAP * 0.5, y: SNAP_GAP, width: fullW / 2 - SNAP_GAP * 0.5, height: h },
      ],
    },
    {
      id: 'thirds',
      label: '33/33/33',
      zones: [
        { x: SNAP_GAP, y: SNAP_GAP, width: fullW / 3 - SNAP_GAP * 0.5, height: h },
        { x: vw / 3 + SNAP_GAP * 0.5, y: SNAP_GAP, width: fullW / 3 - SNAP_GAP * 0.5, height: h },
        { x: (vw / 3) * 2 + SNAP_GAP * 0.5, y: SNAP_GAP, width: fullW / 3 - SNAP_GAP * 0.5, height: h },
      ],
    },
    {
      id: 'quarters',
      label: 'Quadrants',
      zones: [
        { x: SNAP_GAP, y: SNAP_GAP, width: fullW / 2 - SNAP_GAP * 0.5, height: h / 2 - SNAP_GAP * 0.5 },
        { x: vw / 2 + SNAP_GAP * 0.5, y: SNAP_GAP, width: fullW / 2 - SNAP_GAP * 0.5, height: h / 2 - SNAP_GAP * 0.5 },
        { x: SNAP_GAP, y: vh / 2 + SNAP_GAP * 0.5, width: fullW / 2 - SNAP_GAP * 0.5, height: h / 2 - SNAP_GAP * 0.5 },
        { x: vw / 2 + SNAP_GAP * 0.5, y: vh / 2 + SNAP_GAP * 0.5, width: fullW / 2 - SNAP_GAP * 0.5, height: h / 2 - SNAP_GAP * 0.5 },
      ],
    },
  ];
}

export function WindowFrame({ win, children }: Props) {
  const {
    focusWindow, closeWindow, minimizeWindow, toggleMaximize, updateWindowRect, shellMode, touchMode, windows,
  } = useOS();
  const [dragging, setDragging] = useState(false);
  const [snapZone, setSnapZone] = useState<SnapZone | null>(null);
  const [showSnapLayout, setShowSnapLayout] = useState(false);
  const [metroHoverHeader, setMetroHoverHeader] = useState(false);
  const snapHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<number>(0);

  const dragState = useRef<{
    mode: 'move' | 'resize';
    dir?: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    pointerId?: number;
  } | null>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const st = dragState.current;
      if (!st) return;
      const dx = e.clientX - st.startX;
      const dy = e.clientY - st.startY;
      if (st.mode === 'move') {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const nx = Math.min(Math.max(st.origX + dx, -st.origW + 100), vw - 100);
        const ny = Math.min(Math.max(st.origY + dy, 0), vh - TASKBAR_H - 30);
        updateWindowRect(win.id, { x: nx, y: ny });
        const zone = computeSnap(nx, ny, st.origW, st.origH, vw, vh);
        setSnapZone(zone);
      } else if (st.mode === 'resize') {
        let nx = st.origX;
        let ny = st.origY;
        let nw = st.origW;
        let nh = st.origH;
        if (st.dir?.includes('e')) nw = Math.max(300, st.origW + dx);
        if (st.dir?.includes('s')) nh = Math.max(200, st.origH + dy);
        if (st.dir?.includes('w')) {
          nw = Math.max(300, st.origW - dx);
          nx = st.origX + (st.origW - nw);
        }
        if (st.dir?.includes('n')) {
          nh = Math.max(200, st.origH - dy);
          ny = st.origY + (st.origH - nh);
        }
        updateWindowRect(win.id, { x: nx, y: ny, width: nw, height: nh });
      }
    },
    [win.id, updateWindowRect]
  );

  const onPointerUp = useCallback(() => {
    const st = dragState.current;
    if (st && st.mode === 'move') {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const zone = computeSnap(win.x, win.y, st.origW, st.origH, vw, vh);
      if (zone) {
        if (zone.side === 'top') {
          toggleMaximize(win.id);
        } else {
          updateWindowRect(win.id, { x: zone.preview.x, y: zone.preview.y, width: zone.preview.width, height: zone.preview.height });
        }
      }
    }
    dragState.current = null;
    setDragging(false);
    setSnapZone(null);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  }, [win.id, win.x, win.y, updateWindowRect, toggleMaximize, onPointerMove]);

  const startDrag = (e: React.PointerEvent) => {
    if (win.maximized || shellMode === 'metro' || shellMode === 'windows8') return;
    // Check for double-tap on touch screens
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      toggleMaximize(win.id);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    focusWindow(win.id);
    setDragging(true);
    dragState.current = {
      mode: 'move',
      startX: e.clientX,
      startY: e.clientY,
      origX: win.x,
      origY: win.y,
      origW: win.width,
      origH: win.height,
      pointerId: e.pointerId,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const startResize = (e: React.PointerEvent, dir: string) => {
    e.stopPropagation();
    if (win.maximized || shellMode === 'metro' || shellMode === 'windows8') return;
    focusWindow(win.id);
    dragState.current = {
      mode: 'resize',
      dir,
      startX: e.clientX,
      startY: e.clientY,
      origX: win.x,
      origY: win.y,
      origW: win.width,
      origH: win.height,
      pointerId: e.pointerId,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      if (snapHoverTimer.current) clearTimeout(snapHoverTimer.current);
    };
  }, [onPointerMove, onPointerUp]);

  const handleMaximizeHoverEnter = () => {
    if (snapHoverTimer.current) clearTimeout(snapHoverTimer.current);
    snapHoverTimer.current = setTimeout(() => setShowSnapLayout(true), 400);
  };
  const handleMaximizeHoverLeave = () => {
    if (snapHoverTimer.current) clearTimeout(snapHoverTimer.current);
    snapHoverTimer.current = setTimeout(() => setShowSnapLayout(false), 200);
  };

  const applySnapPreset = (preset: SnapPreset, zoneIndex: number) => {
    const zone = preset.zones[zoneIndex];
    if (win.maximized) toggleMaximize(win.id);
    updateWindowRect(win.id, { x: zone.x, y: zone.y, width: zone.width, height: zone.height });
    setShowSnapLayout(false);
  };

  if (win.minimized) return null;

  const isMetro = shellMode === 'metro' || shellMode === 'windows8';
  const isMax = win.maximized || isMetro;
  const isXP = shellMode === 'xp';
  const isVista = shellMode === 'vista';
  const isWin10 = shellMode === 'windows10';
  const isDeX = shellMode === 'dex';
  const isChromeOS = shellMode === 'chromeos';
  const isMac = shellMode === 'mac';
  const isUbuntu = shellMode === 'ubuntu';
  const isZorin = shellMode === 'zorin';

  // Windows freely overlap and drag; only maximize when explicitly maximized or in Windows 8 Metro mode
  const style: React.CSSProperties = isMetro
    ? { left: 0, top: 0, width: '100vw', height: '100vh', zIndex: win.zIndex, borderRadius: 0 }
    : win.maximized
    ? { left: 0, top: 0, width: '100vw', height: `calc(100vh - ${TASKBAR_H}px)`, zIndex: win.zIndex, transform: undefined }
    : {
        left: win.x,
        top: win.y,
        width: typeof window !== 'undefined' ? Math.min(win.width, window.innerWidth - 16) : win.width,
        height: typeof window !== 'undefined' ? Math.min(win.height, window.innerHeight - TASKBAR_H - 16) : win.height,
        zIndex: win.zIndex,
        transform: undefined,
      };

  const presets = getSnapPresets(typeof window !== 'undefined' ? window.innerWidth : 1200, typeof window !== 'undefined' ? window.innerHeight : 800);

  // Shell-specific Window Frame Classes & Styles
  let windowFrameClasses = 'liquid-glass-window rounded-2xl border border-white/[0.08]';
  let titleBarClasses = 'h-10 px-3 bg-white/[0.03] border-b border-white/[0.06] text-white';

  if (isXP) {
    windowFrameClasses = 'bg-[#ece9d8] text-black shadow-2xl rounded-t-lg border border-[#0055ea] overflow-hidden';
    titleBarClasses = 'h-8 px-2 bg-gradient-to-r from-[#0055ea] via-[#0855eb] to-[#3f88f8] text-white font-bold text-xs select-none shadow-inner border-b border-[#002f87]';
  } else if (isVista) {
    windowFrameClasses = 'bg-slate-950/80 backdrop-blur-2xl rounded-xl shadow-2xl border border-white/10 ring-1 ring-white/10';
    titleBarClasses = 'h-9 px-3 bg-gradient-to-b from-sky-400/20 via-slate-900/60 to-black/80 border-b border-white/[0.06] text-white';
  } else if (isWin10) {
    windowFrameClasses = 'bg-zinc-950 rounded-none shadow-2xl border border-zinc-800';
    titleBarClasses = 'h-8 px-3 bg-zinc-900 border-b border-zinc-800 text-white/90 text-xs';
  } else if (isDeX) {
    windowFrameClasses = 'bg-zinc-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/[0.08]';
    titleBarClasses = 'h-10 px-3.5 bg-black/40 border-b border-white/[0.06] text-white';
  } else if (isChromeOS) {
    windowFrameClasses = 'bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/[0.08]';
    titleBarClasses = 'h-9 px-3 bg-white/[0.04] border-b border-white/[0.06] text-white/90';
  } else if (isZorin) {
    windowFrameClasses = 'bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/[0.08]';
    titleBarClasses = 'h-10 px-3.5 bg-black/40 border-b border-white/[0.06] text-white';
  } else if (isMac) {
    windowFrameClasses = 'bg-zinc-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/[0.08] ring-1 ring-black/40';
    titleBarClasses = 'h-9 px-3 bg-white/[0.02] border-b border-black/30 text-white/90 text-xs';
  }

  const isTopmost = windows.filter((w) => !w.minimized).reduce((max, w) => (w.zIndex > max ? w.zIndex : max), 0) === win.zIndex;

  if (touchMode) {
    titleBarClasses = titleBarClasses.replace(/h-\d+/, 'h-12') + ' touch-manipulation py-1';
  }

  return (
    <>
      {snapZone && (
        <div
          className="snap-preview fixed z-50 pointer-events-none transition-all duration-150 border-2 border-cyan-400 bg-cyan-400/15 rounded-xl shadow-2xl"
          style={{ left: snapZone.preview.x, top: snapZone.preview.y, width: snapZone.preview.width, height: snapZone.preview.height }}
        />
      )}

      <motion.div
        className={`absolute flex flex-col overflow-hidden select-none ${windowFrameClasses} ${dragging ? 'is-dragging shadow-2xl ring-2 ring-cyan-400/50' : ''}`}
        style={style}
        initial={{ opacity: 0, scale: isMetro ? 1 : 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: isMetro ? 1 : 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onPointerDown={() => focusWindow(win.id)}
        onMouseDown={() => focusWindow(win.id)}
        onTouchStart={() => focusWindow(win.id)}
      >
        {/* ========================================================
            1. METRO / FULLSCREEN IMMERSIVE HEADER BAR
           ======================================================== */}
        {isMetro && (
          <div
            className="absolute top-0 inset-x-0 h-11 z-50 pointer-events-auto"
            onMouseEnter={() => setMetroHoverHeader(true)}
            onMouseLeave={() => setMetroHoverHeader(false)}
          >
            <motion.div
              initial={false}
              animate={{ y: metroHoverHeader ? 0 : -44, opacity: metroHoverHeader ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="h-11 bg-black/85 backdrop-blur-xl border-b border-white/10 px-4 flex items-center justify-between text-white shadow-2xl"
            >
              <div className="flex items-center gap-2.5 text-xs text-white/90">
                <Icon name={win.icon} size={16} className="text-cyan-300" />
                <span className="font-semibold">{win.title}</span>
                <span className="text-[10px] text-white/40 font-mono">Windows 8 Fullscreen</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => minimizeWindow(win.id)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white/90 transition"
                >
                  <Icon name="Minus" size={14} />
                </button>
                <button
                  onClick={() => closeWindow(win.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs text-white transition flex items-center gap-1.5"
                >
                  <Icon name="X" size={14} />
                  <span>Close</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ========================================================
            2. AUTHENTIC OS TITLE BAR (XP, Vista, 10, 11, DeX, ChromeOS, Mac, Ubuntu)
           ======================================================== */}
        {!isMetro && (
          <div
            className={`flex items-center justify-between select-none shrink-0 cursor-default relative z-20 touch-none ${titleBarClasses}`}
            onPointerDown={startDrag}
            onDoubleClick={() => toggleMaximize(win.id)}
            style={{ touchAction: 'none' }}
          >
            {/* MAC OS: Authentic Traffic Light Beads with Group Hover and Balanced Title */}
            {isMac && (
              <div
                className="flex items-center gap-2 pl-2 relative z-50 pointer-events-auto w-16 group"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {/* Close (Red / しょうきょ) */}
                <button
                  className="h-3 w-3 rounded-full bg-[#FF5F56] border border-[#E0443E] hover:brightness-90 active:brightness-75 transition flex items-center justify-center text-[8px] text-[#4A0002] shadow-[inset_0_1px_rgba(255,255,255,0.4)]"
                  onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                  title="閉じる (Close)"
                >
                  <span className="opacity-0 group-hover:opacity-100 font-bold leading-none select-none">✕</span>
                </button>
                {/* Minimize (Yellow / さいしょうか) */}
                <button
                  className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] hover:brightness-90 active:brightness-75 transition flex items-center justify-center text-[8px] text-[#5A3B00] shadow-[inset_0_1px_rgba(255,255,255,0.4)]"
                  onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
                  title="最小化 (Minimize)"
                >
                  <span className="opacity-0 group-hover:opacity-100 font-bold leading-none select-none">−</span>
                </button>
                {/* Maximize (Green / さいだいか) */}
                <button
                  className="h-3 w-3 rounded-full bg-[#27C93F] border border-[#1AAB29] hover:brightness-90 active:brightness-75 transition flex items-center justify-center text-[8px] text-[#0A4812] shadow-[inset_0_1px_rgba(255,255,255,0.4)]"
                  onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}
                  title="フルスクリーン / 最大化 (Maximize)"
                >
                  <span className="opacity-0 group-hover:opacity-100 font-bold leading-none select-none">⤢</span>
                </button>
              </div>
            )}

            {/* Window Icon & Title */}
            <div className={`flex items-center gap-2 text-xs pointer-events-none truncate ${isMac ? 'mx-auto' : ''}`}>
              <Icon name={win.icon} size={15} className={isXP ? 'text-amber-300' : isVista ? 'text-cyan-300' : 'text-cyan-400'} />
              <span className={`font-semibold truncate ${isXP ? 'text-white tracking-wide drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]' : 'text-white/90'}`}>
                {win.title}
              </span>
            </div>

            {/* WINDOWS XP: Iconic Blue / Red Luna Buttons */}
            {isXP ? (
              <div className="flex items-center gap-1 relative z-50 pointer-events-auto">
                <button
                  className="w-5 h-5 rounded-sm bg-gradient-to-b from-[#2572ea] to-[#0038bb] hover:from-[#3c88fc] hover:to-[#0947db] border border-white/60 active:inset-0 text-white flex items-center justify-center text-[10px] font-bold shadow-sm"
                  onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
                  title="Minimize"
                >
                  _
                </button>
                <button
                  className="w-5 h-5 rounded-sm bg-gradient-to-b from-[#2572ea] to-[#0038bb] hover:from-[#3c88fc] hover:to-[#0947db] border border-white/60 active:inset-0 text-white flex items-center justify-center text-[9px] font-bold shadow-sm"
                  onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}
                  title="Maximize"
                >
                  □
                </button>
                <button
                  className="w-5 h-5 rounded-sm bg-gradient-to-b from-[#e84c2f] to-[#be2000] hover:from-[#ff6b50] hover:to-[#d82803] border border-white/60 text-white flex items-center justify-center text-[11px] font-bold shadow-sm"
                  onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                  title="Close"
                >
                  ×
                </button>
              </div>
            ) : isVista ? (
              /* WINDOWS VISTA: Glowing Aero Glass Buttons */
              <div className="flex items-center gap-1 relative z-50 pointer-events-auto">
                <button
                  className="h-6 w-7 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center text-xs transition"
                  onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
                  title="Minimize"
                >
                  <Icon name="Minus" size={13} />
                </button>
                <button
                  className="h-6 w-7 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center text-xs transition"
                  onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}
                  title="Maximize"
                >
                  <Icon name="Maximize" size={11} />
                </button>
                <button
                  className="h-6 w-8 rounded bg-rose-600/80 hover:bg-rose-600 border border-rose-400 text-white flex items-center justify-center text-xs transition shadow-lg shadow-rose-500/30"
                  onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                  title="Close"
                >
                  <Icon name="X" size={13} />
                </button>
              </div>
            ) : isUbuntu ? (
              /* UBUNTU: Circular Industrial Controls */
              <div className="flex items-center gap-1.5 pr-1 relative z-50 pointer-events-auto">
                <button
                  className="h-5 w-5 rounded-full bg-white/10 hover:bg-white/25 text-white/80 flex items-center justify-center transition"
                  onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
                  title="Minimize"
                >
                  <Icon name="Minus" size={10} />
                </button>
                <button
                  className="h-5 w-5 rounded-full bg-white/10 hover:bg-white/25 text-white/80 flex items-center justify-center transition"
                  onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}
                  title="Maximize"
                >
                  <Icon name="Maximize" size={10} />
                </button>
                <button
                  className="h-5 w-5 rounded-full bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center transition"
                  onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                  title="Close"
                >
                  <Icon name="X" size={10} />
                </button>
              </div>
            ) : isDeX ? (
              /* SAMSUNG DEX: Clean DeX Controls */
              <div className="flex items-center gap-1 relative z-50 pointer-events-auto">
                <button
                  className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition"
                  onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
                  title="Minimize to DeX Taskbar"
                >
                  <Icon name="Minus" size={14} />
                </button>
                <button
                  className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition"
                  onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}
                  title="Full Screen DeX"
                >
                  <Icon name="Maximize" size={13} />
                </button>
                <button
                  className="p-1.5 rounded-lg text-white/70 hover:bg-rose-600 hover:text-white transition"
                  onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                  title="Close Window"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
            ) : isChromeOS ? (
              /* CHROMEOS: Minimalist Clean Controls */
              <div className="flex items-center gap-1 relative z-50 pointer-events-auto">
                <button
                  className="h-7 w-7 rounded-full text-white/70 hover:bg-white/10 hover:text-white flex items-center justify-center transition"
                  onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
                  title="Minimize"
                >
                  <Icon name="Minus" size={13} />
                </button>
                <button
                  className="h-7 w-7 rounded-full text-white/70 hover:bg-white/10 hover:text-white flex items-center justify-center transition"
                  onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}
                  title="Maximize"
                >
                  <Icon name="Maximize" size={12} />
                </button>
                <button
                  className="h-7 w-7 rounded-full text-white/70 hover:bg-rose-500/80 hover:text-white flex items-center justify-center transition"
                  onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                  title="Close"
                >
                  <Icon name="X" size={13} />
                </button>
              </div>
            ) : !isMac ? (
              /* WINDOWS 10 / WINDOWS 11 / STANDARD */
              <div className="flex items-center relative z-50 pointer-events-auto">
                <button
                  className="win-control text-white/80 hover:bg-white/10 transition px-3.5 py-2"
                  onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
                  title="Minimize"
                >
                  <Icon name="Minus" size={14} />
                </button>
                <div
                  className="relative"
                  onMouseEnter={handleMaximizeHoverEnter}
                  onMouseLeave={handleMaximizeHoverLeave}
                >
                  <button
                    className="win-control text-white/80 hover:bg-white/10 transition px-3.5 py-2"
                    onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}
                    title="Maximize"
                  >
                    {isMax ? <Icon name="Maximize2" size={13} /> : <Icon name="Maximize" size={13} />}
                  </button>

                  {/* Windows 11 Snap Layout Popover */}
                  {showSnapLayout && (
                    <div
                      className="snap-layout-popover right-0 top-9"
                      onMouseEnter={handleMaximizeHoverEnter}
                      onMouseLeave={handleMaximizeHoverLeave}
                    >
                      {presets.map((preset) => (
                        <div key={preset.id} className="snap-layout-option" style={{ gridTemplateColumns: `repeat(${preset.zones.length}, 1fr)` }}>
                          {preset.zones.map((zone, i) => {
                            const aspectH = zone.height / (window.innerHeight - TASKBAR_H - SNAP_GAP * 1.5);
                            return (
                              <button
                                key={i}
                                className="snap-zone-mini"
                                style={{ width: Math.max(16, 60 / preset.zones.length), height: 36 * aspectH }}
                                onClick={(e) => { e.stopPropagation(); applySnapPreset(preset, i); }}
                                title={`${preset.label} — zone ${i + 1}`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  className="win-control close text-white/80 hover:bg-rose-600 hover:text-white transition px-4 py-2"
                  onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                  title="Close"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
            ) : isMac ? (
              <div className="w-16 shrink-0 pointer-events-none" />
            ) : null}
          </div>
        )}

        {/* Content View */}
        <div
          className="flex-1 min-h-0 min-w-0 w-full h-full overflow-hidden relative select-none z-10 pointer-events-auto bg-zinc-950/60"
          style={{ contain: 'layout style paint' }}
        >
          {children}

          {/* Inactive Window Overlay: brings window to front instantly on click or tap */}
          {!isTopmost && (
            <div
              className="absolute inset-0 z-30 bg-transparent cursor-pointer"
              onPointerDown={(e) => {
                e.stopPropagation();
                focusWindow(win.id);
              }}
            />
          )}
        </div>

        {/* ========================================================
            TOUCH-OPTIMIZED RESIZE HANDLES (16px generous touch zones)
           ======================================================== */}
        {!isMax && !isMetro && !isMobileViewport && (
          <>
            {/* Top / Bottom / Left / Right touch edges */}
            <div
              className="absolute left-4 top-0 right-4 h-3.5 -mt-1 cursor-n-resize z-30 touch-none"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => startResize(e, 'n')}
            />
            <div
              className="absolute left-4 bottom-0 right-4 h-3.5 -mb-1 cursor-s-resize z-30 touch-none"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => startResize(e, 's')}
            />
            <div
              className="absolute top-4 left-0 bottom-4 w-3.5 -ml-1 cursor-w-resize z-30 touch-none"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => startResize(e, 'w')}
            />
            <div
              className="absolute top-4 right-0 bottom-4 w-3.5 -mr-1 cursor-e-resize z-30 touch-none"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => startResize(e, 'e')}
            />

            {/* Corner touch zones (24x24px for easy finger grab) */}
            <div
              className="absolute left-0 top-0 h-6 w-6 cursor-nw-resize z-30 touch-none"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => startResize(e, 'nw')}
            />
            <div
              className="absolute right-0 top-0 h-6 w-6 cursor-ne-resize z-30 touch-none"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => startResize(e, 'ne')}
            />
            <div
              className="absolute left-0 bottom-0 h-6 w-6 cursor-sw-resize z-30 touch-none"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => startResize(e, 'sw')}
            />
            <div
              className="absolute right-0 bottom-0 h-6 w-6 cursor-se-resize z-30 touch-none flex items-end justify-end p-0.5 text-white/30 hover:text-cyan-400"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => startResize(e, 'se')}
            >
              {/* Visual corner grip indicator for tactile touch resizing */}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <circle cx="8" cy="8" r="1.2" />
                <circle cx="4" cy="8" r="1.2" />
                <circle cx="8" cy="4" r="1.2" />
              </svg>
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}
