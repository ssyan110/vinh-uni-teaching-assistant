from pathlib import Path
import json,re,hashlib,shutil
import fitz
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parent; BASE=R.parent
SEL={4:[13,14,23,26,28],5:[13,25,29,31,33,37]}
(R/'images').mkdir(exist_ok=True)
keys={}; crops=[]
for v,qs in SEL.items():
 d=fitz.open(R/'source'/f'A{v}-en_s.pdf')
 kt='\n'.join(p.get_text() for p in fitz.open(R/'source'/f'A{v}-answer.pdf'))
 keys[v]={int(n):a for n,a in re.findall(r'(?m)^\s*(\d+)\s*\n\s*([ABCD])\s*$',kt)}
 for q in qs:
  found=[]
  for pn,p in enumerate(d):
   for w in p.get_text('words'):
    if w[4]==f'{q}.':found.append((pn,p,w))
  assert len(found)==1,(v,q,found)
  pn,p,w=found[0]; y0=w[1]-4
  nextys=[w2[1]-4 for w2 in p.get_text('words') if re.fullmatch(r'\d+\.',w2[4]) and w2[1]>w[1]+20]
  y1=min(nextys) if nextys else min(750,y0+140)
  imgs=[z['bbox'] for z in p.get_image_info() if w[1]+5<z['bbox'][1]<w[1]+65]
  assert len(imgs)==3,(v,q,imgs)
  labs=[z for z in p.get_text('words') if z[4]=='(A)' and w[1]<z[1]<w[1]+65]
  assert len(labs)==1,(v,q,labs)
  clip=fitz.Rect(94 if v==4 else 72,min(labs[0][1],min(z[1] for z in imgs))-3,550,max(z[3] for z in imgs)+3)
  path=R/'images'/f'TOCFL-A{v}-Q{q}-options.png'
  p.get_pixmap(matrix=fitz.Matrix(2,2),clip=clip).save(path)
  crops.append(dict(v=v,q=q,path=path,page=pn+1,clip=list(clip),key=keys[v][q]))
W=1000; H=len(crops)*300
im=Image.new('RGB',(W,H),'white'); draw=ImageDraw.Draw(im)
for i,c in enumerate(crops):
 draw.text((10,i*300+4),f'A{c["v"]} Q{c["q"]}, key {c["key"]}',fill='black')
 a=Image.open(c['path']);a.thumbnail((950,270));im.paste(a,(20,i*300+25))
im.save(R/'source'/'options-contact.png')
(R/'source'/'image-crops.json').write_text(json.dumps([{**c,'path':str(c['path'].relative_to(R))} for c in crops],ensure_ascii=False,indent=2))
print('crops',len(crops),'keys',keys)
META=[
(4,13,'礼物的赠送人','男：你怎么有这本书？\n女：我爸爸送我的。','C图是爸爸送书，A图是买书，B图是妈妈送书。','boya-elementary-i:lesson-14'),
(4,14,'衣服颜色与换货','男：丽美，你怎么来了？\n女：昨天买的衣服想换不同的颜色。','C图是服装店；A图水果店、B图运动用品店不符。','boya-elementary-i:lesson-13'),
(4,23,'商品价格与选择','男：这家店为什么这么多人在排队？\n女：因为这里的衣服很便宜，很多人来这里买衣服。','B图招牌为服装；A图是鞋帽等配件，C图是蔬果。','boya-elementary-i:lesson-13'),
(4,26,'按喜好选择礼物','男：怎么最近都没看到陈老师呢？\n女：听说陈老师生病了，现在在医院里。\n男：我们应该去医院看看他，我们带水果和花去看他，好不好？\n女：陈老师很喜欢看书，我想买几本有趣的书给他。\n男：请问这位小姐想带什么东西给陈老师？','A图是书。水果和花是男生的提议，女生提议买书。','boya-elementary-i:lesson-14'),
(4,28,'衣服大小','男：老板，我可以穿穿看这件衣服吗？\n女：可以，请到里面试试。\n男：这件衣服太小了，还有大一点儿的吗？\n女：对不起，大的已经卖完了。\n男：请问这位先生觉得这件衣服怎么样？','B图衣服太小；A图太大，C图衣服破损。','boya-elementary-i:lesson-13'),
(5,13,'蛋糕与所需物品','男：这是您的巧克力蛋糕，请问还需要什么吗？\n女：请再给我一个汤匙，我们要一起吃。','C图为蛋糕和汤匙；A图说的是叉子，B图是冰淇淋。','boya-elementary-i:lesson-14'),
(5,25,'衣物状态','男：美美，我的那件短袖衬衫呢？\n女：我刚洗好，现在还没干喔！','A图衣服还在滴水；B图熨衣服，C图正在洗衣服。','boya-elementary-i:lesson-13'),
(5,29,'活动约定时间','男：我们等一下三点在书店门口前见面吗？\n女：我觉得有一点晚，我们可以早半个小时吗？\n男：好啊，那一样在书店门口前见吗？\n女：对，书店门口见！\n男：请问他们几点见面？','A图两点半。三点早半小时是两点半，B图三点，C图三点半。','boya-elementary-i:lesson-14'),
(5,31,'按口味选择','男：来这家店的人真多。\n女：是啊！这家冰淇淋店有很多种味道的冰淇淋。\n男：我想吃巧克力和牛奶口味的，我们进去吃吧！\n女：好，我请客。\n男：请问他们等一下要做什么？','C图两人在冰淇淋店吃冰淇淋；A图是咖啡店，B图是喝饮料。','boya-elementary-i:lesson-14'),
(5,33,'饮品选择','男：要不要喝点儿啤酒？\n女：不行，我等一下要开车。\n男：那，喝点儿汽水吧？\n女：我还是喝茶好了。\n男：请问这位小姐决定喝什么？','C图是茶。A图是啤酒，B图是汽水；最后决定喝茶。','boya-elementary-i:lesson-14'),
(5,37,'生日礼物与喜好','男：小春的生日快到了，我们一起送他礼物，怎么样？\n女：好啊！他喜欢画画，我们可以送他画画用的笔。\n男：嗯，还可以送他放笔的袋子。\n女：好啊，今天下课以后我们一起去买礼物吧。\n男：请问他们决定送什么？','A图是画笔及放笔的袋子；B图只有画笔，C图是颜料。','boya-elementary-i:lesson-14')]
bank=json.loads((BASE/'items.json').read_text()); items=bank['items'][:14]
for x in items:
 x['version']=4;x['id']=x['question_id']=f'W06-MX4-{x["number"]:02}';x['review_status']='draft_unpublished';x['teacher_listening_accepted']=False
for num,(v,q,focus,script,evidence,lesson) in enumerate(META,15):
 prompt='请听对话，选择最合适的图片。' if q< (26 if v==4 else 29) else script.split('\n')[-1][2:]
 crop=next(c for c in crops if c['v']==v and c['q']==q); aid=f'TOCFL-A{v}-Q{q}'
 items.append(dict(id=f'W06-MX4-{num:02}',question_id=f'W06-MX4-{num:02}',number=num,version=4,type='mc',points=4,prompt=prompt,options=['A','B','C'],answer_index=ord(keys[v][q])-65,answer=keys[v][q],answer_text=keys[v][q],evidence=evidence,focus=focus,lesson_keys=[lesson],audio_id=aid,source_type='tocfl_official_original_item_with_picture_options',source_question_id=aid,source_volume=v,source_question=q,source_url=f'https://tocfl.edu.tw/tocfl/assets/files/mock/ls_mock{v}_test_BandA_en_s.pdf',source_script_url=f'https://tocfl.edu.tw/tocfl/assets/files/mock/ls_mock{v}_test_BandA_listen.pdf',source_answer_url=f'https://tocfl.edu.tw/tocfl/assets/files/mock/ls_mock{v}_test_BandA_answer.pdf',option_image=str(crop['path'].relative_to(R)),source_pdf_page=crop['page'],source_option_order_preserved=True,script=script,review_status='draft_unpublished'))
bank.update(version=4,status='DRAFT_CONTENT_PREPARED_PENDING_SYNC_AND_TEACHER_REVIEW',variant_id='W06-L13L14-25Q-20261022',configuration_basis='2026-10-22 current user request:25 questions,4 points each,textbook plus actual official TOCFL/HSK questions,unpublished',textbook_question_count=14,tocfl_question_count=11,textbook_audio_count=5,tocfl_audio_count=11,question_group_count=16,items=items,publication_authorized=False)
(R/'items.json').write_text(json.dumps(bank,ensure_ascii=False,indent=2)+'\n')
print('bank ready',len(items))
