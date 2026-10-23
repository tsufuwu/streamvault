import React from 'react';
import { CDSleeveDiscPackage } from './CDSleeveDiscPackage';
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
    <div className="relative rounded-3xl overflow-hidden border border-[var(--theme-border)] bg-gradient-to-br from-[var(--theme-bg-surface)]/95 via-[var(--theme-bg-card)]/90 to-black/90 backdrop-blur-2xl p-6 sm:p-10 mb-8 shadow-2xl">
      {/* Radiant ambient glow */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-25 pointer-events-none"
        style={{ background: 'var(--theme-primary)' }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full blur-[140px] opacity-15 pointer-events-none"
        style={{ background: 'var(--theme-primary-hover)' }}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Editorial Headline & Actions */}
        <div className="lg:col-span-7 space-y-4">
          {/* Top Tape Stamp Badge (Courier New) */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--theme-primary)]/15 border border-[var(--theme-primary)]/30 text-xs font-courier font-bold text-[var(--theme-primary-light)] tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-[var(--theme-primary)] animate-ping" />
            <span>[STUDIO MASTER // HI-FIDELITY VINYL CD STREAMING]</span>
          </div>

          {/* Main Editorial Headline (Alegreya) */}
          <h1 className="font-alegreya text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
            The Sonic Warmth &amp;{' '}
            <span
              className="italic bg-clip-text text-transparent bg-gradient-to-r from-[var(--theme-primary)] via-pink-400 to-amber-300"
              style={{
                textShadow: '0 0 40px var(--theme-primary-glow)',
              }}
            >
              Cinematic Noir
            </span>{' '}
            of Vinyl Records
          </h1>

          {/* Subtitle in Typewriter Courier New */}
          <p className="font-courier text-xs sm:text-sm text-neutral-300 max-w-2xl font-normal leading-relaxed">
            Immerse yourself in authentic analog textures, lossless CD acoustics, and uncompressed Google Drive cinema playback. Pure streaming with zero ads and true turntable groove dynamics.
          </p>

          {/* Technical Audio Engineering Metrics (Courier New) */}
          <div className="pt-2 flex flex-wrap items-center gap-3 font-courier text-xs text-neutral-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 font-bold">
              <Disc className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
              <span>{totalTracks} DISCS &amp; REELS</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 font-bold">
              <Film className="w-3.5 h-3.5 text-emerald-400" />
              <span>1080P MASTER CINEMA</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 font-bold">
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>24-BIT/96KHZ FLAC HI-FI</span>
            </div>
          </div>

          {/* Featured Play Action */}
          {featuredMedia && (
            <div className="pt-3 flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  sounds.playNeedleDrop();
                  onPlayFeatured(featuredMedia);
                }}
                className="px-6 py-3 rounded-2xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white text-sm font-bold shadow-xl shadow-[var(--theme-primary-glow)] flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span className="font-alegreya text-base font-bold">Spin Featured:</span>
                <span className="font-courier text-xs opacity-90 truncate max-w-[200px]">
                  {featuredMedia.title}
                </span>
              </button>

              <div className="font-courier text-xs text-neutral-400">
                CRATE: <span className="text-white font-bold">{featuredMedia.folderName || 'Master Reel'}</span>
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
            className="cursor-pointer group relative p-2"
            title="Click to play featured vinyl CD album!"
          >
            {/* Concentric soundwave pulsing rings */}
            <div className="absolute inset-0 rounded-3xl border border-[var(--theme-primary)]/20 animate-pulse opacity-40 pointer-events-none" />

            {/* Physical CD Sleeve Jacket with sliding vinyl disc */}
            <CDSleeveDiscPackage
              thumbnail={featuredMedia?.thumbnail}
              title={featuredMedia?.title || 'Featured Vinyl Album'}
              quality={featuredMedia?.quality || '1080P MASTER'}
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
  );
};
