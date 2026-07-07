import multer from 'multer';
import AppError from '../utils/appError.js';

// Setup memory storage to hold the files before uploading to Supabase
const storage = multer.memoryStorage();

// Validate file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp3', 'audio/x-m4a', 'audio/ogg',
    // Video
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/ogg'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Unsupported file format. Please upload an image, audio file, or video.', 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Max size 50MB for videos/audio
  },
});

export default upload;
