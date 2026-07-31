const mongoose = require('mongoose');

const NewsArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Article title is required'],
    trim: true
  },
  summary: {
    type: String,
    required: [true, 'Summary is required'],
    trim: true
  },
  newsImage: {
    type: String,
    trim: true,
    default: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=600'
  },
  sourceName: {
    type: String,
    required: [true, 'News source name is required'],
    trim: true
  },
  publishedDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  originalUrl: {
    type: String,
    required: [true, 'Original news URL link is required'],
    trim: true
  },
  topic: {
    type: String,
    enum: [
      'Tamil Nadu agriculture',
      'Indian farmers',
      'Crop updates',
      'Government schemes',
      'Weather alerts',
      'Market updates',
      'Irrigation',
      'Fertilizers',
      'Agricultural technology',
      'General',
      'Agriculture',
      'Farming',
      'Crops',
      'Government Schemes',
      'Weather Alerts',
      'Organic Farming'
    ],
    default: 'Tamil Nadu agriculture',
    index: true,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for quick chronological feeds and category filtering
NewsArticleSchema.index({ publishedDate: -1, topic: 1 });
NewsArticleSchema.index({ title: 'text', summary: 'text' });

module.exports = mongoose.model('NewsArticle', NewsArticleSchema);
