import React from 'react';
import { MediaType } from '../types';
import { Disc3, Film, Music, Heart, Folder, LayoutGrid, List, ChevronRight, FolderTree } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface CategoryFolderBarProps {
  mediaTypeFilter: 'all' | MediaType | 'favorites';
  onMediaTypeChange: (type: 'all' | MediaType | 'favorites') => void;
  folders: string[];
  selectedFolder: string | null;
  onSelectFolder: (folder: string | null) => void;
  currentPath?: string[];
  onPathChange?: (path: string[]) => void;
  subfolders?: string[];
  counts: {
    all: number;
    video: number;
    audio: number;
    favorites: number;
  };
  isCompactView: boolean;
  onToggleCompactView: () => void;
}

export const CategoryFolderBar: React.FC<CategoryFolderBarProps> = ({
  mediaTypeFilter,
  onMediaTypeChange,
  folders,
  selectedFolder,
  onSelectFolder,
  currentPath = [],
  onPathChange,
  subfolders = [],
  counts,
  isCompactView,
  onToggleCompactView,
}) => {
  return (
    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
      {/* Top Media Type Segmented Chips - Horizontal Scrollable on Mobile like Spotify/YouTube */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0 flex-nowrap sm:flex-wrap w-full sm:w-auto">
          {/* All */}
          <button
            onClick={() => {
              sounds.playClick();
              onMediaTypeChange('all');
            }}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold border shrink-0 transition-all ${
              mediaTypeFilter === 'all'
                ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)] text-white shadow-lg shadow-[var(--theme-primary-glow)]/40 scale-[1.02]'
                : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-alegreya text-xs sm:text-sm font-bold">All Records</span>
            <span className="font-courier px-1.5 py-0.5 rounded-full bg-black/40 text-[9px] sm:text-[10px] font-bold">
              {counts.all}
            </span>
          </button>

          {/* Videos */}
          <button
            onClick={() => {
              sounds.playClick();
              onMediaTypeChange('video');
            }}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold border shrink-0 transition-all ${
              mediaTypeFilter === 'video'
                ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)] text-white shadow-lg shadow-[var(--theme-primary-glow)]/40 scale-[1.02]'
                : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-alegreya text-xs sm:text-sm font-bold">Cinema &amp; Video</span>
            <span className="font-courier px-1.5 py-0.5 rounded-full bg-black/40 text-[9px] sm:text-[10px] font-bold">
              {counts.video}
            </span>
          </button>

          {/* Audio */}
          <button
            onClick={() => {
              sounds.playClick();
              onMediaTypeChange('audio');
            }}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold border shrink-0 transition-all ${
              mediaTypeFilter === 'audio'
                ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)] text-white shadow-lg shadow-[var(--theme-primary-glow)]/40 scale-[1.02]'
                : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-alegreya text-xs sm:text-sm font-bold">Music &amp; Audio CD</span>
            <span className="font-courier px-1.5 py-0.5 rounded-full bg-black/40 text-[9px] sm:text-[10px] font-bold">
              {counts.audio}
            </span>
          </button>

          {/* Favorites */}
          <button
            onClick={() => {
              sounds.playClick();
              onMediaTypeChange('favorites');
            }}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold border shrink-0 transition-all ${
              mediaTypeFilter === 'favorites'
                ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-600/40 scale-[1.02]'
                : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400 fill-current" />
            <span className="font-alegreya text-xs sm:text-sm font-bold">Favorites</span>
            <span className="font-courier px-1.5 py-0.5 rounded-full bg-black/40 text-[9px] sm:text-[10px] font-bold">
              {counts.favorites}
            </span>
          </button>
        </div>

        {/* View Layout Toggle */}
        <button
          onClick={() => {
            sounds.playClick();
            onToggleCompactView();
          }}
          className="font-courier p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1.5 text-xs font-bold"
          title={isCompactView ? 'Switch to Wide Grid' : 'Switch to Compact Grid'}
        >
          {isCompactView ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
          <span>{isCompactView ? '[COMPACT]' : '[WIDE GRID]'}</span>
        </button>
      </div>

      {/* Breadcrumb Navigation when navigated into deep folders */}
      {currentPath.length > 0 && onPathChange && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 font-courier text-xs text-neutral-300 overflow-x-auto scrollbar-none">
          <FolderTree className="w-3.5 h-3.5 text-[var(--theme-primary)] shrink-0" />
          <button
            onClick={() => {
              sounds.playClick();
              onSelectFolder(null);
              onPathChange([]);
            }}
            className="hover:text-white underline font-bold shrink-0"
          >
            [ALL CRATES]
          </button>

          {currentPath.map((crumb, idx) => {
            const isLast = idx === currentPath.length - 1;
            const crumbPath = currentPath.slice(0, idx + 1);
            return (
              <React.Fragment key={crumb}>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                {isLast ? (
                  <span className="text-[var(--theme-primary-light)] font-bold shrink-0">
                    📁 {crumb}
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onSelectFolder(crumb);
                      onPathChange(crumbPath);
                    }}
                    className="hover:text-white font-bold shrink-0"
                  >
                    📁 {crumb}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Subfolder tabs if inside a folder that has subfolders */}
      {currentPath.length > 0 && subfolders.length > 0 && onPathChange && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-courier text-xs">
          <span className="text-neutral-500 font-bold flex items-center gap-1 shrink-0 uppercase tracking-wider text-[11px]">
            <span>SUB-CRATES:</span>
          </span>
          {subfolders.map((subName) => (
            <button
              key={subName}
              onClick={() => {
                sounds.playClick();
                onSelectFolder(subName);
                onPathChange([...currentPath, subName]);
              }}
              className="px-2.5 py-1 rounded-lg shrink-0 transition-colors flex items-center gap-1 font-bold bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:border-[var(--theme-primary)] hover:bg-white/10 text-xs"
            >
              <span>📂 {subName}</span>
            </button>
          ))}
        </div>
      )}

      {/* Primary Folder Crates Navigation Tabs (when currentPath is empty) */}
      {currentPath.length === 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-courier text-xs">
          <span className="text-neutral-500 font-bold flex items-center gap-1 shrink-0 uppercase tracking-wider">
            <Folder className="w-3.5 h-3.5" />
            <span>CRATE:</span>
          </span>

          {/* All Folders Option */}
          <button
            onClick={() => {
              sounds.playClick();
              onSelectFolder(null);
              if (onPathChange) onPathChange([]);
            }}
            className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors font-bold ${
              selectedFolder === null
                ? 'bg-white/15 text-white border border-white/20'
                : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
          >
            [ALL CRATES]
          </button>

          {/* Individual Folder Tabs */}
          {folders.map((folderName) => (
            <button
              key={folderName}
              onClick={() => {
                sounds.playClick();
                onSelectFolder(folderName);
                if (onPathChange) onPathChange([folderName]);
              }}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors flex items-center gap-1.5 font-bold ${
                selectedFolder === folderName
                  ? 'bg-[var(--theme-primary)]/20 border border-[var(--theme-primary)] text-[var(--theme-primary-light)]'
                  : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>📁 {folderName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
