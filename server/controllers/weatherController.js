const weatherService = require('../services/weatherService');

/**
 * Weather Controller
 * Handles place searches and GPS coordinate weather lookups safely.
 */

// GET /api/weather/search?place=Salem
exports.searchWeather = async (req, res, next) => {
  try {
    const place = req.query.place || req.query.city || 'Salem';
    if (!place || typeof place !== 'string' || place.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Tamil Nadu district or place name.'
      });
    }

    const weatherOutcome = await weatherService.getWeatherByPlace(place);
    return res.status(200).json(weatherOutcome);

  } catch (error) {
    next(error);
  }
};

// GET /api/weather/coordinates?lat=11.66&lon=78.14
exports.getCoordinateWeather = async (req, res, next) => {
  try {
    const { lat, lon } = req.query;

    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);

    if (isNaN(parsedLat) || isNaN(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GPS coordinates provided. Latitude must be between -90 and 90, and longitude between -180 and 180.'
      });
    }

    const weatherOutcome = await weatherService.getWeatherByCoordinates(parsedLat, parsedLon);
    return res.status(200).json(weatherOutcome);

  } catch (error) {
    next(error);
  }
};
