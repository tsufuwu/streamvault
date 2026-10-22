/**
 * Cloudflare Worker for Orangestream
 * Handles API & media streaming, and passes static files to [assets]
 */

const FOLDER_ID = '1nbI40Z81OK0WNjmsq_uMDMCcmUSlzhH-';

const VIDEO_EXTS = new Set(['mp4','mkv','avi','mov','webm','flv','m4v','wmv','mpg','mpeg']);
const AUDIO_EXTS = new Set(['mp3','wav','flac','aac','m4a','ogg','opus','wma']);

const CORS = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type'                : 'application/json',
};

function getExt(name) { return (name.split('.').pop() || '').toLowerCase(); }
function getType(name) {
  const ext = getExt(name);
  if (VIDEO_EXTS.has(ext)) return 'video';
  if (AUDIO_EXTS.has(ext)) return 'audio';
  return 'video';
}
function cleanTitle(name) { return name.replace(/\.[^/.]+$/, '').trim(); }

async function fetchFolderHtml(folderId) {
  try {
    const res = await fetch(`https://drive.google.com/drive/folders/${folderId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    return null;
  }
}

function parseFolderContents(html, currentFolderId) {
  const files = [];
  const subfolders = [];
  const seen = new Set();

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
              const rawName = (entry[2] || '').trim();
              const mime = entry[3] || '';
              if (id !== currentFolderId && !seen.has(id)) {
                seen.add(id);
                if (mime === 'application/vnd.google-apps.folder' || mime.includes('folder') || /\b(?:Thư mục|Folder|Shared folder)\b/i.test(rawName)) {
                  const cleanFolderName = rawName.replace(/\s+(?:Thư mục|Folder|Shared folder)$/i, '').trim();
                  subfolders.push({ id, name: cleanFolderName });
                } else {
                  files.push({ id, name: rawName, type: getType(rawName) });
                }
              }
            } else {
              extractEntries(entry);
            }
          }
        });
      }
      extractEntries(parsed);
    } catch (e) {}
  }

  const reTooltip = /data-id="([\w-]{25,44})"[^>]*data-tooltip="([^"]+?)(?:\s+(?:Video|Audio|Tệp|Shared))*"/g;
  let m;
  while ((m = reTooltip.exec(html)) !== null) {
    const [, id, rawName] = m;
    const cleanRaw = (rawName || '').trim();
    if (id !== currentFolderId && !seen.has(id)) {
      seen.add(id);
      if (/\b(?:Thư mục|Folder|Shared folder)\b/i.test(cleanRaw)) {
        const cleanName = cleanRaw.replace(/\s+(?:Thư mục|Folder|Shared folder)$/i, '').trim();
        subfolders.push({ id, name: cleanName });
      } else {
        files.push({ id, name: cleanRaw, type: getType(cleanRaw) });
      }
    }
  }

  return { files, subfolders };
}

async function crawlDrive(rootFolderId) {
  const visited = new Set([rootFolderId]);
  const queue = [{ id: rootFolderId, path: [], name: 'Thư mục gốc' }];
  const allMedia = [];
  const allFolders = [];
  let fileCounter = 1;

  while (queue.length > 0 && visited.size <= 25) {
    const current = queue.shift();
    const html = await fetchFolderHtml(current.id);
    if (!html) continue;

    const { files, subfolders } = parseFolderContents(html, current.id);

    for (const f of files) {
      allMedia.push({
        id: String(fileCounter++),
        title: cleanTitle(f.name),
        fileId: f.id,
        type: f.type,
        thumbnail: `https://lh3.googleusercontent.com/u/0/d/${f.id}=w600`,
        duration: '',
        quality: 'HD',
        genre: f.type === 'video' ? 'Video' : 'Audio',
        year: '',
        description: '',
        folderId: current.id,
        folderName: current.name.trim(),
        folderPath: current.path,
      });
    }

    for (const sub of subfolders) {
      if (!visited.has(sub.id)) {
        visited.add(sub.id);
        const cleanSubName = (sub.name || '').trim();
        const subPath = [...current.path, cleanSubName];
        queue.push({ id: sub.id, path: subPath, name: cleanSubName });
        allFolders.push({
          id: sub.id,
          name: cleanSubName,
          path: subPath,
          parentId: current.id,
        });
      }
    }
  }

  return { allMedia, allFolders };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API: /api/get-media-list
    if (url.pathname === '/api/get-media-list') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS });
      }
      try {
        const { allMedia, allFolders } = await crawlDrive(FOLDER_ID);
        return new Response(JSON.stringify({
          ok: true,
          count: allMedia.length,
          data: allMedia,
          folders: allFolders,
        }), {
          status: 200,
          headers: CORS,
        });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
          status: 500,
          headers: CORS,
        });
      }
    }

    // Stream proxy: /stream-media/:fileId
    if (url.pathname.startsWith('/stream-media/')) {
      const fileId = url.pathname.replace('/stream-media/', '').trim();
      const targetUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=view`;

      const rangeHeader = request.headers.get('range');
      const reqHeaders = new Headers();
      reqHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
      reqHeaders.set('Accept', 'video/*,audio/*,*/*');
      if (rangeHeader) reqHeaders.set('Range', rangeHeader);

      try {
        const upstream = await fetch(targetUrl, {
          method: request.method,
          headers: reqHeaders,
          redirect: 'follow',
        });
        const resHeaders = new Headers();
        resHeaders.set('Access-Control-Allow-Origin', '*');
        resHeaders.set('Access-Control-Allow-Headers', 'Range, Accept, Content-Type');
        resHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges, Content-Type');
        resHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        resHeaders.set('Accept-Ranges', 'bytes');
        resHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');

        const safeHeaders = ['content-type', 'content-length', 'content-range', 'last-modified', 'etag', 'cache-control'];
        for (const h of safeHeaders) {
          const v = upstream.headers.get(h);
          if (v) resHeaders.set(h, v);
        }

        return new Response(upstream.body, {
          status: upstream.status,
          headers: resHeaders,
        });
      } catch (e) {
        return new Response('Streaming error: ' + e.message, { status: 502 });
      }
    }

    // Static Assets fallback (index.html, style.css, app.js, etc.)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
