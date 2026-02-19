/**
 * Upload an image to Cloudinary using unsigned upload preset.
 * For React Native / Expo - handles both file URIs and base64.
 *
 * Required env variables:
 *   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 */

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload an image URI to Cloudinary.
 * Returns the secure URL of the uploaded image.
 *
 * @param {string} uri - The local URI of the image (from ImagePicker)
 * @param {string} [folder='profile_images'] - Optional Cloudinary folder
 * @returns {Promise<string>} - The secure image URL
 */
export const uploadToCloudinary = async (uri, folder = 'profile_images') => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary credentials are missing. Please set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env file.'
    );
  }

  // Extract filename and type from URI
  const filename = uri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: filename,
    type,
  });
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
