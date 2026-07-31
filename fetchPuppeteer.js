const puppeteer = require('puppeteer');
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
    if (url.startsWith('data:')) {
      const base64Data = url.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFile(dest, base64Data, 'base64', (err) => {
        if (err) reject(err);
        else resolve();
      });
      return;
    }

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
  });
};

(async () => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  for (const imgName of images) {
    const dest = path.join(dir, imgName + '.jpg');
    let query = imgName.replace(/-/g, ' ');
    if (query === 'elephant yamamorphophallus') query = 'elephant foot yam';
    if (query === 'snakeguard') query = 'snake gourd';
    if (query === 'ridgeguard') query = 'ridge gourd';
    if (query === 'kakada') query = 'jasminum rex flower';
    if (query === 'karbuja') query = 'cantaloupe melon';
    if (query === 'green avare') query = 'hyacinth bean fresh';
    if (query === 'thondekai') query = 'ivy gourd fresh';
    if (query === 'chikoo') query = 'sapota fruit';
    if (query === 'knool khol') query = 'kohlrabi vegetable';
    if (query === 'bajra') query = 'pearl millet grains';
    if (query === 'ragi') query = 'finger millet grains';
    if (query === 'paddy') query = 'paddy crop field';
    query += ' vegetable fruit crop fresh';
    
    console.log('Searching for:', imgName);
    try {
      const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      const imgUrl = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img.mimg'));
        for (const img of imgs) {
          if (img.src && (img.src.startsWith('http') || img.src.startsWith('data:'))) {
            return img.src;
          }
        }
        return null;
      });

      if (imgUrl) {
        await download(imgUrl, dest);
        console.log('  Downloaded:', imgName);
      } else {
        console.log('  FAILED TO FIND IMAGE FOR:', imgName);
      }
    } catch(e) {
      console.log('  Search error for:', imgName, e.message);
    }
  }

  await browser.close();
  console.log("Done");
})();
