from pathlib import Path
from bs4 import BeautifulSoup, Tag
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets'
ICONS=ASSETS/'icons'
HTML=ROOT/'lesson-11-12-实体课.html'

# Crop the existing generated weather sprite into individual page assets.
source=Image.open(ASSETS/'weather-icons-v07.png').convert('RGBA')
w,h=source.size
weather_names=['partly-rain','rain','sun-rain','sunny']
for idx,name in enumerate(weather_names):
    x0=round((idx%2)*w/2); x1=round((idx%2+1)*w/2)
    y0=round((idx//2)*h/2); y1=round((idx//2+1)*h/2)
    tile=source.crop((x0,y0,x1,y1))
    px=tile.load()
    for y in range(tile.height):
        for x in range(tile.width):
            r,g,b,a=px[x,y]
            if r>247 and g>247 and b>247: px[x,y]=(255,255,255,0)
    box=tile.getchannel('A').getbbox()
    art=tile.crop(box)
    side=max(art.size); pad=max(12,round(side*.06))
    canvas=Image.new('RGBA',(side+2*pad,side+2*pad),(255,255,255,0))
    canvas.alpha_composite(art,((canvas.width-art.width)//2,(canvas.height-art.height)//2))
    canvas.resize((512,512),Image.Resampling.LANCZOS).save(ICONS/f'{name}.png')

soup=BeautifulSoup(HTML.read_text(), 'html.parser')
pages=soup.select('.os-page')
assert len(pages)==21, f'Expected 21 pages, got {len(pages)}'
style=soup.new_tag('style')
style.string='''
/* v08 image-led prompts: maintain readable Chinese while scanning repeated fields visually. */
.icon-inline{width:54px;height:54px;object-fit:contain;vertical-align:middle;display:inline-block;margin-right:8px}
.steps{list-style:none!important;padding-left:0!important}
.steps li{display:flex;align-items:flex-start;gap:18px;margin-bottom:12px!important}
.step-icon{width:62px;height:62px;object-fit:contain;flex:0 0 62px;margin-top:3px}
.icon-heading{display:inline-flex;align-items:center;justify-content:center;gap:12px}
.icon-heading img{width:46px;height:46px;object-fit:contain;vertical-align:middle}
.week-weather td.weather-cell{padding:2px!important}
.week-weather .weather-icon{display:block;width:82px;height:72px;object-fit:contain;margin:0 auto}
.icon-prompt-strip{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:18px;margin:20px 0 24px;padding:15px 20px;background:#f8fbfb;border-radius:18px}
.icon-prompt{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#087e8b;font-size:30px;line-height:1.1;text-align:center}
.icon-prompt img{width:72px;height:72px;object-fit:contain}
.discussion-flow{display:flex!important;align-items:center;gap:28px;padding:14px 22px!important;background:#f8fbfb;border-radius:18px;color:#087e8b}
.discussion .levels{margin-top:20px!important}
.flow-icon{width:48px;height:48px;object-fit:contain;vertical-align:middle;margin:0 8px}
.route-card img.route-generated-icon{width:112px;height:112px;object-fit:contain;display:block;margin:0 auto 10px}
@media(prefers-reduced-motion:reduce){.step-icon,.icon-prompt img,.icon-inline{animation:none!important}}
'''
existing_style=soup.select_one('style.icon-reduction-v08')
if existing_style:
    existing_style.string=style.string
else:
    style['class']='icon-reduction-v08'
    soup.head.append(style)

def icon(src, cls='icon-inline', alt=''):
    im=soup.new_tag('img',src=f'assets/icons/{src}.png',alt=alt)
    im['class']=cls
    if not alt: im['aria-hidden']='true'
    return im

def set_list(page_no, texts, names):
    lis=pages[page_no-1].select('main ol li')
    assert len(lis)==len(texts),(page_no,len(lis),len(texts))
    for n,(li,text,name) in enumerate(zip(lis,texts,names),1):
        li.clear()
        li.append(icon(name,'step-icon'))
        span=soup.new_tag('span'); span.string=text; li.append(span)

def add_header_icons(page_no, mapping):
    for th in pages[page_no-1].select('main table thead th'):
        if th.select_one('.icon-heading'): continue
        text=th.get_text(' ',strip=True)
        name=mapping.get(text)
        if not name: continue
        label=th.get_text(' ',strip=True)
        th.clear()
        wrap=soup.new_tag('span',attrs={'class':'icon-heading'})
        wrap.append(icon(name,'icon-inline'))
        txt=soup.new_tag('span'); txt.string=label; wrap.append(txt); th.append(wrap)

def add_strip(page_no, items):
    page=pages[page_no-1]
    for old in page.select('.icon-prompt-strip'): old.decompose()
    main=page.select_one('main')
    strip=soup.new_tag('div',attrs={'class':'icon-prompt-strip','aria-label':'任务提示图标'})
    for name,label in items:
        card=soup.new_tag('div',attrs={'class':'icon-prompt'})
        card.append(icon(name,'',alt=label))
        caption=soup.new_tag('span'); caption.string=label; card.append(caption)
        strip.append(card)
    anchor=main.select_one('.question') or main.select_one('.steps') or main.select_one('p')
    if anchor: anchor.insert_after(strip)
    else: main.insert(0,strip)

def prepend_title_icon(page_no, name):
    h1=pages[page_no-1].select_one('h1')
    if h1 and not h1.select_one('img.icon-inline'): h1.insert(0,icon(name,'icon-inline'))

# Shorten duplicate tier wording; the task/result remains unchanged.
for page_no, base, challenge in [
    (3,'选一个时间，说天气和理由。','比较两个时间，选一个并说明理由。'),
    (5,'选一天，说天气、地点和理由。','比较两天的优缺点，选一天说明理由；天气变了就调整安排。'),
    (8,'说新天气、温度和新安排。','比较原安排和新安排，并说明原因。'),
    (10,'查一城三天，选一天安排出行。','查两城七天，比较后选城市和日期，说明理由；下雨时调整安排。'),
    (12,'说三个人现在做什么、接下来做什么。','判断他们是不是学生，并用消息中的一句话说明理由。'),
    (16,'介绍小安的一天，说至少四个时间和活动。','介绍完整的一天，用“从……到……”，再比较你们的一天。'),
    (18,'说星期三、星期五的新时间和教室。','比较原来和现在的安排。')]:
    levels=pages[page_no-1].select('.level p')
    if len(levels)==2:
        levels[0].string=base; levels[1].string=challenge

# Page 3 — listening task; the table labels carry the time/weather/temperature fields.
set_list(3,[
    '听老师读天气，记下三个时段的天气和温度。',
    '和同学核对；不同的地方，再听一次。',
    '选时间去胡志明广场：几点？天气怎样？为什么？'
],['listen','notes','calendar'])
# Page 4 — neutral time cues only; leave all weather-answer cells blank.
add_header_icons(4,{'时段':'day-night','天气':'rain','温度':'sunny'})
for row,name in zip(pages[3].select('tbody tr'),['sunny','sunny','day-night']):
    td=row.select_one('td')
    if not td.select_one('img.icon-inline'): td.insert(0,icon(name,'icon-inline'))
# Page 5 — concise action chain.
set_list(5,[
    '两三人看下一页的天气表。',
    '每人选一天：去哪儿、做什么、为什么？',
    '一起选一天，说出最后安排。'
],['conversation','calendar','location'])
# Page 6 — pictograms replace repeated weather words; all exact dates and forecast facts stay.
weather_map={'阴转雨':'partly-rain','雨':'rain','晴转雨':'sun-rain','晴':'sunny'}
for row in pages[5].select('.week-weather tbody tr'):
    cells=row.find_all('td')
    existing=cells[1].select_one('img.weather-icon')
    label=cells[1].get_text(' ',strip=True) or (existing.get('alt','') if existing else '')
    if label not in weather_map: continue
    cells[1].clear(); cells[1]['class']=['weather-cell']
    cells[1].append(icon(weather_map[label],'weather-icon',alt=label))
add_header_icons(6,{'日期':'calendar','天气':'rain','气温':'sunny'})
# Page 8 — instructions become a short, icon-led sequence.
set_list(8,[
    '看原计划，听老师读新的天气。',
    '在空表记早上、下午的天气和温度。',
    '说新的安排和原因。'
],['calendar','listen','conversation'])
# Page 9 — labels are easier to scan; answer spaces remain blank.
add_header_icons(9,{'时段':'day-night','天气':'rain','温度':'sunny'})
# Page 10 — compress steps and show the data to collect as icon prompts.
set_list(10,[
    '选一个越南城市，查天气。',
    '向同学介绍：哪天去、做什么、带什么、为什么。',
    '听一个问题，回答。'
],['location','conversation','listen'])
add_strip(10,[('location','城市'),('calendar','日期'),('rain','天气'),('sunny','温度')])
# Page 11 — each speaking/listening turn gets a visual cue.
set_list(11,[
    '听老师读，记下来。',
    'A说平时做什么，B听。',
    'B说现在做什么、为什么，A听。',
    'A、B说晚上八点常做什么、为什么。',
    '介绍同学晚上八点常做什么、为什么。'
],['listen','conversation','listen','clock','conversation'])
# Page 12 — keep teacher-message names and evidence question, trim repeated wording.
set_list(12,[
    '看空表，听三个人的消息，记地点、动作和时间。',
    '和同学核对；不同处，再听一次。',
    '说三个人的情况。'
],['listen','notes','conversation'])
# Page 13 — neutral icon headers; no answers are prefilled.
add_header_icons(13,{'人物':'conversation','地点':'location','现在做什么':'conversation','下一步／时间':'clock'})
# Page 14 — phone role-play gets visual context; spoken prompts remain visible.
set_list(14,[
    'A（小王）打给B（小林）：问他在哪儿、做什么、几点到。B回答。',
    'B问几点上课；小林会迟到，两人商量怎么办。'
],['phone','clock'])
prepend_title_icon(14,'phone')
add_header_icons(14,{'人物':'conversation','在哪里':'location','正在做什么':'day-night','到教室的时间':'clock'})
# Page 16 — listen, note and retell in three short steps.
set_list(16,[
    '听老师读小安的一天，记时间和关键词。',
    '再听一次，补完整。',
    '看记录，介绍小安的一天。'
],['listen','notes','conversation'])
# Page 17 — table cue icons only; the listener fills all cells.
add_header_icons(17,{'时间':'clock','做什么／在哪里':'location'})
# Page 18 — focus task on the two changed days; original five-day schedule remains complete.
set_list(18,[
    '听老师读新课表，找星期三、星期五的变化。',
    '说原来是什么、现在是什么。'
],['listen','calendar'])
add_header_icons(18,{'日期':'calendar','上课时间':'clock','教室':'school'})
# Pages 19–21 — use illustrated cue strips in place of repeated question lists.
p19=pages[18].select_one('.question'); p19.string='选一件常用的东西。'
add_strip(19,[('book-pencil','东西'),('conversation','谁的'),('location','放哪里'),('clock','什么时候'),('notes','为什么')])
flow=pages[18].select_one('.discussion-flow'); flow.clear()
for i,(name,label) in enumerate([('notes','想一想'),('conversation','轮流说'),('listen','问答')]):
    if i: flow.append(soup.new_string(' → '))
    flow.append(icon(name,'flow-icon'))
    span=soup.new_tag('span'); span.string=label; flow.append(span)
# Reduce the base prompt because the cue strip now lists all required details.
pages[18].select_one('.level.base p').string='介绍这件东西，并说一个原因。'

p20=pages[19].select_one('.question'); p20.string='周末和朋友出门，你会怎么安排？为什么？'
add_strip(20,[('calendar','时间'),('location','地点'),('bus','交通'),('shopping-bag','东西和数量'),('wallet','价钱')])
flow=pages[19].select_one('.discussion-flow'); flow.clear()
for i,(name,label) in enumerate([('notes','想一想'),('conversation','轮流说'),('listen','问答')]):
    if i: flow.append(soup.new_string(' → '))
    flow.append(icon(name,'flow-icon'))
    span=soup.new_tag('span'); span.string=label; flow.append(span)
pages[19].select_one('.level.base p').string='选一个安排，说时间、地点、交通、买什么和预算。'

p21=pages[20].select_one('.question'); p21.string='周末去学校旁边买水果。朋友说：“这么近，我们走路去吧。”你同意吗？下雨或买很多东西时，会改吗？'
add_strip(21,[('park','附近'),('fruit','水果'),('walk','走路'),('rain','下雨'),('bus','坐车')])
flow=pages[20].select_one('.discussion-flow'); flow.clear()
for i,(name,label) in enumerate([('notes','想一想'),('conversation','轮流说'),('listen','问答')]):
    if i: flow.append(soup.new_string(' → '))
    flow.append(icon(name,'flow-icon'))
    span=soup.new_tag('span'); span.string=label; flow.append(span)

HTML.write_text(str(soup),encoding='utf-8')
print('updated',HTML,'pages',len(pages))
