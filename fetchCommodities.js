const http = require('http');
const fs = require('fs');

const fetchAll = async () => {
  let all = new Set();
  let page = 1;
  let totalPages = 1;

  try {
    do {
      await new Promise((resolve, reject) => {
        http.get('http://localhost:5001/api/market-prices?limit=250&page=' + page, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              if (json.pagination) {
                totalPages = json.pagination.totalPages;
              }
              if (json.data) {
                json.data.forEach(item => {
                  if (item.commodity) all.add(item.commodity.trim());
                  if (item.productName) all.add(item.productName.trim());
                });
              }
              resolve();
            } catch(e) {
              console.error('Error parsing page', page);
              resolve();
            }
          });
        }).on('error', reject);
      });
      page++;
    } while (page <= totalPages);
    
    fs.writeFileSync('commodities.json', JSON.stringify(Array.from(all), null, 2));
    console.log(`Fetched ${all.size} unique commodities across ${totalPages} pages.`);
  } catch (err) {
    console.error(err);
  }
};

fetchAll();
