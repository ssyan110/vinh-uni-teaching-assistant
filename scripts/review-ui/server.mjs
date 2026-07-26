#!/usr/bin/env node
// Local review dashboard for teaching-material production.
// Phase 1: lesson list, 18-step review checklist, presenter preview, approvals.
// No external dependencies; state lives in <lessonDir>/review-status.json.
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
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

const readRawBody = (req, limit = 120e6) => new Promise((resolve, reject) => {
  const chunks = [];
  let size = 0;
  req.on('data', (c) => {
    size += c.length;
    if (size > limit) { req.destroy(); reject(new Error('file too large')); return; }
    chunks.push(c);
  });
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

// ---- Job runner: spawns project scripts, buffers logs for polling clients ----
const jobs = new Map();
let jobSeq = 0;

function startJob(name, cmd, args, lessonId = null) {
  const id = String(++jobSeq);
  const job = {
    id, name, lessonId, cmd: `${cmd} ${args.join(' ')}`,
    status: 'running', log: '', code: null,
    startedAt: new Date().toISOString(), endedAt: null,
  };
  jobs.set(id, job);
  job.log = `$ ${job.cmd}\n\n`;
  const child = spawn(cmd, args, { cwd: root, env: process.env });
  child.stdout.on('data', (d) => { job.log += d; });
  child.stderr.on('data', (d) => { job.log += d; });
  child.on('error', (e) => {
    job.log += `\n[spawn error] ${e.message}\n`;
    job.status = 'failed'; job.endedAt = new Date().toISOString();
  });
  child.on('close', (code) => {
    job.code = code;
    job.status = code === 0 ? 'done' : 'failed';
    job.endedAt = new Date().toISOString();
    job.log += `\n[exit ${code}]\n`;
  });
  return job;
}

const runningJobFor = (lessonId) =>
  [...jobs.values()].find((j) => j.status === 'running' && j.lessonId === lessonId);

const LESSON_TASKS = {
  presenter: (dir) => ({ name: '同步 Presenter', cmd: 'node', args: ['scripts/sync-lesson-presenter.mjs', '--lesson', dir] }),
  'assets-manifest': (dir) => ({ name: '資產清單', cmd: 'node', args: ['scripts/build-lesson-asset-manifest.mjs', '--lesson', dir] }),
  'assets-qa': (dir) => ({ name: '資產 QA', cmd: 'node', args: ['scripts/qa-lesson-assets.mjs', '--lesson', dir] }),
  pdf: (dir) => ({ name: '匯出 PDF', cmd: 'node', args: ['scripts/export-slides-pdf.mjs', '--slides-dir', path.join(dir, 'slides')] }),
};

async function pythonBin() {
  const venv = path.join(root, '.venv', 'bin', 'python');
  return (await exists(venv)) ? venv : 'python3';
}

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
    const runMatch = url.pathname.match(/^\/api\/lessons\/([a-z0-9-]+)\/run$/);
    if (runMatch && req.method === 'POST') {
      const id = runMatch[1];
      const body = await readBody(req);
      const taskDef = LESSON_TASKS[body.task];
      if (!taskDef) return send(400, { error: `unknown task: ${body.task}` });
      if (runningJobFor(id)) return send(409, { error: '此課程已有工作執行中' });
      const dir = path.relative(root, lessonDirById(id));
      if (!(await exists(path.join(root, dir)))) return send(404, { error: 'lesson not found' });
      const t = taskDef(dir);
      const job = startJob(t.name, t.cmd, t.args, id);
      return send(200, { jobId: job.id });
    }
    if (url.pathname === '/api/jobs' && req.method === 'GET') {
      return send(200, [...jobs.values()].map(({ log, ...j }) => ({ ...j, logLength: log.length })).reverse().slice(0, 30));
    }
    const jobMatch = url.pathname.match(/^\/api\/jobs\/(\d+)$/);
    if (jobMatch && req.method === 'GET') {
      const job = jobs.get(jobMatch[1]);
      if (!job) return send(404, { error: 'job not found' });
      const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
      return send(200, {
        id: job.id, name: job.name, lessonId: job.lessonId, status: job.status, code: job.code,
        logChunk: job.log.slice(offset), logLength: job.log.length,
      });
    }
    if (url.pathname === '/api/upload' && req.method === 'POST') {
      const rawName = url.searchParams.get('name') || 'upload.pdf';
      const safe = rawName.replace(/[^\w.一-鿿-]+/g, '_').slice(-80);
      const dir = path.join(root, 'work', 'review-ui-uploads');
      await fs.mkdir(dir, { recursive: true });
      const dest = path.join(dir, `${Date.now()}-${safe}`);
      await fs.writeFile(dest, await readRawBody(req));
      return send(200, { path: path.relative(root, dest) });
    }
    if (url.pathname === '/api/pipeline' && req.method === 'POST') {
      const body = await readBody(req);
      const lessonId = String(body.lessonId || '').trim();
      const lessonTitle = String(body.lessonTitle || '').trim();
      const lessonType = ['regular', 'pinyin', 'auto'].includes(body.lessonType) ? body.lessonType : 'regular';
      if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(lessonId)) return send(400, { error: 'lesson id 格式不對（例：lesson-02、pinyin-01）' });
      if (!lessonTitle) return send(400, { error: '請填課程標題' });
      for (const [key, label] of [['sourcePdf', '教材 PDF'], ['contentFile', 'content extract JSON']]) {
        const p = path.resolve(root, String(body[key] || ''));
        if (!p.startsWith(root + path.sep) || !(await exists(p))) return send(400, { error: `${label} 找不到：${body[key] || '(未填)'}` });
      }
      if (runningJobFor(lessonId)) return send(409, { error: '此課程已有工作執行中' });
      const outBase = lessonId.startsWith('pinyin') ? 'output/pinyin' : 'output/book-1';
      const outputDir = `${outBase}/${lessonId}/database/`;
      const job = startJob(`Pipeline 1–8 · ${lessonId}`, await pythonBin(), [
        'scripts/run_pipeline.py',
        '--lesson-type', lessonType,
        '--lesson-id', lessonId,
        '--lesson-title', lessonTitle,
        '--source-pdf', String(body.sourcePdf),
        '--output-dir', outputDir,
        '--content-file', String(body.contentFile),
        '--yes',
      ], lessonId);
      return send(200, { jobId: job.id });
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
