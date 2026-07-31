const fs = require('fs');
const path = require('path');

const imgBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const buffer = Buffer.from(imgBase64, 'base64');

const files = [
  'groundnut.jpg',
  'green-chilli.jpg',
  'garlic.jpg',
  'coriander.jpg',
  'paddy.jpg',
  'ragi.jpg',
  'jasmine.jpg',
  'rose.jpg',
  'lemon.jpg',
  'guava.jpg',
  'banana.jpg',
  'cabbage.jpg',
  'cluster-beans.jpg',
  'green-onion.jpg',
  'tomato.jpg',
  'onion.jpg',
  'potato.jpg',
  'brinjal.jpg',
  'drumstick.jpg',
  'mango.jpg',
  'coconut.jpg',
  'turmeric.jpg',
  'maize.jpg',
  'wheat.jpg',
  'okra.jpg',
  'placeholder.jpg'
];

const dir = path.join(__dirname, 'client/src/assets/commodities');

files.forEach(file => {
  fs.writeFileSync(path.join(dir, file), buffer);
});
console.log('Created dummy jpg images.');
