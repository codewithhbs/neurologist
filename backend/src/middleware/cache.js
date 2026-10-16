const cache = require('../utils/cache');

const DEFAULT_TTL = cache.DEFAULT_TTL;

/**
 * Which namespaces must be invalidated when a given admin path is written to.
 * Order matters: first matching prefix wins.
 * Anything NOT listed here falls back to bumping EVERYTHING — so a new
 * route can never silently serve stale data.
 */
const INVALIDATION_MAP = [
  // doctors touch their own listing, the clinic pages they appear on, and slot generation
  [/^\/doctors/, ['doctors', 'clinics', 'services', 'slots', 'seo']],
  [/^\/clinics/, ['clinics', 'doctors', 'slots', 'seo']],
  [/^\/services/, ['services', 'doctors', 'slots', 'seo']],
  [/^\/blogs/, ['blogs', 'seo']],
  [/^\/(coupons|offers)/, ['offers']],
  [/^\/reviews/, ['reviews', 'doctors', 'clinics']],
  [/^\/(settings|cms|seo)/, ['settings', 'cms', 'seo']],
  [/^\/onboarding-slides/, ['onboarding']],
  [/^\/hero-banners/, ['hero-banners']],
  [/^\/appointments/, ['slots']],
  [/^\/upload/, cache.NAMESPACES] // an image swap can appear anywhere
];

function namespacesForPath(path) {
  for (const [re, list] of INVALIDATION_MAP) {
    if (re.test(path)) return list;
  }
  return cache.NAMESPACES; // unknown write => clear all. Safe by default.
}

/**
 * cacheRoute(namespace, ttl)
 * Caches successful GET JSON responses in Redis.
 * Key includes the full URL *and* the host/protocol, because several
 * controllers build absolute photo_url / image_url values from req.get('host').
 */
function cacheRoute(namespace, ttl = DEFAULT_TTL) {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();
    if (!cache.isUp()) {
      res.set('X-Cache', 'DISABLED');
      return next();
    }
    // allow a manual bypass: ?nocache=1  or  header  x-no-cache: 1
    if (req.query.nocache === '1' || req.get('x-no-cache')) {
      res.set('X-Cache', 'BYPASS');
      return next();
    }

    const identity = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    let key;
    try {
      key = await cache.buildKey(namespace, identity);
      const cached = await cache.get(key);
      if (cached) {
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Namespace', namespace);
        return res.status(cached.status || 200).json(cached.body);
      }
    } catch (e) {
      console.error('[cache] read failed:', e.message);
      return next();
    }

    res.set('X-Cache', 'MISS');
    res.set('X-Cache-Namespace', namespace);

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // only cache successful, non-error payloads
      if (res.statusCode >= 200 && res.statusCode < 300 && body && body.success !== false) {
        cache.set(key, { status: res.statusCode, body }, ttl).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * invalidate(...namespaces)
 * Explicit per-route invalidation. Bumps AFTER the handler responds 2xx.
 */
function invalidate(...namespaces) {
  const list = namespaces.flat();
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        cache.bumpMany(list).catch((e) => console.error('[cache] invalidate failed:', e.message));
      }
    });
    next();
  };
}

/**
 * autoInvalidate()
 * THE SAFETY NET. Mount once on the admin router.
 * Any non-GET request that succeeds wipes the namespaces mapped to its path.
 * "Jo bhi update karo, cache apne aap fresh ho jayega."
 */
function autoInvalidate() {
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'OPTIONS' || req.method === 'HEAD') return next();

    res.on('finish', () => {
      if (res.statusCode < 200 || res.statusCode >= 400) return;
      const path = req.path || req.originalUrl || '';
      const namespaces = namespacesForPath(path);
      cache
        .bumpMany(namespaces)
        .then((list) => {
          console.log(`♻️  [cache] ${req.method} ${path} -> invalidated: ${list.join(', ')}`);
        })
        .catch((e) => console.error('[cache] autoInvalidate failed:', e.message));
    });

    next();
  };
}

/**
 * Stops the browser / Next.js fetch / CDN from holding on to an old API response.
 * Server-side Redis still does the heavy lifting, so this costs nothing in speed
 * but guarantees the client always sees the latest data.
 */
function noStore(req, res, next) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
}

module.exports = { cacheRoute, invalidate, autoInvalidate, noStore, namespacesForPath, INVALIDATION_MAP };
