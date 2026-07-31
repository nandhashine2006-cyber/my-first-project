require('dotenv').config({ path: 'server/.env' });
const mongoose = require('mongoose');
const newsService = require('./server/services/newsService');
const { config } = require('./server/config/env');

async function testNews() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');
  
  const result = await newsService.getLatestNews('Tamil Nadu Agriculture', 5, 'en');
  console.log('Result Success:', result.success);
  console.log('Result IsLiveApi:', result.isLiveApi);
  console.log('Result Notice:', result.notice);
  console.log('Articles Found:', result.data.length);
  
  if (result.data.length > 0) {
    const sample = result.data[0];
    console.log('Sample Article:');
    console.log(`- Title: ${sample.title}`);
    console.log(`- Image: ${sample.newsImage || 'NONE'}`);
    console.log(`- Date: ${sample.publishedDate}`);
    console.log(`- Source: ${sample.sourceName}`);
  }

  // Check MongoDB
  const NewsArticle = require('./server/models/NewsArticle');
  const dbCount = await NewsArticle.countDocuments({ topic: 'Tamil Nadu Agriculture' });
  console.log(`DB Collection Count for topic: ${dbCount}`);
  
  await mongoose.disconnect();
}

testNews().catch(console.error);
