/**
 * media-library.js
 * Edit this file to add/remove your Google Drive media files.
 * 
 * HOW TO GET FILE ID:
 * From a Drive share link: https://drive.google.com/file/d/FILE_ID_HERE/view
 * Copy the part between /d/ and /view
 */

const MEDIA_LIBRARY = [
  // ===================== VIDEO =====================
  {
    id: "1",
    title: "Big Buck Bunny",
    fileId: "REPLACE_WITH_YOUR_FILE_ID",
    type: "video",
    thumbnail: null,            // Leave null to use auto-generated icon
    duration: "9:56",
    quality: "1080p",
    genre: "Animation",
    year: "2008",
    description: "A large and lovable rabbit deals with bullying.",
  },
  {
    id: "2",
    title: "Sample Movie",
    fileId: "REPLACE_WITH_YOUR_FILE_ID_2",
    type: "video",
    thumbnail: null,
    duration: "1:32:10",
    quality: "720p",
    genre: "Action",
    year: "2024",
    description: "An action-packed adventure.",
  },
  // ===================== AUDIO =====================
  {
    id: "3",
    title: "Lofi Study Mix",
    fileId: "REPLACE_WITH_YOUR_FILE_ID_3",
    type: "audio",
    thumbnail: null,
    duration: "1:00:00",
    genre: "Music",
    year: "2024",
    description: "Relaxing lofi beats to study and relax.",
  },
];

export default MEDIA_LIBRARY;
