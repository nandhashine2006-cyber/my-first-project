const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const productUploadMiddleware = require('../middlewares/productUploadMiddleware');
const { checkAdminAuth } = require('../middlewares/adminMiddleware');

// Public routes
router.post('/', productUploadMiddleware, productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// User / Admin routes
// Normally, update status might be user-protected, but we'll assume admin for now,
// per requirement: "Only admin routes may change approvalStatus."
// and "Protect admin write routes using the existing secure admin protection."
router.patch('/:id/status', checkAdminAuth, productController.updateProductStatus);
router.patch('/:id/approval', checkAdminAuth, productController.updateProductApproval);
router.put('/:id', checkAdminAuth, productController.updateProduct);
router.delete('/:id', checkAdminAuth, productController.deleteProduct);

module.exports = router;
