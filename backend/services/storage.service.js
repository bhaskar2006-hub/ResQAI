import { supabase, isSupabaseConfigured } from './supabase.service.js';
import fs from 'fs/promises';
import path from 'path';

const supabaseBucket = process.env.SUPABASE_BUCKET || 'resqai-media';

/**
 * Uploads a file to Supabase Storage or falls back to local storage
 * @param {Object} file - Multer file object
 * @param {string} folder - Destination folder name
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export const uploadFile = async (file, folder = 'general') => {
  const fileExtension = file.originalname.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExtension}`;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(supabaseBucket)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        console.warn('Supabase upload warning, falling back to local storage:', error);
      } else {
        // Retrieve public URL
        const { data: { publicUrl } } = supabase.storage
          .from(supabaseBucket)
          .getPublicUrl(fileName);

        return publicUrl;
      }
    } catch (err) {
      console.warn('Supabase upload exception, falling back to local storage:', err);
    }
  }

  // Fallback: Local storage write
  const localDir = path.resolve('storage', folder);
  
  // Ensure directory exists
  await fs.mkdir(localDir, { recursive: true });
  
  const localPath = path.join(localDir, path.basename(fileName));
  await fs.writeFile(localPath, file.buffer);
  
  // Return local server URL
  const serverUrl = `http://localhost:${process.env.PORT || 5000}/storage/${folder}/${path.basename(fileName)}`;
  console.log(`[Storage Fallback] File written locally to: ${localPath}`);
  return serverUrl;
};
