const mongoose = require('mongoose');

const adminNotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['product-submitted', 'system-alert']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('AdminNotification', adminNotificationSchema);
