const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  socket: {
    // keep trying to come back if Redis restarts, instead of dying silently
    reconnectStrategy: (retries) => {
      if (retries > 20) {
        console.error('❌ Redis: giving up after 20 reconnect attempts (running without cache).');
        return false;
      }
      return Math.min(retries * 200, 3000);
    }
  }
});

redisClient.on('error', (err) => console.error('❌ Redis error:', err.message));
redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('reconnecting', () => console.log('… Redis reconnecting'));
redisClient.on('ready', () => console.log('✅ Redis ready — caching enabled'));
redisClient.on('end', () => console.log('⚠️  Redis connection closed — falling back to direct DB reads'));

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('❌ Redis connect failed (OTP/cache will fallback to DB):', err.message);
  }
})();

module.exports = redisClient;
