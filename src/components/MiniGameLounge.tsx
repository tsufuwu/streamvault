import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/soundEffects';
import { Disc3, Citrus, Sparkles, Trophy } from 'lucide-react';

interface MiniGameLoungeProps {
  currentTheme: string;
}

export const MiniGameLounge: React.FC<MiniGameLoungeProps> = ({ currentTheme }) => {
  const [activeTab, setActiveTab] = useState<'dj' | 'orange'>('dj');
  const [djScore, setDjScore] = useState<number>(0);
  const [orangeScore, setOrangeScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [lastActionText, setLastActionText] = useState<string>('');
  const [isScratching, setIsScratching] = useState<boolean>(false);
  const [fallingItems, setFallingItems] = useState<{ id: number; char: string; left: number; top: number }[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Scratch action on DJ turntable
  const handleDjScratch = (e: React.MouseEvent) => {
    sounds.playVinylScratch();
    sounds.playBeatDrop(80 + Math.random() * 40);
    setIsScratching(true);
    setDjScore((prev) => prev + 5 * combo);
    setCombo((c) => Math.min(c + 1, 8));
    setLastActionText(`Scratch Drop! +${5 * combo}pts (x${combo})`);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spawnFloatingParticle(x, y, ['♪', '♫', '♬', '💿'][Math.floor(Math.random() * 4)]);

    setTimeout(() => setIsScratching(false), 200);
  };

  // Shake orange tree
  const handleShakeTree = (e: React.MouseEvent) => {
    sounds.playOrangePop();
    setOrangeScore((prev) => prev + 1);
    setCombo((c) => Math.min(c + 1, 6));
    setLastActionText(`Harvested! +1 Citrus 🍊 (x${combo})`);

    if ((orangeScore + 1) % 10 === 0) {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#FF7A00', '#FFAE34', '#10B981'],
      });
      sounds.playBeatDrop(120);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spawnFloatingParticle(x, y, '🍊');
  };

  const spawnFloatingParticle = (x: number, y: number, char: string) => {
    const newItem = {
      id: Date.now() + Math.random(),
      char,
      left: x,
      top: y,
    };
    setFallingItems((prev) => [...prev, newItem]);
    setTimeout(() => {
      setFallingItems((prev) => prev.filter((item) => item.id !== newItem.id));
    }, 900);
  };

  useEffect(() => {
    if (combo > 1) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCombo(1);
        setLastActionText('');
      }, 3500);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [combo, djScore, orangeScore]);

  return (
    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-surface)]/90 backdrop-blur-xl p-4 shadow-xl overflow-hidden relative group">
      {/* Header and Switcher Tabs with Interleaved Fonts */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--theme-border)]/50">
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => {
              setActiveTab('dj');
              sounds.playClick();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${
              activeTab === 'dj'
                ? 'bg-[var(--theme-primary)] text-white shadow-md shadow-[var(--theme-primary)]/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Disc3 className={`w-3.5 h-3.5 ${activeTab === 'dj' ? 'animate-spin' : ''}`} />
            <span className="font-alegreya text-sm font-bold">DJ Turntable</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('orange');
              sounds.playClick();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${
              activeTab === 'orange'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Citrus className="w-3.5 h-3.5" />
            <span className="font-alegreya text-sm font-bold">Citrus Grove 🍊</span>
          </button>
        </div>

        {/* Score Display (Courier New) */}
        <div className="flex items-center gap-2 font-courier">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 border border-[var(--theme-border)]/60 text-xs font-bold text-[var(--theme-primary-light)]">
            <Trophy className="w-3 h-3 text-yellow-400" />
            <span>{activeTab === 'dj' ? `${djScore} BEATS` : `${orangeScore} CITRUS`}</span>
          </div>
          {combo > 1 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gradient-to-r from-pink-500 to-amber-500 text-white animate-pulse">
              x{combo}
            </span>
          )}
        </div>
      </div>

      {/* Floating particles from action */}
      {fallingItems.map((item) => (
        <span
          key={item.id}
          className="absolute pointer-events-none text-xl font-bold select-none transition-all duration-700 ease-out z-20"
          style={{
            left: item.left,
            top: item.top - 30,
            opacity: 0,
            transform: 'translateY(-40px) scale(1.3)',
          }}
        >
          {item.char}
        </span>
      ))}

      {/* Mode 1: DJ Turntable Scratchpad */}
      {activeTab === 'dj' && (
        <div className="flex flex-col items-center justify-center py-2 relative select-none">
          <p className="font-courier text-[11px] text-neutral-400 mb-2 font-normal flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[var(--theme-primary)]" />
            Scratch the vinyl deck to mix rhythm beats &amp; sparks
          </p>

          <div
            onClick={handleDjScratch}
            className={`relative w-44 h-40 cursor-grab active:cursor-grabbing p-2 transition-transform duration-100 flex items-center justify-center ${
              isScratching ? 'scale-95' : 'hover:scale-105'
            }`}
          >
            {/* Turntable Plinth */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#1c0d1b] to-[#0a0309] border border-[var(--theme-border)] shadow-2xl" />

            {/* Tonearm */}
            <div className="absolute top-2 right-2.5 z-10 w-11 h-24 pointer-events-none">
              <svg viewBox="0 0 50 100" className="w-full h-full drop-shadow-md">
                <path d="M 38 12 L 32 46 L 16 56" fill="none" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="38" cy="12" r="5" fill="var(--theme-primary)" stroke="#FFF" strokeWidth="1" />
                <rect x="12" y="53" width="8" height="6" rx="1.5" fill="var(--theme-primary)" />
              </svg>
            </div>

            {/* Spinning Vinyl Scratch Platter */}
            <div
              className={`relative w-32 h-32 rounded-full flex items-center justify-center -translate-x-2 ${
                isScratching ? 'rotate-45' : 'animate-vinyl-spin'
              }`}
              style={{
                background: 'radial-gradient(circle, #200d1d 0%, #0c040b 70%, #030103 100%)',
                boxShadow: '0 0 25px var(--theme-primary-glow)',
              }}
            >
              <div className="absolute inset-1 rounded-full border border-white/10" />
              <div className="absolute inset-3 rounded-full border border-white/5" />
              <div className="absolute inset-5 rounded-full border border-white/10" />
              <div className="absolute inset-8 rounded-full border border-white/5" />

              <div className="w-11 h-11 rounded-full bg-[var(--theme-primary)] border-2 border-white/80 flex flex-col items-center justify-center shadow-lg font-courier">
                <span className="text-[6.5px] font-bold tracking-widest text-white">DJ BEAT</span>
                <div className="w-2 h-2 rounded-full bg-black/90 border border-white/40 mt-0.5" />
              </div>
            </div>
          </div>

          {lastActionText && (
            <div className="font-courier mt-2 text-xs font-bold text-[var(--theme-primary)] animate-bounce">
              {lastActionText}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Orange Tree Harvest */}
      {activeTab === 'orange' && (
        <div className="flex flex-col items-center justify-center py-2 relative select-none">
          <p className="font-courier text-[11px] text-neutral-400 mb-2 font-normal flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Click the citrus canopy to harvest ripe oranges into basket!
          </p>

          <div
            onClick={handleShakeTree}
            className="cursor-pointer group/tree relative w-44 h-36 flex items-center justify-center hover:scale-105 transition-transform duration-200"
            title="Click to shake the citrus tree!"
          >
            <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-xl">
              <defs>
                <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#854d0e" />
                  <stop offset="100%" stopColor="#451a03" />
                </linearGradient>
                <linearGradient id="canopyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#064e3b" />
                </linearGradient>
                <radialGradient id="orangeBallGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#fed7aa" />
                  <stop offset="40%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#c2410c" />
                </radialGradient>
              </defs>

              <path
                d="M74 115 C73 95 68 80 62 65 C68 68 74 74 78 80 C82 72 86 64 92 65 C88 78 85 95 84 115 Z"
                fill="url(#trunkGrad)"
              />

              <g className="transition-transform duration-150 group-active/tree:translate-y-0.5">
                <circle cx="50" cy="52" r="22" fill="url(#canopyGrad)" />
                <circle cx="110" cy="52" r="22" fill="url(#canopyGrad)" />
                <circle cx="80" cy="35" r="26" fill="url(#canopyGrad)" />
                <circle cx="65" cy="45" r="20" fill="url(#canopyGrad)" />
                <circle cx="95" cy="45" r="20" fill="url(#canopyGrad)" />
              </g>

              <circle cx="48" cy="50" r="5.5" fill="url(#orangeBallGrad)" />
              <circle cx="112" cy="50" r="5.5" fill="url(#orangeBallGrad)" />
              <circle cx="80" cy="34" r="6" fill="url(#orangeBallGrad)" />
              <circle cx="68" cy="58" r="5" fill="url(#orangeBallGrad)" />
              <circle cx="94" cy="58" r="5" fill="url(#orangeBallGrad)" />

              <rect x="70" y="104" width="20" height="12" rx="3" fill="#a16207" stroke="#ca8a04" strokeWidth="1" />
              <text x="80" y="113" fontSize="8" textAnchor="middle" fill="#fef08a">🧺</text>
            </svg>
          </div>

          {lastActionText && (
            <div className="font-courier mt-2 text-xs font-bold text-amber-400 animate-bounce">
              {lastActionText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
