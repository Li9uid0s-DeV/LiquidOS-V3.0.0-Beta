import { useState, useMemo } from 'react';
import { Icon } from '../Icon';
import { useOS } from '../OSContext';

interface CityWeather {
  id: string;
  name: string;
  country: string;
  temp: number;
  condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Thunderstorm' | 'Aurora' | 'Cosmic Dust';
  high: number;
  low: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  pressure: number;
  visibility: string;
  sunrise: string;
  sunset: string;
  airQuality: { aqi: number; status: string; color: string };
  hourly: { time: string; temp: number; icon: string; pop: number }[];
  weekly: { day: string; condition: string; icon: string; high: number; low: number }[];
}

const CITIES: CityWeather[] = [
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    temp: 21,
    condition: 'Sunny',
    high: 24,
    low: 15,
    humidity: 48,
    windSpeed: 12,
    uvIndex: 5,
    pressure: 1014,
    visibility: '10 km',
    sunrise: '05:58',
    sunset: '17:05',
    airQuality: { aqi: 28, status: 'Excellent', color: 'text-emerald-400' },
    hourly: [
      { time: 'Now', temp: 21, icon: 'Sun', pop: 0 },
      { time: '14:00', temp: 23, icon: 'Sun', pop: 0 },
      { time: '16:00', temp: 22, icon: 'CloudSun', pop: 10 },
      { time: '18:00', temp: 19, icon: 'Cloud', pop: 15 },
      { time: '20:00', temp: 17, icon: 'Moon', pop: 5 },
      { time: '22:00', temp: 16, icon: 'Moon', pop: 0 },
      { time: '00:00', temp: 15, icon: 'Moon', pop: 0 },
      { time: '02:00', temp: 14, icon: 'Moon', pop: 0 },
    ],
    weekly: [
      { day: 'Today', condition: 'Sunny & Clear', icon: 'Sun', high: 24, low: 15 },
      { day: 'Wed', condition: 'Partly Cloudy', icon: 'CloudSun', high: 22, low: 14 },
      { day: 'Thu', condition: 'Mild Rain', icon: 'CloudRain', high: 19, low: 13 },
      { day: 'Fri', condition: 'Overcast', icon: 'Cloud', high: 20, low: 12 },
      { day: 'Sat', condition: 'Clear Sky', icon: 'Sun', high: 23, low: 15 },
      { day: 'Sun', condition: 'Breezy & Mild', icon: 'Wind', high: 21, low: 14 },
      { day: 'Mon', condition: 'Sunny', icon: 'Sun', high: 24, low: 16 },
    ],
  },
  {
    id: 'neo-tokyo',
    name: 'Neo-Tokyo',
    country: 'Cyber District',
    temp: 26,
    condition: 'Aurora',
    high: 29,
    low: 21,
    humidity: 62,
    windSpeed: 18,
    uvIndex: 8,
    pressure: 1009,
    visibility: '12 km',
    sunrise: '05:40',
    sunset: '18:15',
    airQuality: { aqi: 42, status: 'Good', color: 'text-teal-400' },
    hourly: [
      { time: 'Now', temp: 26, icon: 'Sparkles', pop: 5 },
      { time: '14:00', temp: 28, icon: 'Sparkles', pop: 5 },
      { time: '16:00', temp: 27, icon: 'Zap', pop: 20 },
      { time: '18:00', temp: 24, icon: 'CloudSun', pop: 10 },
      { time: '20:00', temp: 23, icon: 'Moon', pop: 0 },
      { time: '22:00', temp: 22, icon: 'Moon', pop: 0 },
    ],
    weekly: [
      { day: 'Today', condition: 'Neon Aurora Glow', icon: 'Sparkles', high: 29, low: 21 },
      { day: 'Wed', condition: 'Cyber Showers', icon: 'CloudRain', high: 26, low: 20 },
      { day: 'Thu', condition: 'Quantum Breeze', icon: 'Wind', high: 25, low: 19 },
      { day: 'Fri', condition: 'Clear Neon Sky', icon: 'Sun', high: 28, low: 22 },
      { day: 'Sat', condition: 'Magnetic Storm', icon: 'Zap', high: 24, low: 18 },
      { day: 'Sun', condition: 'Aurora Glow', icon: 'Sparkles', high: 27, low: 21 },
      { day: 'Mon', condition: 'Warm & Humid', icon: 'Sun', high: 30, low: 23 },
    ],
  },
  {
    id: 'gargantua',
    name: 'Gargantua Colony',
    country: 'Deep Space Station',
    temp: 18,
    condition: 'Cosmic Dust',
    high: 20,
    low: 12,
    humidity: 35,
    windSpeed: 4,
    uvIndex: 0,
    pressure: 1013,
    visibility: '100 km',
    sunrise: 'Artificial 06:00',
    sunset: 'Artificial 22:00',
    airQuality: { aqi: 10, status: 'Pure Synthesized', color: 'text-cyan-400' },
    hourly: [
      { time: 'Now', temp: 18, icon: 'Compass', pop: 0 },
      { time: 'Orb 1', temp: 19, icon: 'Sparkles', pop: 0 },
      { time: 'Orb 2', temp: 18, icon: 'Compass', pop: 0 },
      { time: 'Orb 3', temp: 17, icon: 'Moon', pop: 0 },
      { time: 'Orb 4', temp: 16, icon: 'Moon', pop: 0 },
    ],
    weekly: [
      { day: 'Cycle 1', condition: 'Gravitational Lensing', icon: 'Compass', high: 20, low: 12 },
      { day: 'Cycle 2', condition: 'Accretion Flare', icon: 'Sparkles', high: 22, low: 13 },
      { day: 'Cycle 3', condition: 'Solar Proton Wind', icon: 'Wind', high: 19, low: 11 },
      { day: 'Cycle 4', condition: 'Sub-light Cruise', icon: 'Compass', high: 18, low: 12 },
      { day: 'Cycle 5', condition: 'Nebula Transit', icon: 'Cloud', high: 17, low: 10 },
      { day: 'Cycle 6', condition: 'Station Stabilization', icon: 'Shield', high: 18, low: 12 },
      { day: 'Cycle 7', condition: 'Event Horizon Clear', icon: 'Sun', high: 20, low: 13 },
    ],
  },
  {
    id: 'newyork',
    name: 'New York',
    country: 'United States',
    temp: 16,
    condition: 'Cloudy',
    high: 19,
    low: 11,
    humidity: 55,
    windSpeed: 16,
    uvIndex: 4,
    pressure: 1018,
    visibility: '9 km',
    sunrise: '06:22',
    sunset: '18:10',
    airQuality: { aqi: 35, status: 'Good', color: 'text-emerald-400' },
    hourly: [
      { time: 'Now', temp: 16, icon: 'Cloud', pop: 15 },
      { time: '14:00', temp: 18, icon: 'CloudSun', pop: 20 },
      { time: '16:00', temp: 17, icon: 'Cloud', pop: 10 },
      { time: '18:00', temp: 15, icon: 'Moon', pop: 5 },
      { time: '20:00', temp: 13, icon: 'Moon', pop: 0 },
      { time: '22:00', temp: 12, icon: 'Moon', pop: 0 },
    ],
    weekly: [
      { day: 'Today', condition: 'Partly Cloudy', icon: 'Cloud', high: 19, low: 11 },
      { day: 'Wed', condition: 'Showers Likely', icon: 'CloudRain', high: 15, low: 9 },
      { day: 'Thu', condition: 'Cool Autumn Breeze', icon: 'Wind', high: 17, low: 10 },
      { day: 'Fri', condition: 'Crisp Sunshine', icon: 'Sun', high: 20, low: 12 },
      { day: 'Sat', condition: 'Overcast Skies', icon: 'Cloud', high: 18, low: 11 },
      { day: 'Sun', condition: 'Sunny & Crisp', icon: 'Sun', high: 21, low: 13 },
      { day: 'Mon', condition: 'Cloudy with Wind', icon: 'Cloud', high: 19, low: 12 },
    ],
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    temp: 14,
    condition: 'Rainy',
    high: 16,
    low: 9,
    humidity: 78,
    windSpeed: 22,
    uvIndex: 2,
    pressure: 1005,
    visibility: '6 km',
    sunrise: '06:45',
    sunset: '17:50',
    airQuality: { aqi: 22, status: 'Excellent', color: 'text-emerald-400' },
    hourly: [
      { time: 'Now', temp: 14, icon: 'CloudRain', pop: 85 },
      { time: '14:00', temp: 15, icon: 'CloudRain', pop: 90 },
      { time: '16:00', temp: 15, icon: 'Cloud', pop: 40 },
      { time: '18:00', temp: 13, icon: 'Cloud', pop: 20 },
      { time: '20:00', temp: 11, icon: 'Moon', pop: 10 },
      { time: '22:00', temp: 10, icon: 'Moon', pop: 5 },
    ],
    weekly: [
      { day: 'Today', condition: 'Light Rain & Drizzle', icon: 'CloudRain', high: 16, low: 9 },
      { day: 'Wed', condition: 'Thick Mist & Cloud', icon: 'Cloud', high: 15, low: 8 },
      { day: 'Thu', condition: 'Intermittent Rain', icon: 'CloudRain', high: 14, low: 8 },
      { day: 'Fri', condition: 'Mild Breaks of Sun', icon: 'CloudSun', high: 17, low: 10 },
      { day: 'Sat', condition: 'Brisk Wind & Rain', icon: 'CloudRain', high: 15, low: 9 },
      { day: 'Sun', condition: 'Mostly Overcast', icon: 'Cloud', high: 16, low: 10 },
      { day: 'Mon', condition: 'Showers in Afternoon', icon: 'CloudRain', high: 15, low: 9 },
    ],
  },
];

export function WeatherApp() {
  const { playSound } = useOS();
  const [selectedCityId, setSelectedCityId] = useState('tokyo');
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [refreshing, setRefreshing] = useState(false);

  const city = useMemo(() => {
    return CITIES.find((c) => c.id === selectedCityId) ?? CITIES[0];
  }, [selectedCityId]);

  const convertTemp = (celsius: number) => {
    if (unit === 'F') return Math.round((celsius * 9) / 5 + 32);
    return Math.round(celsius);
  };

  const handleRefresh = () => {
    playSound('click');
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 text-white select-none overflow-y-auto">
      {/* Top Header & City Switcher Bar */}
      <div className="p-4 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Icon name="CloudSun" size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Cosmic Weather
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">Live Satellite</span>
            </h1>
            <p className="text-[11px] text-white/50">{city.name}, {city.country}</p>
          </div>
        </div>

        {/* City Select Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          {CITIES.map((c) => (
            <button
              key={c.id}
              onClick={() => { playSound('click'); setSelectedCityId(c.id); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 ${
                c.id === selectedCityId
                  ? 'bg-cyan-500 text-black font-semibold shadow-md shadow-cyan-500/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Unit Toggle and Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex rounded-xl bg-white/10 p-0.5 border border-white/10">
            <button
              onClick={() => setUnit('C')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${unit === 'C' ? 'bg-cyan-400 text-black' : 'text-white/60 hover:text-white'}`}
            >
              °C
            </button>
            <button
              onClick={() => setUnit('F')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${unit === 'F' ? 'bg-cyan-400 text-black' : 'text-white/60 hover:text-white'}`}
            >
              °F
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className={`p-2 rounded-xl bg-white/10 hover:bg-white/20 transition ${refreshing ? 'animate-spin text-cyan-400' : 'text-white/70'}`}
            title="Refresh Radar"
          >
            <Icon name="RotateCw" size={15} />
          </button>
        </div>
      </div>

      {/* Main Weather Display Hero */}
      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
        <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-br from-cyan-950/60 via-slate-900/80 to-blue-950/70 border border-cyan-500/20 shadow-2xl backdrop-blur-2xl">
          {/* Ambient weather aura */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono uppercase tracking-widest mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Current Conditions
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{city.name}</h2>
              <div className="text-white/60 text-sm mt-0.5">{city.condition} · Humidity {city.humidity}%</div>

              <div className="flex items-baseline gap-4 mt-4">
                <div className="text-6xl sm:text-7xl font-extralight tracking-tighter text-white tabular-nums">
                  {convertTemp(city.temp)}°
                </div>
                <div className="text-sm text-white/70 space-y-1">
                  <div>H: <span className="text-white font-medium">{convertTemp(city.high)}°</span></div>
                  <div>L: <span className="text-white font-medium">{convertTemp(city.low)}°</span></div>
                </div>
              </div>
            </div>

            {/* Condition Icon Visual Card */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <Icon
                name={city.condition === 'Sunny' ? 'Sun' : city.condition === 'Rainy' ? 'CloudRain' : city.condition === 'Aurora' ? 'Sparkles' : 'CloudSun'}
                size={54}
                className={city.condition === 'Sunny' ? 'text-amber-400' : city.condition === 'Rainy' ? 'text-cyan-400' : 'text-purple-300'}
              />
              <span className="text-sm font-semibold text-white mt-3">{city.condition}</span>
              <span className="text-[11px] text-white/50">Air Quality: <span className={`font-medium ${city.airQuality.color}`}>{city.airQuality.status}</span></span>
            </div>
          </div>
        </div>

        {/* Hourly Forecast Slider */}
        <div className="rounded-2xl p-4 bg-slate-900/50 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
              <Icon name="Clock" size={13} className="text-cyan-400" /> Hourly Forecast
            </span>
            <span className="text-[10px] text-cyan-400/80 font-mono">24-Hour Orbital Pass</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {city.hourly.map((h, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-between min-w-[76px] py-3 px-2 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/5 shrink-0"
              >
                <span className="text-xs text-white/60 font-mono">{h.time}</span>
                <Icon name={h.icon} size={22} className="my-2 text-cyan-300" />
                <span className="text-sm font-bold text-white tabular-nums">{convertTemp(h.temp)}°</span>
                {h.pop > 0 && (
                  <span className="text-[10px] text-sky-400 font-mono mt-1">{h.pop}%</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Extended 7-Day Forecast & Atmospheric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 7-Day Outlook */}
          <div className="rounded-2xl p-5 bg-slate-900/50 border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <div className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Icon name="Calendar" size={13} className="text-cyan-400" /> 7-Day Forecast
            </div>

            <div className="space-y-2.5">
              {city.weekly.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 transition text-xs">
                  <span className="w-16 font-medium text-white/80">{w.day}</span>
                  <div className="flex items-center gap-2 flex-1 justify-center">
                    <Icon name={w.icon} size={16} className="text-cyan-400" />
                    <span className="text-white/60 truncate max-w-[120px] hidden sm:inline">{w.condition}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-white/50">{convertTemp(w.low)}°</span>
                    <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden relative">
                      <div className="absolute inset-y-0 left-2 right-2 bg-gradient-to-r from-sky-400 to-amber-400 rounded-full" />
                    </div>
                    <span className="text-white font-bold">{convertTemp(w.high)}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Atmospheric Telemetry Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Wind */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-white/50 text-xs">
                <span>Wind Speed</span>
                <Icon name="Wind" size={14} className="text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2 tabular-nums">
                {city.windSpeed} <span className="text-xs font-normal text-white/60">km/h</span>
              </div>
              <div className="text-[11px] text-white/50 mt-1">NW Gentle Breeze</div>
            </div>

            {/* Humidity */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-white/50 text-xs">
                <span>Humidity</span>
                <Icon name="Droplets" size={14} className="text-sky-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2 tabular-nums">
                {city.humidity}%
              </div>
              <div className="text-[11px] text-white/50 mt-1">Dew point is 12°</div>
            </div>

            {/* UV Index */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-white/50 text-xs">
                <span>UV Index</span>
                <Icon name="Sun" size={14} className="text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2 tabular-nums">
                {city.uvIndex} <span className="text-xs font-normal text-white/60">/ 11</span>
              </div>
              <div className="text-[11px] text-white/50 mt-1">Moderate protection</div>
            </div>

            {/* Barometer */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-white/50 text-xs">
                <span>Pressure</span>
                <Icon name="Thermometer" size={14} className="text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2 tabular-nums">
                {city.pressure} <span className="text-xs font-normal text-white/60">hPa</span>
              </div>
              <div className="text-[11px] text-white/50 mt-1">Stable atmosphere</div>
            </div>

            {/* Sunrise / Sunset */}
            <div className="col-span-2 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="Sun" size={20} className="text-amber-400" />
                <div>
                  <div className="text-xs text-white/50">Sunrise</div>
                  <div className="text-sm font-semibold text-white">{city.sunrise}</div>
                </div>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-3">
                <Icon name="Moon" size={20} className="text-indigo-400" />
                <div>
                  <div className="text-xs text-white/50">Sunset</div>
                  <div className="text-sm font-semibold text-white">{city.sunset}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
