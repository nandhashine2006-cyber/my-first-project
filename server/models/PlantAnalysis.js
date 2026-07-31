const mongoose = require('mongoose');

const PlantAnalysisSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: [true, 'Image URL or file path is required'],
    trim: true,
  },
  problemDescription: {
    type: String,
    trim: true,
    default: '',
  },
  plantName: {
    type: String,
    required: [true, 'Plant name is required'],
    trim: true,
  },
  scientificName: {
    type: String,
    trim: true,
    default: 'N/A',
  },
  healthStatus: {
    type: String,
    required: true,
    trim: true,
  },
  possibleDisease: {
    type: String,
    trim: true,
    default: 'None',
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 85,
  },
  diseaseSeverity: {
    type: String,
    enum: ['None', 'Low', 'Medium', 'High', 'Critical'],
    default: 'Low',
  },
  visibleSymptoms: [{
    type: String,
    trim: true,
  }],
  possibleCauses: [{
    type: String,
    trim: true,
  }],
  organicTreatment: [{
    type: String,
    trim: true,
  }],
  chemicalTreatment: [{
    type: String,
    trim: true,
  }],
  preventionMethods: [{
    type: String,
    trim: true,
  }],
  fertilizerAdvice: {
    type: String,
    trim: true,
    default: 'Maintain balanced NPK fertilization.',
  },
  wateringAdvice: {
    type: String,
    trim: true,
    default: 'Water regularly according to crop needs; ensure good drainage.',
  },
  expertConsultationWarning: {
    type: String,
    trim: true,
    default: 'If symptoms persist or spread rapidly, please consult a regional agricultural extension officer in Tamil Nadu.',
  },
  analysisLimitation: {
    type: String,
    trim: true,
    default: 'Diagnosis is based only on visible image evidence and AI estimation. Not guaranteed to be 100% accurate.',
  }
}, {
  timestamps: true
});

// Indexes for fast retrieval by health status and creation timeline
PlantAnalysisSchema.index({ createdAt: -1 });
PlantAnalysisSchema.index({ plantName: 1, healthStatus: 1 });

module.exports = mongoose.model('PlantAnalysis', PlantAnalysisSchema);
