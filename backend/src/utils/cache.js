const crypto = require('crypto');
const redisClient = require('../config/redis');

const PREFIX = process.env.CACHE_PREFIX || 'neuro';
const DEFAULT_TTL = parseInt(process.env.CACHE_TTL || '300', 10); // seconds
const CACHE_ENABLED = String(process.env.CACHE_ENABLED || 'true') !== 'false';


const NAMESPACES = [
  'doctors',
  'clinics',
  'services',
  'blogs',
  'offers',
  'reviews',
  'settings',
  'cms',
  'seo',
  'slots',
  'onboarding',
  'hero-banners'
];

const isUp = () => CACHE_ENABLED && redisClient && redisClient.isOpen;

const verKey = (ns) => `${PREFIX}:ver:${ns}`;

/**
 * Read a namespace's current version.
 * A missing key means version 0, so the very first INCR lands on 1 and
 * genuinely invalidates keys written at v0. (Treating "missing" as 1 was a
 * bug: the first bump would produce 1 as well, and nothing got invalidated.)
 *
 * Deliberately NOT memoised in-process. Under PM2 cluster / multiple
 * containers, an in-memory copy means one worker keeps serving stale data
 * after another worker invalidates. A Redis GET is sub-millisecond and we are
 * already making one for the payload.
 */
async function getVersion(ns) {
  if (!isUp()) return 0;
  try {
    const v = await redisClient.get(verKey(ns));
    return v ? parseInt(v, 10) : 0;
  } catch (e) {
    console.error(`[cache] getVersion(${ns}) failed:`, e.message);
    return 0;
  }
}

/** Bump one namespace => all its cached entries are dead immediately. */
async function bump(ns) {
  if (!isUp()) return false;
  try {
    await redisClient.incr(verKey(ns));
    return true;
  } catch (e) {
    console.error(`[cache] bump(${ns}) failed:`, e.message);
    return false;
  }
}

/** Bump many namespaces at once. */
async function bumpMany(namespaces = []) {
  const list = [...new Set(namespaces.filter(Boolean))];
  await Promise.all(list.map(bump));
  return list;
}

/** Nuke everything cacheable (keeps OTP keys alive). */
async function bumpAll() {
  return bumpMany(NAMESPACES);
}

function hash(str) {
  return crypto.createHash('md5').update(String(str)).digest('hex').slice(0, 16);
}

/** Build a fully-qualified, version-aware cache key. */
async function buildKey(ns, identity) {
  const v = await getVersion(ns);
  return `${PREFIX}:${ns}:v${v}:${hash(identity)}`;
}

async function get(key) {
  if (!isUp()) return null;
  try {
    const raw = await redisClient.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('[cache] get failed:', e.message);
    return null;
  }
}

async function set(key, value, ttl = DEFAULT_TTL) {
  if (!isUp()) return false;
  try {
    await redisClient.set(key, JSON.stringify(value), { EX: ttl });
    return true;
  } catch (e) {
    console.error('[cache] set failed:', e.message);
    return false;
  }
}

async function del(key) {
  if (!isUp()) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (e) {
    console.error('[cache] del failed:', e.message);
    return false;
  }
}

/** SCAN-based delete. Only used by the admin "hard clear" endpoint. */
async function delPattern(pattern) {
  if (!isUp()) return 0;
  let cursor = 0;
  let removed = 0;
  try {
    do {
      const reply = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 300 });
      cursor = Number(reply.cursor);
      const keys = reply.keys || [];
      if (keys.length) {
        await redisClient.del(keys);
        removed += keys.length;
      }
    } while (cursor !== 0);
  } catch (e) {
    console.error('[cache] delPattern failed:', e.message);
  }
  return removed;
}

/** Count live cache keys (for the status endpoint). */
async function countKeys(pattern = `${PREFIX}:*`) {
  if (!isUp()) return 0;
  let cursor = 0;
  let total = 0;
  try {
    do {
      const reply = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 500 });
      cursor = Number(reply.cursor);
      total += (reply.keys || []).length;
    } while (cursor !== 0);
  } catch (e) {
    console.error('[cache] countKeys failed:', e.message);
  }
  return total;
}

/**
 * remember(ns, identity, ttl, producer)
 * Returns cached value if present, otherwise runs producer() and caches it.
 */
async function remember(ns, identity, ttl, producer) {
  if (!isUp()) return { value: await producer(), hit: false };
  const key = await buildKey(ns, identity);
  const cached = await get(key);
  if (cached !== null && cached !== undefined) return { value: cached, hit: true, key };
  const value = await producer();
  await set(key, value, ttl);
  return { value, hit: false, key };
}

module.exports = {
  PREFIX,
  DEFAULT_TTL,
  NAMESPACES,
  isUp,
  buildKey,
  get,
  set,
  del,
  delPattern,
  countKeys,
  bump,
  bumpMany,
  bumpAll,
  remember
};
