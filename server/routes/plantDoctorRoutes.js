const express = require('express');
const router = express.Router();
const plantDoctorController = require('../controllers/plantDoctorController');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

// Accept image file uploaded under field name 'image' or 'plantImage'
const flexibleUpload = (req, res, next) => {
  uploadMiddleware.any()(req, res, (err) => {
    if (err) return next(err);
    if (req.files && req.files.length > 0) {
      req.file = req.files[0]; // Map first image to req.file for controller
    }
    next();
  });
};

router.post('/analyze', flexibleUpload, plantDoctorController.analyzePlant);
router.get('/history', plantDoctorController.getHistory);
router.get('/history/:id', plantDoctorController.getAnalysisById);
router.delete('/history/:id', plantDoctorController.deleteAnalysis);

module.exports = router;
