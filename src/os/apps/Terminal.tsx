import { useState, useRef, useEffect } from 'react';
import { useOS } from '../OSContext';

interface Line {
  type: 'input' | 'output';
  text: string;
}

const BANNER = `LiquidOS Terminal [Version 4.0.0-Release]
(c) LiquidOS Foundation. All rights reserved.
Kernel: Liquid-X Compositor (#glass-distortion)
Type 'help' for a full list of system commands.`;

const MOCK_WEATHER = [
  { city: 'New York', temp: '72°F', cond: 'Partly cloudy', wind: '8 mph SW' },
  { city: 'London', temp: '61°F', cond: 'Light rain', wind: '12 mph W' },
  { city: 'Tokyo', temp: '79°F', cond: 'Clear skies', wind: '6 mph NE' },
  { city: 'Paris', temp: '68°F', cond: 'Sunny', wind: '5 mph S' },
];

function tryEval(expr: string): string | null {
  try {
    const sanitized = expr.replace(/[^-()\d/*+.%\s]/g, '');
    if (!sanitized.trim()) return null;
    if (sanitized.includes('//')) return null;
    const result = Function(`"use strict"; return (${sanitized})`)();
    if (typeof result === 'number' && isFinite(result)) {
      return String(Math.round(result * 1e10) / 1e10);
    }
    return null;
  } catch {
    return null;
  }
}

export function TerminalApp() {
  const { fileSystem, openApp, lockSystem, setWallpaper, setShellMode, windows, closeWindow } = useOS();
  const [lines, setLines] = useState<Line[]>([
    { type: 'output', text: BANNER },
    { type: 'output', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<string[]>([]);
  const histIdx = useRef(-1);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines]);

  const print = (text: string) => setLines((l) => [...l, { type: 'output', text }]);

  const runCommand = (raw: string) => {
    const cmd = raw.trim();
    setLines((l) => [...l, { type: 'input', text: `${prompt()} ${cmd}` }]);
    if (!cmd) return;
    historyRef.current = [cmd, ...historyRef.current].slice(0, 50);
    histIdx.current = -1;

    const [name, ...args] = cmd.split(/\s+/);
    switch (name.toLowerCase()) {
      case 'help':
        print('LiquidOS v4.0.0 Command Suite:');
        print('  help               Show this help index');
        print('  clear              Clear the terminal screen');
        print('  ls                 List directory contents');
        print('  cd <dir>           Change working directory');
        print('  pwd                Print working directory');
        print('  cat <file>         Output contents of a virtual text file');
        print('  date               Show current system timestamp');
        print('  whoami             Print current authenticated user');
        print('  uname -a           Print kernel & architecture specifications');
        print('  echo <text>        Print text to standard output');
        print('  ps / top           List active window processes');
        print('  kill <id>          Terminate a running window instance');
        print('  shell <mode>       Switch OS shell (windows, mac, ubuntu, android, ios, metro)');
        print('  open <app>         Launch application (calculator, taskmanager, game, etc.)');
        print('  neofetch           Display system diagnostics & ASCII logo');
        print('  sysinfo            Display hardware specs & memory usage');
        print('  weather [city]     Realtime mock meteorological status');
        print('  calc <expr>        Evaluate mathematical equation');
        print('  theme <name>       Switch live wallpaper');
        print('  history            View command history list');
        print('  lock / sleep       Lock workstation screen');
        break;
      case 'clear':
        setLines([]);
        return;
      case 'uname':
        print('LiquidOS 4.0.0-cosmic #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux (Liquid-X Compositor)');
        break;
      case 'ps':
      case 'top': {
        print('PID    PROCESS NAME             STATE       MEMORY');
        print('--------------------------------------------------');
        print('1      liquid-init              Running     32 MB');
        print('2      liquid-dwm (Compositor)  Running     96 MB');
        windows.forEach((w, idx) => {
          print(`${100 + idx}    ${w.title.padEnd(24, ' ')} ${w.minimized ? 'Suspended' : 'Running'}   48 MB`);
        });
        break;
      }
      case 'kill': {
        const target = args[0];
        if (!target) { print('kill: specify process PID or title substring'); break; }
        const win = windows.find((w, i) => String(100 + i) === target || w.title.toLowerCase().includes(target.toLowerCase()));
        if (win) {
          closeWindow(win.id);
          print(`Process '${win.title}' (ID: ${win.id}) terminated.`);
        } else {
          print(`kill: process '${target}' not found.`);
        }
        break;
      }
      case 'shell': {
        const targetShell = args[0]?.toLowerCase();
        const validShells = ['windows', 'mac', 'ubuntu', 'android', 'ios', 'metro'];
        if (targetShell && validShells.includes(targetShell)) {
          setShellMode(targetShell as never);
          print(`[SYSTEM] Switched active shell mode to: ${targetShell.toUpperCase()}`);
        } else {
          print(`shell: unknown shell '${args[0] ?? ''}'. Available: ${validShells.join(', ')}`);
        }
        break;
      }
      case 'cat': {
        const filename = args[0];
        if (!filename) { print('cat: specify file name'); break; }
        let folder = fileSystem;
        for (const seg of cwd) {
          const next = folder.children.find((c) => c.name === seg && c.kind === 'folder');
          if (!next || next.kind !== 'folder') break;
          folder = next;
        }
        const file = folder.children.find((c) => c.name.toLowerCase() === filename.toLowerCase() && c.kind === 'file');
        if (file && file.kind === 'file') {
          print(file.content);
        } else {
          print(`cat: ${filename}: No such file`);
        }
        break;
      }
      case 'sudo':
        if (args.join(' ').includes('apt update') || args.join(' ').includes('apt upgrade')) {
          print('Hit:1 https://packages.liquidos.org/release v4.0.0 InRelease');
          print('Get:2 https://security.liquidos.org/updates core-security [1,048 kB]');
          print('Fetched 1,048 kB in 0.12s (8,733 kB/s)');
          print('All system packages are up to date (0 upgradable).');
        } else {
          print(`[sudo] executed command: ${args.join(' ')} with root privilege.`);
        }
        break;
      case 'ls': {
        let folder = fileSystem;
        for (const seg of cwd) {
          const next = folder.children.find((c) => c.name === seg && c.kind === 'folder');
          if (!next || next.kind !== 'folder') { print('ls: cannot access path'); break; }
          folder = next;
        }
        const items = folder.children.map((c) =>
          c.kind === 'folder' ? `📁 ${c.name}` : `📄 ${c.name}`
        );
        print(items.length ? items.join('   ') : '(empty)');
        break;
      }
      case 'cd': {
        if (!args[0] || args[0] === '/') { setCwd([]); break; }
        if (args[0] === '..') { setCwd((c) => c.slice(0, -1)); break; }
        const target = args[0];
        let folder = fileSystem;
        for (const seg of cwd) {
          const next = folder.children.find((c) => c.name === seg && c.kind === 'folder');
          if (!next || next.kind !== 'folder') break;
          folder = next;
        }
        const found = folder.children.find(
          (c) => c.name.toLowerCase() === target.toLowerCase() && c.kind === 'folder'
        );
        if (found) setCwd((c) => [...c, found.name]);
        else print(`cd: no such directory: ${target}`);
        break;
      }
      case 'pwd':
        print('/' + cwd.join('/'));
        break;
      case 'date':
        print(new Date().toString());
        break;
      case 'whoami':
        print('liquid-administrator (uid=1000 gid=1000)');
        break;
      case 'echo':
        print(args.join(' '));
        break;
      case 'about':
        print('LiquidOS v4.0.0 — High-density Web Operating System.');
        print('Refined with SVG Displacement Refraction (#glass-distortion).');
        print('Multi-OS Shell Architecture (Windows, macOS, Ubuntu, Android, iOS, Metro).');
        break;
      case 'open': {
        const valid = ['explorer', 'browser', 'settings', 'notepad', 'terminal', 'game', 'appstore', 'calculator', 'taskmanager', 'sysmon', 'calendar', 'synth'];
        const app = args[0]?.toLowerCase();
        if (app && valid.includes(app)) {
          openApp(app as never);
          print(`[OK] Launching application process: ${app}`);
        } else {
          print(`open: unknown app '${args[0] ?? ''}'. Available: ${valid.join(', ')}`);
        }
        break;
      }
      case 'neofetch':
        print('       .---.        liquid@liquidos-v4');
        print('      /     \\       ------------------');
        print('     | () () |      OS: LiquidOS v4.0.0 Titanium Edition');
        print('      \\  _  /       Host: WebGL 2.0 Browser Container');
        print('       `---\'        Kernel: Liquid-X (#glass-distortion)');
        print('    /|     |\\       Uptime: ' + Math.floor(performance.now() / 1000) + ' seconds');
        print('   / |     | \\      Shell: LiquidBash 5.2.15');
        print('  /  |_____|  \\     Display: ' + window.innerWidth + 'x' + window.innerHeight);
        print(' `---`     `---`    WM: Liquid Glass Compositor (DWM)');
        break;
      case 'sysinfo': {
        print('=== LiquidOS v4.0.0 System Telemetry ===');
        print(`Architecture: 64-bit Virtual Runtime (TypeScript 5.5 + Vite)`);
        print(`CPU Cores:    ${navigator.hardwareConcurrency ?? '8'} logical processors`);
        print(`Compositor:   True Liquid Glass (SVG #glass-distortion)`);
        print(`Resolution:   ${window.innerWidth}x${window.innerHeight} @ 60Hz`);
        print(`Uptime:       ${Math.floor(performance.now() / 1000)}s`);
        break;
      }
      case 'weather': {
        const cityArg = args.join(' ')?.toLowerCase();
        const match = cityArg
          ? MOCK_WEATHER.find((w) => w.city.toLowerCase().includes(cityArg))
          : MOCK_WEATHER[0];
        if (match) {
          print(`Weather: ${match.city}`);
          print(`  Temp: ${match.temp}`);
          print(`  Cond: ${match.cond}`);
          print(`  Wind: ${match.wind}`);
        } else {
          print(`weather: city '${args.join(' ')}' not found. Try: ${MOCK_WEATHER.map((w) => w.city).join(', ')}`);
        }
        break;
      }
      case 'calc': {
        const expr = args.join(' ');
        if (!expr) { print('calc: no expression provided. Usage: calc 2+2*3'); break; }
        const result = tryEval(expr);
        if (result !== null) {
          print(`${expr} = ${result}`);
        } else {
          print(`calc: invalid expression '${expr}'`);
        }
        break;
      }
      case 'theme': {
        const validThemes = ['space', 'aurora', 'sunset', 'ocean', 'forest', 'cosmic', 'bloom', 'shader'];
        const themeName = args[0]?.toLowerCase();
        if (themeName && validThemes.includes(themeName)) {
          setWallpaper(themeName as never);
          print(`Theme switched to: ${themeName}`);
        } else {
          print(`theme: unknown theme '${args[0] ?? ''}'. Try: ${validThemes.join(', ')}`);
        }
        break;
      }
      case 'history': {
        if (historyRef.current.length === 0) { print('No command history yet.'); break; }
        print('Command history (most recent first):');
        historyRef.current.forEach((h, i) => print(`  ${i + 1}  ${h}`));
        break;
      }
      case 'lock':
        print('Locking system...');
        lockSystem();
        break;
      case 'sleep':
        print('Entering cosmic sleep mode...');
        lockSystem();
        break;
      default:
        print(`${name}: command not found. Type 'help'.`);
    }
  };

  const prompt = () => 'liquid@os:' + (cwd.length ? '/' + cwd.join('/') : '~') + '$';

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      runCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyRef.current.length === 0) return;
      histIdx.current = Math.min(histIdx.current + 1, historyRef.current.length - 1);
      setInput(historyRef.current[histIdx.current] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      histIdx.current = Math.max(histIdx.current - 1, -1);
      setInput(histIdx.current === -1 ? '' : historyRef.current[histIdx.current] ?? '');
    }
  };

  return (
    <div
      className="h-full w-full min-w-0 min-h-0 bg-black/70 backdrop-blur-xl font-mono text-sm text-green-300/90 p-3 overflow-auto"
      ref={scrollRef}
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((l, i) => (
        <div key={i} className="whitespace-pre-wrap leading-relaxed">
          {l.type === 'input' ? (
            <span className="text-cyan-300">{l.text}</span>
          ) : (
            <span>{l.text}</span>
          )}
        </div>
      ))}
      <div className="flex items-center">
        <span className="text-cyan-300 whitespace-pre">{prompt()} </span>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 bg-transparent outline-none border-none text-green-300/90 caret-green-300"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
