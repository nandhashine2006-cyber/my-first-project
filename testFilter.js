const fs = require('fs');

async function testFilter() {
  const url = 'http://localhost:5000/api/market-prices?limit=5000';
  let data = [];
  try {
    const res = await fetch(url);
    const json = await res.json();
    data = json.data;
  } catch (e) {
    console.log("Error fetching API:", e.message);
    return;
  }

  const normalizeText = (text) => text ? text.toLowerCase().replace(/[\s-]/g, '') : '';
  const search = (term, dist = 'All', cat = 'All') => {
    let filtered = [...data];
    if (dist !== 'All') filtered = filtered.filter(i => i.district === dist);
    if (cat !== 'All') filtered = filtered.filter(i => i.category === cat);
    if (term) {
      const norm = normalizeText(term);
      filtered = filtered.filter(item => {
        return normalizeText(item.commodity).includes(norm) ||
               normalizeText(item.variety).includes(norm) ||
               normalizeText(item.localName).includes(norm) ||
               normalizeText(item.market).includes(norm);
      });
    }
    return filtered;
  };

  const testCases = [
    { term: 'watermelon', dist: 'All' },
    { term: 'green chilli', dist: 'All' },
    { term: 'tomato', dist: 'Coimbatore' },
    { term: 'brinjal', dist: 'All' },
    { term: 'ash gourd', dist: 'All' },
    { term: 'pumpkin', dist: 'All' },
    { term: 'potato', dist: 'All' },
    { term: 'onion', dist: 'All' },
    { term: 'mango', dist: 'All' },
    { term: 'banana', dist: 'All' },
    { term: 'coconut', dist: 'All' },
    { term: 'paddy', dist: 'All' },
    { term: 'turmeric', dist: 'All' },
    { term: 'jasmine', dist: 'All' },
    { term: 'rose', dist: 'All' },
    { term: 'lemon', dist: 'All' },
    { term: 'grapes', dist: 'All' },
    { term: 'guava', dist: 'All' },
    { term: 'papaya', dist: 'All' },
    { term: 'carrot', dist: 'All' }
  ];

  console.log(`Loaded ${data.length} records. Total unique districts: ${new Set(data.map(i=>i.district)).size}`);
  for (const tc of testCases) {
    const results = search(tc.term, tc.dist);
    console.log(`Search [term='${tc.term}', dist='${tc.dist}'] -> found ${results.length} matches.`);
    if (results.length > 0) {
      console.log(`  Example: ${results[0].commodity} (${results[0].district})`);
    }
  }
}

testFilter();
