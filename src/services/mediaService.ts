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

// High quality curated fallback data matching orange.celinewang.workers.dev in English
const DEFAULT_MEDIA: MediaItem[] = [
  {
    id: '1',
    title: '0211 — Vinyl Edition (Acoustic Lo-Fi)',
    fileId: '1JF02Bx1xnv5_34oaCEAePxcrW7aJoN5_',
    type: 'video',
    thumbnail: 'https://lh3.googleusercontent.com/u/0/d/1JF02Bx1xnv5_34oaCEAePxcrW7aJoN5_=w800',
    duration: '03:45',
    quality: '1080p Cinema',
    genre: 'Vinyl Acoustic',
    year: '2024',
    description: 'Rustic acoustic melodies interwoven with slow-revolving vinyl record warmth.',
    folderId: '1aev0JuD8T9dfzoV-T_NY7qDzvyLE-Snz',
    folderName: 'Music & Vinyl CD',
    folderPath: ['Music & Vinyl CD'],
    streamUrl: `${STREAM_BASE}/1JF02Bx1xnv5_34oaCEAePxcrW7aJoN5_`,
    previewUrl: 'https://drive.google.com/file/d/1JF02Bx1xnv5_34oaCEAePxcrW7aJoN5_/preview',
  },
  {
    id: '2',
    title: '[A day before us] EP.07 Before I See You',
    fileId: '1we2ShPu7oX6EnBJBZsEvSjMA5ABD3Wwo',
    type: 'video',
    thumbnail: 'https://lh3.googleusercontent.com/u/0/d/1we2ShPu7oX6EnBJBZsEvSjMA5ABD3Wwo=w800',
    duration: '02:18',
    quality: '1080p Cinema',
    genre: 'Anime Romance',
    year: '2023',
    description: 'Sweet moments of youth and tender flutter right before a destined rendezvous.',
    folderId: '1vWP0fcAVjoyHvhO7cTfkNOpsfhMCiUhb',
    folderName: 'Cinema & Anime',
    folderPath: ['Cinema & Anime'],
    streamUrl: `${STREAM_BASE}/1we2ShPu7oX6EnBJBZsEvSjMA5ABD3Wwo`,
    previewUrl: 'https://drive.google.com/file/d/1we2ShPu7oX6EnBJBZsEvSjMA5ABD3Wwo/preview',
  },
  {
    id: '3',
    title: '[A day before us] EP.10 A Day Before Us',
    fileId: '1O452snalJ0QZiv_wG3yjdYO2WfS6MmwR',
    type: 'video',
    thumbnail: 'https://lh3.googleusercontent.com/u/0/d/1O452snalJ0QZiv_wG3yjdYO2WfS6MmwR=w800',
    duration: '02:40',
    quality: '1080p Cinema',
    genre: 'Anime Romance',
    year: '2023',
    description: 'A touching finale filled with pastel sunsets, memories, and unspoken feelings.',
    folderId: '1vWP0fcAVjoyHvhO7cTfkNOpsfhMCiUhb',
    folderName: 'Cinema & Anime',
    folderPath: ['Cinema & Anime'],
    streamUrl: `${STREAM_BASE}/1O452snalJ0QZiv_wG3yjdYO2WfS6MmwR`,
    previewUrl: 'https://drive.google.com/file/d/1O452snalJ0QZiv_wG3yjdYO2WfS6MmwR/preview',
  },
  {
    id: '4',
    title: 'Given Ep 1 — Boys in the Band',
    fileId: '1yX7B3j8bGzMjz9J3vQNubsioXnSpZGYZ',
    type: 'video',
    thumbnail: 'https://lh3.googleusercontent.com/u/0/d/1yX7B3j8bGzMjz9J3vQNubsioXnSpZGYZ=w800',
    duration: '22:50',
    quality: '1080p Cinema',
    genre: 'Music Anime',
    year: '2022',
    description: 'A worn Gibson guitar strung with fresh strings opens up a powerful band journey.',
    folderId: '1vWP0fcAVjoyHvhO7cTfkNOpsfhMCiUhb',
    folderName: 'Cinema & Anime',
    folderPath: ['Cinema & Anime'],
    streamUrl: `${STREAM_BASE}/1yX7B3j8bGzMjz9J3vQNubsioXnSpZGYZ`,
    previewUrl: 'https://drive.google.com/file/d/1yX7B3j8bGzMjz9J3vQNubsioXnSpZGYZ/preview',
  },
  {
    id: '5',
    title: 'Mellow Vinyl Reel 00dfe163',
    fileId: '1EPoqyxyrMdJUDw-W1CXmhjODkXso8PxT',
    type: 'video',
    thumbnail: 'https://lh3.googleusercontent.com/u/0/d/1EPoqyxyrMdJUDw-W1CXmhjODkXso8PxT=w800',
    duration: '01:15',
    quality: '720p HD',
    genre: 'Studio Reel',
    year: '2024',
    description: 'Spontaneous studio reel capturing everyday rhythms with nostalgic film grain.',
    folderId: '12yDjHh3K9SQk_WyT0Wulg_mUZ4WGtODL',
    folderName: 'Studio Shorts & Lo-Fi',
    folderPath: ['Studio Shorts & Lo-Fi'],
    streamUrl: `${STREAM_BASE}/1EPoqyxyrMdJUDw-W1CXmhjODkXso8PxT`,
    previewUrl: 'https://drive.google.com/file/d/1EPoqyxyrMdJUDw-W1CXmhjODkXso8PxT/preview',
  },
  {
    id: '6',
    title: 'Neon Grooves Reel 049a4921',
    fileId: '1Vk2wJUYjFWqh77VCICGc8wx8XIKKgmmP',
    type: 'video',
    thumbnail: 'https://lh3.googleusercontent.com/u/0/d/1Vk2wJUYjFWqh77VCICGc8wx8XIKKgmmP=w800',
    duration: '01:42',
    quality: '720p HD',
    genre: 'Studio Reel',
    year: '2024',
    description: 'Upbeat visual short with electric cyber pink vibes and pulsing synthwave cues.',
    folderId: '12yDjHh3K9SQk_WyT0Wulg_mUZ4WGtODL',
    folderName: 'Studio Shorts & Lo-Fi',
    folderPath: ['Studio Shorts & Lo-Fi'],
    streamUrl: `${STREAM_BASE}/1Vk2wJUYjFWqh77VCICGc8wx8XIKKgmmP`,
    previewUrl: 'https://drive.google.com/file/d/1Vk2wJUYjFWqh77VCICGc8wx8XIKKgmmP/preview',
  },
  {
    id: '7',
    title: 'Midnight Vinyl Lounge — Cyber City Pop Track',
    fileId: '1JF02Bx1xnv5_34oaCEAePxcrW7aJoN5_',
    type: 'audio',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    duration: '03:45',
    quality: 'Hi-Fi 24bit/96kHz',
    genre: 'City Pop / Vinyl CD',
    year: '2024',
    description: 'Audiophile vinyl pressing with warm bassline, lush brass, and 80s analog soul.',
    folderId: '1aev0JuD8T9dfzoV-T_NY7qDzvyLE-Snz',
    folderName: 'Music & Vinyl CD',
    folderPath: ['Music & Vinyl CD'],
    streamUrl: `${STREAM_BASE}/1JF02Bx1xnv5_34oaCEAePxcrW7aJoN5_`,
    previewUrl: 'https://drive.google.com/file/d/1JF02Bx1xnv5_34oaCEAePxcrW7aJoN5_/preview',
  }
];

const DEFAULT_FOLDERS: FolderItem[] = [
  { id: '1aev0JuD8T9dfzoV-T_NY7qDzvyLE-Snz', name: 'Music & Vinyl CD', path: ['Music & Vinyl CD'] },
  { id: '1vWP0fcAVjoyHvhO7cTfkNOpsfhMCiUhb', name: 'Cinema & Anime', path: ['Cinema & Anime'] },
  { id: '12yDjHh3K9SQk_WyT0Wulg_mUZ4WGtODL', name: 'Studio Shorts & Lo-Fi', path: ['Studio Shorts & Lo-Fi'] },
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
            let folderName = item.folderName || 'General Crate';
            if (folderName === 'Nhạc') folderName = 'Music & Vinyl CD';
            else if (folderName === 'Phim') folderName = 'Cinema & Anime';
            else if (folderName === 'Video nhảm nhí') folderName = 'Studio Shorts & Lo-Fi';

            const folderPath = Array.isArray(item.folderPath) && item.folderPath.length > 0
              ? item.folderPath.map((p: string) => {
                  if (p === 'Nhạc') return 'Music & Vinyl CD';
                  if (p === 'Phim') return 'Cinema & Anime';
                  if (p === 'Video nhảm nhí') return 'Studio Shorts & Lo-Fi';
                  return p;
                })
              : [folderName];

            return {
              ...item,
              folderName,
              folderPath,
              streamUrl: `${streamBase}/${item.fileId}`,
              previewUrl: `https://drive.google.com/file/d/${item.fileId}/preview`,
              quality: item.quality || (item.type === 'audio' ? 'Hi-Fi 24-bit' : '1080p Cinema'),
            };
          });

          // Process folders
          let folders: FolderItem[] = DEFAULT_FOLDERS;
          if (Array.isArray(json.folders) && json.folders.length > 0) {
            folders = json.folders.map((f: any) => {
              let fName = f.name;
              if (fName === 'Nhạc') fName = 'Music & Vinyl CD';
              else if (fName === 'Phim') fName = 'Cinema & Anime';
              else if (fName === 'Video nhảm nhí') fName = 'Studio Shorts & Lo-Fi';

              const path = Array.isArray(f.path)
                ? f.path.map((p: string) => {
                    if (p === 'Nhạc') return 'Music & Vinyl CD';
                    if (p === 'Phim') return 'Cinema & Anime';
                    if (p === 'Video nhảm nhí') return 'Studio Shorts & Lo-Fi';
                    return p;
                  })
                : [fName];

              return {
                id: f.id,
                name: fName,
                path,
                parentId: f.parentId,
              };
            });
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
