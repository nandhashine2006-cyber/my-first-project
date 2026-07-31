const mongoose = require('mongoose');
const newsService = require('./server/services/newsService');
const geminiService = require('./server/services/geminiService');
const { config } = require('./server/config/env');

async function test() {
  await mongoose.connect(config.mongoUri);
  await geminiService.verifyConnection();
  console.log('Gemini connected:', geminiService.isConnected);
  const result = await newsService.getLatestNews('Agriculture', 2, 'en');
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
test().catch(console.error);
