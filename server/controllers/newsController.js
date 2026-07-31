const newsService = require('../services/newsService');
const NewsArticle = require('../models/NewsArticle');
const mongoose = require('mongoose');

/**
 * News Controller
 * Returns verified agriculture updates without fabricating real-time stories.
 */

// GET /api/news
exports.getNews = async (req, res, next) => {
  try {
    const topic = req.query.category || req.query.topic || 'Tamil Nadu agriculture';
    const limit = parseInt(req.query.limit, 10) || 12;
    const lang = req.query.language || req.query.lang || 'en';

    const result = await newsService.getLatestNews(topic, limit, lang);
    return res.status(200).json(result);

  } catch (error) {
    next(error);
  }
};
