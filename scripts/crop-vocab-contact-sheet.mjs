#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { spawnSync } from 'child_process';

const root = process.cwd();
const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1];
};

const lessonArg = value('--lesson');
const sheetArg = value('--sheet');
const recordsArg = value('--records') || value('--record');
const cols = Number(value('--cols') || 4);
const rows = Number(value('--rows') || 4);
const gapArg = value('--gap');
const marginArg = value('--margin');
const cellArg = value('--cell');
const dryRun = args.includes('--dry-run');

if (!lessonArg || !sheetArg || !recordsArg) {
  console.error('Usage: node scripts/crop-vocab-contact-sheet.mjs --lesson output/pinyin/pinyin-01 --sheet /path/contact-sheet.png --records V001,V002 [--cols 4 --rows 4 --margin 10 --gap 11 --cell 300 --dry-run]');
  process.exit(1);
}

const lessonDir = path.resolve(root, lessonArg);
const slidesDir = path.join(lessonDir, 'slides');
const manifestPath = path.join(slidesDir, 'assets', 'asset-manifest.json');
const sheetPath = path.resolve(root, sheetArg);
const records = recordsArg.split(',').map((record) => record.trim().toUpperCase()).filter(Boolean);

async function ensureManifest() {
  const exists = await fs.stat(manifestPath).then(() => true).catch(() => false);
  if (exists) return;
  const run = spawnSync(process.execPath, ['scripts/build-lesson-asset-manifest.mjs', '--lesson', lessonDir], {
    cwd: root,
    stdio: 'inherit',
  });
  if (run.status !== 0) process.exit(run.status || 1);
}

function targetForRecord(manifest, record) {
  const entry = (manifest.assets || []).find((asset) =>
    asset.role === 'vocabulary_image' && (asset.record_ids || []).map((id) => id.toUpperCase()).includes(record));
  if (!entry) throw new Error(`No vocabulary image asset found for ${record}`);
  return entry.asset_path.replace(/^\.?\//, '');
}

function contactSheetIndexForRecord(manifest, record, fallbackIndex) {
  const coverage = Array.isArray(manifest.vocabulary_coverage) ? manifest.vocabulary_coverage : [];
  const coverageIndex = coverage.findIndex((entry) => String(entry.record_id || '').toUpperCase() === record);
  if (coverageIndex !== -1) return coverageIndex;

  const vocabAssets = (manifest.assets || [])
    .filter((asset) => asset.role === 'vocabulary_image')
    .sort((a, b) => String(a.asset_path || '').localeCompare(String(b.asset_path || '')));
  const assetIndex = vocabAssets.findIndex((asset) =>
    (asset.record_ids || []).map((id) => String(id).toUpperCase()).includes(record));
  return assetIndex === -1 ? fallbackIndex : assetIndex;
}

await ensureManifest();
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const sheetMeta = await sharp(sheetPath).metadata();
const sheetWidth = sheetMeta.width;
const sheetHeight = sheetMeta.height;
if (!sheetWidth || !sheetHeight) throw new Error(`Cannot read contact sheet dimensions: ${sheetPath}`);

const gap = gapArg == null ? 0 : Number(gapArg);
const cell = cellArg == null
  ? Math.floor(Math.min((sheetWidth - gap * (cols - 1)) / cols, (sheetHeight - gap * (rows - 1)) / rows))
  : Number(cellArg);
const marginX = marginArg == null ? Math.floor((sheetWidth - (cell * cols + gap * (cols - 1))) / 2) : Number(marginArg);
const marginY = marginArg == null ? Math.floor((sheetHeight - (cell * rows + gap * (rows - 1))) / 2) : Number(marginArg);

for (const [selectedIndex, record] of records.entries()) {
  const target = targetForRecord(manifest, record);
  const targetPath = path.join(slidesDir, target);
  const sheetIndex = contactSheetIndexForRecord(manifest, record, selectedIndex);
  const col = sheetIndex % cols;
  const row = Math.floor(sheetIndex / cols);
  if (row >= rows) throw new Error(`Record ${record} exceeds ${cols}x${rows} contact-sheet capacity`);
  const left = marginX + col * (cell + gap);
  const top = marginY + row * (cell + gap);
  if (dryRun) {
    console.log(`Would crop ${record} from cell ${sheetIndex + 1} (${left},${top},${cell}x${cell}) -> ${target}`);
    continue;
  }
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await sharp(sheetPath)
    .extract({ left, top, width: cell, height: cell })
    .resize(1024, 1024, { fit: 'cover', position: 'center' })
    .png()
    .toFile(targetPath);
  console.log(`Cropped ${record} -> ${target}`);
}

if (!dryRun) {
  const rebuild = spawnSync(process.execPath, ['scripts/build-lesson-asset-manifest.mjs', '--lesson', lessonDir], {
    cwd: root,
    stdio: 'inherit',
  });
  if (rebuild.status !== 0) process.exit(rebuild.status || 1);
}
