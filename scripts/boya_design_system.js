const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'boya_design_system.json');
const designSystem = JSON.parse(fs.readFileSync(filePath, 'utf8'));

if (!designSystem.fonts?.cjk || !designSystem.fonts?.latin || !designSystem.colors?.paper) {
  throw new Error(`Invalid Boya design system: ${filePath}`);
}

module.exports = designSystem;
