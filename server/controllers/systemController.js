const { getStatus } = require('../config/env');
const { getDbConnectionStatus } = require('../config/database');
const geminiService = require('../services/geminiService');
const weatherService = require('../services/weatherService');
const newsService = require('../services/newsService');
const marketService = require('../services/marketService');
const mongoose = require('mongoose');

/**
 * System and API setup status controllers.
 * Guaranteed never to expose real API keys or MongoDB connection strings.
 */

// GET /api/system/status
exports.getSystemStatus = async (req, res) => {
  const isDbConnected = getDbConnectionStatus() || (mongoose.connection.readyState === 1);
  if (!geminiService.isConnected && (process.env.GEMINI_API_KEY || getStatus().gemini.configured)) {
    try { await geminiService.verifyConnection(); } catch (e) {}
  }
  
  if (!weatherService.isConnected && (process.env.OPENWEATHER_API_KEY || getStatus().weather.configured)) {
    try { await weatherService.verifyConnection(); } catch (e) {}
  }

  if (!newsService.isConnected && (process.env.NEWS_API_KEY || getStatus().news.configured)) {
    try { await newsService.verifyConnection(); } catch (e) {}
  }

  if (!marketService.isConnected && (process.env.MARKET_API_KEY || getStatus().market.configured)) {
    try { await marketService.verifyConnection(); } catch (e) {}
  }

  const isGeminiConnected = geminiService.isConnected === true;
  const isWeatherConnected = weatherService.isConnected === true;
  const isNewsConnected = newsService.isConnected === true;
  const isMarketConnected = marketService.isConnected === true;

  const statusPayload = getStatus(isDbConnected, isGeminiConnected);
  // Only report true if the API key is actually validated successfully
  statusPayload.weather.configured = isWeatherConnected;
  statusPayload.news.configured = isNewsConnected;
  statusPayload.news.verified = isNewsConnected;
  
  statusPayload.market = {
    configured: isMarketConnected,
    verified: isMarketConnected,
    lastVerifiedAt: marketService.lastVerifiedAt || "",
    provider: "data.gov.in / AGMARKNET"
  };

  return res.status(200).json({
    success: true,
    data: statusPayload
  });
};

// GET /api/system/database-health
exports.getDatabaseHealth = (req, res) => {
  const isDbConnected = getDbConnectionStatus() || (mongoose.connection.readyState === 1);

  return res.status(200).json({
    success: true,
    connected: isDbConnected
  });
};
