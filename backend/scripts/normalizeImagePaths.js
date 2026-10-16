/**
 * One-time cleanup of data ALREADY saved in the database:
 *     npm run fix-images
 * Turns  "http://localhost:5000/uploads/..."  (any host/port)  into  "/uploads/..."
 * Covers plain columns, JSON columns (attachment_urls, cms content) and image site settings.
 * Safe to run many times. External URLs (Cloudinary, etc.) are left alone.
 */
require('dotenv').config();
const pool = require('../src/config/db');
const { toPath, pathsDeep } = require('../src/utils/imageUrl');

// [table, column]
const PLAIN = [
  ['doctors', 'photo_url'],
  ['service_categories', 'icon_url'],
  ['services', 'icon_url'],
  ['services', 'banner_image_url'],
  ['offers', 'image_url'],
  ['blogs', 'cover_image_url'],
  ['seo_meta', 'og_image'],
  ['hero_banners', 'image_url'],
  ['onboarding_slides', 'image_url'],
  ['prescriptions', 'pdf_url'],
  ['old_prescriptions', 'pdf_url']
];
// JSON / text columns that can contain urls inside
const JSON_COLS = [
  ['medical_history', 'attachment_urls'],
  ['old_medical_history', 'attachment_urls'],
  ['prescriptions', 'attachment_urls'],
  ['old_prescriptions', 'attachment_urls'],
  ['cms_pages', 'content_json']
];
const LIKE = `%/uploads/%`;

const tableMissing = (e) => e && (e.code === 'ER_NO_SUCH_TABLE' || e.code === 'ER_BAD_FIELD_ERROR');

(async () => {
  let total = 0;

  for (const [t, c] of PLAIN) {
    try {
      const [rows] = await pool.query(`SELECT id, \`${c}\` AS v FROM \`${t}\` WHERE \`${c}\` REGEXP '^https?://[^/]+/uploads/'`);
      for (const r of rows) await pool.query(`UPDATE \`${t}\` SET \`${c}\` = ? WHERE id = ?`, [toPath(r.v), r.id]);
      total += rows.length;
      console.log(`${t}.${c}: ${rows.length} fixed`);
    } catch (e) { if (tableMissing(e)) console.log(`${t}.${c}: skipped (not found)`); else throw e; }
  }

  for (const [t, c] of JSON_COLS) {
    try {
      const [rows] = await pool.query(`SELECT id, \`${c}\` AS v FROM \`${t}\` WHERE \`${c}\` LIKE ?`, [LIKE]);
      let n = 0;
      for (const r of rows) {
        let data = r.v;
        if (typeof data === 'string') { try { data = JSON.parse(data); } catch (_) { continue; } }
        // attachment_urls = array of strings; cms content = nested object (keys handled by pathsDeep)
        const fixed = c === 'attachment_urls'
          ? (Array.isArray(data) ? data.map(toPath) : data)
          : pathsDeep(data);
        const out = JSON.stringify(fixed);
        if (out !== JSON.stringify(data)) {
          await pool.query(`UPDATE \`${t}\` SET \`${c}\` = ? WHERE id = ?`, [out, r.id]);
          n++;
        }
      }
      total += n;
      console.log(`${t}.${c}: ${n} fixed`);
    } catch (e) { if (tableMissing(e)) console.log(`${t}.${c}: skipped (not found)`); else throw e; }
  }

  const [s] = await pool.query(`SELECT id, setting_value AS v FROM site_settings WHERE setting_type='image' AND setting_value REGEXP '^https?://[^/]+/uploads/'`);
  for (const r of s) await pool.query('UPDATE site_settings SET setting_value=? WHERE id=?', [toPath(r.v), r.id]);
  total += s.length;
  console.log(`site_settings (image): ${s.length} fixed`);

  console.log(`\nDone. ${total} rows updated.`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
