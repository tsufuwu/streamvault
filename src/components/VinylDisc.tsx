import React from 'react';
import { WalkingVinylCat } from './WalkingVinylCat';

interface VinylDiscProps {
  size?: number;
  isSpinning?: boolean;
  coverImage?: string;
  labelColor?: string;
  speed?: 'normal' | 'fast' | 'slow';
  className?: string;
  title?: string;
}

export const VinylDisc: React.FC<VinylDiscProps> = ({
  size = 150,
  isSpinning = false,
  coverImage,
  labelColor = '#FF2D75',
  speed = 'normal',
  className = '',
  title = 'Vinyl Record',
}) => {
  const spinClass = isSpinning
    ? speed === 'fast'
      ? 'animate-vinyl-spin-fast'
      : speed === 'slow'
      ? 'animate-vinyl-spin-slow'
      : 'animate-vinyl-spin'
    : '';

  return (
    <div
      className={`relative rounded-full select-none flex-shrink-0 flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
      }}
      title={title}
    >
      {/* ─── 1. The Spinning Vinyl Record Platter ─── */}
      <div
        className={`w-full h-full rounded-full flex items-center justify-center ${spinClass}`}
        style={{
          background: 'radial-gradient(circle at center, #1b0c19 0%, #100610 35%, #080307 70%, #030103 100%)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.9), inset 0 0 12px rgba(255,255,255,0.08)',
        }}
      >
      {/* Grooves & Conic Light Reflection Sheen */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `
            repeating-radial-gradient(
              circle at center,
              transparent 0,
              transparent 3px,
              rgba(255, 255, 255, 0.04) 3.5px,
              transparent 4px
            ),
            conic-gradient(
              from 45deg at 50% 50%,
              rgba(255, 255, 255, 0.12) 0deg,
              transparent 60deg,
              rgba(255, 255, 255, 0.08) 120deg,
              transparent 180deg,
              rgba(255, 255, 255, 0.12) 240deg,
              transparent 300deg,
              rgba(255, 255, 255, 0.08) 360deg
            )
          `,
          mixBlendMode: 'screen',
        }}
      />

      {/* Outer Rim Bevel */}
      <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
      <div className="absolute inset-1.5 rounded-full border border-white/5 pointer-events-none" />
      <div className="absolute inset-3.5 rounded-full border border-white/10 pointer-events-none" />
      <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none" />

      {/* Center Label (Authentic Vintage Record Label) */}
      <div
        className="relative rounded-full overflow-hidden flex flex-col items-center justify-center border-2 border-white/40 shadow-lg"
        style={{
          width: Math.max(38, size * 0.34),
          height: Math.max(38, size * 0.34),
          backgroundColor: labelColor,
          boxShadow: `0 0 14px ${labelColor}90, inset 0 0 8px rgba(0,0,0,0.6)`,
        }}
      >
        {coverImage ? (
          <div className="w-full h-full relative">
            <img
              src={coverImage}
              alt="Vinyl Label"
              className="w-full h-full object-cover"
            />
            {/* Dark vignette on label */}
            <div className="absolute inset-0 bg-black/30 pointer-events-none" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center font-courier text-white font-black leading-none pointer-events-none text-center px-1">
            <span style={{ fontSize: Math.max(6, size * 0.055) }} className="tracking-tighter">VINYL</span>
            <span style={{ fontSize: Math.max(5, size * 0.04) }} className="text-white/80 font-normal">33 RPM</span>
          </div>
        )}

        {/* Center Spindle Hole */}
        <div
          className="absolute rounded-full bg-[#070509] border border-white/60 shadow-inner z-10"
          style={{
            width: Math.max(8, size * 0.075),
            height: Math.max(8, size * 0.075),
          }}
        />
      </div>
      </div>

      {/* ─── 2. Cute Black Cat Walking on top of the vinyl disc! ─── */}
      <WalkingVinylCat isWalking={isSpinning} discSize={size} />
    </div>
  );
};
