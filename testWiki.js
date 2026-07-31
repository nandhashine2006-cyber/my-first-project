const https = require('https');

const searchWikimedia = (query) => {
  return new Promise((resolve, reject) => {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`;
    https.get(searchUrl, { headers: { 'User-Agent': 'Bot/1.0 (test@example.com)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.query.search.length > 0) {
            const title = json.query.search[0].title;
            const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(title)}`;
            https.get(imgUrl, { headers: { 'User-Agent': 'Bot/1.0 (test@example.com)' } }, (res2) => {
              let data2 = '';
              res2.on('data', chunk => data2 += chunk);
              res2.on('end', () => {
                const json2 = JSON.parse(data2);
                const pages = json2.query.pages;
                const pageId = Object.keys(pages)[0];
                if (pageId !== '-1' && pages[pageId].original) {
                  resolve(pages[pageId].original.source);
                } else {
                  resolve(null);
                }
              });
            }).on('error', reject);
          } else {
            resolve(null);
          }
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
};

(async () => {
  console.log(await searchWikimedia('amaranthus crop'));
  console.log(await searchWikimedia('amla fruit'));
  console.log(await searchWikimedia('ashgourd'));
  console.log(await searchWikimedia('snakeguard vegetable'));
})();
