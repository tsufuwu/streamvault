import React from 'react';
import { CDSleeveDiscPackage } from './CDSleeveDiscPackage';
import { PeekingCat } from './PeekingCat';
import { Play, Disc, Film, Music } from 'lucide-react';
import { MediaItem } from '../types';
import { sounds } from '../utils/soundEffects';

interface HeroSectionProps {
  featuredMedia: MediaItem | null;
  onPlayFeatured: (item: MediaItem) => void;
  totalTracks: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  featuredMedia,
  onPlayFeatured,
  totalTracks,
}) => {
  return (
    <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[var(--theme-border)] bg-gradient-to-br from-[var(--theme-bg-surface)]/95 via-[var(--theme-bg-card)]/90 to-black/90 backdrop-blur-2xl p-4 sm:p-8 lg:p-10 mb-5 sm:mb-8 shadow-2xl">
      {/* Radiant ambient glow */}
      <div
        className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-[90px] sm:blur-[120px] opacity-25 pointer-events-none"
        style={{ background: 'var(--theme-primary)' }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-60 sm:w-80 h-60 sm:h-80 rounded-full blur-[100px] sm:blur-[140px] opacity-15 pointer-events-none"
        style={{ background: 'var(--theme-primary-hover)' }}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center">
        {/* Left Column: Editorial Headline & Actions */}
        <div className="lg:col-span-7 space-y-3 sm:space-y-4">
          {/* Top Tape Stamp Badge (Courier New) */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[var(--theme-primary)]/15 border border-[var(--theme-primary)]/30 text-[10px] sm:text-xs font-courier font-bold text-[var(--theme-primary-light)] tracking-wider uppercase">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--theme-primary)] animate-ping" />
            <span>[STUDIO MASTER // HI-FI VINYL STREAMING]</span>
          </div>

          {/* Main Editorial Headline (Alegreya) */}
          <h1 className="font-alegreya text-2xl sm:text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
            The Sonic Warmth &amp;{' '}
            <span
              className="italic bg-clip-text text-transparent bg-gradient-to-r from-[var(--theme-primary)] via-pink-400 to-amber-300"
              style={{
                textShadow: '0 0 40px var(--theme-primary-glow)',
              }}
            >
              Cinematic Noir
            </span>{' '}
            of Vinyl
          </h1>

          {/* Subtitle in Typewriter Courier New - Hidden on small mobile to keep screen clean */}
          <p className="font-courier text-xs sm:text-sm text-neutral-300 max-w-2xl font-normal leading-relaxed hidden sm:block">
            Immerse yourself in authentic analog textures, lossless CD acoustics, and uncompressed Google Drive cinema playback. Pure streaming with zero ads and true turntable groove dynamics.
          </p>

          {/* Technical Audio Engineering Metrics (Courier New) */}
          <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2 sm:gap-3 font-courier text-[11px] sm:text-xs text-neutral-300">
            <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-black/50 border border-white/10 font-bold">
              <Disc className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[var(--theme-primary)]" />
              <span>{totalTracks} FILE MEDIA</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-black/50 border border-white/10 font-bold">
              <Film className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-400" />
              <span>GOOGLE DRIVE</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 font-bold">
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>LOSSLESS AUDIO &amp; VIDEO</span>
            </div>
          </div>

          {/* Featured Play Action */}
          {featuredMedia && (
            <div className="pt-2 sm:pt-3 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
              <div className="relative group/play inline-block">
                {/* 🐈 Chú mèo đen lấp ló đằng sau nút Play khi hover */}
                <PeekingCat position="top-right" size={38} className="group-hover/play:-translate-y-6" />
                <button
                  onClick={() => {
                    sounds.playNeedleDrop();
                    onPlayFeatured(featuredMedia);
                  }}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white text-xs sm:text-sm font-bold shadow-xl shadow-[var(--theme-primary-glow)] flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all relative z-10"
                >
                  <Play className="w-4 h-4 fill-current shrink-0" />
                  <span className="font-alegreya text-sm sm:text-base font-bold">Phát nổi bật:</span>
                  <span className="font-courier text-xs opacity-90 truncate max-w-[180px] sm:max-w-[200px]">
                    {featuredMedia.title}
                  </span>
                </button>
              </div>

              <div className="font-courier text-[10px] sm:text-xs text-neutral-400 text-center sm:text-left">
                THƯ MỤC: <span className="text-white font-bold">{featuredMedia.folderName || 'Thư mục gốc'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Hero Outer CD Sleeve Jacket + Vinyl Disc */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          <div
            onClick={() => {
              sounds.playVinylScratch();
              sounds.playBeatDrop(75);
              if (featuredMedia) onPlayFeatured(featuredMedia);
            }}
            className="cursor-pointer group relative p-1 sm:p-2"
            title="Click to play featured vinyl CD album!"
          >
            {/* 🐈 Chú mèo đen lấp ló đằng sau album khi hover */}
            <PeekingCat position="top-center" size={54} className="group-hover:-translate-y-8" />
            {/* Concentric soundwave pulsing rings */}
            <div className="absolute inset-0 rounded-3xl border border-[var(--theme-primary)]/20 animate-pulse opacity-40 pointer-events-none" />

            {/* Mobile View: size 130px */}
            <div className="block lg:hidden">
              <CDSleeveDiscPackage
                thumbnail={featuredMedia?.thumbnail}
                title={featuredMedia?.title || 'Featured Vinyl Album'}
                quality={featuredMedia?.quality || ''}
                isHovered={true}
                isPlaying={true}
                labelColor="var(--theme-primary)"
                size={130}
                showPlayButton={true}
              />
            </div>

            {/* Desktop View: size 190px */}
            <div className="hidden lg:block">
              <CDSleeveDiscPackage
                thumbnail={featuredMedia?.thumbnail}
                title={featuredMedia?.title || 'Featured Vinyl Album'}
                quality={featuredMedia?.quality || ''}
                isHovered={true}
                isPlaying={true}
                labelColor="var(--theme-primary)"
                size={190}
                showPlayButton={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
