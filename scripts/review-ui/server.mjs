#!/usr/bin/env node
// Local review dashboard for teaching-material production.
// Phase 1: lesson list, 18-step review checklist, presenter preview, approvals.
// Progress and job history live in SQLite (work/review-ui/review.db, created
// automatically on first launch — see db.mjs).
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import * as store from './db.mjs';

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

async function scanLesson(dir) {
  const id = path.basename(dir);
  const group = path.basename(path.dirname(dir));
  const type = group === 'pinyin' ? 'pinyin' : 'regular';
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
  const review = store.getReview(`${group}/${id}`);
  const steps = STEPS.map((s) => {
    const manual = review.steps[s.n];
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
    id, type, group, title,
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

const COURSES_FILE = path.join(root, 'output', 'courses.json');

async function readCourseRegistry() {
  try { return JSON.parse(await fs.readFile(COURSES_FILE, 'utf8')); } catch { return {}; }
}

async function courseBases() {
  const bases = [];
  let entries = [];
  try { entries = await fs.readdir(path.join(root, 'output'), { withFileTypes: true }); } catch {}
  for (const e of entries) {
    if (e.isDirectory() && (e.name === 'pinyin' || /^book-\d+$/.test(e.name))) {
      bases.push(path.join(root, 'output', e.name));
    }
  }
  return bases;
}

async function listCourses() {
  const registry = await readCourseRegistry();
  const bases = await courseBases();
  const courses = [];
  for (const base of bases) {
    const dir = path.basename(base);
    let count = 0;
    try { count = (await fs.readdir(base, { withFileTypes: true })).filter((e) => e.isDirectory() && /^(lesson|pinyin)-\d+$/.test(e.name)).length; } catch {}
    courses.push({
      dir,
      name: registry[dir]?.name || (dir === 'pinyin' ? '拼音课程 · Pinyin' : dir.replace(/^book-(\d+)$/, 'Book $1')),
      type: registry[dir]?.type || (dir === 'pinyin' ? 'pinyin' : 'regular'),
      lessonCount: count,
    });
  }
  const rank = (d) => (d === 'pinyin' ? 1e9 : Number(d.replace('book-', '')));
  courses.sort((a, b) => rank(a.dir) - rank(b.dir));
  return courses;
}

async function createCourse(dir, name) {
  if (!/^book-\d{1,3}$/.test(dir)) throw new Error('教材資料夾格式須為 book-N（例：book-2）');
  if (!name || !name.trim()) throw new Error('請填教材全名');
  const abs = path.join(root, 'output', dir);
  if (await exists(abs)) throw new Error(`output/${dir} 已存在`);
  const registry = await readCourseRegistry();
  registry[dir] = { name: name.trim(), type: 'regular' };
  await fs.mkdir(abs, { recursive: true });
  await fs.writeFile(COURSES_FILE, JSON.stringify(registry, null, 2) + '\n');
  return listCourses();
}

async function allLessonDirs() {
  const dirs = [];
  for (const base of await courseBases()) {
    let entries = [];
    try { entries = await fs.readdir(base, { withFileTypes: true }); } catch {}
    for (const e of entries) {
      if (e.isDirectory() && /^(lesson|pinyin)-\d+$/.test(e.name)) dirs.push(path.join(base, e.name));
    }
  }
  return dirs;
}

async function listLessons() {
  const lessons = [];
  for (const dir of await allLessonDirs()) lessons.push(await scanLesson(dir));
  const num = (s) => Number((s.match(/(\d+)$/) || [])[1] || 0);
  lessons.sort((a, b) => (a.group === b.group ? num(a.id) - num(b.id) : a.group.localeCompare(b.group)));
  return lessons;
}

async function lessonDirById(id) {
  if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(id)) throw new Error('bad lesson id');
  for (const base of await courseBases()) {
    const dir = path.join(base, id);
    if (dir.startsWith(base + path.sep) && (await exists(dir))) return dir;
  }
  throw Object.assign(new Error('lesson not found'), { code: 'ENOENT' });
}

const lessonKey = (dir) => `${path.basename(path.dirname(dir))}/${path.basename(dir)}`;

async function saveStep(id, stepN, body) {
  const dir = await lessonDirById(id);
  store.setStep(lessonKey(dir), stepN, body.status, body.note || '');
  if (body.style) store.setStyle(lessonKey(dir), body.style);
  return scanLesson(dir);
}

async function saveStyle(id, style) {
  const dir = await lessonDirById(id);
  store.setStyle(lessonKey(dir), style);
  return scanLesson(dir);
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

// ---- Job runner: spawns project scripts; metadata + logs persist in SQLite ----
// Running jobs buffer their log in memory (flushed to the DB at most every
// 500ms) so polling clients see live output without a DB write per chunk.
const liveJobs = new Map(); // id -> { log, flushTimer, done }

function startJob(name, cmd, args, lessonId = null) {
  const cmdline = `${cmd} ${args.join(' ')}`;
  const id = store.insertJob({ name, lessonId, cmd: cmdline, startedAt: new Date().toISOString() });
  const live = { log: `$ ${cmdline}\n\n`, flushTimer: null, done: false };
  liveJobs.set(id, live);
  const flushSoon = () => {
    if (live.flushTimer || live.done) return;
    live.flushTimer = setTimeout(() => {
      live.flushTimer = null;
      if (!live.done) store.updateJobLog(id, live.log);
    }, 500);
  };
  const append = (d) => { live.log += d; flushSoon(); };
  const finish = (status, code, tail) => {
    if (live.done) return;
    live.done = true;
    if (live.flushTimer) clearTimeout(live.flushTimer);
    live.log += tail;
    store.finishJob(id, { status, code, endedAt: new Date().toISOString(), log: live.log });
    liveJobs.delete(id);
  };
  const child = spawn(cmd, args, { cwd: root, env: process.env });
  child.stdout.on('data', append);
  child.stderr.on('data', append);
  child.on('error', (e) => finish('failed', null, `\n[spawn error] ${e.message}\n`));
  child.on('close', (code) => finish(code === 0 ? 'done' : 'failed', code, `\n[exit ${code}]\n`));
  store.updateJobLog(id, live.log);
  return { id: String(id) };
}

const runningJobFor = (lessonId) => store.runningJobFor(lessonId);

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
    if (url.pathname === '/api/courses' && req.method === 'GET') {
      return send(200, await listCourses());
    }
    if (url.pathname === '/api/courses' && req.method === 'POST') {
      const body = await readBody(req);
      try {
        return send(200, await createCourse(String(body.dir || '').trim(), String(body.name || '')));
      } catch (e) { return send(400, { error: e.message }); }
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
      const dir = path.relative(root, await lessonDirById(id));
      const t = taskDef(dir);
      const job = startJob(t.name, t.cmd, t.args, id);
      return send(200, { jobId: job.id });
    }
    if (url.pathname === '/api/jobs' && req.method === 'GET') {
      return send(200, store.listJobs(30).map((j) => {
        const live = liveJobs.get(Number(j.id));
        return live ? { ...j, logLength: live.log.length } : j;
      }));
    }
    const jobMatch = url.pathname.match(/^\/api\/jobs\/(\d+)$/);
    if (jobMatch && req.method === 'GET') {
      const job = store.getJob(Number(jobMatch[1]));
      if (!job) return send(404, { error: 'job not found' });
      const log = liveJobs.get(Number(job.id))?.log ?? job.log;
      const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
      return send(200, {
        id: job.id, name: job.name, lessonId: job.lessonId, status: job.status, code: job.code,
        logChunk: log.slice(offset), logLength: log.length,
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
      const course = String(body.course || '').trim();
      const courses = await listCourses();
      const courseDef = courses.find((c) => c.dir === course);
      if (!courseDef) return send(400, { error: `教材不存在：${course || '(未選)'}` });
      const lessonType = ['regular', 'pinyin', 'auto'].includes(body.lessonType) ? body.lessonType : courseDef.type;
      if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(lessonId)) return send(400, { error: 'lesson id 格式不對（例：lesson-02、pinyin-01）' });
      if (!lessonTitle) return send(400, { error: '請填課程標題' });
      for (const [key, label] of [['sourcePdf', '教材 PDF'], ['contentFile', 'content extract JSON']]) {
        const p = path.resolve(root, String(body[key] || ''));
        if (!p.startsWith(root + path.sep) || !(await exists(p))) return send(400, { error: `${label} 找不到：${body[key] || '(未填)'}` });
      }
      if (runningJobFor(lessonId)) return send(409, { error: '此課程已有工作執行中' });
      const outputDir = `output/${course}/${lessonId}/database/`;
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

store.importLegacy({ lessonDirs: await allLessonDirs() });
store.recoverJobs(50);
server.listen(PORT, () => {
  console.log(`Review dashboard: http://localhost:${PORT}`);
});
