#!/usr/bin/env node
/**
 * Validate that the core system infrastructure is in place.
 * Does NOT validate lesson-specific output — that varies per lesson.
 *
 * Usage:
 *   node scripts/validate-system.mjs
 *   node scripts/validate-system.mjs --lesson output/book-1/lesson-01
 *
 * Options:
 *   --lesson <path>   Also validate a specific lesson output directory
 */
import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const args = process.argv.slice(2);
const lessonArg = args.indexOf('--lesson') !== -1 ? args[args.indexOf('--lesson') + 1] : null;

let ok = true;

function check(label, pass, detail = '') {
  if (pass) {
    console.log(`✓ ${label}${detail ? ' — ' + detail : ''}`);
  } else {
    console.error(`✗ ${label}${detail ? ' — ' + detail : ''}`);
    ok = false;
  }
}

async function exists(rel) {
  try { await fs.stat(path.join(root, rel)); return true; } catch { return false; }
}

async function readLessonInfo(lessonDir) {
  const fallbackId = path.basename(lessonDir);
  const info = {
    lessonId: fallbackId,
    title: fallbackId,
    status: 'draft_for_teacher_review',
  };

  const dbDir = path.join(lessonDir, 'database');
  const dbFiles = (await fs.readdir(dbDir).catch(() => []))
    .filter((file) => file.endsWith('_database.json') || file.endsWith('database.json'))
    .sort();
  if (dbFiles.length) {
    const data = JSON.parse(await fs.readFile(path.join(dbDir, dbFiles[0]), 'utf8'));
    const meta = data.metadata || {};
    const listItem = Array.isArray(data.lesson_list) ? data.lesson_list[0] || {} : {};
    const sheetItem = Array.isArray(data.google_sheets_database) ? data.google_sheets_database[0] || {} : {};
    const contentItem = Array.isArray(data.content_items) ? data.content_items[0] || {} : {};
    info.lessonId = meta.lesson_id || listItem.lesson_id || fallbackId;
    info.title = listItem.lesson_title || meta.lesson_title || sheetItem.lesson_title || contentItem.lesson_title || info.lessonId;
    info.status = meta.status || listItem.status || (meta.finalized ? 'finalized' : info.status);
  }

  if (info.title === info.lessonId) {
    const lessonList = await fs.readFile(path.join(path.dirname(lessonDir), 'lesson_list.csv'), 'utf8').catch(() => '');
    const line = lessonList.split(/\r?\n/).find((row) => row.startsWith(`${info.lessonId},`));
    if (line) {
      const cells = line.split(',');
      info.title = cells[1] || info.title;
      info.status = cells[5] || info.status;
    }
  }

  return info;
}

// ── Core infrastructure ──────────────────────────────────────────────────────
console.log('\n── Core infrastructure ──');

const coreFiles = [
  // Skills
  '.kiro/skills/huashu-design/SKILL.md',
  '.kiro/skills/ai-teaching-material-systems/SKILL.md',
  '.kiro/skills/google-workspace/SKILL.md',
  '.kiro/skills/avoid-ai-writing/SKILL.md',
  // Pipeline
  'scripts/pipeline/configs/_schema.json',
  'scripts/pipeline/configs/regular.json',
  'scripts/pipeline/configs/pinyin.json',
  'scripts/pipeline/router.py',
  'scripts/pipeline/core.py',
  'scripts/pipeline/validator.py',
  'scripts/pipeline/detector.py',
  'scripts/pipeline/csv_writer.py',
  'scripts/run_pipeline.py',
  // Generic slide scripts
  'scripts/build-slides-data.mjs',
  'scripts/export-slides-pdf.mjs',
  'scripts/watch-slides.mjs',
  'scripts/create-teacher-deck.mjs',
  'scripts/sync-lesson-presenter.mjs',
  'scripts/update-lesson-shell.mjs',
  'scripts/build-lesson-asset-manifest.mjs',
  'scripts/qa-lesson-assets.mjs',
  'scripts/replace-lesson-image.mjs',
  // Hooks
  '.kiro/hooks/rebuild-slide-data.kiro.hook',
  // Docs
  'AGENTS.md',
  'CLAUDE.md',
  '.cursorrules',
  '.windsurfrules',
];

for (const rel of coreFiles) {
  const st = await fs.stat(path.join(root, rel)).catch(() => null);
  check(rel, !!st, st ? `${st.size} bytes` : 'MISSING');
}

// ── package.json dependencies ────────────────────────────────────────────────
console.log('\n── Dependencies ──');
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
for (const dep of ['playwright', 'sharp', 'pdf-lib']) {
  check(`dependency: ${dep}`, !!pkg.dependencies?.[dep]);
}
// pptxgenjs is deprecated — flag if still present
if (pkg.dependencies?.pptxgenjs) {
  console.warn('⚠ pptxgenjs still in dependencies — PPTX is deprecated from this workflow');
}

// ── Pipeline configs ─────────────────────────────────────────────────────────
console.log('\n── Pipeline configs ──');
const configsDir = path.join(root, 'scripts/pipeline/configs');
const configFiles = (await fs.readdir(configsDir).catch(() => [])).filter(f => f.endsWith('.json') && !f.startsWith('_'));
check('at least 2 lesson type configs', configFiles.length >= 2, configFiles.join(', '));

// ── Lesson-specific validation (optional) ────────────────────────────────────
if (lessonArg) {
  console.log(`\n── Lesson: ${lessonArg} ──`);
  const lessonDir = path.resolve(root, lessonArg);
  const slidesDir = path.join(lessonDir, 'slides');
  const dbDir = path.join(lessonDir, 'database');
  const info = await readLessonInfo(lessonDir);
  console.log(`Status: ${info.status}`);

  const rootIndexPath = path.join(lessonDir, 'index.html');
  const rootIndexExists = await exists(path.relative(root, rootIndexPath));
  check('lesson-root index.html', rootIndexExists);

  for (const dir of ['slides', 'database', 'exports/final', 'exports/qa', 'exports/archive', 'teacher-guide', 'homework-question-bank']) {
    check(`${dir}/ exists`, await exists(path.relative(root, path.join(lessonDir, dir))));
  }

  check('no slides/slides-data.js clutter', !await exists(path.relative(root, path.join(slidesDir, 'slides-data.js'))));
  const slideRootFiles = (await fs.readdir(slidesDir).catch(() => []));
  const toolbarScreenshots = slideRootFiles.filter(f => /^atlas-toolbar.*\.png$/.test(f));
  check('no QA toolbar screenshots in slides/', toolbarScreenshots.length === 0, toolbarScreenshots.join(', '));

  const indexPath = path.join(slidesDir, 'index.html');
  const indexExists = await exists(path.relative(root, indexPath));
  const numberedSlides = (await fs.readdir(slidesDir).catch(() => []))
    .filter(f => /^\d+-.+\.html$/.test(f));
  const isDraftDatabaseOnly = !indexExists && numberedSlides.length === 0 && /draft_for_teacher_review|pending|review/i.test(info.status);

  if (rootIndexExists) {
    const rootIndexContent = await fs.readFile(rootIndexPath, 'utf8');
    if (indexExists) {
      check('lesson-root index opens slides/index.html', /slides\/index\.html/.test(rootIndexContent) && /location\.replace|meta http-equiv="refresh"/.test(rootIndexContent));
    } else {
      check('draft root does not redirect to missing presenter', !/location\.replace\(['"]slides\/index\.html/.test(rootIndexContent) && !/http-equiv="refresh"[^>]+slides\/index\.html/i.test(rootIndexContent));
      check('draft root explains missing presenter', /Chưa có presenter|slides\/index\.html[^<]+chưa được tạo/.test(rootIndexContent));
    }
  }

  check('slides/index.html', indexExists || isDraftDatabaseOnly, indexExists ? 'ready' : 'not required until steps 12-13');

  const dbFiles = (await fs.readdir(dbDir).catch(() => []));
  check('database/ has files', dbFiles.length > 0, dbFiles.join(', '));

  if (indexExists) {
    const indexContent = await fs.readFile(indexPath, 'utf8');
    check('presenter title is lesson-specific', indexContent.includes(info.lessonId) || indexContent.includes(`Bài ${Number(info.lessonId.replace(/\D+/g, ''))}`));
    const pdfMatch = indexContent.match(/pdf\.save\(['"]([^'"]+)['"]\);/);
    check('presenter PDF filename is lesson-specific', !!pdfMatch && pdfMatch[1].includes(info.lessonId), pdfMatch ? pdfMatch[1] : 'not found');

    const assetManifestPath = path.join(slidesDir, 'assets/asset-manifest.json');
    const assetManifestExists = await exists(path.relative(root, assetManifestPath));
    check('asset manifest exists', assetManifestExists, assetManifestExists ? path.relative(root, assetManifestPath) : 'run npm run assets:manifest -- ' + lessonArg);
    if (assetManifestExists) {
      const assetManifest = JSON.parse(await fs.readFile(assetManifestPath, 'utf8'));
      check('asset manifest has assets', Array.isArray(assetManifest.assets) && assetManifest.assets.length > 0, `${assetManifest.assets?.length || 0} assets`);
      const missingAssets = (assetManifest.assets || []).filter((asset) => !asset.exists);
      check('asset manifest has no missing assets', missingAssets.length === 0, missingAssets.map((asset) => asset.asset_path).join(', '));
      const uncoveredVocab = (assetManifest.vocabulary_coverage || []).filter((entry) => entry.status !== 'covered');
      check('asset manifest covers standalone vocab images', uncoveredVocab.length === 0, uncoveredVocab.map((entry) => `${entry.record_id}:${entry.chinese_simplified}`).join(', '));
    }

    const assetQaPath = path.join(lessonDir, 'exports/qa/asset-qa-report.json');
    const assetQaExists = await exists(path.relative(root, assetQaPath));
    check('asset QA report exists', assetQaExists, assetQaExists ? path.relative(root, assetQaPath) : 'run npm run assets:qa -- ' + lessonArg);
    if (assetQaExists) {
      const assetQa = JSON.parse(await fs.readFile(assetQaPath, 'utf8'));
      check('asset QA report passed', assetQa.status === 'passed', assetQa.status || 'unknown');
    }

    const manifestMatch = indexContent.match(/const MANIFEST = \[([\s\S]*?)\];/);
    if (manifestMatch) {
      const slideFiles = [...manifestMatch[1].matchAll(/["']([^"']+\.html)["']/g)].map(m => m[1]);
      check('MANIFEST found', true, `${slideFiles.length} slides`);

      // Check all MANIFEST files exist
      let missing = 0;
      for (const f of slideFiles) {
        if (!await exists(path.relative(root, path.join(slidesDir, f)))) {
          console.error(`  ✗ Missing slide: ${f}`);
          missing++;
        }
      }
      check('all MANIFEST slides exist', missing === 0, missing > 0 ? `${missing} missing` : 'all present');

      // Check no gaps in numbering
      const nums = slideFiles.map(f => parseInt(f.split('-')[0])).filter(n => !isNaN(n));
      const expectedNums = Array.from({ length: nums.length }, (_, i) => i + 1);
      const hasGaps = nums.some((n, i) => n !== expectedNums[i]);
      check('slide filenames sequentially numbered', !hasGaps);
    } else {
      check('MANIFEST found', false, 'not found in index.html');
    }

    // Check no legacy tool references
    const slides = (await fs.readdir(slidesDir).catch(() => [])).filter(f => f.endsWith('.html') && f !== 'index.html');
    const legacyPattern = new RegExp(['Gam', 'ma'].join(''), 'i');
    let legacyCount = 0;
    for (const f of slides) {
      const txt = await fs.readFile(path.join(slidesDir, f), 'utf8');
      if (legacyPattern.test(txt)) legacyCount++;
    }
    check('no legacy slide-tool references', legacyCount === 0, legacyCount > 0 ? `${legacyCount} files` : '');
  }
}

// ── Result ───────────────────────────────────────────────────────────────────
console.log('');
if (!ok) {
  console.error('System validation FAILED.');
  process.exit(1);
}
console.log('System validation passed.');
