const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');

// Import modular routers
const plantDoctorRoutes = require('./plantDoctorRoutes');
const weatherRoutes = require('./weatherRoutes');
const newsRoutes = require('./newsRoutes');
const marketRoutes = require('./marketRoutes');
const systemRoutes = require('./systemRoutes');
const productRoutes = require('./productRoutes');
const { checkAdminAuth } = require('../middlewares/adminMiddleware');

// Mount modular sub-routers
router.use('/plant-doctor', plantDoctorRoutes);
router.use('/weather', weatherRoutes);
router.use('/news', newsRoutes);
router.use('/market-prices', marketRoutes);
router.use('/system', systemRoutes);
router.use('/products', productRoutes);

// ==========================================
// HEALTH CHECK ENDPOINT
// ==========================================
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ONLINE',
      platform: 'Grow Green, Live Long',
      timestamp: new Date().toISOString()
    }
  });
});

// Admin auth middleware is imported from ../middlewares/adminMiddleware

router.get('/admin/stats', checkAdminAuth, async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        totalDiagnoses: 24,
        totalProductsListed: 18,
        activeMarketsTracked: 14,
        serverUptime: process.uptime()
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
