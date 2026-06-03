#!/usr/bin/env node
/**
 * add-slide-icons.mjs
 * Adds decorative Lucide icons to each slide based on its section type.
 * Icons are placed at fixed positions with 80% opacity (opacity: 0.2 for subtle).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const slidesDirArg = args[args.indexOf('--slides-dir') + 1] || 'output/book-1/lesson-01/slides';
const slidesDir = path.resolve(root, slidesDirArg);

// Icon sets per section type (matched by filename pattern)
const ICON_SETS = {
  cover: [], // cover already has icons
  objectives: ['target', 'check-circle', 'list-checks'],
  warmup: ['sun', 'coffee', 'smile'],
  'divider-vocab': ['book-open', 'pen-tool'],
  vocab: ['bookmark', 'type', 'pencil'],
  examples: ['quote', 'message-square', 'lightbulb'],
  'vocab-summary': ['list', 'clipboard-list'],
  'divider-text': ['book-open', 'file-text'],
  dialogue: ['message-circle', 'users', 'mic'],
  'divider-practice': ['dumbbell', 'brain'],
  practice: ['puzzle', 'gamepad-2', 'trophy'],
  blooket: ['gamepad-2', 'zap', 'star'],
  'divider-culture': ['globe', 'landmark'],
  culture: ['globe', 'heart', 'sparkles'],
  'divider-exercises': ['clipboard', 'edit'],
  exercises: ['clipboard-list', 'check-square', 'pen'],
  homework: ['home', 'book', 'calendar'],
  closing: ['hand-metal', 'party-popper', 'heart'],
};

// Map filename to section type
function getSectionType(filename) {
  if (filename.includes('cover')) return 'cover';
  if (filename.includes('objectives')) return 'objectives';
  if (filename.includes('warmup')) return 'warmup';
  if (filename.includes('divider-vocab')) return 'divider-vocab';
  if (filename.includes('vocab-summary')) return 'vocab-summary';
  if (filename.includes('vocab')) return 'vocab';
  if (filename.includes('examples')) return 'examples';
  if (filename.includes('divider-text')) return 'divider-text';
  if (filename.includes('dialogue')) return 'dialogue';
  if (filename.includes('divider-practice')) return 'divider-practice';
  if (filename.includes('blooket')) return 'blooket';
  if (filename.includes('practice')) return 'practice';
  if (filename.includes('divider-culture')) return 'divider-culture';
  if (filename.includes('culture')) return 'culture';
  if (filename.includes('divider-exercises')) return 'divider-exercises';
  if (filename.includes('exercises')) return 'exercises';
  if (filename.includes('homework')) return 'homework';
  if (filename.includes('closing')) return 'closing';
  return 'vocab'; // fallback
}

// Fixed positions for decorative icons (2-3 per slide)
const POSITIONS = [
  { top: '80px', right: '60px', size: 36 },
  { bottom: '70px', left: '50px', size: 28 },
  { top: '180px', left: '40px', size: 24 },
];

const LUCIDE_SCRIPT = '<script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script>';
const LUCIDE_INIT = '<script>lucide.createIcons();</script>';

const CSS_SNIPPET = `
.deco-icon { position: absolute; opacity: 0.12; color: #5AACAC; z-index: 1; }
`;

const slides = fs.readdirSync(slidesDir)
  .filter(f => f.endsWith('.html') && f !== 'index.html')
  .sort();

let modified = 0;

for (const slideFile of slides) {
  const filePath = path.join(slidesDir, slideFile);
  let html = fs.readFileSync(filePath, 'utf-8');

  // Skip if already has lucide
  if (html.includes('lucide')) {
    console.log(`  skip ${slideFile} (already has icons)`);
    continue;
  }

  const sectionType = getSectionType(slideFile);
  const icons = ICON_SETS[sectionType] || ['sparkles', 'star'];

  if (icons.length === 0) {
    console.log(`  skip ${slideFile} (no icons for ${sectionType})`);
    continue;
  }

  // Add Lucide script to <head>
  html = html.replace('</head>', `${LUCIDE_SCRIPT}\n</head>`);

  // Add CSS for deco icons
  html = html.replace('</style>', `${CSS_SNIPPET}</style>`);

  // Add icon elements before </body>
  let iconHtml = '';
  for (let i = 0; i < Math.min(icons.length, POSITIONS.length); i++) {
    const pos = POSITIONS[i];
    const icon = icons[i];
    let style = `width:${pos.size}px;height:${pos.size}px;`;
    if (pos.top) style += `top:${pos.top};`;
    if (pos.bottom) style += `bottom:${pos.bottom};`;
    if (pos.left) style += `left:${pos.left};`;
    if (pos.right) style += `right:${pos.right};`;
    iconHtml += `<i data-lucide="${icon}" class="deco-icon" style="${style}"></i>\n`;
  }

  // Insert icons before </body> and add init script
  html = html.replace('</body>', `${iconHtml}${LUCIDE_INIT}\n</body>`);

  fs.writeFileSync(filePath, html);
  modified++;
  console.log(`  ✓ ${slideFile} → ${icons.slice(0, POSITIONS.length).join(', ')}`);
}

console.log(`\nDone! Modified ${modified} slides.`);
