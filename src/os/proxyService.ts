// -------------------------------------------------------------------------
// LiquidOS Proxy Engine Service (Scramjet & Ultraviolet) & Monochrome Music
// -------------------------------------------------------------------------

export type ProxyEngine = 'scramjet' | 'ultraviolet' | 'direct';

export interface ProxySession {
  engine: ProxyEngine;
  status: 'connected' | 'connecting' | 'idle';
  latencyMs: number;
  cipher: string;
  bytesReceived: number;
  bytesSent: number;
  bareServerUrl: string;
  activeTunnels: number;
  logs: { time: string; engine: ProxyEngine; text: string }[];
}

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface MonochromeTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverGradient: string;
  coverAccent: string;
  duration: number; // in seconds
  format: string;
  bitrate: string;
  genre: string;
  year: number;
  lyrics: LyricLine[];
  // Musical synthesis parameters for Web Audio fallback engine
  synthParams: {
    tempo: number; // BPM
    rootFreq: number; // e.g. 55 Hz (A1)
    chords: number[][]; // chord frequencies
    bassFreqs: number[];
    leadType: 'sine' | 'triangle' | 'sawtooth';
    filterCutoff: number;
  };
}

// -------------------------------------------------------------------------
// Ultraviolet (UV) & Scramjet URL Encoding Helpers
// -------------------------------------------------------------------------
export function encodeUltraviolet(url: string): string {
  // Ultraviolet XOR key encoding
  if (!url) return '';
  const key = 2;
  const encoded = encodeURIComponent(url)
    .split('')
    .map((char, ind) => (ind % 2 === 0 ? String.fromCharCode(char.charCodeAt(0) ^ key) : char))
    .join('');
  return `uv://${btoa(encoded)}`;
}

export function decodeUltraviolet(encodedString: string): string {
  try {
    if (!encodedString.startsWith('uv://')) return encodedString;
    const raw = atob(encodedString.replace('uv://', ''));
    const key = 2;
    const decoded = raw
      .split('')
      .map((char, ind) => (ind % 2 === 0 ? String.fromCharCode(char.charCodeAt(0) ^ key) : char))
      .join('');
    return decodeURIComponent(decoded);
  } catch {
    return encodedString;
  }
}

export function encodeScramjet(url: string): string {
  if (!url) return '';
  return `scramjet://${encodeURIComponent(url)}`;
}

export function decodeScramjet(encodedString: string): string {
  try {
    if (!encodedString.startsWith('scramjet://')) return encodedString;
    return decodeURIComponent(encodedString.replace('scramjet://', ''));
  } catch {
    return encodedString;
  }
}

// -------------------------------------------------------------------------
// Curated Monochrome Music Catalog with Synced Lyrics
// -------------------------------------------------------------------------
export const MONOCHROME_CATALOG: MonochromeTrack[] = [
  {
    id: 'track-1',
    title: 'Singularity Horizon',
    artist: 'Lorn & Kavinsky',
    album: 'Gravitational Resonance (Monochrome Edition)',
    coverGradient: 'from-zinc-950 via-zinc-900 to-black',
    coverAccent: '#f97316',
    duration: 198,
    format: 'FLAC 24-bit / 96kHz Lossless',
    bitrate: '9216 kbps (Hi-Fi)',
    genre: 'Cosmic Cyberpunk / Darkwave',
    year: 2026,
    synthParams: {
      tempo: 96,
      rootFreq: 55, // A1
      chords: [
        [110, 130.81, 164.81], // Am
        [87.31, 110, 130.81],   // F
        [98.00, 123.47, 146.83], // G
        [82.41, 110, 123.47],   // Em
      ],
      bassFreqs: [55, 43.65, 49.0, 41.2],
      leadType: 'sawtooth',
      filterCutoff: 950,
    },
    lyrics: [
      { time: 0, text: '♪ [Instrumental Gravitational Overture] ♪' },
      { time: 10, text: 'Drifting beyond the event horizon' },
      { time: 16, text: 'Photons bent in an infinite ring of fire' },
      { time: 22, text: 'Monochrome frequencies cutting through vacuum' },
      { time: 28, text: 'There is no silence where the proxy flows' },
      { time: 35, text: 'Scramjet packets accelerating past light' },
      { time: 42, text: 'Ultraviolet waves dancing in dark matter' },
      { time: 48, text: 'We find our pulse inside the obsidian core' },
      { time: 55, text: '♪ [Heavy Cybernetic Bass Drop & Accretion Flare] ♪' },
      { time: 68, text: 'Hold the frequency steady' },
      { time: 74, text: 'Let the wave fold time upon itself' },
      { time: 80, text: 'Every harmonic a memory of a distant star' },
      { time: 88, text: 'Falling forever, yet standing still' },
      { time: 98, text: '♪ [Resonant Filter Sweep & Sub-bass Glide] ♪' },
      { time: 112, text: 'Stream the lossless signal into the void' },
      { time: 118, text: 'Zero compression, zero decay' },
      { time: 125, text: 'We are the shadows dancing on the glass' },
      { time: 132, text: 'Monochrome symphony at the edge of the universe' },
      { time: 145, text: '♪ [Crescendo of Liquid Synthesizers] ♪' },
      { time: 165, text: 'Echoes fading into the Schwarzschild radius...' },
      { time: 180, text: 'Pure stillness returns to the void.' },
    ],
  },
  {
    id: 'track-2',
    title: 'Liquid Obsidian',
    artist: 'Tycho & Carbon Based Lifeforms',
    album: 'Photonic Drift',
    coverGradient: 'from-slate-950 via-zinc-900 to-cyan-950',
    coverAccent: '#06b6d4',
    duration: 215,
    format: 'FLAC 24-bit / 48kHz',
    bitrate: '4608 kbps',
    genre: 'Ambient Downtempo / Liquid Chill',
    year: 2026,
    synthParams: {
      tempo: 84,
      rootFreq: 65.41, // C2
      chords: [
        [130.81, 164.81, 196.00], // C
        [116.54, 146.83, 174.61], // Bb
        [103.83, 130.81, 155.56], // Ab
        [98.00, 123.47, 146.83],  // G
      ],
      bassFreqs: [65.41, 58.27, 51.91, 49.0],
      leadType: 'sine',
      filterCutoff: 1200,
    },
    lyrics: [
      { time: 0, text: '♪ [Soft Liquid Ripple & Ambient Shimmer] ♪' },
      { time: 12, text: 'Reflections on cold obsidian glass' },
      { time: 18, text: 'A sea of mercury shifting under starlight' },
      { time: 25, text: 'Every drop tuned to forty-eight kilohertz' },
      { time: 32, text: 'The browser tunnels through the firewall' },
      { time: 39, text: 'Unlocking melodies that sleep beneath the net' },
      { time: 47, text: '♪ [Warm Analog Pad Expansion] ♪' },
      { time: 58, text: 'Breathe the electronic vapor' },
      { time: 65, text: 'Listen to the liquid current flow' },
      { time: 73, text: 'No friction, no boundaries left to cross' },
      { time: 82, text: 'In Monochrome, all colors turn to sound' },
      { time: 94, text: '♪ [Chilled Drum Grooves & Shimmer Delay] ♪' },
      { time: 110, text: 'Beneath the surface of the screen' },
      { time: 118, text: 'A thousand packets swim like bioluminescent fish' },
      { time: 126, text: 'Guarded by Ultraviolet keys' },
      { time: 135, text: 'We float suspended in pure clarity' },
      { time: 150, text: '♪ [Atmospheric Outro with Liquid Echoes] ♪' },
      { time: 185, text: 'Obsidian dreams dissolve into light.' },
    ],
  },
  {
    id: 'track-3',
    title: 'Neon Monochrome',
    artist: 'The Midnight & Gunship',
    album: 'Monochrome Nights 1984',
    coverGradient: 'from-purple-950 via-zinc-950 to-pink-950',
    coverAccent: '#ec4899',
    duration: 204,
    format: 'FLAC 16-bit / 44.1kHz',
    bitrate: '1411 kbps',
    genre: 'Synthwave / Retro Electro',
    year: 2026,
    synthParams: {
      tempo: 110,
      rootFreq: 73.42, // D2
      chords: [
        [146.83, 174.61, 220.00], // Dm
        [116.54, 146.83, 174.61], // Bb
        [130.81, 164.81, 196.00], // C
        [98.00, 123.47, 146.83],  // G
      ],
      bassFreqs: [73.42, 58.27, 65.41, 49.0],
      leadType: 'sawtooth',
      filterCutoff: 1800,
    },
    lyrics: [
      { time: 0, text: '♪ [Arpeggiated Neon Synth & LinnDrum Beat] ♪' },
      { time: 8, text: 'Midnight on the coastal highway' },
      { time: 14, text: 'Raindrops scattering pink and violet streaks' },
      { time: 20, text: 'Dashboard glowing with the Monochrome player' },
      { time: 26, text: 'Singing songs we used to know by heart' },
      { time: 33, text: 'They tried to lock the music away' },
      { time: 39, text: 'Behind high walls and toll booths' },
      { time: 45, text: 'But Scramjet opened up the open lane' },
      { time: 51, text: 'And now the night is ours forever!' },
      { time: 58, text: '♪ [Chorus: Electric Guitar Solo & Dual Synths] ♪' },
      { time: 70, text: 'We are living in a Neon Monochrome world' },
      { time: 78, text: 'Black and white beneath the burning starlight' },
      { time: 85, text: 'Turn the volume to maximum overload' },
      { time: 92, text: 'Nothing can break this connection tonight!' },
      { time: 104, text: '♪ [Dynamic Saxophone Melody & Chorus Stabs] ♪' },
      { time: 120, text: 'Passing city towers wrapped in mist' },
      { time: 127, text: 'Frequencies bouncing off the skyscraper glass' },
      { time: 135, text: 'Every lyric synchronized in real time' },
      { time: 142, text: 'A beacon for the travelers of the dark' },
      { time: 152, text: '♪ [Grand Synthwave Climax] ♪' },
      { time: 175, text: 'We are eternal in this sound...' },
      { time: 190, text: 'Fade into the morning horizon.' },
    ],
  },
  {
    id: 'track-4',
    title: 'Quantum Vacuum Echoes',
    artist: 'Max Cooper & Jon Hopkins',
    album: 'Subatomic Symphony',
    coverGradient: 'from-emerald-950 via-zinc-950 to-teal-950',
    coverAccent: '#10b981',
    duration: 226,
    format: 'DSD 64 / 2.8MHz Master',
    bitrate: '5644 kbps',
    genre: 'IDM / Microscopic Minimal',
    year: 2026,
    synthParams: {
      tempo: 92,
      rootFreq: 61.74, // B1
      chords: [
        [123.47, 155.56, 185.00], // Bm
        [98.00, 123.47, 146.83],  // G
        [110.00, 138.59, 164.81], // A
        [82.41, 103.83, 123.47],  // E
      ],
      bassFreqs: [61.74, 49.0, 55.0, 41.2],
      leadType: 'triangle',
      filterCutoff: 1400,
    },
    lyrics: [
      { time: 0, text: '♪ [Micro-Clicks, Glitch Textures & Deep Sub Drone] ♪' },
      { time: 14, text: 'Particles popping into existence' },
      { time: 20, text: 'Annihilating in fractions of a femtosecond' },
      { time: 27, text: 'What seems empty is teeming with life' },
      { time: 34, text: 'Energy boiling in the lowest state' },
      { time: 42, text: 'The proxy listens where ears cannot reach' },
      { time: 50, text: 'Reconstructing the lost harmonics of the vacuum' },
      { time: 60, text: '♪ [Complex Polyrhythmic Pulse Build] ♪' },
      { time: 75, text: 'Zero-point fluctuations' },
      { time: 82, text: 'Breathing like a living universe' },
      { time: 90, text: 'Order emerging from quantum uncertainty' },
      { time: 100, text: 'Every waveform resolved at the speed of thought' },
      { time: 115, text: '♪ [Granular Synthesis & Crystalline Arpeggios] ♪' },
      { time: 135, text: 'Decoherence collapsing into melody' },
      { time: 145, text: 'The wave function becomes the song' },
      { time: 160, text: 'Listen as the universe observes itself' },
      { time: 180, text: 'Through the eyes of Monochrome.' },
    ],
  },
  {
    id: 'track-5',
    title: 'Interstellar Geodesic',
    artist: 'Hans Zimmer & Solar Fields',
    album: 'Cosmic Journey OST (Proxy Master)',
    coverGradient: 'from-amber-950 via-zinc-950 to-orange-950',
    coverAccent: '#f59e0b',
    duration: 240,
    format: 'FLAC 24-bit / 192kHz Studio Master',
    bitrate: '9216 kbps',
    genre: 'Cinematic Orchestral / Ambient Space',
    year: 2026,
    synthParams: {
      tempo: 78,
      rootFreq: 43.65, // F1
      chords: [
        [87.31, 110.00, 130.81],  // F
        [103.83, 130.81, 155.56], // Ab
        [116.54, 146.83, 174.61], // Bb
        [130.81, 164.81, 196.00], // C
      ],
      bassFreqs: [43.65, 51.91, 58.27, 65.41],
      leadType: 'sine',
      filterCutoff: 800,
    },
    lyrics: [
      { time: 0, text: '♪ [Solemn Cathedral Pipe Organ & Distant Strings] ♪' },
      { time: 18, text: 'Do not go gentle into that good night' },
      { time: 26, text: 'Rage, rage against the dying of the light' },
      { time: 35, text: 'A thousand light years from home' },
      { time: 44, text: 'Carried forward on a gravitational sling' },
      { time: 54, text: 'Time dilates, but music stands still' },
      { time: 65, text: 'One hour on this world is seven years back there' },
      { time: 76, text: '♪ [Massive Orchestral Surge with Ticking Clock] ♪' },
      { time: 92, text: 'Every second counts' },
      { time: 100, text: 'Every pulse of the proxy brings your voice back to me' },
      { time: 110, text: 'Through the wormhole, across the veil' },
      { time: 122, text: 'Love is the one thing that transcends dimensions' },
      { time: 135, text: 'Love, and the infinite beauty of sound.' },
      { time: 155, text: '♪ [Climactic Tonal Organ Crescendo] ♪' },
      { time: 185, text: 'We will meet beyond the singularity...' },
      { time: 210, text: 'Stay.' },
    ],
  },
];
