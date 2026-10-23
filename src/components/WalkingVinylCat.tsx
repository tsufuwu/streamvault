import React from 'react';

interface WalkingVinylCatProps {
  isWalking?: boolean;
  discSize?: number;
  className?: string;
}

export const WalkingVinylCat: React.FC<WalkingVinylCatProps> = ({
  isWalking = false,
  discSize = 140,
  className = '',
}) => {
  // Scale the cat proportionally to disc diameter
  const catWidth = Math.max(30, Math.round(discSize * 0.28));
  const catHeight = Math.round(catWidth * 0.75);

  return (
    <div
      className={`absolute z-20 pointer-events-none select-none transition-transform duration-300 ${className}`}
      style={{
        // Positioned along the exposed upper-right vinyl groove arc
        top: '12%',
        right: '18%',
        width: catWidth,
        height: catHeight,
        transform: 'rotate(15deg)',
      }}
      title="Chú mèo đen trên đĩa than"
    >
      <svg
        viewBox="0 0 64 48"
        className="w-full h-full overflow-visible drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cat Body Bob Group when walking */}
        <g className={isWalking ? 'animate-cat-bob' : ''}>
          {/* Swishing Tail */}
          <g className="animate-cat-tail origin-[14px_22px]">
            <path
              d="M 14 22 C 8 20, 2 12, 6 4 C 8 0, 12 2, 11 6 C 10 9, 11 15, 16 19"
              fill="#08040a"
              stroke="rgba(255, 45, 117, 0.4)"
              strokeWidth="0.8"
            />
          </g>

          {/* Back Left Leg (Inside) */}
          <g className={isWalking ? 'animate-cat-paw-bwd origin-[18px_25px]' : ''}>
            <path
              d="M 18 24 L 14 36 L 12 40 L 16 40 L 20 28 Z"
              fill="#060207"
            />
          </g>

          {/* Front Left Leg (Inside) */}
          <g className={isWalking ? 'animate-cat-paw-bwd origin-[42px_24px]' : ''}>
            <path
              d="M 42 24 L 40 35 L 38 40 L 42 40 L 45 28 Z"
              fill="#060207"
            />
          </g>

          {/* Main Cat Torso */}
          <path
            d="M 14 20 C 14 14, 24 13, 34 14 C 42 15, 48 18, 48 24 C 48 29, 40 30, 28 29 C 18 28, 14 26, 14 20 Z"
            fill="#0b060d"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="0.9"
          />

          {/* Back Right Leg (Outside - Forefront) */}
          <g className={isWalking ? 'animate-cat-paw-fwd origin-[22px_25px]' : ''}>
            <path
              d="M 22 25 L 18 36 L 16 41 L 21 41 L 25 29 Z"
              fill="#0e0811"
              stroke="rgba(255, 45, 117, 0.3)"
              strokeWidth="0.7"
            />
          </g>

          {/* Front Right Leg (Outside - Forefront) */}
          <g className={isWalking ? 'animate-cat-paw-fwd origin-[46px_25px]' : ''}>
            <path
              d="M 46 25 L 45 36 L 43 41 L 48 41 L 49 29 Z"
              fill="#0e0811"
              stroke="rgba(255, 45, 117, 0.3)"
              strokeWidth="0.7"
            />
          </g>

          {/* Cat Head */}
          <g className="origin-[48px_16px]">
            {/* Left Ear */}
            <polygon
              points="44,12 41,2 49,8"
              fill="#09040b"
              stroke="rgba(255, 45, 117, 0.4)"
              strokeWidth="0.8"
            />
            <polygon
              points="44,10 42,4 47,8"
              fill="var(--theme-primary)"
              opacity="0.8"
            />

            {/* Right Ear */}
            <polygon
              points="53,10 57,1 50,7"
              fill="#09040b"
              stroke="rgba(255, 45, 117, 0.4)"
              strokeWidth="0.8"
            />
            <polygon
              points="52,9 55,3 50,7"
              fill="var(--theme-primary)"
              opacity="0.8"
            />

            {/* Head Silhouette */}
            <circle
              cx="48"
              cy="16"
              r="8"
              fill="#0d0710"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="0.8"
            />

            {/* Glowing Golden Eye */}
            <g className="animate-cat-blink origin-[51px_15px]">
              <ellipse cx="51" cy="15" rx="2.4" ry="3" fill="#FACC15" />
              <ellipse cx="51.5" cy="15" rx="0.8" ry="2.5" fill="#060207" />
              <circle cx="50.5" cy="14" r="0.7" fill="#ffffff" />
            </g>

            {/* Cute Pink Nose */}
            <polygon points="55,18 53.8,17 55.5,16.5" fill="#FF85B3" />

            {/* Whiskers */}
            <line x1="53" y1="18" x2="62" y2="17" stroke="rgba(255,255,255,0.6)" strokeWidth="0.6" />
            <line x1="53" y1="19.5" x2="61" y2="21" stroke="rgba(255,255,255,0.6)" strokeWidth="0.6" />
          </g>

          {/* Tiny Collar with Neon Gem Charm */}
          <path d="M 43 21 C 45 23, 47 23, 49 22" stroke="var(--theme-primary)" strokeWidth="1.2" />
          <circle cx="47" cy="23" r="1.3" fill="var(--theme-primary)" className="animate-pulse" />
        </g>
      </svg>
    </div>
  );
};
