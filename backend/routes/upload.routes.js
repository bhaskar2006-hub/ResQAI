import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = Router();

/**
 * @openapi
 * /upload:
 *   post:
 *     summary: Upload a media file (Image, Audio, or Video)
 *     tags: [Media Upload]
 *     security:
 *       - bearerAuth: []
 *     description: Single file upload via Multipart Form-Data. Automatically routes to Supabase Storage (or falls back to local disk storage).
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully and returns file URL
 *       400:
 *         description: Unsupported format or missing file
 */
router.post('/', protect, upload.single('file'), uploadController.uploadMedia);

export default router;
