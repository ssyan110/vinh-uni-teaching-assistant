"""Synthetic isolated feedback regression; never reads real grades."""
import copy
import json
import tempfile
from pathlib import Path
import feedback
from server import Store, ROOT, context, text, now, validate_snapshot

def main():
    root=ROOT/'qa'/'fixtures';root.mkdir(exist_ok=True)
    directory=Path(tempfile.mkdtemp(prefix='feedback-',dir=root))
    rubric=[{'name':'内容','max':5,'step':.5,'description':'说明选择并给出理由。'},{'name':'表达','max':5,'step':.5,'description':'录音后检查句子是否完整。'}]
    seed={'format':'vinh-gradebook-v1','revision':0,'classes':[{'id':'SYNTH','year':1,'students':[{'code':str(i),'name':'测试学生'+str(i),'seat':i,'active':True} for i in range(1,6)],'assessments':[{'id':'a','title':'测试任务','date':'','rubric':rubric}]}],'records':{}}
    for sid,status,scores in [('1','done',[2,4]),('2','absent',[None,None]),('3','pending',[None,None]),('4','supplement',[3,None])]:
        seed['records']['SYNTH|a|'+sid]={'status':status,'scores':scores,'total':sum(scores) if status=='done' else None,'flags':[],'note':'教师记录：请加一个例子。' if sid=='1' else ''}
    (directory/'seed.json').write_text(json.dumps(seed))
    store=Store(directory)
    def mutate(**kwargs):return feedback.mutate(store,dict(class_id='SYNTH',assessment_id='a',revision=store.read()['revision'],**kwargs),context,text,now)
    mutate(action='generate');rows=feedback.rows(store.read(),'SYNTH','a');assert len(rows)==5
    assert [r['record_status'] for r in rows]==['已报告','缺席','未报告','待补评','尚未评分']
    first=rows[0];assert '内容：2／5 分' in first['feedback']['performance'];assert '能力' not in first['feedback']['performance'];assert not first['feedback']['reviewed']
    def fails(fn):
        try:fn()
        except ValueError:return
        raise AssertionError('invalid feedback accepted')
    fails(lambda:feedback.export_html(store.read(),'SYNTH','a'))
    def save(row,reviewed,confirm=True):return mutate(action='save',student_code=row['student']['code'],fingerprint=row['fingerprint'],performance='<script>记录</script>',practice='按标准录音一次，并检查句子。',reviewed=reviewed,review_confirmed=confirm)
    fails(lambda:save(first,True,False));fails(lambda:save(rows[3],True))
    save(first,True);out=feedback.export_html(store.read(),'SYNTH','a');assert '&lt;script&gt;' in out and '测试学生2' not in out and 'KaiTi' in out and 'Times New Roman' in out
    saved=store.read();validate_snapshot(saved);assert saved['records']==seed['records']
    store.save({'class_id':'SYNTH','assessment_id':'a','student_code':'1','revision':saved['revision'],'status':'done','scores':[2,4],'note':'新证据'})
    assert not feedback.rows(store.read(),'SYNTH','a')[0]['current'];fails(lambda:save(first,True));fails(lambda:feedback.export_html(store.read(),'SYNTH','a'))
    mutate(action='generate');new=feedback.rows(store.read(),'SYNTH','a')[0];assert not new['feedback']['reviewed'] and new['feedback']['version']>first['feedback']['version']
    save(new,True);save(feedback.rows(store.read(),'SYNTH','a')[0],False);fails(lambda:feedback.export_html(store.read(),'SYNTH','a'))
    stale={'class_id':'SYNTH','assessment_id':'a','revision':0,'action':'generate'};fails(lambda:feedback.mutate(store,stale,context,text,now))
    snapshot=store.read();store.db.close();store=Store(directory);assert store.read()['feedback']==snapshot['feedback']
    bad=copy.deepcopy(snapshot);bad['feedback']['SYNTH|a|1']['reviewed']='yes';fails(lambda:validate_snapshot(bad))
    store.db.close();print('PASS: feedback statuses, evidence, confirmation, safe export, invalidation, persistence, restore validation, stale revision')
if __name__=='__main__':main()
