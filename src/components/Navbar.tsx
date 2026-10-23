import React, { useRef, useEffect } from 'react';
import { Search, Heart, Plus, Volume2, VolumeX, Keyboard, Palette, Disc3 } from 'lucide-react';
import { AppTheme } from '../types';
import { sounds } from '../utils/soundEffects';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  favoritesCount: number;
  showFavoritesOnly: boolean;
  onToggleFavoritesFilter: () => void;
  onOpenCustomModal: () => void;
  onOpenShortcuts: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  currentTheme,
  onThemeChange,
  favoritesCount,
  showFavoritesOnly,
  onToggleFavoritesFilter,
  onOpenCustomModal,
  onOpenShortcuts,
  soundEnabled,
  onToggleSound,
}) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Shortcut ⌘K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[var(--theme-bg-base)]/85 border-b border-[var(--theme-border)]/60 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo with Interleaved Alegreya & Courier */}
        <div
          onClick={() => {
            sounds.playVinylScratch();
            onSearchChange('');
          }}
          className="flex items-center gap-3 cursor-pointer select-none group"
          title="VinylStream Noir — Hi-Fi Vinyl CD & Cinema Lounge"
        >
          {/* Animated Mascot Vinyl Record */}
          <div className="relative w-10 h-10 rounded-full flex items-center justify-center p-1 bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-primary-light)] shadow-lg shadow-[var(--theme-primary-glow)] transform group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full bg-[#0a0409] flex items-center justify-center animate-vinyl-spin">
              <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--theme-primary)]" />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="font-alegreya text-2xl font-bold tracking-tight text-white flex items-center">
              Vinyl<span className="text-[var(--theme-primary)] font-black italic ml-0.5">Stream</span>
            </span>
            <span className="font-courier text-[9px] tracking-widest text-[var(--theme-primary-light)] uppercase opacity-90 -mt-1 font-bold">
              [CD VINYL &bull; CINEMA NOIR]
            </span>
          </div>
        </div>

        {/* Global Omnibar Search (Typewriter Courier font input) */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search vinyl tracks, movies, studio reels..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="font-courier w-full pl-9 pr-14 py-2 rounded-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--theme-primary)] text-xs text-white placeholder:text-neutral-500 focus:outline-none transition-all shadow-inner"
            />
            <div className="absolute right-3 flex items-center gap-1 pointer-events-none">
              <kbd className="font-courier px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-neutral-400 border border-white/10 font-bold">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Selector Swatches */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10" title="Select Visual Theme">
            <button
              onClick={() => {
                sounds.playClick();
                onThemeChange('vinyl-pink');
              }}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                currentTheme === 'vinyl-pink'
                  ? 'ring-2 ring-white scale-110 shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: '#FF2D75' }}
              title="Theme: Neon Vinyl Pink & Noir"
            />
            <button
              onClick={() => {
                sounds.playClick();
                onThemeChange('citrus-orange');
              }}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                currentTheme === 'citrus-orange'
                  ? 'ring-2 ring-white scale-110 shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: '#FF7A00' }}
              title="Theme: Warm Citrus Sunset"
            />
            <button
              onClick={() => {
                sounds.playClick();
                onThemeChange('amethyst-violet');
              }}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                currentTheme === 'amethyst-violet'
                  ? 'ring-2 ring-white scale-110 shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: '#A855F7' }}
              title="Theme: Amethyst Violet Cyber"
            />
          </div>

          {/* Sound FX Toggle with Monospace Label */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-white/5 border-white/15 text-[var(--theme-primary-light)]'
                : 'bg-white/5 border-white/5 text-neutral-500'
            }`}
            title={soundEnabled ? 'Analog Sound FX: ON' : 'Analog Sound FX: MUTED'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Favorites Filter Toggle */}
          <button
            onClick={() => {
              sounds.playClick();
              onToggleFavoritesFilter();
            }}
            className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all ${
              showFavoritesOnly
                ? 'bg-pink-500/20 border-pink-500 text-pink-400 font-bold'
                : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
            title="Filter Favorites"
          >
            <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current text-pink-500' : ''}`} />
            {favoritesCount > 0 && (
              <span className="font-courier text-xs font-bold">{favoritesCount}</span>
            )}
          </button>

          {/* Add Custom Google Drive Media Modal */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenCustomModal();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white text-xs font-bold shadow-md shadow-[var(--theme-primary-glow)] transition-all transform hover:scale-[1.02]"
            title="Add your own Google Drive file or stream"
          >
            <Plus className="w-4 h-4" />
            <span className="font-courier hidden sm:inline tracking-wider uppercase text-[11px]">+ Add Drive</span>
          </button>

          {/* Shortcuts Modal Guide */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenShortcuts();
            }}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-colors hidden sm:block"
            title="Keyboard Shortcuts Cheatsheet"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="mt-3 md:hidden">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tracks, movies, reels..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="font-courier w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none"
          />
        </div>
      </div>
    </header>
  );
};
