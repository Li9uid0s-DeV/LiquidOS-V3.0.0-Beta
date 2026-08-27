import { useState, useRef, useEffect } from 'react';
import { useOS } from '../OSContext';

interface Line {
  type: 'input' | 'output';
  text: string;
}

const BANNER = `Liquid OS Terminal [Version 2.0.0]
(c) Liquid Corporation. All rights reserved.
Type 'help' for a list of commands.`;

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
    // eslint-disable-next-line no-new-func
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
  const { fileSystem, openApp, lockSystem, setWallpaper } = useOS();
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
        print('Available commands:');
        print('  help        Show this help message');
        print('  clear       Clear the terminal screen');
        print('  ls          List directory contents');
        print('  cd <dir>    Change directory');
        print('  pwd         Print working directory');
        print('  date        Show current date and time');
        print('  whoami      Print current user');
        print('  echo <t>    Print text');
        print('  about       About Liquid OS');
        print('  open <app>  Open an app');
        print('  neofetch    System information with ASCII art');
        print('  sysinfo     Display virtual system specifications');
        print('  weather [city]  Mock weather forecast');
        print('  calc <expr>  Evaluate a math expression');
        print('  theme <name>  Switch wallpaper theme');
        print('  history     Show command history');
        print('  lock        Lock the system');
        print('  sleep       Put the system to sleep');
        break;
      case 'clear':
        setLines([]);
        return;
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
          (c) => c.name === target && c.kind === 'folder'
        );
        if (found) setCwd((c) => [...c, target]);
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
        print('liquid-user');
        break;
      case 'echo':
        print(args.join(' '));
        break;
      case 'about':
        print('Liquid OS — a web-based desktop environment.');
        print('Built with React, TypeScript, Tailwind CSS & Framer Motion.');
        print('UI style: Liquid Glass (advanced Glassmorphism with SVG refraction).');
        break;
      case 'open': {
        const valid = ['explorer', 'browser', 'settings', 'notepad', 'terminal', 'game', 'appstore'];
        const app = args[0]?.toLowerCase();
        if (app && valid.includes(app)) {
          openApp(app as 'explorer' | 'browser' | 'settings' | 'notepad' | 'game' | 'appstore');
          print(`Opening ${app}...`);
        } else {
          print(`open: unknown app '${args[0] ?? ''}'. Try: ${valid.join(', ')}`);
        }
        break;
      }
      case 'neofetch':
        print('       .--.        liquid-user@liquid-os');
        print('      |o_o |       ----------------------');
        print('      |:_/ |       OS: Liquid OS 2.0.0 (Glass)');
        print('     //   \\ \\      Shell: Liquid Shell');
        print('    (|     | )     UI: Liquid Glass SVG Refraction');
        print('   /\'\\_   _/`\\     Resolution: ' + window.innerWidth + 'x' + window.innerHeight);
        print('   \\___)=(___/     Theme: Glassmorphism');
        break;
      case 'sysinfo': {
        print('=== System Information ===');
        print(`OS:           Liquid OS 2.0.0 (Glass)`);
        print(`Kernel:       React 18.3 + TypeScript 5.5`);
        print(`CPU:          ${navigator.hardwareConcurrency ?? 'Unknown'} cores`);
        print(`Memory:       ${(navigator as Navigator & { deviceMemory?: number }).deviceMemory ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory + ' GB' : 'Unknown'}`);
        print(`Resolution:   ${window.innerWidth}x${window.innerHeight}`);
        print(`GPU:          WebGL ${(() => { try { const c = document.createElement('canvas'); return !!c.getContext('webgl2') ? '2.0' : '1.0'; } catch { return 'N/A'; } })()}`);
        print(`Browser:      ${navigator.userAgent.split(' ').pop() ?? 'Unknown'}`);
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
