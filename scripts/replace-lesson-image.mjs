#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { spawnSync } from 'child_process';

const root = process.cwd();
const args = process.argv.slice(2);
const lessonArg = args.includes('--lesson') ? args[args.indexOf('--lesson') + 1] : null;
const recordArg = args.includes('--record') ? args[args.indexOf('--record') + 1] : null;
const assetArg = args.includes('--asset') ? args[args.indexOf('--asset') + 1] : null;
const imageArg = args.includes('--image') ? args[args.indexOf('--image') + 1] : null;

if (!lessonArg || !imageArg || (!recordArg && !assetArg)) {
  console.error('Usage: node scripts/replace-lesson-image.mjs --lesson output/book-1/lesson-XX (--record V001 | --asset assets/vocab-images/file.png) --image /path/to/new.png');
  process.exit(1);
}

const lessonDir = path.resolve(root, lessonArg);
const slidesDir = path.join(lessonDir, 'slides');
const manifestPath = path.join(slidesDir, 'assets', 'asset-manifest.json');
const sourceImage = path.resolve(root, imageArg);

async function ensureManifest() {
  const exists = await fs.stat(manifestPath).then(() => true).catch(() => false);
  if (exists) return;
  const run = spawnSync(process.execPath, ['scripts/build-lesson-asset-manifest.mjs', '--lesson', lessonDir], {
    cwd: root,
    stdio: 'inherit',
  });
  if (run.status !== 0) process.exit(run.status || 1);
}

await ensureManifest();
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

let target = assetArg;
let entry = null;
if (!target && recordArg) {
  const record = recordArg.toUpperCase();
  entry = (manifest.assets || []).find((asset) =>
    asset.role === 'vocabulary_image' && (asset.record_ids || []).map((id) => id.toUpperCase()).includes(record));
  if (!entry) {
    console.error(`No vocabulary image asset found for ${recordArg}. Run build-lesson-asset-manifest first and check vocabulary_coverage.`);
    process.exit(1);
  }
  target = entry.asset_path;
}

target = target.replace(/^\.?\//, '');
const targetPath = path.join(slidesDir, target);
await fs.mkdir(path.dirname(targetPath), { recursive: true });

if (target.includes('/vocab-images/')) {
  const isPinyinLesson = manifest.lesson_id?.startsWith('pinyin-')
    || path.relative(root, lessonDir).replaceAll(path.sep, '/').startsWith('output/pinyin/');
  const existingRatio = entry?.dimensions?.aspect_ratio;
  const squareTarget = isPinyinLesson || (typeof existingRatio === 'number' && Math.abs(existingRatio - 1) < 0.02);
  const width = squareTarget ? 1024 : 576;
  const height = squareTarget ? 1024 : 324;
  await sharp(sourceImage)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .png()
    .toFile(targetPath);
} else {
  await fs.copyFile(sourceImage, targetPath);
}

const rebuild = spawnSync(process.execPath, ['scripts/build-lesson-asset-manifest.mjs', '--lesson', lessonDir], {
  cwd: root,
  stdio: 'inherit',
});
if (rebuild.status !== 0) process.exit(rebuild.status || 1);

console.log(`Replaced ${target}`);
