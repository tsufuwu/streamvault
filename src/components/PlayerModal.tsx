import React, { useState, useEffect, useRef } from 'react';
import { MediaItem, PlaybackState } from '../types';
import { VinylDisc } from './VinylDisc';
import { sounds } from '../utils/soundEffects';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Sliders,
  Volume2,
  VolumeX,
  Maximize2,
  Tv,
  Repeat,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Keyboard,
  Radio,
  PictureInPicture,
} from 'lucide-react';

interface PlayerModalProps {
  media: MediaItem | null;
  playlist: MediaItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (item: MediaItem) => void;
  onOpenShortcuts: () => void;
  onPlaybackChange?: (state: { isPlaying: boolean; currentTime: number; duration: number }) => void;
  playbackControlRef?: React.MutableRefObject<{
    togglePlay: () => void;
    next: () => void;
  } | null>;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  media,
  playlist,
  isOpen,
  onClose,
  onSelectMedia,
  onOpenShortcuts,
  onPlaybackChange,
  playbackControlRef,
}) => {
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.9,
    isMuted: false,
    playbackRate: 1,
    isLooping: false,
    isTheater: false,
    useDriveIframe: false,
    audioRpm: 33,
    analogCrackle: false,
  });

  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [autoNext, setAutoNext] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [isQualityOpen, setIsQualityOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAudio = media?.type === 'audio';
  const currentIndex = playlist.findIndex((m) => m.id === media?.id);
  const prevMedia = currentIndex > 0 ? playlist[currentIndex - 1] : null;
  const nextMedia = currentIndex < playlist.length - 1 ? playlist[currentIndex + 1] : null;

  useEffect(() => {
    if (media) {
      setStreamError(false);
      setPlayback((prev) => ({
        ...prev,
        isPlaying: true,
        currentTime: 0,
        useDriveIframe: false,
      }));
      sounds.playNeedleDrop();
    }
  }, [media?.id]);

  const handleMouseMove = () => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (playback.isPlaying && !isAudio) {
        setIsControlsVisible(false);
      }
    }, 2800);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();

      // Number keys 0-9: Jump to % of duration
      if (e.key >= '0' && e.key <= '9') {
        const mediaEl = isAudio ? audioRef.current : videoRef.current;
        if (mediaEl && mediaEl.duration) {
          e.preventDefault();
          const pct = parseInt(e.key, 10) * 0.1;
          mediaEl.currentTime = mediaEl.duration * pct;
          showToast(`Nhảy tới ${parseInt(e.key, 10) * 10}% ⏱️`);
          return;
        }
      }

      switch (key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 't':
          e.preventDefault();
          toggleTheater();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'r':
          e.preventDefault();
          toggleLoop();
          break;
        case 'p':
          e.preventDefault();
          togglePiP();
          break;
        case 'q':
          e.preventDefault();
          setIsQualityOpen((prev) => !prev);
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          seekBy(-10);
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          seekBy(10);
          break;
        case 'arrowup':
          e.preventDefault();
          changeVolume(Math.min(playback.volume + 0.1, 1));
          break;
        case 'arrowdown':
          e.preventDefault();
          changeVolume(Math.max(playback.volume - 0.1, 0));
          break;
        case 'n':
          e.preventDefault();
          if (nextMedia) {
            onSelectMedia(nextMedia);
            showToast('Chuyển sang tập tiếp theo ⏭️');
          }
          break;
        case 'escape':
          if (isQualityOpen) {
            setIsQualityOpen(false);
          } else {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, playback, nextMedia, isQualityOpen]);

  const togglePlay = () => {
    sounds.playClick();
    const mediaEl = isAudio ? audioRef.current : videoRef.current;
    if (!mediaEl) return;

    if (playback.isPlaying) {
      mediaEl.pause();
      setPlayback((prev) => ({ ...prev, isPlaying: false }));
      showToast('Tạm dừng ⏸️');
    } else {
      mediaEl.play().catch(() => {});
      setPlayback((prev) => ({ ...prev, isPlaying: true }));
      showToast('Đang phát ▶️');
    }
  };

  const seekBy = (seconds: number) => {
    const mediaEl = isAudio ? audioRef.current : videoRef.current;
    if (!mediaEl) return;
    mediaEl.currentTime = Math.max(0, Math.min(mediaEl.currentTime + seconds, mediaEl.duration || 0));
    showToast(seconds > 0 ? `Tua tới +${seconds}s ⏩` : `Tua lùi ${seconds}s ⏪`);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    const mediaEl = isAudio ? audioRef.current : videoRef.current;
    if (mediaEl) {
      mediaEl.currentTime = targetTime;
      setPlayback((prev) => ({ ...prev, currentTime: targetTime }));
    }
  };

  const changeVolume = (newVol: number) => {
    const mediaEl = isAudio ? audioRef.current : videoRef.current;
    if (mediaEl) {
      mediaEl.volume = newVol;
      mediaEl.muted = newVol === 0;
    }
    setPlayback((prev) => ({
      ...prev,
      volume: newVol,
      isMuted: newVol === 0,
    }));
    showToast(newVol === 0 ? 'Đã tắt tiếng 🔇' : `Âm lượng: ${Math.round(newVol * 100)}% 🔊`);
  };

  const toggleMute = () => {
    sounds.playClick();
    const mediaEl = isAudio ? audioRef.current : videoRef.current;
    if (mediaEl) {
      mediaEl.muted = !playback.isMuted;
    }
    const nextMuted = !playback.isMuted;
    setPlayback((prev) => ({ ...prev, isMuted: nextMuted }));
    showToast(nextMuted ? 'Đã tắt tiếng 🔇' : 'Đã bật tiếng 🔊');
  };

  const changePlaybackRate = (rate: number) => {
    sounds.playClick();
    const mediaEl = isAudio ? audioRef.current : videoRef.current;
    if (mediaEl) {
      mediaEl.playbackRate = rate;
    }
    setPlayback((prev) => ({ ...prev, playbackRate: rate }));
    showToast(`Tốc độ phát: ${rate}x ⚡`);
  };

  const toggleLoop = () => {
    sounds.playClick();
    const mediaEl = isAudio ? audioRef.current : videoRef.current;
    if (mediaEl) {
      mediaEl.loop = !playback.isLooping;
    }
    const next = !playback.isLooping;
    setPlayback((prev) => ({ ...prev, isLooping: next }));
    showToast(next ? 'Đã bật lặp lại 🔁' : 'Đã tắt lặp lại');
  };

  const toggleTheater = () => {
    sounds.playClick();
    const next = !playback.isTheater;
    setPlayback((prev) => ({ ...prev, isTheater: next }));
    showToast(next ? 'Bật chế độ Rạp phim 🎬' : 'Thoát chế độ Rạp phim');
  };

  const toggleFullscreen = () => {
    sounds.playClick();
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      showToast('Toàn màn hình ⛶');
    } else {
      document.exitFullscreen().catch(() => {});
      showToast('Thoát toàn màn hình');
    }
  };

  const togglePiP = async () => {
    sounds.playClick();
    if (videoRef.current && document.pictureInPictureEnabled) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        showToast('Thoát PiP');
      } else {
        await videoRef.current.requestPictureInPicture();
        showToast('Bật chế độ PiP 🖼️');
      }
    }
  };

  const handleEnded = () => {
    if (playback.isLooping) return;
    if (autoNext && nextMedia) {
      onSelectMedia(nextMedia);
    } else {
      setPlayback((prev) => ({ ...prev, isPlaying: false }));
    }
  };

  const toggleCrackle = () => {
    sounds.playClick();
    const nextCrackle = !playback.analogCrackle;
    sounds.setVinylCrackle(nextCrackle);
    setPlayback((prev) => ({ ...prev, analogCrackle: nextCrackle }));
  };

  useEffect(() => {
    if (playbackControlRef) {
      playbackControlRef.current = {
        togglePlay,
        next: () => {
          if (nextMedia) onSelectMedia(nextMedia);
        },
      };
    }
  });

  useEffect(() => {
    onPlaybackChange?.({
      isPlaying: playback.isPlaying,
      currentTime: playback.currentTime,
      duration: playback.duration,
    });
  }, [playback.isPlaying, playback.currentTime, playback.duration]);

  if (!media) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-2xl overflow-y-auto transition-all duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none scale-95'
      }`}
      onClick={onClose}
    >
      {/* Dynamic Ambient Cinema Glow behind modal */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30 transition-all duration-700"
        style={{
          background: `radial-gradient(circle at center, var(--theme-primary) 0%, transparent 65%)`,
        }}
      />

      <div
        ref={playerContainerRef}
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
        className={`relative w-full rounded-2xl sm:rounded-3xl bg-[var(--theme-bg-surface)] border border-[var(--theme-border)] shadow-2xl shadow-black overflow-hidden flex flex-col transition-all duration-300 z-10 ${
          playback.isTheater ? 'max-w-6xl' : 'max-w-4xl'
        }`}
      >
        {/* Floating Action Toast Notification */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-black/90 border border-[var(--theme-primary)] text-white text-xs font-courier font-bold shadow-2xl backdrop-blur-md animate-fade-in pointer-events-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--theme-primary)] animate-ping" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Mobile Swipe / Drag Indicator Bar */}
        <div
          onClick={onClose}
          className="sm:hidden pt-2.5 pb-1 flex flex-col items-center justify-center bg-black/60 cursor-pointer border-b border-white/5 active:opacity-70"
          title="Vuốt hoặc chạm để thu nhỏ"
        >
          <div className="w-10 h-1 bg-white/30 rounded-full mb-1" />
          <span className="font-courier text-[9px] text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-1">
            <ChevronDown className="w-3 h-3" />
            <span>[THU NHỎ MINI-PLAYER]</span>
          </span>
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3.5 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden pr-2 sm:pr-4">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--theme-primary)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--theme-primary)]"></span>
            </span>

            <div className="truncate">
              {/* Title in Alegreya */}
              <h2 className="font-alegreya text-sm sm:text-lg font-bold text-white truncate" title={media.title}>
                {media.title}
              </h2>
              {/* Typewriter tag in Courier */}
              <div className="font-courier flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-neutral-400 font-bold uppercase">
                <span className="truncate max-w-[120px] sm:max-w-none">{media.folderName || 'MAIN CRATE'}</span>
                <span>•</span>
                <span className="text-[var(--theme-primary-light)]">
                  {media.quality || (isAudio ? '24-BIT HI-FI' : '1080P')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 font-courier shrink-0">
            <button
              onClick={() => {
                sounds.playClick();
                setPlayback((prev) => ({ ...prev, useDriveIframe: !prev.useDriveIframe }));
              }}
              className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold border transition-all ${
                playback.useDriveIframe
                  ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)] text-white'
                  : 'bg-white/5 border-white/15 text-neutral-300 hover:text-white'
              }`}
              title="Toggle between HTML5 Vinyl Player and Google Drive Preview Iframe"
            >
              🔄 <span className="hidden sm:inline">{playback.useDriveIframe ? 'Vinyl Player' : 'Drive Player'}</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                window.open(`https://drive.google.com/file/d/${media.fileId}/view`, '_blank');
              }}
              className="p-1 sm:p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Open file on Google Drive"
            >
              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Mobile Minimize / Close button */}
            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Thu nhỏ / Đóng (Esc)"
            >
              <ChevronDown className="w-5 h-5 sm:hidden text-[var(--theme-primary-light)]" />
              <X className="w-5 h-5 hidden sm:block" />
            </button>
          </div>
        </div>

        {/* Player Body */}
        <div className={`relative w-full bg-black flex items-center justify-center overflow-hidden ${isAudio ? 'min-h-[360px] sm:min-h-[430px]' : 'aspect-video'}`}>
          {playback.useDriveIframe ? (
            <iframe
              src={media.previewUrl || `https://drive.google.com/file/d/${media.fileId}/preview`}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : isAudio ? (
            /* Vinyl CD Turntable Audio Stage with Outer CD Sleeve on Stand */
            <div className="w-full h-full relative flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-[#170a16] via-[#0e050d] to-[#060205] select-none overflow-hidden">
              <audio
                ref={audioRef}
                src={media.streamUrl}
                autoPlay
                onTimeUpdate={() => {
                  if (audioRef.current) {
                    setPlayback((prev) => ({
                      ...prev,
                      currentTime: audioRef.current?.currentTime || 0,
                      duration: audioRef.current?.duration || 0,
                    }));
                  }
                }}
                onEnded={handleEnded}
                onError={() => {
                  setStreamError(true);
                  setPlayback((prev) => ({ ...prev, useDriveIframe: true }));
                }}
              />

              {/* Side-by-side: Outer CD Sleeve Jacket (Left) & Turntable Platter (Right) */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-10 w-full max-w-4xl">
                {/* 1. Outer CD Sleeve Display Stand (Bọc đĩa CD bên ngoài) */}
                <div className="hidden sm:flex flex-col items-center shrink-0">
                  <div className="relative group">
                    {/* Display Stand Base */}
                    <div className="w-44 h-44 rounded-xl overflow-hidden relative shadow-2xl border border-white/20 bg-[#120b14]">
                      <img
                        src={media.thumbnail}
                        alt={media.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Cellophane outer wrap gloss sheen */}
                      <div className="absolute inset-0 cd-sleeve-sheen pointer-events-none" />
                      {/* Ringwear impression */}
                      <div className="absolute inset-0 pointer-events-none rounded-full border border-white/10 opacity-30 m-auto w-[90%] h-[90%]" />
                      {/* Cardboard Spine */}
                      <div className="absolute left-0 top-0 bottom-0 w-3 cd-spine-shadow border-r border-white/15" />
                      {/* Foil Seal */}
                      <div className="absolute bottom-2 left-3 px-1.5 py-0.5 rounded bg-black/80 text-[7px] font-courier font-bold text-white uppercase tracking-wider">
                        CD VINYL SLEEVE
                      </div>
                    </div>

                    {/* Wooden / Metallic Vinyl Stand Shelf */}
                    <div className="w-48 h-3.5 -mt-1 mx-auto bg-gradient-to-b from-neutral-800 to-neutral-950 rounded-b-md border-t border-white/20 shadow-lg" />
                  </div>

                  <span className="font-courier text-[9px] text-neutral-400 mt-2 font-bold uppercase tracking-wider">
                    [NOW SPINNING SLEEVE]
                  </span>
                </div>

                {/* 2. Realistic Turntable Plinth */}
                <div className="relative w-52 h-52 sm:w-72 sm:h-72 rounded-full flex items-center justify-center shrink-0">
                  {/* Stroboscope Rim */}
                  <div className="absolute inset-0 rounded-full border-4 border-dashed border-white/20 animate-spin" style={{ animationDuration: '24s' }} />
                  
                  <div
                    className="w-[92%] h-[92%] rounded-full shadow-2xl flex items-center justify-center border-2 border-white/10"
                    style={{
                      background: 'radial-gradient(circle, #2a0e24 0%, #150612 70%, #080207 100%)',
                      boxShadow: '0 0 40px var(--theme-primary-glow)',
                    }}
                  >
                    <div className="block sm:hidden">
                      <VinylDisc
                        size={165}
                        isSpinning={playback.isPlaying}
                        speed={playback.audioRpm === 78 ? 'fast' : playback.audioRpm === 33 ? 'slow' : 'normal'}
                        coverImage={media.thumbnail}
                        labelColor="var(--theme-primary)"
                      />
                    </div>
                    <div className="hidden sm:block">
                      <VinylDisc
                        size={210}
                        isSpinning={playback.isPlaying}
                        speed={playback.audioRpm === 78 ? 'fast' : playback.audioRpm === 33 ? 'slow' : 'normal'}
                        coverImage={media.thumbnail}
                        labelColor="var(--theme-primary)"
                      />
                    </div>
                  </div>

                  {/* Animated Mechanical Tonearm */}
                  <div
                    className={`absolute -top-3 sm:-top-4 -right-1 sm:-right-2 w-20 h-36 sm:w-28 sm:h-48 pointer-events-none transition-transform duration-700 origin-top-right ${
                      playback.isPlaying ? 'rotate-12 translate-x-1' : '-rotate-12 translate-x-3'
                    }`}
                  >
                    <svg viewBox="0 0 80 160" className="w-full h-full drop-shadow-2xl">
                      <path
                        d="M 68 15 L 56 95 L 30 115"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <circle cx="68" cy="15" r="9" fill="var(--theme-primary)" stroke="#FFF" strokeWidth="2" />
                      <circle cx="68" cy="15" r="4" fill="#000" />
                      <rect x="23" y="110" width="14" height="10" rx="2" fill="var(--theme-primary)" stroke="#FFF" strokeWidth="1" />
                      <circle cx="25" cy="120" r="2" fill="#FF1493" className="animate-ping" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Dynamic Equalizer Waveform Bars */}
              <div className="mt-3 flex items-end justify-center gap-1.5 h-7 w-64">
                {[45, 80, 60, 95, 30, 85, 70, 50, 90, 65, 40, 85, 55, 75, 95, 35].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-to-t from-[var(--theme-primary)] to-[var(--theme-primary-light)] transition-all duration-150"
                    style={{
                      height: playback.isPlaying ? `${Math.max(15, (h * Math.sin((i + Date.now() / 150) * 0.7) + 100) % 95)}%` : '15%',
                      opacity: playback.isPlaying ? 0.9 : 0.3,
                    }}
                  />
                ))}
              </div>

              {/* Audio Controls Bar */}
              <div className="mt-3 flex items-center gap-3 font-courier">
                <button
                  onClick={toggleCrackle}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                    playback.analogCrackle
                      ? 'bg-[var(--theme-primary)]/20 border-[var(--theme-primary)] text-[var(--theme-primary-light)]'
                      : 'bg-black/40 border-white/10 text-neutral-400 hover:text-white'
                  }`}
                  title="Toggle Analog Vinyl Groove Crackle & Hiss"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>VINYL CRACKLE: {playback.analogCrackle ? 'ON' : 'OFF'}</span>
                </button>

                {/* Turntable RPM switch */}
                <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded-full border border-white/10 text-[11px] font-bold">
                  {([33, 45, 78] as const).map((rpm) => (
                    <button
                      key={rpm}
                      onClick={() => {
                        sounds.playClick();
                        setPlayback((prev) => ({ ...prev, audioRpm: rpm }));
                      }}
                      className={`px-2 py-0.5 rounded-full transition-colors ${
                        playback.audioRpm === rpm
                          ? 'bg-[var(--theme-primary)] text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {rpm} RPM
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* HTML5 Video Player */
            <div className="w-full h-full relative group">
              <video
                ref={videoRef}
                src={media.streamUrl}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                onWaiting={() => setBuffering(true)}
                onPlaying={() => setBuffering(false)}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setPlayback((prev) => ({
                      ...prev,
                      currentTime: videoRef.current?.currentTime || 0,
                      duration: videoRef.current?.duration || 0,
                    }));
                  }
                }}
                onEnded={handleEnded}
                onError={() => {
                  setStreamError(true);
                  setPlayback((prev) => ({ ...prev, useDriveIframe: true }));
                }}
                onClick={togglePlay}
                onDoubleClick={toggleFullscreen}
              />

              {buffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                  <div className="w-12 h-12 rounded-full border-4 border-[var(--theme-primary)] border-t-transparent animate-spin" />
                </div>
              )}

              {!playback.isPlaying && !buffering && (
                <div
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-[var(--theme-primary)] text-white flex items-center justify-center shadow-2xl transform scale-100 hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </div>
                </div>
              )}
            </div>
          )}

          {streamError && (
            <div className="absolute top-3 left-3 right-3 bg-red-950/90 border border-red-500/40 text-red-200 text-xs px-3 py-1.5 rounded-lg flex items-center justify-between z-20 font-courier">
              <span>Streaming stream error, switching to Google Drive player...</span>
              <button
                onClick={() => setStreamError(false)}
                className="font-bold underline ml-2"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Custom Transport Controls */}
        {!playback.useDriveIframe && (
          <div
            className={`px-4 sm:px-6 py-3 bg-[var(--theme-bg-surface)] border-t border-white/10 transition-opacity duration-200 ${
              isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Scrubber Progress Bar */}
            <div className="flex items-center gap-3 mb-2.5 font-courier">
              <span className="text-xs text-neutral-300 w-12 text-right font-bold">
                {formatTime(playback.currentTime)}
              </span>

              <div className="relative flex-grow flex items-center group/scrubber">
                <input
                  type="range"
                  min={0}
                  max={playback.duration || 100}
                  step={0.1}
                  value={playback.currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[var(--theme-primary)] group-hover/scrubber:h-2.5 transition-all"
                />
              </div>

              <span className="text-xs text-neutral-400 w-12 font-bold">
                {formatTime(playback.duration)}
              </span>
            </div>

            {/* Bottom Controls Row */}
            <div className="flex items-center justify-between font-courier">
              {/* Left Controls */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-full bg-[var(--theme-primary)] text-white hover:scale-105 transition-transform"
                  title={playback.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  {playback.isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => seekBy(-10)}
                  className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="Rewind 10s (← / J)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => seekBy(10)}
                  className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="Fast-forward 10s (→ / L)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <div className="hidden sm:flex items-center gap-1.5 group/vol">
                  <button
                    onClick={toggleMute}
                    className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                    title="Mute / Unmute (M)"
                  >
                    {playback.isMuted || playback.volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={playback.isMuted ? 0 : playback.volume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[var(--theme-primary)]"
                    title="Volume"
                  />
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Resolution Quality Selector Popover */}
                {!isAudio && (
                  <div className="relative">
                    <button
                      onClick={() => setIsQualityOpen(!isQualityOpen)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 ${
                        isQualityOpen
                          ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)] text-white'
                          : 'bg-black/40 border-white/10 text-neutral-300 hover:text-white hover:bg-white/10'
                      }`}
                      title="Chỉnh độ phân giải (Q)"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span className="uppercase text-[10px]">
                        {selectedQuality === 'auto' ? 'Auto' : selectedQuality}
                      </span>
                    </button>

                    {isQualityOpen && (
                      <div className="absolute bottom-full right-0 mb-2 w-44 rounded-xl bg-black/95 border border-[var(--theme-border)] shadow-2xl backdrop-blur-xl p-2 z-50 animate-fade-in font-courier">
                        <div className="text-[10px] uppercase font-bold text-neutral-400 px-2 py-1 border-b border-white/10 mb-1">
                          ⚙️ ĐỘ PHÂN GIẢI (Q)
                        </div>
                        {[
                          { id: 'auto', label: 'Tự động (Auto)', tag: 'Gốc' },
                          { id: '1080p', label: '1080p Cinema', tag: 'Full HD' },
                          { id: '720p', label: '720p HD', tag: 'Mượt mà' },
                          { id: '480p', label: '480p SD', tag: 'Ổn định' },
                          { id: '360p', label: '360p Low', tag: 'Tiết kiệm' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              sounds.playClick();
                              setSelectedQuality(opt.id);
                              setIsQualityOpen(false);
                              showToast(`Chất lượng: ${opt.label} ⚙️`);
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-bold text-left transition-colors ${
                              selectedQuality === opt.id
                                ? 'bg-[var(--theme-primary)] text-white'
                                : 'text-neutral-300 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <span>{opt.label}</span>
                            <span className="text-[9px] opacity-75 font-normal">[{opt.tag}]</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="hidden sm:flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/10 text-xs font-bold">
                  {[0.75, 1, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        playback.playbackRate === rate
                          ? 'bg-[var(--theme-primary)] text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={toggleLoop}
                  className={`p-1.5 rounded-lg transition-colors ${
                    playback.isLooping
                      ? 'text-[var(--theme-primary)] bg-[var(--theme-primary)]/15'
                      : 'text-neutral-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Toggle Repeat (R)"
                >
                  <Repeat className="w-4 h-4" />
                </button>

                {!isAudio && (
                  <button
                    onClick={togglePiP}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Picture-in-Picture (P)"
                  >
                    <PictureInPicture className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={toggleTheater}
                  className={`p-1.5 rounded-lg transition-colors ${
                    playback.isTheater
                      ? 'text-[var(--theme-primary)] bg-[var(--theme-primary)]/15'
                      : 'text-neutral-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Theater Mode (T)"
                >
                  <Tv className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Fullscreen (F)"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                <button
                  onClick={onOpenShortcuts}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Keyboard Shortcuts Cheatsheet"
                >
                  <Keyboard className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Playlist & Related Items Carousel below player */}
        <div className="px-5 py-4 border-t border-white/10 bg-black/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-alegreya text-base font-bold text-white tracking-wide">
                Crate Playlist &amp; Related Reels
              </span>
              <span className="font-courier text-xs text-neutral-400 font-bold">
                [{playlist.length} TRACKS]
              </span>
            </div>

            <div className="flex items-center gap-3 font-courier">
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer font-bold">
                <span>AUTO-NEXT</span>
                <input
                  type="checkbox"
                  checked={autoNext}
                  onChange={(e) => setAutoNext(e.target.checked)}
                  className="rounded accent-[var(--theme-primary)]"
                />
              </label>

              <div className="flex items-center gap-1">
                <button
                  disabled={!prevMedia}
                  onClick={() => prevMedia && onSelectMedia(prevMedia)}
                  className="p-1 rounded-md bg-white/5 border border-white/10 text-neutral-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-white/15 transition-colors"
                  title="Previous Episode"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={!nextMedia}
                  onClick={() => nextMedia && onSelectMedia(nextMedia)}
                  className="p-1 rounded-md bg-white/5 border border-white/10 text-neutral-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-white/15 transition-colors"
                  title="Next Episode (N)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {playlist.map((item, idx) => {
              const isActive = item.id === media.id;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectMedia(item)}
                  className={`flex-shrink-0 w-44 rounded-xl p-2 cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-[var(--theme-primary)]/20 border-[var(--theme-primary)] shadow-md shadow-[var(--theme-primary-glow)]'
                      : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-1.5 bg-black/60">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {isActive && (
                      <div className="absolute inset-0 bg-[var(--theme-primary)]/40 flex items-center justify-center">
                        <Play className="w-4 h-4 fill-current text-white animate-pulse" />
                      </div>
                    )}
                    <span className="font-courier absolute bottom-1 right-1 px-1 rounded bg-black/75 text-[9px] font-bold text-white">
                      {item.duration || `EP.${idx + 1}`}
                    </span>
                  </div>
                  <p className="font-alegreya text-sm text-white line-clamp-1 font-bold" title={item.title}>
                    {item.title}
                  </p>
                  <p className="font-courier text-[10px] text-neutral-400 line-clamp-1 uppercase">
                    {item.genre || item.folderName}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
