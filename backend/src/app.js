const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const patientRoutes = require('./routes/patientRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cofounderRoutes = require('./routes/cofounderRoutes');
const receptionistAuthRoutes = require('./routes/receptionistAuthRoutes');
const paymentController = require('./controllers/paymentController');
const { noStore } = require('./middleware/cache');
const cache = require('./utils/cache');
const { imageUrls } = require('./middleware/imageUrl');

const app = express();

app.set('trust proxy', 1);

const clientUrls = (process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const adminUrls = (process.env.ADMIN_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const defaultOrigins = [
  "https://drneerajkumarneurologist.com",
  "https://www.drneerajkumarneurologist.com",
  "https://admin.drneerajkumarneurologist.com",
  "https://api.drneerajkumarneurologist.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3028",
  "http://localhost:5173",
  "http://localhost:5000",
];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...clientUrls, ...adminUrls]));

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without Origin header (e.g. Postman, mobile apps, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/+$/, "");

      // In development or when explicitly allowed, accept localhost on any port
      if (process.env.NODE_ENV !== "production" && /^http:\/\/localhost(:\d+)?$/.test(cleanOrigin)) {
        return callback(null, true);
      }

      // Check exact match in configured list
      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      // Check domain match ignoring www
      const isAllowed = allowedOrigins.some((allowed) => {
        try {
          const uAllowed = new URL(allowed);
          const uOrigin = new URL(cleanOrigin);
          const hAllowed = uAllowed.hostname.replace(/^www\./, "");
          const hOrigin = uOrigin.hostname.replace(/^www\./, "");
          return hAllowed === hOrigin && uAllowed.protocol === uOrigin.protocol;
        } catch (_) {
          return false;
        }
      });

      if (isAllowed) {
        return callback(null, true);
      }

      console.warn(`[CORS] Rejected origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(morgan('dev'));

// Never let the browser / Next.js fetch cache / CDN hold an old API response.
app.use('/api', noStore);

// Razorpay webhook needs raw body BEFORE json parser
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode < 400) cache.bumpMany(['slots']).catch(() => {});
    });
    next();
  },
  paymentController.webhook
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// DB stores image PATHS only; API responses get API_IMAGE_URL + path (see middleware/imageUrl.js)
app.use('/api', imageUrls);

// Serve locally-uploaded files (used when Cloudinary keys are not configured — see config/cloudinary.js)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/', (req, res) => res.json({ success: true, message: '🚀 API running ✅' }));
app.get('/api/health', (req, res) =>
  res.json({ success: true, status: 'ok', time: new Date(), cache: cache.isUp() ? 'redis' : 'off' })
);

app.use('/api/auth', authRoutes);
app.use('/api/reception/auth', receptionistAuthRoutes);
app.use('/api', publicRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cofounder', cofounderRoutes);

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

module.exports = app;
