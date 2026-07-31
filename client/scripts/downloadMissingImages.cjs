const fs = require('fs');
const path = require('path');
const https = require('https');

const missingFile = path.join(__dirname, '../src/data/missingCommodityImages.json');
const assetsDir = path.join(__dirname, '../src/assets/commodities');
const missingData = JSON.parse(fs.readFileSync(missingFile, 'utf8'));

const downloadImage = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download, status code: ${response.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
      file.on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    }).on('error', reject);
  });
};

const getCategoryColor = (category) => {
  switch (category) {
    case 'Vegetables': return '059669'; // Emerald
    case 'Fruits': return 'ea580c'; // Orange
    case 'Flowers': return 'db2777'; // Pink
    case 'Spices': return 'b45309'; // Amber
    case 'Pulses': return '854d0e'; // Yellow/Brown
    case 'Grains': return 'ca8a04'; // Yellow
    case 'Oilseeds': return '4d7c0f'; // Lime
    case 'Plantation Crops': return '15803d'; // Green
    default: return '475569'; // Slate
  }
};

const run = async () => {
  console.log(`Processing ${missingData.length} missing images via Placehold.co...`);
  
  // Ensure dir
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  for (const item of missingData) {
    const destPath = path.join(assetsDir, item.requiredFilename);
    
    const bgColor = getCategoryColor(item.category);
    // URL encode the text safely
    const text = encodeURIComponent(item.commodity);
    
    // Placehold.co URL format: https://placehold.co/600x400/{bg}/{text_color}/jpg?text={text}
    const url = `https://placehold.co/600x400/${bgColor}/FFF/jpg?text=${text}`;
    
    console.log(`Downloading ${item.requiredFilename}...`);
    
    try {
      await downloadImage(url, destPath);
      console.log(`[SUCCESS] Downloaded ${item.requiredFilename}`);
    } catch (e) {
      console.error(`[ERROR] ${item.commodity}:`, e.message);
    }
    
    // 250ms delay
    await new Promise(r => setTimeout(r, 250));
  }
  
  console.log('Finished downloading all missing images.');
};

run();
