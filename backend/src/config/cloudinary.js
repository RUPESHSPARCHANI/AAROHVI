import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name'
  );
};

/**
 * Upload an in-memory file buffer directly to Cloudinary
 * Returns a Promise that resolves with the Cloudinary response object
 */
export const uploadBufferToCloudinary = (fileBuffer, originalname = 'image', customOptions = {}) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      // Local fallback if Cloudinary credentials are not configured
      try {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const cleanName = `${Date.now()}-${originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = path.join(uploadDir, cleanName);
        fs.writeFileSync(filePath, fileBuffer);

        const localUrl = `/uploads/${cleanName}`;
        console.warn(`[Cloudinary Warning] Credentials not configured in .env. Saved file locally to ${localUrl}`);
        return resolve({
          secure_url: localUrl,
          url: localUrl,
          public_id: `local-${cleanName}`,
          format: path.extname(originalname).replace('.', ''),
          storage: 'local_fallback'
        });
      } catch (err) {
        return reject(err);
      }
    }

    // Direct Cloudinary Upload Stream
    const uploadOptions = {
      folder: process.env.CLOUDINARY_FOLDER || 'arohvi/products',
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' } // Auto compression & modern format delivery (WEBP/AVIF)
      ],
      ...customOptions
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('[Cloudinary Upload Error]', error);
          return reject(error);
        }
        resolve({
          secure_url: result.secure_url,
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          storage: 'cloudinary'
        });
      }
    );

    // Stream the buffer into Cloudinary
    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

export default cloudinary;
