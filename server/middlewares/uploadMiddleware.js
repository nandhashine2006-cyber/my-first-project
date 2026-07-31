const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists in root workspace
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `plant-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File validation filter strictly permitting JPG, JPEG, PNG, WEBP
const fileFilter = (req, file, cb) => {
  const allowedMimetypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i;

  const isValidMime = allowedMimetypes.includes(file.mimetype);
  const isValidExt = allowedExtensions.test(path.extname(file.originalname));

  if (isValidMime && isValidExt) {
    cb(null, true);
  } else {
    // Reject executables, PDFs, videos, and unsupported formats cleanly
    cb(new Error('Invalid image file format. Only JPG, JPEG, PNG, and WEBP files are accepted for AI analysis.'), false);
  }
};

// 8 MB Maximum filesize enforcement as required in specification
const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024 // 8 MB
  },
  fileFilter
});

module.exports = uploadMiddleware;
