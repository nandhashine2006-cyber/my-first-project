async function testEndpoints() {
  const endpoints = [
    '/api/market-prices',
    '/api/news',
    '/api/products',
    '/api/system/database-health'
  ];

  let passed = 0;
  for (const ep of endpoints) {
    try {
      const url = `http://127.0.0.1:5001${ep}`;
      const res = await fetch(url);
      if (res.ok) {
        console.log(`[PASS] ${ep} - Status: ${res.status}`);
        passed++;
      } else {
        console.error(`[FAIL] ${ep} - Status: ${res.status}`);
        const text = await res.text();
        console.error(text);
      }
    } catch (e) {
      console.error(`[ERROR] ${ep} - ${e.message}`);
    }
  }
  console.log(`\nPassed ${passed}/${endpoints.length}`);
}

testEndpoints();
