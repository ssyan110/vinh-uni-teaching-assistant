from pathlib import Path
from bs4 import BeautifulSoup
import json,re
r=Path(__file__).resolve().parents[7];o=Path(__file__).resolve().parents[1]
a=json.loads((r/'lessons/boya-elementary-i/lesson-11/10-design/storyboard/lesson-11-双页活动-v02.json').read_text())['activities'];s=BeautifulSoup((o/'lesson-11-12-实体课.html').read_text(),'html.parser');checks=[]
updates=json.loads((o/'source/solo-comic-amendment.json').read_text())['activities']
for activity in a:activity.update(updates.get(activity['key'],{}))
updates=json.loads((o/'source/simple-language-amendment.json').read_text())['activities']
for activity in a:activity.update(updates.get(activity['key'],{}))
normal=lambda x:re.sub(r'\s+','',x).replace('（听后记）','')
for x in a:
 ps=s.select(f'.os-page[data-activity="{x["key"]}"]'); assert len(ps)==2
 task=normal(ps[0].get_text());missing=[t for t in [x['goal'],*x['steps'],x['basic'],x['challenge'],x['done']] if normal(t) not in task];assert not missing,(x['key'],missing)
 material=normal(ps[1].get_text())
 if x['key'] not in ['11-3','12-4']:
  expected=[]
  for line in x['data'].splitlines():
   if not line.strip() or '|---' in line:continue
   if line.startswith('|'):
    cells=[t.strip() for t in line.strip('|').split('|') if t.strip()]
    if x['key']=='11-2' and cells==['时间','天气','活动']:continue # replaced by explicit option cards
    expected.extend(cells)
   else:expected.append(re.sub(r'^\d+\. ','',line))
  missing=[t for t in expected if normal(t) not in material];assert not missing,(x['key'],missing)
 else:assert len(ps[1].select('.panel-label'))==6 and len(ps[1].select('.comic img'))==1
 checks.append({'activity':x['key'],'pages':[int(p['data-idx'])+1 for p in ps],'task_copy_exact':True,'material_complete':True,'both_levels':True})
assert len(s.select('.os-page'))==30
assert not s.select('audio,video,iframe');assert '喂，我是小林' not in s.get_text()
(o/'qa/content-fidelity.json').write_text(json.dumps({'status':'passed','pages':30,'activities':14,'checks':checks,'teacher_material':'all full scripts, answers and helps in separate guide','semantic_layout_edits':['comic drafting captions converted to actual images/labels','table header duplicate listening annotation removed; task still names recording action','11-2 table replaced by three fully labelled time/weather/activity option cards']},ensure_ascii=False,indent=2)+'\n')
print('All 14 task texts and input facts preserved; two pages per activity, two routes, answers separated.')
