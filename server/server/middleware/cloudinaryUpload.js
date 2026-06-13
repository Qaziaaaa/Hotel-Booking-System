import { v2 as cloudinary } from 'cloudinary';
import AppError from '../utils/AppError.js';

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

const cloudinaryUpload = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    req.cloudinaryUrls = [];
    return next();
  }

  try {
    const urls = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.buffer, 'hotel-booking'))
    );
    req.cloudinaryUrls = urls;
    next();
  } catch (error) {
    next(new AppError('Image upload failed. Check Cloudinary configuration.', 500));
  }
};

export default cloudinaryUpload;
