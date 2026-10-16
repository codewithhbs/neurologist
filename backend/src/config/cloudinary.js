const fs = require('fs');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const hasCloudinaryKeys =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('your_cloud_name');

let cloudinary = null;
let upload;

const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

// helper middleware to set target folder e.g. app.post('/x', setFolder('doctors'), upload.single('photo'), ctrl)
const setFolder = (folder) => (req, res, next) => {
  req.uploadFolder = folder;
  next();
};

if (hasCloudinaryKeys) {
  // ---------- CLOUDINARY MODE ----------
  cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: `dhic/${req.uploadFolder || 'misc'}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }]
    })
  });

  upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });
  console.log('✅ Uploads: using Cloudinary');
} else {
  // ---------- LOCAL DISK FALLBACK MODE ----------
  // No Cloudinary keys configured — files are saved to /uploads/<folder>/ and served
  // statically from the backend at {SERVER_URL}/uploads/<folder>/<filename>.
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const folder = req.uploadFolder || 'misc';
      const dir = path.join(UPLOADS_ROOT, folder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safeName);
    }
  });

  const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.includes(ext)) return cb(new Error('Unsupported file type'));
    cb(null, true);
  };

  upload = multer({ storage, fileFilter, limits: { fileSize: 8 * 1024 * 1024 } });
  console.log('⚠️  Uploads: Cloudinary keys not set — falling back to local disk storage at /uploads');
}

module.exports = { cloudinary, upload, setFolder, hasCloudinaryKeys, UPLOADS_ROOT };
