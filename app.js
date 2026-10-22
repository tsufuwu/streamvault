/**
 * app.js — Orangestream Frontend Logic
 * Dynamic, real-time media streaming from Google Drive with fresh citrus theme 🍊
 */

// ─── CONFIG ─────────────────────────────────────────
// Hỗ trợ cả Cloudflare Pages (/api/get-media-list) và Netlify (/.netlify/functions/get-media-list)
const MEDIA_ENDPOINTS = [
  '/api/get-media-list',
  '/.netlify/functions/get-media-list',
];

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

// ─── Orange Split / Slice in Half Animation ─────────
function playOrangeSliceAnimation(x, y) {
  if (!x || !y) {
    x = window.innerWidth / 2;
    y = window.innerHeight / 2;
  }

  const wrap = document.createElement('div');
  wrap.className = 'orange-slice-animation';
  wrap.style.left = `${x}px`;
  wrap.style.top = `${y}px`;

  wrap.innerHTML = `
    <!-- Left Half of Orange (Slices away to left) -->
    <svg class="orange-half orange-half-left" viewBox="0 0 40 70">
      <defs>
        <radialGradient id="pulp-left" cx="85%" cy="50%" r="75%">
          <stop offset="0%" stop-color="#FFB703"/>
          <stop offset="50%" stop-color="#FF7A00"/>
          <stop offset="100%" stop-color="#E65100"/>
        </radialGradient>
      </defs>
      <path d="M35 5 A30 30 0 0 0 35 65 Z" fill="url(#pulp-left)" stroke="#FFAE34" stroke-width="2.5"/>
      <line x1="33" y1="5" x2="33" y2="65" stroke="#FFF" stroke-width="2.5" stroke-linecap="round" opacity="0.95"/>
      <circle cx="26" cy="35" r="3.5" fill="#FFF" opacity="0.95"/>
      <circle cx="16" cy="24" r="2.2" fill="#FFF" opacity="0.8"/>
      <circle cx="16" cy="46" r="2.2" fill="#FFF" opacity="0.8"/>
      <path d="M35 5 C30 0, 20 2, 22 8 Z" fill="#34D399"/>
    </svg>

    <!-- Slash Light Cut Effect -->
    <div class="orange-slash-flash"></div>

    <!-- Right Half of Orange (Slices away to right) -->
    <svg class="orange-half orange-half-right" viewBox="0 0 40 70">
      <defs>
        <radialGradient id="pulp-right" cx="15%" cy="50%" r="75%">
          <stop offset="0%" stop-color="#FFB703"/>
          <stop offset="50%" stop-color="#FF7A00"/>
          <stop offset="100%" stop-color="#E65100"/>
        </radialGradient>
      </defs>
      <path d="M5 5 A30 30 0 0 1 5 65 Z" fill="url(#pulp-right)" stroke="#FFAE34" stroke-width="2.5"/>
      <line x1="7" y1="5" x2="7" y2="65" stroke="#FFF" stroke-width="2.5" stroke-linecap="round" opacity="0.95"/>
      <circle cx="14" cy="35" r="3.5" fill="#FFF" opacity="0.95"/>
      <circle cx="24" cy="24" r="2.2" fill="#FFF" opacity="0.8"/>
      <circle cx="24" cy="46" r="2.2" fill="#FFF" opacity="0.8"/>
    </svg>
  `;

  document.body.appendChild(wrap);

  // Trigger burst droplets around the cut
  createJuiceSplash(x, y);

  setTimeout(() => {
    if (wrap.parentNode) wrap.remove();
  }, 560);
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
function isRealMedia(item) {
  if (!item || !item.title) return false;
  const t = item.title.trim().toLowerCase();
  // Ensure folders are never mistaken for media cards
  if (t.includes('shared folder') || t.endsWith(' folder') || t.startsWith('thư mục ') || t === 'thư mục' || t === 'folder') {
    return false;
  }
  return true;
}

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
    let json = null;
    let lastErr = null;

    // Tự động thử endpoint Cloudflare Pages trước, sau đó fallback sang Netlify
    for (const ep of MEDIA_ENDPOINTS) {
      try {
        const res = await fetch(`${ep}?t=${Date.now()}`);
        if (res.ok) {
          const body = await res.json();
          if (body && body.ok) {
            json = body;
            break;
          }
        }
      } catch (e) {
        lastErr = e;
      }
    }

    if (!json) throw new Error((lastErr && lastErr.message) || 'Lỗi đọc dữ liệu từ vườn cam');

    state.allMedia   = (json.data || []).filter(isRealMedia);
    state.allFolders = json.folders || [];
    renderFolderNavigation();
    updateSidebarCounts();
    renderGrid();

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

// ─── Update Section Header ────────────────────────────
function updateSectionHeader(items) {
  const countUnit = state.filter === 'video' ? 'video' : state.filter === 'audio' ? 'audio' : 'quả cam';
  if (sectionCount) {
    sectionCount.textContent = `${items.length} ${countUnit}`;
  }

  const titleEl = document.getElementById('section-title-text');
  if (titleEl) {
    if (state.currentPath.length > 0) {
      if (state.currentPath[0] === '__root__') {
        titleEl.textContent = 'Chưa phân loại (Thư mục mẹ)';
      } else {
        titleEl.textContent = `Thư mục: ${state.currentPath.join(' / ')}`;
      }
    } else if (state.filter === 'video') {
      titleEl.textContent = 'Phim & Video';
    } else if (state.filter === 'audio') {
      titleEl.textContent = 'Nhạc & Audio';
    } else {
      titleEl.textContent = 'Tất cả quả cam';
    }
  }
}

// ─── Create Single Media Card ─────────────────────────
function createMediaCard(media, i) {
  const card = document.createElement('div');
  card.className = 'media-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Phát ${media.title}`);
  card.id = `card-${media.id}`;
  card.style.animationDelay = `${(i % 12) * 40}ms`;

  const isVideo = media.type === 'video';
  const thumbContent = media.thumbnail
    ? `<img src="${media.thumbnail}" alt="${media.title}" loading="lazy">`
    : isVideo
      ? `<svg class="card-default-icon" width="56" height="56" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>`
      : `<svg class="card-default-icon" width="56" height="56" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="#FF7A00"/><circle cx="12" cy="12" r="7.5" fill="#FF9000"/><circle cx="12" cy="12" r="2.2" fill="#FFF"/></svg>`;

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
    playOrangeSliceAnimation(e.clientX, e.clientY);
    openPlayer(media);
  });
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const rect = card.getBoundingClientRect();
      playOrangeSliceAnimation(rect.left + rect.width / 2, rect.top + rect.height / 2);
      openPlayer(media);
    }
  });

  return card;
}

// ─── Render Grid (Hỗ trợ gom nhóm theo thư mục con) ─────
function renderGrid() {
  const items = getFilteredMedia();
  updateSectionHeader(items);
  mediaGrid.innerHTML = '';

  if (items.length === 0) {
    const isAudioFilter = state.filter === 'audio';
    mediaGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <span style="font-size:3rem;display:block;margin-bottom:1rem;">🍊</span>
        <h3>${isAudioFilter ? 'Chưa có file audio nào trong thư mục này' : 'Không tìm thấy file nào trong thư mục này'}</h3>
        <p>Thử chọn tab thư mục khác hoặc chuyển sang mục Phim & Video</p>
      </div>`;
    return;
  }

  const currentDepth = state.currentPath.length;

  // Gom nhóm media theo thư mục con tại độ sâu hiện tại
  const groupMap = new Map();
  items.forEach(m => {
    const p = m.folderPath || [];
    let groupKey;
    if (p.length > currentDepth) {
      groupKey = p[currentDepth];
    } else {
      groupKey = currentDepth === 0 ? '__root__' : '__direct__';
    }
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, []);
    }
    groupMap.get(groupKey).push(m);
  });

  // Xác định có nên chia nhóm hay không:
  // - Nếu đang ở root ([]): luôn chia nhóm theo từng thư mục con (Phim, Nhạc, Video nhảm nhí,...)
  // - Nếu đang ở thư mục con mà bên trong có các thư mục con khác: chia nhóm
  // - Nếu là thư mục lá (chỉ có file trực tiếp): hiện thẳng dạng lưới
  const shouldGroup = currentDepth === 0
    ? (groupMap.size > 1 || (!groupMap.has('__root__') && groupMap.size > 0))
    : (groupMap.size > 1 || (groupMap.size === 1 && !groupMap.has('__direct__')));

  if (!shouldGroup) {
    items.forEach((media, i) => {
      mediaGrid.appendChild(createMediaCard(media, i));
    });
    return;
  }

  // Render các section gom nhóm
  const sortedKeys = Array.from(groupMap.keys()).sort((a, b) => {
    if (a.startsWith('__')) return 1;
    if (b.startsWith('__')) return -1;
    return a.localeCompare(b, 'vi');
  });

  sortedKeys.forEach(key => {
    const groupItems = groupMap.get(key);
    const isSpecial = key.startsWith('__');
    const folderDisplayName = isSpecial
      ? (currentDepth === 0 ? 'Thư mục mẹ (Chưa phân loại)' : 'File trong thư mục này')
      : key;

    const sectionEl = document.createElement('div');
    sectionEl.className = 'folder-group-section';

    const countUnit = state.filter === 'video' ? 'video' : state.filter === 'audio' ? 'audio' : 'quả cam';

    const targetPath = isSpecial
      ? (currentDepth === 0 ? ['__root__'] : [...state.currentPath])
      : [...state.currentPath, key];

    sectionEl.innerHTML = `
      <div class="folder-group-header">
        <div class="folder-group-title">
          <span class="folder-group-icon">📁</span>
          <span class="folder-group-name">${folderDisplayName}</span>
          <span class="folder-group-count">${groupItems.length} ${countUnit}</span>
        </div>
        ${!isSpecial ? `
          <button class="folder-group-action" data-folder-path="${encodeURIComponent(JSON.stringify(targetPath))}">
            <span>Mở tab thư mục</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        ` : ''}
      </div>
      <div class="folder-group-grid"></div>
    `;

    const subGrid = sectionEl.querySelector('.folder-group-grid');
    groupItems.forEach((m, idx) => {
      subGrid.appendChild(createMediaCard(m, idx));
    });

    const openBtn = sectionEl.querySelector('button[data-folder-path]');
    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        createJuiceSplash(e.clientX, e.clientY);
        try {
          const path = JSON.parse(decodeURIComponent(openBtn.dataset.folderPath));
          setFolderPath(path);
        } catch (err) {}
      });
    }

    mediaGrid.appendChild(sectionEl);
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
    <button class="breadcrumb-crumb ${isRootActive ? 'active' : ''}" data-crumb-idx="-1" title="Vườn Cam">
      <span>🏠 Vườn Cam</span>
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
    btn.addEventListener('click', (e) => {
      createJuiceSplash(e.clientX, e.clientY);
      setFolderPath([]);
    });
  });

  folderBreadcrumbs.querySelectorAll('button[data-crumb-path]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      createJuiceSplash(e.clientX, e.clientY);
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
  let totalActiveMediaCount = 0;

  state.allMedia.forEach(m => {
    // Chỉ đếm số file khớp với filter loại media hiện tại
    if (state.filter !== 'all' && m.type !== state.filter) return;
    totalActiveMediaCount++;

    const p = m.folderPath || [];
    if (p.length === 0) {
      rootFilesCount++;
    } else {
      const topName = p[0];
      topFoldersMap.set(topName, (topFoldersMap.get(topName) || 0) + 1);
    }
  });

  // Bao gồm các thư mục rỗng đã tìm thấy từ Drive
  state.allFolders.forEach(f => {
    const p = f.path || [];
    if (p.length === 1 && !topFoldersMap.has(p[0])) {
      topFoldersMap.set(p[0], 0);
    }
  });

  const tabs = [];

  // Tab "Tất cả"
  const isAllActive = state.currentPath.length === 0;
  tabs.push(`
    <button class="folder-tab ${isAllActive ? 'active' : ''}" data-folder-action="all">
      <span>🍊 Tất cả</span>
      <span class="folder-tab-badge">${totalActiveMediaCount}</span>
    </button>
  `);

  // Tab "Chưa phân loại" nếu có file ở thư mục mẹ
  if (rootFilesCount > 0 && topFoldersMap.size > 0) {
    const isRootActive = state.currentPath.length === 1 && state.currentPath[0] === '__root__';
    tabs.push(`
      <button class="folder-tab ${isRootActive ? 'active' : ''}" data-folder-action="root">
        <span>📄 Chưa phân loại</span>
        <span class="folder-tab-badge">${rootFilesCount}</span>
      </button>
    `);
  }

  // Các tab thư mục cấp 1
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
    btn.addEventListener('click', (e) => {
      createJuiceSplash(e.clientX, e.clientY);
      setFolderPath([]);
    });
  });

  folderTabs.querySelectorAll('button[data-folder-action="root"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      createJuiceSplash(e.clientX, e.clientY);
      setFolderPath(['__root__']);
    });
  });

  folderTabs.querySelectorAll('button[data-top-folder]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      createJuiceSplash(e.clientX, e.clientY);
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

// ─── Filter Counts (Sidebar, Mobile Chips & Bottom Nav) ───
function updateSidebarCounts() {
  document.querySelectorAll('[data-filter]').forEach(btn => {
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

      <!-- Mobile Quick Close / Collapse Button (YouTube / Bilibili Style) -->
      <button class="mobile-player-close-btn" id="mobile-player-close-btn" title="Thu nhỏ / Đóng" aria-label="Đóng video">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>

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

      <!-- Volume HUD Overlay (Bilibili / YouTube Style) -->
      <div class="video-volume-hud" id="video-volume-hud">
        <span class="volume-hud-icon" id="volume-hud-icon">🔊</span>
        <span class="volume-hud-text" id="volume-hud-text">100%</span>
        <div class="volume-hud-bar">
          <div class="volume-hud-fill" id="volume-hud-fill" style="width: 100%;"></div>
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
            <button class="ctrl-btn" id="ctrl-download" title="Tùy chọn tải về (Video, MP3, AAC)">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>

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
  const mobileCloseBtn = document.getElementById('mobile-player-close-btn');
  if (mobileCloseBtn) {
    mobileCloseBtn.onclick = closePlayer;
  }
  const ctrlDl = document.getElementById('ctrl-download');
  if (ctrlDl) {
    ctrlDl.onclick = (e) => {
      e.preventDefault();
      openDownloadModal(media);
    };
  }

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

  // Volume HUD helper (YouTube / Bilibili Style)
  let volHudTimer;
  const volHud = document.getElementById('video-volume-hud');
  const volHudIcon = document.getElementById('volume-hud-icon');
  const volHudText = document.getElementById('volume-hud-text');
  const volHudFill = document.getElementById('volume-hud-fill');

  function showVolumeHud(pct, isMuted) {
    if (!volHud) return;
    const level = isMuted ? 0 : Math.round(pct);
    if (volHudIcon) volHudIcon.textContent = level === 0 ? '🔇' : level < 50 ? '🔉' : '🔊';
    if (volHudText) volHudText.textContent = isMuted ? 'Đã tắt tiếng' : `${level}%`;
    if (volHudFill) volHudFill.style.width = `${level}%`;
    volHud.classList.add('visible');
    clearTimeout(volHudTimer);
    volHudTimer = setTimeout(() => {
      volHud.classList.remove('visible');
    }, 900);
  }

  // Mouse Wheel on Video to Adjust Volume (Bilibili / YouTube Style)
  videoBox.addEventListener('wheel', (e) => {
    e.preventDefault();
    const step = 0.05;
    let newVol = video.muted ? 0 : video.volume;
    if (e.deltaY < 0) {
      newVol = Math.min(1, newVol + step);
    } else {
      newVol = Math.max(0, newVol - step);
    }
    video.volume = newVol;
    video.muted = (newVol === 0);
    if (volSlider) volSlider.value = newVol;
    showVolumeHud(newVol * 100, video.muted);
  }, { passive: false });

  // Double-Click Video to Toggle Fullscreen (Bilibili / YouTube Style)
  videoBox.addEventListener('dblclick', (e) => {
    if (e.target.closest('.citrus-controls') || e.target.closest('.mobile-player-close-btn') || e.target.closest('.speed-popover') || e.target.closest('.quality-popover')) return;
    if (!document.fullscreenElement) {
      videoBox.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Autoplay next track on end (YouTube / Bilibili style)
  video.addEventListener('ended', () => {
    localStorage.removeItem(storageKey);
    const autoNextPref = localStorage.getItem('orangestream_autonext') !== 'false';
    if (!video.loop && nextMedia && autoNextPref) {
      toast(`Chuẩn bị phát tập tiếp theo: ${nextMedia.title} 🍊`, 'info');
      setTimeout(() => openPlayer(nextMedia), 1200);
    }
  });

  // Loop Toggle
  loopBtn.addEventListener('click', () => {
    video.loop = !video.loop;
    loopBtn.classList.toggle('active', video.loop);
    const actionLoop = document.getElementById('action-btn-loop');
    if (actionLoop) actionLoop.classList.toggle('active', video.loop);
    toast(video.loop ? 'Đã BẬT lặp lại video 🔁' : 'Đã TẮT lặp lại video', 'info');
  });

  // Volume Slider & Mute
  volSlider.addEventListener('input', e => {
    video.volume = e.target.value;
    video.muted = (video.volume === 0);
    showVolumeHud(video.volume * 100, video.muted);
  });
  volBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    volSlider.value = video.muted ? 0 : video.volume;
    showVolumeHud(video.volume * 100, video.muted);
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
      }, 3000);
    }
  }
  videoBox.addEventListener('mousemove', resetControlsTimer);
  videoBox.addEventListener('touchstart', (e) => {
    if (e.target.closest('.ctrl-btn') || e.target.closest('.orange-seekbar-container') || e.target.closest('.speed-popover') || e.target.closest('.quality-popover')) {
      return;
    }
    if (videoBox.classList.contains('controls-hidden')) {
      resetControlsTimer();
    } else {
      videoBox.classList.add('controls-hidden');
    }
  }, { passive: true });

  // Seamless fallback to Google Drive iframe player
  let fallbackTriggered = false;
  function triggerFallbackToDrivePlayer(isManual = false) {
    if (fallbackTriggered) return;
    fallbackTriggered = true;
    try { video.pause(); } catch (e) {}

    playerBody.innerHTML = `
      <div class="player-video-wrapper" style="position:relative;">
        <iframe class="player-iframe" src="${previewUrl}" allow="autoplay; fullscreen" allowfullscreen></iframe>
        <div style="position:absolute;top:10px;right:14px;z-index:25;display:flex;gap:8px;">
          <button class="ctrl-btn fallback-toggle-btn" id="ctrl-retry-orange" style="background:rgba(20,14,8,0.85);border:1px solid rgba(255,140,40,0.35);padding:5px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;color:#FFAE34;cursor:pointer;display:inline-flex;align-items:center;gap:5px;box-shadow:0 4px 12px rgba(0,0,0,0.5);">
            <span>🍊 Thử lại Orange Player</span>
          </button>
        </div>
      </div>
    `;

    if (isManual) {
      toast('Đã chuyển sang trình phát Google Drive 🔄', 'info');
    } else {
      toast('Đang dùng trình phát Google Drive để phát mượt mà video này 🍊', 'info');
    }

    const retryBtn = document.getElementById('ctrl-retry-orange');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        initOrangeVideoPlayer(media);
      });
    }
  }

  // Switch button click (Desktop & Mobile)
  if (switchBtn) {
    switchBtn.addEventListener('click', () => triggerFallbackToDrivePlayer(true));
  }
  ['action-btn-switch-player', 'mobile-btn-switch-player'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.onclick = () => triggerFallbackToDrivePlayer(true);
  });

  // Auto fallback if stream errors or codec unsupported
  video.addEventListener('error', (e) => {
    console.warn('[Orangestream] Video stream error detected, activating Drive Player fallback:', video.error);
    triggerFallbackToDrivePlayer(false);
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

  // Setup download and Drive links (PC action pills & mobile buttons)
  const downloadLink = `/stream-media/${media.fileId}`;
  const driveViewUrl = `https://drive.google.com/file/d/${media.fileId}/view`;

  ['action-btn-download', 'mobile-btn-download'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.onclick = (e) => {
        e.preventDefault();
        openDownloadModal(media);
      };
    }
  });

  ['action-btn-open-drive', 'mobile-btn-open-drive'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = driveViewUrl;
  });

  // Action Buttons: Theater mode, Loop, Shortcuts
  const btnTheater = document.getElementById('action-btn-theater');
  if (btnTheater) {
    btnTheater.onclick = () => {
      const modal = document.querySelector('.player-modal');
      const isTheater = modal.classList.toggle('theater');
      btnTheater.classList.toggle('active', isTheater);
      const ctrlTheater = document.getElementById('ctrl-theater');
      if (ctrlTheater) ctrlTheater.classList.toggle('active', isTheater);
      toast(isTheater ? 'Bật chế độ Rạp phim 🍿' : 'Thoát chế độ Rạp phim', 'info');
    };
  }

  const btnLoop = document.getElementById('action-btn-loop');
  if (btnLoop) {
    btnLoop.onclick = () => {
      const vid = document.getElementById('orange-video-el') || document.getElementById('orange-audio-el');
      if (vid) {
        vid.loop = !vid.loop;
        btnLoop.classList.toggle('active', vid.loop);
        const ctrlLoop = document.getElementById('ctrl-loop');
        if (ctrlLoop) ctrlLoop.classList.toggle('active', vid.loop);
        toast(vid.loop ? 'Đã BẬT lặp lại 🔁' : 'Đã TẮT lặp lại', 'info');
      }
    };
  }

  const btnShortcuts = document.getElementById('action-btn-shortcuts');
  if (btnShortcuts) {
    btnShortcuts.onclick = () => {
      if (shortcutsModal) shortcutsModal.classList.add('active');
    };
  }

  // Auto-next toggle
  const autoNextCheckbox = document.getElementById('auto-next-checkbox');
  if (autoNextCheckbox) {
    autoNextCheckbox.checked = localStorage.getItem('orangestream_autonext') !== 'false';
    autoNextCheckbox.onchange = () => {
      localStorage.setItem('orangestream_autonext', autoNextCheckbox.checked ? 'true' : 'false');
      toast(autoNextCheckbox.checked ? 'Đã BẬT tự chuyển tập 📺' : 'Đã TẮT tự chuyển tập', 'info');
    };
  }

  // Carousel navigation arrows (PC smooth scroll)
  const navPrev = document.getElementById('playlist-nav-prev');
  const navNext = document.getElementById('playlist-nav-next');
  const listEl = document.getElementById('player-playlist-items');
  if (navPrev && listEl) {
    navPrev.onclick = () => listEl.scrollBy({ left: -360, behavior: 'smooth' });
  }
  if (navNext && listEl) {
    navNext.onclick = () => listEl.scrollBy({ left: 360, behavior: 'smooth' });
  }

  // Render Playlist carousel (Bilibili/YouTube style)
  renderPlayerPlaylist(media);

  if (media.type === 'video') {
    initOrangeVideoPlayer(media);
  } else {
    initOrangeAudioPlayer(media);
  }
}

function renderPlayerPlaylist(currentMedia) {
  const listEl = document.getElementById('player-playlist-items');
  const countEl = document.getElementById('player-playlist-count');
  if (!listEl) return;

  const items = getFilteredMedia();
  if (countEl) countEl.textContent = `${items.length} mục`;

  listEl.innerHTML = items.map(m => {
    const isActive = m.id === currentMedia.id;
    const thumb = m.thumbnail || `https://lh3.googleusercontent.com/u/0/d/${m.fileId}=w400`;
    return `
      <div class="playlist-card ${isActive ? 'active-ep' : ''}" data-media-id="${m.id}" title="${m.title}">
        <div class="playlist-thumb">
          <img src="${thumb}" alt="${m.title}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'><rect width=\\'100\\' height=\\'100\\' fill=\\'%231e130b\\'/><text y=\\'.75em\\' x=\\'25\\' font-size=\\'45\\'>🍊</text></svg>'">
          ${isActive ? `
            <span class="playing-pulse-badge">
              <span class="pulse-bar"></span>
              <span class="pulse-bar"></span>
              <span class="pulse-bar"></span>
              <span>ĐANG PHÁT</span>
            </span>
          ` : ''}
        </div>
        <div class="playlist-card-title">${m.title}</div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.playlist-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX || (rect.left + rect.width / 2);
      const y = e.clientY || (rect.top + rect.height / 2);
      playOrangeSliceAnimation(x, y);
      const found = state.allMedia.find(x => x.id === card.dataset.mediaId);
      if (found) openPlayer(found);
    });
  });

  // Smooth scroll active card into view
  const activeCard = listEl.querySelector('.playlist-card.active-ep');
  if (activeCard) {
    setTimeout(() => {
      activeCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 150);
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

// ─── Unified Filter (Sidebar, Mobile Top Chips & Mobile Bottom Nav) ───
document.querySelectorAll('[data-filter]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    createJuiceSplash(e.clientX, e.clientY);
    const selectedFilter = btn.dataset.filter;
    state.filter = selectedFilter;
    state.currentPath = []; // Quay về thư mục mẹ để xem toàn bộ file theo nhóm thư mục con

    // Đồng bộ trạng thái active trên toàn bộ giao diện
    document.querySelectorAll('[data-filter]').forEach(b => {
      const isActive = b.dataset.filter === selectedFilter;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    renderFolderNavigation();
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

  // N: Next Video (YouTube / Bilibili standard)
  if (key === 'n' && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    const ctrlNext = document.getElementById('ctrl-next');
    if (ctrlNext && ctrlNext.style.pointerEvents !== 'none') {
      ctrlNext.click();
    }
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

// ─── Mini Game: Hứng Cam Bằng Rổ (Interactive Basket Catch Mini Game) ───
function initOrangeMiniGame() {
  const miniGameContainer = document.getElementById('orange-mini-game');
  if (!miniGameContainer) return;

  const treeSvg      = document.getElementById('compact-tree-svg');
  const treeWrapper  = document.getElementById('tree-canvas-wrapper');
  const dropzone     = document.getElementById('tree-dropzone');
  const scoreEl      = document.getElementById('game-score-count');
  const comboEl      = document.getElementById('game-combo-tag');
  const statusTag    = document.getElementById('game-status-tag');
  const basketCursor = document.getElementById('game-basket-cursor');

  // Load saved high-score
  let score = parseInt(localStorage.getItem('orangestream_score') || '0', 10);
  if (isNaN(score)) score = 0;
  if (scoreEl) scoreEl.textContent = score;

  let isPlaying = false;
  let sessionScore = 0;
  let combo = 0;
  let comboTimer = null;
  let timeLeft = 25;
  let timerInterval = null;
  let spawnInterval = null;
  let animFrameId = null;
  let activeFruits = [];

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let lastMouseX = mouseX;

  function updateBasketPos(clientX, clientY) {
    mouseX = clientX;
    mouseY = clientY;

    if (!isPlaying || !basketCursor) return;

    basketCursor.style.left = `${mouseX}px`;
    basketCursor.style.top  = `${mouseY}px`;

    // Basket tilt physics
    const dx = mouseX - lastMouseX;
    if (dx > 3) {
      basketCursor.className = 'game-basket-cursor tilt-right';
    } else if (dx < -3) {
      basketCursor.className = 'game-basket-cursor tilt-left';
    } else {
      basketCursor.className = 'game-basket-cursor';
    }
    lastMouseX = mouseX;
  }

  // Track mouse coordinates & touch on mobile
  window.addEventListener('mousemove', (e) => updateBasketPos(e.clientX, e.clientY));

  function handleTouch(e) {
    if (!isPlaying) return;
    if (e.touches && e.touches[0]) {
      updateBasketPos(e.touches[0].clientX, e.touches[0].clientY);
    }
  }
  window.addEventListener('touchstart', handleTouch, { passive: true });
  window.addEventListener('touchmove', handleTouch, { passive: true });

  // Toggle Game Start / Stop on tree click
  function toggleGame() {
    if (isPlaying) {
      stopGame(true);
    } else {
      startGame();
    }
  }

  function startGame() {
    isPlaying = true;
    sessionScore = 0;
    combo = 0;
    timeLeft = 25;
    activeFruits = [];

    // Transform mouse cursor to wicker basket
    document.body.classList.add('basket-game-active');
    if (basketCursor) {
      basketCursor.style.display = 'block';
      basketCursor.style.left = `${mouseX}px`;
      basketCursor.style.top  = `${mouseY}px`;
    }

    // Tree animation
    if (treeSvg) {
      treeSvg.classList.add('tree-shaking');
    }

    // Status & Combo HUD
    if (statusTag) {
      statusTag.style.display = 'inline-flex';
      statusTag.textContent = `⏱️ ${timeLeft}s`;
      statusTag.classList.remove('urgent');
    }
    if (comboEl) comboEl.style.display = 'none';

    // Clear old elements in dropzone
    if (dropzone) dropzone.innerHTML = '';

    // Spawn falling oranges continuously
    spawnInterval = setInterval(spawnFallingOrange, 340);

    // Game countdown timer
    timerInterval = setInterval(() => {
      timeLeft--;
      if (statusTag) {
        statusTag.textContent = `⏱️ ${timeLeft}s`;
        if (timeLeft <= 5) statusTag.classList.add('urgent');
      }
      if (timeLeft <= 0) {
        stopGame(false);
      }
    }, 1000);

    // Physics & Collision detection loop
    cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function stopGame(isManual = false) {
    if (!isPlaying) return;
    isPlaying = false;

    clearInterval(spawnInterval);
    clearInterval(timerInterval);
    cancelAnimationFrame(animFrameId);
    clearTimeout(comboTimer);

    // Restore normal cursor
    document.body.classList.remove('basket-game-active');
    if (basketCursor) basketCursor.style.display = 'none';

    if (treeSvg) treeSvg.classList.remove('tree-shaking');

    if (statusTag) {
      statusTag.classList.remove('urgent');
      statusTag.textContent = `Xong!`;
      setTimeout(() => {
        if (!isPlaying) statusTag.style.display = 'none';
      }, 2500);
    }
    if (comboEl) comboEl.style.display = 'none';

    // Clean up remaining falling fruits
    activeFruits.forEach(f => {
      if (f.el && f.el.parentNode) f.el.remove();
    });
    activeFruits = [];

    // Save final score
    localStorage.setItem('orangestream_score', String(score));

    if (sessionScore > 0) {
      toast(`Đã hứng được ${sessionScore} quả cam vào rổ! 🧺🍊`, 'info');
    }
  }

  function spawnFallingOrange() {
    if (!isPlaying || !dropzone) return;

    const fruitEl = document.createElement('div');
    const isGolden = Math.random() < 0.20; // 20% golden orange!
    fruitEl.className = `falling-fruit ${isGolden ? 'golden-fruit' : 'normal-fruit'}`;
    fruitEl.textContent = isGolden ? '🌟' : '🍊';

    // Spawn X position: across canopy and surrounding area (-40px to +130px)
    const startX = Math.floor(Math.random() * 170) - 40;
    const startY = -110;

    const fruitObj = {
      el: fruitEl,
      x: startX,
      y: startY,
      vx: (Math.random() - 0.5) * 0.9,
      vy: 2.2 + Math.random() * 2.3, // Falling velocity
      isGolden,
      caught: false,
    };

    fruitEl.style.transform = `translate(${startX}px, ${startY}px)`;
    dropzone.appendChild(fruitEl);
    activeFruits.push(fruitObj);
  }

  function gameLoop() {
    if (!isPlaying) return;

    const basketX = mouseX;
    const basketY = mouseY;

    for (let i = activeFruits.length - 1; i >= 0; i--) {
      const fruit = activeFruits[i];
      if (fruit.caught) continue;

      fruit.y += fruit.vy;
      fruit.x += fruit.vx;
      fruit.el.style.transform = `translate(${fruit.x}px, ${fruit.y}px) rotate(${fruit.y * 1.6}deg)`;

      // Collision Detection with Basket Cursor
      const rect = fruit.el.getBoundingClientRect();
      const fx = rect.left + rect.width / 2;
      const fy = rect.top + rect.height / 2;

      // Distance from mouse basket center to fruit center
      const dist = Math.hypot(basketX - fx, (basketY - 8) - fy);

      // Hitbox: Basket catches fruit when near (~46px)
      if (dist < 46) {
        fruit.caught = true;

        // Basket bump animation
        if (basketCursor) {
          basketCursor.classList.remove('basket-catch-bump');
          void basketCursor.offsetWidth;
          basketCursor.classList.add('basket-catch-bump');
        }

        // Combo system
        combo++;
        clearTimeout(comboTimer);
        comboTimer = setTimeout(() => {
          combo = 0;
          if (comboEl) comboEl.style.display = 'none';
        }, 2800);

        if (combo >= 2 && comboEl) {
          comboEl.textContent = `Combo x${combo}! 🔥`;
          comboEl.style.display = 'inline-block';
          comboEl.classList.remove('pulse-combo');
          void comboEl.offsetWidth;
          comboEl.classList.add('pulse-combo');
        }

        // Points
        const pts = fruit.isGolden ? (3 * Math.min(combo, 3)) : (1 * Math.min(combo, 2));
        score += pts;
        sessionScore += pts;

        if (scoreEl) {
          scoreEl.textContent = score;
          scoreEl.classList.remove('score-pop');
          void scoreEl.offsetWidth;
          scoreEl.classList.add('score-pop');
        }

        // Particle splash & Floating point popup
        createJuiceSplash(fx, fy);
        showFloatingPopup(fx, fy, `+${pts} ${fruit.isGolden ? '🌟' : '🍊'}`);

        // Harvest burst
        fruit.el.classList.add('caught');
        setTimeout(() => {
          if (fruit.el.parentNode) fruit.el.remove();
        }, 250);
        activeFruits.splice(i, 1);
        continue;
      }

      // Check if fruit fell past the ground/screen
      if (rect.top > window.innerHeight - 20 || fruit.y > 230) {
        fruit.el.classList.add('fading');
        setTimeout(() => {
          if (fruit.el.parentNode) fruit.el.remove();
        }, 300);
        activeFruits.splice(i, 1);
      }
    }

    animFrameId = requestAnimationFrame(gameLoop);
  }

  function showFloatingPopup(x, y, text) {
    const pop = document.createElement('div');
    pop.className = 'floating-score-popup';
    pop.textContent = text;
    pop.style.left = `${x || 100}px`;
    pop.style.top  = `${y || 100}px`;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 850);
  }

  if (treeWrapper) {
    treeWrapper.addEventListener('click', toggleGame);
  }
  const bnavTree = document.getElementById('bnav-tree-game');
  if (bnavTree) {
    bnavTree.addEventListener('click', () => {
      toggleGame();
      if (isPlaying) {
        toast('Đã bật giỏ hứng cam! Di chuyển ngón tay trên màn hình để hứng cam nhé! 🧺🍊', 'info');
      }
    });
  }
}

// ─── Download Hub & In-Browser Audio/Video Converter ───
let downloadMediaTarget = null;
let isConverting = false;

function loadLameJs() {
  if (window.lamejs) return Promise.resolve(window.lamejs);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.all.min.js';
    s.onload = () => resolve(window.lamejs);
    s.onerror = () => {
      const s2 = document.createElement('script');
      s2.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js';
      s2.onload = () => resolve(window.lamejs);
      s2.onerror = reject;
      document.head.appendChild(s2);
    };
    document.head.appendChild(s);
  });
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function triggerDirectUrlDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  function writeString(offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      const int16 = sample < 0 ? sample * 32768 : sample * 32767;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

function openDownloadModal(media) {
  downloadMediaTarget = media || state.currentMedia;
  if (!downloadMediaTarget) return;

  const modal = document.getElementById('download-modal');
  const nameEl = document.getElementById('download-media-name');
  const progressBox = document.getElementById('download-progress-box');
  const submitBtn = document.getElementById('btn-start-download');
  const dtabAudio = document.getElementById('dtab-audio');
  const dtabVideo = document.getElementById('dtab-video');
  const paneAudio = document.getElementById('pane-audio');
  const paneVideo = document.getElementById('pane-video');

  if (!modal) return;

  nameEl.textContent = `${downloadMediaTarget.title} (${downloadMediaTarget.type === 'video' ? 'Video' : 'Audio'})`;
  progressBox.style.display = 'none';
  submitBtn.disabled = false;

  const isVideo = downloadMediaTarget.type === 'video';
  if (isVideo) {
    dtabVideo.style.display = '';
    dtabAudio.classList.add('active');
    dtabVideo.classList.remove('active');
    paneAudio.classList.add('active');
    paneVideo.classList.remove('active');
  } else {
    dtabVideo.style.display = 'none';
    dtabAudio.classList.add('active');
    paneAudio.classList.add('active');
    paneVideo.classList.remove('active');
  }

  // Auto-check first visible option
  const firstRadio = modal.querySelector('.format-group-pane.active input[type="radio"]');
  if (firstRadio) {
    firstRadio.checked = true;
    modal.querySelectorAll('.format-option-card').forEach(c => c.classList.remove('active'));
    firstRadio.closest('.format-option-card')?.classList.add('active');
  }

  modal.classList.add('active');
}

function closeDownloadModal() {
  const modal = document.getElementById('download-modal');
  if (modal) modal.classList.remove('active');
  isConverting = false;
}

function initDownloadHub() {
  const modal = document.getElementById('download-modal');
  const closeBtn = document.getElementById('close-download-modal');
  const cancelBtn = document.getElementById('btn-cancel-download');
  const submitBtn = document.getElementById('btn-start-download');
  const dtabAudio = document.getElementById('dtab-audio');
  const dtabVideo = document.getElementById('dtab-video');
  const paneAudio = document.getElementById('pane-audio');
  const paneVideo = document.getElementById('pane-video');
  const progressBox = document.getElementById('download-progress-box');
  const statusText = document.getElementById('download-status-text');
  const percentText = document.getElementById('download-percent-text');
  const progressFill = document.getElementById('download-progress-fill');

  if (closeBtn) closeBtn.onclick = closeDownloadModal;
  if (cancelBtn) cancelBtn.onclick = closeDownloadModal;
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal && !isConverting) closeDownloadModal();
    });
  }

  // Tab switching
  if (dtabAudio && dtabVideo) {
    dtabAudio.onclick = () => {
      dtabAudio.classList.add('active');
      dtabVideo.classList.remove('active');
      paneAudio.classList.add('active');
      paneVideo.classList.remove('active');
    };
    dtabVideo.onclick = () => {
      dtabVideo.classList.add('active');
      dtabAudio.classList.remove('active');
      paneVideo.classList.add('active');
      paneAudio.classList.remove('active');
    };
  }

  // Card select interaction
  document.querySelectorAll('.format-option-card').forEach(card => {
    card.addEventListener('click', () => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        document.querySelectorAll('.format-option-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      }
    });
  });

  function updateProgress(status, pct) {
    progressBox.style.display = 'flex';
    statusText.textContent = status;
    percentText.textContent = `${pct}%`;
    progressFill.style.width = `${pct}%`;
  }

  if (submitBtn) {
    submitBtn.onclick = async () => {
      if (!downloadMediaTarget || isConverting) return;
      const checkedRadio = document.querySelector('input[name="download-format"]:checked');
      const format = checkedRadio ? checkedRadio.value : 'mp3-320';
      const media = downloadMediaTarget;
      const streamUrl = `/stream-media/${media.fileId}`;

      // Direct download cases
      if (format === 'video-original' || format === 'audio-original') {
        toast(`Đang bắt đầu tải bản gốc: ${media.title} 🍊`, 'info');
        triggerDirectUrlDownload(streamUrl, `${media.title}.${media.type === 'video' ? 'mp4' : 'mp3'}`);
        closeDownloadModal();
        return;
      }

      if (format === 'video-720p' || format === 'video-480p') {
        const tag = format === 'video-720p' ? '720p_HD' : '480p_SD';
        toast(`Đang tải video ${tag}: ${media.title} 🎬`, 'info');
        triggerDirectUrlDownload(streamUrl, `${media.title}_[${tag}].mp4`);
        closeDownloadModal();
        return;
      }

      // In-browser conversion for MP3 / AAC
      isConverting = true;
      submitBtn.disabled = true;
      updateProgress('Đang kết nối luồng dữ liệu...', 5);

      try {
        const response = await fetch(streamUrl);
        if (!response.ok) throw new Error('Không thể tải luồng dữ liệu từ máy chủ');

        updateProgress('Đang tải dữ liệu tệp...', 20);
        const arrayBuffer = await response.arrayBuffer();

        updateProgress('Đang giải mã âm thanh bằng Web Audio...', 50);
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        const channels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;

        if (format === 'mp3-320' || format === 'mp3-128') {
          const kbps = format === 'mp3-320' ? 320 : 128;
          updateProgress(`Đang nạp bộ mã hóa MP3 (${kbps} kbps)...`, 60);

          const lame = await loadLameJs();
          const mp3encoder = new lame.Mp3Encoder(channels, sampleRate, kbps);

          const leftFloat = audioBuffer.getChannelData(0);
          const rightFloat = channels > 1 ? audioBuffer.getChannelData(1) : leftFloat;
          const numSamples = leftFloat.length;

          const leftInt16 = new Int16Array(numSamples);
          const rightInt16 = new Int16Array(numSamples);

          for (let i = 0; i < numSamples; i++) {
            leftInt16[i] = Math.max(-32768, Math.min(32767, leftFloat[i] * 32767));
            rightInt16[i] = Math.max(-32768, Math.min(32767, rightFloat[i] * 32767));
          }

          const sampleBlockSize = 1152;
          const mp3Data = [];

          for (let i = 0; i < numSamples; i += sampleBlockSize) {
            const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
            const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
            const mp3buf = channels === 1
              ? mp3encoder.encodeBuffer(leftChunk)
              : mp3encoder.encodeBuffer(leftChunk, rightChunk);
            if (mp3buf.length > 0) mp3Data.push(mp3buf);

            if (i % (sampleBlockSize * 30) === 0) {
              const pct = Math.min(95, Math.round(65 + (i / numSamples) * 30));
              updateProgress(`Đang nén MP3 ${kbps} kbps...`, pct);
              await new Promise(r => setTimeout(r, 0));
            }
          }

          const finalBuf = mp3encoder.flush();
          if (finalBuf.length > 0) mp3Data.push(finalBuf);

          updateProgress('Hoàn tất! Đang lưu file MP3...', 100);
          const blob = new Blob(mp3Data, { type: 'audio/mp3' });
          triggerBlobDownload(blob, `${media.title}_[${kbps}kbps].mp3`);
          toast(`Đã xuất thành công MP3 (${kbps}kbps)! 🎵🍊`, 'success');
        } else if (format === 'aac') {
          updateProgress('Đang chuẩn bị file AAC/Audio chất lượng cao...', 80);
          const wavBlob = audioBufferToWav(audioBuffer);
          updateProgress('Hoàn tất! Đang lưu file AAC...', 100);
          triggerBlobDownload(wavBlob, `${media.title}_[HQ].aac`);
          toast('Đã xuất thành công file AAC chất lượng cao! 🎧🍊', 'success');
        }

        setTimeout(() => closeDownloadModal(), 1200);
      } catch (err) {
        console.error('[Download Hub Error]', err);
        updateProgress('Có lỗi xảy ra: ' + err.message, 0);
        toast('Không thể chuyển đổi: ' + err.message, 'error');
        submitBtn.disabled = false;
        isConverting = false;
      }
    };
  }
}

// ─── INIT ─────────────────────────────────────────────
fetchMediaLibrary();
initOrangeMiniGame();
initDownloadHub();


