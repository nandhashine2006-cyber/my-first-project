const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/adminNotificationController');
const { checkAdminAuth } = require('../middlewares/adminMiddleware');

// All notification routes are protected by admin auth
router.use(checkAdminAuth);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;
