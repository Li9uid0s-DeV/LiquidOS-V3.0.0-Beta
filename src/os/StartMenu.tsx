import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOS } from './OSContext';
import { TASKBAR_APPS, AppId } from './types';
import { Icon } from './Icon';
import { AppLogo } from './AppLogo';

interface Props {
  open: boolean;
  onClose: () => void;
  startPos?: { x: number; width: number } | null;
}

interface SearchResult {
  type: 'app' | 'file';
  label: string;
  icon: string;
  appId?: AppId;
  customAppId?: string;
  filePath?: string[];
  fileName?: string;
}

const PINNED: { appId: AppId; label: string; icon: string }[] = [
  { appId: 'explorer', label: 'File Explorer', icon: 'FolderOpen' },
  { appId: 'browser', label: 'Liquid Browser', icon: 'Globe' },
  { appId: 'synth', label: 'Monochrome Music', icon: 'Music' },
  { appId: 'game', label: 'Cosmic Velocity', icon: 'Flame' },
  { appId: 'calculator', label: 'Calculator Pro', icon: 'Calculator' },
  { appId: 'taskmanager', label: 'Task Manager', icon: 'Cpu' },
  { appId: 'terminal', label: 'Terminal', icon: 'SquareTerminal' },
  { appId: 'notepad', label: 'Notepad', icon: 'FileText' },
  { appId: 'appstore', label: 'App Store', icon: 'Store' },
  { appId: 'sysmon', label: 'System Monitor', icon: 'Activity' },
  { appId: 'calendar', label: 'Calendar & Tasks', icon: 'Calendar' },
  { appId: 'settings', label: 'Settings', icon: 'Settings' },
];

function flattenFiles(
  folder: { children: Array<{ name: string; kind: string; type?: string; content?: string; children?: unknown[] }> },
  path: string[] = []
): { name: string; path: string[]; type: string }[] {
  const results: { name: string; path: string[]; type: string }[] = [];
  for (const child of folder.children) {
    const childPath = [...path, child.name];
    if (child.kind === 'file') {
      results.push({ name: child.name, path: childPath, type: child.type ?? 'text' });
    } else if (child.kind === 'folder' && Array.isArray(child.children)) {
      results.push(...flattenFiles(child as never, childPath));
    }
  }
  return results;
}

export function StartMenu({ open, onClose, startPos }: Props) {
  const { openApp, installedApps, launchInstalledApp, fileSystem, user, lockSystem, shellMode } = useOS();
  const [query, setQuery] = useState('');
  const [allProgramsView, setAllProgramsView] = useState(false);

  const allPinned = useMemo(() => {
    const installedEntries = installedApps.map((a) => ({
      appId: a.appId as AppId,
      label: a.name,
      icon: a.icon,
      isCustom: true,
    }));
    return [...PINNED, ...installedEntries];
  }, [installedApps]);

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const appResults: SearchResult[] = [...TASKBAR_APPS, ...allPinned]
      .filter((a) => a.label.toLowerCase().includes(q))
      .filter((v, i, arr) => arr.findIndex((x) => x.appId === v.appId) === i)
      .slice(0, 6)
      .map((a) => ({
        type: 'app' as const,
        label: a.label,
        icon: a.icon,
        appId: a.appId as AppId,
        customAppId: (a as { isCustom?: boolean }).isCustom ? a.appId as string : undefined,
      }));

    const allFiles = flattenFiles(fileSystem);
    const fileResults: SearchResult[] = allFiles
      .filter((f) => f.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((f) => ({
        type: 'file' as const,
        label: f.name,
        icon: 'FileText',
        filePath: f.path.slice(0, -1),
        fileName: f.name,
      }));

    return [...appResults, ...fileResults];
  }, [query, fileSystem, allPinned]);

  const filtered = query
    ? [...TASKBAR_APPS, ...allPinned].filter((a) =>
        a.label.toLowerCase().includes(query.toLowerCase())
      ).filter((v, i, arr) => arr.findIndex((x) => x.appId === v.appId) === i)
    : allPinned;

  const launch = (entry: { appId: AppId; isCustom?: boolean }) => {
    if (entry.isCustom) {
      launchInstalledApp(entry.appId as string);
    } else {
      openApp(entry.appId as AppId);
    }
    onClose();
    setQuery('');
  };

  const launchSearchResult = (result: SearchResult) => {
    if (result.type === 'app') {
      if (result.customAppId) {
        launchInstalledApp(result.customAppId);
      } else if (result.appId) {
        openApp(result.appId);
      }
    } else if (result.type === 'file' && result.fileName) {
      openApp('notepad', {
        title: result.fileName,
        payload: { fileName: result.fileName, content: '' },
      });
    }
    onClose();
    setQuery('');
  };

  const isXP = shellMode === 'xp';
  const isVista = shellMode === 'vista';
  const isWin10 = shellMode === 'windows10';
  const isDeX = shellMode === 'dex';
  const isChromeOS = shellMode === 'chromeos';
  const isZorin = shellMode === 'zorin';

  // Responsive boundary calculation to prevent off-screen popups
  const isLeftAligned = isXP || isVista || isWin10 || isDeX || isZorin;
  const menuWidth = isXP ? 420 : isVista ? 440 : isWin10 ? 640 : isChromeOS ? 560 : isDeX ? 500 : isZorin ? 540 : 540;
  
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const clampedWidth = Math.min(menuWidth, vw - 24);
  let menuLeft = 12;
  if (!isLeftAligned && startPos && typeof window !== 'undefined') {
    menuLeft = Math.max(12, Math.min(startPos.x + startPos.width / 2 - clampedWidth / 2, vw - clampedWidth - 12));
  } else if (!isLeftAligned && typeof window !== 'undefined') {
    menuLeft = (vw - clampedWidth) / 2;
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />

          {/* ==============================================================
              1. WINDOWS XP CLASSIC LUNA 2-COLUMN START MENU
             ============================================================== */}
          {isXP && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.15 }}
              className="fixed bottom-10 left-0 z-50 rounded-t-lg shadow-2xl border-2 border-[#0055ea] overflow-hidden flex flex-col font-sans select-none"
              style={{ width: 430, height: 500 }}
            >
              {/* Luna Blue Top Header with User Banner */}
              <div className="h-16 bg-gradient-to-r from-[#0055ea] via-[#1062eb] to-[#3f88f8] px-4 flex items-center gap-3 border-b-2 border-orange-400 shadow-md">
                <div className="w-11 h-11 rounded-md bg-white p-0.5 shadow-inner border border-white/60 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-600 rounded flex items-center justify-center text-white">
                    <Icon name="User" size={24} />
                  </div>
                </div>
                <div className="text-white font-bold text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {user?.name || 'Administrator'}
                </div>
              </div>

              {/* 2-Column Body */}
              <div className="flex-1 flex min-h-0 bg-white">
                {/* Left White Column: Frequently Used Apps */}
                <div className="flex-1 p-2 flex flex-col justify-between bg-white text-black border-r border-[#96b8e8]">
                  <div className="space-y-1 overflow-y-auto">
                    {/* Pinned Internet & E-mail */}
                    <button
                      onClick={() => { openApp('browser'); onClose(); }}
                      className="w-full flex items-center gap-2.5 p-1.5 rounded hover:bg-[#2f71cd] hover:text-white transition text-left group"
                    >
                      <Icon name="Globe" size={24} className="text-[#0055ea] group-hover:text-white shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight">Internet</div>
                        <div className="text-[10px] text-gray-500 group-hover:text-white/80 truncate">Liquid Browser</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { openApp('terminal'); onClose(); }}
                      className="w-full flex items-center gap-2.5 p-1.5 rounded hover:bg-[#2f71cd] hover:text-white transition text-left group"
                    >
                      <Icon name="SquareTerminal" size={24} className="text-slate-800 group-hover:text-white shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight">Command Prompt</div>
                        <div className="text-[10px] text-gray-500 group-hover:text-white/80 truncate">Liquid CLI & Terminal</div>
                      </div>
                    </button>

                    <div className="h-px bg-gray-300 my-1" />

                    {/* Frequent Programs */}
                    {[
                      { id: 'synth' as AppId, label: 'Monochrome Music', icon: 'Music', desc: 'Lossless Hi-Fi Audio' },
                      { id: 'notepad' as AppId, label: 'Notepad', icon: 'FileText', desc: 'Text Editor' },
                      { id: 'calculator' as AppId, label: 'Calculator', icon: 'Calculator', desc: 'Math & Formulas' },
                      { id: 'game' as AppId, label: 'Cosmic Velocity', icon: 'Gamepad2', desc: '3D Hovercraft Game' },
                      { id: 'appstore' as AppId, label: 'Windows Catalog', icon: 'Store', desc: 'Software Depot' },
                    ].map((app) => (
                      <button
                        key={app.id}
                        onClick={() => { openApp(app.id); onClose(); }}
                        className="w-full flex items-center gap-2.5 p-1.5 rounded hover:bg-[#2f71cd] hover:text-white transition text-left group"
                      >
                        <Icon name={app.icon} size={20} className="text-[#0055ea] group-hover:text-white shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight truncate">{app.label}</div>
                          <div className="text-[10px] text-gray-500 group-hover:text-white/80 truncate">{app.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* All Programs button with green arrow */}
                  <div className="pt-2 border-t border-gray-300">
                    <button
                      onClick={() => setAllProgramsView(!allProgramsView)}
                      className="w-full py-1.5 px-3 rounded hover:bg-[#2f71cd] hover:text-white font-bold text-xs flex items-center justify-center gap-2 text-black transition group"
                    >
                      <span>All Programs</span>
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">▶</span>
                    </button>
                  </div>
                </div>

                {/* Right Light Blue Column: System Folders & Tools */}
                <div className="w-48 bg-[#d3e5fa] p-2 flex flex-col justify-between text-[#001c54] font-medium text-xs">
                  <div className="space-y-1">
                    <button onClick={() => { openApp('explorer'); onClose(); }} className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-[#2f71cd] hover:text-white transition text-left font-bold">
                      <Icon name="Folder" size={16} className="text-amber-500" />
                      <span>My Documents</span>
                    </button>
                    <button onClick={() => { openApp('explorer'); onClose(); }} className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-[#2f71cd] hover:text-white transition text-left font-bold">
                      <Icon name="Image" size={16} className="text-sky-600" />
                      <span>My Pictures</span>
                    </button>
                    <button onClick={() => { openApp('synth'); onClose(); }} className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-[#2f71cd] hover:text-white transition text-left font-bold">
                      <Icon name="Music" size={16} className="text-orange-500" />
                      <span>My Music</span>
                    </button>
                    <button onClick={() => { openApp('explorer'); onClose(); }} className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-[#2f71cd] hover:text-white transition text-left font-bold">
                      <Icon name="HardDrive" size={16} className="text-slate-600" />
                      <span>My Computer</span>
                    </button>

                    <div className="h-px bg-[#a6c7ec] my-1" />

                    <button onClick={() => { openApp('settings'); onClose(); }} className="w-full flex items-center gap-2 p-1 rounded hover:bg-[#2f71cd] hover:text-white transition text-left">
                      <Icon name="Settings" size={14} className="text-slate-600" />
                      <span>Control Panel</span>
                    </button>
                    <button onClick={() => { openApp('sysmon'); onClose(); }} className="w-full flex items-center gap-2 p-1 rounded hover:bg-[#2f71cd] hover:text-white transition text-left">
                      <Icon name="Activity" size={14} className="text-emerald-600" />
                      <span>System Monitor</span>
                    </button>
                    <button onClick={() => { openApp('taskmanager'); onClose(); }} className="w-full flex items-center gap-2 p-1 rounded hover:bg-[#2f71cd] hover:text-white transition text-left">
                      <Icon name="Cpu" size={14} className="text-purple-600" />
                      <span>Task Manager</span>
                    </button>

                    <div className="h-px bg-[#a6c7ec] my-1" />

                    <button onClick={() => { openApp('browser'); onClose(); }} className="w-full flex items-center gap-2 p-1 rounded hover:bg-[#2f71cd] hover:text-white transition text-left">
                      <Icon name="Search" size={14} className="text-blue-600" />
                      <span>Search</span>
                    </button>
                    <button onClick={() => { openApp('terminal'); onClose(); }} className="w-full flex items-center gap-2 p-1 rounded hover:bg-[#2f71cd] hover:text-white transition text-left">
                      <Icon name="Play" size={14} className="text-indigo-600" />
                      <span>Run...</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Luna Blue Bottom Bar with Log Off & Turn Off */}
              <div className="h-12 bg-gradient-to-r from-[#0055ea] via-[#1062eb] to-[#3f88f8] px-3 flex items-center justify-end gap-3 text-white text-xs font-bold border-t border-white/20">
                <button
                  onClick={() => { onClose(); lockSystem(); }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-black/20 transition"
                >
                  <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-white">
                    <Icon name="Key" size={12} />
                  </div>
                  <span>Log Off</span>
                </button>
                <button
                  onClick={() => { onClose(); lockSystem(); }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-black/20 transition"
                >
                  <div className="w-5 h-5 rounded bg-rose-600 flex items-center justify-center text-white">
                    <Icon name="Power" size={12} />
                  </div>
                  <span>Turn Off Computer</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ==============================================================
              2. WINDOWS VISTA AERO GLASS START MENU
             ============================================================== */}
          {isVista && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.15 }}
              className="fixed bottom-10 left-2 z-50 rounded-lg shadow-2xl border border-sky-400/40 bg-slate-950/90 backdrop-blur-2xl overflow-hidden flex flex-col font-sans select-none text-white ring-1 ring-white/20"
              style={{ width: 440, height: 520 }}
            >
              {/* Glass Inner Body */}
              <div className="flex-1 flex min-h-0">
                {/* Left Pane (Programs + Live Search) */}
                <div className="flex-1 p-3 flex flex-col justify-between bg-black/40 border-r border-white/10">
                  <div className="space-y-1 overflow-y-auto">
                    {PINNED.slice(0, 7).map((app) => (
                      <button
                        key={app.appId}
                        onClick={() => { openApp(app.appId); onClose(); }}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/15 border border-transparent hover:border-sky-400/30 transition text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                          <Icon name={app.icon} size={18} className="text-sky-300" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{app.label}</div>
                          <div className="text-[10px] text-white/50 truncate">LiquidOS Vista Program</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Vista Instant Search Bar */}
                  <div className="pt-2 mt-2 border-t border-white/10">
                    <div className="flex items-center gap-2 bg-black/60 border border-sky-400/40 rounded-full px-3 py-1.5 focus-within:border-sky-300 focus-within:ring-1 focus-within:ring-sky-400">
                      <Icon name="Search" size={14} className="text-sky-400" />
                      <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Start Search"
                        className="bg-transparent text-xs text-white placeholder-white/40 outline-none w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Pane (Vista Aero shortcuts + User Icon) */}
                <div className="w-44 bg-gradient-to-b from-sky-950/40 to-black/60 p-3 flex flex-col justify-between text-xs text-white/80">
                  <div className="space-y-1.5">
                    {/* User profile picture */}
                    <div className="flex justify-end pb-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 p-0.5 shadow-lg border border-white/30">
                        <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center text-sky-300">
                          <Icon name="User" size={22} />
                        </div>
                      </div>
                    </div>

                    <button onClick={() => { openApp('explorer'); onClose(); }} className="w-full text-left py-1 hover:text-sky-300 font-semibold truncate">
                      {user?.name || 'Administrator'}
                    </button>
                    <button onClick={() => { openApp('explorer'); onClose(); }} className="w-full text-left py-1 hover:text-sky-300">Documents</button>
                    <button onClick={() => { openApp('explorer'); onClose(); }} className="w-full text-left py-1 hover:text-sky-300">Pictures</button>
                    <button onClick={() => { openApp('synth'); onClose(); }} className="w-full text-left py-1 hover:text-sky-300">Music</button>
                    <button onClick={() => { openApp('game'); onClose(); }} className="w-full text-left py-1 hover:text-sky-300">Games</button>
                    <div className="h-px bg-white/10 my-1" />
                    <button onClick={() => { openApp('explorer'); onClose(); }} className="w-full text-left py-1 hover:text-sky-300">Computer</button>
                    <button onClick={() => { openApp('settings'); onClose(); }} className="w-full text-left py-1 hover:text-sky-300">Control Panel</button>
                    <button onClick={() => { openApp('taskmanager'); onClose(); }} className="w-full text-left py-1 hover:text-sky-300">Task Manager</button>
                  </div>

                  {/* Vista Power / Lock Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => { onClose(); lockSystem(); }}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-600 text-white transition"
                      title="Shut Down"
                    >
                      <Icon name="Power" size={14} />
                    </button>
                    <button
                      onClick={() => { onClose(); lockSystem(); }}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-amber-600 text-white transition"
                      title="Lock System"
                    >
                      <Icon name="Lock" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==============================================================
              3. WINDOWS 10 HYBRID LIVE TILES START MENU
             ============================================================== */}
          {isWin10 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.15 }}
              className="fixed bottom-10 left-0 z-50 rounded-none shadow-2xl border border-zinc-700 bg-zinc-950/95 backdrop-blur-2xl flex font-sans select-none text-white"
              style={{ width: 620, height: 500 }}
            >
              {/* Left Rail (Power, Settings, User) */}
              <div className="w-12 bg-black/60 border-r border-zinc-800 flex flex-col justify-between items-center py-3">
                <button className="p-2 text-white/60 hover:text-white" title="Expand">
                  <Icon name="Menu" size={16} />
                </button>
                <div className="flex flex-col items-center gap-3">
                  <button onClick={() => { openApp('explorer'); onClose(); }} className="p-2 text-white/60 hover:text-white" title="Documents">
                    <Icon name="FileText" size={16} />
                  </button>
                  <button onClick={() => { openApp('settings'); onClose(); }} className="p-2 text-white/60 hover:text-white" title="Settings">
                    <Icon name="Settings" size={16} />
                  </button>
                  <button onClick={() => { onClose(); lockSystem(); }} className="p-2 text-rose-400 hover:text-rose-300" title="Power">
                    <Icon name="Power" size={16} />
                  </button>
                </div>
              </div>

              {/* Middle Apps List (Alphabetical) */}
              <div className="w-56 p-3 overflow-y-auto border-r border-zinc-800 space-y-1">
                <div className="text-[11px] font-bold text-cyan-400 px-2 py-1">All Apps</div>
                {PINNED.map((app) => (
                  <button
                    key={app.appId}
                    onClick={() => { openApp(app.appId); onClose(); }}
                    className="w-full flex items-center gap-2.5 p-2 rounded hover:bg-white/10 transition text-left"
                  >
                    <Icon name={app.icon} size={16} className="text-cyan-400 shrink-0" />
                    <span className="text-xs truncate">{app.label}</span>
                  </button>
                ))}
              </div>

              {/* Right Windows 10 Live Tiles Matrix */}
              <div className="flex-1 p-4 overflow-y-auto bg-black/30">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">Productivity & Play</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { openApp('browser'); onClose(); }}
                    className="h-20 bg-cyan-700/80 hover:bg-cyan-600 p-2.5 flex flex-col justify-between text-left transition group"
                  >
                    <Icon name="Globe" size={20} className="text-white group-hover:scale-110 transition" />
                    <span className="text-xs font-semibold truncate">Edge Browser</span>
                  </button>

                  <button
                    onClick={() => { openApp('synth'); onClose(); }}
                    className="h-20 bg-orange-600/80 hover:bg-orange-500 p-2.5 flex flex-col justify-between text-left transition group"
                  >
                    <Icon name="Music" size={20} className="text-white group-hover:scale-110 transition" />
                    <span className="text-xs font-semibold truncate">Groove Music</span>
                  </button>

                  <button
                    onClick={() => { openApp('game'); onClose(); }}
                    className="h-20 bg-purple-700/80 hover:bg-purple-600 p-2.5 flex flex-col justify-between text-left transition group"
                  >
                    <Icon name="Gamepad2" size={20} className="text-white group-hover:scale-110 transition" />
                    <span className="text-xs font-semibold truncate">Xbox Games</span>
                  </button>

                  <button
                    onClick={() => { openApp('calculator'); onClose(); }}
                    className="h-20 bg-emerald-700/80 hover:bg-emerald-600 p-2.5 flex flex-col justify-between text-left transition group"
                  >
                    <Icon name="Calculator" size={20} className="text-white group-hover:scale-110 transition" />
                    <span className="text-xs font-semibold truncate">Calculator</span>
                  </button>

                  <button
                    onClick={() => { openApp('calendar'); onClose(); }}
                    className="h-20 bg-blue-700/80 hover:bg-blue-600 p-2.5 flex flex-col justify-between text-left transition group"
                  >
                    <Icon name="Calendar" size={20} className="text-white group-hover:scale-110 transition" />
                    <span className="text-xs font-semibold truncate">Calendar</span>
                  </button>

                  <button
                    onClick={() => { openApp('appstore'); onClose(); }}
                    className="h-20 bg-rose-700/80 hover:bg-rose-600 p-2.5 flex flex-col justify-between text-left transition group"
                  >
                    <Icon name="Store" size={20} className="text-white group-hover:scale-110 transition" />
                    <span className="text-xs font-semibold truncate">Microsoft Store</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==============================================================
              4. SAMSUNG DEX APP DRAWER
             ============================================================== */}
          {isDeX && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.18 }}
              className="fixed bottom-12 left-3 z-50 rounded-2xl shadow-2xl border border-white/15 bg-zinc-900/95 backdrop-blur-2xl p-5 flex flex-col select-none text-white"
              style={{ width: 480, height: 460 }}
            >
              {/* DeX Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center font-bold text-black text-xs">
                    DeX
                  </div>
                  <span className="text-sm font-bold tracking-tight">Samsung DeX Apps</span>
                </div>
                <span className="text-[10px] text-white/50 font-mono">Galaxy Desktop Experience</span>
              </div>

              {/* DeX Search */}
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 mb-4 border border-white/10">
                <Icon name="Search" size={14} className="text-white/50" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search DeX apps..."
                  className="bg-transparent text-xs text-white placeholder-white/40 outline-none w-full"
                />
              </div>

              {/* DeX Apps Grid */}
              <div className="flex-1 grid grid-cols-4 gap-3 overflow-y-auto p-1">
                {filtered.map((app) => (
                  <button
                    key={app.appId}
                    onClick={() => launch(app)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 active:scale-95 transition group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600/30 to-blue-500/20 border border-white/15 flex items-center justify-center group-hover:scale-105 transition shadow-md">
                      <Icon name={app.icon} size={22} className="text-cyan-300" />
                    </div>
                    <span className="text-[11px] text-white/90 text-center truncate max-w-full font-medium">
                      {app.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ==============================================================
              5. CHROMEOS APP LAUNCHER
             ============================================================== */}
          {isChromeOS && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.18 }}
              className="fixed bottom-14 left-4 z-50 rounded-3xl shadow-2xl border border-white/10 bg-zinc-900/90 backdrop-blur-2xl p-5 flex flex-col select-none text-white"
              style={{ width: 520, height: 480 }}
            >
              {/* ChromeOS Search Pill */}
              <div className="flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-full px-4 py-2.5 mb-4 border border-white/10 transition">
                <div className="w-3.5 h-3.5 rounded-full bg-cyan-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your device, apps, web..."
                  className="bg-transparent text-xs text-white placeholder-white/40 outline-none w-full"
                />
                <Icon name="Mic" size={15} className="text-white/40" />
              </div>

              {/* Recent Apps Row */}
              <div className="text-[11px] font-semibold text-white/50 mb-2 px-1">Recent Apps</div>
              <div className="flex items-center justify-around bg-white/5 p-2 rounded-2xl mb-4 border border-white/5">
                {PINNED.slice(0, 5).map((app) => (
                  <button
                    key={app.appId}
                    onClick={() => { openApp(app.appId); onClose(); }}
                    className="flex flex-col items-center gap-1 p-1 hover:opacity-80 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-cyan-300">
                      <Icon name={app.icon} size={18} />
                    </div>
                    <span className="text-[10px] text-white/70 max-w-[50px] truncate">{app.label}</span>
                  </button>
                ))}
              </div>

              {/* All ChromeOS Apps Grid */}
              <div className="flex-1 grid grid-cols-5 gap-3 overflow-y-auto p-1">
                {filtered.map((app) => (
                  <button
                    key={app.appId}
                    onClick={() => launch(app)}
                    className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl hover:bg-white/10 active:scale-95 transition group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-white/15 to-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 transition shadow-sm">
                      <Icon name={app.icon} size={20} className="text-cyan-300" />
                    </div>
                    <span className="text-[10px] text-white/80 text-center truncate max-w-full">
                      {app.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ==============================================================
              6. ZORIN OS 17 ELEGANT START MENU
             ============================================================== */}
          {isZorin && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.18 }}
              className="fixed bottom-16 left-4 z-50 rounded-2xl shadow-2xl border border-sky-500/30 bg-slate-900/95 backdrop-blur-2xl flex overflow-hidden select-none text-white max-w-[calc(100vw-32px)]"
              style={{ width: Math.min(540, vw - 32), height: 490 }}
            >
              {/* Left Column: Apps Grid with Categories */}
              <div className="flex-1 flex flex-col p-4 border-r border-white/10 min-w-0">
                {/* Search */}
                <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 mb-3 border border-white/10">
                  <Icon name="Search" size={14} className="text-sky-400" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type to search apps..."
                    className="bg-transparent text-xs text-white placeholder-white/40 outline-none w-full"
                  />
                </div>

                {/* All Pinned Apps Grid */}
                <div className="flex-1 grid grid-cols-3 gap-2 overflow-y-auto pr-1">
                  {filtered.map((app) => (
                    <button
                      key={app.appId}
                      onClick={() => launch(app)}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 active:scale-95 transition group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/20 flex items-center justify-center group-hover:scale-105 transition shadow">
                        <Icon name={app.icon} size={18} className="text-sky-300" />
                      </div>
                      <span className="text-[11px] text-white/90 text-center truncate max-w-full font-medium">
                        {app.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Zorin Shortcuts Sidebar */}
              <div className="w-44 bg-black/40 p-4 flex flex-col justify-between shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 pb-3 mb-2 border-b border-white/10">
                    <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-black font-bold text-xs">
                      Z
                    </div>
                    <span className="text-xs font-bold">Zorin OS 17</span>
                  </div>

                  <button onClick={() => { openApp('explorer'); onClose(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/10 text-xs text-white/80 transition">
                    <Icon name="FolderOpen" size={14} className="text-sky-400" />
                    <span>Home Files</span>
                  </button>
                  <button onClick={() => { openApp('appstore'); onClose(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/10 text-xs text-white/80 transition">
                    <Icon name="Store" size={14} className="text-sky-400" />
                    <span>Software Store</span>
                  </button>
                  <button onClick={() => { openApp('weather'); onClose(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/10 text-xs text-white/80 transition">
                    <Icon name="CloudSun" size={14} className="text-sky-400" />
                    <span>Weather</span>
                  </button>
                  <button onClick={() => { openApp('clock'); onClose(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/10 text-xs text-white/80 transition">
                    <Icon name="Clock" size={14} className="text-sky-400" />
                    <span>Clocks & Alarms</span>
                  </button>
                  <button onClick={() => { openApp('settings'); onClose(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/10 text-xs text-white/80 transition">
                    <Icon name="Settings" size={14} className="text-sky-400" />
                    <span>System Settings</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-white/50 truncate">{user?.name || 'User'}</span>
                  <button
                    onClick={() => { onClose(); lockSystem(); }}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                    title="Power Off / Lock"
                  >
                    <Icon name="Power" size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==============================================================
              7. WINDOWS 11 / STANDARD MICA START MENU
             ============================================================== */}
          {!isXP && !isVista && !isWin10 && !isDeX && !isChromeOS && !isZorin && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="glass fixed z-50 rounded-2xl p-5 max-w-[calc(100vw-24px)]"
              style={{ left: menuLeft, bottom: 48, width: clampedWidth }}
            >
              {/* Header with AppLogo & OS Branding */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <AppLogo size={22} glow />
                  <span className="text-sm font-semibold tracking-wide text-white/95">LiquidOS-4.1.0-Beta</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">Windows 11</span>
                </div>
                <div className="text-[11px] text-white/50">Mica Glass Start</div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-4 focus-within:border-cyan-400/50 focus-within:bg-white/10 transition">
                <Icon name="Search" size={15} className="text-white/40" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search apps, files, settings..."
                  className="flex-1 bg-transparent text-sm text-white/90 outline-none placeholder:text-white/30"
                />
              </div>

              {/* Predictive search results */}
              {query.trim() && searchResults.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-white/50 mb-2 font-medium flex items-center gap-1">
                    <Icon name="Sparkles" size={11} className="text-cyan-300" /> Search results
                  </div>
                  <div className="space-y-1">
                    {searchResults.map((result, i) => (
                      <button
                        key={`${result.type}-${result.label}-${i}`}
                        onClick={() => launchSearchResult(result)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition text-left group"
                      >
                        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                          <Icon name={result.icon} size={15} className="text-cyan-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white/90 truncate">{result.label}</div>
                          <div className="text-[10px] text-white/40">
                            {result.type === 'app' ? 'Application' : `File · ${result.filePath?.join('/') ?? '/'}`}
                          </div>
                        </div>
                        <Icon name="ChevronRight" size={14} className="text-white/30 group-hover:text-white/60 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pinned apps */}
              <div className="text-xs text-white/50 mb-3 font-medium">Pinned</div>
              <div className="grid grid-cols-6 gap-2.5 mb-4 max-h-[260px] overflow-y-auto">
                {filtered.map((app) => (
                  <button
                    key={app.appId}
                    onClick={() => launch(app)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition group"
                  >
                    <div className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 group-hover:bg-white/15 transition-all">
                      <Icon name={app.icon} size={20} className="text-cyan-300" />
                    </div>
                    <span className="text-[10px] text-white/80 text-center leading-tight truncate max-w-full">{app.label}</span>
                  </button>
                ))}
              </div>

              {/* User + power */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shadow-md">
                    <Icon name="User" size={16} />
                  </div>
                  <div className="text-xs text-white/90 font-medium">{user?.name || 'Administrator'}</div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    lockSystem();
                  }}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
                  title="Lock / Sleep"
                >
                  <Icon name="Power" size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
