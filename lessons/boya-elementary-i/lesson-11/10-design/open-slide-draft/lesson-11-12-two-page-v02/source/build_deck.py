from pathlib import Path
import json, re, html, copy, hashlib, shutil, subprocess
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[7];O=Path(__file__).resolve().parents[1]
assert O.resolve().is_relative_to(R/'lessons/boya-elementary-i/lesson-11/10-design') and not O.is_symlink()
for n in (11,12): subprocess.run(['python3',str(R/'scripts/production_gate.py'),'--purpose','content-approval','--lesson-key',f'boya-elementary-i:lesson-{n}','--offering-id','2026-fall'],check=True,capture_output=True)
J=R/'lessons/boya-elementary-i/lesson-11/10-design/storyboard/lesson-11-双页活动-v02.json'
A=json.loads(J.read_text())['activities'];assert len(A)==14 and all(a['pages']==2 for a in A)
amendment=O/'source/solo-comic-amendment.json'
if amendment.exists():
 updates=json.loads(amendment.read_text())['activities']
 for activity in A: activity.update(updates.get(activity['key'],{}))
amendment=O/'source/simple-language-amendment.json'
if amendment.exists():
 updates=json.loads(amendment.read_text())['activities']
 for activity in A: activity.update(updates.get(activity['key'],{}))
REF=R/'lessons/boya-elementary-i/lesson-09-10/10-design/openslide-image-first-20261006/lesson-09-10.html'
s=BeautifulSoup(REF.read_text(),'html.parser')
def E(value):
 text=html.escape(value)
 for token in ['每……都……','每天都……','正在……呢','从……到……','太……了','小林','小美','小王','天气预报','晴天','阴天','刮风','下雨','逛街','开始']:
  text=text.replace(token,'<span class="no-wrap">'+token+'</span>')
 return text
(O/'assets').mkdir(exist_ok=True);(O/'qa').mkdir(exist_ok=True)
old=R/'lessons/boya-elementary-i/lesson-11/10-design/open-slide-draft/lesson-11-12-single-activity-v01/assets'
for f in ['bus.png','story-lesson-11.png','story-lesson-12.png']: shutil.copy2(old/f,O/'assets'/f)
P=[];plan=[];mapping=[]
cover=copy.deepcopy(s.select('.os-page')[0]);cover['data-idx']='0';cover.select_one('[data-osd-stable-id]')['data-osd-stable-id']='v02-cover'
for t in cover.find_all(string=True):
 t.replace_with(str(t).replace('第9–10课','第11–12课').replace('出发、购物，一起做决定','天气、动作与安排').replace('安排交通和购物，一起准备欢迎会。','听懂天气和消息，和同伴说清楚安排。').replace('交通计划 · 购物计划 · 综合活动','天气选择 · 电话确认 · 六格故事').replace('01 / 51','01 / 30'))
cover.select_one('img')['src']='assets/bus.png';P.append(str(cover));plan.append(dict(stableId='v02-cover',sourceSlides=[],motion='cover-route',focus=[]))
route=copy.deepcopy(s.select('.os-page')[1]);route['data-idx']='1';route.select_one('[data-osd-stable-id]')['data-osd-stable-id']='v02-route';route.select_one('section')['class']=['route']
groups=[('11-1—11-2','听天气，选出门安排'),('11-3','天气变了：六格故事'),('11-4—11-6','选城市，改安排，发通知'),('12-1—12-3','分清动作，听消息，打电话'),('12-4','还在路上：六格故事'),('12-5—12-8','更新课表，转告新安排')]
for i,(card,(nums,title)) in enumerate(zip(route.select('article'),groups)):
 card.select_one('h2').clear();card.select_one('h2').append(title)
 badge=s.new_tag('p');badge['class']='route-number';badge.string='活动'+nums;card.insert(0,badge)
 keyword=s.new_tag('div');keyword['class']='route-keyword';keyword['style']='height:180px;display:flex;align-items:center;justify-content:center;font-size:64px;font-weight:700;color:#087e8b';keyword.string=['听天气','讲天气故事','改出门安排','问当前状态','讲等车故事','更新课表'][i];card.select_one('img').replace_with(keyword)
P.append(str(route));plan.append(dict(stableId='v02-route',sourceSlides=[],motion='stagger-rise',focus=[]))

def markup(text):
 parts=[]
 for b in re.split(r'\n\s*\n',text.strip()):
  if b.startswith('|'):
   rows=[[x.strip() for x in line.strip('|').split('|')] for line in b.splitlines()]
   parts.append('<table><thead><tr>'+''.join('<th>'+E(x)+'</th>' for x in rows[0])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+E(x or '　')+'</td>' for x in row)+'</tr>' for row in rows[2:])+'</tbody></table>')
  elif re.match(r'^\d+\. ',b):
   parts.append('<ol>'+''.join('<li>'+E(re.sub(r'^\d+\. ','',x))+'</li>' for x in b.splitlines())+'</ol>')
  else: parts.append('<p>'+E(b).replace('\n','<br>')+'</p>')
 return ''.join(parts)

def frame(a,kind,body):
 idx=len(P);stable=f"v02-{a['key']}-{kind}";name=f"活动{a['key']}｜{a['title']}"
 footer=f'<footer><span>博雅汉语 · 初级口语活动</span><span>{idx+1:02d} / 30</span></footer>'
 doc=f'<div class="os-page" data-idx="{idx}" data-activity="{a["key"]}" data-kind="{kind}" hidden><section class="activity {kind}" data-osd-stable-id="{stable}"><header><div class="lesson-tag">第{a["key"].split("-")[0]}课 · 实体课</div><div class="activity-label">{E(name)}</div><h1>{E(a["title"])}</h1><div class="rule"></div></header>{body}{footer}</section></div>'
 P.append(doc);plan.append(dict(stableId=stable,sourceSlides=[],motion='stagger-rise',focus=[]));mapping.append(dict(page=idx+1,activity=a['key'],title=a['title'],kind=kind,lesson_key='boya-elementary-i:lesson-'+a['key'].split('-')[0],approved_input=str(J.relative_to(R))))

for a in A:
 steps=list(a['steps'])
 if a['key']=='11-6' and not (O/'source/simple-language-amendment.json').exists(): steps[0]='B先在纸上写：哪一天／几点见面／在哪里／做什么／几点结束。'+steps[0]
 body=f'<p class="goal" data-osd-step><span>你要会</span>{E(a["goal"])}</p><div class="task-grid"><ol class="task-steps">'+''.join(f'<li data-osd-step>{E(t)}</li>' for t in steps)+'</ol><aside>'+''.join(f'<article class="level {c}" data-osd-step><h2>{label} <span>HSK {rank}</span></h2><p>{E(a[key])}</p></article>' for c,label,rank,key in [('base','基础','1–3','basic'),('challenge','挑战','4–6','challenge')])+f'</aside></div><p class="done"><b>做完以后</b> {E(a["done"])}</p>'
 frame(a,'task',body)
 if a['key'] in ('11-3','12-4'):
  lesson=a['key'].split('-')[0]
  if lesson=='11':
   labels=['① 看预报','② 公园散步','③ 觉得热','④ 阴天刮风','⑤ 下雨避雨','⑥ 商场逛街'];context='天气预报：上午晴24度／下午雨28度。';prompts='①预报说什么？②③在哪里、感觉怎样？<br>④⑤天气怎样变？⑥最后做什么？';words='天气预报｜晴天｜热｜阴天｜刮风｜下雨｜逛街｜太……了'
  else:
   labels=['① 13:00','② 13:30','③ 13:40','④ 13:50','⑤ 14:00','⑥ 14:10'];context='小林每天坐公共汽车来学校；今天课：14:00—16:00。<br>人物：蓝衣小林／绿衣小王。';prompts='③两人做什么？④谁告诉老师？<br>⑤老师和小林做什么？⑥几点到、晚多久？';words='每天都……｜正在……呢｜从……到……｜等｜打电话｜告诉｜开始'
  context=re.sub(r'(\d+度)',r'<span class="no-wrap">\1</span>',context)
  panels=''.join(f'<span class="panel-label" style="left:{i%3*100/3}%;top:{i//3*50}%">{E(t)}</span>' for i,t in enumerate(labels))
  body=f'<div class="comic-grid"><div class="comic" data-osd-step><img src="assets/story-lesson-{lesson}.png" alt="第{lesson}课六格漫画，按①至⑥讲述">{panels}</div><aside class="comic-prompts"><p class="context" data-osd-step>{context}</p><h2>讲述提示</h2><p data-osd-step>{prompts}</p><h2>可用词句</h2><p class="words" data-osd-step>{E(words)}</p></aside></div>'
 else:
  parsed=BeautifulSoup(markup(a['data']),'html.parser')
  # Data tables lead; concrete questions remain visible beside or under them.
  
  for th in parsed.select('th'):
   th.string=th.get_text().replace('（听后记）','')
  tables=parsed.find_all('table');other=[str(x) for x in parsed.contents if getattr(x,'name',None)!='table']
  if a['key']=='11-2':
   table=tables[0];rows=table.select('tbody tr');cards='<div class="data-cards">'+''.join('<article data-osd-step><h2>'+E(row.select('td')[0].get_text())+'</h2><p>'+E(row.select('td')[1].get_text())+'</p><p>'+E(row.select('td')[2].get_text())+'</p></article>' for row in rows)+'</div>'
   body='<div class="material wide">'+cards+''.join(other)+'</div>'
  elif len(tables)==2:
   body='<div class="material split"><div class="table-side" data-osd-step>'+''.join(str(t) for t in tables)+'</div><div class="question-side" data-osd-step>'+''.join(other)+'</div></div>'
  elif tables:
   body='<div class="material split"><div class="table-side" data-osd-step>'+str(tables[0])+'</div><div class="question-side" data-osd-step>'+''.join(other)+'</div></div>'
  else: body='<div class="material text-only" data-osd-step>'+str(parsed)+'</div>'
 frame(a,'data',body)
assert len(P)==30
css=s.find_all('style')[0].get_text()+s.find_all('style')[2].get_text()+'''
.no-wrap{white-space:nowrap}.activity{width:1920px;height:1080px;box-sizing:border-box;padding:74px 96px 68px;background:#fff;color:#102a43;font-family:'Times New Roman',KaiTi,serif;position:relative}
.lesson-tag{font-size:45px;color:#087e8b;font-weight:700;line-height:1.2}.activity-label{position:absolute;right:96px;top:25px;font-size:36px;color:#087e8b;font-weight:700;line-height:1.2}
.activity h1{margin:12px 0 0;font-size:74px;line-height:1.08;font-weight:750;letter-spacing:-1px}.rule{margin-top:22px;width:74px;height:7px;border-radius:4px;background:#087e8b}
.goal{font-size:45px;line-height:1.25;margin:24px 0 0;color:#17324d}.goal span{color:#087e8b;font-weight:700;margin-right:22px}
.task-grid{display:grid;grid-template-columns:1.32fr 1fr;gap:42px;margin-top:26px}.task-steps{margin:0;padding-left:1.15em;font-size:45px;line-height:1.28}.task-steps li{padding-left:8px;margin:0 0 22px}.level{padding:22px 24px;border:1px solid #d9e3e8;border-radius:22px;background:#f8fbfb;margin-bottom:22px}.level.challenge{background:#fffbf2;border-color:#e6d4aa}.level h2{margin:0 0 12px;color:#087e8b;font-size:40px;line-height:1.2}.level.challenge h2{color:#8a4b08}.level h2 span{font-family:'Times New Roman',serif;font-size:36px;margin-left:18px;color:#526579}.level p{text-wrap:balance;margin:0;font-size:45px;line-height:1.25}
.done{position:absolute;left:96px;right:96px;bottom:88px;margin:0;border-left:7px solid #087e8b;padding:12px 18px;background:#f8fbfb;font-size:40px;line-height:1.25}.done b{color:#087e8b;margin-right:14px}
footer{position:absolute;bottom:38px;left:96px;right:96px;display:flex;justify-content:space-between;color:#526579;font-size:30px;line-height:1.1}
.material{margin-top:32px;font-size:45px;line-height:1.3}.material p{margin:0 0 24px}.material.split{display:grid;grid-template-columns:1.05fr 1fr;gap:44px}.material table{width:100%;border-collapse:collapse;font-size:45px;line-height:1.25;margin:0 0 24px}.material td,.material th{text-align:left;padding:18px 14px;border-bottom:1px solid #d9e3e8}.material td:first-child,.material th:first-child{white-space:nowrap}.material th{color:#087e8b;background:#f8fbfb;font-weight:650}.material ol{margin:0;padding-left:1.2em}.material ol li{margin:0 0 20px}.question-side p{margin-bottom:28px}.data-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-bottom:32px}.data-cards article{padding:24px 26px;border-radius:22px;border:1px solid #d8e7e9;background:#f8fbfb}.data-cards h2{margin:0 0 18px;font-size:48px;color:#087e8b}.data-cards p{font-size:45px;margin:0 0 12px}.wide>p{margin:0 0 24px}.text-only{max-width:1600px}
.comic-grid{display:grid;grid-template-columns:1080px 1fr;gap:34px;margin-top:28px;align-items:start}.comic{height:720px;position:relative}.comic img{width:100%;height:100%;object-fit:contain}.panel-label{position:absolute;background:white;border:1px solid #102a43;padding:4px 8px;font-size:34px;line-height:1.2}.comic-prompts{font-size:40px;line-height:1.3}.comic-prompts p{margin:0 0 26px}.comic-prompts h2{margin:24px 0 12px;font-size:40px;color:#087e8b}.comic-prompts .context{font-size:38px;background:#f8fbfb;border-radius:20px;padding:18px;color:#087e8b}.comic-prompts .words{font-size:36px;line-height:1.35}
.route article img{height:180px!important}.route-number{font-size:36px;color:#526579;margin:0 0 8px}.route article h2{line-height:1.25!important}.route:after{content:'基础：HSK 1–3　｜　挑战：HSK 4–6';position:absolute;left:96px;bottom:44px;font-size:30px;color:#526579;font-family:'Times New Roman',KaiTi,serif}
.os-page[data-activity="11-3"] .task-steps li,.os-page[data-activity="12-4"] .task-steps li{text-wrap:balance}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
'''
script=s.find_all('script')[-1].get_text();script,num=re.subn(r'var plan = .*?;\n  var keyframes','var plan = '+json.dumps(plan,ensure_ascii=False)+';\n  var keyframes',script,count=1,flags=re.S);assert num==1
html_doc='<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>第11–12课｜天气、动作与安排</title><style>'+css+'</style></head><body><div class="os-stage"><div class="os-frame" id="os-frame" data-osd-canvas>'+''.join(P)+'</div></div>'+str(s.select_one('.os-controlbar'))+str(s.select_one('.os-counter'))+'<script>'+script+'</script></body></html>'
(O/'lesson-11-12-实体课.html').write_text(html_doc)
(O/'source/animation-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n');(O/'source/slide-content-map.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2)+'\n')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
(O/'source/build-manifest.json').write_text(json.dumps({'version':'two-page-v02','page_count':30,'activity_count':14,'period_minutes':[50]*4,'reference':str(REF.relative_to(R)),'reference_sha256':sha(REF),'approved_input':str(J.relative_to(R)),'approved_input_sha256':sha(J),'html_sha256':sha(O/'lesson-11-12-实体课.html'),'cover':'reference DOM and CSS, content-only changes','route':'reference three-column DOM; six meaningful groups cover fourteen actual activities; image height adjusted for fit','comics':'approved existing six-panel assets reused; necessary context and timestamps visible','stage':'design_draft; no authority/release promotion'},ensure_ascii=False,indent=2)+'\n')
guide=['# 第11、12课｜教师速用说明','\n四节各50分钟，共200分钟；课间另计。原创新消息由教师现场读，不使用出版社Audio编号。全课30页。学生页与教师稿分离。','\n活动入口页先说明任务并示范。仅互听活动安排听者在资料页出现前背对屏幕；同资料交换属于修订练习。漫画活动11-3、12-4为个人准备、独立讲述和自行修订，不分组或互评。']
for a in A:
 guide += [f"\n## 活动{a['key']}｜{a['title']}（{a['minutes']}分钟）",a['teacher'].replace('ChatGPT原题名“两种安排”实际列出三个选项，本稿改名；原小林、小王两套喜好会增加角色负担，改作共同讨论问题，实际协商使用学生自己的喜好。','协商时使用三个公共选项和学生自己的喜好。').replace('已逐格查看现有图片：','六格顺序：').replace('ChatGPT叫同学小美，本稿统一为与男生形象对应的小王；只变名字，不改事件。','人物统一为蓝衣小林、绿衣小王。'),'\n语言：'+a['language']]
(O/'lesson-11-12-教师速用说明.md').write_text('\n\n'.join(guide))
for im in BeautifulSoup(html_doc,'html.parser').find_all('img'): assert (O/im['src']).is_file()
print('Built',len(P),'pages:',O/'lesson-11-12-实体课.html')
