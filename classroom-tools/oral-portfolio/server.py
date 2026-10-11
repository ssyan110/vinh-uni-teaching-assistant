#!/usr/bin/env python3
"""Loopback-only oral evidence store; no grading or remote services."""
import argparse, base64, csv, io, json, re, sqlite3, threading, uuid, zipfile
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
MIMES = {'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mp4': 'm4a', 'video/mp4': 'mp4'}
MAX_AUDIO = 20 * 1024 * 1024
MAX_TOTAL = 250 * 1024 * 1024
MAX_BODY = 30 * 1024 * 1024
MAX_METADATA = 2 * 1024 * 1024
MAX_COLLECTION = 10000
ZIP_OVERHEAD = 2 * 1024 * 1024

def identity(): return str(uuid.uuid4())
def timestamp(): return datetime.now(timezone.utc).isoformat()
def clean(value, limit=4000):
    if not isinstance(value, str) or len(value) > limit: raise ValueError('文字格式不正確或過長')
    return value.strip()
def audio_bytes(body, mime):
    mime = mime.split(';')[0].lower()
    if mime not in MIMES: raise ValueError('不支援此音訊格式')
    if not body or len(body) > MAX_AUDIO: raise ValueError('錄音須有內容且不超過 20 MB')
    valid = {'webm': body.startswith(b'\x1aE\xdf\xa3'), 'ogg': body.startswith(b'OggS'), 'wav': body.startswith(b'RIFF') and body[8:12] == b'WAVE', 'mp3': body.startswith(b'ID3') or body[:1] == b'\xff', 'm4a': body[4:8] == b'ftyp', 'mp4': body[4:8] == b'ftyp'}[MIMES[mime]]
    if not valid: raise ValueError('音訊內容與格式不符；請重新匯入錄音')
    return mime

class Store:
    def __init__(self, root):
        target = Path(root).absolute()
        if any(p.is_symlink() for p in [target, *target.parents]): raise ValueError('資料目錄不得透過符號連結')
        self.root = target.resolve()
        if self.root in [Path('/'), Path.home()] or self.root.is_mount(): raise ValueError('資料目錄不安全')
        self.root.mkdir(parents=True, exist_ok=True); self.lock = threading.RLock()
        self.db = sqlite3.connect(self.root / 'portfolio.sqlite3', check_same_thread=False)
        self.db.execute('CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY, revision INTEGER, body TEXT)')
        self.db.execute('CREATE TABLE IF NOT EXISTS audio (id TEXT PRIMARY KEY, body BLOB NOT NULL)')
        self.db.execute('INSERT OR IGNORE INTO state VALUES (1,0,?)', (json.dumps({'classes': [], 'students': [], 'tasks': [], 'takes': []}),)); self.db.commit()
    def snapshot(self):
        with self.lock:
            rev, body = self.db.execute('SELECT revision,body FROM state WHERE id=1').fetchone()
            return {**json.loads(body), 'revision': rev}
    def preview(self, text):
        rows = list(csv.DictReader(io.StringIO(clean(text, 100000))))
        if len(rows) > 1000: raise ValueError('一次最多匯入 1000 名學生')
        result = []; seen = set()
        for row in rows:
            code = clean(row.get('student_code', row.get('學號', '')), 100)
            name = clean(row.get('name', row.get('姓名', '')), 200)
            if not code or not name or code in seen: raise ValueError('每筆須有不重複的學號及姓名')
            seen.add(code); result.append({'code': code, 'name': name})
        if not result: raise ValueError('沒有可匯入的學生；標題列使用 student_code,name 或 學號,姓名')
        return result
    def mutate(self, action, data):
        with self.lock:
            try:
                self.db.execute('BEGIN IMMEDIATE')
                return self._mutate(action, data)
            except Exception:
                self.db.rollback(); raise
    def _mutate(self, action, data):
        with self.lock:
            state = self.snapshot(); revision = state.pop('revision')
            if data.get('revision') != revision: raise ValueError('資料已被其他視窗更新，請重新載入後再試')
            s = state
            if action == 'class':
                name = clean(data.get('name', ''), 200)
                if not name: raise ValueError('請填班級名稱')
                s['classes'].append({'id': identity(), 'name': name})
            elif action == 'roster':
                class_id = data.get('class_id'); self.require(s, 'classes', class_id)
                rows = self.preview(data.get('csv', ''))
                for row in rows:
                    old = next((x for x in s['students'] if x['class_id'] == class_id and x['code'] == row['code']), None)
                    if old: old['name'] = row['name']
                    else: s['students'].append({'id': identity(), 'class_id': class_id, **row})
            elif action == 'task':
                class_id = data.get('class_id'); self.require(s, 'classes', class_id)
                title = clean(data.get('title', ''), 300); lesson = clean(data.get('lesson_key', ''), 200)
                external = data.get('external') is True
                if not title or not re.fullmatch(r'[a-z0-9][a-z0-9-]*:lesson-\d{2}', lesson) and not (external and lesson == 'external'):
                    raise ValueError('請填任務名稱及完整教材:lesson-XX，外部任務須明確選取')
                s['tasks'].append({'id': identity(), 'class_id': class_id, 'title': title, 'lesson_key': lesson, 'external': external})
            elif action == 'take':
                student = self.require(s, 'students', data.get('student_id')); task = self.require(s, 'tasks', data.get('task_id'))
                if student['class_id'] != task['class_id']: raise ValueError('學生與任務須屬同一班級')
                stage = data.get('stage'); parent = data.get('first_id')
                if stage not in ['first', 'redo']: raise ValueError('請選第一次或重做')
                if stage == 'redo':
                    first = self.require(s, 'takes', parent)
                    if first['stage'] != 'first' or first['student_id'] != student['id'] or first['task_id'] != task['id']: raise ValueError('重做須連結同一學生、同一任務的第一次錄音')
                else: parent = None
                if len(data.get('audio', '')) > 28 * 1024 * 1024: raise ValueError('錄音超過 20 MB')
                try: body = base64.b64decode(data.get('audio', ''), validate=True)
                except Exception: raise ValueError('錄音資料損壞')
                mime = audio_bytes(body, clean(data.get('mime', ''), 100))
                total = self.db.execute('SELECT coalesce(sum(length(body)),0) FROM audio').fetchone()[0]
                if total + len(body) > MAX_TOTAL: raise ValueError('本機錄音已達 250 MB，請先備份並改用新的資料目錄')
                take = {'id': identity(), 'student_id': student['id'], 'task_id': task['id'], 'stage': stage, 'first_id': parent, 'mime': mime, 'size': len(body), 'created_at': timestamp(), 'evidence': clean(data.get('evidence', '')), 'feedback': clean(data.get('feedback', ''))}
                s['takes'].append(take)
                self.db.execute('INSERT INTO audio VALUES (?,?)', (take['id'], body))
            elif action == 'feedback':
                take = self.require(s, 'takes', data.get('take_id'))
                take['evidence'] = clean(data.get('evidence', '')); take['feedback'] = clean(data.get('feedback', ''))
            else: raise ValueError('未知操作')
            try:
                self.capacity(s, revision + 1)
                self.db.execute('UPDATE state SET revision=?,body=? WHERE id=1', (revision + 1, json.dumps(s, ensure_ascii=False))); self.db.commit()
            except Exception: self.db.rollback(); raise
            return self.snapshot()
    @staticmethod
    def capacity(state, revision):
        if any(len(state[k]) > MAX_COLLECTION for k in ['classes', 'students', 'tasks', 'takes']): raise ValueError('單一資料集合已達 10000 筆，請先備份並改用新的資料目錄')
        metadata = json.dumps({'version': 1, 'snapshot': {**state, 'revision': revision}}, ensure_ascii=False).encode()
        if len(metadata) > MAX_METADATA: raise ValueError('文字與名冊資料已達 2 MB，請先備份並改用新的資料目錄')
        return metadata
    @staticmethod
    def require(s, kind, id_):
        item = next((x for x in s[kind] if x['id'] == id_), None)
        if not item: raise ValueError('找不到所選資料，請重新載入')
        return item
    def backup(self):
        with self.lock:
            output = io.BytesIO(); s = self.snapshot()
            with zipfile.ZipFile(output, 'w', zipfile.ZIP_STORED) as z:
                z.writestr('portfolio.json', self.capacity({k: v for k, v in s.items() if k != 'revision'}, s['revision']))
                for take in s['takes']:
                    row = self.db.execute('SELECT body FROM audio WHERE id=?', (take['id'],)).fetchone()
                    if not row: raise ValueError('錄音缺失，請保留資料目錄並檢查')
                    z.writestr(f'audio/{take["id"]}.{MIMES[take["mime"]]}', row[0])
            return output.getvalue()
    def validate_backup(self, body):
        if len(body) > MAX_TOTAL + MAX_METADATA + ZIP_OVERHEAD: raise ValueError('備份檔過大')
        try:
            with zipfile.ZipFile(io.BytesIO(body)) as z:
                files = z.infolist(); names = [x.filename for x in files]
                if len(names) != len(set(names)) or len(names) > MAX_COLLECTION + 1 or any(x.is_dir() or x.flag_bits & 1 or (x.external_attr >> 16) & 0o170000 == 0o120000 for x in files): raise ValueError('備份包含不允許的檔案')
                if any(x.file_size > MAX_AUDIO for x in files) or sum(x.file_size for x in files) > MAX_TOTAL + MAX_METADATA: raise ValueError('備份解壓大小超限')
                if z.getinfo('portfolio.json').file_size > MAX_METADATA: raise ValueError('備份文字與名冊資料超限')
                meta = json.loads(z.read('portfolio.json'))
                if meta.get('version') != 1: raise ValueError('備份版本不支援')
                s = meta['snapshot']; s.pop('revision', None)
                if set(s) != {'classes', 'students', 'tasks', 'takes'} or any(not isinstance(s[k], list) or len(s[k]) > MAX_COLLECTION for k in s): raise ValueError('備份資料結構不正確')
                for kind in s:
                    ids = [x['id'] for x in s[kind]]
                    if len(ids) != len(set(ids)) or any(not re.fullmatch(r'[0-9a-f-]{36}', x) for x in ids): raise ValueError('備份識別資料不正確')
                codes = set()
                for c in s['classes']: clean(c['name'], 200)
                for x in s['students']:
                    self.require(s, 'classes', x['class_id']); clean(x['code'], 100); clean(x['name'], 200)
                    key = (x['class_id'], x['code'])
                    if key in codes or not x['code'] or not x['name']: raise ValueError('備份名冊重複或空白')
                    codes.add(key)
                for t in s['tasks']:
                    self.require(s, 'classes', t['class_id']); clean(t['title'], 300); clean(t['lesson_key'], 200)
                    if not t['title'] or not (re.fullmatch(r'[a-z0-9][a-z0-9-]*:lesson-\d{2}', t['lesson_key']) or t.get('external') is True and t['lesson_key'] == 'external'): raise ValueError('備份課次資料不正確')
                audio = {}; expected = {'portfolio.json'}
                for t in s['takes']:
                    student = self.require(s, 'students', t['student_id']); task = self.require(s, 'tasks', t['task_id'])
                    if student['class_id'] != task['class_id'] or t['stage'] not in ['first', 'redo']: raise ValueError('備份錄音身份不符')
                    if t['stage'] == 'redo':
                        first = self.require(s, 'takes', t['first_id'])
                        if first['stage'] != 'first' or first['student_id'] != t['student_id'] or first['task_id'] != t['task_id']: raise ValueError('備份重做連結不符')
                    elif t.get('first_id') is not None: raise ValueError('第一次錄音不得連結其他錄音')
                    mime = t['mime']; name = f'audio/{t["id"]}.{MIMES[mime]}'; expected.add(name)
                    blob = z.read(name); audio_bytes(blob, mime)
                    if t['size'] != len(blob): raise ValueError('備份錄音大小不符')
                    clean(t['created_at'], 100); clean(t['evidence']); clean(t['feedback']); audio[t['id']] = blob
                if set(names) != expected: raise ValueError('備份含未知路徑或檔案')
                if sum(len(blob) for blob in audio.values()) > MAX_TOTAL: raise ValueError('備份音訊總量超限')
                self.capacity(s, self.snapshot()['revision'] + 1)
                return s, audio
        except (KeyError, TypeError, json.JSONDecodeError, zipfile.BadZipFile, RuntimeError, AttributeError, UnicodeDecodeError, IndexError) as e: raise ValueError('備份損壞或格式不正確') from e
    def restore(self, body, revision):
        with self.lock:
            try:
                self.db.execute('BEGIN IMMEDIATE')
                return self._restore(body, revision)
            except Exception:
                self.db.rollback(); raise
    def _restore(self, body, revision):
        state, audio = self.validate_backup(body)
        with self.lock:
            current = self.snapshot()
            if revision != current['revision']: raise ValueError('資料已更新，請重新載入後再還原')
            backups = self.root / 'backups'; backups.mkdir(exist_ok=True)
            path = backups / f'before-restore-{identity()}.zip'; path.write_bytes(self.backup())
            try:
                self.db.execute('DELETE FROM audio')
                self.db.executemany('INSERT INTO audio VALUES (?,?)', audio.items())
                self.db.execute('UPDATE state SET revision=?,body=? WHERE id=1', (revision + 1, json.dumps(state, ensure_ascii=False))); self.db.commit()
            except Exception: self.db.rollback(); raise
            return {**self.snapshot(), 'restore_backup': path.name}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args): pass
    def check(self):
        expected = f'127.0.0.1:{self.server.server_port}'
        if self.headers.get('Host') != expected: raise ValueError('僅允許本機 127.0.0.1 存取')
        origin = self.headers.get('Origin')
        if origin and origin != f'http://{expected}': raise ValueError('不允許其他網站存取本機資料')
        if self.headers.get('Sec-Fetch-Site') == 'cross-site': raise ValueError('不允許跨網站存取')
    def send(self, body, mime='application/json; charset=utf-8', status=200, filename=None):
        if not isinstance(body, bytes): body = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status); self.send_header('Content-Type', mime); self.send_header('Content-Length', str(len(body))); self.send_header('X-Content-Type-Options', 'nosniff'); self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; media-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'")
        if filename: self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
        self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        try:
            self.check(); path = urlparse(self.path).path
            if path == '/api/contexts':
                registry = json.loads((ROOT.parents[1] / 'course/lesson-registry.json').read_text())
                books = json.loads((ROOT.parents[1] / 'textbooks/registry.json').read_text())
                return self.send({'books': [{'id': b['textbook_id'], 'title': b['title']} for b in books['textbooks']], 'lessons': [{'id': x['lesson_key'], 'book_id': x['textbook_id'], 'title': x['title'], 'number': x['lesson_number']} for x in registry['lessons']]})
            if path == '/api/state': return self.send(self.server.store.snapshot())
            if path == '/api/backup': return self.send(self.server.store.backup(), 'application/zip', filename='oral-portfolio-backup.zip')
            if path.startswith('/api/audio/'):
                id_ = path.rsplit('/', 1)[1]
                with self.server.store.lock:
                    take = self.server.store.require(self.server.store.snapshot(), 'takes', id_)
                    row = self.server.store.db.execute('SELECT body FROM audio WHERE id=?', (id_,)).fetchone()
                if not row: raise ValueError('找不到錄音')
                return self.send(row[0], take['mime'])
            name = {'/': 'index.html', '/app.js': 'app.js', '/style.css': 'style.css'}.get(path)
            if not name: return self.send({'error': '找不到頁面'}, status=404)
            return self.send((ROOT / 'web' / name).read_bytes(), {'index.html': 'text/html; charset=utf-8', 'app.js': 'text/javascript; charset=utf-8', 'style.css': 'text/css; charset=utf-8'}[name])
        except (ValueError, OSError, KeyError, TypeError) as e: self.send({'error': str(e)}, status=400)
    def do_POST(self):
        try:
            self.check(); n = int(self.headers.get('Content-Length', '0')); path = urlparse(self.path).path
            limit = MAX_TOTAL + MAX_METADATA + ZIP_OVERHEAD if path == '/api/restore' else MAX_BODY
            if n <= 0 or n > limit: raise ValueError('請求過大或沒有內容')
            if path == '/api/restore':
                if self.headers.get('Content-Type') != 'application/zip': raise ValueError('還原須使用完整 ZIP')
                revision = int(self.headers.get('X-Portfolio-Revision', '-1'))
                return self.send(self.server.store.restore(self.rfile.read(n), revision))
            data = json.loads(self.rfile.read(n))
            if not isinstance(data, dict): raise ValueError('請求須為資料物件')
            if path == '/api/preview': return self.send({'rows': self.server.store.preview(data.get('csv', ''))})
            return self.send(self.server.store.mutate(path.removeprefix('/api/'), data))
        except (ValueError, json.JSONDecodeError, UnicodeDecodeError, TypeError) as e: self.send({'error': str(e)}, status=400)
    def do_OPTIONS(self): self.send({'error': '不允許跨網站存取'}, status=403)

def serve(data_dir, port=8766):
    server = ThreadingHTTPServer(('127.0.0.1', port), Handler); server.store = Store(data_dir); return server
if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--data-dir', default=str(ROOT / 'private-data')); parser.add_argument('--port', type=int, default=8766); args = parser.parse_args()
    http = serve(args.data_dir, args.port); print(f'口語作品集：http://127.0.0.1:{args.port}；資料：{http.store.root}', flush=True)
    try: http.serve_forever()
    except KeyboardInterrupt: pass
    finally: http.server_close(); http.store.db.close()
