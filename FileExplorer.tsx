import { useState } from 'react';
import { useOS } from '../OSContext';
import { VirtualFolder, VirtualNode, getFolder } from '../fileSystem';
import { Icon } from '../Icon';

interface Props {
  payload?: { folderPath?: string[] };
}

const ROOT_PATH = ['This PC'];

export function FileExplorerApp({ payload }: Props) {
  const { fileSystem, openFileNode } = useOS();
  const startPath = payload?.folderPath?.length
    ? [...ROOT_PATH, ...payload.folderPath]
    : ROOT_PATH;
  const [path, setPath] = useState<string[]>(startPath);

  // Resolve current folder
  let current: VirtualFolder = fileSystem;
  for (let i = 1; i < path.length; i++) {
    const next = current.children.find((c) => c.name === path[i] && c.kind === 'folder');
    if (!next || next.kind !== 'folder') break;
    current = next;
  }

  const navigateTo = (segments: string[]) => setPath(segments);

  const enterNode = (node: VirtualNode) => {
    if (node.kind === 'folder') {
      setPath((p) => [...p, node.name]);
    } else {
      openFileNode(node);
    }
  };

  const sidebar: { label: string; path: string[]; icon: string }[] = [
    { label: 'This PC', path: ROOT_PATH, icon: 'Monitor' },
    { label: 'Documents', path: [...ROOT_PATH, 'Documents'], icon: 'FileText' },
    { label: 'Pictures', path: [...ROOT_PATH, 'Pictures'], icon: 'ImageIcon' },
    { label: 'Downloads', path: [...ROOT_PATH, 'Downloads'], icon: 'Download' },
  ];

  return (
    <div className="flex h-full w-full min-w-0 min-h-0 flex-col bg-zinc-900/40">
      {/* Sidebar */}
      <div className="w-44 shrink-0 border-r border-white/10 p-2 overflow-y-auto">
        <div className="text-[11px] text-white/40 px-2 py-1 uppercase tracking-wider">Quick access</div>
        {sidebar.map((item) => {
          const active = path.join('/') === item.path.join('/');
          return (
            <button
              key={item.label}
              onClick={() => navigateTo(item.path)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition mb-0.5 ${
                active ? 'bg-brand-500/30 text-white' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              <Icon name={item.icon} size={15} className={active ? 'text-brand-300' : 'text-white/50'} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10">
          <button
            onClick={() => setPath((p) => p.slice(0, -1))}
            disabled={path.length <= 1}
            className="p-1.5 rounded text-white/70 hover:bg-white/10 disabled:opacity-30 transition"
          >
            <Icon name="ArrowLeft" size={16} />
          </button>
          <button className="p-1.5 rounded text-white/70 hover:bg-white/10 disabled:opacity-30 transition" disabled>
            <Icon name="ArrowRight" size={16} />
          </button>
          <button
            onClick={() => setPath(startPath)}
            className="p-1.5 rounded text-white/70 hover:bg-white/10 transition"
          >
            <Icon name="RefreshCw" size={14} />
          </button>
          {/* Breadcrumb */}
          <div className="ml-2 flex-1 flex items-center gap-1 text-xs text-white/60 bg-black/20 rounded px-2 py-1 overflow-hidden">
            {path.map((seg, i) => (
              <span key={i} className="flex items-center gap-1 whitespace-nowrap">
                {i > 0 && <Icon name="ChevronRight" size={12} className="text-white/30" />}
                <button
                  onClick={() => setPath(path.slice(0, i + 1))}
                  className="hover:text-white transition"
                >
                  {seg}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
            {current.children.map((node) => (
              <button
                key={node.id}
                onDoubleClick={() => enterNode(node)}
                onClick={() => enterNode(node)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-white/10 transition group"
              >
                <div className="text-3xl group-hover:scale-110 transition-transform">
                  {node.kind === 'folder' ? (
                    <Icon name="Folder" size={40} className="text-brand-400" />
                  ) : node.type === 'image' ? (
                    <Icon name="ImageIcon" size={36} className="text-emerald-400" />
                  ) : (
                    <Icon name="File" size={36} className="text-sky-300" />
                  )}
                </div>
                <span className="text-[11px] text-white/80 text-center break-all line-clamp-2 leading-tight">
                  {node.name}
                </span>
              </button>
            ))}
            {current.children.length === 0 && (
              <div className="col-span-full text-center text-white/40 text-sm py-10">
                This folder is empty
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="px-3 py-1 border-t border-white/10 text-[11px] text-white/50">
          {current.children.length} items
        </div>
      </div>
    </div>
  );
}
