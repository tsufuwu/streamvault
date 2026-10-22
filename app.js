/**
 * app.js — Orangestream Frontend Logic
 * Dynamic, real-time media streaming from Google Drive with fresh citrus theme 🍊
 */

// ─── CONFIG ─────────────────────────────────────────
const MEDIA_LIST_API = '/.netlify/functions/get-media-list';

// ─── State ──────────────────────────────────────────
let state = {
  allMedia:  [],
  filter:    'all',
  genre:     'all',
  search:    '',
  currentMedia: null,
};

// ─── DOM References ──────────────────────────────────
const mediaGrid      = document.getElementById('media-grid');
const sectionCount   = document.getElementById('section-count');
const playerOverlay  = document.getElementById('player-overlay');
const playerTitle    = document.getElementById('player-title');
const playerSubtitle = document.getElementById('player-subtitle');
const playerBody     = document.getElementById('player-body');
const openNewTab     = document.getElementById('open-new-tab');
const toastContainer = document.getElementById('toast-container');
const searchInput    = document.getElementById('search-input');
const genreTabs      = document.getElementById('genre-tabs');

// ─── Juice Splash Particle Effect ───────────────────
function createJuiceSplash(x, y) {
  if (!x || !y) return;
  const drops = 9;
  for (let i = 0; i < drops; i++) {
    const el = document.createElement('div');
    el.className = 'juice-drop';
    const size = Math.random() * 8 + 4;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    const angle = (Math.PI * 2 / drops) * i + (Math.random() - 0.5);
    const distance = Math.random() * 50 + 25;
    el.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
    el.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }
}

// ─── Toast ───────────────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  const icon = type === 'error'
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
    : `<span style="font-size:1.1rem;">🍊</span>`;
  el.innerHTML = `${icon}<span>${msg}</span>`;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ─── Fetch Media From Netlify API ────────────────────
async function fetchMediaLibrary() {
  // Show warm orange skeleton loading
  mediaGrid.innerHTML = Array(8).fill(0).map(() => `
    <div class="media-card" style="pointer-events:none;">
      <div class="card-thumbnail" style="background:linear-gradient(90deg,#20140b 25%,#341f11 50%,#20140b 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;"></div>
      <div class="card-info">
        <div style="height:15px;border-radius:4px;background:#24160d;margin-bottom:8px;animation:shimmer 1.5s infinite;"></div>
        <div style="height:11px;border-radius:4px;background:#24160d;width:55%;animation:shimmer 1.5s infinite;"></div>
      </div>
    </div>`).join('');

  try {
    const res  = await fetch(MEDIA_LIST_API);
    const json = await res.json();

    if (!json.ok) throw new Error(json.error || 'Lỗi đọc dữ liệu từ vườn cam');

    state.allMedia = json.data;
    renderGenreTabs();
    updateSidebarCounts();
    renderGrid();
    toast(`Đã thu hoạch ${json.count} quả cam media tươi ngon!`, 'info');

  } catch (err) {
    mediaGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <h3>Vườn cam tạm thời bận</h3>
        <p>${err.message}</p>
        <button onclick="fetchMediaLibrary()" style="margin-top:14px;padding:9px 20px;background:var(--orange-500);color:white;border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:600;">Thử lại</button>
      </div>`;
    toast('Không thể tải vườn cam: ' + err.message, 'error');
  }
}

// ─── Filtered List ────────────────────────────────────
function getFilteredMedia() {
  return state.allMedia.filter(m => {
    const matchType  = state.filter === 'all' || m.type === state.filter;
    const matchGenre = state.genre  === 'all' || m.genre === state.genre;
    const matchSearch = !state.search ||
      m.title.toLowerCase().includes(state.search.toLowerCase()) ||
      (m.genre || '').toLowerCase().includes(state.search.toLowerCase());
    return matchType && matchGenre && matchSearch;
  });
}

// ─── Render Grid ──────────────────────────────────────
function renderGrid() {
  const items = getFilteredMedia();
  sectionCount.textContent = `${items.length} quả cam`;
  mediaGrid.innerHTML = '';

  if (items.length === 0) {
    mediaGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <span style="font-size:3rem;display:block;margin-bottom:1rem;">🍊</span>
        <h3>Không tìm thấy quả cam nào</h3>
        <p>Thử tìm từ khoá khác hoặc chọn lại bộ lọc</p>
      </div>`;
    return;
  }

  items.forEach((media, i) => {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Phát ${media.title}`);
    card.id = `card-${media.id}`;
    card.style.animationDelay = `${i * 40}ms`;

    const isVideo = media.type === 'video';
    const thumbContent = media.thumbnail
      ? `<img src="${media.thumbnail}" alt="${media.title}" loading="lazy">`
      : isVideo
        ? `<svg class="card-default-icon" width="56" height="56" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>`
        : `<svg class="card-default-icon" width="56" height="56" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;

    card.innerHTML = `
      <div class="card-thumbnail">
        ${thumbContent}
        <span class="card-type-badge badge-${media.type}">${isVideo ? 'Phim Cam' : 'Nhạc Cam'}</span>
        <div class="card-play-overlay">
          <div class="play-circle" title="Xem ngay">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
      <div class="card-info">
        <div class="card-title" title="${media.title}">${media.title}</div>
        <div class="card-meta">
          ${media.quality  ? `<span class="quality-badge">${media.quality}</span>` : ''}
          ${media.genre    ? `<span class="card-meta-item">🍃 ${media.genre}</span>` : ''}
        </div>
      </div>`;

    card.addEventListener('click', (e) => {
      createJuiceSplash(e.clientX, e.clientY);
      openPlayer(media);
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const rect = card.getBoundingClientRect();
        createJuiceSplash(rect.left + rect.width / 2, rect.top + rect.height / 2);
        openPlayer(media);
      }
    });
    mediaGrid.appendChild(card);
  });
}

// ─── Genre Tabs ───────────────────────────────────────
function renderGenreTabs() {
  const genres = [...new Set(state.allMedia.map(m => m.genre).filter(Boolean))].sort();
  genreTabs.innerHTML = `<button class="genre-tag active" data-genre="all" id="genre-all">🍊 Tất cả</button>`;
  genres.forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'genre-tag';
    btn.dataset.genre = g;
    btn.textContent = g;
    btn.id = `genre-${g.replace(/\s+/g, '-').toLowerCase()}`;
    genreTabs.appendChild(btn);
  });
  genreTabs.addEventListener('click', e => {
    const btn = e.target.closest('.genre-tag');
    if (!btn) return;
    genreTabs.querySelectorAll('.genre-tag').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.genre = btn.dataset.genre;
    renderGrid();
  });
}

// ─── Sidebar Counts ───────────────────────────────────
function updateSidebarCounts() {
  document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
    const f = btn.dataset.filter;
    const count = f === 'all' ? state.allMedia.length : state.allMedia.filter(m => m.type === f).length;
    const countEl = btn.querySelector('.count');
    if (countEl) countEl.textContent = count;
  });
}

// ─── Time Formatter ───────────────────────────────────
function formatTime(sec) {
  if (isNaN(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// ─── Custom Orange Video Player ───────────────────────
function initOrangeVideoPlayer(media) {
  const streamUrl = `https://drive.usercontent.google.com/download?id=${media.fileId}&export=download`;
  const previewUrl = `https://drive.google.com/file/d/${media.fileId}/preview`;

  playerBody.innerHTML = `
    <div class="custom-orange-player" id="orange-player-box">
      <video id="orange-video-el" preload="auto" playsinline src="${streamUrl}">
        Trình duyệt không hỗ trợ thẻ video HTML5.
      </video>

      <!-- Center Big Play Button (Orange Slice) -->
      <button class="big-play-btn" id="big-play-btn" title="Phát video">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
      </button>

      <!-- Citrus Controls Overlay -->
      <div class="citrus-controls" id="citrus-controls">

        <!-- ─── Orange Seekbar / Thanh Chạy Trái Cam ─── -->
        <div class="orange-seekbar-container" id="orange-seekbar" role="slider" aria-label="Thanh chạy trái cam">
          <div class="orange-seek-track">
            <div class="orange-seek-buffered" id="seek-buffered"></div>
            <div class="orange-seek-progress" id="seek-progress"></div>
          </div>
          <!-- Rolling Orange Handle (Trái cam đang lăn trên thanh chạy) -->
          <div class="rolling-orange-thumb" id="orange-thumb" title="Trái cam đang chạy">
            🍊
          </div>
          <div class="seek-tooltip" id="seek-tooltip">0:00</div>
        </div>

        <!-- ─── Controls Bar ─── -->
        <div class="controls-bar">
          <div class="controls-left">
            <button class="ctrl-btn" id="ctrl-play-pause" title="Phát / Dừng">
              <svg id="icon-play" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <svg id="icon-pause" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <button class="ctrl-btn" id="ctrl-rewind" title="Tua lại 10s">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            </button>
            <button class="ctrl-btn" id="ctrl-forward" title="Tua tới 10s">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
            <div class="time-display">
              <span id="time-current">0:00</span>
              <span class="time-sep">/</span>
              <span id="time-duration">0:00</span>
            </div>
          </div>

          <div class="controls-right">
            <div class="volume-container">
              <button class="ctrl-btn" id="ctrl-volume" title="Âm lượng">
                <svg id="icon-vol" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              </button>
              <input type="range" class="volume-slider" id="ctrl-vol-slider" min="0" max="1" step="0.05" value="1">
            </div>

            <button class="ctrl-btn speed-btn" id="ctrl-speed" title="Tốc độ">1.0x</button>
            <button class="ctrl-btn" id="ctrl-fullscreen" title="Toàn màn hình">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>
            <button class="ctrl-btn fallback-toggle-btn" id="ctrl-switch-player" title="Đổi sang Google Player">
              <span>🔄 Drive Player</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const videoBox     = document.getElementById('orange-player-box');
  const video        = document.getElementById('orange-video-el');
  const bigPlayBtn   = document.getElementById('big-play-btn');
  const playPauseBtn = document.getElementById('ctrl-play-pause');
  const iconPlay     = document.getElementById('icon-play');
  const iconPause    = document.getElementById('icon-pause');
  const seekbar      = document.getElementById('orange-seekbar');
  const seekProgress = document.getElementById('seek-progress');
  const seekBuffered = document.getElementById('seek-buffered');
  const orangeThumb  = document.getElementById('orange-thumb');
  const seekTooltip  = document.getElementById('seek-tooltip');
  const timeCurrent  = document.getElementById('time-current');
  const timeDuration = document.getElementById('time-duration');
  const volBtn       = document.getElementById('ctrl-volume');
  const volSlider    = document.getElementById('ctrl-vol-slider');
  const speedBtn     = document.getElementById('ctrl-speed');
  const fsBtn        = document.getElementById('ctrl-fullscreen');
  const rewindBtn    = document.getElementById('ctrl-rewind');
  const forwardBtn   = document.getElementById('ctrl-forward');
  const switchBtn    = document.getElementById('ctrl-switch-player');

  function togglePlay() {
    if (video.paused || video.ended) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  video.addEventListener('play', () => {
    bigPlayBtn.classList.add('hidden');
    iconPlay.style.display = 'none';
    iconPause.style.display = '';
  });

  video.addEventListener('pause', () => {
    bigPlayBtn.classList.remove('hidden');
    iconPlay.style.display = '';
    iconPause.style.display = 'none';
  });

  bigPlayBtn.addEventListener('click', togglePlay);
  playPauseBtn.addEventListener('click', togglePlay);
  video.addEventListener('click', togglePlay);

  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    seekProgress.style.width = `${pct}%`;
    orangeThumb.style.left = `${pct}%`;
    // 🍊 Trái cam lăn tròn theo tiến trình phát video!
    orangeThumb.style.transform = `translate(-50%, -50%) rotate(${pct * 7.2}deg)`;
    timeCurrent.textContent = formatTime(video.currentTime);
  });

  video.addEventListener('loadedmetadata', () => {
    timeDuration.textContent = formatTime(video.duration);
  });

  video.addEventListener('progress', () => {
    if (video.buffered.length > 0 && video.duration) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      seekBuffered.style.width = `${(bufferedEnd / video.duration) * 100}%`;
    }
  });

  let isSeeking = false;
  function seekTo(e) {
    const rect = seekbar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (video.duration) {
      video.currentTime = pos * video.duration;
    }
    const pct = pos * 100;
    seekProgress.style.width = `${pct}%`;
    orangeThumb.style.left = `${pct}%`;
    orangeThumb.style.transform = `translate(-50%, -50%) rotate(${pct * 7.2}deg)`;
  }

  seekbar.addEventListener('mousedown', (e) => {
    isSeeking = true;
    seekTo(e);
  });

  window.addEventListener('mousemove', (e) => {
    if (isSeeking) seekTo(e);
  });

  window.addEventListener('mouseup', () => {
    if (isSeeking) isSeeking = false;
  });

  seekbar.addEventListener('mousemove', (e) => {
    const rect = seekbar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTooltip.style.left = `${pos * 100}%`;
    seekTooltip.textContent = formatTime(pos * (video.duration || 0));
  });

  rewindBtn.addEventListener('click', () => { video.currentTime = Math.max(0, video.currentTime - 10); });
  forwardBtn.addEventListener('click', () => { video.currentTime = Math.min(video.duration || 0, video.currentTime + 10); });

  volSlider.addEventListener('input', e => {
    video.volume = e.target.value;
    video.muted = (video.volume === 0);
  });
  volBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    volSlider.value = video.muted ? 0 : video.volume;
  });

  const speeds = [1.0, 1.25, 1.5, 2.0];
  let speedIdx = 0;
  speedBtn.addEventListener('click', () => {
    speedIdx = (speedIdx + 1) % speeds.length;
    const rate = speeds[speedIdx];
    video.playbackRate = rate;
    speedBtn.textContent = `${rate.toFixed(1)}x`;
  });

  fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      videoBox.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  let hideTimer;
  function resetControlsTimer() {
    videoBox.classList.remove('controls-hidden');
    clearTimeout(hideTimer);
    if (!video.paused) {
      hideTimer = setTimeout(() => {
        videoBox.classList.add('controls-hidden');
      }, 3500);
    }
  }
  videoBox.addEventListener('mousemove', resetControlsTimer);

  switchBtn.addEventListener('click', () => {
    video.pause();
    playerBody.innerHTML = `
      <div class="player-video-wrapper">
        <iframe class="player-iframe" src="${previewUrl}" allow="autoplay; fullscreen" allowfullscreen></iframe>
      </div>
    `;
    toast('Đã chuyển sang trình phát Google Drive 🔄', 'info');
  });

  video.addEventListener('error', () => {
    playerBody.innerHTML = `
      <div class="player-video-wrapper">
        <iframe class="player-iframe" src="${previewUrl}" allow="autoplay; fullscreen" allowfullscreen></iframe>
      </div>
    `;
    toast('Đang dùng trình phát Google Drive để tối ưu định dạng 🍊', 'info');
  });

  video.play().catch(() => {});
}

// ─── Custom Orange Audio Player ───────────────────────
function initOrangeAudioPlayer(media) {
  const audioUrl = `https://drive.usercontent.google.com/download?id=${media.fileId}&export=download`;

  playerBody.innerHTML = `
    <div style="padding:28px 24px;background:#140e08;border-radius:0 0 16px 16px;">
      <div style="display:flex;align-items:center;gap:20px;margin-bottom:20px;">
        <div style="width:70px;height:70px;border-radius:14px;background:linear-gradient(135deg,#ea580c,#9a3412);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 20px rgba(255,122,0,0.3);">
          <span style="font-size:2.2rem;">🍊</span>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:1.15rem;margin-bottom:6px;color:#FFF7ED;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${media.title}</div>
          <div style="font-size:0.84rem;color:#D4A373;">🍃 ${media.genre || 'Audio Cam'}</div>
        </div>
      </div>

      <audio id="orange-audio-el" src="${audioUrl}" preload="auto"></audio>

      <!-- Orange Seekbar for Audio -->
      <div class="orange-seekbar-container" id="audio-seekbar" role="slider" aria-label="Thanh chạy trái cam audio">
        <div class="orange-seek-track">
          <div class="orange-seek-progress" id="audio-progress"></div>
        </div>
        <div class="rolling-orange-thumb" id="audio-thumb" title="Trái cam đang chạy">
          🍊
        </div>
        <div class="seek-tooltip" id="audio-tooltip">0:00</div>
      </div>

      <div class="controls-bar" style="margin-top:10px;">
        <div class="controls-left">
          <button class="ctrl-btn" id="audio-play-pause" title="Phát / Dừng">
            <svg id="audio-icon-play" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <svg id="audio-icon-pause" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          </button>
          <div class="time-display">
            <span id="audio-current">0:00</span>
            <span class="time-sep">/</span>
            <span id="audio-duration">0:00</span>
          </div>
        </div>
        <div class="controls-right">
          <div class="volume-container">
            <input type="range" class="volume-slider" id="audio-vol-slider" min="0" max="1" step="0.05" value="1">
          </div>
        </div>
      </div>
    </div>
  `;

  const audio        = document.getElementById('orange-audio-el');
  const playPauseBtn = document.getElementById('audio-play-pause');
  const iconPlay     = document.getElementById('audio-icon-play');
  const iconPause    = document.getElementById('audio-icon-pause');
  const seekbar      = document.getElementById('audio-seekbar');
  const seekProgress = document.getElementById('audio-progress');
  const orangeThumb  = document.getElementById('audio-thumb');
  const timeCurrent  = document.getElementById('audio-current');
  const timeDuration = document.getElementById('audio-duration');
  const volSlider    = document.getElementById('audio-vol-slider');

  function togglePlay() {
    if (audio.paused || audio.ended) audio.play().catch(() => {});
    else audio.pause();
  }

  audio.addEventListener('play', () => {
    iconPlay.style.display = 'none';
    iconPause.style.display = '';
  });
  audio.addEventListener('pause', () => {
    iconPlay.style.display = '';
    iconPause.style.display = 'none';
  });
  playPauseBtn.addEventListener('click', togglePlay);

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    seekProgress.style.width = `${pct}%`;
    orangeThumb.style.left = `${pct}%`;
    orangeThumb.style.transform = `translate(-50%, -50%) rotate(${pct * 7.2}deg)`;
    timeCurrent.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => {
    timeDuration.textContent = formatTime(audio.duration);
  });

  seekbar.addEventListener('click', (e) => {
    const rect = seekbar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audio.duration) audio.currentTime = pos * audio.duration;
  });

  volSlider.addEventListener('input', e => { audio.volume = e.target.value; });
  audio.play().catch(() => {});
}

// ─── Player Entry Point ───────────────────────────────
function openPlayer(media) {
  state.currentMedia = media;
  playerTitle.textContent    = media.title;
  playerSubtitle.textContent = [media.genre, media.year, media.duration].filter(Boolean).join(' · ');
  playerOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  openNewTab.href = `https://drive.google.com/file/d/${media.fileId}/view`;
  openNewTab.style.display = '';

  if (media.type === 'video') {
    initOrangeVideoPlayer(media);
  } else {
    initOrangeAudioPlayer(media);
  }
}

function closePlayer() {
  playerOverlay.classList.remove('active');
  document.body.style.overflow = '';
  const vid = document.getElementById('orange-video-el');
  if (vid) vid.pause();
  const aud = document.getElementById('orange-audio-el');
  if (aud) aud.pause();
  playerBody.innerHTML = '';
  state.currentMedia = null;
}

// ─── Sidebar Filter ───────────────────────────────────
document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    createJuiceSplash(e.clientX, e.clientY);
    document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.filter = btn.dataset.filter;
    renderGrid();
  });
});

// ─── Search ───────────────────────────────────────────
searchInput.addEventListener('input', e => {
  state.search = e.target.value;
  renderGrid();
});

// Keyboard shortcut (Ctrl+K / Cmd+K or /)
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
  if (e.key === 'Escape') closePlayer();
});

// ─── Close Player ─────────────────────────────────────
document.getElementById('close-player').addEventListener('click', closePlayer);
playerOverlay.addEventListener('click', e => { if (e.target === playerOverlay) closePlayer(); });

// ─── Logo Mascot Interaction ──────────────────────────
const mascot = document.querySelector('.orange-mascot');
if (mascot) {
  mascot.addEventListener('click', (e) => {
    createJuiceSplash(e.clientX, e.clientY);
    toast('Chào mừng bạn đến với Orangestream! 🍊🌿', 'info');
  });
}

// ─── Shimmer Style ────────────────────────────────────
const shimmerStyle = document.createElement('style');
shimmerStyle.textContent = `@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
document.head.appendChild(shimmerStyle);

// ─── INIT ─────────────────────────────────────────────
fetchMediaLibrary();
