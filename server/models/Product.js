const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  farmerName: {
    type: String,
    required: [true, 'Farmer name is required'],
    trim: true
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile contact number is required'],
    trim: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than zero']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0.01, 'Selling price must be greater than zero']
  },
  marketPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  village: {
    type: String,
    required: [true, 'Village is required'],
    trim: true,
    index: true
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true,
    index: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Product image is required'],
    trim: true
  },
  harvestDate: {
    type: Date,
    default: Date.now
  },
  availableUntil: {
    type: Date,
    required: [true, 'Available until date is required']
  },
  isOrganic: {
    type: Boolean,
    default: false
  },
  preferredContactMethod: {
    type: String,
    enum: ['phone', 'whatsapp', 'both'],
    default: 'phone'
  },
  selectedLanguage: {
    type: String,
    default: 'en'
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'expired'],
    default: 'available',
    index: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for regular queries
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ category: 1, district: 1 });

// Text index for search
ProductSchema.index({
  productName: 'text',
  description: 'text',
  village: 'text',
  district: 'text'
});

module.exports = mongoose.model('Product', ProductSchema);
