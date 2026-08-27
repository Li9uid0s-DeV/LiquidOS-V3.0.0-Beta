import React from 'react';

interface AppLogoProps {
  size?: number;
  className?: string;
  variant?: 'squircle' | 'raw' | 'glass';
  glow?: boolean;
}

export function AppLogo({ size = 32, className = '', variant = 'raw', glow = false }: AppLogoProps) {
  const svgContent = (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${glow ? 'filter drop-shadow-[0_0_12px_rgba(0,198,255,0.65)]' : ''}`}
    >
      <defs>
        {/* Main Swirl Gradient */}
        <linearGradient id="liquid-logo-grad1" x1="40" y1="30" x2="220" y2="230" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="35%" stopColor="#0284c7" />
          <stop offset="70%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Secondary Lower Fluid Lap Gradient */}
        <linearGradient id="liquid-logo-grad2" x1="180" y1="120" x2="90" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>

        {/* Inner Tongue Ribbon Wave */}
        <linearGradient id="liquid-logo-grad3" x1="120" y1="110" x2="220" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>

        {/* Floating Droplet Gradient */}
        <linearGradient id="liquid-logo-drop" x1="160" y1="75" x2="190" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Subtle Soft Highlight */}
        <linearGradient id="liquid-logo-highlight" x1="60" y1="40" x2="100" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Main Outer Fluid Loop (G / Droplet Swirl) */}
      <path
        d="M138 36C82 36 50 78 50 134C50 188 92 226 150 226C198 226 226 194 220 178C214 162 178 184 148 184C108 184 86 156 86 126C86 92 110 58 142 58C162 58 174 70 170 82C166 94 150 96 142 96C126 96 112 108 112 124C112 140 128 152 148 152C182 152 216 130 216 110C216 66 186 36 138 36Z"
        fill="url(#liquid-logo-grad1)"
      />

      {/* Fluid Overlapping Curved Base Ribbon */}
      <path
        d="M62 144C62 188 98 224 148 224C190 224 218 196 218 180C202 194 172 204 142 204C98 204 74 174 74 144C74 136 76 128 80 120C68 128 62 136 62 144Z"
        fill="url(#liquid-logo-grad2)"
        opacity="0.85"
      />

      {/* Inner Fluid Wave Swirl */}
      <path
        d="M116 132C116 116 130 110 148 110C176 110 214 134 214 156C214 172 192 188 166 188C140 188 116 172 116 152C116 145 116 138 116 132Z"
        fill="url(#liquid-logo-grad3)"
      />

      {/* Top Right Floating Celestial Liquid Droplet */}
      <circle cx="178" cy="88" r="16" fill="url(#liquid-logo-drop)" />
      
      {/* Specular Inner Rim */}
      <path
        d="M138 40C88 40 56 80 56 134C56 154 62 172 74 186C68 172 64 154 64 134C64 84 94 48 138 48C154 48 164 54 168 62C162 52 150 40 138 40Z"
        fill="url(#liquid-logo-highlight)"
      />
    </svg>
  );

  if (variant === 'squircle') {
    return (
      <div
        className={`rounded-2xl bg-white/95 p-1.5 shadow-xl flex items-center justify-center ${className}`}
        style={{ width: size * 1.3, height: size * 1.3 }}
      >
        {svgContent}
      </div>
    );
  }

  if (variant === 'glass') {
    return (
      <div
        className={`rounded-xl liquid-glass-window p-1 flex items-center justify-center ${className}`}
        style={{ width: size * 1.25, height: size * 1.25 }}
      >
        {svgContent}
      </div>
    );
  }

  return <div className={`inline-flex items-center justify-center ${className}`}>{svgContent}</div>;
}
