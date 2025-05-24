// middlewares/upload.mdw.js
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: "denyzdlq1",
  api_key: "288112782568131",
  api_secret: "_ylCmBuSHYjUXwY0up8ZGgbjboQ",
});



console.log('[Cloudinary ENV]', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'exists' : 'missing'
});

const allowedFormats = ['jpg', 'jpeg', 'png', 'webp'];

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    console.log('File:', file);
    const extension = file.mimetype.split('/')[1];
    if (!allowedFormats.includes(extension)) {
      throw new Error('File format not supported');
    }

    return {
      folder: 'SaveImage',
      format: extension, // giữ đúng định dạng gốc
      public_id: `${file.fieldname}-${Date.now()}`,
    };
  },
});

// Multer file filter
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpg, .jpeg, .png, .webp files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
