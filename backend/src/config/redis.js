const { createClient } = require('redis');
require('dotenv').config();

const isCacheEnabled = String(process.env.CACHE_ENABLED || 'true') !== 'false';
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let redisClient = null;

if (isCacheEnabled) {
  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          console.warn('⚠️  Redis: giving up after 5 reconnect attempts (running safely without cache).');
          return false;
        }
        return Math.min(retries * 200, 2000);
      }
    }
  });

  redisClient.on('error', (err) => {
    // Log once without spamming
    if (process.env.DEBUG_REDIS === 'true') {
      console.warn('⚠️  Redis warning:', err.message);
    }
  });
  redisClient.on('connect', () => console.log('✅ Redis connected'));
  redisClient.on('ready', () => console.log('✅ Redis ready — caching enabled'));
  redisClient.on('end', () => console.log('⚠️  Redis connection closed — falling back to direct DB reads'));

  (async () => {
    try {
      await redisClient.connect();
    } catch (err) {
      console.warn('⚠️  Redis connect failed (OTP & routes will query MySQL directly):', err.message);
    }
  })();
} else {
  console.log('ℹ️  Redis cache is disabled via CACHE_ENABLED=false');
}

// Fallback dummy object if Redis is disabled or uninitialized
const fallbackClient = {
  isOpen: false,
  get: async () => null,
  set: async () => false,
  del: async () => false,
  incr: async () => 0
};

module.exports = redisClient || fallbackClient;
