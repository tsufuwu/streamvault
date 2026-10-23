import React from 'react';

interface PeekingCatProps {
  position?: 'top-right' | 'top-left' | 'top-center' | 'side-right';
  className?: string;
  size?: number; // width in px
}

export const PeekingCat: React.FC<PeekingCatProps> = ({
  position = 'top-right',
  className = '',
  size = 40,
}) => {
  const positionClasses = {
    'top-right': 'top-0 right-5 translate-y-2 group-hover:-translate-y-5',
    'top-left': 'top-0 left-5 translate-y-2 group-hover:-translate-y-5',
    'top-center': 'top-0 left-1/2 -translate-x-1/2 translate-y-2 group-hover:-translate-y-5',
    'side-right': 'top-1/2 -right-1 -translate-y-1/2 translate-x-0 group-hover:translate-x-4',
  }[position];

  return (
    <div
      className={`absolute z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out select-none ${positionClasses} ${className}`}
      style={{ width: size, height: size * 0.85 }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 54 44"
        className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cat Ears */}
        {/* Left Ear */}
        <g className="animate-cat-ear-twitch origin-[17px_16px]">
          <polygon
            points="12,18 9,2 22,12"
            fill="#09040b"
            stroke="rgba(255, 45, 117, 0.45)"
            strokeWidth="1"
          />
          <polygon
            points="12,16 11,5 19,12"
            fill="var(--theme-primary)"
            opacity="0.85"
          />
        </g>

        {/* Right Ear */}
        <g className="animate-cat-ear-twitch origin-[37px_16px]" style={{ animationDelay: '0.35s' }}>
          <polygon
            points="42,18 45,2 32,12"
            fill="#09040b"
            stroke="rgba(255, 45, 117, 0.45)"
            strokeWidth="1"
          />
          <polygon
            points="42,16 43,5 35,12"
            fill="var(--theme-primary)"
            opacity="0.85"
          />
        </g>

        {/* Head Contour */}
        <ellipse
          cx="27"
          cy="22"
          rx="15"
          ry="12"
          fill="#0c060f"
          stroke="rgba(255, 255, 255, 0.16)"
          strokeWidth="0.9"
        />

        {/* Refined Glowing Amber Almond Eyes */}
        <g className="animate-cat-blink origin-[27px_21px]">
          {/* Left Eye */}
          <ellipse cx="21" cy="20" rx="3.4" ry="4.2" fill="#FACC15" />
          <ellipse cx="21" cy="20" rx="1.2" ry="3.6" fill="#070308" />
          <circle cx="20" cy="18.5" r="1.1" fill="#ffffff" />

          {/* Right Eye */}
          <ellipse cx="33" cy="20" rx="3.4" ry="4.2" fill="#FACC15" />
          <ellipse cx="33" cy="20" rx="1.2" ry="3.6" fill="#070308" />
          <circle cx="32" cy="18.5" r="1.1" fill="#ffffff" />
        </g>

        {/* Delicate Pink Nose */}
        <polygon points="27,25 25.5,23.5 28.5,23.5" fill="#FF85B3" />

        {/* Sweet Cat Muzzle Curve */}
        <path
          d="M 24.5 26.5 Q 27 28 29.5 26.5"
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="0.8"
          strokeLinecap="round"
        />

        {/* Delicate Whiskers */}
        <g stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.65" strokeLinecap="round">
          <line x1="8" y1="23" x2="19" y2="24" />
          <line x1="8" y1="26.5" x2="18" y2="26" />
          <line x1="35" y1="24" x2="46" y2="23" />
          <line x1="36" y1="26" x2="46" y2="26.5" />
        </g>

        {/* Two Delicate Front Paws gripping the card border */}
        {/* Left Paw */}
        <ellipse
          cx="18"
          cy="34"
          rx="4.2"
          ry="3.2"
          fill="#0c060f"
          stroke="rgba(255, 45, 117, 0.45)"
          strokeWidth="0.9"
        />
        <line x1="16.8" y1="32.5" x2="16.8" y2="35.5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
        <line x1="19.2" y1="32.5" x2="19.2" y2="35.5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />

        {/* Right Paw */}
        <ellipse
          cx="36"
          cy="34"
          rx="4.2"
          ry="3.2"
          fill="#0c060f"
          stroke="rgba(255, 45, 117, 0.45)"
          strokeWidth="0.9"
        />
        <line x1="34.8" y1="32.5" x2="34.8" y2="35.5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
        <line x1="37.2" y1="32.5" x2="37.2" y2="35.5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
      </svg>
    </div>
  );
};
