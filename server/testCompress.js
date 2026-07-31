const fs = require('fs');
const sharp = require('sharp');
async function test() {
  const buf = fs.readFileSync('client/src/assets/commodities/apple.jpg');
  const compressed = await sharp(buf).resize(1280, 1280, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
  console.log(`Original: ${(buf.length / 1024).toFixed(2)} KB`);
  console.log(`Compressed: ${(compressed.length / 1024).toFixed(2)} KB`);
}
test();
