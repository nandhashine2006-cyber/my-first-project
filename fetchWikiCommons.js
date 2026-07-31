const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const images = [
  'amaranthus', 'amla', 'apple', 'ashgourd', 'baby-corn', 'bajra', 'banana-green', 'banana', 'beans', 'beetroot', 'betal-leaves', 'bitter-gourd', 'bottle-gourd', 'brinjal', 'cabbage', 'capsicum', 'carrot', 'cauliflower', 'chikoo', 'chili-red', 'chow-chow', 'cluster-beans', 'coconut', 'colacasia', 'coriander', 'cowpea', 'cucumbar', 'custard-apple', 'drumstick', 'elephant-yamamorphophallus', 'fig', 'garlic', 'ginger-green', 'grapes', 'green-avare', 'green-chilli', 'green-onion', 'green-peas', 'groundnut', 'guava', 'indian-beans', 'jack-fruit-ripe', 'jamun', 'jasmine', 'kakada', 'karbuja', 'knool-khol', 'lemon', 'lime', 'maize', 'mango-raw-ripe', 'mango', 'marigold', 'mashrooms', 'mint', 'mousambi', 'okra', 'onion', 'orange', 'paddy', 'papaya', 'pear', 'pineapple', 'pomegranate', 'potato', 'pumpkin', 'raddish', 'ragi', 'ridgeguard', 'rose-local', 'rose', 'snakeguard', 'soyabean', 'sweet-corn', 'sweet-potato', 'tamarind-fruit', 'tapioca', 'tender-coconut', 'thondekai', 'tomato', 'tube-flower', 'tube-rose', 'turmeric', 'turnip', 'water-melon', 'yam'
];

const dir = path.join(__dirname, 'client/src/assets/commodities');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Bot/1.0 (test@example.com)' } }, (res) => {
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
  });
};

const searchCommons = (query) => {
  return new Promise((resolve, reject) => {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query + ' filetype:bitmap')}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&format=json`;
    https.get(searchUrl, { headers: { 'User-Agent': 'Bot/1.0 (test@example.com)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.query && json.query.pages) {
            const pages = json.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pages[pageId].imageinfo && pages[pageId].imageinfo.length > 0) {
              resolve(pages[pageId].imageinfo[0].url);
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
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
    if (query === 'karbuja') query = 'cantaloupe';
    if (query === 'green avare') query = 'hyacinth bean';
    if (query === 'thondekai') query = 'ivy gourd';
    if (query === 'chikoo') query = 'sapodilla';
    if (query === 'knool khol') query = 'kohlrabi';
    if (query === 'bajra') query = 'pearl millet';
    if (query === 'ragi') query = 'finger millet';
    
    try {
      let url = await searchCommons(query);
      if (!url) url = await searchCommons(query.split(' ')[0]);
      
      if (url) {
        console.log('  Found URL:', url);
        await download(url, dest);
        console.log('  Downloaded:', imgName);
      } else {
        console.log('  FAILED TO FIND IMAGE FOR:', imgName);
      }
    } catch(e) {
      console.log('  Search error for:', imgName, e.message);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log("Done");
})();
