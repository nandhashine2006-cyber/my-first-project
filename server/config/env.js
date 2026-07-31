const path = require('path');
// Safely load environment variables from server/.env or fallback to root .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config();

/**
 * Environment variables configuration and safe validation module.
 * Never exposes real secret values in logs or API responses.
 */
const config = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5174',

  mongoUri: process.env.MONGODB_URI || '',
  mongoDnsServers: process.env.MONGODB_DNS_SERVERS || '',

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  },

  weather: {
    apiKey: process.env.OPENWEATHER_API_KEY || '',
  },

  news: {
    provider: process.env.NEWS_PROVIDER || 'gnews',
    apiKey: process.env.NEWS_API_KEY || '',
    baseUrl: process.env.NEWS_API_BASE_URL || 'https://gnews.io/api/v4',
  },

  market: {
    apiUrl: process.env.MARKET_API_URL || '',
    apiKey: process.env.MARKET_API_KEY || '',
  },

  adminSecret: process.env.ADMIN_SECRET || 'supersecretgrowgreen2026',
};

/**
 * Validates that a key is present and genuine in server/.env, not just empty or a sample placeholder text.
 */
const isValidKey = (val) => {
  if (!val || typeof val !== 'string' || val.trim() === '') return false;
  const lower = val.trim().toLowerCase();
  const placeholders = ['your_', 'placeholder', 'api_key_here', 'null', 'undefined', 'test_key'];
  for (const p of placeholders) {
    if (lower.includes(p) || lower === p) return false;
  }
  return true;
};

/**
 * Safe status check that reports configuration booleans without disclosing secrets or falsely claiming APIs are connected without real keys.
 */
const getStatus = (dbConnected = false, geminiConnected = false) => {
  return {
    database: {
      configured: isValidKey(config.mongoUri) && config.mongoUri.startsWith('mongodb'),
      connected: dbConnected
    },
    gemini: {
      configured: isValidKey(config.gemini.apiKey) || isValidKey(process.env.GEMINI_API_KEY),
      connected: geminiConnected
    },
    weather: {
      configured: isValidKey(config.weather.apiKey)
    },
    news: {
      configured: isValidKey(config.news.apiKey)
    },
    market: {
      configured: isValidKey(config.market.apiUrl) && isValidKey(config.market.apiKey)
    }
  };
};

module.exports = {
  config,
  getStatus,
  isValidKey
};
