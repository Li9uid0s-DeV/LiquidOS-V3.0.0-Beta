import { AppId } from './types';

export interface VirtualFile {
  id: string;
  name: string;
  kind: 'file';
  type: 'text' | 'image';
  content: string; // text content or image URL
  createdAt: number;
}

export interface VirtualFolder {
  id: string;
  name: string;
  kind: 'folder';
  children: VirtualNode[];
}

export type VirtualNode = VirtualFile | VirtualFolder;

const img = (id: string, name: string, url: string): VirtualFile => ({
  id, name, kind: 'file', type: 'image', content: url, createdAt: Date.now(),
});
const txt = (id: string, name: string, content: string): VirtualFile => ({
  id, name, kind: 'file', type: 'text', content, createdAt: Date.now(),
});

const initial: VirtualFolder = {
  id: 'root',
  name: 'This PC',
  kind: 'folder',
  children: [
    {
      id: 'documents',
      name: 'Documents',
      kind: 'folder',
      children: [
        txt('doc-welcome', 'Welcome.txt', 'Welcome to Liquid OS!\n\nThis is a fully simulated desktop environment built with React + Liquid Glass UI.\nTry the Terminal, Browser, and File Explorer apps.\n\nEnjoy the glassmorphism!'),
        txt('doc-notes', 'Notes.txt', 'Project notes:\n- Build window manager\n- Add draggable windows\n- Implement glass UI\n- Add taskbar & start menu'),
      ],
    },
    {
      id: 'pictures',
      name: 'Pictures',
      kind: 'folder',
      children: [
        img('pic-1', 'Aurora.jpg', 'https://images.pexels.com/photos/1933239/pexels-photo-1933239.jpeg?auto=compress&cs=tinysrgb&w=1200'),
        img('pic-2', 'Mountains.jpg', 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1200'),
        img('pic-3', 'Ocean.jpg', 'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=1200'),
      ],
    },
    {
      id: 'downloads',
      name: 'Downloads',
      kind: 'folder',
      children: [
        txt('dl-readme', 'README.txt', 'Downloads folder. Files you save from Notepad will appear here by default.'),
      ],
    },
  ],
};

export function getInitialFileSystem(): VirtualFolder {
  return JSON.parse(JSON.stringify(initial)) as VirtualFolder;
}

// path helpers
export function findNode(root: VirtualFolder, path: string[]): VirtualNode | null {
  let current: VirtualNode = root;
  for (const seg of path) {
    if (current.kind !== 'folder') return null;
    const found: VirtualNode | undefined = current.children.find((c) => c.name === seg);
    if (!found) return null;
    current = found;
  }
  return current;
}

export function getFolder(root: VirtualFolder, path: string[]): VirtualFolder | null {
  const node = findNode(root, path);
  return node && node.kind === 'folder' ? node : null;
}

export function findParent(root: VirtualFolder, path: string[]): VirtualFolder | null {
  if (path.length === 0) return null;
  return getFolder(root, path.slice(0, -1));
}

export type { AppId };
