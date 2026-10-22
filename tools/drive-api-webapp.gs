/**
 * Google Apps Script — Dynamic Media API
 * Deploy as Web App: Execute as "Me", Access "Anyone"
 *
 * HƯỚNG DẪN DEPLOY:
 * 1. Paste code này vào script.google.com
 * 2. Click Deploy → New deployment → Web app
 * 3. Execute as: Me | Who has access: Anyone
 * 4. Copy Web App URL → dán vào app.js (biến APPS_SCRIPT_API_URL)
 */

const FOLDER_ID = '1nbI40Z81OK0WNjmsq_uMDMCcmUSlzhH-';

const VIDEO_EXTS = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'm4v', 'wmv'];
const AUDIO_EXTS = ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'opus', 'wma'];

function getExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

function getType(filename) {
  const ext = getExtension(filename);
  if (VIDEO_EXTS.includes(ext)) return 'video';
  if (AUDIO_EXTS.includes(ext)) return 'audio';
  return null;
}

function cleanTitle(filename) {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Xử lý GET request từ frontend
 * Trả về JSON danh sách toàn bộ media trong folder
 */
function doGet(e) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const files  = folder.getFiles();
    const media  = [];
    let id = 1;

    while (files.hasNext()) {
      const file = files.next();
      const name = file.getName();
      const type = getType(name);
      if (!type) continue;

      // Tự động share nếu chưa public
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch(e) {}

      media.push({
        id:          String(id++),
        title:       cleanTitle(name),
        fileId:      file.getId(),
        type:        type,
        thumbnail:   null,
        duration:    '',
        quality:     '',
        genre:       type === 'video' ? 'Phim' : 'Nhac',
        year:        '',
        description: '',
        addedAt:     file.getDateCreated().toISOString(),
      });
    }

    // Sắp xếp: mới nhất lên đầu
    media.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    const output = ContentService
      .createTextOutput(JSON.stringify({ ok: true, count: media.length, data: media }))
      .setMimeType(ContentService.MimeType.JSON);

    return output;

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
