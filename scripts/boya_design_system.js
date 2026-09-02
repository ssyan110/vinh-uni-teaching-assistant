const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'boya_design_system.json');
const designSystem = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const layoutContractPath = path.join(__dirname, '..', 'course', 'boya-online-layout-contract.json');
const layoutContract = JSON.parse(fs.readFileSync(layoutContractPath, 'utf8'));
const contractTypography = layoutContract.pptTypography || {};
const designTypography = designSystem.pptTypography || {};
const typographyKeysMatch = Object.keys(contractTypography).length === Object.keys(designTypography).length
  && Object.keys(contractTypography).every((key) => designTypography[key] === contractTypography[key]);
const typographyValuesValid = Object.values(contractTypography).every((value) => Number.isFinite(value) && value > 0);

if (!designSystem.fonts?.cjk || !designSystem.fonts?.latin || !designSystem.colors?.paper || designSystem.colors?.slideBackground !== 'FFFFFF' || !typographyKeysMatch || !typographyValuesValid || contractTypography.visible_min_pt < 20 || contractTypography.task_prompt_min_pt < contractTypography.visible_min_pt || designSystem.effectiveTypographyPolicy?.visible_min_pt !== 20 || !designSystem.effectiveTypographyPolicy?.validate_font_scale) {
  throw new Error(`Invalid Boya design system: ${filePath}`);
}

module.exports = designSystem;
