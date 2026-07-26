#!/usr/bin/env node
// Local review dashboard for teaching-material production.
// Phase 1: lesson list, 18-step review checklist, presenter preview, approvals.
// No external dependencies; state lives in <lessonDir>/review-status.json.
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.pdf': 'application/pdf',
  '.csv': 'text/csv; charset=utf-8', '.woff2': 'font/woff2',
};

// Steps 1-8 auto-detect from artifacts; 9-18 are teacher decisions unless artifacts exist.
const STEPS = [
  { n: 1, name: '教材輸入', auto: 'database' },
  { n: 2, name: '課次切分', auto: 'database' },
  { n: 3, name: '內容抽取', auto: 'database' },
  { n: 4, name: '頁碼標註', auto: 'database' },
  { n: 5, name: '教學重組', auto: 'database' },
  { n: 6, name: '補充活動', auto: 'database' },
  { n: 7, name: '遊戲標記', auto: 'database' },
  { n: 8, name: '寫入資料庫', auto: 'database' },
  { n: 9, name: '人工審閱', auto: null },
  { n: 10, name: '生成老師備課版', auto: 'teacherGuide' },
  { n: 11, name: '生成 Huashu Brief', auto: null },
  { n: 12, name: '生成教師版簡報', auto: 'slides' },
  { n: 13, name: '建立課堂簡報', auto: 'presenter' },
  { n: 14, name: '生成作業題庫', auto: 'homework' },
  { n: 15, name: '題庫審閱', auto: null },
  { n: 16, name: '建立作業', auto: null },
  { n: 17, name: '課堂測試', auto: null },
  { n: 18, name: '回填修正', auto: null },
];

const exists = (p) => fs.stat(p).then(() => true, () => false);

async function readTitle(presenterPath) {
  try {
    const html = await fs.readFile(presenterPath, 'utf8');
    const m = html.match(/<title>([^<]+)<\/title>/);
    return m ? m[1].trim() : null;
  } catch { return null; }
}

async function scanLesson(dir, type) {
  const id = path.basename(dir);
  const slidesDir = path.join(dir, 'slides');
  const dbDir = path.join(dir, 'database');
  let slideFiles = [];
  try { slideFiles = (await fs.readdir(slidesDir)).filter((f) => /^\d+.*\.html$/.test(f)).sort(); } catch {}
  let dbFiles = [];
  try { dbFiles = (await fs.readdir(dbDir)).filter((f) => /\.(json|csv)$/i.test(f)); } catch {}
  const hasPresenter = await exists(path.join(slidesDir, 'index.html'));
  const artifacts = {
    database: dbFiles.length > 0,
    slides: slideFiles.length > 0,
    presenter: hasPresenter && slideFiles.length > 0,
    teacherGuide: (await exists(path.join(dir, 'teacher-guide'))) || (await exists(path.join(dir, 'TEACHER_GUIDE.md'))),
    homework: await exists(path.join(dir, 'homework-question-bank')),
  };
  let qa = [];
  for (const qaDir of [path.join(dir, 'exports', 'qa', 'screenshots'), path.join(dir, 'exports', 'qa')]) {
    try {
      qa = (await fs.readdir(qaDir)).filter((f) => f.endsWith('.png')).sort()
        .map((f) => path.relative(root, path.join(qaDir, f)));
      if (qa.length) break;
    } catch {}
  }
  let review = {};
  try { review = JSON.parse(await fs.readFile(path.join(dir, 'review-status.json'), 'utf8')); } catch {}
  const steps = STEPS.map((s) => {
    const manual = review.steps?.[s.n];
    const autoDone = s.auto ? artifacts[s.auto] : false;
    return {
      ...s,
      status: manual?.status || (autoDone ? 'auto-done' : 'pending'),
      note: manual?.note || '',
      updatedAt: manual?.updatedAt || null,
    };
  });
  const title = (await readTitle(path.join(slidesDir, 'index.html'))) || id;
  return {
    id, type, title,
    dir: path.relative(root, dir),
    slideCount: slideFiles.length,
    hasPresenter,
    presenterUrl: hasPresenter ? `/files/${path.relative(root, path.join(slidesDir, 'index.html'))}` : null,
    dbFiles: dbFiles.length,
    qa: qa.slice(0, 12),
    style: review.style || 'slate-citrus',
    steps,
    approvedCount: steps.filter((s) => s.status === 'approved').length,
    doneCount: steps.filter((s) => s.status === 'approved' || s.status === 'auto-done').length,
  };
}

async function listLessons() {
  const lessons = [];
  for (const [base, type] of [[path.join(root, 'output', 'book-1'), 'regular'], [path.join(root, 'output', 'pinyin'), 'pinyin']]) {
    let entries = [];
    try { entries = await fs.readdir(base, { withFileTypes: true }); } catch {}
    for (const e of entries) {
      if (e.isDirectory() && /^(lesson|pinyin)-\d+$/.test(e.name)) {
        lessons.push(await scanLesson(path.join(base, e.name), type));
      }
    }
  }
  lessons.sort((a, b) => (a.type === b.type ? a.id.localeCompare(b.id) : a.type.localeCompare(b.type)));
  return lessons;
}

function lessonDirById(id) {
  const base = id.startsWith('pinyin-') ? path.join(root, 'output', 'pinyin') : path.join(root, 'output', 'book-1');
  const dir = path.join(base, id);
  if (!dir.startsWith(base + path.sep)) throw new Error('bad lesson id');
  return dir;
}

async function saveStep(id, stepN, body) {
  const dir = lessonDirById(id);
  const file = path.join(dir, 'review-status.json');
  let review = {};
  try { review = JSON.parse(await fs.readFile(file, 'utf8')); } catch {}
  review.steps = review.steps || {};
  if (body.status === 'pending') delete review.steps[stepN];
  else review.steps[stepN] = { status: body.status, note: body.note || '', updatedAt: new Date().toISOString() };
  if (body.style) review.style = body.style;
  await fs.writeFile(file, JSON.stringify(review, null, 2) + '\n');
  return scanLesson(dir, id.startsWith('pinyin-') ? 'pinyin' : 'regular');
}

async function saveStyle(id, style) {
  const dir = lessonDirById(id);
  const file = path.join(dir, 'review-status.json');
  let review = {};
  try { review = JSON.parse(await fs.readFile(file, 'utf8')); } catch {}
  review.style = style;
  await fs.writeFile(file, JSON.stringify(review, null, 2) + '\n');
  return scanLesson(dir, id.startsWith('pinyin-') ? 'pinyin' : 'regular');
}

const readBody = (req) => new Promise((resolve, reject) => {
  let data = '';
  req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
  req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const send = (code, body, type = 'application/json; charset=utf-8') => {
    res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
  };
  try {
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return send(200, await fs.readFile(path.join(__dirname, 'app.html')), MIME['.html']);
    }
    if (url.pathname === '/api/lessons' && req.method === 'GET') {
      return send(200, await listLessons());
    }
    const stepMatch = url.pathname.match(/^\/api\/lessons\/([a-z0-9-]+)\/steps\/(\d+)$/);
    if (stepMatch && req.method === 'POST') {
      return send(200, await saveStep(stepMatch[1], Number(stepMatch[2]), await readBody(req)));
    }
    const styleMatch = url.pathname.match(/^\/api\/lessons\/([a-z0-9-]+)\/style$/);
    if (styleMatch && req.method === 'POST') {
      const body = await readBody(req);
      return send(200, await saveStyle(styleMatch[1], String(body.style || 'slate-citrus')));
    }
    if (url.pathname.startsWith('/files/')) {
      const rel = decodeURIComponent(url.pathname.slice('/files/'.length));
      const abs = path.resolve(root, rel);
      if (!abs.startsWith(root + path.sep)) return send(403, { error: 'forbidden' });
      const ext = path.extname(abs).toLowerCase();
      return send(200, await fs.readFile(abs), MIME[ext] || 'application/octet-stream');
    }
    send(404, { error: 'not found' });
  } catch (err) {
    send(err.code === 'ENOENT' ? 404 : 500, { error: String(err.message || err) });
  }
});

server.listen(PORT, () => {
  console.log(`Review dashboard: http://localhost:${PORT}`);
});
