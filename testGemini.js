const fs = require('fs');

async function testPlantDoctor() {
  const filePath = 'C:\\Users\\NANDHAKUMAR.M\\OneDrive\\Desktop\\nandhaku mar\\grow-green-live-long\\client\\src\\assets\\commodities\\apple.jpg';
  
  if (!fs.existsSync(filePath)) {
    console.error('Test image not found:', filePath);
    return;
  }

  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  
  formData.append('image', blob, 'apple.jpg');
  formData.append('language', 'en');
  formData.append('problemDescription', 'Scab marks on apple skin');

  console.log('Sending request to Plant Doctor API...');
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://127.0.0.1:5001/api/plant-doctor/analyze', {
      method: 'POST',
      body: formData
    });

    const duration = Date.now() - startTime;
    const status = response.status;
    const data = await response.json();

    console.log(`HTTP Status: ${status}`);
    console.log(`Request Duration: ${duration} ms`);
    console.log(`Original Image Size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
    console.log('Response JSON:', JSON.stringify(data, null, 2));
    
    // Also verify history in DB
    const historyRes = await fetch('http://127.0.0.1:5001/api/plant-doctor/history');
    const historyData = await historyRes.json();
    console.log('DB History Count:', historyData.data ? historyData.data.length : 0);
    if (historyData.data && historyData.data.length > 0) {
      console.log('Latest history plantName:', historyData.data[0].plantName);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPlantDoctor();
