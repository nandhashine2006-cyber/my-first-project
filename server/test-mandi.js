require('dotenv').config({ path: '.env' });
const axios = require('axios');

async function testMandiAPI() {
  const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${process.env.MARKET_API_KEY}&format=json&limit=5&filters[state]=Tamil%20Nadu`;
  try {
    console.log("Fetching:", url.replace(process.env.MARKET_API_KEY, '[REDACTED]'));
    const response = await axios.get(url);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }
}
testMandiAPI();
