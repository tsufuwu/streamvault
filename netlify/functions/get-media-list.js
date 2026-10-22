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
  return null;
}

function cleanTitle(name) {
  return name
    .replace(/\.[^/.]+$/, '')   // remove extension
    .replace(/[._-]+/g, ' ')    // underscores/dots/dashes → spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse file entries from Google Drive folder HTML.
 * Google embeds folder data in multiple script tag formats.
 * We try several patterns for resilience.
 */
function parseFiles(html) {
  const seen  = new Set();
  const files = [];

  /**
   * Strategy 1 — AF_initDataCallback nested arrays
   * Matches entries like: ["FILE_ID",null,"filename.mp4", ...
   * The file ID is a 25-44 char alphanumeric string distinct from the folder ID.
   */
  const re1 = /\["([\w-]{25,44})",\s*(?:null|""),\s*"([^"\\]+\.[a-z0-9]{2,5})"/gi;
  let m;
  while ((m = re1.exec(html)) !== null) {
    const [, id, rawName] = m;
    if (id === FOLDER_ID || seen.has(id)) continue;
    const type = getType(rawName);
    if (!type) continue;
    seen.add(id);
    files.push({ id, name: rawName, type });
  }

  /**
   * Strategy 2 — href="/file/d/FILE_ID" links in rendered HTML
   * Catches cases where files are rendered as <a> tags.
   */
  const re2 = /href="\/file\/d\/([\w-]{25,44})(?:\/|\?)([^"]*)"[^>]*>([^<]*)</gi;
  while ((m = re2.exec(html)) !== null) {
    const [, id, , label] = m;
    if (id === FOLDER_ID || seen.has(id)) continue;
    // label might not have extension; we'll still record it
    const guessedName = label.trim() || id;
    const type = getType(guessedName) || 'video'; // default to video if unknown
    seen.add(id);
    files.push({ id, name: guessedName, type });
  }

  /**
   * Strategy 3 — data-id attributes on file cards
   */
  const re3 = /data-id="([\w-]{25,44})"/gi;
  const re3name = /data-tooltip="([^"]+\.[a-z0-9]{2,5})"/gi;
  // collect data-tooltip names
  const tooltips = {};
  let t;
  while ((t = re3name.exec(html)) !== null) tooltips[t[1]] = t[1];

  while ((m = re3.exec(html)) !== null) {
    const id = m[1];
    if (id === FOLDER_ID || seen.has(id)) continue;
    const rawName = Object.keys(tooltips)[0] || id;
    const type = getType(rawName) || 'video';
    seen.add(id);
    files.push({ id, name: rawName, type });
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
      thumbnail  : null,
      duration   : '',
      quality    : '',
      genre      : f.type === 'video' ? 'Phim' : 'Nhac',
      year       : '',
      description: '',
    }));

    // Sort: newest-added-first approximation (order from Drive page)
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
