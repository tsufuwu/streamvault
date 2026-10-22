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

// ─── Player ───────────────────────────────────────────
function openPlayer(media) {
  state.currentMedia = media;
  playerTitle.textContent    = media.title;
  playerSubtitle.textContent = [media.genre, media.year, media.duration].filter(Boolean).join(' · ');
  playerOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  if (media.type === 'video') {
    // Google Drive Preview Iframe: Fast, supports 1080p/720p/360p, subtitles, zero CORS issues
    playerBody.innerHTML = `
      <div class="player-video-wrapper">
        <iframe class="player-iframe"
                src="https://drive.google.com/file/d/${media.fileId}/preview"
                allow="autoplay; fullscreen"
                allowfullscreen>
        </iframe>
      </div>`;
    openNewTab.href = `https://drive.google.com/file/d/${media.fileId}/view`;
    openNewTab.style.display = '';
  } else {
    // Audio Player
    const audioUrl = `https://drive.usercontent.google.com/download?id=${media.fileId}&export=download`;
    playerBody.innerHTML = `
      <div style="padding:32px 24px;background:#140e08;display:flex;align-items:center;gap:20px;">
        <div style="width:72px;height:72px;border-radius:14px;background:linear-gradient(135deg,#ea580c,#9a3412);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 20px rgba(255,122,0,0.3);">
          <span style="font-size:2rem;">🍊</span>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:1.1rem;margin-bottom:6px;color:#FFF7ED;">${media.title}</div>
          <div style="font-size:0.84rem;color:#D4A373;margin-bottom:14px;">🍃 ${media.genre || 'Audio Cam'}</div>
          <audio id="audio-player" src="${audioUrl}" controls autoplay preload="metadata"
                 style="width:100%;height:44px;" aria-label="${media.title}">
            Trình duyệt không hỗ trợ thẻ audio.
          </audio>
        </div>
      </div>`;
    openNewTab.href = audioUrl;
    openNewTab.style.display = '';
  }
}

function closePlayer() {
  playerOverlay.classList.remove('active');
  document.body.style.overflow = '';
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
