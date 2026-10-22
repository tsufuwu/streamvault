/**
 * Google Apps Script — Tự động tạo media-library.js từ Google Drive Folder
 *
 * HƯỚNG DẪN:
 * 1. Thay FOLDER_ID bên dưới bằng ID thư mục Drive của bạn
 * 2. Click Run (nút tam giác ▶) → Xem kết quả trong Logger (View > Logs)
 * 3. Copy nội dung từ Logger → paste vào file media-library.js trong dự án
 */

const FOLDER_ID = '1nbI40Z81OK0WNjmsq_uMDMCcmUSlzhH-'; // ← Folder của bạn

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

function generateMediaLibrary() {
  const rootFolder = DriveApp.getFolderById(FOLDER_ID);
  const entries = [];
  let id = 1;

  function scanFolder(folder, folderPath) {
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const name = file.getName();
      const type = getType(name);
      if (!type) continue;

      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch(e) {}

      entries.push({
        id: String(id++),
        title: cleanTitle(name),
        fileId: file.getId(),
        type: type,
        genre: type === 'video' ? 'Video' : 'Audio',
        year: new Date().getFullYear().toString(),
        folderId: folder.getId(),
        folderName: folder.getName(),
        folderPath: folderPath,
      });
    }

    const subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
      const sub = subfolders.next();
      scanFolder(sub, [...folderPath, sub.getName()]);
    }
  }

  scanFolder(rootFolder, []);

  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'video' ? -1 : 1;
    return a.title.localeCompare(b.title, 'vi');
  });

  const lines = [
    '/**',
    ' * media-library.js - Tu dong tao boi Google Apps Script',
     * Ngay tao: ,
     * Tong so file: ,
    ' */',
    '',
    'const MEDIA_LIBRARY = [',
  ];

  entries.forEach((e, i) => {
    const comma = i < entries.length - 1 ? ',' : '';
    lines.push('  {');
    lines.push(    id: "",);
    lines.push(    title: "",);
    lines.push(    fileId: "",);
    lines.push(    type: "",);
    lines.push(    thumbnail: null,);
    lines.push(    duration: "",);
    lines.push(    quality: "",);
    lines.push(    genre: "",);
    lines.push(    year: "",);
    lines.push(    description: "",);
    lines.push(  });
  });

  lines.push('];', '', 'export default MEDIA_LIBRARY;');
  const output = lines.join('\n');

  Logger.log(output);

  const outputFile = DriveApp.createFile('media-library.js', output, MimeType.PLAIN_TEXT);
  Logger.log('\n\n=== XONG! ===');
  Logger.log('Tim thay ' + entries.length + ' file media.');
  Logger.log('File da luu vao Drive: ' + outputFile.getUrl());
}
