const geminiService = require('../services/geminiService');
const PlantAnalysis = require('../models/PlantAnalysis');
const mongoose = require('mongoose');

/**
 * Plant Doctor Controller
 * Handles AI image uploads, Gemini evaluations, and MongoDB diagnostic logging
 */
exports.analyzePlant = async (req, res, next) => {
  try {
    const description = req.body.problemDescription || req.body.description || '';
    const language = req.body.language || 'en';
    const file = req.file;

    if (!file && !req.body.imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image file of the plant leaf or crop for AI diagnosis.'
      });
    }

    const filePath = file ? file.path : null;
    const mimeType = file ? file.mimetype : 'image/jpeg';
    const imageUrl = file ? `/uploads/${file.filename}` : req.body.imageUrl;

    // Execute Gemini evaluation in background without exposing API secrets
    const aiResult = await geminiService.analyzePlantImage(filePath, mimeType, description, language);
    
    if (!aiResult.success) {
      return res.status(200).json({
        success: false,
        message: aiResult.message || 'AI analysis timed out. Please try again with a smaller or clearer image.',
        aiSource: aiResult.aiSource,
        isFallback: aiResult.isFallback
      });
    }

    const aiData = aiResult.data;

    // Check if uploaded image was rejected as not a plant
    if (!aiData.isPlantImage) {
      return res.status(200).json({
        success: true,
        isPlantImage: false,
        message: 'The uploaded image does not appear to be a plant, crop, leaf, or soil pathology. Please capture a clear photograph of an agricultural crop.'
      });
    }

    // Format final structure for frontend response & database persistence
    const analysisPayload = {
      imageUrl: imageUrl,
      problemDescription: description,
      plantName: aiData.plantName || 'Unknown Crop',
      scientificName: aiData.scientificName || 'N/A',
      healthStatus: aiData.healthStatus || 'Checked',
      possibleDisease: aiData.possibleDisease || 'None Identified',
      confidenceScore: aiData.confidence || 85,
      diseaseSeverity: aiData.severity || 'Low',
      visibleSymptoms: aiData.visibleSymptoms || [],
      possibleCauses: aiData.possibleCauses || [],
      organicTreatment: aiData.organicTreatment || [],
      chemicalTreatment: aiData.chemicalTreatment || [],
      preventionMethods: aiData.preventionSteps || [],
      fertilizerAdvice: Array.isArray(aiData.fertilizerAdvice) ? aiData.fertilizerAdvice.join('. ') : (aiData.fertilizerAdvice || ''),
      wateringAdvice: Array.isArray(aiData.wateringAdvice) ? aiData.wateringAdvice.join('. ') : (aiData.wateringAdvice || ''),
      expertConsultationWarning: aiData.whenToConsultExpert || 'Consult regional agricultural officers if disease spreads.',
      analysisLimitation: aiData.analysisLimitations || 'AI estimation based on visible evidence; not a guaranteed laboratory test.',
      aiSource: aiResult.aiSource,
      isFallback: aiResult.isFallback,
      notice: aiResult.notice || null
    };

    // Store successful diagnostic record into MongoDB Atlas if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const savedDoc = await PlantAnalysis.create(analysisPayload);
        console.log('[PlantDoctor] Diagnosis saved to MongoDB');
        return res.status(200).json({
          success: true,
          aiSource: aiResult.aiSource,
          isFallback: aiResult.isFallback,
          notice: aiResult.notice,
          data: savedDoc
        });
      } catch (dbError) {
        console.warn('⚠️ Could not archive analysis to MongoDB, delivering result to frontend:', dbError.message);
      }
    }

    // Return immediate analysis even in offline preview mode
    return res.status(200).json({
      success: true,
      aiSource: aiResult.aiSource,
      isFallback: aiResult.isFallback,
      notice: aiResult.notice,
      data: analysisPayload
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get recent analysis history from MongoDB
 */
exports.getHistory = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        offline: true,
        data: []
      });
    }

    const history = await PlantAnalysis.find().sort({ createdAt: -1 }).limit(30);
    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific diagnosis record by ID
 */
exports.getAnalysisById = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(404).json({ success: false, message: 'Database disconnected or record not found.' });
    }
    const record = await PlantAnalysis.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Plant diagnostic analysis record not found.' });
    }
    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a historical analysis record by ID
 */
exports.deleteAnalysis = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(400).json({ success: false, message: 'Database currently disconnected.' });
    }
    await PlantAnalysis.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Diagnosis record deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
