/**
 * Upload an image to Cloudinary using unsigned upload preset.
 *
 * Required env variables (client/.env):
 *   VITE_CLOUDINARY_CLOUD_NAME   – your Cloudinary cloud name
 *   VITE_CLOUDINARY_UPLOAD_PRESET – an unsigned upload preset name
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload a File / Blob to Cloudinary.
 * Returns the secure URL of the uploaded image.
 *
 * @param {File} file  – the image file to upload
 * @param {string} [folder='profile_images'] – optional Cloudinary folder
 * @returns {Promise<string>} – the secure image URL
 */
export const uploadToCloudinary = async (file, folder = 'profile_images') => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary credentials are missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url;
};
