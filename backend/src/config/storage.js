import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { supabase, isSupabaseConfigured } from './supabase.js';
import { uploadBufferToCloudinary, isCloudinaryConfigured } from './cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'arohvi-products';

/**
 * Upload an image buffer to the active cloud storage provider:
 * 1. Supabase Storage (Preferred)
 * 2. Cloudinary (Secondary)
 * 3. Local disk /uploads/ (Fallback)
 */
export const uploadImage = async (fileBuffer, originalname = 'image.jpg', mimetype = 'image/jpeg') => {
  const extension = path.extname(originalname) || '.jpg';
  const cleanBaseName = path.basename(originalname, extension).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueFileName = `${Date.now()}-${cleanBaseName}${extension}`;

  // 1. Supabase Storage
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(uniqueFileName, fileBuffer, {
          contentType: mimetype,
          cacheControl: '31536000',
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Retrieve public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      return {
        secure_url: urlData.publicUrl,
        url: urlData.publicUrl,
        public_id: data.path,
        storage: 'supabase',
        format: extension.replace('.', ''),
        bytes: fileBuffer.length
      };
    } catch (err) {
      console.error('[Supabase Storage Error] Falling back to secondary storage:', err.message);
    }
  }

  // 2. Cloudinary
  if (isCloudinaryConfigured()) {
    try {
      return await uploadBufferToCloudinary(fileBuffer, originalname);
    } catch (err) {
      console.error('[Cloudinary Storage Error] Falling back to local storage:', err.message);
    }
  }

  // 3. Local Disk Storage Fallback
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, uniqueFileName);
  fs.writeFileSync(filePath, fileBuffer);

  const localUrl = `/uploads/${uniqueFileName}`;
  console.warn(`[Storage Warning] Cloud storage not configured. Saved file locally to ${localUrl}`);

  return {
    secure_url: localUrl,
    url: localUrl,
    public_id: `local-${uniqueFileName}`,
    format: extension.replace('.', ''),
    bytes: fileBuffer.length,
    storage: 'local_fallback'
  };
};

export const getActiveStorageProvider = () => {
  if (isSupabaseConfigured()) return 'supabase';
  if (isCloudinaryConfigured()) return 'cloudinary';
  return 'local_fallback';
};
