import { uploadFile } from '../services/storage.service.js';
import AppError from '../utils/appError.js';

export const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No file uploaded. Please select a file to upload.', 400));
    }

    // Determine target folder based on file type
    let folder = 'general';
    if (req.file.mimetype.startsWith('image/')) {
      folder = 'images';
    } else if (req.file.mimetype.startsWith('audio/')) {
      folder = 'audio';
    } else if (req.file.mimetype.startsWith('video/')) {
      folder = 'videos';
    }

    const fileUrl = await uploadFile(req.file, folder);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: fileUrl,
        mimetype: req.file.mimetype,
        size: req.file.size,
        originalname: req.file.originalname,
      },
    });
  } catch (error) {
    next(error);
  }
};
