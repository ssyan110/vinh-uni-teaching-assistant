#!/usr/bin/env node
/**
 * Create or refresh slides/index.html from the Lesson 01 presenter template.
 *
 * This keeps the complex presenter runtime consistent while updating only the
 * lesson-specific fields: title, slide count, MANIFEST, first slide, and PDF name.
 *
 * Usage:
 *   node scripts/sync-lesson-presenter.mjs --lesson output/book-1/lesson-10
 */
import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const args = process.argv.slice(2);
const lessonArgIndex = args.indexOf('--lesson');
const lessonArg = lessonArgIndex === -1 ? null : args[lessonArgIndex + 1];

if (!lessonArg) {
  console.error('Usage: node scripts/sync-lesson-presenter.mjs --lesson <lesson-dir>');
  process.exit(1);
}

async function exists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readLessonInfo(lessonDir) {
  const databaseDir = path.join(lessonDir, 'database');
  const fallbackId = path.basename(lessonDir);
  const info = {
    lessonId: fallbackId,
    title: fallbackId,
  };

  const dbFiles = (await fs.readdir(databaseDir).catch(() => []))
    .filter((file) => file.endsWith('_database.json') || file.endsWith('database.json'))
    .sort();
  if (!dbFiles.length) return info;

  const data = JSON.parse(await fs.readFile(path.join(databaseDir, dbFiles[0]), 'utf8'));
  const meta = data.metadata || {};
  const listItem = Array.isArray(data.lesson_list) ? data.lesson_list[0] || {} : {};
  const sheetItem = Array.isArray(data.google_sheets_database) ? data.google_sheets_database[0] || {} : {};
  const contentItem = Array.isArray(data.content_items) ? data.content_items[0] || {} : {};
    const topLevelId = typeof data.lesson_id === 'string' ? data.lesson_id : '';
    const normalizedTopLevelId = topLevelId.replace(/^pinyin_lesson_(\d+)$/, (_match, no) => `pinyin-${String(Number(no)).padStart(2, '0')}`);
    const titleObject = data.title || {};
    const titleZh = typeof titleObject.zh === 'string' ? titleObject.zh : '';
    info.lessonId = meta.lesson_id || listItem.lesson_id || normalizedTopLevelId || fallbackId;
    info.title = listItem.lesson_title || meta.lesson_title || sheetItem.lesson_title || contentItem.lesson_title || titleZh || info.lessonId;

  if (info.title === info.lessonId) {
    const lessonListPath = path.join(path.dirname(lessonDir), 'lesson_list.csv');
    const lessonList = await fs.readFile(lessonListPath, 'utf8').catch(() => '');
    const line = lessonList.split(/\r?\n/).find((row) => row.startsWith(`${info.lessonId},`));
    if (line) {
      const cells = line.split(',');
      info.title = cells[1] || info.title;
    }
  }
  return info;
}

function displayTitle(info) {
  const simplifyPinyinTitle = (value) => String(value)
    .replaceAll('聲', '声')
    .replaceAll('擴', '扩')
    .replaceAll('與', '与')
    .replaceAll('拼寫', '拼写')
    .replaceAll('規則', '规则')
    .replaceAll('課', '课');
  const lessonMatch = String(info.lessonId).match(/lesson-(\d+)/);
  const pinyinMatch = String(info.lessonId).match(/pinyin-(\d+)/);
  const lessonNo = lessonMatch ? Number(lessonMatch[1]) : null;
  const pinyinNo = pinyinMatch ? Number(pinyinMatch[1]) : null;
  const parts = String(info.title).split(' · ');
  const chineseTitle = parts.find((part) => /[\u3400-\u9fff]/.test(part) && !/^第.+课$/.test(part.trim()))
    || parts.find((part) => /[\u3400-\u9fff]/.test(part))
    || info.title;
  if (pinyinNo) return `Pinyin Bài ${pinyinNo}`;
  return lessonNo ? `Bài ${lessonNo} · ${chineseTitle.replace(/^第.+课\s*/, '')}` : info.title;
}

function pdfFileName(info) {
  return `${info.lessonId}-teacher-deck.pdf`;
}

function replaceRequired(source, pattern, replacement, label) {
  if (!pattern.test(source)) {
    throw new Error(`Could not update ${label}. Template may have changed.`);
  }
  const updated = source.replace(pattern, replacement);
  return updated;
}

const lessonDir = path.resolve(root, lessonArg);
const slidesDir = path.join(lessonDir, 'slides');
const templatePath = path.join(root, 'output/book-1/lesson-01/slides/index.html');

if (!await exists(templatePath)) {
  throw new Error(`Missing presenter template: ${path.relative(root, templatePath)}`);
}

const slideFiles = (await fs.readdir(slidesDir).catch(() => []))
  .filter((file) => /^\d+-.+\.html$/.test(file))
  .sort((a, b) => Number(a.split('-')[0]) - Number(b.split('-')[0]));

if (!slideFiles.length) {
  throw new Error(`No numbered slide HTML files found in ${path.relative(root, slidesDir)}`);
}

const info = await readLessonInfo(lessonDir);
const title = displayTitle(info);
const manifest = slideFiles.map((file) => `  "${file}"`).join(',\n');
const count = slideFiles.length;

let presenter = await fs.readFile(templatePath, 'utf8');
presenter = replaceRequired(presenter, /<title>.*?<\/title>/, `<title>${title}</title>`, 'document title');
presenter = replaceRequired(
  presenter,
  /<div class="header"><h1>.*?<\/h1><div class="subtitle">.*?<\/div><\/div>/,
  `<div class="header"><h1>${title}</h1><div class="subtitle">${count} slides · Press <strong>F</strong> for presentation mode</div></div>`,
  'header',
);
presenter = replaceRequired(
  presenter,
  /<div class="thumb-head"><div class="thumb-title">Mục lục<\/div><div class="thumb-total">\d+<\/div><\/div>/,
  `<div class="thumb-head"><div class="thumb-title">Mục lục</div><div class="thumb-total">${count}</div></div>`,
  'thumbnail total',
);
presenter = replaceRequired(presenter, /<iframe id="slideFrame"[^>]*><\/iframe>/, `<iframe id="slideFrame" src="${slideFiles[0]}"></iframe>`, 'first iframe');
presenter = replaceRequired(presenter, /<span class="counter" id="counter">[^<]+<\/span>/, `<span class="counter" id="counter">1 / ${count}</span>`, 'counter');
presenter = replaceRequired(presenter, /<span class="counter" id="counterFloat">[^<]+<\/span>/, `<span class="counter" id="counterFloat">1 / ${count}</span>`, 'floating counter');
presenter = replaceRequired(presenter, /<p id="exportStatus">Rendering slide 1 \/ \d+<\/p>/, `<p id="exportStatus">Rendering slide 1 / ${count}</p>`, 'export status');
presenter = replaceRequired(presenter, /const MANIFEST = \[[\s\S]*?\];/, `const MANIFEST = [\n${manifest}\n];`, 'MANIFEST');
presenter = replaceRequired(presenter, /pdf\.save\(['"][^'"]+['"]\);/, `pdf.save('${pdfFileName(info)}');`, 'PDF filename');

await fs.writeFile(path.join(slidesDir, 'index.html'), presenter, 'utf8');

console.log(JSON.stringify({
  lesson: path.relative(root, lessonDir),
  title,
  slides: count,
  presenter: path.relative(root, path.join(slidesDir, 'index.html')),
  pdf: pdfFileName(info),
}, null, 2));
