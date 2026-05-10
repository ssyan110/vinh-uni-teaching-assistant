#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const required = [
  'huashu-design/SKILL.md',
  'huashu-design/references/slide-decks.md',
  'huashu-design/references/editable-pptx.md',
  'huashu-design/scripts/export_deck_pdf.mjs',
  'huashu-design/scripts/export_deck_pptx.mjs',
  'output/sample-teacher-deck/index.html',
  'output/sample-teacher-deck/TEACHER_GUIDE.md',
  'output/sample-teacher-deck/teacher-deck.pdf',
  'output/sample-teacher-deck/teacher-deck-editable.pptx'
];
let ok = true;
for (const rel of required) {
  try {
    const st = await fs.stat(path.join(root, rel));
    console.log(`✓ ${rel} (${st.size} bytes)`);
  } catch {
    console.error(`✗ Missing ${rel}`);
    ok = false;
  }
}
const slidesDir = path.join(root, 'output/sample-teacher-deck/slides');
const slides = (await fs.readdir(slidesDir).catch(() => [])).filter(f => f.endsWith('.html')).sort();
console.log(`✓ slides: ${slides.length}`);
if (slides.length < 7) ok = false;

const legacyDeckToolPattern = new RegExp(['Gam', 'ma'].join(''), 'i');

for (const f of slides) {
  const txt = await fs.readFile(path.join(slidesDir, f), 'utf8');
  if (legacyDeckToolPattern.test(txt)) {
    console.error(`✗ Legacy slide-tool reference found in ${f}`);
    ok = false;
  }
  if (!/width:\s*960pt/.test(txt) || !/height:\s*540pt/.test(txt)) {
    console.error(`✗ PPTX-safe dimensions missing in ${f}`);
    ok = false;
  }
}

const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
for (const dep of ['playwright', 'pptxgenjs', 'sharp', 'pdf-lib']) {
  if (!pkg.dependencies?.[dep]) {
    console.error(`✗ Missing dependency ${dep}`);
    ok = false;
  }
}

if (!ok) process.exit(1);
console.log('\nSystem validation passed.');
