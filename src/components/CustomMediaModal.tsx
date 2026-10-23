import React, { useState } from 'react';
import { X, Plus, Film, Music, Check, Link2 } from 'lucide-react';
import { MediaItem, MediaType } from '../types';
import { sounds } from '../utils/soundEffects';

interface CustomMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMedia: (item: MediaItem) => void;
  existingFolders: string[];
}

export const CustomMediaModal: React.FC<CustomMediaModalProps> = ({
  isOpen,
  onClose,
  onAddMedia,
  existingFolders,
}) => {
  const [driveInput, setDriveInput] = useState('');
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('video');
  const [folder, setFolder] = useState('Personal Crate');
  const [customFolder, setCustomFolder] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const extractFileId = (input: string): string => {
    const trimmed = input.trim();
    const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fileId = extractFileId(driveInput);
    if (!fileId || fileId.length < 5) {
      setError('Please enter a valid Google Drive link or File ID!');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title for the media!');
      return;
    }

    const targetFolder = folder === '__custom__' ? customFolder.trim() || 'My Collection' : folder;
    const finalThumbnail = thumbnailUrl.trim() || `https://lh3.googleusercontent.com/u/0/d/${fileId}=w800`;

    const newItem: MediaItem = {
      id: `custom_${Date.now()}`,
      title: title.trim(),
      fileId,
      type: mediaType,
      thumbnail: finalThumbnail,
      quality: '',
      genre: targetFolder,
      folderName: targetFolder,
      folderPath: [targetFolder],
      streamUrl: `https://orange.celinewang.workers.dev/stream-media/${fileId}`,
      previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      isCustom: true,
    };

    sounds.playBeatDrop(100);
    onAddMedia(newItem);
    onClose();

    setDriveInput('');
    setTitle('');
    setThumbnailUrl('');
    setCustomFolder('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[var(--theme-bg-surface)] border border-[var(--theme-border)] shadow-2xl p-6 sm:p-7 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-[var(--theme-primary)]">
            <Plus className="w-5 h-5" />
            <h3 className="font-alegreya text-xl font-bold text-white tracking-wide">
              Add Google Drive Media
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

        <form onSubmit={handleSubmit} className="space-y-4 font-courier">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-bold">
              [ERROR]: {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
              <Link2 className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
              <span>Google Drive Share Link or File ID:</span>
            </label>
            <input
              type="text"
              required
              placeholder="https://drive.google.com/file/d/1we2Sh... or 1JF02Bx..."
              value={driveInput}
              onChange={(e) => setDriveInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[var(--theme-primary)]"
            />
            <p className="text-[11px] text-neutral-400 mt-1 font-normal">
              Ensure Google Drive permission is set to: <span className="text-emerald-400 font-bold">"Anyone with the link can view"</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Media Title:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. My Favorite Song or Movie..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[var(--theme-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                Media Format:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    mediaType === 'video'
                      ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)] text-white'
                      : 'bg-black/40 border-white/10 text-neutral-400'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaType('audio')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    mediaType === 'audio'
                      ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)] text-white'
                      : 'bg-black/40 border-white/10 text-neutral-400'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Audio</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                Save to Folder:
              </label>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:outline-none focus:border-[var(--theme-primary)]"
              >
                {existingFolders.map((f) => (
                  <option key={f} value={f} className="bg-neutral-900 text-white">
                    {f}
                  </option>
                ))}
                <option value="__custom__" className="bg-neutral-900 text-white">
                  + Create new folder...
                </option>
              </select>
            </div>
          </div>

          {folder === '__custom__' && (
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                New Folder Name:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chill Session..."
                value={customFolder}
                onChange={(e) => setCustomFolder(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[var(--theme-primary)]"
              />
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white shadow-lg shadow-[var(--theme-primary)]/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save to Library</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
