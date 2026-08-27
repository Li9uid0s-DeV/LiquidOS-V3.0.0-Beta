/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
        },
      },
      boxShadow: {
        glass: '0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-light': '0 8px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
        glow: '0 0 24px rgba(99,102,241,0.35), 0 0 48px rgba(168,85,247,0.18)',
      },
      animation: {
        'gradient-shift': 'gradient-shift 18s ease infinite',
        'float-orb': 'float-orb 22s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
