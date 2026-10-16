/**
 * Image path <-> URL helpers.
 *
 * RULE:
 *   - DATABASE  stores only the PATH:        /uploads/services/1791973698670-169971566.jpg
 *   - API reads return  API_IMAGE_URL + path: http://localhost:5000/uploads/services/....jpg
 *
 * External absolute URLs (Cloudinary, Unsplash, ...) are never touched.
 */

// Fields that hold an image / file location. Add new column names here and
// they are handled automatically everywhere (saving AND reading).
const IMAGE_KEYS = new Set([
  'photo_url',
  'doctor_photo',
  'icon_url',
  'banner_image_url',
  'image_url',
  'cover_image_url',
  'og_image',
  'logo_url',
  'pdf_url',
  'attachment_urls'
]);

const isAbsolute = (v) => /^(https?:)?\/\//i.test(v) || /^data:/i.test(v);

const getBase = (req) => {
  const fromEnv = process.env.API_IMAGE_URL || process.env.SERVER_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  if (req) return `${req.protocol}://${req.get('host')}`;
  return '';
};

/** "http://anything:5000/uploads/x/y.jpg"  ->  "/uploads/x/y.jpg"  (used before saving) */
const toPath = (value) => {
  if (typeof value !== 'string' || !value) return value;
  const v = value.trim();
  const m = v.match(/^https?:\/\/[^/]+(\/uploads\/.*)$/i);
  if (m) return m[1];
  if (/^uploads\//i.test(v)) return `/${v}`;
  return v; // Cloudinary / external / already a path
};

/** "/uploads/x/y.jpg"  ->  "http://API_IMAGE_URL/uploads/x/y.jpg"  (used when sending) */
const toUrl = (value, req) => {
  if (typeof value !== 'string' || !value) return value;
  const v = value.trim();
  if (isAbsolute(v)) return v;
  return `${getBase(req)}/${v.replace(/^\/+/, '')}`;
};

const mapValue = (value, fn) => {
  if (typeof value === 'string') {
    // attachment_urls is a JSON column that may arrive as a JSON string
    const t = value.trim();
    if (t.startsWith('[') && t.endsWith(']')) {
      try {
        return JSON.stringify(JSON.parse(t).map((x) => mapValue(x, fn)));
      } catch (_) { /* not JSON, treat as plain string */ }
    }
    return fn(value);
  }
  if (Array.isArray(value)) return value.map((x) => mapValue(x, fn));
  return value;
};

/** Deep-walk any object/array and apply fn to every image field. Returns a new structure. */
const walk = (node, fn) => {
  if (Array.isArray(node)) return node.map((n) => walk(n, fn));
  if (node instanceof Date || Buffer.isBuffer(node)) return node;
  if (node && typeof node === 'object') {
    const out = {};
    const isImageSetting = node.setting_type === 'image' || node.type === 'image'; // site_settings rows / upsert body
    for (const [k, v] of Object.entries(node)) {
      if (IMAGE_KEYS.has(k) || (isImageSetting && (k === 'setting_value' || k === 'value'))) {
        out[k] = v && typeof v === 'object' && !Array.isArray(v) ? walk(v, fn) : mapValue(v, fn);
      } else if (v && typeof v === 'object') {
        out[k] = walk(v, fn);
      } else {
        out[k] = v;
      }
    }
    return out;
  }
  return node;
};

const pathsDeep = (data) => walk(data, toPath);
const urlsDeep = (data, req) => walk(data, (v) => toUrl(v, req));

module.exports = { IMAGE_KEYS, getBase, toPath, toUrl, pathsDeep, urlsDeep };
