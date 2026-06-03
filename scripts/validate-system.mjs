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

  const rootIndexPath = path.join(lessonDir, 'index.html');
  const rootIndexExists = await exists(path.relative(root, rootIndexPath));
  check('lesson-root index.html', rootIndexExists);
  if (rootIndexExists) {
    const rootIndexContent = await fs.readFile(rootIndexPath, 'utf8');
    check('lesson-root index opens slides/index.html', rootIndexContent.includes('slides/index.html'));
  }

  for (const dir of ['exports/final', 'exports/qa', 'exports/archive']) {
    check(`${dir}/ exists`, await exists(path.relative(root, path.join(lessonDir, dir))));
  }

  check('no slides/slides-data.js clutter', !await exists(path.relative(root, path.join(slidesDir, 'slides-data.js'))));
  const slideRootFiles = (await fs.readdir(slidesDir).catch(() => []));
  const toolbarScreenshots = slideRootFiles.filter(f => /^atlas-toolbar.*\.png$/.test(f));
  check('no QA toolbar screenshots in slides/', toolbarScreenshots.length === 0, toolbarScreenshots.join(', '));

  const indexExists = await exists(path.relative(root, path.join(slidesDir, 'index.html')));
  check('slides/index.html', indexExists);

  const dbFiles = (await fs.readdir(dbDir).catch(() => []));
  check('database/ has files', dbFiles.length > 0, dbFiles.join(', '));

  if (indexExists) {
    const indexContent = await fs.readFile(path.join(slidesDir, 'index.html'), 'utf8');
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
