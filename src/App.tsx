import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MediaItem, FolderItem, MediaType, AppTheme } from './types';
import { fetchMediaList, saveCustomMedia, deleteCustomMedia, getFavorites, toggleFavorite, getRecents, recordRecent } from './services/mediaService';
import { AmbientBackground } from './components/AmbientBackground';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CategoryFolderBar } from './components/CategoryFolderBar';
import { MediaCard } from './components/MediaCard';
import { PlayerModal } from './components/PlayerModal';
import { MobileMiniPlayer } from './components/MobileMiniPlayer';
import { MiniGameLounge } from './components/MiniGameLounge';
import { CustomMediaModal } from './components/CustomMediaModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { sounds } from './utils/soundEffects';
import { Disc3, History, Sparkles, Film, Music, Heart, Plus } from 'lucide-react';

export default function App() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | MediaType | 'favorites'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>('vinyl-pink');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isCompactView, setIsCompactView] = useState<boolean>(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // Synchronized playback state for MobileMiniPlayer
  const [miniPlayback, setMiniPlayback] = useState<{ isPlaying: boolean; currentTime: number; duration: number }>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });
  const playbackControlRef = useRef<{ togglePlay: () => void; next: () => void } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('vinylstream_theme') as AppTheme;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'vinyl-pink');
    }

    const savedSound = localStorage.getItem('vinylstream_sound');
    if (savedSound !== null) {
      const enabled = savedSound === 'true';
      setSoundEnabled(enabled);
      sounds.soundEnabled = enabled;
    }

    setFavorites(getFavorites());
    setRecents(getRecents());

    loadMedia();
  }, []);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const data = await fetchMediaList();
      setMediaList(data.media);
      setFolders(data.folders);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (theme: AppTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem('vinylstream_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.soundEnabled = next;
    localStorage.setItem('vinylstream_sound', String(next));
    if (next) sounds.playClick();
  };

  const handleToggleFavorite = (id: string) => {
    const updated = toggleFavorite(id);
    setFavorites(updated);
  };

  const handlePlayMedia = (item: MediaItem) => {
    setActiveMedia(item);
    setIsPlayerOpen(true);
    const updatedRecents = recordRecent(item.id);
    setRecents(updatedRecents);
  };

  const handleAddCustomMedia = (newItem: MediaItem) => {
    saveCustomMedia(newItem);
    setMediaList((prev) => [newItem, ...prev]);
    if (newItem.folderName && !folders.some((f) => f.name === newItem.folderName)) {
      setFolders((prev) => [
        ...prev,
        { id: `folder_${Date.now()}`, name: newItem.folderName!, path: [newItem.folderName!] },
      ]);
    }
  };

  const handleDeleteCustom = (id: string) => {
    deleteCustomMedia(id);
    setMediaList((prev) => prev.filter((m) => m.id !== id));
  };

  const folderNames = useMemo(() => {
    const set = new Set<string>();
    mediaList.forEach((m) => {
      if (m.folderPath && m.folderPath.length > 0) {
        set.add(m.folderPath[0]);
      } else if (m.folderName) {
        set.add(m.folderName);
      }
    });
    return Array.from(set);
  }, [mediaList]);

  const subfolders = useMemo(() => {
    if (currentPath.length === 0) return [];
    const set = new Set<string>();
    mediaList.forEach((m) => {
      if (m.folderPath && m.folderPath.length > currentPath.length) {
        const isSub = currentPath.every((seg, idx) => m.folderPath![idx] === seg);
        if (isSub && m.folderPath[currentPath.length]) {
          set.add(m.folderPath[currentPath.length]);
        }
      }
    });
    folders.forEach((f) => {
      if (f.path && f.path.length === currentPath.length + 1) {
        const isSub = currentPath.every((seg, idx) => f.path[idx] === seg);
        if (isSub) {
          set.add(f.name);
        }
      }
    });
    return Array.from(set);
  }, [mediaList, folders, currentPath]);

  const filteredMedia = useMemo(() => {
    return mediaList.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesGenre = item.genre?.toLowerCase().includes(q);
        const matchesFolder = item.folderName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesGenre && !matchesFolder) return false;
      }

      if (mediaTypeFilter === 'video' && item.type !== 'video') return false;
      if (mediaTypeFilter === 'audio' && item.type !== 'audio') return false;
      if (mediaTypeFilter === 'favorites' && !favorites.includes(item.id)) return false;

      // Hierarchical folder path filter
      if (currentPath.length > 0) {
        if (item.folderPath && item.folderPath.length >= currentPath.length) {
          const matchPath = currentPath.every((seg, idx) => item.folderPath![idx] === seg);
          if (!matchPath) return false;
        } else if (item.folderName !== currentPath[currentPath.length - 1]) {
          return false;
        }
      } else if (selectedFolder && item.folderName !== selectedFolder && item.folderPath?.[0] !== selectedFolder) {
        return false;
      }

      return true;
    });
  }, [mediaList, searchQuery, mediaTypeFilter, selectedFolder, currentPath, favorites]);

  const counts = useMemo(() => {
    return {
      all: mediaList.length,
      video: mediaList.filter((m) => m.type === 'video').length,
      audio: mediaList.filter((m) => m.type === 'audio').length,
      favorites: mediaList.filter((m) => favorites.includes(m.id)).length,
    };
  }, [mediaList, favorites]);

  const recentItems = useMemo(() => {
    return recents
      .map((id) => mediaList.find((m) => m.id === id))
      .filter((m): m is MediaItem => !!m)
      .slice(0, 4);
  }, [recents, mediaList]);

  const featuredMedia = useMemo(() => {
    return mediaList[0] || null;
  }, [mediaList]);

  return (
    <div className="min-h-screen bg-[var(--theme-bg-base)] text-[#FFF0F5] relative selection:bg-[var(--theme-primary)] selection:text-white flex flex-col font-courier">
      {/* Ambient background with radiant glow and floating musical notes */}
      <AmbientBackground />

      {/* Sticky Glass Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        favoritesCount={counts.favorites}
        showFavoritesOnly={mediaTypeFilter === 'favorites'}
        onToggleFavoritesFilter={() =>
          setMediaTypeFilter(mediaTypeFilter === 'favorites' ? 'all' : 'favorites')
        }
        onOpenCustomModal={() => setIsCustomModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 pb-24 md:pb-8 z-10">
        {/* Hero Section */}
        <HeroSection
          featuredMedia={featuredMedia}
          onPlayFeatured={handlePlayMedia}
          totalTracks={mediaList.length}
        />

        {/* Content Layout Grid (Main Feed + Interactive Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Feed Column */}
          <div className="lg:col-span-8">
            <CategoryFolderBar
              mediaTypeFilter={mediaTypeFilter}
              onMediaTypeChange={(t) => {
                setMediaTypeFilter(t);
                setCurrentPath([]);
                setSelectedFolder(null);
              }}
              folders={folderNames}
              selectedFolder={selectedFolder}
              onSelectFolder={setSelectedFolder}
              currentPath={currentPath}
              onPathChange={setCurrentPath}
              subfolders={subfolders}
              counts={counts}
              isCompactView={isCompactView}
              onToggleCompactView={() => setIsCompactView(!isCompactView)}
            />

            {/* Mobile Recently Spun Records Shelf (Spotify / Stories style) */}
            {recentItems.length > 0 && (
              <div className="lg:hidden mb-4 p-3 rounded-2xl bg-[var(--theme-bg-surface)]/70 border border-[var(--theme-border)]/50 backdrop-blur-md">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 font-courier text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-[var(--theme-primary-light)]">
                    <History className="w-3.5 h-3.5" />
                    <span>VỪA PHÁT GẦN ĐÂY</span>
                  </span>
                  <span className="text-[9px] text-neutral-500 font-normal">[{recentItems.length} đĩa]</span>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-1">
                  {recentItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handlePlayMedia(item)}
                      className="flex flex-col items-center shrink-0 w-20 cursor-pointer group select-none text-center"
                    >
                      <div className="relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-primary-light)] shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                        <div className="w-full h-full rounded-full overflow-hidden bg-black relative">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Disc3 className="w-5 h-5 text-white animate-spin" />
                          </div>
                        </div>
                      </div>
                      <span className="font-alegreya text-xs font-bold text-neutral-200 group-hover:text-[var(--theme-primary-light)] truncate w-full mt-1.5">
                        {item.title}
                      </span>
                      <span className="font-courier text-[9px] text-neutral-400 uppercase truncate w-full -mt-0.5">
                        {item.folderName || 'CRATE'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-[var(--theme-primary)] border-t-transparent animate-spin" />
                <span className="font-courier text-xs tracking-wider uppercase text-neutral-400">
                  [INITIALIZING VINYL PLATTER &bull; SYNCING CRATE DATABASE...]
                </span>
              </div>
            )}

            {/* Media Items Grid - 2 columns on mobile (Spotify / Apple Music style) */}
            {!loading && (
              <>
                {filteredMedia.length > 0 ? (
                  <div
                    className={`grid gap-3 sm:gap-5 ${
                      isCompactView
                        ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3'
                        : 'grid-cols-2 sm:grid-cols-2'
                    }`}
                  >
                    {filteredMedia.map((media) => (
                      <MediaCard
                        key={media.id}
                        media={media}
                        isFavorite={favorites.includes(media.id)}
                        isPlaying={activeMedia?.id === media.id && isPlayerOpen}
                        onPlay={handlePlayMedia}
                        onToggleFavorite={handleToggleFavorite}
                        onDeleteCustom={handleDeleteCustom}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 px-6 text-center rounded-3xl bg-[var(--theme-bg-surface)]/60 border border-[var(--theme-border)]/40 backdrop-blur-md">
                    <Disc3 className="w-12 h-12 text-neutral-500 mx-auto mb-3 animate-spin" style={{ animationDuration: '8s' }} />
                    <h3 className="font-alegreya text-lg font-bold text-white mb-1">
                      No matching vinyl records or reels found
                    </h3>
                    <p className="font-courier text-xs text-neutral-400 max-w-sm mx-auto mb-4 font-normal">
                      {searchQuery
                        ? `[QUERY NOT FOUND]: "${searchQuery}"`
                        : 'This crate or genre does not contain any records yet.'}
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setMediaTypeFilter('all');
                        setSelectedFolder(null);
                      }}
                      className="font-courier px-4 py-2 rounded-xl text-xs font-bold bg-[var(--theme-primary)] text-white hover:opacity-90 transition-opacity uppercase tracking-wider"
                    >
                      [VIEW ALL CRATES]
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Interactive Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Mini Game Lounge: DJ Turntable Scratch & Citrus Harvest */}
            <MiniGameLounge currentTheme={currentTheme} />

            {/* Recently Played Tracks */}
            {recentItems.length > 0 && (
              <div className="rounded-2xl border border-[var(--theme-border)]/60 bg-[var(--theme-bg-surface)]/80 backdrop-blur-xl p-4 shadow-xl">
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/10 font-courier text-xs font-bold text-white uppercase tracking-wider">
                  <History className="w-4 h-4 text-[var(--theme-primary)]" />
                  <span>RECENTLY SPUN RECORDS</span>
                </div>

                <div className="space-y-2">
                  {recentItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handlePlayMedia(item)}
                      className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-black/60 relative">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Disc3 className="w-4 h-4 text-white animate-spin" />
                        </div>
                      </div>

                      <div className="truncate flex-1">
                        <p className="font-alegreya text-sm font-bold text-white group-hover:text-[var(--theme-primary-light)] truncate">
                          {item.title}
                        </p>
                        <span className="font-courier text-[10px] text-neutral-400 uppercase font-bold">
                          {item.folderName || 'DEFAULT CRATE'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Google Drive Direct Streaming Card */}
            <div className="rounded-2xl border border-[var(--theme-border)]/50 bg-gradient-to-br from-[var(--theme-bg-surface)]/90 to-black/90 backdrop-blur-xl p-4 text-xs space-y-2.5 font-courier">
              <div className="flex items-center gap-2 text-[var(--theme-primary-light)] font-bold">
                <Sparkles className="w-4 h-4 text-[var(--theme-primary)]" />
                <span className="font-alegreya text-base font-bold text-white">Direct Drive Streaming</span>
              </div>
              <p className="text-neutral-300 leading-relaxed text-[11px] font-normal">
                Audio and cinema streams are piped losslessly without transcoding or forced compression. You can paste any public Google Drive URL or ID to stream custom reels instantly.
              </p>
              <button
                onClick={() => setIsCustomModalOpen(true)}
                className="w-full py-2.5 rounded-xl border border-[var(--theme-border)] bg-black/40 hover:bg-[var(--theme-primary)]/20 text-white font-bold transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider text-[11px]"
              >
                <span>+ ADD YOUR DRIVE REEL</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Modal Player (Audio & Video) */}
      <PlayerModal
        media={activeMedia}
        playlist={filteredMedia}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        onSelectMedia={handlePlayMedia}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onPlaybackChange={setMiniPlayback}
        playbackControlRef={playbackControlRef}
      />

      {/* Spotify & Apple Music style Floating Mini-Player on Mobile */}
      {activeMedia && !isPlayerOpen && (
        <MobileMiniPlayer
          media={activeMedia}
          isPlaying={miniPlayback.isPlaying}
          currentTime={miniPlayback.currentTime}
          duration={miniPlayback.duration}
          onTogglePlay={() => playbackControlRef.current?.togglePlay()}
          onNext={() => playbackControlRef.current?.next()}
          onExpand={() => setIsPlayerOpen(true)}
          onClose={() => {
            setActiveMedia(null);
            setIsPlayerOpen(false);
          }}
        />
      )}

      {/* Add Custom Google Drive Media Modal */}
      <CustomMediaModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onAddMedia={handleAddCustomMedia}
        existingFolders={folderNames}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--theme-border)]/40 bg-[var(--theme-bg-surface)]/60 backdrop-blur-lg py-6 px-4 text-center font-courier text-xs text-neutral-400 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-alegreya text-base font-bold text-[var(--theme-primary)]">VinylStream Noir</span>
            <span>—</span>
            <span className="uppercase text-[11px] tracking-wider">[HIGH-FIDELITY VINYL CD &amp; CINEMA STREAMING &bull; 2026]</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold">
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="hover:text-white transition-colors uppercase tracking-wider"
            >
              [⌨️ SHORTCUTS]
            </button>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-white transition-colors uppercase tracking-wider"
            >
              [&uarr; TOP OF CRATE]
            </button>
          </div>
        </div>
      </footer>
      
      {/* Mobile Bottom Navigation Bar (iOS / Spotify / Bilibili Glassmorphism Style) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c050b]/90 backdrop-blur-2xl border-t border-[var(--theme-border)]/70 px-2 pt-2 flex items-center justify-around font-courier text-[10px] shadow-2xl"
        style={{
          paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom, 0.6rem))',
          boxShadow: '0 -10px 30px rgba(0,0,0,0.7)',
        }}
      >
        {/* Tab 1: Khám Phá */}
        <button
          onClick={() => {
            sounds.playClick();
            setSearchQuery('');
            setMediaTypeFilter('all');
            setCurrentPath([]);
            setSelectedFolder(null);
            setIsPlayerOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 transition-all flex-1 py-1 ${
            mediaTypeFilter === 'all' && currentPath.length === 0 && !searchQuery
              ? 'text-[var(--theme-primary)] font-bold scale-105'
              : 'text-neutral-400 hover:text-white active:scale-95'
          }`}
        >
          <div className="relative">
            <Disc3 className="w-4 h-4" />
            {mediaTypeFilter === 'all' && currentPath.length === 0 && !searchQuery && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--theme-primary)]" />
            )}
          </div>
          <span className="tracking-tight">Khám Phá</span>
        </button>

        {/* Tab 2: Phim */}
        <button
          onClick={() => {
            sounds.playClick();
            setMediaTypeFilter('video');
            setCurrentPath([]);
            setSelectedFolder(null);
          }}
          className={`flex flex-col items-center gap-1 transition-all flex-1 py-1 ${
            mediaTypeFilter === 'video'
              ? 'text-[var(--theme-primary)] font-bold scale-105'
              : 'text-neutral-400 hover:text-white active:scale-95'
          }`}
        >
          <div className="relative">
            <Film className="w-4 h-4" />
            {mediaTypeFilter === 'video' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--theme-primary)]" />
            )}
          </div>
          <span className="tracking-tight">Phim</span>
        </button>

        {/* Tab 3: Nhạc CD */}
        <button
          onClick={() => {
            sounds.playClick();
            setMediaTypeFilter('audio');
            setCurrentPath([]);
            setSelectedFolder(null);
          }}
          className={`flex flex-col items-center gap-1 transition-all flex-1 py-1 ${
            mediaTypeFilter === 'audio'
              ? 'text-[var(--theme-primary)] font-bold scale-105'
              : 'text-neutral-400 hover:text-white active:scale-95'
          }`}
        >
          <div className="relative">
            <Music className="w-4 h-4" />
            {mediaTypeFilter === 'audio' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--theme-primary)]" />
            )}
          </div>
          <span className="tracking-tight">Nhạc CD</span>
        </button>

        {/* Tab 4: Yêu thích */}
        <button
          onClick={() => {
            sounds.playClick();
            setMediaTypeFilter(mediaTypeFilter === 'favorites' ? 'all' : 'favorites');
          }}
          className={`flex flex-col items-center gap-1 transition-all flex-1 py-1 relative ${
            mediaTypeFilter === 'favorites'
              ? 'text-pink-500 font-bold scale-105'
              : 'text-neutral-400 hover:text-white active:scale-95'
          }`}
        >
          <div className="relative">
            <Heart className={`w-4 h-4 ${mediaTypeFilter === 'favorites' ? 'fill-current text-pink-500' : ''}`} />
            {counts.favorites > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-pink-500 text-white text-[8px] font-bold">
                {counts.favorites}
              </span>
            )}
            {mediaTypeFilter === 'favorites' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pink-500" />
            )}
          </div>
          <span className="tracking-tight">Yêu thích</span>
        </button>

        {/* Tab 5: + Thêm Drive */}
        <button
          onClick={() => {
            sounds.playClick();
            setIsCustomModalOpen(true);
          }}
          className="flex flex-col items-center gap-1 transition-all flex-1 py-1 text-neutral-400 hover:text-white active:scale-95"
          title="Thêm link Google Drive của bạn"
        >
          <div className="w-4 h-4 rounded-full bg-[var(--theme-primary)]/20 border border-[var(--theme-primary)] text-[var(--theme-primary-light)] flex items-center justify-center">
            <Plus className="w-3 h-3" />
          </div>
          <span className="tracking-tight text-[var(--theme-primary-light)]">+ Thêm</span>
        </button>
      </nav>
    </div>
  );
}
