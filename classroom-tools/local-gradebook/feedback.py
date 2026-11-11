"""Local evidence-based feedback drafts; no inference or external services."""
import hashlib
import html
import json

LABELS = {'done':'已报告', 'absent':'缺席', 'pending':'未报告', 'supplement':'待补评'}

def inputs(state, cid, aid, sid):
    cls = next(c for c in state['classes'] if c['id'] == cid)
    assessment = next(a for a in cls['assessments'] if a['id'] == aid)
    student = next(s for s in cls['students'] if s['code'] == sid)
    record = state['records'].get('|'.join((cid, aid, sid)))
    evidence = {'assessment':assessment, 'student':student, 'record':record}
    fingerprint = hashlib.sha256(json.dumps(evidence, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
    return assessment, record, fingerprint

def complete(a, r):
    return bool(r and r['status'] == 'done' and not r.get('flags') and len(r['scores']) == len(a['rubric']) and all(isinstance(n, (int,float)) for n in r['scores']))

def draft(a, r):
    status = LABELS.get(r.get('status')) if r else '尚未评分'
    scores = r['scores'] if r else [None] * len(a['rubric'])
    facts = '；'.join(f"{c['name']}：{s if s is not None else '尚未评分'}" + (f"／{c['max']} 分" if s is not None else '') for c,s in zip(a['rubric'], scores))
    performance = f'本次记录：{status}。{facts}。'
    if r and r.get('note'): performance += '\n教师记录：' + r['note']
    if not complete(a, r): performance += '\n资料未完整确认，暂不能作为完成反馈导出。'
    descriptions = [f"{c['name']}：{c['description']}" for c in a['rubric'] if c.get('description','').strip()]
    practice = ('对照本次评分标准练习，并请教师检查：\n' + '\n'.join(descriptions)) if descriptions else '请教师补充一个具体练习：练什么、怎么练、完成后检查什么。'
    return performance, practice

def rows(state, cid, aid):
    cls = next(c for c in state['classes'] if c['id'] == cid)
    result = []
    for s in cls['students']:
        a,r,fp = inputs(state,cid,aid,s['code'])
        saved = state.get('feedback',{}).get('|'.join((cid,aid,s['code'])))
        result.append({'student':s, 'record_status':LABELS.get(r['status']) if r else '尚未评分', 'complete':complete(a,r), 'fingerprint':fp, 'feedback':saved, 'current':bool(saved and saved['fingerprint']==fp)})
    return result

def mutate(store, data, context, text, now):
    state = store.read()
    if data.get('revision') != state['revision']: raise ValueError('资料已更新，请重新载入，避免覆盖反馈')
    cid,aid = data['class_id'],data['assessment_id']
    cls,a = context(state,cid,aid)
    entries = state.setdefault('feedback',{})
    before = dict(entries)
    if data.get('action') == 'generate':
        selected = data.get('student_codes', [s['code'] for s in cls['students'] if s['active']])
        if not isinstance(selected,list) or not selected: raise ValueError('请选择学生')
        for sid in selected:
            context(state,cid,aid,sid)
            key = '|'.join((cid,aid,sid))
            a,r,fp = inputs(state,cid,aid,sid)
            if key in entries and entries[key]['fingerprint']==fp: continue
            performance,practice = draft(a,r)
            entries[key] = {'fingerprint':fp,'performance':performance,'practice':practice,'reviewed':False,'updated_at':now(),'version':entries.get(key,{}).get('version',0)+1}
    elif data.get('action') == 'save':
        sid = data['student_code']; context(state,cid,aid,sid)
        key = '|'.join((cid,aid,sid)); a,r,fp = inputs(state,cid,aid,sid)
        old = entries.get(key)
        if not old or data.get('fingerprint') != fp or old['fingerprint'] != fp: raise ValueError('评分或备注已变化，请重新生成并审阅反馈')
        performance = text(data.get('performance','')).strip(); practice = text(data.get('practice','')).strip()
        if not performance or not practice: raise ValueError('请填写实际表现和下次练习')
        reviewed = data.get('reviewed') is True
        if reviewed and practice == '请教师补充一个具体练习：练什么、怎么练、完成后检查什么。': raise ValueError('请先填写一个具体的下次练习，再确认反馈')
        if reviewed and (not complete(a,r) or data.get('review_confirmed') is not True): raise ValueError('须先补齐并确认评分，再明确确认反馈内容')
        entries[key] = dict(old,performance=performance,practice=practice,reviewed=reviewed,reviewed_at=now() if reviewed else None,updated_at=now(),version=old['version']+1)
    else: raise ValueError('反馈操作不存在')
    return store.commit(state,'feedback|'+cid+'|'+aid,before,entries)

def validate(state, context, text):
    entries = state.get('feedback',{})
    if not isinstance(entries,dict) or len(entries)>100000: raise ValueError('反馈备份格式不正确')
    for key,f in entries.items():
        parts=key.split('|')
        if len(parts)!=3: raise ValueError('反馈身份无效')
        context(state,*parts)
        for field in ('performance','practice','fingerprint','updated_at'): text(f[field])
        if len(f['fingerprint'])!=64 or any(c not in '0123456789abcdef' for c in f['fingerprint']) or type(f['reviewed']) is not bool or type(f['version']) is not int or f['version']<1: raise ValueError('反馈备份格式不正确')

def export_html(state,cid,aid):
    items=rows(state,cid,aid)
    reviewed=[x for x in items if x['complete'] and x['current'] and x['feedback']['reviewed']]
    if not reviewed: raise ValueError('没有已审阅且仍有效的完整反馈可导出')
    esc=lambda x:html.escape(str(x))
    title=next(a['title'] for c in state['classes'] if c['id']==cid for a in c['assessments'] if a['id']==aid)
    blocks=''.join('<article><h2>'+esc(x['student']['name'])+' · '+esc(x['student']['code'])+'</h2><h3>实际表现</h3><p>'+esc(x['feedback']['performance'])+'</p><h3>下次练习</h3><p>'+esc(x['feedback']['practice'])+'</p></article>' for x in reviewed)
    return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>个人反馈</title><style>body{font-family:"Times New Roman",KaiTi,serif;color:#17324D;font-size:12pt;margin:24pt}p{white-space:pre-wrap}article{break-inside:avoid;border-bottom:1px solid #ddd;padding:12pt 0}h1{font-size:16pt}h2,h3{font-size:14pt}</style><h1>'+esc(cid)+' · '+esc(title)+'</h1><p>已审阅的有效反馈：'+str(len(reviewed))+' 人</p>'+blocks+'</html>'
