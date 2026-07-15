#!/usr/bin/env node
/**
 * Builds a source-faithful Coral Studio Design Option 2 deck for a Pinyin lesson.
 * Usage: node scripts/create-pinyin-coral-studio-option.mjs 02
 */
import fs from 'fs/promises';
import path from 'path';

const lessonNumber = process.argv[2];
if (!/^\d{2}$/.test(lessonNumber || '')) {
  throw new Error('Usage: node scripts/create-pinyin-coral-studio-option.mjs 02');
}

const root = process.cwd();
const lessonId = `pinyin-${lessonNumber}`;
const lesson = path.join(root, 'output/pinyin', lessonId);
const sourceSlides = path.join(lesson, 'slides');
const destination = path.join(lesson, 'design-options/02-coral-studio');

try {
  await fs.access(destination);
  throw new Error(`Refusing to overwrite existing option: ${path.relative(root, destination)}`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const coralBase = await fs.readFile(
  path.join(root, 'output/pinyin/pinyin-07/design-prototypes/02-coral-studio/prototype.css'),
  'utf8',
);
const pinyinCoverage = `
/* Existing slide geometry is preserved; these additions only recolor shared Pinyin templates. */
.cover-title,.title-md,.big-hanzi,.choice,.large-list li,.practice-token,.drill-token,.tone-row,.tone-options span,.vocab-drill .zh,.review-card h3,.setup-step h3,.numbered-list li,.closing-zh{color:#382F4D}
.cover-sub,.teal,.big-pinyin,.badge,.pill-bank span,.flow-chips span,.drill-token .pin,.vocab-drill .pin,.closing-sub{color:#D95E50}
.purple,.badge-purple{color:#6655B8}.amber,.badge-amber{color:#B5741D}.red,.badge-red{color:#B63755}
.badge,.flow-chips span{background:#FFE6DF}.badge-purple{background:#EEE9FF}.badge-amber{background:#FFF0D7}.badge-red{background:#FCE7EC}
.flat-card,.choice,.large-list li,.practice-token,.drill-token,.tone-row,.vocab-drill,.review-card,.setup-step,.numbered-list li,.pill-bank span,.reference-image,.closing-card{background:#FFFDFC;border-color:rgba(177,91,82,.22);box-shadow:0 10px 28px rgba(141,75,69,.10)}
.num,.review-card .review-num,.setup-step .step-num,.numbered-list li:before{background:#D95E50;color:#FFF}
.cover-art,.topic-img,.overview-art,.divider-photo,.closing-photo{border-color:#D95E50;box-shadow:0 12px 30px rgba(141,75,69,.16)}
.sound-table th,.sound-table-full th{background:#FFE6DF;color:#D95E50}.sound-table td{background:#FFFDFC;border-color:rgba(177,91,82,.22);color:#382F4D}.sound-table .rowh{background:#EEE9FF;color:#6655B8}
.body-text,.setup-step p,.setup-try,.step p,.review-card p,.vi{color:#766565}.setup-try{background:#FFF0EA;border-color:rgba(177,91,82,.22)}
`;

await fs.mkdir(path.join(destination, 'slides'), { recursive: true });
await fs.writeFile(path.join(destination, 'prototype.css'), `${coralBase}\n${pinyinCoverage}`);

const entries = (await fs.readdir(sourceSlides)).filter((file) => /^\d{2}-.+\.html$/.test(file)).sort();
for (const file of entries) {
  let html = await fs.readFile(path.join(sourceSlides, file), 'utf8');
  html = html.replaceAll('assets/', '../../../slides/assets/');
  html = html.replace('</head>', '<link rel="stylesheet" href="../prototype.css"></head>');
  await fs.writeFile(path.join(destination, 'slides', file), html);
}

let presenter = await fs.readFile(path.join(sourceSlides, 'index.html'), 'utf8');
presenter = presenter.replace('</title>', ' · Coral Studio</title>');
await fs.writeFile(path.join(destination, 'slides/index.html'), presenter);
await fs.writeFile(path.join(destination, 'README.md'), `# ${lessonId} · Design Option 2 — Coral Studio\n\nFull source-faithful visual version. The original source content, layout geometry, and interactions are preserved.\n`);
console.log(`Created ${entries.length} ${lessonId} Coral Studio slides in ${path.relative(root, destination)}`);
