import { Wallpaper } from './OSContext';

export const WALLPAPERS: Record<Wallpaper, { label: string; style: string }> = {
  live2d: {
    label: '2D Aurora Live',
    style: 'linear-gradient(135deg, #050816 0%, #09132c 45%, #071b2f 100%)',
  },
  space: {
    label: 'Space Live',
    style: 'linear-gradient(135deg, #030014 0%, #0a0420 40%, #0d0530 100%)',
  },
  aurora: {
    label: 'Aurora',
    style: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 100%)',
  },
  sunset: {
    label: 'Sunset',
    style: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
  },
  ocean: {
    label: 'Ocean',
    style: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
  },
  forest: {
    label: 'Forest',
    style: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
  },
  cosmic: {
    label: 'Cosmic',
    style: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  },
  bloom: {
    label: 'Bloom',
    style: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)',
  },
  shader: {
    label: 'Liquid Shader',
    style: 'linear-gradient(135deg, #0a0a2e 0%, #16213e 100%)',
  },
};

export function WallpaperOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="float-orb absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.55), transparent 70%)' }}
      />
      <div
        className="float-orb absolute top-1/3 -right-24 h-[32rem] w-[32rem] rounded-full opacity-45 blur-3xl"
        style={{ animationDelay: '4s', background: 'radial-gradient(circle, rgba(236,72,153,0.5), transparent 70%)' }}
      />
      <div
        className="float-orb absolute -bottom-40 left-1/4 h-[30rem] w-[30rem] rounded-full opacity-40 blur-3xl"
        style={{ animationDelay: '8s', background: 'radial-gradient(circle, rgba(59,130,246,0.5), transparent 70%)' }}
      />
      <div
        className="float-orb absolute top-10 left-1/2 h-[20rem] w-[20rem] rounded-full opacity-30 blur-3xl"
        style={{ animationDelay: '12s', background: 'radial-gradient(circle, rgba(168,85,247,0.5), transparent 70%)' }}
      />
    </div>
  );
}
