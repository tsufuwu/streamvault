import React from 'react';

export const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Radiant Glowing Aura Orbs */}
      <div
        className="absolute -top-[10%] left-[15%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] rounded-full blur-[140px] opacity-25 animate-pulse-glow"
        style={{ background: 'radial-gradient(circle, var(--theme-primary) 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] max-w-[550px] max-h-[550px] rounded-full blur-[150px] opacity-20"
        style={{ background: 'radial-gradient(circle, var(--theme-primary-hover) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-[10%] left-[30%] w-[50vw] h-[35vw] max-w-[650px] max-h-[450px] rounded-full blur-[160px] opacity-15"
        style={{ background: 'radial-gradient(circle, var(--theme-primary) 0%, transparent 70%)' }}
      />

      {/* Subtle Floating Musical Notes & Disc Sparkles */}
      <div className="absolute top-[12%] left-[8%] text-2xl text-[var(--theme-primary)]/20 animate-float-note-1 select-none font-serif">
        ♪
      </div>
      <div className="absolute top-[28%] right-[12%] text-3xl text-[var(--theme-primary-light)]/25 animate-float-note-2 select-none font-serif">
        ♫
      </div>
      <div className="absolute top-[55%] left-[5%] text-xl text-[var(--theme-primary)]/20 animate-float-note-3 select-none font-serif">
        ♬
      </div>
      <div className="absolute top-[72%] right-[8%] text-2xl text-[var(--theme-primary-light)]/20 animate-float-note-1 select-none font-serif">
        ♩
      </div>
      <div className="absolute top-[85%] left-[22%] text-lg text-[var(--theme-primary)]/15 animate-float-note-2 select-none font-serif">
        𝄞
      </div>
      <div className="absolute top-[20%] left-[78%] text-sm text-[var(--theme-primary)]/25 animate-float-note-3 select-none">
        ✨
      </div>
      <div className="absolute top-[65%] left-[85%] text-xs text-[var(--theme-primary)]/25 animate-float-note-1 select-none">
        💖
      </div>

      {/* Subtle Vinyl Noise/Grid Grain Overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
};
