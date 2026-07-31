const axios = require('axios');
const mongoose = require('mongoose');
const MarketPrice = require('../models/MarketPrice');
const { config, isValidKey } = require('../config/env');

class MarketService {
  constructor() {
    this.apiUrl = config.market.apiUrl || 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
    this.apiKey = config.market.apiKey;
    this.isConnected = false;
    this.lastVerifiedAt = null;
    this.refreshInterval = null;
    this.lastSyncRecordsCount = 0;
  }

  async verifyConnection() {
    if (!isValidKey(this.apiKey)) {
      this.isConnected = false;
      return false;
    }

    try {
      const url = `${this.apiUrl}?api-key=${this.apiKey}&format=json&limit=1`;
      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.data && response.data.status === 'ok') {
        this.isConnected = true;
        this.lastVerifiedAt = new Date().toISOString();
        console.log('✅ [MarketService]: Connected to data.gov.in AGMARKNET');
        
        // Start background sync
        if (!this.refreshInterval) {
          this.refreshInterval = setInterval(() => this.syncMarketData(), 30 * 60 * 1000);
          // Initial sync asynchronously
          setTimeout(() => this.syncMarketData(), 2000);
        }
        return true;
      }
    } catch (err) {
      console.error('⚠️ [MarketService Error]:', err.message);
    }
    
    this.isConnected = false;
    return false;
  }

  mapCategory(commodity) {
    if (!commodity) return 'Vegetables';
    const lower = commodity.toLowerCase();
    
    if (lower.match(/(tomato|onion|potato|brinjal|drumstick|carrot|beans|cabbage|beetroot|okra|lady finger|bhindi|thondekai|pumpkin|gourd|yam)/)) return 'Vegetables';
    if (lower.match(/(banana|mango|lemon|orange|apple|guava|papaya|grapes|coconut|pineapple|watermelon|melon)/)) return 'Fruits';
    if (lower.match(/(jasmine|rose|marigold|chrysanthemum|flower)/)) return 'Flowers';
    if (lower.match(/(paddy|rice|maize|wheat|ragi|bajra|jowar|grain)/)) return 'Grains';
    if (lower.match(/(black gram|green gram|bengal gram|red gram|pulse|gram)/)) return 'Pulses';
    if (lower.match(/(turmeric|chilli|coriander|pepper|cardamom|ginger|garlic|clove|spice)/)) return 'Spices';
    if (lower.match(/(groundnut|sunflower|mustard|sesame|oilseed)/)) return 'Oilseeds';
    if (lower.match(/(seed)/)) return 'Seeds';
    if (lower.match(/(tea|coffee|rubber|cashew|arecanut)/)) return 'Plantation Crops';
    
    return 'Vegetables'; // default
  }

  async syncMarketData() {
    if (!this.isConnected || mongoose.connection.readyState !== 1) return;

    console.log('🔄 [MarketService]: Fetching live market data...');
    try {
      // Fetch without restrictive state filter first, we will filter locally
      const url = `${this.apiUrl}?api-key=${this.apiKey}&format=json&limit=2000`;
      const response = await axios.get(url, { timeout: 20000 });

      if (response.data && response.data.records) {
        let fetchedCount = response.data.records.length;
        let tnMatchedCount = 0;
        let normalizedCount = 0;
        let insertedCount = 0;
        let updatedCount = 0;
        let rejectedCount = 0;
        let rejectReasons = {};
        
        let bulkOps = [];
        const now = new Date();

        const getField = (record, keys) => {
          for (const key of keys) {
            if (record[key] !== undefined && record[key] !== null) {
              return String(record[key]);
            }
          }
          return '';
        };

        for (const record of response.data.records) {
          const rawState = getField(record, ['state', 'State', 'state_name']);
          const stateStr = rawState.trim();
          
          if (stateStr && stateStr.toLowerCase() !== 'tamil nadu') {
            continue;
          }
          tnMatchedCount++;

          const rawDistrict = getField(record, ['district', 'District', 'district_name']);
          const rawMarket = getField(record, ['market', 'Market', 'market_name']);
          const rawCommodity = getField(record, ['commodity', 'Commodity', 'commodity_name']);
          const rawVariety = getField(record, ['variety', 'Variety']);
          const rawArrivalDate = getField(record, ['arrival_date', 'Arrival_Date']);
          const rawMinPrice = getField(record, ['min_price', 'Min_Price']);
          const rawMaxPrice = getField(record, ['max_price', 'Max_Price']);
          const rawModalPrice = getField(record, ['modal_price', 'Modal_Price']);

          const minPriceStr = rawMinPrice.trim();
          const maxPriceStr = rawMaxPrice.trim();
          const modalPriceStr = rawModalPrice.trim();

          if (!rawCommodity || !rawMarket || !rawDistrict || !rawArrivalDate || minPriceStr === '' || maxPriceStr === '' || modalPriceStr === '') {
            rejectedCount++;
            const reason = 'Missing required fields';
            rejectReasons[reason] = (rejectReasons[reason] || 0) + 1;
            continue;
          }

          normalizedCount++;

          // Parse date DD/MM/YYYY to JS Date
          let parsedArrivalDate = now;
          if (rawArrivalDate) {
            const parts = rawArrivalDate.split('/');
            if (parts.length === 3) {
              parsedArrivalDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
          }

          const minPrice = Number.parseFloat(minPriceStr) || 0;
          const maxPrice = Number.parseFloat(maxPriceStr) || 0;
          const modalPrice = Number.parseFloat(modalPriceStr) || 0;
          
          const doc = {
            state: stateStr || 'Tamil Nadu',
            district: rawDistrict || 'Unknown',
            market: rawMarket || 'Unknown',
            commodity: rawCommodity || 'Unknown',
            variety: rawVariety || '',
            category: this.mapCategory(rawCommodity),
            arrivalDate: parsedArrivalDate,
            minimumPrice: minPrice,
            maximumPrice: maxPrice,
            modalPrice: modalPrice,
            originalUnit: 'Quintal',
            calculatedKgPrice: modalPrice ? parseFloat((modalPrice / 100).toFixed(2)) : 0,
            sourceName: 'data.gov.in / AGMARKNET',
            dataType: 'cached-official',
            verified: true,
            fetchedAt: now
          };

          bulkOps.push({
            updateOne: {
              filter: { 
                state: doc.state, 
                district: doc.district, 
                market: doc.market, 
                commodity: doc.commodity, 
                variety: doc.variety, 
                arrivalDate: doc.arrivalDate 
              },
              update: { $set: doc },
              upsert: true
            }
          });

          // execute in chunks of 500
          if (bulkOps.length >= 500) {
            const result = await MarketPrice.bulkWrite(bulkOps);
            insertedCount += result.upsertedCount;
            updatedCount += result.modifiedCount;
            bulkOps = [];
          }
        }
        
        if (bulkOps.length > 0) {
          const result = await MarketPrice.bulkWrite(bulkOps);
          insertedCount += result.upsertedCount;
          updatedCount += result.modifiedCount;
        }

        console.log(`✅ [MarketService]: Synced stats:`);
        console.log(` - Fetched from provider: ${fetchedCount}`);
        console.log(` - Tamil Nadu matched: ${tnMatchedCount}`);
        console.log(` - Valid normalized: ${normalizedCount}`);
        console.log(` - Inserted: ${insertedCount}`);
        console.log(` - Updated: ${updatedCount}`);
        console.log(` - Rejected: ${rejectedCount}`);
        if (rejectedCount > 0) {
          console.log(` - Rejection reasons:`, rejectReasons);
        }
        
        if (insertedCount === 0 && updatedCount === 0) {
          if (fetchedCount === 0) console.log(' - Reason for 0 synced: Provider returned zero records.');
          else if (tnMatchedCount === 0) console.log(' - Reason for 0 synced: No Tamil Nadu records matched.');
          else if (normalizedCount === 0) console.log(' - Reason for 0 synced: All records failed normalization.');
          else console.log(' - Reason for 0 synced: All records were exact duplicates (no updates needed).');
        }

        this.lastSyncRecordsCount = normalizedCount;
      }
    } catch (err) {
      console.error('⚠️ [MarketService Sync Error]:', err.message);
    }
  }
}

module.exports = new MarketService();
