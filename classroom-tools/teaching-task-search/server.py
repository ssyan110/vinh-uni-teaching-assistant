#!/usr/bin/env python3
"""Read-only task search. Sources are selected by explicit adapters, never request paths."""
import argparse, hashlib, json, re, shutil, subprocess
from pathlib import Path
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent

def safe_source(path):
    path = Path(path)
    resolved = path.resolve()
    forbidden = {'90-archive', 'archive', '.git', 'private'}
    components = [path, *path.parents]
    if not resolved.is_relative_to(ROOT) or forbidden.intersection(path.parts) or forbidden.intersection(resolved.parts) or any(p.is_symlink() for p in components):
        raise ValueError('Source outside allowlist')
    return resolved

def corpus():
    registry = json.loads(safe_source(ROOT/'course/lesson-registry.json').read_text())
    books = json.loads(safe_source(ROOT/'textbooks/registry.json').read_text())['textbooks']
    rows, sources = [], {}
    def add(lesson, path, title, instructions, outcome='', materials='', stage=3, stage_label='來源未細分階段；完成本課後使用'):
        path = safe_source(path)
        key = path.relative_to(ROOT).as_posix()
        text = path.read_text()
        sid = hashlib.sha256(key.encode()).hexdigest()[:20]
        sources[sid] = {'path':key,'text':text,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
        rows.append(dict(id=f'{sid}-{len(rows)}', textbook_id=lesson['textbook_id'], lesson_key=lesson['lesson_key'], lesson_number=lesson['lesson_number'], lesson_title=lesson['title'],title=title,instructions=instructions,outcome=outcome,materials=materials, stage=stage,stage_label=stage_label,source_id=sid,source_path=key,printed_pages=lesson.get('printed_pages'),page_scope='課次範圍；任務頁碼請查看來源',status='設計草案' if '/10-design/' in key else '既有工具內容；未核實教材批准', source_status=lesson.get('status',{})))
    for lesson in registry['lessons']:
        folder=ROOT/lesson['lesson_path']/'10-design/support-materials'
        if not folder.is_dir(): continue
        for p in sorted(folder.glob('*.md')):
            if '索引' in p.name:
                header = None
                for line in p.read_text().splitlines():
                    if not line.startswith('|'): continue
                    cells=[c.strip() for c in line.strip('|').split('|')]
                    if '学生完成的动作' in cells or '学生完成什么' in cells:
                        header=cells
                        continue
                    if not header or len(cells)!=len(header) or not cells[0].startswith('`lesson-'): continue
                    row=dict(zip(header,cells))
                    material=row.get('文件（拟）',row.get('材料',cells[0]))
                    outcome=row.get('产出／答案政策',row.get('产出',''))
                    add(lesson,p,cells[0].strip('`'),line,outcome,material)
            elif any(t in p.name for t in ('活动0','预习卡','课末检查')) and not any(t in p.name for t in ('prompt','视觉')):
                text=p.read_text(); title=text.splitlines()[0].lstrip('# ').strip()
                outcome=next((l for l in text.splitlines() if l.startswith(('目标：','产出：','学生产出：'))),'')
                add(lesson,p,title,text,outcome,p.name)
    # Only explicitly named task-mainline sections; no automatic teacher-note synthesis.
    for lesson in registry['lessons']:
        folder=ROOT/lesson['lesson_path']/'10-design/teaching-design'
        for p in sorted(folder.glob('lesson-*-*.md')):
            text=p.read_text()
            sections=re.split(r'(?m)^## ',text)
            for section in sections[1:]:
                title, _, body=section.partition('\n')
                if '任务主线' in title and body.strip():
                    add(lesson,p,title,body.strip(),materials='來源未列出完整材料清單')
    lesson=next(l for l in registry['lessons'] if l['lesson_key']=='boya-intermediate-i:lesson-01')
    for name,stage in [('lesson-01-p1-p2.js',1),('lesson-01-complete.js',3)]:
        p=safe_source(ROOT/'classroom-tools/speaking-challenge/content'/name)
        # Fixed local file only. No caller-provided code/path, no browser execution.
        code="const fs=require('fs'),vm=require('vm'); let result; vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),{window:{SpeakingChallenge:{registerPack:p=>result=p}}},{timeout:1000});process.stdout.write(JSON.stringify(result));"
        node24=Path('/opt/homebrew/opt/node@24/bin/node')
        node=str(node24) if node24.is_file() else shutil.which('node')
        if not node: raise RuntimeError('Node 未找到；無法讀取既有口語工具來源。')
        pack=json.loads(subprocess.check_output([node,'-e',code,str(p)],text=True,stderr=subprocess.PIPE,timeout=5))
        for task in pack['challenges']:
            instructions='\n'.join([task['situation']]+[r['name']+'：'+r['action'] for r in task['roles']]+[task['goal'],task['presentation']]+task.get('audience',[])+[c['change']+' '+c['action'] for c in task.get('conditions',[])]+task.get('language',[]))
            add(lesson,p,task['title'],instructions,task.get('outcome',''),'來源未列出所需材料',stage,pack['stage'])
    return {'books':books,'lessons':registry['lessons'],'tasks':rows},sources

# Search-only equivalents. Display/source text is never converted.
SEARCH_EQUIVALENTS = str.maketrans(dict(zip('預習記錄聽語詞學說課問題資訊體綜檢查評量稱謂後關鍵據練獨產國組畫飲聲認識寫對應時見愛說話慣會調觀點書圖表實開結總親覺樣', '预习记录听语词学说课问题资讯体综检查评量称谓后关键据练独产国组画饮声认识写对应时见爱说话惯会调观点书图表实开结总亲觉样')))
def normalize(text): return text.casefold().translate(SEARCH_EQUIVALENTS)

def search(tasks, params):
    def value(k,default=''): return params.get(k,[default])[0]
    try: current=int(value('current','99')); stage=int(value('stage','3'))
    except ValueError: return []
    words=normalize(value('q')).split()
    return [r for r in tasks if (not value('book') or r['textbook_id']==value('book')) and (not value('lesson') or r['lesson_key']==value('lesson')) and r['lesson_number']<=current and (r['lesson_number']<current or r['stage']<=stage) and (not value('material') or normalize(value('material')) in normalize(r['materials'])) and all(w in normalize(r['title']+' '+r['instructions']+' '+r['materials']) for w in words)]

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            self.respond()
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception as exc:
            print(f'Source error: {exc}', flush=True)
            self.send_error(503, 'Task source unavailable; inspect local server log')

    def respond(self):
        url=urlparse(self.path); params=parse_qs(url.query)
        data,sources=corpus()
        if url.path=='/api/search': body=json.dumps(search(data['tasks'],params),ensure_ascii=False).encode(); mime='application/json'
        elif url.path=='/api/catalog': body=json.dumps(data,ensure_ascii=False).encode(); mime='application/json'
        elif url.path=='/api/source':
            source=sources.get(params.get('id',[''])[0])
            if not source: self.send_error(404); return
            body=json.dumps(source,ensure_ascii=False).encode(); mime='application/json'
        elif url.path in ('/','/index.html'):
            body=(HERE/'index.html').read_bytes(); mime='text/html'
        else: self.send_error(404); return
        self.send_response(200); self.send_header('Content-Type',mime+'; charset=utf-8'); self.send_header('Cache-Control','no-store'); self.send_header('X-Content-Type-Options','nosniff'); self.end_headers(); self.wfile.write(body)
if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--port',type=int,default=8767); args=parser.parse_args()
    try:
        corpus()  # Fail clearly before advertising an unavailable server.
        httpd=HTTPServer(('127.0.0.1',args.port),Handler)
    except Exception as exc:
        parser.exit(1, f'Task search startup failed: {exc}\n')
    print(f'Task search: http://127.0.0.1:{args.port}',flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('Task search stopped.',flush=True)
    finally:
        httpd.server_close()
