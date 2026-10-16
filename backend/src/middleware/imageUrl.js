const { pathsDeep, urlsDeep, getBase } = require('../utils/imageUrl');

/**
 * Mount once on /api (before the routes).
 *
 * 1) SAVE  : every POST/PUT/PATCH body is scanned - any image field that holds
 *            "http://host:port/uploads/..." is reduced to "/uploads/...".
 *            So the database only ever stores the path.
 * 2) READ  : every res.json() is scanned - image fields get API_IMAGE_URL prefixed.
 *            Because this wraps the outermost res.json, Redis keeps the raw
 *            PATH version and the prefix is added fresh per request.
 */
function imageUrls(req, res, next) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && typeof req.body === 'object'
      && !Buffer.isBuffer(req.body)) {
    req.body = pathsDeep(req.body);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => originalJson(body && typeof body === 'object' ? urlsDeep(body, req) : body);
  next();
}

module.exports = { imageUrls, getBase };
