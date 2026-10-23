import React from 'react';
import { VinylDisc } from './VinylDisc';
import { Play } from 'lucide-react';

interface CDSleeveDiscPackageProps {
  thumbnail?: string;
  title: string;
  quality?: string;
  isHovered?: boolean;
  isPlaying?: boolean;
  labelColor?: string;
  size?: number; // Base square sleeve size in px (default: 160)
  showPlayButton?: boolean;
}

export const CDSleeveDiscPackage: React.FC<CDSleeveDiscPackageProps> = ({
  thumbnail,
  title,
  quality = '1080P MASTER',
  isHovered = false,
  isPlaying = false,
  labelColor = '#FF2D75',
  size = 160,
  showPlayButton = true,
}) => {
  // Disc is slightly smaller than the sleeve (realistic 92%)
  const discSize = Math.round(size * 0.92);

  // Maximum slide distance when hovered/playing
  const slideOffset = isHovered || isPlaying ? Math.round(size * 0.42) : Math.round(size * 0.22);

  return (
    <div
      className="relative select-none flex items-center justify-start mx-auto my-1 pt-2 group/package transition-all overflow-visible"
      style={{
        width: size + slideOffset + 12,
        height: size + 20,
      }}
    >
      {/* ─── 1. The Vinyl CD Disc (Tucked behind & sliding out) ─── */}
      <div
        className="absolute top-1/2 -translate-y-1/2 z-0 transition-transform duration-500 ease-out pointer-events-none"
        style={{
          left: size - (discSize * 0.82) + slideOffset,
        }}
      >
        <VinylDisc
          size={discSize}
          isSpinning={isHovered || isPlaying}
          speed={isPlaying ? 'normal' : 'slow'}
          coverImage={thumbnail}
          labelColor={labelColor}
          title={title}
        />
      </div>

      {/* ─── 2. The Outer CD Sleeve Jacket (Bọc đĩa CD bên ngoài) ─── */}
      <div
        className="relative z-10 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 shrink-0 border border-white/15"
        style={{
          width: size,
          height: size,
          boxShadow: isPlaying
            ? '0 14px 32px rgba(0,0,0,0.9), 0 0 25px var(--theme-primary-glow)'
            : '0 10px 24px rgba(0,0,0,0.85), 0 0 10px rgba(0,0,0,0.4)',
          background: '#120b14',
        }}
      >
        {/* Album Artwork Image */}
        <div className="w-full h-full relative overflow-hidden bg-black/90">
          <img
            src={thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover/package:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
            }}
          />

          {/* Realistic Ringwear Imprint of the Vinyl Record inside */}
          <div
            className="absolute inset-0 pointer-events-none rounded-full border border-white/10 opacity-30"
            style={{
              margin: 'auto',
              width: '90%',
              height: '90%',
            }}
          />

          {/* Protective Cellophane Plastic Wrap Gloss Sheen (Bọc nilon bóng ngoài bao đĩa) */}
          <div className="absolute inset-0 cd-sleeve-sheen pointer-events-none" />

          {/* Left Spine of the Cardboard Sleeve */}
          <div className="absolute left-0 top-0 bottom-0 w-3 cd-spine-shadow border-r border-white/10 flex flex-col justify-between py-2 text-[6px] font-courier text-white/50 tracking-tighter uppercase select-none pointer-events-none">
            <span className="transform -rotate-90 origin-center translate-y-3 font-bold">VINYL</span>
            <span className="transform -rotate-90 origin-center -translate-y-3 font-bold">STEREO</span>
          </div>

          {/* Right Thumb Notch Opening (Khuyết ngón tay rút đĩa bên mép phải) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-12 rounded-l-full bg-black/80 border-l border-y border-white/20 pointer-events-none shadow-inner" />



          {/* Center Play Button on Hover */}
          {showPlayButton && (
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-[var(--theme-primary)] text-white flex items-center justify-center shadow-xl shadow-[var(--theme-primary)]/50 transform scale-90 group-hover/package:scale-100 transition-transform">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
