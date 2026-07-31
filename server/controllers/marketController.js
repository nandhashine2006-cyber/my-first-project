const MarketPrice = require('../models/MarketPrice');
const mongoose = require('mongoose');
const { config } = require('../config/env');
const marketService = require('../services/marketService');

// GET /api/market-prices
exports.getPrices = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 24, 
      q, 
      category, 
      district, 
      commodity, 
      market,
      sort
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(24, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    let filter = {};

    // Base filters
    if (category && category !== 'all' && category !== 'All') {
      filter.category = category;
    }
    if (district && district !== 'all' && district !== 'All') {
      filter.district = { $regex: new RegExp(`^${district}$`, 'i') };
    }
    if (commodity && commodity !== 'all' && commodity !== 'All') {
      filter.commodity = { $regex: new RegExp(`^${commodity}$`, 'i') };
    }
    if (market && market !== 'all' && market !== 'All') {
      filter.market = { $regex: new RegExp(`^${market}$`, 'i') };
    }

    // Search query
    if (q && q.trim() !== '') {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { commodity: searchRegex },
        { variety: searchRegex },
        { localName: searchRegex },
        { category: searchRegex },
        { district: searchRegex },
        { market: searchRegex }
      ];
    }

    let sortOption = { arrivalDate: -1 }; // Latest Date by default
    if (sort === 'Commodity A-Z') sortOption = { commodity: 1 };
    else if (sort === 'Modal Price Low to High') sortOption = { modalPrice: 1 };
    else if (sort === 'Modal Price High to Low') sortOption = { modalPrice: -1 };
    else if (sort === 'Market A-Z') sortOption = { market: 1 };
    else if (sort === 'Latest Date') sortOption = { arrivalDate: -1 };

    const includeSample = req.query.includeSample === 'true';

    if (mongoose.connection.readyState !== 1) {
      if (includeSample) {
        return res.status(200).json({
          success: true,
          isLiveApi: false,
          sourceTag: "Sample Data",
          data: getSampleAdminPrices(),
          pagination: { page: 1, limit: limitNum, total: 2, totalPages: 1 }
        });
      } else {
        return res.status(200).json({
          success: true,
          isLiveApi: false,
          sourceTag: "Database Disconnected",
          data: [],
          pagination: { page: 1, limit: limitNum, total: 0, totalPages: 0 }
        });
      }
    }

    const total = await MarketPrice.countDocuments(filter);
    const prices = await MarketPrice.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // If no prices found and no filters (meaning empty db)
    if (prices.length === 0 && Object.keys(filter).length === 0) {
      if (includeSample) {
        return res.status(200).json({
          success: true,
          isLiveApi: false,
          sourceTag: "Sample Data",
          data: getSampleAdminPrices(),
          pagination: { page: 1, limit: limitNum, total: 2, totalPages: 1 }
        });
      } else {
        return res.status(200).json({
          success: true,
          isLiveApi: false,
          sourceTag: "No Records Available",
          data: [],
          pagination: { page: 1, limit: limitNum, total: 0, totalPages: 0 }
        });
      }
    }

    // Normalize response based on data type rules
    const normalizedData = prices.map(p => {
      const doc = p.toObject();
      let sourceTag = "Sample Data";
      let isLiveApi = false;

      if (doc.dataType === 'external-api' || (marketService.isConnected && doc.dataType === 'cached-official' && marketService.lastSyncRecordsCount > 0)) {
        isLiveApi = true;
        sourceTag = "Verified Government Source";
      } else if (doc.dataType === 'cached-official') {
        isLiveApi = false;
        sourceTag = "Verified Government Data"; // Fallback text when not currently live or 0 records matched
      } else if (doc.dataType === 'admin-updated') {
        isLiveApi = false;
        sourceTag = "Admin Updated";
      }

      return {
        ...doc,
        sourceTag,
        isLiveApi,
        fallbackReason: (!isLiveApi && doc.dataType === 'cached-official') ? 'Using cached records (live request returned zero records or unavailable)' : undefined
      };
    });

    const isLiveApiOverall = normalizedData.some(d => d.isLiveApi);

    return res.status(200).json({
      success: true,
      isLiveApi: isLiveApiOverall,
      sourceTag: isLiveApiOverall ? "Verified Government Source" : "Verified Government Data",
      data: normalizedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.createPrice = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(400).json({ success: false, message: 'Database disconnected.' });
    }
    const priceData = {
      ...req.body,
      dataType: 'admin-updated',
      sourceName: req.body.sourceName || 'Admin Entered'
    };
    const newDoc = await MarketPrice.create(priceData);
    return res.status(201).json({ success: true, data: newDoc });
  } catch (error) {
    next(error);
  }
};

exports.updatePrice = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(400).json({ success: false, message: 'Database disconnected.' });
    }
    const updatedDoc = await MarketPrice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedDoc) return res.status(404).json({ success: false, message: 'Not found.' });
    return res.status(200).json({ success: true, data: updatedDoc });
  } catch (error) {
    next(error);
  }
};

exports.deletePrice = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(400).json({ success: false, message: 'Database disconnected.' });
    }
    const deletedDoc = await MarketPrice.findByIdAndDelete(req.params.id);
    if (!deletedDoc) return res.status(404).json({ success: false, message: 'Not found.' });
    return res.status(200).json({ success: true, message: 'Deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

function getSampleAdminPrices() {
  return [
    {
      _id: 'sample-1',
      commodity: 'Paddy',
      variety: 'Ponni',
      localName: 'நெல்',
      category: 'Grains',
      minimumPrice: 2200,
      maximumPrice: 3200,
      modalPrice: 2800,
      originalUnit: 'Quintal',
      calculatedKgPrice: 28,
      market: 'Thanjavur Regulated Market',
      district: 'Thanjavur',
      state: 'Tamil Nadu',
      arrivalDate: new Date(),
      sourceName: 'TN State Agricultural Marketing Board (Sample)',
      dataType: 'sample'
    },
    {
      _id: 'sample-2',
      commodity: 'Turmeric',
      variety: 'Raw',
      localName: 'மஞ்சள் (ஈரோடு)',
      category: 'Spices',
      minimumPrice: 11000,
      maximumPrice: 14500,
      modalPrice: 13000,
      originalUnit: 'Quintal',
      calculatedKgPrice: 130,
      market: 'Erode Mandi Complex',
      district: 'Erode',
      state: 'Tamil Nadu',
      arrivalDate: new Date(),
      sourceName: 'Sample Data',
      dataType: 'sample'
    }
  ];
}
