-- Run in phpMyAdmin (SQL tab) on neurocare_db if you prefer SQL over `npm run fix-images`.
-- Converts "http://anything/uploads/..." into "/uploads/..." for plain columns.
-- Works on MySQL and MariaDB. Safe to run many times.

UPDATE doctors            SET photo_url        = SUBSTRING(photo_url,        LOCATE('/uploads/', photo_url))        WHERE photo_url        REGEXP '^https?://[^/]+/uploads/';
UPDATE service_categories SET icon_url         = SUBSTRING(icon_url,         LOCATE('/uploads/', icon_url))         WHERE icon_url         REGEXP '^https?://[^/]+/uploads/';
UPDATE services           SET icon_url         = SUBSTRING(icon_url,         LOCATE('/uploads/', icon_url))         WHERE icon_url         REGEXP '^https?://[^/]+/uploads/';
UPDATE services           SET banner_image_url = SUBSTRING(banner_image_url, LOCATE('/uploads/', banner_image_url)) WHERE banner_image_url REGEXP '^https?://[^/]+/uploads/';
UPDATE offers             SET image_url        = SUBSTRING(image_url,        LOCATE('/uploads/', image_url))        WHERE image_url        REGEXP '^https?://[^/]+/uploads/';
UPDATE blogs              SET cover_image_url  = SUBSTRING(cover_image_url,  LOCATE('/uploads/', cover_image_url))  WHERE cover_image_url  REGEXP '^https?://[^/]+/uploads/';
UPDATE seo_meta           SET og_image         = SUBSTRING(og_image,         LOCATE('/uploads/', og_image))         WHERE og_image         REGEXP '^https?://[^/]+/uploads/';
UPDATE hero_banners       SET image_url        = SUBSTRING(image_url,        LOCATE('/uploads/', image_url))        WHERE image_url        REGEXP '^https?://[^/]+/uploads/';
UPDATE onboarding_slides  SET image_url        = SUBSTRING(image_url,        LOCATE('/uploads/', image_url))        WHERE image_url        REGEXP '^https?://[^/]+/uploads/';
UPDATE prescriptions      SET pdf_url          = SUBSTRING(pdf_url,          LOCATE('/uploads/', pdf_url))          WHERE pdf_url          REGEXP '^https?://[^/]+/uploads/';
UPDATE site_settings      SET setting_value    = SUBSTRING(setting_value,    LOCATE('/uploads/', setting_value))    WHERE setting_type='image' AND setting_value REGEXP '^https?://[^/]+/uploads/';

-- JSON columns (attachment_urls, cms_pages.content_json) need the Node script: npm run fix-images
