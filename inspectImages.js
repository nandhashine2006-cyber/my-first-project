const fs = require('fs');
const path = require('path');
const dir = './client/src/assets/commodities';
fs.readdirSync(dir).forEach(file => {
  const p = path.join(dir, file);
  const stat = fs.statSync(p);
  if (stat.isFile()) {
    const buf = Buffer.alloc(4);
    const fd = fs.openSync(p, 'r');
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    let type = 'Unknown';
    if (buf[0] === 0xFF && buf[1] === 0xD8) type = 'JPEG';
    else if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) type = 'PNG';
    else if (buf.toString('utf8', 0, 4) === 'RIFF') type = 'WEBP';
    console.log(`${file}: ${stat.size} bytes - ${type}`);
  }
});
