#!/usr/bin/env node
'use strict';
// Read-only delivery check. Visual and interaction QA remain required.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = __dirname;
const root = path.resolve(base, '../..');
const args = process.argv.slice(2);
const errors = [], warnings = [];
let strict = false, bookId, setId;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--strict') strict = true;
  else if (['--book', '--set'].includes(args[i]) && args[i + 1] && !args[i + 1].startsWith('--')) {
    if (args[i++] === '--book') bookId = args[i]; else setId = args[i];
  } else { console.error('Usage: node check-consistency.cjs [--strict] [--book BOOK_ID] [--set PLAYLIST_ID]'); process.exit(2); }
}
const context = { window: {} };
for (const file of ['catalog.js', 'ui.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(base, file), 'utf8'), context, { timeout: 1000 });
}
const books = context.window.AUDIO_CATALOG;
const ui = context.window.AudioDashboardUI;
const requireValue = (condition, message) => { if (!condition) errors.push(message); };
const toolbarLabels = ['综合管理总表', '本卷成绩', '题库／答案', '音频管理表', '评分／表单回应', '表单设置', '周测检查'];
requireValue(JSON.stringify(ui.managementLabels) === JSON.stringify(toolbarLabels), 'Shared toolbar must contain the seven Year 1 buttons in the confirmed order');
const gap = message => (strict ? errors : warnings).push(message);
const text = value => typeof value === 'string' && value.trim().length > 0;
function localFile(url, name) {
  if (!text(url)) return;
  if (/^https:\/\//.test(url)) return;
  const target = path.resolve(base, url);
  const inside = value => value.startsWith(root + path.sep);
  if (!inside(target) || (fs.existsSync(target) && !inside(fs.realpathSync(target)))) {
    errors.push(`${name}: local path escapes project`); return;
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) gap(`${name}: missing local file ${url}`);
}
for (const file of ['index.html', 'closeout.html']) {
  const html = fs.readFileSync(path.join(base, file), 'utf8');
  requireValue(/href="dashboard\.css(?:\?[^" ]*)?"/.test(html), `${file}: must use shared dashboard.css`);
  requireValue(/src="ui\.js(?:\?[^" ]*)?"/.test(html), `${file}: must use shared ui.js`);
  requireValue(!/<style\b/i.test(html), `${file}: move page styles into dashboard.css`);
}
requireValue(Array.isArray(books), 'Catalog must contain an array of books');
const seenBooks = new Set();
let matched = 0;
const toolLabels = new Set(['综合管理总表', '本卷成绩', '题库／答案', '音频管理表', '评分／表单回应',
  '表单设置', '教师答案（审阅稿）', '表单编辑（审阅稿）', '周测检查',
  // Existing source aliases are normalized by player.js, not copied into new UI.
  '教师审阅表单', '二年级测验管理表']);
for (const book of books || []) {
  requireValue(text(book.id) && !seenBooks.has(book.id), `Duplicate or empty book ID: ${book.id}`);
  seenBooks.add(book.id);
  if (bookId && book.id !== bookId) continue;
  requireValue(text(book.title) && Array.isArray(book.sets), `${book.id}: title and sets required`);
  for (const tool of book.tools || []) {
    requireValue(toolLabels.has(tool.label) && text(tool.url), `${book.id}: invalid book management tool`);
    localFile(tool.url, book.id);
  }
  const toolbarSets = book.sets.length ? book.sets : [undefined];
  for (const set of toolbarSets) {
    const controls = ui.managementTools(book, set, { exams: [] });
    requireValue(JSON.stringify(controls.map(tool => tool.label)) === JSON.stringify(toolbarLabels), `${book.id}/${set?.id}: toolbar names/order differ`);
    requireValue(controls.every(tool => tool.url || text(tool.reason)), `${book.id}/${set?.id}: unavailable toolbar controls need explanations`);
  }
  const seenSets = new Set();
  for (const set of book.sets || []) {
    requireValue(text(set.id) && !seenSets.has(set.id), `${book.id}: duplicate or empty playlist ID ${set.id}`);
    seenSets.add(set.id);
    if (setId && set.id !== setId) continue;
    matched++;
    const name = `${book.id}/${set.id}`;
    requireValue(text(set.label) && text(set.status) && Array.isArray(set.tracks), `${name}: label, status and tracks required`);
    requireValue(/^[一二三四五六七八九十]+年级 (?:W\d{2} |已登记课次教材原音)/.test(ui.setLabel(set)), `${name}: use standard year/week/source naming`);
    for (const track of set.tracks || []) {
      const id = `${name}/${track.id}`;
      requireValue(text(track.id) && text(track.title), `${id}: ID and source title required`);
      const lessons = track.lessons?.length ? track.lessons : [track.lesson];
      requireValue(lessons.every(n => Number.isInteger(n) && n > 0), `${id}: positive lesson numbers required`);
      requireValue(!track.section_id || text(track.section_title), `${id}: section title required`);
      if (ui.trackTitle(track) === '音频（标题待补）') gap(`${id}: source-backed descriptive title missing`);
      if (!track.file) gap(`${id}: audio file not registered`); else localFile(track.file, id);
    }
    for (const tool of set.tools || []) {
      requireValue(toolLabels.has(tool.label) && text(tool.url), `${name}: unrecognized tool label or missing URL: ${tool.label}`);
      localFile(tool.url, name);
    }
    if (set.dashboard) localFile(set.dashboard, `${name} host page`);
    if (set.exam) {
      requireValue(text(set.exam.title) && /^https:\/\//.test(set.exam.url || ''), `${name}: exam title and student HTTPS URL required`);
      requireValue(text(set.exam.qr), `${name}: exam QR path required`);
      localFile(set.exam.qr, `${name} QR`);
    }
  }
}
requireValue(!bookId || seenBooks.has(bookId), `Book not found: ${bookId}`);
requireValue(!setId || matched > 0, `Playlist not found: ${setId}`);
for (const warning of [...new Set(warnings)]) console.warn(`WARN ${warning}`);
for (const error of [...new Set(errors)]) console.error(`FAIL ${error}`);
console.log(`${matched} playlists checked; ${errors.length} errors; ${warnings.length} source-gap warnings. Browser QA is separate.`);
process.exitCode = errors.length ? 1 : 0;
