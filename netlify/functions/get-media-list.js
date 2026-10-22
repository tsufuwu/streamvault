/**
 * Netlify Function: get-media-list
 *
 * Scrapes a PUBLIC Google Drive folder page and its nested subfolders
 * to extract file metadata and folder hierarchies.
 *
 * Usage: /.netlify/functions/get-media-list
 */

const FOLDER_ID = '1nbI40Z81OK0WNjmsq_uMDMCcmUSlzhH-';

const VIDEO_EXTS = new Set(['mp4','mkv','avi','mov','webm','flv','m4v','wmv','mpg','mpeg']);
const AUDIO_EXTS = new Set(['mp3','wav','flac','aac','m4a','ogg','opus','wma']);

const CORS = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type'                : 'application/json',
};

// ─── Helpers ────────────────────────────────────────
function getExt(name) { return (name.split('.').pop() || '').toLowerCase(); }

function getType(name) {
  const ext = getExt(name);
  if (VIDEO_EXTS.has(ext)) return 'video';
  if (AUDIO_EXTS.has(ext)) return 'audio';
  return 'video'; // default
}

function cleanTitle(name) {
  return name
    .replace(/\.[^/.]+$/, '')
    .trim();
}

/**
 * Fetch HTML of a Google Drive folder
 */
async function fetchFolderHtml(folderId) {
  try {
    const res = await fetch(`https://drive.google.com/drive/folders/${folderId}`, {
      headers: {
        'User-Agent'     : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept'         : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control'  : 'no-cache',
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.warn(`[get-media-list] Fetch error for folder ${folderId}:`, err.message);
    return null;
  }
}

/**
 * Parse files and child subfolders from Google Drive folder HTML
 */
function parseFolderContents(html, currentFolderId) {
  const files = [];
  const subfolders = [];
  const seen = new Set();

  // Strategy 1: window['_DRIVE_ivd'] (Canonical JSON model)
  const matchIvd = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (matchIvd) {
    try {
      const raw = matchIvd[1];
      const unescaped = raw
        .replace(/\\\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/\\\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
      const parsed = JSON.parse(unescaped);

      function extractEntries(arr) {
        if (!Array.isArray(arr)) return;
        arr.forEach(entry => {
          if (Array.isArray(entry)) {
            if (typeof entry[0] === 'string' && entry[0].length >= 25 && typeof entry[2] === 'string') {
              const id = entry[0];
              const name = entry[2];
              const mime = entry[3] || '';
              if (id !== currentFolderId && !seen.has(id)) {
                seen.add(id);
                if (mime === 'application/vnd.google-apps.folder') {
                  subfolders.push({ id, name });
                } else {
                  files.push({ id, name, type: getType(name) });
                }
              }
            } else {
              extractEntries(entry);
            }
          }
        });
      }
      extractEntries(parsed);
    } catch (e) {
      // Fallback to regex
    }
  }

  // Strategy 2: HTML attributes fallback
  const reTooltip = /data-id="([\w-]{25,44})"[^>]*data-tooltip="([^"]+?)(?:\s+(?:Video|Audio|Tệp|Shared))*"/g;
  let m;
  while ((m = reTooltip.exec(html)) !== null) {
    const [, id, rawName] = m;
    if (id !== currentFolderId && !seen.has(id)) {
      seen.add(id);
      if (/\b(?:Thư mục|Folder)\b/i.test(rawName)) {
        const cleanName = rawName.replace(/\s+(?:Thư mục|Folder|Shared folder)$/i, '').trim();
        subfolders.push({ id, name: cleanName });
      } else {
        files.push({ id, name: rawName, type: getType(rawName) });
      }
    }
  }

  // Strategy 3: Subfolder link matches
  const reFolderLink = /href="\/drive\/folders\/([\w-]{25,44})"[^>]*>([^<]*)</gi;
  while ((m = reFolderLink.exec(html)) !== null) {
    const [, id, label] = m;
    if (id !== currentFolderId && !seen.has(id)) {
      seen.add(id);
      subfolders.push({ id, name: label.trim() || id });
    }
  }

  return { files, subfolders };
}

/**
 * Crawl root folder and all nested subfolders recursively
 */
async function crawlDrive(rootFolderId) {
  const visited = new Set([rootFolderId]);
  const queue = [{ id: rootFolderId, path: [], name: 'Thư mục gốc' }];
  const allMedia = [];
  const allFolders = [];
  let fileCounter = 1;

  // Max 25 folders to guarantee execution finishes within Netlify timeout
  const MAX_FOLDERS = 25;

  while (queue.length > 0 && visited.size <= MAX_FOLDERS) {
    const current = queue.shift();
    const html = await fetchFolderHtml(current.id);
    if (!html) continue;

    const { files, subfolders } = parseFolderContents(html, current.id);

    // Collect files with nested folderPath
    for (const f of files) {
      allMedia.push({
        id         : String(fileCounter++),
        title      : cleanTitle(f.name),
        fileId     : f.id,
        type       : f.type,
        thumbnail  : `https://lh3.googleusercontent.com/u/0/d/${f.id}=w600`,
        duration   : '',
        quality    : 'HD',
        genre      : f.type === 'video' ? 'Video' : 'Audio',
        year       : '',
        description: '',
        folderId   : current.id,
        folderName : current.name,
        folderPath : current.path, // Array of ancestor names: e.g. ["Anime", "Mùa 1"]
      });
    }

    // Enqueue subfolders
    for (const sub of subfolders) {
      if (!visited.has(sub.id)) {
        visited.add(sub.id);
        const subPath = [...current.path, sub.name];
        queue.push({ id: sub.id, path: subPath, name: sub.name });
        allFolders.push({
          id      : sub.id,
          name    : sub.name,
          path    : subPath,
          parentId: current.id,
        });
      }
    }
  }

  return { allMedia, allFolders };
}

// ─── Handler ────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  try {
    const { allMedia, allFolders } = await crawlDrive(FOLDER_ID);

    return {
      statusCode: 200,
      headers   : CORS,
      body      : JSON.stringify({
        ok     : true,
        count  : allMedia.length,
        data   : allMedia,
        folders: allFolders,
      }),
    };

  } catch (err) {
    console.error('[get-media-list]', err.message);
    return {
      statusCode: 500,
      headers   : CORS,
      body      : JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
