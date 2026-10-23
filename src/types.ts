export type MediaType = 'video' | 'audio';

export type AppTheme = 'vinyl-pink' | 'citrus-orange' | 'amethyst-violet' | 'vaporwave-y2k';

export interface MediaItem {
  id: string;
  title: string;
  fileId: string;
  type: MediaType;
  thumbnail?: string;
  duration?: string;
  quality?: string;
  genre?: string;
  year?: string;
  description?: string;
  folderId?: string;
  folderName?: string;
  folderPath?: string[];
  streamUrl?: string;
  previewUrl?: string;
  isCustom?: boolean;
}

export interface FolderItem {
  id: string;
  name: string;
  path: string[];
  parentId?: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isLooping: boolean;
  isTheater: boolean;
  useDriveIframe: boolean;
  audioRpm: 33 | 45 | 78;
  analogCrackle: boolean;
}
