from pathlib import Path
import re,json,html
r=Path(__file__).resolve().parents[7];o=Path(__file__).resolve().parents[1]
a=json.loads((r/'lessons/boya-elementary-i/lesson-11/10-design/storyboard/lesson-11-双页活动-v02.json').read_text())['activities'];by={x['key']:x for x in a}
updates=json.loads((o/'source/simple-language-amendment.json').read_text())['activities']
for x in a:x.update(updates.get(x['key'],{}))
items=[]
info=[('11-1',4,'正常语速完整读一遍，停20秒独立记录；第二遍核对天气和温度。'),('11-5',12,'第一遍判断原计划；第二遍核对两个时段。有分歧只重读对应时段。'),('12-2',18,'第一遍每条间隔约3秒；第二遍每条间隔约5秒，核对地点、动作和时间。'),('12-6',26,'第一遍判断哪两天变了；第二遍核对时间和教室。只重读有争议的日期。')]
for key,page,read in info:
 x=by[key]
 if key=='12-2': messages=[{'speaker':m[0],'text':m[1]} for m in re.findall(r'(小林|小美|小王)：“([^”]+)”',x['teacher'])];assert len(messages)==3
 else:
  match=re.search(r'朗读全文：“([^”]+)”',x['teacher']);assert match;messages=[{'speaker':'','text':match[1]}]
 items.append({'activity':key,'title':x['title'],'slide':page,'read':read,'messages':messages})
css="""@page{size:A4;margin:18mm}body{margin:0;color:#17324D;font-family:'Times New Roman',KaiTi,serif;font-size:12pt;line-height:1.5}h1{font-size:18pt;margin:0 0 6mm;font-weight:normal}h2{font-size:16pt;margin:0 0 4mm;font-weight:normal}h3{font-size:14pt;margin:0 0 2mm;font-weight:normal}.sheet{break-after:page}.sheet:last-child{break-after:auto}.note{margin:0 0 6mm;font-size:12pt}.item{margin:0 0 8mm;break-inside:avoid}.meta{font-size:12pt;margin:0 0 3mm}.message{font-size:14pt;line-height:1.65;margin:0 0 4mm}.speaker{font-size:12pt;margin:0 0 1mm}.read{font-size:12pt;margin:2mm 0 0;padding-top:2mm;border-top:0.4pt solid #cbd5df}*{-webkit-print-color-adjust:exact} """
sheets=[]
for lesson in ['11','12']:
 blocks=[]
 for x in items:
  if not x['activity'].startswith(lesson):continue
  text=''.join((f'<p class="speaker">{html.escape(m["speaker"])}</p>' if m['speaker'] else '')+f'<p class="message">{html.escape(m["text"])}</p>' for m in x['messages'])
  blocks.append(f'<article class="item"><h3>活动{x["activity"]}｜{html.escape(x["title"])}</h3><p class="meta">对应课件第{x["slide"]}页</p>{text}<p class="read">朗读方式：{html.escape(x["read"])}</p></article>')
 sheets.append(f'<section class="sheet"><h1>第11、12课｜教师朗读稿</h1><h2>第{lesson}课</h2><p class="note">课堂模拟消息，由教师现场朗读。学生先看问题，不提前展示稿件。</p>'+''.join(blocks)+'</section>')
(o/'source/teacher-reading.html').write_text('<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><style>'+css+'</style></head><body>'+''.join(sheets)+'</body></html>')
(o/'source/teacher-reading-data.json').write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n')
print('Extracted six exact messages for four listening activities.')
