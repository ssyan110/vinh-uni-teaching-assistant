#!/usr/bin/env python3
import csv, json, random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'lessons/boya-quasi-intermediate-i/lesson-01/00-source/source-extraction-draft.json'
OUT = ROOT / 'lessons/boya-quasi-intermediate-i/lesson-01/10-design/support-draft/blooket'
OUT.mkdir(parents=True, exist_ok=True)
header = ['Question #','Question Text','Answer 1','Answer 2','Answer 3 (Optional)','Answer 4 (Optional)','Time Limit (sec) ','Correct Answer(s)']
meaning = {'独生女':'con gái một','出生':'sinh ra','照顾':'chăm sóc','离开':'rời khỏi','广告':'quảng cáo','满意':'hài lòng','努力':'nỗ lực','压力':'áp lực','开夜车':'thức khuya làm việc','受欢迎':'được yêu thích','帮助':'giúp đỡ','放假':'nghỉ phép','越来越':'ngày càng','拍':'chụp','照片':'ảnh','适应':'thích nghi','要求':'yêu cầu','卫生':'vệ sinh','担心':'lo lắng','父母':'bố mẹ','空儿':'thời gian rảnh','设计':'thiết kế','毕业':'tốt nghiệp','公司':'công ty','老板':'ông chủ','生活':'cuộc sống','客户':'khách hàng','烧茄子':'cà tím sốt xì dầu','糖醋鱼':'cá chua ngọt'}
d = json.loads(SRC.read_text(encoding='utf-8'))
words = next(s['entries'] for s in d['sections'] if s['id']=='vocabulary')
rng = random.Random(20260908)
rows=[]; n=1
def add(q, correct, options):
    opts=list(dict.fromkeys([correct]+options)); rng.shuffle(opts); opts=opts[:4]
    while len(opts)<4: opts.append('')
    rows.append([n,q,*opts,20,opts.index(correct)+1])
for w in words:
    others=[x['word'] for x in words if x['word']!=w['word']]
    add(f'“{w["word"]}”是什么意思？', meaning[w['word']], [meaning[x] for x in rng.sample(others, min(3,len(others)))])
    add(f'“{w["word"]}”的拼音是什么？', w['pinyin'], [x['pinyin'] for x in rng.sample([x for x in words if x['word']!=w['word']],3)])
    add(f'拼音“{w["pinyin"]}”对应哪个词语？', w['word'], rng.sample(others,3))
    n += 3
path=OUT/'lesson-01-准中级加速篇-丽丽是独生女-blooket.csv'
with path.open('w',encoding='utf-8-sig',newline='') as f: csv.writer(f).writerows([header]+rows)
print(path, len(rows))
