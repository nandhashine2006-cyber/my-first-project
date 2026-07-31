const express = require('express');
const router = express.Router();
const { login, logout, me } = require('../controllers/adminAuthController');
const { checkAdminAuth } = require('../middlewares/adminMiddleware');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', checkAdminAuth, me);

module.exports = router;
