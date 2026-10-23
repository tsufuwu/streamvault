import React from 'react';
import { MediaItem } from '../types';
import { Play, Pause, SkipForward, X, Disc3 } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface MobileMiniPlayerProps {
  media: MediaItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext?: () => void;
  onExpand: () => void;
  onClose: () => void;
}

export const MobileMiniPlayer: React.FC<MobileMiniPlayerProps> = ({
  media,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onExpand,
  onClose,
}) => {
  if (!media) return null;

  const progressPct = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div
      className="md:hidden fixed left-3 right-3 bottom-[62px] z-40 rounded-2xl bg-[#140813]/95 border border-[var(--theme-border)] shadow-2xl backdrop-blur-2xl overflow-hidden transition-all duration-300 animate-slide-up"
      style={{
        boxShadow: '0 10px 30px rgba(0,0,0,0.85), 0 0 20px var(--theme-primary-glow)',
      }}
    >
      {/* 2px Progress Bar at Top of Mini-Player */}
      <div className="w-full h-1 bg-white/10 relative">
        <div
          className="h-full bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary-light)] transition-all duration-200"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="px-3 py-2 flex items-center justify-between gap-3">
        {/* Left: Tappable Area to Expand to Fullscreen Player */}
        <div
          onClick={() => {
            sounds.playClick();
            onExpand();
          }}
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none group"
        >
          {/* Spinning Mini Vinyl Thumbnail */}
          <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-black/80 border border-white/20 shadow-md">
            <img
              src={media.thumbnail}
              alt={media.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
              }}
            />
            {/* Vinyl record overlay icon */}
            <div
              className={`absolute inset-0 bg-black/30 flex items-center justify-center ${
                isPlaying ? 'animate-vinyl-spin' : ''
              }`}
            >
              <div className="w-4 h-4 rounded-full border border-white/60 flex items-center justify-center bg-black/50">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)]" />
              </div>
            </div>
          </div>

          {/* Media Info (Alegreya + Courier) */}
          <div className="truncate flex-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)] animate-ping shrink-0" />
              <h4 className="font-alegreya text-sm font-bold text-white truncate tracking-wide group-hover:text-[var(--theme-primary-light)]">
                {media.title}
              </h4>
            </div>
            <p className="font-courier text-[10px] text-neutral-400 font-bold uppercase truncate mt-0.5">
              <span>{media.folderName || 'Folder'}</span>
              {media.duration && (
                <>
                  <span className="mx-1 text-white/30">•</span>
                  <span className="text-[var(--theme-primary-light)]">
                    {media.duration}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right: Quick Action Transport Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Play / Pause */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="w-9 h-9 rounded-full bg-[var(--theme-primary)] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Next Track */}
          {onNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                sounds.playClick();
                onNext();
              }}
              className="w-8 h-8 rounded-full text-neutral-300 hover:text-white flex items-center justify-center active:scale-95 transition-colors"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          )}

          {/* Dismiss Mini Player */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              sounds.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
