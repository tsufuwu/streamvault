import React from 'react';

interface PeekingCatProps {
  position?: 'top-right' | 'top-left' | 'top-center' | 'side-right';
  className?: string;
  size?: number; // width in px, default 48
}

export const PeekingCat: React.FC<PeekingCatProps> = ({
  position = 'top-right',
  className = '',
  size = 46,
}) => {
  const positionClasses = {
    'top-right': 'top-0 right-4 -translate-y-0 group-hover:-translate-y-7',
    'top-left': 'top-0 left-4 -translate-y-0 group-hover:-translate-y-7',
    'top-center': 'top-0 left-1/2 -translate-x-1/2 -translate-y-0 group-hover:-translate-y-7',
    'side-right': 'top-1/2 -right-1 -translate-y-1/2 translate-x-0 group-hover:translate-x-6',
  }[position];

  return (
    <div
      className={`absolute z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out select-none ${positionClasses} ${className}`}
      style={{ width: size, height: size * 0.9 }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 60 54"
        className="w-full h-full drop-shadow-md overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cat Ears */}
        {/* Left Ear */}
        <g className="animate-cat-ear-twitch origin-[20px_18px]">
          <polygon
            points="14,24 10,2 26,16"
            fill="#09050b"
            stroke="rgba(255, 45, 117, 0.35)"
            strokeWidth="1.2"
          />
          <polygon
            points="14,21 12,6 23,16"
            fill="var(--theme-primary)"
            opacity="0.85"
          />
        </g>

        {/* Right Ear */}
        <g className="animate-cat-ear-twitch origin-[40px_18px]" style={{ animationDelay: '0.4s' }}>
          <polygon
            points="46,24 50,2 34,16"
            fill="#09050b"
            stroke="rgba(255, 45, 117, 0.35)"
            strokeWidth="1.2"
          />
          <polygon
            points="46,21 48,6 37,16"
            fill="var(--theme-primary)"
            opacity="0.85"
          />
        </g>

        {/* Head */}
        <ellipse
          cx="30"
          cy="28"
          rx="18"
          ry="15"
          fill="#0c070e"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="1.2"
        />

        {/* Big Curious Luminous Yellow Eyes */}
        <g className="animate-cat-blink origin-[30px_27px]">
          {/* Left Eye */}
          <ellipse cx="23" cy="26" rx="4.5" ry="5.5" fill="#FACC15" />
          <ellipse cx="23" cy="26" rx="1.6" ry="4.5" fill="#0c070e" />
          <circle cx="21.5" cy="24" r="1.4" fill="#ffffff" />

          {/* Right Eye */}
          <ellipse cx="37" cy="26" rx="4.5" ry="5.5" fill="#FACC15" />
          <ellipse cx="37" cy="26" rx="1.6" ry="4.5" fill="#0c070e" />
          <circle cx="35.5" cy="24" r="1.4" fill="#ffffff" />
        </g>

        {/* Cute Pink Button Nose */}
        <polygon points="30,32 28,30 32,30" fill="#FF85B3" />

        {/* Little Cat Smile */}
        <path
          d="M 27 34 Q 30 36 33 34"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="0.9"
          strokeLinecap="round"
        />

        {/* Whiskers */}
        <g stroke="rgba(255, 255, 255, 0.5)" strokeWidth="0.8" strokeLinecap="round">
          <line x1="8" y1="28" x2="20" y2="30" />
          <line x1="7" y1="33" x2="19" y2="33" />
          <line x1="40" y1="30" x2="52" y2="28" />
          <line x1="41" y1="33" x2="53" y2="33" />
        </g>

        {/* Paws resting on top of card edge */}
        {/* Left Paw */}
        <ellipse
          cx="20"
          cy="42"
          rx="5.5"
          ry="4.5"
          fill="#0c070e"
          stroke="rgba(255, 45, 117, 0.4)"
          strokeWidth="1"
        />
        <line x1="18.5" y1="40" x2="18.5" y2="44" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
        <line x1="21.5" y1="40" x2="21.5" y2="44" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />

        {/* Right Paw */}
        <ellipse
          cx="40"
          cy="42"
          rx="5.5"
          ry="4.5"
          fill="#0c070e"
          stroke="rgba(255, 45, 117, 0.4)"
          strokeWidth="1"
        />
        <line x1="38.5" y1="40" x2="38.5" y2="44" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
        <line x1="41.5" y1="40" x2="41.5" y2="44" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      </svg>
    </div>
  );
};
