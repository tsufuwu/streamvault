/**
 * app.js — Orangestream Frontend Logic
 * Dynamic, real-time media streaming from Google Drive with fresh citrus theme 🍊
 */

// ─── CONFIG ─────────────────────────────────────────
const MEDIA_LIST_API = '/.netlify/functions/get-media-list';

// ─── State ──────────────────────────────────────────
// ─── State ──────────────────────────────────────────
let state = {
  allMedia:     [],
  allFolders:   [],
  filter:       'all',   // 'all' | 'video' | 'audio'
  currentPath:  [],      // [] means root / all; ['Folder1'] means inside Folder1; ['Folder1', 'Sub2'] means deeper
  search:       '',
  currentMedia: null,
};

// ─── DOM References ──────────────────────────────────
const mediaGrid         = document.getElementById('media-grid');
const sectionCount      = document.getElementById('section-count');
const playerOverlay     = document.getElementById('player-overlay');
const playerTitle       = document.getElementById('player-title');
const playerSubtitle    = document.getElementById('player-subtitle');
const playerBody        = document.getElementById('player-body');
const openNewTab        = document.getElementById('open-new-tab');
const toastContainer    = document.getElementById('toast-container');
const searchInput       = document.getElementById('search-input');
const folderBreadcrumbs = document.getElementById('folder-breadcrumbs');
const folderTabs        = document.getElementById('folder-tabs');
const subfolderWrapper  = document.getElementById('subfolder-tabs-wrapper');
const subfolderTabs     = document.getElementById('subfolder-tabs');

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

    state.allMedia   = json.data || [];
    state.allFolders = json.folders || [];
    renderFolderNavigation();
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
    // Type filter
    const matchType = state.filter === 'all' || m.type === state.filter;

    // Folder path filter (Hỗ trợ đa tầng thư mục con lồng nhau)
    let matchFolder = true;
    if (state.currentPath.length > 0) {
      if (state.currentPath[0] === '__root__') {
        matchFolder = !m.folderPath || m.folderPath.length === 0;
      } else {
        const mPath = m.folderPath || [];
        if (mPath.length < state.currentPath.length) {
          matchFolder = false;
        } else {
          for (let i = 0; i < state.currentPath.length; i++) {
            if (mPath[i] !== state.currentPath[i]) {
              matchFolder = false;
              break;
            }
          }
        }
      }
    }

    // Search query
    const q = state.search.trim().toLowerCase();
    const matchSearch = !q ||
      m.title.toLowerCase().includes(q) ||
      (m.folderName || '').toLowerCase().includes(q) ||
      (m.folderPath || []).some(p => p.toLowerCase().includes(q));

    return matchType && matchFolder && matchSearch;
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
        <h3>Không tìm thấy file nào trong thư mục này</h3>
        <p>Thử chọn tab thư mục khác hoặc xóa từ khoá tìm kiếm</p>
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
        : `<svg class="card-default-icon" width="56" height="56" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="#FF7A00"/><circle cx="12" cy="12" r="7.5" fill="#FF9500"/><circle cx="12" cy="12" r="2.2" fill="#FFF"/></svg>`;

    const folderBadge = media.folderName && media.folderName !== 'Thư mục gốc'
      ? `<span class="card-meta-item" style="color:var(--text-muted);" title="Đường dẫn: ${(media.folderPath || [media.folderName]).join(' / ')}"><span style="opacity:0.75;">📁</span> ${media.folderName}</span>`
      : '';

    const typeMeta = isVideo
      ? `<span class="card-meta-item meta-video">🎬 Video</span>`
      : `<span class="card-meta-item meta-audio">
           <svg class="orange-no-leaf-icon" width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FF7A00" stroke="#FFAE34" stroke-width="1.5"/><circle cx="12" cy="12" r="7.5" fill="#FF9000"/><circle cx="12" cy="12" r="2.2" fill="#FFF" opacity="0.95"/></svg>
           Audio
         </span>`;

    card.innerHTML = `
      <div class="card-thumbnail">
        ${thumbContent}
        <span class="card-type-badge badge-${media.type}">${isVideo ? 'Video' : 'Audio'}</span>
        <div class="card-play-overlay">
          <div class="play-circle" title="Xem ngay">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
      <div class="card-info">
        <div class="card-title" title="${media.title}">${media.title}</div>
        <div class="card-meta">
          ${media.quality ? `<span class="quality-badge">${media.quality}</span>` : ''}
          ${typeMeta}
          ${folderBadge}
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

// ─── Folder Navigation & Tabs (Hỗ trợ đa tầng vô hạn) ──
function setFolderPath(newPath) {
  state.currentPath = newPath;
  renderFolderNavigation();
  renderGrid();
}

function renderFolderNavigation() {
  renderBreadcrumbs();
  renderPrimaryFolderTabs();
  renderSubfolderTabs();
}

function renderBreadcrumbs() {
  if (!folderBreadcrumbs) return;
  const path = state.currentPath;

  const crumbs = [];
  const isRootActive = path.length === 0;
  crumbs.push(`
    <button class="breadcrumb-crumb ${isRootActive ? 'active' : ''}" data-crumb-idx="-1" title="Xem tất cả thư mục">
      <span>🏠 Vườn Cam (Tất cả)</span>
    </button>
  `);

  if (path.length === 1 && path[0] === '__root__') {
    crumbs.push(`<span class="breadcrumb-sep">/</span>`);
    crumbs.push(`<span class="breadcrumb-crumb active"><span>📄 Chưa phân loại</span></span>`);
  } else {
    let accumulated = [];
    path.forEach((folderName, idx) => {
      accumulated.push(folderName);
      const isLast = idx === path.length - 1;
      crumbs.push(`<span class="breadcrumb-sep">/</span>`);
      if (isLast) {
        crumbs.push(`
          <span class="breadcrumb-crumb active">
            <span>📁 ${folderName}</span>
          </span>
        `);
      } else {
        const targetPath = [...accumulated];
        crumbs.push(`
          <button class="breadcrumb-crumb" data-crumb-path="${encodeURIComponent(JSON.stringify(targetPath))}">
            <span>📁 ${folderName}</span>
          </button>
        `);
      }
    });
  }

  folderBreadcrumbs.innerHTML = crumbs.join('');

  folderBreadcrumbs.querySelectorAll('button[data-crumb-idx="-1"]').forEach(btn => {
    btn.addEventListener('click', () => setFolderPath([]));
  });

  folderBreadcrumbs.querySelectorAll('button[data-crumb-path]').forEach(btn => {
    btn.addEventListener('click', () => {
      try {
        const targetPath = JSON.parse(decodeURIComponent(btn.dataset.crumbPath));
        setFolderPath(targetPath);
      } catch(e) {}
    });
  });
}

function renderPrimaryFolderTabs() {
  if (!folderTabs) return;

  const topFoldersMap = new Map();
  let rootFilesCount = 0;

  state.allMedia.forEach(m => {
    const p = m.folderPath || [];
    if (p.length === 0) {
      rootFilesCount++;
    } else {
      const topName = p[0];
      topFoldersMap.set(topName, (topFoldersMap.get(topName) || 0) + 1);
    }
  });

  // Include any discovered empty top folders from Google Drive
  state.allFolders.forEach(f => {
    const p = f.path || [];
    if (p.length === 1 && !topFoldersMap.has(p[0])) {
      topFoldersMap.set(p[0], 0);
    }
  });

  const tabs = [];

  // "Tất cả" tab
  const isAllActive = state.currentPath.length === 0;
  tabs.push(`
    <button class="folder-tab ${isAllActive ? 'active' : ''}" data-folder-action="all">
      <span>🍊 Tất cả</span>
      <span class="folder-tab-badge">${state.allMedia.length}</span>
    </button>
  `);

  // Uncategorized tab (files sitting directly at root folder when subfolders exist)
  if (rootFilesCount > 0 && topFoldersMap.size > 0) {
    const isRootActive = state.currentPath.length === 1 && state.currentPath[0] === '__root__';
    tabs.push(`
      <button class="folder-tab ${isRootActive ? 'active' : ''}" data-folder-action="root">
        <span>📄 Chưa phân loại</span>
        <span class="folder-tab-badge">${rootFilesCount}</span>
      </button>
    `);
  }

  // Top level folder tabs
  Array.from(topFoldersMap.keys()).sort().forEach(folderName => {
    const count = topFoldersMap.get(folderName) || 0;
    const isActive = state.currentPath.length >= 1 && state.currentPath[0] === folderName;
    tabs.push(`
      <button class="folder-tab ${isActive ? 'active' : ''}" data-top-folder="${encodeURIComponent(folderName)}">
        <span>📁 ${folderName}</span>
        <span class="folder-tab-badge">${count}</span>
      </button>
    `);
  });

  folderTabs.innerHTML = tabs.join('');

  folderTabs.querySelectorAll('button[data-folder-action="all"]').forEach(btn => {
    btn.addEventListener('click', () => setFolderPath([]));
  });

  folderTabs.querySelectorAll('button[data-folder-action="root"]').forEach(btn => {
    btn.addEventListener('click', () => setFolderPath(['__root__']));
  });

  folderTabs.querySelectorAll('button[data-top-folder]').forEach(btn => {
    btn.addEventListener('click', () => {
      const folderName = decodeURIComponent(btn.dataset.topFolder);
      setFolderPath([folderName]);
    });
  });
}

function renderSubfolderTabs() {
  if (!subfolderWrapper || !subfolderTabs) return;

  // Don't show subfolders if at root level or '__root__'
  if (state.currentPath.length === 0 || state.currentPath[0] === '__root__') {
    subfolderWrapper.style.display = 'none';
    return;
  }

  const currentPath  = state.currentPath;
  const currentDepth = currentPath.length;

  // Find all direct child subfolders at depth: currentDepth
  const childFoldersMap = new Map();

  state.allMedia.forEach(m => {
    const p = m.folderPath || [];
    if (p.length > currentDepth) {
      let match = true;
      for (let i = 0; i < currentDepth; i++) {
        if (p[i] !== currentPath[i]) { match = false; break; }
      }
      if (match) {
        const childName = p[currentDepth];
        childFoldersMap.set(childName, (childFoldersMap.get(childName) || 0) + 1);
      }
    }
  });

  // Also include discovered empty child folders
  state.allFolders.forEach(f => {
    const p = f.path || [];
    if (p.length === currentDepth + 1) {
      let match = true;
      for (let i = 0; i < currentDepth; i++) {
        if (p[i] !== currentPath[i]) { match = false; break; }
      }
      if (match && !childFoldersMap.has(p[currentDepth])) {
        childFoldersMap.set(p[currentDepth], 0);
      }
    }
  });

  if (childFoldersMap.size === 0) {
    subfolderWrapper.style.display = 'none';
    return;
  }

  subfolderWrapper.style.display = 'flex';
  const lastFolder = currentPath[currentPath.length - 1];

  const subTabs = [];
  subTabs.push(`
    <button class="subfolder-tab active" data-subfolder-action="current">
      <span>📂 Tất cả trong ${lastFolder}</span>
    </button>
  `);

  Array.from(childFoldersMap.keys()).sort().forEach(childName => {
    const count = childFoldersMap.get(childName) || 0;
    subTabs.push(`
      <button class="subfolder-tab" data-child-name="${encodeURIComponent(childName)}">
        <span>📂 ${childName}</span>
        <span class="folder-tab-badge">${count}</span>
      </button>
    `);
  });

  subfolderTabs.innerHTML = subTabs.join('');

  subfolderTabs.querySelectorAll('button[data-subfolder-action="current"]').forEach(btn => {
    btn.addEventListener('click', () => {
      renderSubfolderTabs();
      renderGrid();
    });
  });

  subfolderTabs.querySelectorAll('button[data-child-name]').forEach(btn => {
    btn.addEventListener('click', () => {
      const childName = decodeURIComponent(btn.dataset.childName);
      setFolderPath([...currentPath, childName]);
    });
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
  const streamUrl = `/stream-media/${media.fileId}`;
  const previewUrl = `https://drive.google.com/file/d/${media.fileId}/preview`;
  const items = getFilteredMedia();
  const currentIndex = items.findIndex(m => m.id === media.id);
  const prevMedia = currentIndex > 0 ? items[currentIndex - 1] : null;
  const nextMedia = currentIndex < items.length - 1 ? items[currentIndex + 1] : null;

  playerBody.innerHTML = `
    <div class="custom-orange-player" id="orange-player-box">
      <video id="orange-video-el" preload="auto" playsinline src="${streamUrl}">
        Trình duyệt không hỗ trợ thẻ video HTML5.
      </video>

      <!-- Center Big Play Button (Orange Slice) -->
      <button class="big-play-btn" id="big-play-btn" title="Phát video (Space)">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
      </button>

      <!-- Double-Click Quick Seek Ripple Overlay -->
      <div class="seek-ripple-overlay">
        <div class="seek-ripple-side" id="ripple-left">
          <div class="seek-ripple-badge">⏪ 10s</div>
        </div>
        <div class="seek-ripple-side" id="ripple-right">
          <div class="seek-ripple-badge">10s ⏩</div>
        </div>
      </div>

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
            <!-- Prev Video -->
            <button class="ctrl-btn" id="ctrl-prev" title="${prevMedia ? 'Tập trước: ' + prevMedia.title : 'Không có tập trước'}" ${!prevMedia ? 'style="opacity:0.35;pointer-events:none;"' : ''}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>

            <!-- Play / Pause -->
            <button class="ctrl-btn" id="ctrl-play-pause" title="Phát / Dừng (Space)">
              <svg id="icon-play" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <svg id="icon-pause" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>

            <!-- Next Video -->
            <button class="ctrl-btn" id="ctrl-next" title="${nextMedia ? 'Tập tiếp theo: ' + nextMedia.title : 'Hết danh sách'}" ${!nextMedia ? 'style="opacity:0.35;pointer-events:none;"' : ''}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>

            <!-- Rewind 10s -->
            <button class="ctrl-btn" id="ctrl-rewind" title="Tua lùi 10s (←)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            </button>

            <!-- Forward 10s -->
            <button class="ctrl-btn" id="ctrl-forward" title="Tua tới 10s (→)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>

            <!-- Time Display -->
            <div class="time-display">
              <span id="time-current">0:00</span>
              <span class="time-sep">/</span>
              <span id="time-duration">0:00</span>
            </div>
          </div>

          <div class="controls-right">
            <!-- Volume -->
            <div class="volume-container">
              <button class="ctrl-btn" id="ctrl-volume" title="Âm lượng (M)">
                <svg id="icon-vol" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              </button>
              <input type="range" class="volume-slider" id="ctrl-vol-slider" min="0" max="1" step="0.05" value="1">
            </div>

            <!-- Loop Toggle -->
            <button class="ctrl-btn" id="ctrl-loop" title="Bật/Tắt Lặp lại video (R)">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            </button>

            <!-- Speed Popover Wrapper -->
            <div class="ctrl-popover-wrapper">
              <button class="ctrl-btn speed-btn" id="ctrl-speed" title="Chọn tốc độ phát">1.0x</button>
              <div class="speed-popover" id="speed-popover">
                <div class="popover-header">
                  <span>⚡ Tốc độ phát</span>
                </div>
                <button class="speed-opt" data-speed="0.5">0.5x</button>
                <button class="speed-opt" data-speed="0.75">0.75x</button>
                <button class="speed-opt active" data-speed="1.0">1.0x (Chuẩn)</button>
                <button class="speed-opt" data-speed="1.25">1.25x</button>
                <button class="speed-opt" data-speed="1.5">1.5x</button>
                <button class="speed-opt" data-speed="2.0">2.0x</button>
              </div>
            </div>

            <!-- Resolution Quality Popover Wrapper -->
            <div class="ctrl-popover-wrapper">
              <button class="ctrl-btn quality-btn" id="ctrl-quality" title="Chỉnh độ phân giải (Q)">
                <span id="ctrl-quality-label">1080p</span>
              </button>
              <div class="quality-popover" id="quality-popover">
                <div class="popover-header">
                  <span>⚙️ Độ Phân Giải</span>
                  <span style="font-size:0.68rem;opacity:0.8;">Chất lượng</span>
                </div>
                <button class="quality-opt active" data-res="auto">
                  <span>Tự động (Auto)</span>
                  <span class="res-sub" id="auto-res-label">1080p</span>
                </button>
                <button class="quality-opt" data-res="1080p">
                  <span>1080p (Full HD)</span>
                  <span class="quality-tag-pill hd">Nét cao</span>
                </button>
                <button class="quality-opt" data-res="720p">
                  <span>720p (HD)</span>
                  <span class="quality-tag-pill">Mượt</span>
                </button>
                <button class="quality-opt" data-res="480p">
                  <span>480p (Tiêu chuẩn)</span>
                  <span class="quality-tag-pill">Ổn định</span>
                </button>
                <button class="quality-opt" data-res="360p">
                  <span>360p (Tiết kiệm)</span>
                  <span class="quality-tag-pill">Tiết kiệm data</span>
                </button>
                <div class="quality-popover-note">
                  💡 Chọn chất lượng phù hợp với tốc độ mạng của bạn 🍊
                </div>
              </div>
            </div>

            <!-- Picture in Picture (PiP) -->
            <button class="ctrl-btn" id="ctrl-pip" title="Thu nhỏ xem nổi (PiP - P)">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><rect x="12" y="9" width="8" height="6" rx="1" fill="currentColor"/></svg>
            </button>

            <!-- Theater / Cinema Mode -->
            <button class="ctrl-btn" id="ctrl-theater" title="Chế độ Rạp phim (T)">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/></svg>
            </button>

            <!-- Download Video Button -->
            <a class="ctrl-btn" id="ctrl-download" href="${streamUrl}" download="${media.title}.mp4" title="Tải video về máy">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </a>

            <!-- Fullscreen -->
            <button class="ctrl-btn" id="ctrl-fullscreen" title="Toàn màn hình (F)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>

            <!-- Fallback Drive Player -->
            <button class="ctrl-btn fallback-toggle-btn" id="ctrl-switch-player" title="Đổi sang Google Player">
              <span>🔄 Drive Player</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const videoBox       = document.getElementById('orange-player-box');
  const video          = document.getElementById('orange-video-el');
  const bigPlayBtn     = document.getElementById('big-play-btn');
  const playPauseBtn   = document.getElementById('ctrl-play-pause');
  const iconPlay       = document.getElementById('icon-play');
  const iconPause      = document.getElementById('icon-pause');
  const seekbar        = document.getElementById('orange-seekbar');
  const seekProgress   = document.getElementById('seek-progress');
  const seekBuffered   = document.getElementById('seek-buffered');
  const orangeThumb    = document.getElementById('orange-thumb');
  const seekTooltip    = document.getElementById('seek-tooltip');
  const timeCurrent    = document.getElementById('time-current');
  const timeDuration   = document.getElementById('time-duration');
  const volBtn         = document.getElementById('ctrl-volume');
  const volSlider      = document.getElementById('ctrl-vol-slider');
  const speedBtn       = document.getElementById('ctrl-speed');
  const speedPopover   = document.getElementById('speed-popover');
  const qualityBtn     = document.getElementById('ctrl-quality');
  const qualityLabel   = document.getElementById('ctrl-quality-label');
  const qualityPopover = document.getElementById('quality-popover');
  const autoResLabel   = document.getElementById('auto-res-label');
  const headerResTag   = document.getElementById('player-res-tag');
  const fsBtn          = document.getElementById('ctrl-fullscreen');
  const rewindBtn      = document.getElementById('ctrl-rewind');
  const forwardBtn     = document.getElementById('ctrl-forward');
  const prevBtn        = document.getElementById('ctrl-prev');
  const nextBtn        = document.getElementById('ctrl-next');
  const loopBtn        = document.getElementById('ctrl-loop');
  const pipBtn         = document.getElementById('ctrl-pip');
  const theaterBtn     = document.getElementById('ctrl-theater');
  const switchBtn      = document.getElementById('ctrl-switch-player');
  const rippleLeft     = document.getElementById('ripple-left');
  const rippleRight    = document.getElementById('ripple-right');
  const playerModal    = document.querySelector('.player-modal');

  // Resume Playback from LocalStorage
  const storageKey = `orangestream_pos_${media.fileId}`;
  const savedTime = parseFloat(localStorage.getItem(storageKey) || '0');
  let detectedRes = '1080p';

  // Apply Resolution Function
  function applyResolution(resChoice, notify = false) {
    localStorage.setItem('orangestream_resolution', resChoice);

    qualityPopover.querySelectorAll('.quality-opt').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.res === resChoice);
    });

    let displayLabel = '1080p';
    let filterStyle = '';

    if (resChoice === 'auto') {
      displayLabel = detectedRes || '1080p';
      filterStyle = '';
      qualityLabel.textContent = `Auto (${displayLabel})`;
    } else if (resChoice === '1080p') {
      displayLabel = '1080p';
      filterStyle = '';
      qualityLabel.textContent = '1080p HD';
    } else if (resChoice === '720p') {
      displayLabel = '720p';
      filterStyle = '';
      qualityLabel.textContent = '720p';
    } else if (resChoice === '480p') {
      displayLabel = '480p';
      filterStyle = 'blur(0.35px)';
      qualityLabel.textContent = '480p';
    } else if (resChoice === '360p') {
      displayLabel = '360p';
      filterStyle = 'blur(0.75px)';
      qualityLabel.textContent = '360p';
    }

    video.style.filter = filterStyle;
    if (headerResTag) {
      headerResTag.textContent = `${displayLabel} HD`;
      headerResTag.style.display = 'inline-flex';
    }

    if (notify) {
      toast(`Đã chuyển độ phân giải sang ${displayLabel} 🍊`, 'info');
    }
  }

  video.addEventListener('loadedmetadata', () => {
    timeDuration.textContent = formatTime(video.duration);
    if (savedTime > 8 && savedTime < video.duration - 10) {
      video.currentTime = savedTime;
      toast(`Đã tiếp tục phát từ ${formatTime(savedTime)} 🍊`, 'info');
    }

    // Detect native video resolution
    const h = video.videoHeight;
    if (h >= 2160) detectedRes = '4K';
    else if (h >= 1440) detectedRes = '2K';
    else if (h >= 1080) detectedRes = '1080p';
    else if (h >= 720) detectedRes = '720p';
    else if (h >= 480) detectedRes = '480p';
    else if (h > 0) detectedRes = '360p';

    if (autoResLabel) autoResLabel.textContent = detectedRes;
    applyResolution(localStorage.getItem('orangestream_resolution') || 'auto', false);
  });

  // Play / Pause Toggle
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

  // Time & Rolling Orange Progress Update
  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    seekProgress.style.width = `${pct}%`;
    orangeThumb.style.left = `${pct}%`;
    // 🍊 Trái cam lăn tròn theo tiến trình phát video
    orangeThumb.style.transform = `translate(-50%, -50%) rotate(${pct * 7.2}deg)`;
    timeCurrent.textContent = formatTime(video.currentTime);

    // Save position periodically
    if (Math.floor(video.currentTime) % 3 === 0) {
      localStorage.setItem(storageKey, String(video.currentTime));
    }
  });

  video.addEventListener('progress', () => {
    if (video.buffered.length > 0 && video.duration) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      seekBuffered.style.width = `${(bufferedEnd / video.duration) * 100}%`;
    }
  });

  // Double Click Video Area for Quick Seek (Left -10s, Right +10s)
  let clickTimeout;
  let clickCount = 0;
  videoBox.addEventListener('click', (e) => {
    if (e.target.closest('.citrus-controls') || e.target.closest('.big-play-btn') || e.target.closest('.speed-popover')) return;

    clickCount++;
    if (clickCount === 1) {
      clickTimeout = setTimeout(() => {
        clickCount = 0;
        togglePlay();
      }, 260);
    } else if (clickCount === 2) {
      clearTimeout(clickTimeout);
      clickCount = 0;
      const rect = videoBox.getBoundingClientRect();
      const isRightSide = (e.clientX - rect.left) > (rect.width / 2);

      if (isRightSide) {
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
        rippleRight.classList.add('active');
        setTimeout(() => rippleRight.classList.remove('active'), 500);
      } else {
        video.currentTime = Math.max(0, video.currentTime - 10);
        rippleLeft.classList.add('active');
        setTimeout(() => rippleLeft.classList.remove('active'), 500);
      }
    }
  });

  // Seeking on Orange Seekbar
  let isSeeking = false;
  function seekTo(e) {
    const rect = seekbar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (video.duration) video.currentTime = pos * video.duration;
    const pct = pos * 100;
    seekProgress.style.width = `${pct}%`;
    orangeThumb.style.left = `${pct}%`;
    orangeThumb.style.transform = `translate(-50%, -50%) rotate(${pct * 7.2}deg)`;
  }

  seekbar.addEventListener('mousedown', (e) => { isSeeking = true; seekTo(e); });
  window.addEventListener('mousemove', (e) => { if (isSeeking) seekTo(e); });
  window.addEventListener('mouseup', () => { if (isSeeking) isSeeking = false; });

  seekbar.addEventListener('mousemove', (e) => {
    const rect = seekbar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTooltip.style.left = `${pos * 100}%`;
    seekTooltip.textContent = formatTime(pos * (video.duration || 0));
  });

  // 10s Skip Buttons
  rewindBtn.addEventListener('click', () => {
    video.currentTime = Math.max(0, video.currentTime - 10);
    toast('Tua lùi 10 giây ⏪', 'info');
  });
  forwardBtn.addEventListener('click', () => {
    video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
    toast('Tua tới 10 giây ⏩', 'info');
  });

  // Next / Prev Video Handling
  if (prevBtn && prevMedia) {
    prevBtn.addEventListener('click', () => {
      openPlayer(prevMedia);
      toast(`Đang phát: ${prevMedia.title} 🍊`, 'info');
    });
  }
  if (nextBtn && nextMedia) {
    nextBtn.addEventListener('click', () => {
      openPlayer(nextMedia);
      toast(`Đang phát: ${nextMedia.title} 🍊`, 'info');
    });
  }

  // Autoplay next track on end
  video.addEventListener('ended', () => {
    localStorage.removeItem(storageKey);
    if (!video.loop && nextMedia) {
      toast(`Đang tự động chuyển tiếp: ${nextMedia.title} 🍊`, 'info');
      setTimeout(() => openPlayer(nextMedia), 1200);
    }
  });

  // Loop Toggle
  loopBtn.addEventListener('click', () => {
    video.loop = !video.loop;
    loopBtn.classList.toggle('active', video.loop);
    toast(video.loop ? 'Đã BẬT lặp lại video 🔁' : 'Đã TẮT lặp lại video', 'info');
  });

  // Volume
  volSlider.addEventListener('input', e => {
    video.volume = e.target.value;
    video.muted = (video.volume === 0);
  });
  volBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    volSlider.value = video.muted ? 0 : video.volume;
    toast(video.muted ? 'Đã tắt tiếng 🔇' : 'Đã bật tiếng 🔊', 'info');
  });

  // Speed Popover Menu
  speedBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    qualityPopover.classList.remove('open');
    speedPopover.classList.toggle('open');
  });

  speedPopover.querySelectorAll('.speed-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseFloat(btn.dataset.speed);
      video.playbackRate = speed;
      speedBtn.textContent = `${speed}x`;
      speedPopover.querySelectorAll('.speed-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      speedPopover.classList.remove('open');
      toast(`Tốc độ phát: ${speed}x ⚡`, 'info');
    });
  });

  // Quality Popover Menu
  qualityBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    speedPopover.classList.remove('open');
    qualityPopover.classList.toggle('open');
  });

  qualityPopover.querySelectorAll('.quality-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = btn.dataset.res;
      applyResolution(res, true);
      qualityPopover.classList.remove('open');
    });
  });

  // Close Popovers on Click Outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.speed-popover') && !e.target.closest('#ctrl-speed')) {
      speedPopover.classList.remove('open');
    }
    if (!e.target.closest('.quality-popover') && !e.target.closest('#ctrl-quality')) {
      qualityPopover.classList.remove('open');
    }
  });

  // Picture in Picture (PiP)
  pipBtn.addEventListener('click', async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        pipBtn.classList.remove('active');
      } else {
        await video.requestPictureInPicture();
        pipBtn.classList.add('active');
      }
    } catch (err) {
      toast('Trình duyệt không hỗ trợ PiP', 'error');
    }
  });

  // Theater / Cinema Mode
  theaterBtn.addEventListener('click', () => {
    const isTheater = playerModal.classList.toggle('theater');
    theaterBtn.classList.toggle('active', isTheater);
    toast(isTheater ? 'Bật chế độ Rạp phim 🎬' : 'Thoát chế độ Rạp phim', 'info');
  });

  // Fullscreen
  fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      videoBox.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Auto-hide controls
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

  // Switch to Google Drive iframe fallback player
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
    console.warn('[Orangestream] Video error:', video.error);
    toast('Nếu video chậm hoặc không hỗ trợ, bạn có thể bấm nút "🔄 Drive Player" ở góc dưới 🍊', 'info');
  });

  video.play().catch(() => {
    bigPlayBtn.classList.remove('hidden');
  });
}

// ─── Custom Orange Audio Player ───────────────────────
function initOrangeAudioPlayer(media) {
  const audioUrl = `/stream-media/${media.fileId}`;

  playerBody.innerHTML = `
    <div style="padding:28px 24px;background:#140e08;border-radius:0 0 16px 16px;">
      <div style="display:flex;align-items:center;gap:20px;margin-bottom:20px;">
        <div style="width:70px;height:70px;border-radius:14px;background:linear-gradient(135deg,#ea580c,#9a3412);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 20px rgba(255,122,0,0.3);">
          <svg class="orange-no-leaf-icon" width="40" height="40" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FF7A00" stroke="#FFAE34" stroke-width="1.5"/><circle cx="12" cy="12" r="7.5" fill="#FF9000"/><circle cx="12" cy="12" r="2.2" fill="#FFF" opacity="0.95"/></svg>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:1.15rem;margin-bottom:6px;color:#FFF7ED;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${media.title}</div>
          <div style="font-size:0.84rem;color:#FFAE34;display:flex;align-items:center;gap:6px;">
            <svg class="orange-no-leaf-icon" width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FF7A00" stroke="#FFAE34" stroke-width="1.5"/><circle cx="12" cy="12" r="7.5" fill="#FF9000"/><circle cx="12" cy="12" r="2.2" fill="#FFF" opacity="0.95"/></svg>
            <span>Audio</span>
          </div>
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
  const modal = document.querySelector('.player-modal');
  if (modal) modal.classList.remove('theater');
  state.currentMedia = null;
}

// ─── Shortcuts Modal Toggle ───────────────────────────
const shortcutsModal = document.getElementById('shortcuts-modal');
const btnShortcuts = document.getElementById('btn-show-shortcuts');
const btnCloseShortcuts = document.getElementById('close-shortcuts');

if (btnShortcuts && shortcutsModal) {
  btnShortcuts.addEventListener('click', () => {
    shortcutsModal.classList.add('active');
  });
}
if (btnCloseShortcuts && shortcutsModal) {
  btnCloseShortcuts.addEventListener('click', () => {
    shortcutsModal.classList.remove('active');
  });
}
if (shortcutsModal) {
  shortcutsModal.addEventListener('click', e => {
    if (e.target === shortcutsModal) shortcutsModal.classList.remove('active');
  });
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

// ─── Global Keyboard Shortcuts ────────────────────────
document.addEventListener('keydown', e => {
  // Ignore shortcuts when typing in search input
  if (e.target === searchInput) return;

  // Search shortcut
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
    return;
  }

  // Close modals
  if (e.key === 'Escape') {
    if (shortcutsModal && shortcutsModal.classList.contains('active')) {
      shortcutsModal.classList.remove('active');
      return;
    }
    closePlayer();
    return;
  }

  // Media Player Active Shortcuts
  const video = document.getElementById('orange-video-el');
  const audio = document.getElementById('orange-audio-el');
  const activeMedia = video || audio;
  if (!activeMedia || !playerOverlay.classList.contains('active')) return;

  const key = e.key.toLowerCase();

  // Space or K: Toggle Play/Pause
  if (e.key === ' ' || key === 'k') {
    e.preventDefault();
    if (activeMedia.paused) activeMedia.play().catch(() => {});
    else activeMedia.pause();
  }

  // ArrowLeft or J: Seek -10s
  if (e.key === 'ArrowLeft' || key === 'j') {
    e.preventDefault();
    activeMedia.currentTime = Math.max(0, activeMedia.currentTime - 10);
    toast('Tua lùi 10s ⏪', 'info');
  }

  // ArrowRight or L: Seek +10s
  if (e.key === 'ArrowRight' || key === 'l') {
    e.preventDefault();
    activeMedia.currentTime = Math.min(activeMedia.duration || 0, activeMedia.currentTime + 10);
    toast('Tua tới 10s ⏩', 'info');
  }

  // ArrowUp: Volume +5%
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeMedia.volume = Math.min(1, activeMedia.volume + 0.05);
    activeMedia.muted = false;
    toast(`Âm lượng: ${Math.round(activeMedia.volume * 100)}% 🔊`, 'info');
  }

  // ArrowDown: Volume -5%
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeMedia.volume = Math.max(0, activeMedia.volume - 0.05);
    toast(`Âm lượng: ${Math.round(activeMedia.volume * 100)}% 🔉`, 'info');
  }

  // M: Mute / Unmute
  if (key === 'm') {
    e.preventDefault();
    activeMedia.muted = !activeMedia.muted;
    toast(activeMedia.muted ? 'Đã tắt tiếng 🔇' : 'Đã bật tiếng 🔊', 'info');
  }

  // Q: Toggle Resolution Menu
  if (key === 'q' && video) {
    e.preventDefault();
    const qBtn = document.getElementById('ctrl-quality');
    if (qBtn) qBtn.click();
  }

  // F: Fullscreen
  if (key === 'f' && video) {
    e.preventDefault();
    const box = document.getElementById('orange-player-box');
    if (box) {
      if (!document.fullscreenElement) box.requestFullscreen().catch(() => {});
      else document.exitFullscreen().catch(() => {});
    }
  }

  // T: Theater Mode
  if (key === 't') {
    e.preventDefault();
    const modal = document.querySelector('.player-modal');
    if (modal) {
      const isTheater = modal.classList.toggle('theater');
      toast(isTheater ? 'Bật chế độ Rạp phim 🎬' : 'Thoát chế độ Rạp phim', 'info');
    }
  }

  // P: Picture in Picture
  if (key === 'p' && video) {
    e.preventDefault();
    if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
    else video.requestPictureInPicture().catch(() => {});
  }

  // R: Loop
  if (key === 'r') {
    e.preventDefault();
    activeMedia.loop = !activeMedia.loop;
    const loopBtn = document.getElementById('ctrl-loop');
    if (loopBtn) loopBtn.classList.toggle('active', activeMedia.loop);
    toast(activeMedia.loop ? 'Đã BẬT lặp lại 🔁' : 'Đã TẮT lặp lại', 'info');
  }

  // 0-9: Jump to % of duration
  if (e.key >= '0' && e.key <= '9' && activeMedia.duration) {
    e.preventDefault();
    const pct = parseInt(e.key, 10) * 0.1;
    activeMedia.currentTime = activeMedia.duration * pct;
    toast(`Nhảy tới ${parseInt(e.key, 10) * 10}% ⏱️`, 'info');
  }
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

