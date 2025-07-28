const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create upload directories
const uploadDirs = {
  documents: path.join(__dirname, '../uploads/documents'),
  images: path.join(__dirname, '../uploads/images'),
  videos: path.join(__dirname, '../uploads/videos')
};

Object.values(uploadDirs).forEach(ensureDirectoryExists);

// File filter function
const fileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  };
};

// Generate unique filename
const generateFilename = (originalname) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = path.extname(originalname);
  const nameWithoutExt = path.basename(originalname, extension);
  return `${nameWithoutExt}_${timestamp}_${random}${extension}`;
};

// File type configurations
const documentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

const imageTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

const videoTypes = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm'
];

// File size limits (in bytes)
const fileSizeLimits = {
  documents: 10 * 1024 * 1024, // 10MB
  images: 5 * 1024 * 1024,     // 5MB
  videos: 50 * 1024 * 1024     // 50MB
};

// Upload middleware for documents
exports.uploadDocuments = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDirs.documents);
    },
    filename: (req, file, cb) => {
      cb(null, generateFilename(file.originalname));
    }
  }),
  fileFilter: fileFilter(documentTypes),
  limits: { fileSize: fileSizeLimits.documents }
}).array('documents', 10);

// Upload middleware for images
exports.uploadImages = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDirs.images);
    },
    filename: (req, file, cb) => {
      cb(null, generateFilename(file.originalname));
    }
  }),
  fileFilter: fileFilter(imageTypes),
  limits: { fileSize: fileSizeLimits.images }
}).array('images', 10);

// Upload middleware for videos
exports.uploadVideos = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDirs.videos);
    },
    filename: (req, file, cb) => {
      cb(null, generateFilename(file.originalname));
    }
  }),
  fileFilter: fileFilter(videoTypes),
  limits: { fileSize: fileSizeLimits.videos }
}).array('videos', 10);

// Combined upload middleware for listings (documents, images, videos)
exports.uploadListingFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadDir;
      if (file.fieldname === 'documents') {
        uploadDir = uploadDirs.documents;
      } else if (file.fieldname === 'images') {
        uploadDir = uploadDirs.images;
      } else if (file.fieldname === 'videos') {
        uploadDir = uploadDirs.videos;
      } else {
        uploadDir = uploadDirs.documents; // default
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, generateFilename(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'documents') {
      fileFilter(documentTypes)(req, file, cb);
    } else if (file.fieldname === 'images') {
      fileFilter(imageTypes)(req, file, cb);
    } else if (file.fieldname === 'videos') {
      fileFilter(videoTypes)(req, file, cb);
    } else {
      cb(null, true);
    }
  },
  limits: { fileSize: fileSizeLimits.videos } // Use largest limit
}).fields([
  { name: 'documents', maxCount: 10 },
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 10 }
]);

// Error handling middleware
exports.handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};