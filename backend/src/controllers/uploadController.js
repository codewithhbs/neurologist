const { hasCloudinaryKeys } = require('../config/cloudinary');
const { getBase } = require('../utils/imageUrl');

// Path that must be saved in the database (e.g. /uploads/services/123.jpg).
// Cloudinary mode returns an absolute URL, which is kept as-is.
const buildPath = (req, file) => {
  if (hasCloudinaryKeys) return file.path;
  const folder = req.uploadFolder || 'misc';
  return `/uploads/${folder}/${file.filename}`;
};

// Full URL - for instant preview only. Do NOT save this in the DB.
const buildPreviewUrl = (req, p) => (/^https?:\/\//i.test(p) ? p : `${getBase(req)}${p}`);

// POST /api/admin/upload/:folder  (multipart field name: "file")
exports.uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const path = buildPath(req, req.file);
  res.json({
    success: true,
    path, // <-- save THIS in the database
    url: buildPreviewUrl(req, path), // preview only (middleware also strips it back to a path if saved)
    public_id: req.file.filename,
    storage: hasCloudinaryKeys ? 'cloudinary' : 'local'
  });
};

exports.uploadMultiple = async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'No files uploaded' });
  const files = req.files.map((f) => {
    const path = buildPath(req, f);
    return { path, url: buildPreviewUrl(req, path), public_id: f.filename };
  });
  res.json({ success: true, files, storage: hasCloudinaryKeys ? 'cloudinary' : 'local' });
};
