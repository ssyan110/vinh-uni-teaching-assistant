from pathlib import Path
from bs4 import BeautifulSoup
import json,re,hashlib,fitz
O=Path(__file__).resolve().parents[1];R=O.parents[5];d=json.loads((R/'lessons/boya-elementary-i/lesson-11/10-design/review-20261015/lesson-11-12-完整内容-v04.json').read_text());s=BeautifulSoup((O/'lesson-11-12-实体课.html').read_text(),'html.parser');pages=s.select('.os-page');assert len(pages)==21
norm=lambda t:re.sub(r'\s+','',t)
checks=[]
for a in d['activities']:
 ps=s.select('.os-page[data-activity="'+a['key']+'"]');assert len(ps)==a['pages'];alltext=norm(''.join(p.get_text() for p in ps))
 if a['key'] in ['11-3','12-4']:
  assert len(ps)==1 and len(ps[0].select('.comic img'))==1 and len(ps[0].select('.panel-label'))==6
  assert not ps[0].select('.levels') and ps[0].select_one('h1').get_text()=='看图说故事'
 else:
  for raw in a['body'].splitlines():
   t=raw.strip()
   if not t or t.startswith('### ') or re.match(r'^\|[-| ]+\|$',t):continue
   if t.startswith('|'):
    for cell in t.strip('|').split('|'):
     if cell.strip():assert norm(cell) in alltext,(a['key'],cell)
   else:
    t=re.sub(r'^\d+\. ','',t).replace('基础 HSK1–3：','').replace('挑战 HSK4–6：','');assert norm(t) in alltext,(a['key'],t)
 if a['key'] in ['12-1','12-3']:assert not ps[0].select('.levels')
 checks.append(dict(activity=a['key'],pages=[int(p['data-idx'])+1 for p in ps],status='passed'))
for q in d['integrated_questions']:
 p=s.select_one('.os-page[data-activity="'+q['key']+'"]');text=norm(p.get_text());assert all(norm(q[k]) in text for k in ['question','basic','challenge'])
assert not s.select('.os-page[data-activity="12-7"],.os-page[data-activity="12-8"]')
assert not s.select('audio,video,iframe')
assert len(pages[1].select('svg'))==7
for a in ['11-1','12-2']:
 p=s.select_one('.os-page[data-activity="'+a+'"][data-kind="data"] main');assert len(p.find_all(recursive=False))==1 and p.find('table')
for f in ['story-lesson-11.png','story-lesson-12.png']:
 assert (O/'assets'/f).read_bytes()==(R/'lessons/boya-elementary-i/lesson-11/10-design/open-slide-draft/lesson-11-12-two-page-v02/assets'/f).read_bytes()
items=json.loads((O/'source/teacher-reading-data.json').read_text());doc=fitz.open(O/'lesson-11-12-教师朗读稿.pdf');assert len(doc)==7
full=norm(''.join(p.get_text() for p in doc));studenttext=norm(s.get_text())
for x in items:
 for m in x['messages']:assert norm(m['text']) in full and norm(m['text']) not in studenttext
for i,p in enumerate(doc):
 assert len(p.get_text())>140
 for b in p.get_text('blocks'):assert b[1]>=0 and b[3]<p.rect.height
 p.get_pixmap(matrix=fitz.Matrix(1.2)).save(O/f'qa/reading-{i+1}.png')
fontset=sorted(set(f[3] for p in doc for f in p.get_fonts()));assert any('KaiTi' in f for f in fontset) and any('TimesNewRoman' in f for f in fontset)
result=dict(status='passed',pages=21,activity_checks=checks,integrated_questions=3,reading_activities=7,exact_messages=9,pdf_pages=7,fonts=fontset,script_privacy='all nine full messages absent from student deck',images='unchanged complete comic assets',limits='technical and content review; no actual classroom trial')
(O/'qa/content-fidelity.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print('21 slides,12 original activities,3 integrated questions,9 exact teacher messages and fonts passed')
