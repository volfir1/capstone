import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads/documents directory exists
const uploadsDir = path.join(__dirname, '../uploads/documents/');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage — preserve the original filename.
// Decode URI-encoded names (RN can send "MAQ_GIS%202025.pdf" instead of
// "MAQ_GIS 2025.pdf") so the file name on disk is always human-readable.
// If a file with the same name already exists on disk, suffix with a timestamp.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Decode any URI-encoded characters (e.g. %20 → space)
    let originalName;
    try { originalName = decodeURIComponent(file.originalname); }
    catch { originalName = file.originalname; }
    // Also store the decoded name back so req.file.originalname is clean
    file.originalname = originalName;

    const targetPath = path.join(uploadsDir, originalName);

    // Only add a timestamp suffix when a collision exists
    if (fs.existsSync(targetPath)) {
      const ext = path.extname(originalName);
      const nameWithoutExt = path.basename(originalName, ext);
      cb(null, `${nameWithoutExt}-${Date.now()}${ext}`);
    } else {
      cb(null, originalName);
    }
  }
});

// File filter - accept documents, images, and videos
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/pdf', // .pdf
    'image/jpg',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'video/mp4',
    'video/quicktime', // .mov
    'video/x-msvideo', // .avi
    'video/x-matroska', // .mkv
    'video/webm',
    'video/mpeg'
  ];
  
  const allowedExts = [
    '.doc', '.docx', '.pdf',
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tif', '.tiff',
    '.mp4', '.mov', '.avi', '.mkv', '.webm', '.mpeg', '.mpg'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();
  const isGenericImageOrVideo = mime.startsWith('image/') || mime.startsWith('video/');
  
  if (allowedMimes.includes(mime) || allowedExts.includes(ext) || isGenericImageOrVideo) {
    cb(null, true);
  } else {
    cb(new Error('Only document, image, and video files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  }
});

export default upload;
