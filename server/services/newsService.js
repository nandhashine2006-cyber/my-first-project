const axios = require('axios');
const mongoose = require('mongoose');
const NewsArticle = require('../models/NewsArticle');
const { config } = require('../config/env');
const geminiService = require('./geminiService');

/**
 * Service to aggregate authentic agricultural news from GNews provider and archive in MongoDB.
 * Strictly prevents generating fake or fabricated news using AI.
 */
class NewsService {
  constructor() {
    this.apiKey = config.news.apiKey;
    this.baseUrl = config.news.baseUrl || 'https://gnews.io/api/v4';
    this.isConnected = false;
    this.refreshInterval = null;
  }

  /**
   * Validate the API key using the official GNews API
   */
  async verifyConnection() {
    if (!this.apiKey) {
      this.isConnected = false;
      return false;
    }
    try {
      const testUrl = `${this.baseUrl}/search?q=agriculture&lang=en&max=1&apikey=${this.apiKey}`;
      const response = await axios.get(testUrl, { timeout: 5000 });
      if (response.status === 200) {
        this.isConnected = true;
        this.startAutoRefresh();
        return true;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.error('⚠️ [GNews Validation Error]: Invalid API key.');
      } else if (error.response?.status === 403) {
        console.error('⚠️ [GNews Validation Error]: Daily quota exceeded.');
      } else {
        console.error('⚠️ [GNews Validation Error]:', error.message);
      }
      this.isConnected = false;
      return false;
    }
    this.isConnected = false;
    return false;
  }

  /**
   * Refresh automatically every 30 minutes
   */
  startAutoRefresh() {
    if (this.refreshInterval) return;
    this.refreshInterval = setInterval(async () => {
      if (this.isConnected && mongoose.connection.readyState === 1) {
        console.log('🔄 [News Auto-Refresh] Fetching latest agriculture news...');
        const categories = ['Agriculture', 'Farming', 'Crops', 'Government Schemes', 'Weather Alerts', 'Organic Farming'];
        for (const cat of categories) {
           await this.getLatestNews(cat, 5);
        }
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  /**
   * Helper to fetch and parse GNews API
   */
  async fetchGNewsApi(query, lang, limit, topic) {
    const url = `${this.baseUrl}/search?q=${query}&lang=${lang}&max=${limit}&apikey=${this.apiKey}`;
    const response = await axios.get(url, { timeout: 15000 });
    
    if (response.data && Array.isArray(response.data.articles)) {
      const rawArticles = response.data.articles;
      const seenUrls = new Set();
      let cleanArticles = [];

      for (const item of rawArticles) {
        if (item.url && item.source?.name && item.publishedAt && !seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          
          let imgUrl = item.image;
          if (!imgUrl || imgUrl.includes('no-image') || imgUrl.includes('placeholder')) {
            imgUrl = ''; // We will handle fallback on frontend
          }

          const formatted = {
            title: item.title || 'Untitled Agricultural Report',
            summary: item.description || item.content || 'Click below to view full published article details.',
            newsImage: imgUrl,
            sourceName: item.source?.name || 'Trusted News Provider',
            publishedDate: item.publishedAt ? new Date(item.publishedAt) : new Date(),
            originalUrl: item.url,
            topic: topic
          };
          cleanArticles.push(formatted);
        }
      }
      return cleanArticles;
    }
    return [];
  }

  /**
   * Fetch latest verified news articles
   */
  async getLatestNews(topic = 'Tamil Nadu Agriculture', limit = 12, lang = 'en') {
    // Attempt fetching live news from GNews if configured
    if (this.apiKey) {
      try {
        let queries = [];
        
        switch(topic) {
          case 'Agricultural Technology':
            queries = [
              encodeURIComponent('Agricultural Technology agriculture OR farming'),
              encodeURIComponent('"agriculture technology India"'),
              encodeURIComponent('"agri technology"'),
              encodeURIComponent('"farm technology"')
            ];
            break;
          case 'Weather Alerts':
            queries = [
              encodeURIComponent('Weather Alerts agriculture OR farming'),
              encodeURIComponent('"India weather agriculture"'),
              encodeURIComponent('"monsoon agriculture"'),
              encodeURIComponent('"rainfall Tamil Nadu"')
            ];
            break;
          case 'Government Schemes':
            queries = [
              encodeURIComponent('Government Schemes agriculture OR farming'),
              encodeURIComponent('"agriculture subsidy"'),
              encodeURIComponent('"PM Kisan"'),
              encodeURIComponent('"Tamil Nadu agriculture scheme"')
            ];
            break;
          case 'Organic Farming':
            queries = [
              encodeURIComponent('Organic Farming agriculture OR farming'),
              encodeURIComponent('"organic farming India"'),
              encodeURIComponent('"natural farming"'),
              encodeURIComponent('"zero budget farming"')
            ];
            break;
          case 'Tamil Nadu Agriculture':
            queries = [
              encodeURIComponent('Tamil Nadu Agriculture agriculture OR farming'),
              encodeURIComponent('"Tamil Nadu agriculture"'),
              encodeURIComponent('"Tamil Nadu farmers"')
            ];
            break;
          case 'General':
            queries = [encodeURIComponent('agriculture OR "Indian farmers" OR "Tamil Nadu"')];
            break;
          default:
            queries = [encodeURIComponent(topic + ' agriculture OR farming')];
            break;
        }

        let cleanArticles = [];
        for (const q of queries) {
          cleanArticles = await this.fetchGNewsApi(q, lang, limit, topic);
          if (cleanArticles.length > 0) {
            break; // Stop searching if we found articles
          }
        }

        if (cleanArticles.length > 0) {
          // Delete old articles for this topic to replace them
          if (mongoose.connection.readyState === 1) {
            await NewsArticle.deleteMany({ topic: topic });
          }

          // Summarize/Translate using Gemini
          if (geminiService.isConnected) {
            try {
              const descriptions = cleanArticles.map((a, i) => `[${i}] Title: ${a.title}\nDescription: ${a.summary}`).join('\n\n');
              const prompt = `You are an expert AI translator. Translate and summarize these news items into language code '${lang}'. Keep each summary under 2 sentences. Return strictly a JSON array of strings where each string is the translated summary for the corresponding index. Do not return markdown or commentary, just the JSON array:\n\n${descriptions}`;
              
              const model = geminiService.genAI.getGenerativeModel({ model: geminiService.modelName });
              const aiResult = await model.generateContent(prompt);
              const aiResponse = await aiResult.response.text();
              const summariesArray = geminiService.parseCleanJson(aiResponse);
              
              if (Array.isArray(summariesArray) && summariesArray.length === cleanArticles.length) {
                cleanArticles = cleanArticles.map((article, i) => {
                  article.summary = summariesArray[i] + ' ✨ (AI Summarized)';
                  return article;
                });
              }
            } catch (err) {
              console.error('⚠️ [Gemini Summarize Error]:', err.message);
            }
          }

          // Save fresh articles
          if (mongoose.connection.readyState === 1) {
            await NewsArticle.insertMany(cleanArticles).catch(() => {});
          }

          return {
            success: true,
            isLiveApi: true,
            data: cleanArticles.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate))
          };
        }
      } catch (error) {
        if (error.response?.status === 401) {
          console.error('⚠️ [GNews API Execution Notice]: Invalid API key safely reported.');
        } else if (error.response?.status === 403) {
          console.error('⚠️ [GNews API Execution Notice]: Daily quota exceeded safely reported.');
        } else {
          console.error('⚠️ [GNews API Execution Notice]:', error.message);
        }
      }
    }

    // Fallback: If API key is blank or provider rate limited, serve cached verified items from MongoDB
    if (mongoose.connection.readyState === 1) {
      const cachedNews = await NewsArticle.find({ topic: topic }).sort({ publishedDate: -1 }).limit(limit);
      if (cachedNews.length > 0) {
        return {
          success: true,
          isLiveApi: false,
          notice: "Offline mode - displaying last synchronized verified news.",
          data: cachedNews
        };
      }
    }

    // If zero news in database and API is unconfigured, provide clean notice without fake AI news
    if (!this.apiKey) {
      return {
        success: true,
        isLiveApi: false,
        notice: "News API is not configured. Add NEWS_API_KEY to server/.env.",
        data: []
      };
    }

    return {
      success: true,
      isLiveApi: false,
      notice: "",
      data: []
    };
  }
}

module.exports = new NewsService();
