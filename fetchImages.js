const fs = require('fs');
const path = require('path');
const google = require('googlethis');
const https = require('https');
const http = require('http');

const images = [
  'amaranthus', 'amla'
];

const dir = path.join(__dirname, 'client/src/assets/commodities');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } }, (res) => {
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
  for (const imgName of images) {
    console.log('Searching for:', imgName);
    const dest = path.join(dir, imgName + '.jpg');
    let query = imgName.replace(/-/g, ' ') + ' crop vegetable fruit fresh real -site:pinterest.com';
    try {
      const imagesResult = await google.image(query, { safe: false });
      let downloaded = false;
      for (const res of imagesResult) {
        if (!res.url || res.url.startsWith('data:') || !res.url.endsWith('.jpg')) continue;
        try {
          console.log('  Trying', res.url);
          await download(res.url, dest);
          downloaded = true;
          console.log('  Downloaded:', imgName);
          break;
        } catch(e) {
          console.log('  Failed to download from', res.url, e.message);
        }
      }
      if (!downloaded) {
        console.log('  FAILED TO FIND IMAGE FOR:', imgName);
      }
    } catch(e) {
      console.log('  Search error for:', imgName, e.message);
    }
  }
})();
