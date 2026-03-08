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

// File filter - accept Word documents and PDFs
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/pdf' // .pdf
  ];
  
  const allowedExts = ['.doc', '.docx', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only Word documents (.doc, .docx) and PDF files are allowed'), false);
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
