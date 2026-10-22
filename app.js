/**
 * app.js — StreamVault Frontend Logic (Dynamic Version)
 * Media list is fetched live from Netlify Function (no auth needed).
 */

// ─── CONFIG ─────────────────────────────────────────
// Netlify function tự quét folder Drive công khai — không cần auth
const MEDIA_LIST_API = '/.netlify/functions/get-media-list';

// ─── State ──────────────────────────────────────────
let state = {
  allMedia:  [],   // fetched from Apps Script API
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

// ─── Toast ───────────────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  const icon = type === 'error'
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  el.innerHTML = `${icon}<span>${msg}</span>`;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 3100);
}

// ─── Fetch Media From Apps Script API ────────────────
async function fetchMediaLibrary() {
  // Show skeleton loading
  mediaGrid.innerHTML = Array(8).fill(0).map(() => `
    <div class="media-card" style="pointer-events:none;">
      <div class="card-thumbnail" style="background:linear-gradient(90deg,#1a1b25 25%,#22243a 50%,#1a1b25 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;"></div>
      <div class="card-info">
        <div style="height:14px;border-radius:4px;background:#1a1b25;margin-bottom:8px;animation:shimmer 1.5s infinite;"></div>
        <div style="height:11px;border-radius:4px;background:#1a1b25;width:60%;animation:shimmer 1.5s infinite;"></div>
      </div>
    </div>`).join('');

  try {
    const res  = await fetch(MEDIA_LIST_API);
    const json = await res.json();

    if (!json.ok) throw new Error(json.error || 'API lỗi');

    state.allMedia = json.data;
    renderGenreTabs();
    updateSidebarCounts();
    renderGrid();
    toast(`Đã tải ${json.count} file media`, 'info');

  } catch (err) {
    mediaGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <h3>Không thể tải danh sách</h3>
        <p>${err.message}</p>
        <button onclick="fetchMediaLibrary()" style="margin-top:12px;padding:8px 16px;background:var(--accent);color:white;border:none;border-radius:8px;cursor:pointer;font-family:inherit;">Thử lại</button>
      </div>`;
    toast('Không thể kết nối API: ' + err.message, 'error');
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
  sectionCount.textContent = `${items.length} mục`;
  mediaGrid.innerHTML = '';

  if (items.length === 0) {
    mediaGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"/></svg>
        <h3>Không tìm thấy kết quả</h3>
        <p>Thử thay đổi bộ lọc hoặc từ khoá</p>
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
    card.style.animationDelay = `${i * 35}ms`;

    const isVideo = media.type === 'video';
    const thumbContent = media.thumbnail
      ? `<img src="${media.thumbnail}" alt="${media.title}" loading="lazy">`
      : isVideo
        ? `<svg class="card-default-icon" width="52" height="52" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>`
        : `<svg class="card-default-icon" width="52" height="52" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;

    card.innerHTML = `
      <div class="card-thumbnail">
        ${thumbContent}
        <span class="card-type-badge badge-${media.type}">${isVideo ? 'Phim' : 'Nhạc'}</span>
        <div class="card-play-overlay">
          <div class="play-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
      <div class="card-info">
        <div class="card-title" title="${media.title}">${media.title}</div>
        <div class="card-meta">
          ${media.duration ? `<span class="card-meta-item"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${media.duration}</span>` : ''}
          ${media.quality  ? `<span class="quality-badge">${media.quality}</span>` : ''}
          ${media.genre    ? `<span class="card-meta-item">${media.genre}</span>` : ''}
        </div>
      </div>`;

    card.addEventListener('click', () => openPlayer(media));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openPlayer(media); });
    mediaGrid.appendChild(card);
  });
}

// ─── Genre Tabs ───────────────────────────────────────
function renderGenreTabs() {
  const genres = [...new Set(state.allMedia.map(m => m.genre).filter(Boolean))].sort();
  genreTabs.innerHTML = `<button class="genre-tag active" data-genre="all" id="genre-all">Tất cả</button>`;
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
async function openPlayer(media) {
  state.currentMedia = media;
  playerTitle.textContent    = media.title;
  playerSubtitle.textContent = [media.genre, media.year, media.duration].filter(Boolean).join(' · ');
  playerBody.innerHTML = `
    <div class="player-loading">
      <div class="spinner"></div>
      <span>Đang lấy đường dẫn stream...</span>
    </div>`;
  openNewTab.style.display = 'none';
  playerOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  try {
    const url = await resolveStreamUrl(media.fileId);

    if (media.type === 'video') {
      playerBody.innerHTML = `
        <video id="video-player" controls autoplay preload="metadata"
               crossorigin="anonymous" playsinline aria-label="${media.title}">
          <source src="${url}">
          Trình duyệt không hỗ trợ HTML5 video.
        </video>`;
    } else {
      playerBody.innerHTML = `
        <div style="padding:24px;background:#0a0b0f;display:flex;align-items:center;gap:20px;">
          <div style="width:80px;height:80px;border-radius:12px;background:linear-gradient(135deg,#1e1b4b,#312e81);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="#a78bfa"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:1rem;margin-bottom:4px;">${media.title}</div>
            <div style="font-size:0.8rem;color:#94a3b8;margin-bottom:12px;">${media.genre || 'Audio'}</div>
            <audio id="audio-player" controls autoplay preload="metadata"
                   style="width:100%;height:40px;" aria-label="${media.title}">
              <source src="${url}">
            </audio>
          </div>
        </div>`;
    }

    openNewTab.href = url;
    openNewTab.style.display = '';
  } catch (err) {
    playerBody.innerHTML = `
      <div class="player-error">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:8px;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <p style="font-weight:600;margin-bottom:4px;">Không thể phát</p>
        <p style="font-size:0.82rem;color:#94a3b8;">${err.message}</p>
      </div>`;
    toast(err.message, 'error');
  }
}

async function resolveStreamUrl(fileId) {
  const res  = await fetch(`/.netlify/functions/get-stream-url?fileId=${encodeURIComponent(fileId)}`);
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error || 'Không lấy được URL stream');
  return data.url;
}

function closePlayer() {
  playerOverlay.classList.remove('active');
  document.body.style.overflow = '';
  ['video-player', 'audio-player'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.pause(); el.src = ''; }
  });
  state.currentMedia = null;
  setTimeout(() => { playerBody.innerHTML = ''; }, 300);
}

// ─── Sidebar Filter ───────────────────────────────────
document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
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

// ─── Close Player ─────────────────────────────────────
document.getElementById('close-player').addEventListener('click', closePlayer);
playerOverlay.addEventListener('click', e => { if (e.target === playerOverlay) closePlayer(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePlayer(); });

// ─── Shimmer animation ────────────────────────────────
const shimmerStyle = document.createElement('style');
shimmerStyle.textContent = `@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
document.head.appendChild(shimmerStyle);

// ─── INIT ────────────────────────────────────────────
fetchMediaLibrary();
