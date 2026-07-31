const fs = require('fs');
const path = require('path');
const http = require('http');

const API_BASE = 'http://localhost:5001/api/market-prices';
const ASSETS_DIR = path.join(__dirname, '../src/assets/commodities');
const DATA_DIR = path.join(__dirname, '../src/data');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Robust normalization function
const normalizeCommodityName = (value) => {
  if (!value) return '';
  let normalized = value.toLowerCase();
  
  // Remove text inside parentheses unless it contains essential words
  const essentialWords = ['green', 'red', 'raw', 'ripe', 'leaf', 'seed', 'dry', 'local', 'small', 'big'];
  
  // Find all bracketed text
  const bracketMatches = normalized.match(/\([^)]*\)/g) || [];
  for (const match of bracketMatches) {
    const hasEssential = essentialWords.some(word => match.includes(word));
    if (!hasEssential) {
      normalized = normalized.replace(match, '');
    } else {
      // Keep essential words, remove brackets
      normalized = normalized.replace(match, match.replace(/[()]/g, ' '));
    }
  }

  // Normalize hyphens to spaces
  normalized = normalized.replace(/-/g, ' ');
  // Remove punctuation safely (keep alphanumeric and spaces)
  normalized = normalized.replace(/[^a-z0-9 ]/g, '');
  // Trim and remove repeated spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // Re-map some aliases directly here to avoid wrong categorization
  if (normalized.includes('bhindi') || normalized.includes('lady finger') || normalized.includes('ladies finger')) {
    normalized = 'okra';
  }
  if (normalized.includes('chikoo') || normalized.includes('chikoos') || normalized.includes('sapota')) {
    normalized = 'chikoo';
  }
  if (normalized === 'onion small') {
    normalized = 'onion'; // user says "Onion, Small Onion -> onion"
  }
  if (normalized.includes('chilli green') || normalized.includes('green chilly') || normalized === 'chilli green') {
    normalized = 'green chilli';
  }
  if (normalized.includes('chilli red') || normalized === 'red chilly') {
    normalized = 'red chilli';
  }
  if (normalized.includes('onion green') || normalized === 'green onion') {
    normalized = 'green onion';
  }
  if (normalized === 'country tomato') {
    normalized = 'tomato';
  }

  // Convert spaces to hyphens for the final normalized key
  normalized = normalized.replace(/\s+/g, '-');
  return normalized;
};

const fetchPage = (page) => {
  return new Promise((resolve, reject) => {
    http.get(`${API_BASE}?limit=500&page=${page}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

const runAudit = async () => {
  console.log('1. Checking backend health...');
  
  let totalPages = 1;
  let allRecords = [];
  
  try {
    const firstPage = await fetchPage(1);
    if (!firstPage.success) throw new Error('API returned unsuccessful status');
    
    totalPages = firstPage.pagination?.totalPages || 1;
    allRecords = [...firstPage.data];
    console.log(`2. Fetched page 1. Discovered total pages: ${totalPages}`);
    
    for (let p = 2; p <= totalPages; p++) {
      console.log(`   Fetching page ${p}...`);
      const pageData = await fetchPage(p);
      if (pageData.success && pageData.data) {
        allRecords.push(...pageData.data);
      }
    }
  } catch (err) {
    console.error('Failed to fetch from backend:', err.message);
    process.exit(1);
  }

  console.log(`\n4. Scanning records and collecting unique commodities...`);
  
  const uniqueCommodities = new Map();

  allRecords.forEach(record => {
    const name = record.commodity || '';
    const variety = record.variety || '';
    const category = record.category || 'Unknown';
    
    const key = normalizeCommodityName(name);
    if (!key) return;

    if (!uniqueCommodities.has(key)) {
      uniqueCommodities.set(key, {
        originalNames: new Set([name]),
        normalizedKey: key,
        category: category,
        varieties: new Set(variety ? [variety] : []),
        recordCount: 1,
        requiredImageFilename: `${key}.jpg`
      });
    } else {
      const existing = uniqueCommodities.get(key);
      existing.originalNames.add(name);
      if (variety) existing.varieties.add(variety);
      existing.recordCount += 1;
    }
  });

  console.log('5. Validating image files...');
  let exactMappings = 0;
  let missingMappings = 0;
  let invalidFiles = 0;
  
  const missingList = [];
  const validCommoditiesData = [];
  
  // Ensure assets dir exists to check
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const filesInAssets = fs.readdirSync(ASSETS_DIR);
  const validImages = new Set();
  
  filesInAssets.forEach(file => {
    const filePath = path.join(ASSETS_DIR, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile() && stats.size > 0) {
      if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png') || file.endsWith('.webp')) {
        validImages.add(file.toLowerCase());
      } else {
        invalidFiles++;
      }
    } else {
      invalidFiles++;
    }
  });

  for (const [key, data] of uniqueCommodities.entries()) {
    const expectedJpg = `${key}.jpg`;
    const expectedPng = `${key}.png`;
    const expectedJpeg = `${key}.jpeg`;
    const expectedWebp = `${key}.webp`;
    
    let foundFile = null;
    if (validImages.has(expectedJpg)) foundFile = expectedJpg;
    else if (validImages.has(expectedPng)) foundFile = expectedPng;
    else if (validImages.has(expectedJpeg)) foundFile = expectedJpeg;
    else if (validImages.has(expectedWebp)) foundFile = expectedWebp;
    
    data.originalNames = Array.from(data.originalNames);
    data.varieties = Array.from(data.varieties);
    
    if (foundFile) {
      exactMappings++;
      data.verifiedImageFile = foundFile;
    } else {
      missingMappings++;
      missingList.push({
        commodity: data.originalNames[0],
        normalizedKey: key,
        requiredFilename: expectedJpg,
        category: data.category,
        reason: "No verified matching image available"
      });
    }
    
    validCommoditiesData.push(data);
  }
  
  console.log('\n10. Generating Audit Output...');
  
  ensureDir(DATA_DIR);
  
  fs.writeFileSync(path.join(DATA_DIR, 'allMarketCommodities.json'), JSON.stringify(validCommoditiesData, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'missingCommodityImages.json'), JSON.stringify(missingList, null, 2));
  
  const auditReport = {
    total_pages_scanned: totalPages,
    total_records_scanned: allRecords.length,
    total_unique_commodities: uniqueCommodities.size,
    exact_real_image_mappings: exactMappings,
    missing_image_mappings: missingMappings,
    invalid_image_files: invalidFiles,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(path.join(DATA_DIR, 'commodityImageAudit.json'), JSON.stringify(auditReport, null, 2));
  
  const textReport = `==================================================\nCOMMODITY IMAGE AUDIT REPORT\n==================================================\nTotal pages scanned: ${totalPages}\nTotal records scanned: ${allRecords.length}\nTotal unique commodities: ${uniqueCommodities.size}\nExact real image mappings: ${exactMappings}\nMissing image mappings: ${missingMappings}\nInvalid image files: ${invalidFiles}\nWrong mappings removed: (Cleaned up statically in JS)\nRandom URLs removed: (Cleaned up statically in JS)\nNamed placeholders required: ${missingMappings}\n\nAudit Timestamp: ${new Date().toISOString()}\n==================================================\n`;
  fs.writeFileSync(path.join(DATA_DIR, 'commodity-image-audit-report.txt'), textReport);
  console.log(textReport);
};

runAudit();
