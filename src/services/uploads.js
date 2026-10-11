import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Pick a photo from the device.
export async function pickListingImage() {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Please allow photo library access.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  return result.assets[0].uri;
}

// Upload the photo to Cloudinary.```js
export async function uploadImageAsync(uri) {
  if (!uri) {
    throw new Error('No image selected.');
  }

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration is missing. Check your .env file.');
  }

  const uploadUrl =
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const response = await FileSystem.uploadAsync(uploadUrl, uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType: 'image/jpeg',
    parameters: {
      upload_preset: UPLOAD_PRESET,
    },
  });

  let result;

  try {
    result = JSON.parse(response.body);
  } catch {
    throw new Error('Cloudinary returned an invalid response.');
  }

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      result?.error?.message || `Cloudinary upload failed: ${response.status}`
    );
  }

  if (!result.secure_url) {
    throw new Error('Cloudinary did not return an image URL.');
  }

  return result.secure_url;
}
