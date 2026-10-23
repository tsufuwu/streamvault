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
        {/* Minimalist Clean Brand Logo */}
        <div
          onClick={() => {
            sounds.playClick();
            onSearchChange('');
          }}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          title="VinylStream"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 border border-white/10 group-hover:border-[var(--theme-primary)]/50 flex items-center justify-center transition-all group-hover:scale-105 shadow-sm">
            <Disc3 className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--theme-primary)] group-hover:rotate-45 transition-transform duration-300" />
          </div>

          <div className="flex items-baseline">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
              Vinyl<span className="text-[var(--theme-primary)] font-black">Stream</span>
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
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Selector Swatches */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10" title="Select Visual Theme">
            <button
              onClick={() => {
                sounds.playClick();
                onThemeChange('vinyl-pink');
              }}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
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
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
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
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
                currentTheme === 'amethyst-violet'
                  ? 'ring-2 ring-white scale-110 shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: '#A855F7' }}
              title="Theme: Amethyst Violet Cyber"
            />
          </div>

          {/* Sound FX Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-white/5 border-white/15 text-[var(--theme-primary-light)]'
                : 'bg-white/5 border-white/5 text-neutral-500'
            }`}
            title={soundEnabled ? 'Analog Sound FX: ON' : 'Analog Sound FX: MUTED'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Favorites Filter Toggle - Hidden on mobile because it's in the bottom bar */}
          <button
            onClick={() => {
              sounds.playClick();
              onToggleFavoritesFilter();
            }}
            className={`p-2 rounded-xl border hidden sm:flex items-center gap-1.5 transition-all ${
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
            className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white text-xs font-bold shadow-md shadow-[var(--theme-primary-glow)] transition-all transform active:scale-95"
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
      <div className="mt-2.5 md:hidden">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search vinyl tracks, movies, reels..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="font-courier w-full pl-8 pr-8 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[var(--theme-primary)]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 text-neutral-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
