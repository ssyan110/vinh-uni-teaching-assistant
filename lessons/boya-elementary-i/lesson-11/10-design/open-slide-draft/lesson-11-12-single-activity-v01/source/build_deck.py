"""Build the approved single-activity copy with the existing classroom shell."""
from pathlib import Path
import copy
import hashlib
import html
import json
import re
import shutil
import subprocess
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[7]
OUT = Path(__file__).resolve().parents[1]
assert (ROOT / 'course/open-slide-workspace.json').is_file()
assert OUT.resolve().is_relative_to(ROOT / 'lessons/boya-elementary-i/lesson-11/10-design')
for n in (11, 12):
    subprocess.run(['python3', str(ROOT / 'scripts/production_gate.py'), '--purpose',
                    'content-approval', '--lesson-key', f'boya-elementary-i:lesson-{n}',
                    '--offering-id', '2026-fall'], check=True, capture_output=True)
COPY = ROOT / 'lessons/boya-elementary-i/lesson-11/10-design/storyboard/lesson-11-逐页文案审阅.md'
REFERENCE = ROOT / 'lessons/boya-elementary-i/lesson-09-10/10-design/openslide-image-first-20261006/lesson-09-10.html'
ref = BeautifulSoup(REFERENCE.read_text(), 'html.parser')
copy_text = COPY.read_text()
display = json.loads((OUT/'source/slide-display-copy.json').read_text())
assert len(display) == 12
blocks = list(re.finditer(r'^## 活动(\d+)｜([^\n]+)\n(.*?)(?=^## 活动\d+｜|^## 来源与覆盖说明)', copy_text, re.M | re.S))
assert [int(b[1]) for b in blocks] == list(range(1, 13))

def escape(text):
    return html.escape(text).replace('**', '')

def paragraphs(text):
    """The approved copy contains paragraphs and two simple public-data tables."""
    result = []
    for block in re.split(r'\n\s*\n', text.strip()):
        if block.startswith('|'):
            rows = [line.strip('|').split('|') for line in block.splitlines()]
            assert len(rows) >= 3
            result.append('<table><thead><tr>' + ''.join(f'<th>{escape(x.strip())}</th>' for x in rows[0]) + '</tr></thead><tbody>' + ''.join('<tr>' + ''.join(f'<td>{escape(x.strip())}</td>' for x in row) + '</tr>' for row in rows[2:]) + '</tbody></table>')
        else:
            result.append('<ul class="steps">'+''.join('<li>'+escape(line)+'</li>' for line in block.splitlines())+'</ul>')
    return ''.join(result)

pages = []
cover = copy.deepcopy(ref.select('.os-page')[0])
cover['data-idx'] = '0'
for t in cover.find_all(string=True):
    t.replace_with(str(t).replace('第9–10课', '第11–12课').replace('出发、购物，一起做决定', '说天气，问清楚，讲故事').replace('安排交通和购物，一起准备欢迎会。', '听懂消息，和同伴说清楚自己的想法。').replace('交通计划 · 购物计划 · 综合活动', '听说练习 · 两档难度 · 六格故事').replace('01 / 51', '01 / 14'))
cover.select_one('img')['src'] = 'assets/bus.png'
cover.select_one('[data-osd-stable-id]')['data-osd-stable-id'] = 'single-cover'
pages.append(str(cover))

route = copy.deepcopy(ref.select('.os-page')[1])
route['data-idx'] = '1'
route.select_one('[data-osd-stable-id]')['data-osd-stable-id'] = 'single-route'
for i, card in enumerate(route.select('article')):
    # Six original route cards each show two actual activity names.
    card.select_one('h2').clear()
    for j in (i * 2, i * 2 + 1):
        if j % 2: card.select_one('h2').append(BeautifulSoup('<br>', 'html.parser'))
        card.select_one('h2').append(f'{j + 1}　{display[j]["title"]}')
    card.select_one('img')['src'] = 'assets/bus.png' if i >= 3 else 'assets/story-lesson-11.png'
route.select_one('section')['class'] = ['route']
pages.append(str(route))

mapping = []
teacher = ['# 第11—12课｜教师速用说明', '', '12活动／200分钟；课间另计。课件只显示学生内容。听力A、B、C为教师原创现场朗读，不标出版社Audio编号。', '', '每页示范完整一轮，再让学生开始；首答保留。根据实际表现选择路线，反馈后同内容重说。计时为备课预算，未做课堂时长验收。', '']
printed = ['P80–85','P80–85','P80–85','P81–87','P80–85','P80–85','P89–95','P89–95','P89–96','P89–98','P92–98','P80–85、P89–95']
for block in blocks:
    num, title, body = int(block[1]), display[int(block[1])-1]['title'], block[3]
    visible = body.split('### 学生可见（整张slide）\n', 1)[1].split('\n### ', 1)[0].strip()
    fields = re.split(r'\n\n(?=(?:基础|挑战|可用|词语可用|完成)：)', visible)
    common = fields[0]
    if num in (5, 10):
        common = re.sub(r'^画面：[^\n]+\n\n', '', common)
    routes = {f.split('：', 1)[0]: f.split('：', 1)[1] for f in fields[1:]}
    assert all(key in routes for key in ['基础', '挑战', '完成'])
    routes = display[num-1]
    common = routes['material']
    support = routes.get('可用', '')
    side = '<div class="levels">' + ''.join(f'<article data-osd-step class="level {kind}"><h2>{name} <span>HSK {rank}</span></h2><ul>{''.join('<li>'+escape(t)+'</li>' for t in routes[name].splitlines())}</ul></article>' for name, rank, kind in [('基础','1–3','base'),('挑战','4–6','challenge')]) + '' + '</div>'
    if num in (5, 10):
        lesson = 11 if num == 5 else 12
        times = ['08:30','09:30','12:30','13:30','14:00','14:20'] if lesson == 11 else ['13:00','13:30','13:40','13:50','14:00','14:10']
        labels = ''.join(f'<span class="panel-label" style="left:{(i%3)*100/3}%;top:{(i//3)*50}%">{i+1} · {t}</span>' for i,t in enumerate(times))
        common_html = f'<div class="comic" data-osd-step><img src="assets/story-lesson-{lesson}.png" alt="第{lesson}课六格故事漫画，按一至六格顺序阅读">{labels}</div>'
        if lesson == 11:
            common_html += '<p class="story-data">预报：上午晴24度；下午有雨28度。</p>'
        else:
            common_html += '<p class="story-data">课：14:00–16:00，108教室。小王每天下午坐车来学校。</p>'
        side = side.replace('<div class="levels">', '<div class="levels"><ul class="story-steps">'+''.join('<li>'+escape(t)+'</li>' for t in common.splitlines())+'</ul>')
    else:
        common_html = paragraphs(common)
    if num in (2,4):
        parsed = BeautifulSoup(common_html, 'html.parser')
        table = parsed.find('table')
        rows = table.select('tbody tr')
        cards = '<div class="data-cards">' + ''.join('<article>' + (escape(row.select('td')[0].get_text()) + ' · ' + escape(row.select('td')[2].get_text()) + '<br>' + escape(row.select('td')[1].get_text()) if num == 2 else '<br>'.join(escape(td.get_text()) for td in row.select('td'))) + '</article>' for row in rows) + '</div>'
        table.replace_with(BeautifulSoup(cards,'html.parser'))
        common_html = str(parsed)
    if support and num in (5,10):
        side = side.replace('</div>', f'<p class="support">可用：{escape(support)}</p></div>')
    elif support:
        common_html += f'<p class="support">可用：{escape(support)}</p>'
    page = f'<div class="os-page" data-idx="{num+1}" data-activity="{num}" hidden><section class="activity {"story" if num in (5,10) else "wide-data" if num in (2,4) else ""}" data-osd-stable-id="activity-{num}"><header><div class="lesson-tag">第{11 if num<=6 else 12}课 · 实体课</div><div class="activity-label">活动{num}｜{escape(title)}</div><h1>{escape(title)}</h1><div class="rule"></div></header><div class="activity-body"><div class="material" data-osd-step>{common_html}</div>{side}</div><div class="done">完成：{escape(routes["完成"])}</div><footer><span>博雅汉语 · 初级口语活动</span><span>教材 {printed[num-1]} · {num+2:02d} / 14</span></footer></section></div>'
    pages.append(page)
    teacher += [f'## 活动{num}｜{title}', body.split('### 教师侧\n', 1)[1].strip(), '']
    if num in (5,10):
        teacher += ['### 漫画图意与边界', body.split('### 六格漫画内容脚本',1)[1].split('### 教师侧',1)[0], '']
    mapping.append({'page':num+2,'activity':num,'title':title,'lesson_key':f'boya-elementary-i:lesson-{11 if num<=6 else 12}','printed_pages':printed[num-1],'approved_source_copy':visible,'student_copy':routes,'source':'approved-v01'})

assert len(pages) == 14
css = ref.find_all('style')[0].get_text() + ref.find_all('style')[2].get_text()
css += '''
.activity{width:1920px;height:1080px;box-sizing:border-box;padding:74px 96px 68px;background:#fff;color:#102a43;font-family:'Times New Roman',KaiTi,serif;position:relative}
.lesson-tag{color:#087e8b;font-size:45px;font-weight:700;letter-spacing:1px}.activity-label{position:absolute;right:96px;top:25px;font-size:36px;color:#087e8b;font-weight:700}
.activity h1{margin:12px 0 0;font-size:74px;line-height:1.08;letter-spacing:-1px;font-weight:750}.rule{margin-top:28px;width:74px;height:7px;border-radius:4px;background:#087e8b}
.activity-body{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:28px;height:648px}.material{font-size:45px;line-height:1.28;min-width:0}.material p{margin:0 0 20px}.steps,.story-steps{padding-left:1.15em;margin:0 0 26px}.steps li{margin:10px 0}.level ul{padding-left:1.1em;margin:0;font-size:45px;line-height:1.28}.level li{margin:10px 0}
.levels{min-width:0}.level{border:1px solid #d9e3e8;border-radius:24px;padding:16px 20px;margin-bottom:18px;background:#f8fbfb}.level.challenge{background:#fffbf2;border-color:#e6d4aa}.level h2{margin:0 0 12px;color:#087e8b;font-size:40px;line-height:1.2}.level h2 span{font-family:'Times New Roman',serif;font-size:36px;color:#526579;margin-left:18px}.level.challenge h2{color:#8a4b08}.level p{font-size:45px;line-height:1.22;margin:0}.support{font-size:40px;line-height:1.3;color:#526579;margin:8px 0}
table{border-collapse:collapse;width:100%;font-size:45px;line-height:1.25;margin:12px 0 24px}td,th{padding:14px 15px;text-align:left;border-bottom:1px solid #d9e3e8}th{color:#087e8b;background:#f8fbfb;font-weight:650}.done{position:absolute;left:96px;right:96px;bottom:78px;border-left:7px solid #087e8b;padding:8px 18px;font-size:40px;line-height:1.25;color:#17324d;background:#f8fbfb}
footer{position:absolute;bottom:38px;left:96px;right:96px;display:flex;justify-content:space-between;color:#526579;font-size:30px;line-height:1}
.story h1{font-size:54px;line-height:1.1}.story .rule{margin-top:18px}.story .activity-body{grid-template-columns:1.18fr .82fr;height:648px;gap:30px}.story .material{font-size:40px;line-height:1.25}.story .material p{margin:10px 0 0}.story .level p,.story .level ul{font-size:40px;line-height:1.2}.story .level li{margin:4px 0}.story-steps{font-size:40px;line-height:1.2;margin:0 0 16px}.story-steps li{margin:5px 0}.story .level{padding:12px 18px}.story .support{font-size:38px;line-height:1.2;margin-top:6px}.comic{width:870px;max-width:100%;height:580px;margin:0 auto;position:relative;background:white}.comic img{width:100%;height:100%;object-fit:contain}.panel-label{position:absolute;font:32px/1.15 'Times New Roman',KaiTi,serif;background:white;color:#102a43;padding:3px 7px;border:1px solid #102a43}.story-data{color:#087e8b;font-size:38px}
.route article img{height:90px!important}.route article h2{line-height:1.3}.route{position:relative}.route:after{content:'基础：HSK 1–3　｜　挑战：HSK 4–6';position:absolute;bottom:45px;left:96px;color:#526579;font-size:30px;font-family:'Times New Roman',KaiTi,serif}
.wide-data .activity-body{display:block}.wide-data .material{font-size:45px;line-height:1.22}.data-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin:8px 0 16px}.data-cards article{font-size:45px;line-height:1.22;padding:14px 20px;border:1px solid #d9e3e8;border-radius:20px;background:#f8fbfb}.wide-data .material p{margin:0 0 8px}.wide-data .levels{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:4px}.wide-data .level{margin:0;padding:10px 20px}.wide-data .level li{margin:6px 0}.wide-data .material>p:first-child{font-size:38px}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
'''
script = ref.find_all('script')[-1].get_text()
plan = [{'stableId':'single-cover','sourceSlides':[],'motion':'cover-route','focus':[]},{'stableId':'single-route','sourceSlides':[],'motion':'stagger-rise','focus':[]}]+[{'stableId':f'activity-{i}','sourceSlides':[],'motion':'stagger-rise','focus':[]} for i in range(1,13)]
script, count = re.subn(r'var plan = .*?;\n  var keyframes', 'var plan = '+json.dumps(plan,ensure_ascii=False)+';\n  var keyframes',script,count=1,flags=re.S)
assert count == 1
controls = str(ref.select_one('.os-controlbar'))
counter = str(ref.select_one('.os-counter'))
document = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>第11–12课｜说天气，问清楚，讲故事</title><style>'+css+'</style></head><body><div class="os-stage"><div class="os-frame" id="os-frame" data-osd-canvas>'+''.join(pages)+'</div></div>'+controls+counter+'<script>'+script+'</script></body></html>'
result = OUT/'lesson-11-12-实体课.html'
result.write_text(document)
(OUT/'lesson-11-12-教师速用说明.md').write_text('\n\n'.join(teacher))
(OUT/'source/slide-content-map.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2)+'\n')
(OUT/'source/animation-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
(OUT/'source/build-manifest.json').write_text(json.dumps({'reference':str(REFERENCE.relative_to(ROOT)),'reference_sha256':hashlib.sha256(REFERENCE.read_bytes()).hexdigest(),'approved_copy_sha256':hashlib.sha256(COPY.read_bytes()).hexdigest(),'page_count':14,'activity_count':12,'output_sha256':hashlib.sha256(result.read_bytes()).hexdigest(),'cover':'copied original DOM and styles; text/image only replaced','route':'copied original DOM/styles; six paired activity cards; image height adjusted to fit actual text','activity_entry':'merged into complete activity page by current user instruction'},ensure_ascii=False,indent=2)+'\n')
for image in BeautifulSoup(document,'html.parser').find_all('img'):
    path=(OUT/image['src']).resolve()
    assert path.is_relative_to(OUT) and path.is_file(),path
print(result)
