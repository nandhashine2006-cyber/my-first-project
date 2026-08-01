const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables from local .env or root
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env') });

const { connectDB } = require('./config/database');
const geminiService = require('./services/geminiService');
const newsService = require('./services/newsService');
const marketService = require('./services/marketService');
const errorHandler = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');
const apiRoutes = require('./routes/index');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminNotificationRoutes = require('./routes/adminNotificationRoutes');

const app = express();

app.set('trust proxy', 1);

const PORT = process.env.PORT || 5001;

// ==========================================
// 1. SECURITY & DATA PARSING MIDDLEWARES
// ==========================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow image loading across ports
}));

// CORS Configuration strictly allowing frontend port 5174
const clientURL = process.env.CLIENT_URL || 'http://localhost:5174';
app.use(cors({
  origin: [clientURL, 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting to prevent automated API abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP address, please try again after 15 minutes.'
  }
});
app.use('/api', limiter);

// Serve uploaded plant images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// 2. MOUNT CORE REST API ROUTES
// ==========================================
app.use('/api', apiRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);

// Root greeting endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to GROW GREEN, LIVE LONG - AI-Powered Smart Agriculture Platform Backend API',
    version: '2.0.0'
  });
});

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: "Grow Green Live Long API"
  });
});

// ==========================================
// 3. ERROR & 404 HANDLING MIDDLEWARES
// ==========================================
app.use(notFound);
app.use(errorHandler);

// ==========================================
// 4. DATABASE INITIALIZATION & SERVER START
// ==========================================
const startServer = async () => {
  const dbConnection = await connectDB();
  app.locals.dbConnected = !!dbConnection;

  await geminiService.verifyConnection();
  await newsService.verifyConnection();
  await marketService.verifyConnection();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n======================================================');
    console.log(`🌾 [GROW GREEN, LIVE LONG] Backend API Online`);
    console.log(`📡  Listening on Dedicated Port: http://0.0.0.0:${PORT}`);
    console.log(`🛡️  CORS Allowed Frontend Origin: ${clientURL}`);
    console.log('======================================================\n');
  });

  // Strict port binding: do NOT automatically switch ports at runtime
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`âŒ FATAL ERROR: Dedicated port ${PORT} is currently in use.`);
      console.error(`âŒ Per project requirements, automatic runtime port switching is disabled.`);
      console.error(`âŒ Please release port ${PORT} and restart the server.`);
      process.exit(1);
    } else {
      console.error('âŒ Server Listen Error:', err);
      process.exit(1);
    }
  });
};

startServer();

module.exports = app;
