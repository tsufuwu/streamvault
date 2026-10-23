import { MediaItem, FolderItem } from '../types';

const API_ENDPOINTS = [
  '/api/get-media-list',
  '/.netlify/functions/get-media-list',
  'https://orange.celinewang.workers.dev/api/get-media-list',
];
const STREAM_BASE = typeof window !== 'undefined' && (window.location.hostname.includes('localhost') || window.location.hostname.includes('workers.dev'))
  ? '/stream-media'
  : 'https://orange.celinewang.workers.dev/stream-media';
const REMOTE_FALLBACK_STREAM = 'https://orange.celinewang.workers.dev/stream-media';
const STORAGE_CUSTOM_MEDIA = 'vinylstream_custom_media';
const STORAGE_FAVORITES = 'vinylstream_favorites';
const STORAGE_RECENTS = 'vinylstream_recents';

// Authentic media matching real Google Drive structure (Vườn cam)
const DEFAULT_MEDIA: MediaItem[] = [
  {
    id: '1',
    title: '0211',
    fileId: '1JF02Bx1xnv5_34oaCEAePxcrW7aJoN5_',
    type: 'video',
    thumbnail: 'https://lh3.googleusercontent.com/u/0/d/1JF02Bx1xnv5_34oaCEAePxcrW7aJoN5_=w800',
    duration: '',
    quality: '',
    genre: 'Nhạc',
    year: '',
    description: '',
    folderId: '1aev0JuD8T9dfzoV-T_NY7qDzvyLE-Snz',
    folderName: 'Nhạc',
    folderPath: ['Nhạc'],
    streamUrl: `${STREAM_BASE}/1JF02Bx1xnv5_34oaCEAePxcrW7aJoN5_`,
    previewUrl: 'https://drive.google.com/file/d/1JF02Bx1xnv5_34oaCEAePxcrW7aJoN5_/preview',
  },
  {
    id: '2',
    title: '[A day before us] EP.07 Before I See You',
    fileId: '1we2ShPu7oX6EnBJBZsEvSjMA5ABD3Wwo',
    type: 'video',
    thumbnail: 'https://lh3.googleusercontent.com/u/0/d/1we2ShPu7oX6EnBJBZsEvSjMA5ABD3Wwo=w800',
    duration: '',
    quality: '',
    genre: 'Phim',
    year: '',
    description: '',
    folderId: '1vWP0fcAVjoyHvhO7cTfkNOpsfhMCiUhb',
    folderName: 'Phim',
    folderPath: ['Phim'],
    streamUrl: `${STREAM_BASE}/1we2ShPu7oX6EnBJBZsEvSjMA5ABD3Wwo`,
    previewUrl: 'https://drive.google.com/file/d/1we2ShPu7oX6EnBJBZsEvSjMA5ABD3Wwo/preview',
  },
  {
    id: '3',
    title: '[A day before us] EP.10 A Day Before Us',
    fileId: '1O452snalJ0QZiv_wG3yjdYO2WfS6MmwR',
    type: 'video',
    thumbnail: 'https://lh3.googleusercontent.com/u/0/d/1O452snalJ0QZiv_wG3yjdYO2WfS6MmwR=w800',
    duration: '',
    quality: '',
    genre: 'Phim',
    year: '',
    description: '',
    folderId: '1vWP0fcAVjoyHvhO7cTfkNOpsfhMCiUhb',
    folderName: 'Phim',
    folderPath: ['Phim'],
    streamUrl: `${STREAM_BASE}/1O452snalJ0QZiv_wG3yjdYO2WfS6MmwR`,
    previewUrl: 'https://drive.google.com/file/d/1O452snalJ0QZiv_wG3yjdYO2WfS6MmwR/preview',
  },
  {
    id: '4',
    title: 'Given Tập 1 - Boys in the Band',
    fileId: '1yX7B3j8bGzMjz9J3vQNubsioXnSpZGYZ',
    type: 'video',
    thumbnail: 'https://lh3.googleusercontent.com/u/0/d/1yX7B3j8bGzMjz9J3vQNubsioXnSpZGYZ=w800',
    duration: '',
    quality: '',
    genre: 'Phim',
    year: '',
    description: '',
    folderId: '1vWP0fcAVjoyHvhO7cTfkNOpsfhMCiUhb',
    folderName: 'Phim',
    folderPath: ['Phim'],
    streamUrl: `${STREAM_BASE}/1yX7B3j8bGzMjz9J3vQNubsioXnSpZGYZ`,
    previewUrl: 'https://drive.google.com/file/d/1yX7B3j8bGzMjz9J3vQNubsioXnSpZGYZ/preview',
  },
  {
    id: '5',
    title: '00dfe1634cdb07d3fd0e29a911c9355e',
    fileId: '1EPoqyxyrMdJUDw-W1CXmhjODkXso8PxT',
    type: 'video',
    thumbnail: 'https://lh3.googleusercontent.com/u/0/d/1EPoqyxyrMdJUDw-W1CXmhjODkXso8PxT=w800',
    duration: '',
    quality: '',
    genre: 'Video nhảm nhí',
    year: '',
    description: '',
    folderId: '12yDjHh3K9SQk_WyT0Wulg_mUZ4WGtODL',
    folderName: 'Video nhảm nhí',
    folderPath: ['Video nhảm nhí'],
    streamUrl: `${STREAM_BASE}/1EPoqyxyrMdJUDw-W1CXmhjODkXso8PxT`,
    previewUrl: 'https://drive.google.com/file/d/1EPoqyxyrMdJUDw-W1CXmhjODkXso8PxT/preview',
  },
  {
    id: '6',
    title: '049a4921dc24d4cf04136d8c0560b564',
    fileId: '1Vk2wJUYjFWqh77VCICGc8wx8XIKKgmmP',
    type: 'video',
    thumbnail: 'https://lh3.googleusercontent.com/u/0/d/1Vk2wJUYjFWqh77VCICGc8wx8XIKKgmmP=w800',
    duration: '',
    quality: '',
    genre: 'Video nhảm nhí',
    year: '',
    description: '',
    folderId: '12yDjHh3K9SQk_WyT0Wulg_mUZ4WGtODL',
    folderName: 'Video nhảm nhí',
    folderPath: ['Video nhảm nhí'],
    streamUrl: `${STREAM_BASE}/1Vk2wJUYjFWqh77VCICGc8wx8XIKKgmmP`,
    previewUrl: 'https://drive.google.com/file/d/1Vk2wJUYjFWqh77VCICGc8wx8XIKKgmmP/preview',
  }
];

const DEFAULT_FOLDERS: FolderItem[] = [
  { id: '1aev0JuD8T9dfzoV-T_NY7qDzvyLE-Snz', name: 'Nhạc', path: ['Nhạc'] },
  { id: '1vWP0fcAVjoyHvhO7cTfkNOpsfhMCiUhb', name: 'Phim', path: ['Phim'] },
  { id: '12yDjHh3K9SQk_WyT0Wulg_mUZ4WGtODL', name: 'Video nhảm nhí', path: ['Video nhảm nhí'] },
];

export async function fetchMediaList(): Promise<{ media: MediaItem[]; folders: FolderItem[] }> {
  for (const ep of API_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(ep, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          const streamBase = ep.startsWith('http') ? REMOTE_FALLBACK_STREAM : '/stream-media';
          const remoteMedia: MediaItem[] = json.data.map((item: any) => {
            const folderName = (item.folderName || 'Root').trim();
            const folderPath = Array.isArray(item.folderPath) && item.folderPath.length > 0
              ? item.folderPath
              : (folderName !== 'Root' && folderName !== 'Thư mục gốc' ? [folderName] : []);

            return {
              ...item,
              folderName,
              folderPath,
              streamUrl: `${streamBase}/${item.fileId}`,
              previewUrl: `https://drive.google.com/file/d/${item.fileId}/preview`,
              quality: '', // No fake HD tags
            };
          });

          // Process folders
          let folders: FolderItem[] = DEFAULT_FOLDERS;
          if (Array.isArray(json.folders) && json.folders.length > 0) {
            folders = json.folders.map((f: any) => ({
              id: f.id,
              name: (f.name || '').trim(),
              path: Array.isArray(f.path) ? f.path : [f.name],
              parentId: f.parentId,
            }));
          }

          // Append custom stored media
          const customItems = getCustomMedia();
          const mergedMedia = [...remoteMedia, ...customItems];

          return { media: mergedMedia, folders };
        }
      }
    } catch (err) {
      console.warn(`Failed fetching from ${ep}, checking next...`, err);
    }
  }

  // Fallback if all fetch attempts fail
  const customItems = getCustomMedia();
  return {
    media: [...DEFAULT_MEDIA, ...customItems],
    folders: DEFAULT_FOLDERS,
  };
}

export function getCustomMedia(): MediaItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_CUSTOM_MEDIA);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveCustomMedia(item: MediaItem): MediaItem[] {
  const current = getCustomMedia();
  const updated = [item, ...current.filter(m => m.id !== item.id)];
  localStorage.setItem(STORAGE_CUSTOM_MEDIA, JSON.stringify(updated));
  return updated;
}

export function deleteCustomMedia(id: string): void {
  const current = getCustomMedia();
  const updated = current.filter(m => m.id !== id);
  localStorage.setItem(STORAGE_CUSTOM_MEDIA, JSON.stringify(updated));
}

export function getFavorites(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_FAVORITES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(id: string): string[] {
  const current = getFavorites();
  const index = current.indexOf(id);
  let updated: string[];
  if (index >= 0) {
    updated = current.filter(item => item !== id);
  } else {
    updated = [...current, id];
  }
  localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(updated));
  return updated;
}

export function getRecents(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_RECENTS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function recordRecent(id: string): string[] {
  const current = getRecents();
  const updated = [id, ...current.filter(item => item !== id)].slice(0, 15);
  localStorage.setItem(STORAGE_RECENTS, JSON.stringify(updated));
  return updated;
}
