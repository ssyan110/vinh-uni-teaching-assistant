#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const args = process.argv.slice(2);
const lessonArg = args.includes('--lesson') ? args[args.indexOf('--lesson') + 1] : null;

if (!lessonArg) {
  console.error('Usage: node scripts/qa-lesson-assets.mjs --lesson output/book-1/lesson-XX');
  process.exit(1);
}

const lessonDir = path.resolve(root, lessonArg);
const slidesDir = path.join(lessonDir, 'slides');
const manifestPath = path.join(slidesDir, 'assets', 'asset-manifest.json');
const qaDir = path.join(lessonDir, 'exports', 'qa');
const reportPath = path.join(qaDir, 'asset-qa-report.json');

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

function ratioClose(value, expected, tolerance = 0.02) {
  return typeof value === 'number' && Math.abs(value - expected) <= tolerance;
}

function check(results, label, pass, detail = '') {
  results.push({ label, pass, detail });
  const mark = pass ? '✓' : '✗';
  console.log(`${mark} ${label}${detail ? ` — ${detail}` : ''}`);
}

const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
await fs.mkdir(qaDir, { recursive: true });

const results = [];
const assets = manifest.assets || [];
const isPinyinLesson = manifest.lesson_id?.startsWith('pinyin-') || rel(lessonDir).startsWith('output/pinyin/');
const expectedVocabRatio = isPinyinLesson ? 1 : 16 / 9;
const expectedVocabRatioLabel = isPinyinLesson ? '1:1' : '16:9';

check(results, 'asset manifest exists', true, rel(manifestPath));
check(results, 'manifest has assets', assets.length > 0, `${assets.length} assets`);

for (const required of ['assets/slide-base.css', 'assets/slide-base.js', 'assets/brand/logo-watermark.png']) {
  const entry = assets.find((asset) => asset.asset_path === required);
  check(results, `required asset: ${required}`, !!entry && entry.exists);
}

const missing = assets.filter((asset) => !asset.exists);
check(results, 'all referenced assets exist', missing.length === 0, missing.map((asset) => asset.asset_path).join(', '));

const vocabImages = assets.filter((asset) => asset.role === 'vocabulary_image');
check(results, 'vocabulary image entries present', vocabImages.length > 0, `${vocabImages.length} entries`);

const vocabBadRatio = vocabImages.filter((asset) => asset.dimensions && !ratioClose(asset.dimensions.aspect_ratio, expectedVocabRatio));
check(
  results,
  `vocabulary images are ${expectedVocabRatioLabel}`,
  vocabBadRatio.length === 0,
  vocabBadRatio.map((asset) => `${asset.asset_path}=${asset.dimensions?.width}x${asset.dimensions?.height}`).join(', ')
);

const vocabMissingMeta = vocabImages.filter((asset) => !asset.record_ids.length && !asset.chinese.length);
check(
  results,
  'vocabulary images have record or Chinese mapping',
  vocabMissingMeta.length === 0,
  vocabMissingMeta.map((asset) => asset.asset_path).join(', ')
);

const uncoveredVocab = (manifest.vocabulary_coverage || []).filter((entry) => entry.status !== 'covered');
check(
  results,
  'standalone vocabulary records have image coverage',
  uncoveredVocab.length === 0,
  uncoveredVocab.map((entry) => `${entry.record_id}:${entry.chinese_simplified}`).join(', ')
);

const slideRefsWithoutUse = assets.filter((asset) => !asset.used_by?.length);
check(results, 'all assets list usage', slideRefsWithoutUse.length === 0, slideRefsWithoutUse.map((asset) => asset.asset_path).join(', '));

const htmlSlides = (await fs.readdir(slidesDir).catch(() => []))
  .filter((file) => /^\d{2,3}-.+\.html$/.test(file));
let nonStandardLucide = [];
let missingBaseCss = [];
let missingBaseJs = [];
for (const slide of htmlSlides) {
  const text = await fs.readFile(path.join(slidesDir, slide), 'utf8');
  if (!text.includes('https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js')) nonStandardLucide.push(slide);
  if (!text.includes('assets/slide-base.css')) missingBaseCss.push(slide);
  if (!text.includes('assets/slide-base.js')) missingBaseJs.push(slide);
}
check(results, 'all slides use lucide@0.460.0', nonStandardLucide.length === 0, nonStandardLucide.join(', '));
check(results, 'all slides link shared slide-base.css', missingBaseCss.length === 0, missingBaseCss.join(', '));
check(results, 'all slides link shared slide-base.js', missingBaseJs.length === 0, missingBaseJs.join(', '));

const failed = results.filter((item) => !item.pass);
const report = {
  lesson_id: manifest.lesson_id,
  checked_at: new Date().toISOString(),
  manifest: rel(manifestPath),
  status: failed.length ? 'failed' : 'passed',
  failed,
  results,
};
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(`Asset QA report: ${rel(reportPath)}`);
if (failed.length) process.exit(1);
