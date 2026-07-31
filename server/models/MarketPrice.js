const mongoose = require('mongoose');

const MarketPriceSchema = new mongoose.Schema({
  productImage: {
    type: String,
    trim: true,
    default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'
  },
  commodity: {
    type: String,
    required: [true, 'Commodity name is required'],
    trim: true,
    index: true
  },
  variety: {
    type: String,
    trim: true,
    default: ''
  },
  localName: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'All',
      'Fruits',
      'Vegetables',
      'Flowers',
      'Seeds',
      'Grains',
      'Pulses',
      'Spices',
      'Oilseeds',
      'Plantation Crops',
      'Fertilizers',
      'Farming Tools',
      'Nursery Plants'
    ],
    trim: true,
    index: true
  },
  state: {
    type: String,
    trim: true,
    default: 'Tamil Nadu'
  },
  district: {
    type: String,
    required: [true, 'District name is required'],
    trim: true,
    index: true
  },
  market: {
    type: String,
    required: [true, 'Market name is required'],
    trim: true,
    index: true
  },
  arrivalDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  minimumPrice: {
    type: Number,
    required: [true, 'Minimum price is required'],
    min: 0
  },
  maximumPrice: {
    type: Number,
    required: [true, 'Maximum price is required'],
    min: 0
  },
  modalPrice: {
    type: Number,
    required: [true, 'Modal price is required'],
    min: 0
  },
  originalUnit: {
    type: String,
    trim: true,
    default: 'Quintal'
  },
  calculatedKgPrice: {
    type: Number,
    min: 0
  },
  sourceName: {
    type: String,
    trim: true,
    default: 'data.gov.in / AGMARKNET'
  },
  sourceUrl: {
    type: String,
    trim: true
  },
  dataType: {
    type: String,
    enum: ['external-api', 'cached-official', 'admin-updated', 'sample'],
    default: 'cached-official'
  },
  verified: {
    type: Boolean,
    default: false
  },
  fetchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Unique index to prevent duplicates
MarketPriceSchema.index({ state: 1, district: 1, market: 1, commodity: 1, variety: 1, arrivalDate: 1 }, { unique: true });

MarketPriceSchema.index({
  commodity: 'text',
  variety: 'text',
  localName: 'text',
  market: 'text',
  district: 'text',
  category: 'text'
});

module.exports = mongoose.model('MarketPrice', MarketPriceSchema);
