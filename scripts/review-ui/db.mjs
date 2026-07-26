// SQLite store for the review dashboard: step approvals, per-lesson style,
// and job history (including logs). The DB file is created automatically at
// work/review-ui/review.db on first launch — a fresh clone only needs
// `npm install` and `npm run review:ui`. Legacy state (per-lesson
// review-status.json, work/review-ui-jobs/jobs.json + job-*.log) is imported
// once when the corresponding table is still empty; the old files are left
// in place as a backup but are no longer read or written afterwards.
// Lessons are keyed as "<course-dir>/<lesson-id>" (e.g. "book-1/lesson-02")
// so identical lesson ids in different books never collide.
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const DB_DIR = path.join(root, 'work', 'review-ui');

fs.mkdirSync(DB_DIR, { recursive: true });
const db = new Database(path.join(DB_DIR, 'review.db'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS review_steps (
  lesson_id  TEXT NOT NULL,
  step       INTEGER NOT NULL,
  status     TEXT NOT NULL,
  note       TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (lesson_id, step)
);
CREATE TABLE IF NOT EXISTS lesson_meta (
  lesson_id TEXT PRIMARY KEY,
  style     TEXT
);
CREATE TABLE IF NOT EXISTS jobs (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  lesson_id  TEXT,
  cmd        TEXT NOT NULL,
  status     TEXT NOT NULL,
  code       INTEGER,
  started_at TEXT NOT NULL,
  ended_at   TEXT,
  log        TEXT NOT NULL DEFAULT ''
);
`);

const stmts = {
  steps: db.prepare('SELECT step, status, note, updated_at FROM review_steps WHERE lesson_id = ?'),
  style: db.prepare('SELECT style FROM lesson_meta WHERE lesson_id = ?'),
  delStep: db.prepare('DELETE FROM review_steps WHERE lesson_id = ? AND step = ?'),
  putStep: db.prepare(`INSERT INTO review_steps (lesson_id, step, status, note, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(lesson_id, step) DO UPDATE SET status = excluded.status, note = excluded.note, updated_at = excluded.updated_at`),
  putStyle: db.prepare(`INSERT INTO lesson_meta (lesson_id, style) VALUES (?, ?)
    ON CONFLICT(lesson_id) DO UPDATE SET style = excluded.style`),
  insertJob: db.prepare(`INSERT INTO jobs (name, lesson_id, cmd, status, started_at, log)
    VALUES (?, ?, ?, 'running', ?, '')`),
  jobLog: db.prepare('UPDATE jobs SET log = ? WHERE id = ?'),
  finishJob: db.prepare('UPDATE jobs SET status = ?, code = ?, ended_at = ?, log = ? WHERE id = ?'),
  listJobs: db.prepare(`SELECT id, name, lesson_id, cmd, status, code, started_at, ended_at, length(log) AS log_length
    FROM jobs ORDER BY id DESC LIMIT ?`),
  getJob: db.prepare('SELECT * FROM jobs WHERE id = ?'),
  runningFor: db.prepare(`SELECT id FROM jobs WHERE status = 'running' AND lesson_id = ? LIMIT 1`),
};

// --- review progress ---
export function getReview(lessonKey) {
  const steps = {};
  for (const r of stmts.steps.all(lessonKey)) {
    steps[r.step] = { status: r.status, note: r.note, updatedAt: r.updated_at };
  }
  return { steps, style: stmts.style.get(lessonKey)?.style || null };
}

export function setStep(lessonKey, step, status, note = '') {
  if (status === 'pending') stmts.delStep.run(lessonKey, step);
  else stmts.putStep.run(lessonKey, step, status, note, new Date().toISOString());
}

export function setStyle(lessonKey, style) {
  stmts.putStyle.run(lessonKey, style);
}

// --- jobs ---
export function insertJob({ name, lessonId, cmd, startedAt }) {
  return Number(stmts.insertJob.run(name, lessonId, cmd, startedAt).lastInsertRowid);
}

export function updateJobLog(id, log) {
  stmts.jobLog.run(log, id);
}

export function finishJob(id, { status, code, endedAt, log }) {
  stmts.finishJob.run(status, code, endedAt, log, id);
}

export function listJobs(limit = 30) {
  return stmts.listJobs.all(limit).map((r) => ({
    id: String(r.id), name: r.name, lessonId: r.lesson_id, cmd: r.cmd,
    status: r.status, code: r.code, startedAt: r.started_at, endedAt: r.ended_at,
    logLength: r.log_length,
  }));
}

export function getJob(id) {
  const r = stmts.getJob.get(id);
  if (!r) return null;
  return {
    id: String(r.id), name: r.name, lessonId: r.lesson_id, cmd: r.cmd,
    status: r.status, code: r.code, startedAt: r.started_at, endedAt: r.ended_at,
    log: r.log,
  };
}

export function runningJobFor(lessonId) {
  return stmts.runningFor.get(lessonId) || null;
}

// Jobs still marked running were orphaned by a restart/crash; then trim history.
export function recoverJobs(keep = 50) {
  db.prepare(`UPDATE jobs SET status = 'failed', ended_at = COALESCE(ended_at, ?),
    log = log || char(10) || '[server stopped while job was running]' || char(10)
    WHERE status = 'running'`).run(new Date().toISOString());
  db.prepare('DELETE FROM jobs WHERE id NOT IN (SELECT id FROM jobs ORDER BY id DESC LIMIT ?)').run(keep);
}

// --- one-time import of pre-SQLite state ---
export function importLegacy({ lessonDirs = [] } = {}) {
  const isEmpty = (t) => db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c === 0;
  if (isEmpty('review_steps') && isEmpty('lesson_meta')) {
    db.transaction(() => {
      for (const dir of lessonDirs) {
        let data;
        try { data = JSON.parse(fs.readFileSync(path.join(dir, 'review-status.json'), 'utf8')); } catch { continue; }
        const key = `${path.basename(path.dirname(dir))}/${path.basename(dir)}`;
        for (const [n, s] of Object.entries(data.steps || {})) {
          if (s?.status) stmts.putStep.run(key, Number(n), s.status, s.note || '', s.updatedAt || new Date().toISOString());
        }
        if (data.style) stmts.putStyle.run(key, data.style);
      }
    })();
  }
  if (isEmpty('jobs')) {
    const legacyDir = path.join(root, 'work', 'review-ui-jobs');
    let saved = [];
    try { saved = JSON.parse(fs.readFileSync(path.join(legacyDir, 'jobs.json'), 'utf8')); } catch {}
    db.transaction(() => {
      const ins = db.prepare(`INSERT OR IGNORE INTO jobs (id, name, lesson_id, cmd, status, code, started_at, ended_at, log)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const j of saved) {
        let log = '';
        try { log = fs.readFileSync(path.join(legacyDir, `job-${j.id}.log`), 'utf8'); } catch {}
        ins.run(Number(j.id), j.name, j.lessonId ?? null, j.cmd,
          j.status === 'running' ? 'failed' : j.status, j.code ?? null,
          j.startedAt, j.endedAt ?? null, log);
      }
    })();
  }
}
