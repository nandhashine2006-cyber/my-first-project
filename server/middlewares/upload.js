const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `plant-img-${uniqueSuffix}${ext}`);
  }
});

// File filter for image validation
const fileFilter = (req, file, cb) => {
  const allowedMimetypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only JPG, PNG, and WEBP images are permitted.');
    error.statusCode = 400;
    cb(error, false);
  }
};

// Multer upload instance with 5MB limit
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: fileFilter
});

module.exports = upload;
