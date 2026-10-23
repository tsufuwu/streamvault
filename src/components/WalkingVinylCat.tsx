import React from 'react';

interface WalkingVinylCatProps {
  isWalking?: boolean;
  discSize?: number;
  className?: string;
}

export const WalkingVinylCat: React.FC<WalkingVinylCatProps> = ({
  isWalking = false,
  discSize = 150,
  className = '',
}) => {
  // Proportional sizing: sleek, slender, elegant
  const catWidth = Math.max(34, Math.round(discSize * 0.28));
  const catHeight = Math.round(catWidth * 0.62);

  return (
    <div
      className={`absolute z-30 pointer-events-none select-none transition-all duration-300 ${className}`}
      style={{
        // Perched right on the top-right curved rim (mép trên của cái đĩa)
        top: -catHeight * 0.72,
        right: Math.max(14, discSize * 0.16),
        width: catWidth,
        height: catHeight,
        transform: 'rotate(16deg)',
      }}
      title="Black cat walking on vinyl disc rim"
    >
      <svg
        viewBox="0 0 76 46"
        className="w-full h-full overflow-visible drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cat Walk Bob Container */}
        <g className={isWalking ? 'animate-cat-bob' : ''}>
          {/* 1. Graceful Sinuous Tail */}
          <g className="animate-cat-tail origin-[18px_20px]">
            {/* Elegant curved feline tail */}
            <path
              d="M 18 20 C 12 18, 5 12, 6 6 C 7 1, 12 2, 11 7 C 10 11, 13 14, 19 18"
              fill="#0a050c"
              stroke="rgba(255, 45, 117, 0.45)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Subtle luminous tip highlight */}
            <circle cx="8.5" cy="4" r="1.2" fill="var(--theme-primary)" opacity="0.75" />
          </g>

          {/* 2. Inner Back Leg (Phía sau) */}
          <g className={isWalking ? 'animate-cat-paw-bwd origin-[21px_22px]' : ''}>
            <path
              d="M 21 21 C 19 26, 17 32, 15 37 C 14 39, 13 41, 16 41 C 18 41, 19 39, 21 34 C 23 29, 23 25, 23 21 Z"
              fill="#060308"
            />
          </g>

          {/* 3. Inner Front Leg (Phía sau) */}
          <g className={isWalking ? 'animate-cat-paw-bwd origin-[48px_22px]' : ''}>
            <path
              d="M 48 22 C 47 27, 45 33, 44 37 C 43 39, 42 41, 45 41 C 47 41, 48 38, 49 33 C 50 28, 50 25, 50 22 Z"
              fill="#060308"
            />
          </g>

          {/* 4. Elegant Slender Cat Torso */}
          {/* Soft ambient rim glow along back */}
          <path
            d="M 18 20 C 17 14, 26 12, 36 13 C 44 14, 52 17, 53 22 C 53 26, 46 27, 36 26 C 26 25, 19 25, 18 20 Z"
            fill="#0c060e"
            stroke="rgba(255, 255, 255, 0.18)"
            strokeWidth="0.8"
          />

          {/* 5. Outer Back Leg (Phía trước - bước ra mép đĩa) */}
          <g className={isWalking ? 'animate-cat-paw-fwd origin-[25px_22px]' : ''}>
            <path
              d="M 25 21 C 24 26, 23 32, 21 37 C 20 40, 20 42, 24 42 C 26 42, 26 39, 27 34 C 28 29, 28 25, 28 21 Z"
              fill="#100814"
              stroke="rgba(255, 45, 117, 0.35)"
              strokeWidth="0.7"
            />
            {/* Tiny paw pad touching the rim */}
            <ellipse cx="22.5" cy="41.5" rx="2" ry="1.2" fill="#140a18" />
          </g>

          {/* 6. Outer Front Leg (Phía trước - bước ra mép đĩa) */}
          <g className={isWalking ? 'animate-cat-paw-fwd origin-[52px_22px]' : ''}>
            <path
              d="M 52 22 C 52 27, 51 33, 50 37 C 49 40, 49 42, 53 42 C 55 42, 55 39, 56 34 C 56 29, 56 25, 55 22 Z"
              fill="#100814"
              stroke="rgba(255, 45, 117, 0.35)"
              strokeWidth="0.7"
            />
            {/* Tiny paw pad touching the rim */}
            <ellipse cx="51.5" cy="41.5" rx="2" ry="1.2" fill="#140a18" />
          </g>

          {/* 7. Refined Elegant Head & Ears */}
          <g className="origin-[54px_16px]">
            {/* Left Ear (Pointy with neon pink inner ear) */}
            <polygon
              points="49,12 47,2 54,8"
              fill="#09040b"
              stroke="rgba(255, 45, 117, 0.5)"
              strokeWidth="0.8"
            />
            <polygon
              points="49,10 48,4 52,8"
              fill="var(--theme-primary)"
              opacity="0.9"
            />

            {/* Right Ear (Slightly turned) */}
            <polygon
              points="57,10 62,2 56,7"
              fill="#09040b"
              stroke="rgba(255, 45, 117, 0.5)"
              strokeWidth="0.8"
            />
            <polygon
              points="57,9 60,4 56,7"
              fill="var(--theme-primary)"
              opacity="0.9"
            />

            {/* Head Contour */}
            <circle
              cx="54"
              cy="16"
              r="7.5"
              fill="#0e0712"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="0.8"
            />

            {/* Glowing Amber Almond Eye */}
            <g className="animate-cat-blink origin-[56px_15px]">
              <ellipse cx="56.5" cy="15" rx="2.5" ry="3.2" fill="#FACC15" />
              <ellipse cx="57" cy="15" rx="0.9" ry="2.8" fill="#070308" />
              <circle cx="56" cy="14" r="0.7" fill="#ffffff" />
            </g>

            {/* Delicate Pink Nose */}
            <polygon points="60.5,17 59.5,16.2 60.5,15.6" fill="#FF85B3" />

            {/* Whiskers (Fine luminous lines) */}
            <line x1="59" y1="17" x2="68" y2="16" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6" strokeLinecap="round" />
            <line x1="59" y1="18.5" x2="67" y2="20" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6" strokeLinecap="round" />
          </g>

          {/* 8. Sleek Collar with glowing charm */}
          <path d="M 49 20 C 51 22, 53 22, 55 21" stroke="var(--theme-primary)" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="53" cy="22.2" r="1.3" fill="var(--theme-primary)" className="animate-pulse" />
        </g>
      </svg>
    </div>
  );
};
