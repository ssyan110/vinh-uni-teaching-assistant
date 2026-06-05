#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const root = process.cwd();
const args = process.argv.slice(2);
const lessonArg = args.includes('--lesson') ? args[args.indexOf('--lesson') + 1] : null;

if (!lessonArg) {
  console.error('Usage: node scripts/build-lesson-asset-manifest.mjs --lesson output/book-1/lesson-XX');
  process.exit(1);
}

const lessonDir = path.resolve(root, lessonArg);
const slidesDir = path.join(lessonDir, 'slides');
const assetsDir = path.join(slidesDir, 'assets');
const qaDir = path.join(lessonDir, 'exports', 'qa');
const manifestPath = path.join(assetsDir, 'asset-manifest.json');

const requiredAssetStyle = {
  vocabulary_images: '16:9 PNG, soft textbook line-art, thin grey-blue outlines, muted pastel fills, pale background, no in-image text/letters/numbers/Chinese characters/labels/watermarks',
  sample_images: 'Must match the full sample phrase. Reuse the vocabulary image only when it is semantically correct.',
  shared_assets: 'slide-base.css, slide-base.js, and brand/logo-watermark.png must exist in every complete lesson.',
};

function relFromLesson(file) {
  return path.relative(lessonDir, file).replaceAll(path.sep, '/');
}

function relFromSlides(file) {
  return path.relative(slidesDir, file).replaceAll(path.sep, '/');
}

async function readJsonIfExists(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

async function findDatabase() {
  const dbDir = path.join(lessonDir, 'database');
  const files = (await fs.readdir(dbDir).catch(() => []))
    .filter((file) => file.endsWith('_database.json') || file.endsWith('database.json'))
    .sort();
  if (!files.length) return {};
  return JSON.parse(await fs.readFile(path.join(dbDir, files[0]), 'utf8'));
}

function assetRole(assetPath) {
  if (assetPath.includes('/vocab-images/')) return 'vocabulary_image';
  if (assetPath.includes('/sample-images/')) return 'sample_sentence_image';
  if (assetPath.includes('/culture-images/')) return 'culture_image';
  if (assetPath.includes('/photos/')) return 'section_photo';
  if (assetPath.includes('/brand/')) return 'brand_asset';
  if (assetPath.includes('/reference/')) return 'reference_asset';
  if (assetPath.includes('/interactive/')) return 'interactive_asset';
  if (assetPath.endsWith('.css')) return 'stylesheet';
  if (assetPath.endsWith('.js')) return 'script';
  return 'slide_asset';
}

function recordIdFromSlide(file) {
  const match = file.match(/(?:vocab|sample|flashcard)-v(\d+[a-z]?)/i);
  return match ? `V${match[1].toUpperCase()}` : '';
}

function isLocalAsset(src) {
  return src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:') && !src.startsWith('#');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function imageInfo(absPath) {
  try {
    const meta = await sharp(absPath).metadata();
    const width = meta.width || null;
    const height = meta.height || null;
    return {
      width,
      height,
      format: meta.format || null,
      aspect_ratio: width && height ? Number((width / height).toFixed(4)) : null,
    };
  } catch {
    return null;
  }
}

function promptMapFromPrompts(promptsJson) {
  const map = new Map();
  const prompts = Array.isArray(promptsJson) ? promptsJson : promptsJson?.prompts;
  for (const item of prompts || []) {
    const file = item.filename || item.output_file || path.basename(item.output_path || '');
    if (file) map.set(file, item);
  }
  return map;
}

function vocabRecords(db) {
  return (db.content_items || [])
    .filter((item) => item.record_type === 'vocabulary' || item.type === 'vocabulary')
    .filter((item) => item.classroom_visibility !== 'teacher_only')
    .filter((item) => item.standalone_vocab_slide !== false)
    .sort((a, b) => Number(a.teaching_order || 9999) - Number(b.teaching_order || 9999));
}

await fs.mkdir(assetsDir, { recursive: true });
await fs.mkdir(qaDir, { recursive: true });

const db = await findDatabase();
const lessonId = db.metadata?.lesson_id || path.basename(lessonDir);
const slides = (await fs.readdir(slidesDir).catch(() => []))
  .filter((file) => /^\d{2,3}-.+\.html$/.test(file))
  .sort((a, b) => Number(a.split('-')[0]) - Number(b.split('-')[0]));
const promptMap = promptMapFromPrompts(await readJsonIfExists(path.join(assetsDir, 'vocab-images', 'prompts.json')));
const recordsById = new Map((db.content_items || []).map((item) => [item.record_id, item]));
const recordsByChinese = new Map((db.content_items || []).map((item) => [item.chinese_simplified, item]));

const assetRefs = new Map();

function addRef(assetRel, slideFile, kind, context = {}) {
  if (!isLocalAsset(assetRel)) return;
  const normalized = assetRel.replace(/^\.?\//, '');
  const key = normalized;
  const existing = assetRefs.get(key) || {
    asset_path: normalized,
    role: assetRole(normalized),
    used_by: [],
    html_reference_types: [],
    record_ids: [],
    chinese: [],
    pinyin: [],
    vietnamese: [],
  };
  existing.used_by.push(slideFile);
  existing.html_reference_types.push(kind);
  existing.record_ids.push(context.record_id || recordIdFromSlide(slideFile));
  existing.chinese.push(context.chinese);
  existing.pinyin.push(context.pinyin);
  existing.vietnamese.push(context.vietnamese);
  assetRefs.set(key, existing);
}

for (const slide of slides) {
  const text = await fs.readFile(path.join(slidesDir, slide), 'utf8');
  const recordId = recordIdFromSlide(slide);
  const record = recordsById.get(recordId);

  for (const match of text.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    const tag = match[0];
    const src = match[1];
    const alt = tag.match(/\balt=["']([^"']*)["']/i)?.[1] || '';
    const altRecord = recordsByChinese.get(alt);
    addRef(src, slide, 'img', {
      record_id: record?.record_id || altRecord?.record_id,
      chinese: record?.chinese_simplified || altRecord?.chinese_simplified || alt,
      pinyin: record?.pinyin || altRecord?.pinyin,
      vietnamese: record?.vietnamese || altRecord?.vietnamese,
    });
  }

  for (const match of text.matchAll(/url\(["']?([^"')]+)["']?\)/gi)) {
    addRef(match[1], slide, 'css_url', {
      record_id: record?.record_id,
      chinese: record?.chinese_simplified,
      pinyin: record?.pinyin,
      vietnamese: record?.vietnamese,
    });
  }

  for (const required of ['assets/slide-base.css', 'assets/slide-base.js']) {
    if (text.includes(required)) addRef(required, slide, required.endsWith('.css') ? 'stylesheet' : 'script');
  }
}

for (const required of ['assets/slide-base.css', 'assets/slide-base.js', 'assets/brand/logo-watermark.png']) {
  addRef(required, 'lesson-required-assets', 'required');
}

const entries = [];
for (const ref of assetRefs.values()) {
  const abs = path.join(slidesDir, ref.asset_path);
  const exists = await fs.stat(abs).then(() => true).catch(() => false);
  const prompt = promptMap.get(path.basename(ref.asset_path));
  const info = exists ? await imageInfo(abs) : null;
  const imageStatus = exists ? 'ready_for_visual_qa' : 'missing';
  entries.push({
    id: ref.asset_path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase(),
    asset_path: ref.asset_path,
    role: ref.role,
    status: imageStatus,
    exists,
    dimensions: info,
    used_by: unique(ref.used_by).sort(),
    html_reference_types: unique(ref.html_reference_types).sort(),
    record_ids: unique([prompt?.record_id, prompt?.recordId, ...ref.record_ids]).sort(),
    chinese: unique([prompt?.chinese, prompt?.chinese_simplified, ...ref.chinese]),
    pinyin: unique([prompt?.pinyin, ...ref.pinyin]),
    vietnamese: unique([prompt?.vietnamese, ...ref.vietnamese]),
    prompt: prompt?.prompt || '',
    visual_description: prompt?.visual_description || '',
    replacement_rule: ref.role === 'vocabulary_image'
      ? 'Replace through scripts/replace-lesson-image.mjs so the image is resized to 16:9 and the manifest is rebuilt.'
      : 'Replace the file in place, then rebuild the asset manifest and rerun asset QA.',
  });
}

const standaloneVocab = vocabRecords(db);
const vocabCoverage = standaloneVocab.map((record) => {
  const candidates = entries.filter((entry) =>
    entry.role === 'vocabulary_image'
    && (entry.record_ids.includes(record.record_id)
      || entry.chinese.includes(record.chinese_simplified)
      || entry.used_by.some((slide) => slide.includes(`vocab-${String(record.record_id || '').toLowerCase()}`))));
  return {
    record_id: record.record_id,
    chinese_simplified: record.chinese_simplified,
    pinyin: record.pinyin,
    vietnamese: record.vietnamese,
    assets: candidates.map((entry) => entry.asset_path),
    status: candidates.length ? 'covered' : 'needs_image_mapping',
  };
});

const manifest = {
  schema_version: '1.0.0',
  lesson_id: lessonId,
  generated_at: new Date().toISOString(),
  source_database: db.metadata ? relFromLesson(path.join(lessonDir, 'database')) : '',
  workflow: {
    standard: 'Database image metadata -> asset manifest -> slide generation/replacement -> asset QA -> screenshot/contact-sheet QA.',
    required_steps: [
      'Run or update VP database with image_asset_* metadata for each needed classroom image.',
      'Build slides/assets/asset-manifest.json before and after slide generation.',
      'Generate or replace images using the manifest paths, not ad hoc HTML edits.',
      'Run npm run assets:qa -- --lesson <lesson-root> before delivery.',
      'Use screenshot/contact-sheet QA for visual semantic checks. Export clean PDF only after Adam confirms finalization.',
    ],
  },
  requirements: requiredAssetStyle,
  assets: entries.sort((a, b) => a.asset_path.localeCompare(b.asset_path)),
  vocabulary_coverage: vocabCoverage,
};

await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
await fs.writeFile(path.join(qaDir, 'asset-manifest-report.json'), `${JSON.stringify({
  lesson_id: lessonId,
  generated_at: manifest.generated_at,
  manifest: relFromLesson(manifestPath),
  asset_count: manifest.assets.length,
  missing_assets: manifest.assets.filter((entry) => !entry.exists).map((entry) => entry.asset_path),
  vocabulary_needs_mapping: vocabCoverage.filter((entry) => entry.status !== 'covered'),
}, null, 2)}\n`, 'utf8');

console.log(`Built asset manifest for ${lessonId}`);
console.log(`  ${relFromLesson(manifestPath)}`);
console.log(`  assets: ${manifest.assets.length}`);
