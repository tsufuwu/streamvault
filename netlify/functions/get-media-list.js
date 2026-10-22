/**
 * Netlify Function: get-media-list
 *
 * Scrapes a PUBLIC Google Drive folder page to extract file metadata.
 * No API key, no auth — works as long as the folder is "Anyone with the link".
 *
 * Usage: /.netlify/functions/get-media-list
 */

const FOLDER_ID   = '1nbI40Z81OK0WNjmsq_uMDMCcmUSlzhH-';
const FOLDER_URL  = `https://drive.google.com/drive/folders/${FOLDER_ID}`;

const VIDEO_EXTS  = new Set(['mp4','mkv','avi','mov','webm','flv','m4v','wmv','mpg','mpeg']);
const AUDIO_EXTS  = new Set(['mp3','wav','flac','aac','m4a','ogg','opus','wma']);

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
  return 'video'; // default to video for media files
}

function cleanTitle(name) {
  return name
    .replace(/\.[^/.]+$/, '')   // remove extension
    .trim();
}

/**
 * Parse file entries from Google Drive folder HTML.
 */
function parseFiles(html) {
  const seen  = new Set();
  const files = [];

  // Strategy 1 — data-id attribute with matching data-tooltip (most accurate on Drive table/grid)
  const reTooltip = /data-id="([\w-]{25,44})"[^>]*data-tooltip="([^"]+?)(?:\s+(?:Video|Audio|Tệp|Shared))*"/g;
  let m;
  while ((m = reTooltip.exec(html)) !== null) {
    const [, id, rawName] = m;
    if (id === FOLDER_ID || seen.has(id)) continue;
    seen.add(id);
    const type = getType(rawName);
    files.push({ id, name: rawName, type });
  }

  // Strategy 2 — data-id with enclosed strong title tag
  const reStrong = /data-id="([\w-]{25,44})"[\s\S]*?<strong class="DNoYtb">([^<]+)<\/strong>/g;
  while ((m = reStrong.exec(html)) !== null) {
    const [, id, rawName] = m;
    if (id === FOLDER_ID || seen.has(id)) continue;
    seen.add(id);
    const type = getType(rawName);
    files.push({ id, name: rawName, type });
  }

  // Strategy 3 — AF_initDataCallback nested data arrays
  const reAF = /\["([\w-]{25,44})",\s*(?:null|""),\s*"([^"\\]+\.[a-z0-9]{2,5})"/gi;
  while ((m = reAF.exec(html)) !== null) {
    const [, id, rawName] = m;
    if (id === FOLDER_ID || seen.has(id)) continue;
    seen.add(id);
    const type = getType(rawName);
    files.push({ id, name: rawName, type });
  }

  // Strategy 4 — Fallback to any href="/file/d/FILE_ID"
  const reLink = /href="\/file\/d\/([\w-]{25,44})(?:\/|\?)([^"]*)"[^>]*>([^<]*)</gi;
  while ((m = reLink.exec(html)) !== null) {
    const [, id, , label] = m;
    if (id === FOLDER_ID || seen.has(id)) continue;
    const rawName = label.trim() || id;
    seen.add(id);
    files.push({ id, name: rawName, type: getType(rawName) });
  }

  return files;
}

// ─── Handler ────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  try {
    const res = await fetch(FOLDER_URL, {
      headers: {
        'User-Agent'     : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept'         : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control'  : 'no-cache',
      },
    });

    if (!res.ok) {
      throw new Error(`Drive responded with HTTP ${res.status}. Make sure the folder is set to "Anyone with the link".`);
    }

    const html  = await res.text();
    const raw   = parseFiles(html);

    // Build clean media objects
    const data = raw.map((f, i) => ({
      id         : String(i + 1),
      title      : cleanTitle(f.name),
      fileId     : f.id,
      type       : f.type,
      thumbnail  : `https://lh3.googleusercontent.com/u/0/d/${f.id}=w600`,
      duration   : '',
      quality    : 'HD',
      genre      : f.type === 'video' ? 'Phim' : 'Nhạc',
      year       : '',
      description: '',
    }));

    return {
      statusCode: 200,
      headers   : CORS,
      body      : JSON.stringify({ ok: true, count: data.length, data }),
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
