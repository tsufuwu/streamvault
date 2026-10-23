import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space / K', desc: 'Play / Pause stream' },
    { key: 'F / Double-Click', desc: 'Toggle Fullscreen mode' },
    { key: '← / J', desc: 'Rewind 10 seconds' },
    { key: '→ / L', desc: 'Fast-forward 10 seconds' },
    { key: '0 - 9', desc: 'Jump to 0% - 90% of duration' },
    { key: '↑ / ↓', desc: 'Volume Up / Down (10%)' },
    { key: 'M', desc: 'Toggle Mute / Unmute' },
    { key: 'Q', desc: 'Change stream quality / resolution' },
    { key: 'T', desc: 'Toggle Theater Cinema mode' },
    { key: 'P', desc: 'Picture-in-Picture window' },
    { key: 'R', desc: 'Toggle Continuous Repeat' },
    { key: 'N', desc: 'Play next item in playlist' },
    { key: '⌘K / /', desc: 'Focus Quick Search omnibar' },
    { key: 'Esc', desc: 'Dismiss player or active modal' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--theme-bg-surface)] border border-[var(--theme-border)] shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-[var(--theme-primary)]">
            <Keyboard className="w-5 h-5" />
            <h3 className="font-alegreya text-xl font-bold text-white tracking-wide">
              Keyboard Shortcuts Guide
            </h3>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 max-h-[60vh] overflow-y-auto pr-1 font-courier">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs"
            >
              <span className="text-neutral-300 font-medium">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded bg-black/60 border border-[var(--theme-border)] text-[var(--theme-primary-light)] font-bold shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="font-courier px-5 py-2 rounded-xl bg-[var(--theme-primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity uppercase tracking-wider"
          >
            [CLOSE SHORTCUTS]
          </button>
        </div>
      </div>
    </div>
  );
};
