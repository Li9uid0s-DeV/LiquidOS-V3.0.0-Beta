import { useState, useRef } from 'react';
import { useOS } from '../OSContext';
import { Icon } from '../Icon';

interface Props {
  payload?: { url?: string; isImage?: boolean };
}

const HOME_URL = 'https://www.bing.com';

function normalizeUrl(input: string): string {
  const v = input.trim();
  if (!v) return HOME_URL;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w-]+(\.[\w-]+)+/.test(v)) return 'https://' + v;
  return 'https://www.bing.com/search?q=' + encodeURIComponent(v);
}

const BOOKMARKS = [
  { label: 'Bing', url: 'https://www.bing.com' },
  { label: 'Wikipedia', url: 'https://en.wikipedia.org' },
  { label: 'OpenStreetMap', url: 'https://www.openstreetmap.org' },
  { label: 'Example', url: 'https://example.com' },
];

export function BrowserApp({ payload }: Props) {
  const initial = payload?.url ?? HOME_URL;
  const isImage = payload?.isImage;
  const [address, setAddress] = useState(initial);
  const [loaded, setLoaded] = useState(initial);
  const [inputVal, setInputVal] = useState(initial);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const go = (url: string) => {
    const norm = normalizeUrl(url);
    setAddress(norm);
    setInputVal(norm);
    setLoaded(norm);
  };

  return (
    <div className="flex h-full w-full min-w-0 min-h-0 flex-col bg-zinc-900/40">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10">
        <button
          onClick={() => go(HOME_URL)}
          className="p-1.5 rounded text-white/70 hover:bg-white/10 transition"
          title="Home"
        >
          <Icon name="Home" size={16} />
        </button>
        <button
          onClick={() => go(loaded)}
          className="p-1.5 rounded text-white/70 hover:bg-white/10 transition"
          title="Reload"
        >
          <Icon name="RotateCw" size={15} />
        </button>
        <form
          className="flex-1 flex"
          onSubmit={(e) => { e.preventDefault(); go(inputVal); }}
        >
          <div className="flex-1 flex items-center gap-2 bg-black/30 border border-white/15 rounded-full px-3 py-1.5 focus-within:border-brand-400 transition">
            <Icon name="Search" size={14} className="text-white/40" />
            <input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white/90 outline-none"
              placeholder="Search or enter address"
              spellCheck={false}
            />
          </div>
        </form>
      </div>

      {/* Bookmarks */}
      <div className="flex items-center gap-1 px-3 py-1 border-b border-white/10 overflow-x-auto">
        {BOOKMARKS.map((b) => (
          <button
            key={b.url}
            onClick={() => go(b.url)}
            className="px-2 py-1 rounded text-[11px] text-white/60 hover:bg-white/10 hover:text-white whitespace-nowrap transition"
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 relative bg-white">
        {isImage ? (
          <div className="h-full w-full flex items-center justify-center bg-zinc-800 overflow-auto">
            <img src={loaded} alt={address} className="max-w-full max-h-full object-contain" />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={loaded}
            className="h-full w-full border-0"
            title="browser"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}
      </div>
    </div>
  );
}
