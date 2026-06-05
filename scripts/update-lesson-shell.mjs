#!/usr/bin/env node
/**
 * Keep a lesson root safe to open and share.
 *
 * Usage:
 *   node scripts/update-lesson-shell.mjs --lesson output/book-1/lesson-02
 *   node scripts/update-lesson-shell.mjs --all output/book-1
 */
import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const args = process.argv.slice(2);

function valueOf(flag) {
  const i = args.indexOf(flag);
  return i === -1 ? null : args[i + 1];
}

const lessonArg = valueOf('--lesson');
const allArg = valueOf('--all');

if (!lessonArg && !allArg) {
  console.error('Usage: node scripts/update-lesson-shell.mjs --lesson <lesson-dir>');
  console.error('   or: node scripts/update-lesson-shell.mjs --all output/book-1');
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

function htmlEscape(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function lessonNumberFromId(lessonId) {
  const match = String(lessonId).match(/lesson-(\d+)/);
  return match ? String(Number(match[1])) : String(lessonId);
}

async function readLessonInfo(lessonDir) {
  const databaseDir = path.join(lessonDir, 'database');
  const dbFiles = (await fs.readdir(databaseDir).catch(() => []))
    .filter((file) => file.endsWith('_database.json') || file.endsWith('database.json'))
    .sort();

  const fallbackId = path.basename(lessonDir);
  const info = {
    lessonId: fallbackId,
    title: fallbackId,
    status: 'draft_for_teacher_review',
    contentSummary: '',
  };

  if (!dbFiles.length) return info;

  const data = JSON.parse(await fs.readFile(path.join(databaseDir, dbFiles[0]), 'utf8'));
  const meta = data.metadata || {};
  const listItem = Array.isArray(data.lesson_list) ? data.lesson_list[0] || {} : {};
  const sheetItem = Array.isArray(data.google_sheets_database) ? data.google_sheets_database[0] || {} : {};
  const contentItem = Array.isArray(data.content_items) ? data.content_items[0] || {} : {};
  info.lessonId = meta.lesson_id || listItem.lesson_id || fallbackId;
  info.title = listItem.lesson_title || meta.lesson_title || sheetItem.lesson_title || contentItem.lesson_title || info.lessonId;
  info.status = meta.status || listItem.status || (meta.finalized ? 'finalized' : info.status);

  if (info.title === info.lessonId) {
    const lessonListPath = path.join(path.dirname(lessonDir), 'lesson_list.csv');
    const lessonList = await fs.readFile(lessonListPath, 'utf8').catch(() => '');
    const line = lessonList.split(/\r?\n/).find((row) => row.startsWith(`${info.lessonId},`));
    if (line) {
      const cells = line.split(',');
      info.title = cells[1] || info.title;
      info.status = cells[5] || info.status;
    }
  }

  const contentItems = Array.isArray(data.content_items) ? data.content_items : [];
  const vocabCount = contentItems.filter((item) => item.item_type === 'vocabulary').length;
  const textCount = contentItems.filter((item) => item.item_type === 'text').length;
  const grammarCount = contentItems.filter((item) => item.item_type?.includes('grammar')).length;
  const parts = [];
  if (vocabCount) parts.push(`${vocabCount} từ vựng`);
  if (textCount) parts.push(`${textCount} bài đọc/hội thoại`);
  if (grammarCount) parts.push(`${grammarCount} mục ngữ pháp/ngữ âm`);
  info.contentSummary = parts.join(', ');
  return info;
}

function activeLauncher(title) {
  const safeTitle = htmlEscape(title);
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=slides/index.html">
  <title>${safeTitle}</title>
  <script>window.location.replace('slides/index.html');</script>
</head>
<body>
  <p><a href="slides/index.html">Mở bài học</a></p>
</body>
</html>
`;
}

function draftLauncher(info) {
  const lessonNo = lessonNumberFromId(info.lessonId);
  const safeTitle = htmlEscape(info.title);
  const safeStatus = htmlEscape(info.status);
  const safeSummary = htmlEscape(info.contentSummary || 'Database đã có, slides chưa được tạo.');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <style>
    :root{color-scheme:light;--ink:#1A3A5A;--muted:#5F7088;--line:#D9E6EF;--teal:#5AACAC;--bg:#F6FAFB}
    *{box-sizing:border-box}
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink)}
    main{width:min(720px,calc(100vw - 40px));background:#fff;border:1px solid var(--line);border-radius:8px;padding:34px 38px;box-shadow:0 18px 48px rgba(26,58,90,.10)}
    .eyebrow{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--teal);margin-bottom:10px}
    h1{font-size:28px;line-height:1.25;margin:0 0 12px}
    p{font-size:16px;line-height:1.6;margin:8px 0;color:var(--muted)}
    code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#EEF6F6;border:1px solid #D5ECEC;border-radius:6px;padding:2px 6px;color:#1A3A5A}
    .meta{margin-top:22px;padding-top:18px;border-top:1px solid var(--line)}
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">Bài ${htmlEscape(lessonNo)} · Chưa có presenter</div>
    <h1>${safeTitle}</h1>
    <p>Lesson này hiện mới có database để giáo viên xem lại. File <code>slides/index.html</code> chưa được tạo, nên trang này không tự chuyển hướng để tránh mở nhầm một đường dẫn hỏng.</p>
    <div class="meta">
      <p><strong>Trạng thái:</strong> ${safeStatus}</p>
      <p><strong>Nội dung:</strong> ${safeSummary}</p>
      <p>Sau khi giáo viên duyệt nội dung, chạy bước tạo slides/presenter rồi mở lại <code>index.html</code>.</p>
    </div>
  </main>
</body>
</html>
`;
}

function readme(info, hasPresenter) {
  const state = hasPresenter
    ? 'Classroom presenter đã sẵn sàng. Open `index.html` from this folder root for class.'
    : 'Status: draft_for_teacher_review. Database is ready for teacher review; slides/presenter are not generated yet.';
  return `# ${info.title}

${state}

## Folder Map

| Path | Purpose |
|---|---|
| \`index.html\` | Safe lesson entry point. It opens \`slides/index.html\` only after the presenter exists. |
| \`slides/\` | Editable slide source files and runtime assets. Empty until steps 12-13 generate the deck. |
| \`database/\` | Reviewable lesson data and Google Sheets-ready CSV. |
| \`exports/final/\` | Clean PDF backups for teaching/archive, after Adam confirms finalization. |
| \`exports/qa/\` | Screenshots, contact sheets, and visual QA artifacts. |
| \`exports/archive/\` | Deprecated generated files kept only for traceability. |
| \`teacher-guide/\` | Teacher prep notes and Huashu brief. |
| \`homework-question-bank/\` | Homework/question-bank outputs. |
`;
}

async function updateLesson(lessonDir) {
  const absLessonDir = path.resolve(root, lessonDir);
  const info = await readLessonInfo(absLessonDir);
  const hasPresenter = await exists(path.join(absLessonDir, 'slides/index.html'));

  for (const dir of [
    'slides/assets',
    'database',
    'exports/final',
    'exports/qa',
    'exports/archive',
    'teacher-guide',
    'homework-question-bank',
  ]) {
    await fs.mkdir(path.join(absLessonDir, dir), { recursive: true });
  }

  await fs.writeFile(
    path.join(absLessonDir, 'index.html'),
    hasPresenter ? activeLauncher(info.title) : draftLauncher(info),
    'utf8',
  );

  const readmePath = path.join(absLessonDir, 'README.md');
  const readmeExists = await exists(readmePath);
  if (!readmeExists || !hasPresenter) {
    await fs.writeFile(readmePath, readme(info, hasPresenter), 'utf8');
  }

  console.log(JSON.stringify({
    lesson: path.relative(root, absLessonDir),
    title: info.title,
    status: info.status,
    presenter: hasPresenter ? 'ready' : 'missing',
    root_index: hasPresenter ? 'redirect' : 'draft-safe',
  }));
}

if (allArg) {
  const bookDir = path.resolve(root, allArg);
  const lessonList = await fs.readFile(path.join(bookDir, 'lesson_list.csv'), 'utf8').catch(() => '');
  let entries = lessonList
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(',')[0])
    .filter((lessonId) => /^lesson-\d+/.test(lessonId))
    .map((lessonId) => path.join(bookDir, lessonId));
  if (!entries.length) {
    entries = (await fs.readdir(bookDir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && /^lesson-\d+/.test(entry.name))
      .map((entry) => path.join(bookDir, entry.name))
      .sort();
  }
  for (const entry of entries) {
    await updateLesson(entry);
  }
} else {
  await updateLesson(lessonArg);
}
