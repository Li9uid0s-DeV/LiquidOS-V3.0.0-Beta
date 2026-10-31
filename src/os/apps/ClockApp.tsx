import { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from '../Icon';
import { useOS } from '../OSContext';

type Tab = 'clock' | 'alarm' | 'stopwatch' | 'timer';

interface AlarmItem {
  id: string;
  time: string; // '07:30'
  label: string;
  enabled: boolean;
  days: string[]; // ['Mon', 'Tue', ...]
  sound: 'chime' | 'pulse' | 'cosmic' | 'radar';
}

const INITIAL_ALARMS: AlarmItem[] = [
  { id: 'alarm-1', time: '07:00', label: 'Morning Wakeup', enabled: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], sound: 'chime' },
  { id: 'alarm-2', time: '09:00', label: 'Orbital Standup', enabled: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], sound: 'radar' },
  { id: 'alarm-3', time: '23:30', label: 'Night Sleep Mode', enabled: false, days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'], sound: 'cosmic' },
];

const WORLD_CITIES = [
  { city: 'Tokyo', country: 'Japan', timeZone: 'Asia/Tokyo' },
  { city: 'New York', country: 'United States', timeZone: 'America/New_York' },
  { city: 'London', country: 'United Kingdom', timeZone: 'Europe/London' },
  { city: 'Paris', country: 'France', timeZone: 'Europe/Paris' },
  { city: 'San Francisco', country: 'United States', timeZone: 'America/Los_Angeles' },
  { city: 'Sydney', country: 'Australia', timeZone: 'Australia/Sydney' },
];

export function ClockApp() {
  const { playSound, addNotification, triggerDynamicIsland } = useOS();
  const [activeTab, setActiveTab] = useState<Tab>('clock');
  const [now, setNow] = useState(new Date());

  // Clock Ticker
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Synthetic Web Audio Tone Player for Alarms & Timer
  const playAlarmSound = (soundType: 'chime' | 'pulse' | 'cosmic' | 'radar') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const t = ctx.currentTime;
      if (soundType === 'chime') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, t); // C5
        osc.frequency.setValueAtTime(659.25, t + 0.15); // E5
        osc.frequency.setValueAtTime(783.99, t + 0.3); // G5
        osc.frequency.setValueAtTime(1046.5, t + 0.45); // C6
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 1.2);
        osc.start(t);
        osc.stop(t + 1.2);
      } else if (soundType === 'radar') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.25);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.25);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.setValueAtTime(880, t + 0.1);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.6);
        osc.start(t);
        osc.stop(t + 0.6);
      }
    } catch {
      // Audio might require user interaction
    }
  };

  // -------------------------------------------------------------
  // 1. ALARMS STATE & LOGIC
  // -------------------------------------------------------------
  const [alarms, setAlarms] = useState<AlarmItem[]>(() => {
    try {
      const saved = localStorage.getItem('liquid-alarms');
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore storage error */
    }
    return INITIAL_ALARMS;
  });

  const [newAlarmTime, setNewAlarmTime] = useState('08:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('New Alarm');
  const [newAlarmSound, setNewAlarmSound] = useState<'chime' | 'pulse' | 'cosmic' | 'radar'>('chime');
  const [isAddingAlarm, setIsAddingAlarm] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('liquid-alarms', JSON.stringify(alarms));
    } catch {
      /* ignore storage error */
    }
  }, [alarms]);

  // Check Alarms every minute
  const checkedMinuteRef = useRef<string>('');
  useEffect(() => {
    const currentHM = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    if (checkedMinuteRef.current !== currentHM) {
      checkedMinuteRef.current = currentHM;
      alarms.forEach((a) => {
        if (a.enabled && a.time === currentHM) {
          playAlarmSound(a.sound);
          addNotification({
            title: `⏰ Alarm: ${a.label}`,
            message: `It is now ${a.time}. Alarm is ringing!`,
            icon: 'AlarmClock',
          });
          triggerDynamicIsland(a.label, `Alarm ${a.time}`, 'AlarmClock');
        }
      });
    }
  }, [now, alarms, addNotification, triggerDynamicIsland]);

  const toggleAlarm = (id: string) => {
    playSound('click');
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const deleteAlarm = (id: string) => {
    playSound('click');
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const addAlarm = () => {
    if (!newAlarmTime) return;
    playSound('open');
    const newAlarm: AlarmItem = {
      id: `alarm-${Date.now()}`,
      time: newAlarmTime,
      label: newAlarmLabel || 'Alarm',
      enabled: true,
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      sound: newAlarmSound,
    };
    setAlarms((prev) => [...prev, newAlarm]);
    setIsAddingAlarm(false);
    triggerDynamicIsland(newAlarm.label, `Alarm set for ${newAlarm.time}`, 'AlarmClock');
  };

  // -------------------------------------------------------------
  // 2. STOPWATCH STATE & LOGIC
  // -------------------------------------------------------------
  const [swRunning, setSwRunning] = useState(false);
  const [swTime, setSwTime] = useState(0); // milliseconds
  const swTimeRef = useRef(0);
  swTimeRef.current = swTime;
  const [laps, setLaps] = useState<{ id: number; time: number; delta: number }[]>([]);
  const swTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (swRunning) {
      const start = Date.now() - swTimeRef.current;
      swTimerRef.current = window.setInterval(() => {
        setSwTime(Date.now() - start);
      }, 10);
    } else {
      if (swTimerRef.current) clearInterval(swTimerRef.current);
    }
    return () => {
      if (swTimerRef.current) clearInterval(swTimerRef.current);
    };
  }, [swRunning]);

  const formatStopwatch = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  const recordLap = () => {
    playSound('click');
    const lastLapTime = laps.length > 0 ? laps[0].time : 0;
    const delta = swTime - lastLapTime;
    setLaps([{ id: laps.length + 1, time: swTime, delta }, ...laps]);
  };

  const resetStopwatch = () => {
    playSound('click');
    setSwRunning(false);
    setSwTime(0);
    setLaps([]);
  };

  // -------------------------------------------------------------
  // 3. TIMER STATE & LOGIC
  // -------------------------------------------------------------
  const [timerDuration, setTimerDuration] = useState(5 * 60); // 5 mins in seconds
  const [timerRemaining, setTimerRemaining] = useState(5 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setTimerRunning(false);
            playAlarmSound('chime');
            addNotification({
              title: '⏳ Timer Finished!',
              message: 'Your countdown timer has completed.',
              icon: 'Timer',
            });
            triggerDynamicIsland('Timer Completed', '00:00', 'Timer');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning, addNotification, triggerDynamicIsland]);

  const setTimerPreset = (secs: number) => {
    playSound('click');
    setTimerRunning(false);
    setTimerDuration(secs);
    setTimerRemaining(secs);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = useMemo(() => {
    if (timerDuration === 0) return 0;
    return ((timerDuration - timerRemaining) / timerDuration) * 100;
  }, [timerDuration, timerRemaining]);

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 text-white select-none overflow-hidden">
      {/* Top Tabs Switcher */}
      <div className="h-14 px-4 bg-slate-900/80 border-b border-white/10 flex items-center justify-between shrink-0 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Icon name="Clock" size={18} className="text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white hidden sm:inline">Chrono & Alarms</span>
        </div>

        {/* Tab Buttons with touch hit areas */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => { playSound('click'); setActiveTab('clock'); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'clock' ? 'bg-cyan-500 text-black shadow-md' : 'text-white/70 hover:text-white'
            }`}
          >
            <Icon name="Globe" size={14} />
            <span>World Clock</span>
          </button>

          <button
            onClick={() => { playSound('click'); setActiveTab('alarm'); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'alarm' ? 'bg-cyan-500 text-black shadow-md' : 'text-white/70 hover:text-white'
            }`}
          >
            <Icon name="AlarmClock" size={14} />
            <span>Alarms</span>
          </button>

          <button
            onClick={() => { playSound('click'); setActiveTab('stopwatch'); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'stopwatch' ? 'bg-cyan-500 text-black shadow-md' : 'text-white/70 hover:text-white'
            }`}
          >
            <Icon name="Timer" size={14} />
            <span>Stopwatch</span>
          </button>

          <button
            onClick={() => { playSound('click'); setActiveTab('timer'); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'timer' ? 'bg-cyan-500 text-black shadow-md' : 'text-white/70 hover:text-white'
            }`}
          >
            <Icon name="Clock" size={14} />
            <span>Timer</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* ========================================================
            TAB 1: WORLD CLOCK
           ======================================================== */}
        {activeTab === 'clock' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Main Primary Local Clock Banner */}
            <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-cyan-950/50 border border-cyan-500/20 backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
              <div>
                <div className="text-xs font-mono text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Primary System Time
                </div>
                <div className="text-5xl sm:text-7xl font-extralight tracking-tight text-white mt-2 tabular-nums">
                  {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-sm text-white/60 mt-1">
                  {now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Analog Clock Dial */}
              <div className="w-28 h-28 rounded-full border-2 border-cyan-400/40 relative flex items-center justify-center shadow-xl bg-slate-900/80">
                {/* 12 notches */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <div
                    key={deg}
                    className="absolute w-0.5 h-2 bg-cyan-300/40"
                    style={{ transform: `rotate(${deg}deg) translateY(-48px)` }}
                  />
                ))}
                {/* Hour */}
                <div
                  className="absolute w-1 h-8 bg-white rounded-full origin-bottom"
                  style={{ transform: `rotate(${(now.getHours() % 12 + now.getMinutes() / 60) * 30}deg) translateY(-50%)` }}
                />
                {/* Minute */}
                <div
                  className="absolute w-0.5 h-10 bg-cyan-300 rounded-full origin-bottom"
                  style={{ transform: `rotate(${now.getMinutes() * 6}deg) translateY(-50%)` }}
                />
                {/* Second */}
                <div
                  className="absolute w-0.5 h-11 bg-rose-500 rounded-full origin-bottom"
                  style={{ transform: `rotate(${now.getSeconds() * 6}deg) translateY(-40%)` }}
                />
                <div className="w-2 h-2 rounded-full bg-white z-10" />
              </div>
            </div>

            {/* Global World Cities Matrix */}
            <div>
              <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3 px-1">
                Global Orbital Clocks
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {WORLD_CITIES.map((c) => {
                  const cityTime = new Date().toLocaleTimeString([], {
                    timeZone: c.timeZone,
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <div
                      key={c.city}
                      className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 hover:border-cyan-400/30 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white text-base">{c.city}</div>
                        <div className="text-xs text-white/50">{c.country}</div>
                      </div>
                      <div className="text-2xl font-mono text-cyan-300 font-light tabular-nums">
                        {cityTime}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: ALARMS
           ======================================================== */}
        {activeTab === 'alarm' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Configured Alarms</span>
              <button
                onClick={() => setIsAddingAlarm(!isAddingAlarm)}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
              >
                <Icon name="Plus" size={14} />
                <span>Add Alarm</span>
              </button>
            </div>

            {/* Add Alarm Form Drawer */}
            {isAddingAlarm && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-400/40 space-y-4 backdrop-blur-xl shadow-2xl">
                <div className="text-sm font-bold text-cyan-300">Set New Alarm</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-white/60 block mb-1">Time (24h)</label>
                    <input
                      type="time"
                      value={newAlarmTime}
                      onChange={(e) => setNewAlarmTime(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-mono text-sm outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/60 block mb-1">Label</label>
                    <input
                      type="text"
                      value={newAlarmLabel}
                      onChange={(e) => setNewAlarmLabel(e.target.value)}
                      placeholder="e.g. Flight Departure"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/60 block mb-1">Chime Tone</label>
                    <div className="flex gap-2">
                      <select
                        value={newAlarmSound}
                        onChange={(e) => setNewAlarmSound(e.target.value as 'chime' | 'pulse' | 'cosmic' | 'radar')}
                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none"
                      >
                        <option value="chime">Harmonic Chime</option>
                        <option value="radar">Orbital Radar</option>
                        <option value="pulse">Pulse Alarm</option>
                        <option value="cosmic">Cosmic Echo</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => playAlarmSound(newAlarmSound)}
                        className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300"
                        title="Preview Audio"
                      >
                        <Icon name="Volume2" size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsAddingAlarm(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addAlarm}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold"
                  >
                    Save Alarm
                  </button>
                </div>
              </div>
            )}

            {/* List of Alarms */}
            <div className="space-y-3">
              {alarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition flex items-center justify-between ${
                    alarm.enabled
                      ? 'bg-slate-900/70 border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                      : 'bg-slate-900/30 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleAlarm(alarm.id)}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                        alarm.enabled ? 'bg-cyan-500' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          alarm.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    <div>
                      <div className="text-3xl sm:text-4xl font-extralight text-white font-mono tabular-nums">
                        {alarm.time}
                      </div>
                      <div className="text-xs text-white/70 font-medium mt-0.5 flex items-center gap-2">
                        <span>{alarm.label}</span>
                        <span className="text-[10px] text-cyan-300/60 font-mono">({alarm.sound})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playAlarmSound(alarm.sound)}
                      className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-cyan-300 transition"
                      title="Test Tone"
                    >
                      <Icon name="Volume2" size={16} />
                    </button>
                    <button
                      onClick={() => deleteAlarm(alarm.id)}
                      className="p-2 rounded-xl hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition"
                      title="Delete"
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: STOPWATCH
           ======================================================== */}
        {activeTab === 'stopwatch' && (
          <div className="max-w-xl mx-auto flex flex-col items-center justify-center space-y-8 py-4">
            {/* Big Stopwatch Display */}
            <div className="text-center">
              <div className="text-6xl sm:text-7xl font-extralight font-mono tracking-tight text-white tabular-nums drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                {formatStopwatch(swTime)}
              </div>
              <div className="text-xs text-cyan-400/70 font-mono uppercase tracking-widest mt-2">
                Precision Millisecond Timer
              </div>
            </div>

            {/* Action Buttons (Large Touch Targets) */}
            <div className="flex items-center gap-4">
              <button
                onClick={resetStopwatch}
                className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center justify-center transition active:scale-95"
              >
                Reset
              </button>

              <button
                onClick={() => { playSound('click'); setSwRunning(!swRunning); }}
                className={`w-20 h-20 rounded-full font-bold text-base flex items-center justify-center transition active:scale-95 shadow-xl ${
                  swRunning ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30' : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-cyan-400/30'
                }`}
              >
                {swRunning ? 'Stop' : 'Start'}
              </button>

              <button
                onClick={recordLap}
                disabled={!swRunning}
                className={`w-16 h-16 rounded-full font-semibold flex items-center justify-center transition active:scale-95 ${
                  swRunning ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                Lap
              </button>
            </div>

            {/* Lap Table */}
            {laps.length > 0 && (
              <div className="w-full max-h-56 overflow-y-auto rounded-2xl bg-slate-900/60 border border-white/10 p-3 space-y-1">
                {laps.map((lap) => (
                  <div key={lap.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 text-xs font-mono">
                    <span className="text-white/50">Lap {lap.id}</span>
                    <span className="text-cyan-300 font-bold">+{formatStopwatch(lap.delta)}</span>
                    <span className="text-white">{formatStopwatch(lap.time)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 4: TIMER
           ======================================================== */}
        {activeTab === 'timer' && (
          <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-6 py-2">
            {/* Circular Progress Ring */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="#06b6d4"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="691"
                  strokeDashoffset={691 - (691 * progressPercent) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>

              <div className="absolute flex flex-col items-center">
                <div className="text-5xl font-extralight font-mono tracking-tight text-white tabular-nums">
                  {formatTimer(timerRemaining)}
                </div>
                <div className="text-xs text-white/50 font-mono mt-1">
                  {timerRunning ? 'Countdown Active' : 'Paused / Ready'}
                </div>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: '1 min', s: 60 },
                { label: '3 min', s: 180 },
                { label: '5 min', s: 300 },
                { label: '10 min', s: 600 },
                { label: '25 min (Pomodoro)', s: 1500 },
              ].map((p) => (
                <button
                  key={p.s}
                  onClick={() => setTimerPreset(p.s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    timerDuration === p.s ? 'bg-cyan-500 text-black font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTimerPreset(timerDuration)}
                className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-sm font-semibold transition"
              >
                Reset
              </button>

              <button
                onClick={() => { playSound('click'); setTimerRunning(!timerRunning); }}
                className={`px-8 py-3 rounded-2xl font-bold text-sm transition shadow-lg ${
                  timerRunning
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/30'
                }`}
              >
                {timerRunning ? 'Pause' : 'Start Timer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
