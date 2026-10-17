from pathlib import Path
from bs4 import BeautifulSoup
import json,re,html,copy,shutil,hashlib,subprocess
O=Path(__file__).resolve().parents[1];R=O.parents[5]
assert (R/'AGENTS.md').is_file() and O.is_relative_to(R/'lessons/boya-elementary-i/lesson-11/10-design')
for n in (11,12):subprocess.run(['python3',str(R/'scripts/production_gate.py'),'--purpose','content-approval','--lesson-key',f'boya-elementary-i:lesson-{n}','--offering-id','2026-fall'],capture_output=True,check=True)
J=R/'lessons/boya-elementary-i/lesson-11/10-design/review-20261015/lesson-11-12-完整内容-v05.json';D=json.loads(J.read_text());A=D['activities'];Q=D['integrated_questions'];assert len(A)==11 and D['proposed_page_count']==21
REF=R/'lessons/boya-elementary-i/lesson-09-10/10-design/openslide-image-first-20261006/lesson-09-10.html';ref=BeautifulSoup(REF.read_text(),'html.parser')
P=[];plan=[];mapping=[]
def E(t):
 t=html.escape(str(t))
 for token in ['HSK1–3','HSK4–6','小林','小美','小王','胡志明广场','星期一','星期二','星期三','星期四','星期五','周六','周日','23度','27度','25度','每天都……','正在……呢','从……到……','太……了']:
  t=t.replace(token,'<span class="nowrap">'+token+'</span>')
 return t

def icon(kind):
 paths={
 'weather':'<circle cx="65" cy="54" r="25" fill="#f4ce63"/><path d="M65 14V5m0 98v-9M25 54H14m102 0h-12M36 25l-8-8m66 75-8-8M94 25l8-8"/><path d="M52 105h85a26 26 0 0 0 0-52 33 33 0 0 0-59-3 28 28 0 0 0-26 55" fill="#e4f2f1"/>',
 'story':'<rect x="18" y="12" width="126" height="112" rx="8"/><path d="M60 12v112m42-112v112M18 68h126"/><circle cx="39" cy="37" r="8" fill="#f4ce63"/><path d="m27 57 12-10 13 10m17 42 12-12 14 13m17-55 12-11 12 10"/>',
 'place':'<path d="M80 125s45-46 45-77a45 45 0 0 0-90 0c0 31 45 77 45 77Z" fill="#e4f2f1"/><circle cx="80" cy="47" r="15" fill="#fff"/>',
 'phone':'<path d="m45 14 22 31-17 19c15 21 24 30 45 40l17-19 32 20c-8 28-27 34-50 22C52 107 17 67 18 40c0-13 12-23 27-26Z" fill="#e4f2f1"/><path d="M96 19a46 46 0 0 1 43 44M96 40a25 25 0 0 1 22 23"/>',
 'clock':'<circle cx="80" cy="67" r="54" fill="#e4f2f1"/><path d="M80 31v36l28 16"/><circle cx="80" cy="67" r="4" fill="#087e8b"/>',
 'calendar':'<rect x="20" y="22" width="120" height="105" rx="9" fill="#e4f2f1"/><path d="M20 51h120M51 11v25m58-25v25M44 75h16m21 0h16m18 0h8M44 98h16m21 0h16"/>',
 'talk':'<path d="M21 20h121v78H79l-34 24V98H21Z" fill="#e4f2f1"/><path d="M43 44h76M43 65h57"/>'}
 return '<svg viewBox="0 0 160 140" role="img" aria-label="'+kind+'" fill="none" stroke="#087e8b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">'+paths[kind]+'</svg>'

def append(page,stable,meta=None):
 idx=len(P);page['data-idx']=str(idx)
 if idx:page['hidden']=''
 else:page.attrs.pop('hidden',None)
 P.append(str(page));plan.append(dict(stableId=stable,sourceSlides=[],motion='stagger-rise',focus=[]))
 if meta:mapping.append(dict(page=idx+1,**meta))
cover=copy.deepcopy(ref.select('.os-page')[0]);stable='v05-cover';cover.select_one('[data-osd-stable-id]')['data-osd-stable-id']=stable
for t in list(cover.find_all(string=True)):
 t.replace_with(str(t).replace('第9–10课','第11–12课').replace('出发、购物，一起做决定','说天气，问清楚，讲故事').replace('安排交通和购物，一起准备欢迎会。','听天气和消息，说清时间与安排。').replace('交通计划 · 购物计划 · 综合活动','天气 · 电话 · 看图说故事').replace('01 / 51','01 / 21'))
im=cover.select_one('img');holder=im.parent;holder.clear();holder['style']='height:670px;display:flex;flex-direction:column;gap:24px;border-left:1px solid #d9e3e8;padding-left:30px;align-items:center'
for lesson,col in [(11,0),(12,2)]:
 div=ref.new_tag('div');div['class']='cover-crop';img=ref.new_tag('img',src=f'assets/story-lesson-{lesson}.png',alt='看天气预报' if lesson==11 else '给同学打电话');img['style']=f'left:-{col*100}%;top:0';div.append(img);holder.append(div)
append(cover,stable)
route=copy.deepcopy(ref.select('.os-page')[1]);route.select_one('[data-osd-stable-id]')['data-osd-stable-id']='v05-route';route.select_one('section')['class']='route';grid=route.select_one('section > div');grid['style']='display:grid;grid-template-columns:repeat(4,1fr);gap:26px'
groups=[('weather','听天气、安排出游','11-1—11-2'),('story','看图说故事','11-3'),('place','改安排、查城市天气','11-5 → 11-4'),('phone','听消息、打电话','12-1—12-3'),('story','看图说故事','12-4'),('calendar','听生活、听通知','12-5—12-6'),('talk','综合口语','综合1—3')]
first=copy.deepcopy(grid.select_one('article'));grid.clear()
for kind,title,num in groups:
 c=copy.deepcopy(first);c.clear();c['class']='route-card';c.append(BeautifulSoup(icon(kind),'html.parser'));h=ref.new_tag('h2');h.string=title;c.append(h);small=ref.new_tag('p');small['class']='route-range';small.string='活动'+num;c.append(small);grid.append(c)
append(route,'v05-route')

def parse_md(text):
 chunks=[];lines=text.strip().splitlines();i=0
 while i<len(lines):
  line=lines[i].strip()
  if not line:i+=1;continue
  if line.startswith('|'):
   rows=[]
   while i<len(lines) and lines[i].strip().startswith('|'):
    row=[x.strip() for x in lines[i].strip().strip('|').split('|')]
    if not all(re.match(r'^:?-+:?$',x) for x in row):rows.append(row)
    i+=1
   chunks.append('<table><thead><tr>'+''.join('<th>'+E(x)+'</th>' for x in rows[0])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+E(x or '　')+'</td>' for x in row)+'</tr>' for row in rows[1:])+'</tbody></table>');continue
  if re.match(r'^\d+\. ',line):
   arr=[]
   while i<len(lines) and re.match(r'^\d+\. ',lines[i].strip()):arr.append(re.sub(r'^\d+\. ','',lines[i].strip()));i+=1
   chunks.append('<ol>'+''.join('<li>'+E(x)+'</li>' for x in arr)+'</ol>');continue
  if line.startswith('### '):i+=1;continue
  chunks.append('<p>'+E(line)+'</p>');i+=1
 return ''.join(chunks)

def task_parts(body):
 split=re.split(r'### (?:第二页资料|同页资料)[^\n]*\n',body,maxsplit=1);task=split[0];material=split[1] if len(split)>1 else ''
 levels={};steps=[];extra=[]
 for line in task.splitlines():
  line=line.strip()
  if re.match(r'^\d+\. ',line):steps.append(re.sub(r'^\d+\. ','',line))
  elif line.startswith('基础 HSK1–3：'):levels['base']=line.split('：',1)[1]
  elif line.startswith('挑战 HSK4–6：'):levels['challenge']=line.split('：',1)[1]
  elif line:extra.append(line)
 return steps,levels,material,extra

def levels_html(levels):
 return '<div class="levels">'+''.join('<article class="level '+k+'" data-osd-step><h2>'+('基础 <span>HSK 1–3</span>' if k=='base' else '挑战 <span>HSK 4–6</span>')+'</h2><p>'+E(levels[k])+'</p></article>' for k in ['base','challenge'] if k in levels)+'</div>' if levels else ''

def frame(key,title,kind,body,cls=''):
 idx=len(P);lesson='第'+key.split('-')[0]+'课 · 实体课' if key[0].isdigit() else '第6—12课 · 综合口语';lab=('活动'+key+'｜'+title)
 page=BeautifulSoup(f'<div class="os-page" data-activity="{key}" data-kind="{kind}"><section class="activity {cls}" data-osd-stable-id="v05-{key}-{kind}"><header><div class="lesson-tag">{lesson}</div><div class="activity-label">{E(lab)}</div><h1>{E(title)}</h1><div class="rule"></div></header><main>{body}</main><footer><span>博雅汉语 · 初级口语活动</span><span>{idx+1:02d} / 21</span></footer></section></div>','html.parser').div
 append(page,f'v05-{key}-{kind}',dict(activity=key,title=title,kind=kind))

for a in A:
 key=a['key'];steps,levels,material,extra=task_parts(a['body']);stepshtml='<ol class="steps">'+''.join('<li data-osd-step>'+E(x)+'</li>' for x in steps)+'</ol>';extras=''.join('<p class="support" data-osd-step>'+E(x)+'</p>' for x in extra)
 if key in ['11-3','12-4']:
  lesson=key.split('-')[0]
  context='天气预报：上午晴24度／下午雨28度。' if lesson=='11' else '每天坐公共汽车来学校｜今天14:00—16:00上课<br>蓝衣小林／绿衣小王'
  instruction='自己按①到⑥讲故事，说清'+('天气怎么变、人物做什么。' if lesson=='11' else '几点、人物在哪里、在做什么。')
  labels=['① 看预报','② 公园散步','③ 觉得热','④ 阴天刮风','⑤ 下雨避雨','⑥ 商场逛街'] if lesson=='11' else ['①13:00','②13:30','③13:40','④13:50','⑤14:00','⑥14:10']
  words='天气预报｜晴天｜热｜阴天｜刮风｜下雨｜逛街｜太……了' if lesson=='11' else '每天都……｜正在……呢｜从……到……｜等｜打电话｜告诉｜开始'
  body='<p class="comic-instruction" data-osd-step>'+E(instruction)+'</p><div class="comic-layout"><div class="comic" data-osd-step><img src="assets/story-lesson-'+lesson+'.png" alt="完整六格漫画，按①至⑥讲故事">'+''.join(f'<span class="panel-label" style="left:{i%3*100/3}%;top:{i//3*50}%">{E(t)}</span>' for i,t in enumerate(labels))+'</div><aside data-osd-step><p class="context">'+context+'</p><p class="support"><b>可用词句：</b><br>'+E(words)+'</p></aside></div>'
  frame(key,a['title'],'comic',body,'comic-page');continue
 if a['pages']==2:
  frame(key,a['title'],'task','<div class="task-columns">'+stepshtml+levels_html(levels)+'</div>'+extras,'task-page')
  mat=parse_md(material)
  if key=='11-2':
   mat='<div class="weather-source"><img src="assets/textbook-week-weather.png" alt="课本一周天气表：周五4日至周四10日，天气、最高最低温、风向和微风，七天完整"></div>' 
  frame(key,a['title'],'data',mat,'data-page data-'+key);continue
 # Single coherent activity: necessary actions and actual material stay together.
 body=stepshtml+extras+parse_md(material)+levels_html(levels)
 frame(key,a['title'],'single',body,'single single-'+key)
for q in Q:
 body='<p class="question" data-osd-step>'+E(q['question'])+'</p><p class="discussion-flow" data-osd-step>自己想一想 → 两人轮流说 → 听的人问一个问题，再回答</p>'+levels_html(dict(base=q['basic'],challenge=q['challenge']))
 frame(q['key'],q['title'],'discussion',body,'discussion')
assert len(P)==21
css=ref.find_all('style')[0].get_text()+ref.find_all('style')[2].get_text()+'''
*{box-sizing:border-box}.nowrap{white-space:nowrap}.os-frame{font-family:'Times New Roman',KaiTi,serif}.activity{width:1920px;height:1080px;padding:74px 96px 68px;background:#fff;color:#102a43;font-family:'Times New Roman',KaiTi,serif;position:relative}.activity header{margin-bottom:28px}.lesson-tag{font-size:45px;color:#087e8b;font-weight:700;line-height:1.2}.activity-label{position:absolute;right:96px;top:25px;font-size:34px;color:#087e8b;font-weight:700;line-height:1.2}.activity h1{margin:12px 0 0;font-size:74px;line-height:1.08;font-weight:750;letter-spacing:-1px}.rule{margin-top:22px;width:74px;height:7px;border-radius:4px;background:#087e8b}main{font-size:45px;line-height:1.25}main p{margin:16px 0}footer{position:absolute;bottom:38px;left:96px;right:96px;display:flex;justify-content:space-between;color:#526579;font-size:30px;line-height:1.1}.steps{margin:0 0 22px;padding-left:1.2em;font-size:45px;line-height:1.27}.steps li{padding-left:6px;margin-bottom:16px}.levels{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:22px}.level{padding:18px 24px;border:1px solid #d9e3e8;border-radius:20px;background:#f8fbfb}.level.challenge{background:#fffbf2;border-color:#e6d4aa}.level h2{margin:0 0 10px;color:#087e8b;font-size:40px;line-height:1.2}.level.challenge h2{color:#8a4b08}.level h2 span{font-size:34px;margin-left:15px;color:#526579}.level p{margin:0;font-size:45px;line-height:1.25;text-wrap:balance}.task-columns{display:grid;grid-template-columns:1.25fr 1fr;gap:48px;margin-top:38px}.task-columns .levels{display:flex;flex-direction:column;margin:0}.task-columns .steps li{margin-bottom:30px}.support{color:#087e8b;font-size:40px;line-height:1.3}table{width:100%;border-collapse:collapse;font-size:45px;line-height:1.2;margin:18px 0}td,th{padding:16px 18px;border-bottom:1px solid #d9e3e8;text-align:center;vertical-align:middle}th{color:#087e8b;background:#f8fbfb;font-weight:700}th:first-child,td:first-child{white-space:nowrap}.data-page main{padding-top:12px}.data-page table{margin:26px 0}.data-11-1 main,.data-12-2 main{padding-top:70px}.data-11-1 td,.data-12-2 td{height:150px}.data-12-5 td{height:70px}.data-11-5 main>p:first-child{text-align:center;font-size:48px;color:#087e8b}.data-11-5 td{height:90px}.data-11-5 main>ol{font-size:45px;margin:10px 0;padding-left:1.2em}.data-11-5 main>ol li{margin-bottom:10px}.data-11-5 main>p:last-child{font-size:40px;color:#087e8b}.single main{line-height:1.2}.single .steps{font-size:45px;line-height:1.2;margin-bottom:16px}.single .steps li{margin-bottom:12px}.single main>p{font-size:40px;margin:12px 0}.single main>p:has(+table){color:#087e8b}.single main>p:last-of-type{color:#087e8b}.single table{margin:12px 0}.single td,.single th{padding:12px 16px}.single .levels{margin-top:16px}.single .level{padding:14px 20px}.single .level h2{font-size:38px;margin-bottom:8px}.single .level p{font-size:43px;line-height:1.2}.single-11-2 .steps{margin-bottom:10px}.single-11-2 main>p:first-of-type{display:none}.single-11-6 .steps{font-size:43px}.single-11-6 .level p{font-size:42px}.single-12-1 .steps{font-size:48px;line-height:1.3;max-width:1630px;padding-top:20px}.single-12-1 .steps li{margin-bottom:30px}.single-12-6 .steps{display:none}.single-12-6 td{height:76px}.single-12-6 .levels{margin-top:20px}.single-12-6 main>p:last-of-type{font-size:45px;margin:20px 0}.comic-instruction{font-size:45px;margin:0 0 20px}.comic-layout{display:grid;grid-template-columns:950px 1fr;gap:38px;align-items:start}.comic{height:630px;position:relative}.comic img{width:100%;height:100%;object-fit:contain}.panel-label{position:absolute;background:#fff;border:1px solid #102a43;padding:4px 8px;font-size:32px;line-height:1.2}.context{font-size:40px;line-height:1.3;color:#087e8b;padding:18px;background:#f8fbfb;border-radius:18px;margin-top:0}.comic-layout .support{font-size:40px;line-height:1.45}.cover-crop{width:320px;height:320px;overflow:hidden;position:relative;border-radius:24px;border:1px solid #d9e3e8;background:#f8fbfb}.cover-crop img{position:absolute;width:300%;height:200%;max-width:none!important;object-fit:fill!important}.route-card{height:320px;text-align:center!important;padding:16px!important}.route-card svg{height:175px;width:200px;display:block;margin:auto}.route-card h2{font-size:40px!important;margin:12px 0 8px!important;line-height:1.2}.route-range{font-size:30px;color:#526579;margin:0}.route>h1{margin-bottom:42px!important}.route{position:relative}.discussion .question{font-size:52px;line-height:1.35;margin:26px 0 32px}.discussion-flow{font-size:40px;color:#087e8b;padding:18px 22px;background:#f8fbfb;border-radius:18px}.discussion .levels{margin-top:32px}.discussion .level p{font-size:45px;line-height:1.3}
.data-11-5 main{padding-top:0}.data-11-5 td{height:80px;padding:8px 18px}.data-11-5 main>p:last-child{margin:10px 0}.data-12-5 main{padding-top:0}.data-12-5 main>p{font-size:45px;margin:0 0 10px}.data-12-5 table{margin:10px 0;line-height:1.1}.data-12-5 td{height:64px;padding:5px 18px}.data-12-5 th{padding:10px 18px}.single-12-6 table{line-height:1.1}.single-12-6 td{height:68px;padding:8px 16px}.single-12-6 th{padding:8px 16px}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
'''
css += '.weather-source{position:relative;width:1536px;height:700px;overflow:hidden;margin:0 auto}.weather-source img{position:absolute;width:1590px;max-width:none;height:auto;left:-36px;top:-264px}.data-11-2 main{padding-top:0}.single-11-4 .steps{font-size:43px;line-height:1.24}.single-11-4 .level p{font-size:43px}.single-11-4 .support{font-size:40px}'
script=ref.find_all('script')[-1].get_text();script,num=re.subn(r'var plan = .*?;\n  var keyframes','var plan = '+json.dumps(plan,ensure_ascii=False)+';\n  var keyframes',script,count=1,flags=re.S);assert num==1
html_doc='<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>第11–12课｜天气、动作与安排</title><style>'+css+'</style></head><body><div class="os-stage"><div class="os-frame" id="os-frame" data-osd-canvas>'+''.join(P)+'</div></div>'+str(ref.select_one('.os-controlbar'))+str(ref.select_one('.os-counter'))+'<script>'+script+'</script></body></html>'
(O/'lesson-11-12-实体课.html').write_text(html_doc)
for name,data in [('animation-plan.json',plan),('slide-content-map.json',mapping)]: (O/'source'/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
(O/'source/build-manifest.json').write_text(json.dumps(dict(version='v05',page_count=21,activity_count=14,approved_input=str(J.relative_to(R)),approved_sha256=sha(J),reference=str(REF.relative_to(R)),reference_sha256=sha(REF),html_sha256=sha(O/'lesson-11-12-实体课.html'),stage='content-approved design draft; no authority/release promotion'),ensure_ascii=False,indent=2)+'\n')
guide=['# 第11、12课｜教师速用说明','v05；21页。课时依实际课表执行，活动预算为安排估计。漫画独立讲述；其他互动共看资料，不转身。完整消息仅教师朗读。']
for a in A:guide += [f'## 活动{a["key"]}｜{a["title"]}（课件第'+('—'.join(map(str,a['page_numbers'])))+'页）',a['teacher']]
for q in Q:guide += [f'## {q["key"]}｜{q["title"]}',q['question'],q['teacher']]
(O/'lesson-11-12-教师速用说明.md').write_text('\n\n'.join(guide)+'\n')
# Separate teacher reading: preserve exact approved message strings and page mapping.
items=[]
for a in A:
 if a['key']=='12-2':msgs=[dict(speaker=n,text=t) for n,t in re.findall(r'(小林|小美|小王)：“([^”]+)”',a['teacher'])]
 elif '朗读全文' in a['teacher']:
  m=re.search(r'朗读全文[：:]\s*“([^”]+)”',a['teacher']);assert m,a['key'];msgs=[dict(speaker='',text=m[1])]
 else:continue
 read=re.search(r'读法[：:]\s*(.*?)(?:\n\n|\n答案|\n示范)',a['teacher'],re.S)
 items.append(dict(activity=a['key'],title=a['title'],slide=a['page_numbers'],messages=msgs,read=read[1] if read else '先看要求；第一遍记关键词，第二遍补全，再核对具体分歧。'))
assert len(items)==6 and sum(len(x['messages']) for x in items)==8
(O/'source/teacher-reading-data.json').write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n')
sheets=[]
for x in items:
 sheets.append('<section class="sheet"><p class="eyebrow">第11—12课 · 教师朗读稿</p><h1>活动'+E(x['activity'])+'｜'+E(x['title'])+'</h1><p class="meta">课件第'+('—'.join(map(str,x['slide'])))+'页 · 原创教学模拟消息 · 不投影全文</p>'+''.join(('<h2>'+E(m['speaker'])+'</h2>' if m['speaker'] else '')+'<p class="message">'+E(m['text'])+'</p>' for m in x['messages'])+'<div class="read"><h2>读法</h2><p>'+E(x['read']).replace('\n','<br>')+'</p></div><footer>'+str(len(sheets)+1)+' / 6</footer></section>')
pdfcss="""@page{size:A4;margin:18mm}*{box-sizing:border-box}body{color:#17324d;font-family:'Times New Roman',KaiTi,serif;font-size:12pt;line-height:1.6;margin:0}.sheet{height:259mm;position:relative;break-after:page}.sheet:last-child{break-after:auto}.eyebrow{font-size:12pt;color:#087e8b;margin:0 0 7mm}h1{font-size:16pt;font-weight:normal;margin:0 0 4mm}h2{font-size:14pt;font-weight:normal;margin:5mm 0 2mm}.meta{font-size:12pt;margin:0 0 8mm}.message{font-size:14pt;line-height:1.8;margin:0 0 5mm}.read{margin-top:8mm;border-top:1pt solid #d9e3e8;padding-top:3mm}.read p{margin:0}footer{position:absolute;bottom:0;right:0;font-size:12pt;color:#526579}.nowrap{white-space:nowrap}"""
(O/'source/teacher-reading.html').write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>'+pdfcss+'</style><body>'+''.join(sheets)+'</body></html>')
print('Built21slides,6 reading sheets,8 exact messages:',O)
