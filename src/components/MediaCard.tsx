import React, { useState } from 'react';
import { MediaItem } from '../types';
import { CDSleeveDiscPackage } from './CDSleeveDiscPackage';
import { Heart, ExternalLink, Trash2 } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface MediaCardProps {
  media: MediaItem;
  isFavorite: boolean;
  isPlaying: boolean;
  onPlay: (media: MediaItem) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteCustom?: (id: string) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  isFavorite,
  isPlaying,
  onPlay,
  onToggleFavorite,
  onDeleteCustom,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = () => {
    sounds.playNeedleDrop();
    onPlay(media);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    onToggleFavorite(media.id);
  };

  const handleOpenDrive = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    window.open(`https://drive.google.com/file/d/${media.fileId}/view`, '_blank');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteCustom) {
      sounds.playClick();
      onDeleteCustom(media.id);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => {
        setIsHovered(true);
        sounds.playClick();
      }}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative rounded-2xl cursor-pointer transition-all duration-300 p-4 flex flex-col justify-between bg-[var(--theme-bg-surface)]/95 border border-[var(--theme-border)] backdrop-blur-xl ${
        isPlaying
          ? 'ring-2 ring-[var(--theme-primary)] scale-[1.02] shadow-2xl shadow-[var(--theme-primary-glow)]'
          : 'hover:-translate-y-1 hover:border-[var(--theme-primary)]/50 hover:shadow-xl hover:shadow-[var(--theme-primary-glow)]/20'
      }`}
    >
      {/* ─── CD Sleeve Wrapper (Bọc đĩa CD bên ngoài + đĩa than) ─── */}
      <div className="w-full flex items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 overflow-hidden">
        {/* Mobile View: size 105px */}
        <div className="block sm:hidden">
          <CDSleeveDiscPackage
            thumbnail={media.thumbnail}
            title={media.title}
            quality={media.quality || ''}
            isHovered={isHovered}
            isPlaying={isPlaying}
            labelColor={media.type === 'audio' ? 'var(--theme-primary)' : '#10B981'}
            size={105}
            showPlayButton={true}
          />
        </div>
        {/* Desktop View: size 155px */}
        <div className="hidden sm:block">
          <CDSleeveDiscPackage
            thumbnail={media.thumbnail}
            title={media.title}
            quality={media.quality || ''}
            isHovered={isHovered}
            isPlaying={isPlaying}
            labelColor={media.type === 'audio' ? 'var(--theme-primary)' : '#10B981'}
            size={155}
            showPlayButton={true}
          />
        </div>
      </div>

      {/* ─── Album Sleeve Info Section (Interleaved Alegreya & Courier) ─── */}
      <div className="pt-2 sm:pt-3 border-t border-white/10 flex flex-col justify-between flex-grow">
        <div>
          {/* Card Title in Alegreya */}
          <h3
            className="font-alegreya text-xs sm:text-base md:text-lg font-bold text-[#FFF0F5] line-clamp-1 group-hover:text-[var(--theme-primary-light)] transition-colors tracking-wide"
            title={media.title}
          >
            {media.title}
          </h3>

          {/* Typewriter Note in Courier New */}
          {media.description && (
            <p className="font-courier text-[10px] sm:text-xs text-neutral-400 mt-0.5 sm:mt-1 line-clamp-1 font-normal hidden sm:block">
              {media.description}
            </p>
          )}
        </div>

        {/* Bottom Technical Stamps & Actions */}
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-white/5 flex items-center justify-between font-courier">
          <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-[11px] font-bold truncate max-w-[110px] sm:max-w-none">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-neutral-300 truncate" title={media.folderName || 'Chưa phân loại'}>
              <span className="text-[10px]">📁</span>
              <span className="truncate">{media.folderName || 'Chưa phân loại'}</span>
            </span>
            {media.duration && (
              <span className="text-[var(--theme-primary-light)] hidden sm:inline">
                [{media.duration}]
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {media.isCustom && onDeleteCustom && (
              <button
                onClick={handleDelete}
                className="p-1 sm:p-1.5 rounded-lg bg-red-950/80 hover:bg-red-700 text-red-200 transition-colors"
                title="Remove custom media"
              >
                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            )}

            <button
              onClick={handleFavoriteClick}
              className={`p-1 sm:p-1.5 rounded-lg transition-colors ${
                isFavorite
                  ? 'text-pink-500 bg-pink-500/10'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current text-pink-500' : ''}`} />
            </button>

            <button
              onClick={handleOpenDrive}
              className="p-1 sm:p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Open on Google Drive"
            >
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
