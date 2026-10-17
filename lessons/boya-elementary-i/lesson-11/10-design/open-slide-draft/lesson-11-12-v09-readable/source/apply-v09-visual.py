from pathlib import Path
import re, shutil

ROOT = Path(__file__).resolve().parents[1]
html = ROOT / 'lesson-11-12-实体课.html'
s = html.read_text()
# Replace the six hand-drawn route symbols with one coherent family of generated textbook icons.
route_start = s.index('<section class="route"')
route_end = s.index('</section>', route_start) + len('</section>')
route = s[route_start:route_end]
icons = ['partly-rain-v09.png', 'book-pencil.png', 'location.png', 'phone.png', 'book-pencil.png', 'calendar.png', 'conversation.png']
idx = 0
route, n = re.subn(r'<svg\b.*?</svg>', lambda m: f'<img class="route-icon" src="assets/icons/{icons.pop(0)}" alt="" aria-hidden="true">', route, flags=re.S)
assert n == 7 and not icons, (n, icons)
s = s[:route_start] + route + s[route_end:]
# Comics are deliberately image-led: preserve the title and metadata, show only the complete centered six-panel image.
for idx, asset in [(6, 'story-lesson-11.png'), (14, 'story-lesson-12.png')]:
    marker = f'data-idx="{idx}"'
    pos = s.index(marker)
    start_page = s.rfind('<div class="os-page"', 0, pos)
    next_page = s.find('<div class="os-page"', pos)
    if next_page < 0: next_page = len(s)
    start = s.index('<main>', start_page, next_page)
    end = s.index('</main>', start, next_page) + len('</main>')
    main = f'<main><div class="comic-layout"><div class="comic" data-osd-step="true"><img alt="六格漫画" src="assets/{asset}"></div></div></main>'
    s = s[:start] + main + s[end:]
# vary wind-force data in the existing weather table while preserving all other textbook values.
# Table row order is Friday through Thursday; wind-force is the last cell in each row.
weather_start = s.index('class="week-weather"')
table_start = s.rfind('<table', 0, weather_start)
table_end = s.index('</table>', weather_start) + len('</table>')
table = s[table_start:table_end]
rows = re.findall(r'<tr\b.*?</tr>', table, flags=re.S)
assert len(rows) == 8, len(rows) # header + seven days
wind = ['微风', '大风', '微风', '大风', '微风', '大风', '微风']
for i in range(1, 8):
    row = rows[i]
    # Replace visible wind-force text only, not the direction field.
    row2, count = re.subn(r'(<td[^>]*>)(?:\s*<[^>]+>)*微风(?:</[^>]+>\s*)*(</td>)', rf'\1{wind[i-1]}\2', row, count=1)
    if count != 1:
        # Plain cell without nested markup.
        row2, count = re.subn(r'<td([^>]*)>\s*微风\s*</td>', rf'<td\1>{wind[i-1]}</td>', row, count=1)
    assert count == 1, (i, row[-300:])
    table = table.replace(row, row2, 1)
s = s[:table_start] + table + s[table_end:]
# Add projection-readable sizes. Main titles and corner metadata retain existing sizes.
style = r'''<style class="v09-readable-unified-icons">
/* Projector scale: preserve H1 titles, upper-right activity labels and lower-left footer notes. */
.activity .lesson-tag{font-size:54px!important}
.activity main,.activity .steps,.activity .single .steps{font-size:54px!important;line-height:1.25!important}
.activity main p,.activity .level p,.activity .single .level p{font-size:54px!important;line-height:1.24!important}
.activity .level h2,.activity .single .level h2{font-size:47px!important;line-height:1.18!important}
.activity .level h2 span{font-size:40px!important}
.activity .support,.activity .context,.activity .discussion-flow{font-size:48px!important;line-height:1.25!important}
.activity table{font-size:50px!important;line-height:1.15!important}
.activity td,.activity th{padding:14px 18px!important}
.activity .week-weather{font-size:46px!important;line-height:1.12!important}
.activity .week-weather th{font-size:44px!important;padding:15px 10px!important}
.activity .week-weather td{height:90px!important;padding:5px 8px!important}
.activity .week-weather td:nth-child(3){font-size:43px!important}
.activity .week-weather td:nth-child(4){font-size:42px!important}
.activity .week-weather .wx{justify-content:center;gap:10px}
.activity .week-weather .weather-icon{width:76px;height:68px}
.activity .icon-prompt{font-size:40px!important;line-height:1.16!important}
.activity .route-card{height:340px!important;padding:16px!important}
.activity .route-card .route-icon{height:168px;width:200px;display:block;margin:0 auto;object-fit:contain}
.activity .route-card h2{font-size:47px!important;line-height:1.17!important;margin:10px 0 7px!important}
.activity .route-range{font-size:38px!important;line-height:1.15!important;margin:0}
.activity .comic-page main{padding:0!important;margin:0!important;height:760px!important;display:flex!important;align-items:center!important;justify-content:center!important}
.activity .comic-layout{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:760px!important;margin:0 auto!important}
.activity .comic{position:relative!important;width:auto!important;height:760px!important;aspect-ratio:3/2!important;flex:none!important}
.activity .comic img{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important}
</style>'''
s = s.replace('</head>', style + '</head>', 1)
html.write_text(s)

# Record the one intentional data change for teachers; leave all unrelated teacher materials intact.
guide = ROOT / 'lesson-11-12-教师速用说明.md'
g = guide.read_text()
g = g.replace('原始截图只作为数据来源，不直接投影，周五4日至周四10日，七行及天气图、温度、风向、微风完整保留。没有月份或城市，不编造。', '原始截图只作为数据来源，不直接投影；周五4日至周四10日共七行。天气、温度和风向照原表，风力为课堂练习增加变化：周五、周日、周二、周四微风；周六、周一、周三大风。没有月份或城市，不编造。')
assert '风力为课堂练习增加变化' in g
guide.write_text(g)

# Keep provenance clear for the generated icon set.
notes = ROOT / 'source/icon-generation-notes.md'
with notes.open('a') as f:
    f.write('\n\n## v09统一图标\n\n路线页的七个图标统一改用本包 `assets/icons/` 中同一套新生成的海军蓝、青绿与暖黄教材风图标；天气表使用同一组新生成天气图标。保留中文栏目名，图标只帮助快速识别。\n')
print('Updated', html)
