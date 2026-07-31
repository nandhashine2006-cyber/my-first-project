const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');

router.get('/', marketController.getPrices);
router.post('/', marketController.createPrice);
router.put('/:id', marketController.updatePrice);
router.delete('/:id', marketController.deletePrice);

module.exports = router;
