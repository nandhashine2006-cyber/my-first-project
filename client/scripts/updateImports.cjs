const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../src/assets/commodities');
const jsFile = path.join(__dirname, '../src/data/commodityImages.js');

const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

let imports = '';
let mappings = 'export const commodityImages = {\n';

files.forEach((file, index) => {
    const key = file.replace(/\.(jpg|png)$/, '');
    // camelCase variable name safely
    const varName = 'img' + index + '_' + key.replace(/[^a-zA-Z0-9]/g, '');
    imports += `import ${varName} from '../assets/commodities/${file}';\n`;
    mappings += `  '${key}': ${varName},\n`;
});

mappings += '};\n';

// Read the rest of the file logic (normalization etc)
const oldContent = fs.readFileSync(jsFile, 'utf8');
const logicPart = oldContent.substring(oldContent.indexOf('export const normalizeCommodityName'));

const newContent = imports + '\nimport { commodityAliases } from \'./commodityAliases.js\';\n\n' + mappings + '\n' + logicPart;

fs.writeFileSync(jsFile, newContent);
console.log('Successfully updated commodityImages.js');
