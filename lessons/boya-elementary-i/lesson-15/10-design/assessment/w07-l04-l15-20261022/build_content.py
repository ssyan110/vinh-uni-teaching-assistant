from pathlib import Path
import json,re,fitz,hashlib,csv
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parent;P=Path('/Users/ssyan110/Development/vinh-uni-teaching-assistant');sel=json.loads((R/'selection.json').read_text());(R/'images').mkdir(exist_ok=True)
# Manual semantic review against official scripts; these are teacher summaries, not new questions.
M={
4:{
1:('请问这里是哪里？',[7],'辨认地点','图中为学校；原音三个地点名称中选择学校。'),
6:('请问王先生的职业是什么？',[4,5],'身份与职业','图中身份为记者，对应原音职业选项C。'),
7:('请问这里的天气怎么样？',[11],'天气与程度','图中天气较热，原音选项C表达有一点热。'),
8:('桌子上有什么？',[6],'物品与有／没有','图中桌上有灯和卡片，对应B。'),
9:('图片里的人准备做什么？',[9,12],'交通与准备动作','人物正准备乘车，对应A。'),
10:('请问王小姐正在做什么？',[12],'正在进行的动作','图中人物正在收传真，对应A。'),
11:('听对话，选择与内容相符的图片。',[10],'结账与总价','女方已吃饱，请对方计算总价；C为结账情境。'),
15:('听对话，选择与内容相符的图片。',[14],'回应选择与饮品','女方没有选茶或咖啡，而是选啤酒，图片B。'),
16:('听对话，选择与内容相符的图片。',[7,9],'位置与交通路线','路线先直走，在第二个路口左转，图片A。'),
17:('听对话，选择与内容相符的图片。',[6,10],'遗失物品与购买情境','女方向警察说明钱包最后见于购物时，图片C。'),
19:('听对话，选择与内容相符的图片。',[6,7],'物品的位置','字典被拿到卧室，图片A。'),
20:('听对话，选择与内容相符的图片。',[7,10,15],'请求住宿与回应条件','不能用做家事换住宿；须付每天三百元房租，图片C。'),
21:('听对话，选择与内容相符的图片。',[6,9],'联系与物品故障','没有接电话的原因是手机损坏，图片B。'),
22:('听对话，选择与内容相符的图片。',[15],'理解困难与求助回应','女方仍然不明白要做什么，图片A。'),
25:('听对话，选择与内容相符的图片。',[6],'物品与并列信息','洗衣机和冰箱都坏了，图片C。'),
30:('请问哪一张是女生家人的照片？',[4,5],'人物介绍与身份辨认','女生家庭有父母、两个妹妹及自己，没有兄弟，图片C。'),
33:('请问老师要月华做什么？',[12,15],'教师指令与回应','老师让月华到黑板回答问题，图片B。'),
34:('请问这位小姐要这位先生找什么？',[6,9,15],'交通物品与请求帮助','要寻找即将登机所需的机票，图片B。'),
36:('请问这位小姐来这里以后，学会了什么？',[7,9],'居住环境与交通','住处交通不便，因此学会开车，图片C。'),
38:('请问这位小姐暑假的时候想做什么？',[8,9],'假期计划与交通','女方计划搭飞机去英国看朋友，图片A。'),
40:('请问这位小姐想租哪一间房子？',[7,10,13],'房屋特点与价格比较','选择先前看过、楼梯在室外且便宜两千元的房子，图片C。'),
41:('请问下面哪一个是对的？',[7,9,15],'方向与行动指令','男方让大家朝楼梯方向走，不要搭电梯；C。'),
42:('请问他们的妈妈为什么和邻居聊天？',[5,10],'关系与费用信息','妈妈想先了解女儿将来读大学的费用；B。'),
45:('请问这位先生说了什么？',[5,8,9],'认识他人与交流','男方说他与第一次见面的明美聊得愉快；A。'),
46:('请问下面哪一个是对的？',[8,12],'约会时间与态度','女方迟到且反复使用同样理由，男方不高兴；B。')},
5:{
1:('图片里有几个学生？',[4,5],'人物与数量','图中三个学生，对应原音选项A。'),
2:('这个人在做什么运动？',[12],'正在进行的动作','图中为打网球，对应B。'),
3:('请问小美喜欢做什么？',[12],'喜好与日常活动','图中小美喜欢做菜，对应B。'),
5:('小明给美美什么？',[6,14],'赠送物品','图中送的是水果，对应A。'),
6:('这位先生现在在做什么？',[7,12],'地点与当前动作','人物在办公室工作，对应B。'),
7:('小女孩在做什么？',[9,12],'联系与当前动作','图中女孩正在寄信，对应A。'),
8:('图片里有什么？',[6],'物品与数量组合','图中一本字典和两支毛笔，对应B。'),
9:('他们在做什么？',[12],'同时进行的动作','图中一边看电视一边吃东西，对应A。'),
12:('听对话，选择与内容相符的图片。',[7,8],'邀请与答应','女方邀请去博物馆，男方答应；图片A。'),
14:('听对话，选择与内容相符的图片。',[6,9],'联系与手机故障','没有接电话是因为手机损坏；图片B。'),
15:('听对话，选择与内容相符的图片。',[4,5,13],'辨认人物特征','妹妹为短发、戴眼镜的人；图片C。'),
16:('听对话，选择与内容相符的图片。',[10,13],'服装价格','店内衣服便宜，因此很多人排队购买；图片B。'),
18:('听对话，选择与内容相符的图片。',[6,7],'物品位置','小说留在浴室；图片A。'),
19:('听对话，选择与内容相符的图片。',[6,7,14],'礼物与位置','所送的画挂在冰箱后面的墙上；图片A。'),
20:('听对话，选择与内容相符的图片。',[8,14],'活动计划与信息修正','这次表演为吉他，不是以前的钢琴；图片B。'),
24:('听对话，选择与内容相符的图片。',[7,13],'住所与特点','楼下房间有大窗户，图片C。'),
27:('听对话，选择与内容相符的图片。',[7,9],'认识地方的方法','亲自旅行优于只从书或电视了解，图片A。'),
28:('听对话，选择与内容相符的图片。',[7,13],'居住环境与不足','楼上小孩往下丢垃圾，环境很脏，图片C。'),
30:('请问介绍日本风景的书放在哪里？',[6,7],'物品分类与位置','日本旅游书在中间的2号位置，图片B。'),
32:('请问他们说的是哪一张照片？',[4,5],'人物关系与介绍','照片为船上拍摄，含父母及戴帽子的爷爷，图片C。'),
34:('请问这位小姐明天打算做什么？',[8,12],'日程与计划','女方说明天整理房间，图片A。'),
38:('请问这位先生从哪里知道可怕的消息？',[6,9],'信息来源','男方刚在电视新闻看到消息，图片B。'),
46:('请问这位先生说了什么？',[8,11,13],'天气与服装活动选择','男方约女方明天去海边打球，因此建议短裤；D。'),
47:('请问这位小姐的意思是什么？',[8,14],'生日邀请与礼物意图','女方最看重朋友来参加舞会，不要求蛋糕或礼物；C。'),
50:('这位小姐的意思是什么？',[10,13,15],'请求换货与条件','店员表示必须出示发票才能换货；D。')}
}
OPT={
(4,41):['这位先生找不到安全门','这位小姐想搭电梯下楼','这位先生要大家往楼梯那儿走','这位小姐要这位先生快一点离开'],
(4,42):['想参加大学考试','想了解大学的学费','想知道付学费的方法','想问问读大学的方法'],
(4,45):['他喜欢和明美聊天儿','他有明美的电话号码','他和明美从小就认识','他和明美一起去舞会'],
(4,46):['这位先生每次都迟到','这位先生现在不太高兴','这位先生着急地找这位小姐','这位先生担心这位小姐的安全'],
(5,46):['他刚从海边回来','他喜欢夏天去海边玩','他给这位小姐买了裤子','他约了这位小姐明天去运动'],
(5,47):['她不想请这位先生吃蛋糕','她想帮这位先生庆祝生日','她要朋友来参加舞会就好','她想要大家一起唱生日歌'],
(5,50):['她要把钱还给客人','东西卖出去就不能换了','她没有东西可以换给客人','没有发票，就不能换东西']}
raise SystemExit('Historical initial builder; current items.json includes synchronized IDs/URLs and supersedes this initial selection. Use finalize_content.py for derivatives only.')
items=[];crops=[]
for v,qs in sel.items():
 vi=int(v);d=fitz.open(R/f'source/A{v}-en_s.pdf');locations={}
 keys=re.findall(r'(?m)^[ \t]*([ABCD])[ \t]*$',(R/f'source/A{v}-answer.txt').read_text());assert len(keys)==50,(v,len(keys))
 scripts=fitz.open(R/f'source/A{v}-listen.pdf')
 script_pages={q:[] for q in qs}
 for pi,pg in enumerate(scripts):
  for q in qs:
   if re.search(rf'(?m)^\s*{q}\.\s*$',pg.get_text()):script_pages[q].append(pi+1)
 for pi,page in enumerate(d):
  nums=[w for w in page.get_text('words') if re.fullmatch(r'\d+\.',w[4])]
  rects=[rr for im in page.get_images() for rr in page.get_image_rects(im[0])]
  for j,w in enumerate(nums):
   q=int(w[4][:-1]);nqty=nums[j+1][1] if j+1<len(nums) else 800
   if q not in qs:continue
   relevant=[rr for rr in rects if w[1]-3<=rr.y0<nqty-3]
   if q<=40:
    assert relevant,(v,q)
    clip=fitz.Rect(min(rr.x0 for rr in relevant)-3 if q<=10 else 95,min(rr.y0 for rr in relevant)-3 if q<=10 else w[1]+17,max(rr.x1 for rr in relevant)+3 if q<=10 else 540,max(rr.y1 for rr in relevant)+3)
   else:clip=fitz.Rect(112,w[1]+17,550,min(w[1]+117,800))
   locations[q]=(pi,clip)
 for q in qs:
  pi,clip=locations[q];image=R/f'images/TOCFL-A{v}-Q{q:02}.png';d[pi].get_pixmap(matrix=fitz.Matrix(2,2),clip=clip).save(image)
  n=len(items)+1;prompt,lids,focus,ev=M[vi][q];opts=OPT.get((vi,q),list('ABC'));ans=keys[q-1]
  item={'id':f'W07-L04L15-01-{n:02}','question_id':f'W07-L04L15-01-{n:02}','number':n,'type':'mc','points':2,'prompt':prompt,'options':opts,'answer':ans,'answer_index':ord(ans)-65,'answer_text':opts[ord(ans)-65], 'audio_id':f'TOCFL-A{v}-Q{q:02}','lesson_keys':[f'boya-elementary-i:lesson-{x:02}' for x in lids],'focus':focus,'evidence':ev,'source_type':'tocfl_official_original_question','source_volume':vi,'source_question':q,'source_level':'Band A','source_url':f'https://tocfl.edu.tw/tocfl/assets/files/mock/ls_mock{v}_test_BandA_en_s.pdf','source_script_url':f'https://tocfl.edu.tw/tocfl/assets/files/mock/ls_mock{v}_test_BandA_listen.pdf','source_answer_url':f'https://tocfl.edu.tw/tocfl/assets/files/mock/ls_mock{v}_test_BandA_answer.pdf','source_pdf_page':pi+1,'source_script_pdf_pages':script_pages[q],'source_original_option_count':len(opts),'source_option_order_preserved':True,'source_key_preserved':True,'version':1,'original_options_provenance_image':str(image.relative_to(P)),'play_count':2}
  if q<=40:item.update(option_image=str(image.relative_to(P)),option_image_alt='本题原题图片；选项A、B、C按原顺序排列。' if q>10 else '本题原题情境图片。听录音中的问题和A、B、C选项后作答。',image_role='stimulus_picture' if q<=10 else 'option_picture_strip')
  items.append(item);crops.append({'number':n,'volume':vi,'question':q,'source_pdf_page':pi+1,'clip':list(clip),'image':str(image.relative_to(P))})
exam={'exam_id':'W07-L04L15-20261022','version':1,'status':'UNPUBLISHED_DRAFT_PENDING_SYNC_AND_TEACHER_REVIEW','cohort':'BOYA-LS-E1-Y1S1-2026F','offering_id':'2026-fall','week':'w07','teaching_dates':'2026-11-02/2026-11-08','lesson_keys':[f'boya-elementary-i:lesson-{n:02}' for n in range(4,16)],'question_count':50,'points':100,'points_per_question':2,'textbook_question_count':0,'tocfl_question_count':50,'hsk_question_count':0,'question_group_count':50,'audio_count':50,'configuration_basis':'Adam current user request 2026-10-22: cumulative L04-L15, all TOCFL original questions, 50 questions x2, synchronize as unpublished draft. This authorizes creation/sync; does not record approval of unseen individual questions.','publication_authorized':False,'teacher_full_listening_accepted':False,'classroom_speaker_acceptance':False,'instructions':'先看本题图片或选项，再听录音，选出一个正确答案。每题录音播放两遍，共50题，每题2分，满分100分。','items':items}
(R/'items.json').write_text(json.dumps(exam,ensure_ascii=False,indent=2));(R/'image-crop-map.json').write_text(json.dumps(crops,ensure_ascii=False,indent=2))
canvas=Image.new('RGB',(1200,10*155),'#eee');dr=ImageDraw.Draw(canvas)
for i,x in enumerate(crops):
 im=Image.open(P/x['image']);im.thumbnail((230,125));px=(i%5)*240;py=(i//5)*155;canvas.paste(im,(px,py+20));dr.text((px+4,py+2),f'{i+1}:A{x["volume"]}Q{x["question"]}',fill='black')
canvas.save(R/'question-crops-contact-sheet.png')
student=['# 一年级 W07｜第4—15课累计听力测验（审阅稿）','','共50题，每题2分，满分100分。先看本题图片或选项，再听录音，选出一个正确答案。每题录音播放两遍。','']
teacher=['# W07 第4—15课累计听力测验｜教师答案（审阅稿）','','本卷全部采用TOCFL官方入门基础级模拟题原题、原图、原音及评分键。仅重新编号；文字题选项忠实转为简体。原音可能保留来源题号，以内部来源映射为准。50题，每题2分，满分100分；每题播放两遍为本课堂安排，不代表官方考试规则。','','图片题：A/B/C为选项位置；看图回答题的选项在原音中。长对话题保留原四项选择。完整原稿见对应官方脚本PDF；下列答案依据为教师摘要。','']
for i in items:
 student += [f'## {i["number"]}. {i["prompt"]}','']
 if i.get('option_image'):student += [f'![本题图片]({(P/i["option_image"]).as_posix()})','']
 student += [f'{chr(65+j)}. {o}' for j,o in enumerate(i['options'])]+['']
 teacher += [f'## 第{i["number"]}题｜答案{i["answer"]}｜2分',f'- 答案内容：{i["answer_text"]}',f'- 依据：{i["evidence"]}',f'- 来源：TOCFL Band A 第{i["source_volume"]}辑原第{i["source_question"]}题；题本PDF第{i["source_pdf_page"]}页；脚本PDF第"'+','.join(map(str,i['source_script_pdf_pages']))+'"页。',f'- 音频：{i["audio_id"]}；播放两遍。',f'- 对应内容：第'+ '、'.join(x[-2:] for x in i['lesson_keys'])+f'课；{i["focus"]}。','']
(R/'student.md').write_text('\n'.join(student));(R/'teacher.md').write_text('\n'.join(teacher))
with (R/'topic-coverage.csv').open('w') as f:
 w=csv.writer(f);w.writerow(['lesson_key','question_numbers','coverage_limit'])
 for l in exam['lesson_keys']:
  w.writerow([l,'，'.join(str(i['number']) for i in items if l in i['lesson_keys']),'身份辨认关联；未直接抽查姓名姓氏音节或国籍' if l.endswith(('04','05')) else '按相关交际主题抽样，不代表词语语法全覆盖'])
(R/'scope.md').write_text('# W07 第4—15课累计听力测验审阅稿\n\n本卷按Adam于2026-10-22的新范围制作：第4—15课相关主题，50题，每题2分，满分100分，全部采用TOCFL官方原题及原音，不发布。取代旧W07第15课形成性诊断／第1—14课阶段检查作为本次Google Form目标的旧范围；不删除旧批准历史或作答。\n\n这是课程相关主题的抽样，题目并非按教材逐词改写。第4—5课通过身份、职业、人物关系和特征辨认建立关联；未直接测姓名／姓氏音节及国籍。第6—15课的物品、位置、日程、交通联系、价格、天气、当前活动、商品选择、生日邀请和请求条件有直接题目。部分官方原题含教材外词汇及较长对话，应由教师亲听后确定适用程度。50题实际用时需试做，不能沿用旧10—15分钟周测安排。\n\n保留官方图片及原选项顺序，所有评分键对应官方答案；原音不重配、不合成。制作／同步授权不等于Adam已经审阅全部新题、教师亲听或课堂音响验收。\n')
print('items',len(items),'image',sum('option_image' in i for i in items),'points',sum(i['points'] for i in items))
