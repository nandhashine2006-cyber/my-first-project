const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/search', weatherController.searchWeather);
router.get('/coordinates', weatherController.getCoordinateWeather);

module.exports = router;
