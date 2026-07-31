const https = require('https');

const searchBing = (query) => {
  return new Promise((resolve, reject) => {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&FORM=HDRSC2`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/murl&quot;:&quot;(.*?)&quot;/);
        if (match && match[1]) {
          resolve(match[1]);
        } else {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
};

(async () => {
  console.log(await searchBing('tomato crop fresh'));
  console.log(await searchBing('amaranthus vegetable'));
})();
