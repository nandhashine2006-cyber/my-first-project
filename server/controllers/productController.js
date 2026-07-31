const Product = require('../models/Product');
const AdminNotification = require('../models/AdminNotification');
const path = require('path');
const fs = require('fs');

// Helper to auto-expire products
const autoExpireProducts = async () => {
  try {
    const now = new Date();
    await Product.updateMany(
      { availableUntil: { $lt: now }, status: { $ne: 'expired' } },
      { $set: { status: 'expired' } }
    );
  } catch (error) {
    console.error('Error auto-expiring products:', error);
  }
};

// @desc    Create a new product listing
// @route   POST /api/products
// @access  Public
const createProduct = async (req, res) => {
  try {
    const {
      farmerName,
      mobileNumber,
      productName,
      category,
      description,
      quantity,
      unit,
      sellingPrice,
      marketPrice,
      village,
      district,
      address,
      harvestDate,
      availableUntil,
      isOrganic,
      preferredContactMethod,
      selectedLanguage
    } = req.body;

    // Check for uploaded file
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Product image is required' });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;

    const newProduct = await Product.create({
      farmerName,
      mobileNumber,
      productName,
      category,
      description,
      quantity,
      unit,
      sellingPrice,
      marketPrice,
      village,
      district,
      address,
      imageUrl,
      harvestDate: harvestDate ? new Date(harvestDate) : Date.now(),
      availableUntil: new Date(availableUntil),
      isOrganic: isOrganic === 'true' || isOrganic === true,
      preferredContactMethod: preferredContactMethod || 'phone',
      selectedLanguage: selectedLanguage || 'en',
      status: 'available',
      approvalStatus: 'pending',
      views: 0
    });

    // Create an admin notification for the new submission
    try {
      await AdminNotification.create({
        type: 'product-submitted',
        title: 'New product awaiting approval',
        message: `${newProduct.farmerName} submitted ${newProduct.productName} for approval from ${newProduct.village}.`,
        productId: newProduct._id
      });
    } catch (notifErr) {
      console.warn('Could not create admin notification:', notifErr);
    }

    res.status(201).json({
      success: true,
      data: newProduct,
      message: 'Product submitted successfully and is waiting for admin approval.'
    });
  } catch (error) {
    console.error('Create product error:', error);
    // If error, delete uploaded file if it exists
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file after failed product creation:', err);
      });
    }
    res.status(500).json({ success: false, message: 'Server error while creating product.' });
  }
};

// @desc    Get all products with filtering, search, sorting and pagination
// @route   GET /api/products
// @access  Public / Admin
const getProducts = async (req, res) => {
  try {
    // First, auto-expire products whose availableUntil has passed
    await autoExpireProducts();

    const {
      q,
      category,
      district,
      village,
      organic,
      status,
      approvalStatus,
      page = 1,
      limit = 12,
      sort
    } = req.query;

    const query = {};

    // For public, we might only want approved & available. If approvalStatus is passed, use it (admin use case)
    if (approvalStatus && approvalStatus !== 'all') {
      query.approvalStatus = approvalStatus;
    } else if (approvalStatus !== 'all') {
      // By default, public search only shows approved
      query.approvalStatus = 'approved';
    }

    if (status && status !== 'all') {
      query.status = status;
    } else if (status !== 'all' && (!approvalStatus || approvalStatus !== 'all')) {
      // Public search default status
      query.status = 'available';
    }

    // Text search
    if (q) {
      query.$text = { $search: q };
    }

    // Filters
    if (category && category !== 'All' && category !== 'all') {
      query.category = category;
    }
    if (district && district !== 'All' && district !== 'all') {
      query.district = district;
    }
    if (village && village !== 'All' && village !== 'all') {
      query.village = new RegExp(village, 'i');
    }
    if (organic === 'true') {
      query.isOrganic = true;
    }

    // Sorting
    let sortObj = { createdAt: -1 }; // default latest
    if (sort) {
      switch (sort) {
        case 'latest': sortObj = { createdAt: -1 }; break;
        case 'price-low': sortObj = { sellingPrice: 1 }; break;
        case 'price-high': sortObj = { sellingPrice: -1 }; break;
        case 'quantity-high': sortObj = { quantity: -1 }; break;
        case 'name': sortObj = { productName: 1 }; break;
        // Text search score sorting if query exists
        default: 
          if (q) sortObj = { score: { $meta: "textScore" } };
          break;
      }
    } else if (q) {
      sortObj = { score: { $meta: "textScore" } };
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching products.' });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Increment views
    product.views = (product.views || 0) + 1;
    await product.save();

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching product details.' });
  }
};

// @desc    Update product approval status
// @route   PATCH /api/products/:id/approval
// @access  Admin
const updateProductApproval = async (req, res) => {
  try {
    const { approvalStatus } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid approval status' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { approvalStatus },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Optionally mark associated notifications as read since action was taken
    try {
      await AdminNotification.updateMany({ productId: req.params.id, isRead: false }, { isRead: true });
    } catch (notifErr) {
      console.warn('Could not mark admin notification read:', notifErr);
    }

    res.status(200).json({
      success: true,
      data: product,
      message: `Product successfully marked as ${approvalStatus}`
    });
  } catch (error) {
    console.error('Update approval status error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating approval status.' });
  }
};

// @desc    Update product status
// @route   PATCH /api/products/:id/status
// @access  Admin / User
const updateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['available', 'sold', 'expired'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      data: product,
      message: `Product successfully marked as ${status}`
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating status.' });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete image file if exists
    if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', product.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting product.' });
  }
};

// @desc    Update product (full update)
// @route   PUT /api/products/:id
// @access  Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating product.' });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProductApproval,
  updateProductStatus,
  updateProduct,
  deleteProduct
};
