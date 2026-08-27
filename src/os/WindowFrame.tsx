import { ReactNode, useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { WindowState, SnapZone } from './types';
import { useOS } from './OSContext';
import { Icon } from './Icon';

interface Props {
  win: WindowState;
  children: ReactNode;
}

const TASKBAR_H = 56;
const SNAP_THRESHOLD = 24;
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

// Snap layout presets shown on maximize hover
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
  const { focusWindow, closeWindow, minimizeWindow, toggleMaximize, updateWindowRect } = useOS();
  const [dragging, setDragging] = useState(false);
  const [snapZone, setSnapZone] = useState<SnapZone | null>(null);
  const [showSnapLayout, setShowSnapLayout] = useState(false);
  const snapHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragState = useRef<{
    mode: 'move' | 'resize';
    dir?: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
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
        const nx = Math.min(Math.max(st.origX + dx, -st.origW + 120), vw - 120);
        const ny = Math.min(Math.max(st.origY + dy, 8), vh - TASKBAR_H - 40);
        updateWindowRect(win.id, { x: nx, y: ny });
        const zone = computeSnap(nx, ny, st.origW, st.origH, vw, vh);
        setSnapZone(zone);
      } else if (st.mode === 'resize') {
        let nx = st.origX;
        let ny = st.origY;
        let nw = st.origW;
        let nh = st.origH;
        if (st.dir?.includes('e')) nw = Math.max(320, st.origW + dx);
        if (st.dir?.includes('s')) nh = Math.max(220, st.origH + dy);
        if (st.dir?.includes('w')) { nw = Math.max(320, st.origW - dx); nx = st.origX + (st.origW - nw); }
        if (st.dir?.includes('n')) { nh = Math.max(220, st.origH - dy); ny = st.origY + (st.origH - nh); }
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
  }, [win.id, win.x, win.y, updateWindowRect, toggleMaximize, onPointerMove]);

  const startDrag = (e: React.PointerEvent) => {
    if (win.maximized) return;
    focusWindow(win.id);
    setDragging(true);
    dragState.current = { mode: 'move', startX: e.clientX, startY: e.clientY, origX: win.x, origY: win.y, origW: win.width, origH: win.height };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const startResize = (e: React.PointerEvent, dir: string) => {
    e.stopPropagation();
    if (win.maximized) return;
    focusWindow(win.id);
    dragState.current = { mode: 'resize', dir, startX: e.clientX, startY: e.clientY, origX: win.x, origY: win.y, origW: win.width, origH: win.height };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (snapHoverTimer.current) clearTimeout(snapHoverTimer.current);
    };
  }, [onPointerMove, onPointerUp]);

  const handleMaximizeHoverEnter = () => {
    if (snapHoverTimer.current) clearTimeout(snapHoverTimer.current);
    snapHoverTimer.current = setTimeout(() => setShowSnapLayout(true), 500);
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

  const isMax = win.maximized;
  const style: React.CSSProperties = isMax
    ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight - TASKBAR_H, zIndex: win.zIndex, transform: undefined }
    : { left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.zIndex, transform: undefined };

  const presets = getSnapPresets(window.innerWidth, window.innerHeight);

  return (
    <>
      {snapZone && (
        <div className="snap-preview" style={{ left: snapZone.preview.x, top: snapZone.preview.y, width: snapZone.preview.width, height: snapZone.preview.height }} />
      )}

      <motion.div
        className={`liquid-glass-window absolute flex flex-col rounded-xl overflow-hidden select-none ${dragging ? 'is-dragging window-dragging' : ''}`}
        style={style}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        onPointerDown={() => focusWindow(win.id)}
      >
        {/* Title bar — z:10 so it sits above the ::before/::after glass layers */}
        <div
          className="flex h-9 items-center justify-between pl-3 pr-0 select-none shrink-0 cursor-default relative z-10"
          onPointerDown={startDrag}
          onDoubleClick={() => toggleMaximize(win.id)}
        >
          <div className="flex items-center gap-2 text-xs text-white/80 pointer-events-none">
            <Icon name={win.icon} size={14} className="text-brand-300" />
            <span className="font-medium">{win.title}</span>
          </div>

          {/* Window controls — z:50, relative, pointer-events:auto so they always receive clicks */}
          <div className="flex items-center relative z-50 pointer-events-auto">
            <button
              className="win-control text-white/80"
              onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
              title="Minimize"
            >
              <Icon name="Minus" size={16} />
            </button>
            <div
              className="relative"
              onMouseEnter={handleMaximizeHoverEnter}
              onMouseLeave={handleMaximizeHoverLeave}
            >
              <button
                className="win-control text-white/80"
                onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}
                title="Maximize"
              >
                {isMax ? <Icon name="Maximize2" size={13} /> : <Icon name="Maximize" size={14} />}
              </button>

              {/* Snap layout popover */}
              {showSnapLayout && (
                <div className="snap-layout-popover right-0 top-8" onMouseEnter={handleMaximizeHoverEnter} onMouseLeave={handleMaximizeHoverLeave}>
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
              className="win-control close text-white/80"
              onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
              title="Close"
            >
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>

        {/* Content — z:10 so it sits above the glass visual layers but below controls */}
        <div
          className="flex-1 min-h-0 min-w-0 w-full h-full overflow-hidden relative select-none z-10"
          style={{ contain: 'layout style paint' }}
        >
          {children}
        </div>

        {/* Resize handles — z:20 */}
        {!isMax && (
          <>
            <div className="absolute left-2 top-0 right-2 h-1 cursor-n-resize z-20" onPointerDown={(e) => startResize(e, 'n')} />
            <div className="absolute left-2 bottom-0 right-2 h-1 cursor-s-resize z-20" onPointerDown={(e) => startResize(e, 's')} />
            <div className="absolute top-2 left-0 bottom-2 w-1 cursor-w-resize z-20" onPointerDown={(e) => startResize(e, 'w')} />
            <div className="absolute top-2 right-0 bottom-2 w-1 cursor-e-resize z-20" onPointerDown={(e) => startResize(e, 'e')} />
            <div className="absolute left-0 top-0 h-3 w-3 cursor-nw-resize z-20" onPointerDown={(e) => startResize(e, 'nw')} />
            <div className="absolute right-0 top-0 h-3 w-3 cursor-ne-resize z-20" onPointerDown={(e) => startResize(e, 'ne')} />
            <div className="absolute left-0 bottom-0 h-3 w-3 cursor-sw-resize z-20" onPointerDown={(e) => startResize(e, 'sw')} />
            <div className="absolute right-0 bottom-0 h-3 w-3 cursor-se-resize z-20" onPointerDown={(e) => startResize(e, 'se')} />
          </>
        )}
      </motion.div>
    </>
  );
}
