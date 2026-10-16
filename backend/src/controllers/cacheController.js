const redisClient = require('../config/redis');
const cache = require('../utils/cache');

// POST /api/admin/cache/clear
// Body (optional): { namespaces: ["doctors","services"], hard: true }
//  - no body            -> invalidates ALL cache namespaces (instant, version bump)
//  - { namespaces: [] } -> invalidates only those namespaces
//  - { hard: true }     -> physically deletes every dhic:* key from Redis
//                          (OTP keys use their own prefix and survive)
exports.clearCache = async (req, res) => {
  try {
    if (!cache.isUp()) {
      return res.json({
        success: true,
        message: 'Redis is not connected — nothing to clear.',
        redisCleared: false
      });
    }

    const { namespaces, hard } = req.body || {};

    if (hard) {
      const removed = await cache.delPattern(`${cache.PREFIX}:*`);
      await cache.bumpAll();
      return res.json({
        success: true,
        message: `Hard cache clear done. ${removed} keys removed.`,
        redisCleared: true,
        keysRemoved: removed
      });
    }

    const list =
      Array.isArray(namespaces) && namespaces.length
        ? await cache.bumpMany(namespaces)
        : await cache.bumpAll();

    return res.json({
      success: true,
      message: `Cache invalidated for: ${list.join(', ')}`,
      redisCleared: true,
      namespaces: list
    });
  } catch (err) {
    console.error('Cache clear failed:', err);
    res.status(500).json({ success: false, message: 'Failed to clear cache' });
  }
};

// GET /api/admin/cache/status
exports.getCacheStatus = async (req, res) => {
  try {
    const connected = !!(redisClient && redisClient.isOpen);
    let keys = 0;
    const versions = {};

    if (connected) {
      keys = await cache.countKeys(`${cache.PREFIX}:*`);
      for (const ns of cache.NAMESPACES) {
        const v = await redisClient.get(`${cache.PREFIX}:ver:${ns}`);
        versions[ns] = v ? parseInt(v, 10) : 1;
      }
    }

    res.json({
      success: true,
      redisConnected: connected,
      cacheEnabled: cache.isUp(),
      prefix: cache.PREFIX,
      defaultTtl: cache.DEFAULT_TTL,
      totalKeys: keys,
      namespaces: cache.NAMESPACES,
      versions
    });
  } catch (err) {
    console.error('Cache status failed:', err);
    res.status(500).json({ success: false, message: 'Failed to read cache status' });
  }
};

// POST /api/admin/cache/clear/:namespace  - clear one group quickly
exports.clearNamespace = async (req, res) => {
  const ns = req.params.namespace;
  if (!cache.NAMESPACES.includes(ns)) {
    return res.status(400).json({
      success: false,
      message: `Unknown namespace "${ns}". Valid: ${cache.NAMESPACES.join(', ')}`
    });
  }
  await cache.bump(ns);
  res.json({ success: true, message: `Cache invalidated for "${ns}"`, namespace: ns });
};
