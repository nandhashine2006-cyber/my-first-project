const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const images = [
  'amaranthus', 'amla', 'apple', 'ashgourd', 'baby-corn', 'bajra', 'banana-green', 'banana', 'beans', 'beetroot', 'betal-leaves', 'bitter-gourd', 'bottle-gourd', 'brinjal', 'cabbage', 'capsicum', 'carrot', 'cauliflower', 'chikoo', 'chili-red', 'chow-chow', 'cluster-beans', 'coconut', 'colacasia', 'coriander', 'cowpea', 'cucumbar', 'custard-apple', 'drumstick', 'elephant-yamamorphophallus', 'fig', 'garlic', 'ginger-green', 'grapes', 'green-avare', 'green-chilli', 'green-onion', 'green-peas', 'groundnut', 'guava', 'indian-beans', 'jack-fruit-ripe', 'jamun', 'jasmine', 'kakada', 'karbuja', 'knool-khol', 'lemon', 'lime', 'maize', 'mango-raw-ripe', 'mango', 'marigold', 'mashrooms', 'mint', 'mousambi', 'okra', 'onion', 'orange', 'paddy', 'papaya', 'pear', 'pineapple', 'pomegranate', 'potato', 'pumpkin', 'raddish', 'ragi', 'ridgeguard', 'rose-local', 'rose', 'snakeguard', 'soyabean', 'sweet-corn', 'sweet-potato', 'tamarind-fruit', 'tapioca', 'tender-coconut', 'thondekai', 'tomato', 'tube-flower', 'tube-rose', 'turmeric', 'turnip', 'water-melon', 'yam'
];

const dir = path.join(__dirname, 'client/src/assets/commodities');

const searchBing = (query) => {
  return new Promise((resolve, reject) => {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&FORM=HDRSC2`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const matches = [...data.matchAll(/murl&quot;:&quot;(.*?)&quot;/g)];
        if (matches && matches.length > 0) {
          resolve(matches.map(m => m[1]));
        } else {
          resolve([]);
        }
      });
    }).on('error', reject);
  });
};

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
         reject(new Error('Status: ' + res.statusCode));
         return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
      file.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
    req.setTimeout(10000, () => {
      req.abort();
      reject(new Error('Timeout'));
    });
  });
};

(async () => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  for (const imgName of images) {
    console.log('Searching for:', imgName);
    const dest = path.join(dir, imgName + '.jpg'); 
    let query = imgName.replace(/-/g, ' ');
    if (query === 'elephant yamamorphophallus') query = 'elephant foot yam';
    if (query === 'snakeguard') query = 'snake gourd';
    if (query === 'ridgeguard') query = 'ridge gourd';
    if (query === 'kakada') query = 'jasminum rex';
    if (query === 'karbuja') query = 'cantaloupe melon';
    if (query === 'green avare') query = 'hyacinth bean';
    if (query === 'thondekai') query = 'ivy gourd';
    if (query === 'chikoo') query = 'sapodilla';
    if (query === 'knool khol') query = 'kohlrabi';
    if (query === 'bajra') query = 'pearl millet crop';
    if (query === 'ragi') query = 'finger millet crop';
    query += ' vegetable fruit crop fresh';
    
    try {
      const urls = await searchBing(query);
      let downloaded = false;
      for (const url of urls) {
        if (!url.endsWith('.jpg') && !url.endsWith('.jpeg')) continue;
        console.log('  Found URL:', url);
        try {
          await download(url, dest);
          console.log('  Downloaded:', imgName);
          downloaded = true;
          break;
        } catch(e) {
          console.log('  Download failed, trying next...');
        }
      }
      if (!downloaded) {
        console.log('  FAILED TO FIND IMAGE FOR:', imgName);
      }
    } catch(e) {
      console.log('  Search error for:', imgName, e.message);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log("Done");
})();
