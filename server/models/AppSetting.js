const mongoose = require('mongoose');

const AppSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'Setting key name is required'],
    unique: true,
    trim: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Setting value is required']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  updatedBy: {
    type: String,
    trim: true,
    default: 'Admin'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AppSetting', AppSettingSchema);
