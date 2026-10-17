from pathlib import Path
import json
p=Path(__file__).resolve().parent
f=p/'lesson-11-12-逐页修订-v03.json';d=json.loads(f.read_text());two={'11-1','11-5','12-2','12-5'}
lines=['# 第11、12课｜逐项修改内容 v03','2026-10-15｜内容审阅，尚未制作新版。适用 boya-elementary-i:lesson-11、lesson-12；2026-fall。','最新规则：每个活动最多两页，默认优先一页；不为凑两页增加文字。下列为20页方案，制作时还须验证实际字号和可读性。旧页码仅供对应你的批注。','## 新第1页（旧第1页）｜封面',d['page_notes']['1'],'## 新第2页（旧第2页）｜活动路线',d['page_notes']['2']]
page=3
for i,x in enumerate(d['activities']):
 old=3+i*2;count=2 if x['key'] in two else 1
 x['proposed_pages']=list(range(page,page+count));x['old_pages']=[old,old+1];x['pages']=count
 lines += [f'## 新第{"—".join(map(str,x["proposed_pages"]))}页（旧第{old}—{old+1}页）｜活动{x["key"]}：{x["title"]}']
 if count==2:
  lines += ['两页：第一页只放任务和必要问题，第二页放实际记录表；完整朗读稿只在教师材料。']
 else:lines += ['一页完成：把必要动作和实际资料放同页，取消重复目标、完成框和额外说明页。']
 if x['key'] in {'11-3','12-4'}:
  lines += ['学生页只放标题“看图说故事”、整组六格漫画、必要时间／人物背景，以及一句“自己按①到⑥讲故事，说清天气／时间和人物在做什么。”不放分级框。','图片及原有必要标注不变；词句提示若需要，统一标“可用词句：”。']
 else:
  steps=x['steps']
  if count==1:
   # Retain the user's explicit four-step12-1; compress other straightforward tasks to executable short copy.
   compact={
    '11-2':['每人选一个活动，说为什么。','选得不一样，就说为什么。一起选两人都同意的活动，说为什么。'],
    '11-4':['每人说选哪个城市、那里天气怎么样。同学问为什么，再回答。'],
    '11-6':['A邀请B：周日几点、在哪里见面、做什么、几点结束。B问一个问题，A回答。','B再邀请A，A问，B回答。'],
    '12-3':['A是小王，B是小林。A打电话问：在哪里？正在做什么？几点到？B回答。','B问几点上课，请A告诉老师。把电话从“喂，你好”说到结束。'],
    '12-6':['听老师说新课表，记下哪里变了。再听一次。','每人说：哪天变了？原来是什么？现在是什么？'],
    '12-7':['看小明的消息和新课表。每人告诉他两处哪里说错、正确是什么。','同学再说正确的时间和教室，看看说得一样吗。'],
    '12-8':['选一个上完课能去的活动。告诉同学你现在做什么、想几点去哪里、为什么。','同学说能不能去。一起定好见面时间、地点和活动，每人说一次。']}
   steps=compact.get(x['key'],steps)
   x['slide_steps']=steps
  lines += [f'{j+1}. {s}' for j,s in enumerate(steps)]
  if x['levels']:lines += ['基础 HSK1–3：'+x['basic'],'挑战 HSK4–6：'+x['challenge']]
  lines += ['### 同页资料' if count==1 else '### 第二页资料',x['data']]
  if x.get('layout') and count==2:lines += ['版面要求：'+x['layout']]
  if x['key']=='11-4':lines += ['大表格置中，单元格水平居中；必要任务／问题在表格下方，不设右栏。']
  if x['key']=='12-6':lines += ['投影用完整周一至周五原课表，加一句“听老师说新安排，找出时间和教室哪里变了。”两档放简短同一行；不另放长目标和步骤。']
  if x['key']=='12-1':lines += ['当前时间放表格上方；表格用时间＋活动。四步任务放表格下，不另放分级、目标和完成框。']
  if x['key']=='11-2':lines += ['保留原第6页三项天气活动资料，统一“可用词句：”；删重复讨论问题，因任务已同页说明。']
 page+=count
lines += ['# 教师材料（不投影）','新增12-5朗读稿；原四个听力活动六条消息原文保留。教师完整目标、步骤、巡视与答案不全部复制到学生页。']
for x in d['activities']:lines += [f'## 活动{x["key"]}｜{x["title"]}',x['teacher']]
lines += ['# 自查','20页方案＝封面和路线2页＋4个双页活动8页＋10个单页活动10页。漫画两项均为单人，在各自一页内显示完整六格。第12-1不分级，两项漫画不分级。','无需转身、背对或预抄栏目；共看资料就是表达练习，听力全文只给老师。第12-2学生身份是有依据的判断，不是由去学校确定身份。','旧第6页未给具体改动，内容保留并与原第5页合并；旧第4、18页删右栏；旧第10页表格居中；旧第12页按原计划—表格—请你想想—可用词句排列；旧第26页完整周一至五。','未修改现有HTML、教师PDF、ZIP或批准记录。新版内容确认后再制作，并重新检查全部页数、导航、可读性、PDF与打包。尚无学生试教证据。']
d['page_count']=page-1;d['layout_rule']='At most two pages per activity; one page when executable and readable; no padding';d['status']='content_review_not_approved'
f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');(p/'lesson-11-12-逐页修改内容-v03.md').write_text('\n\n'.join(lines)+'\n')
assert page-1==20
(p/'review-check.json').write_text(json.dumps(dict(status='review_ready',proposed_pages=20,activities=14,one_page_activities=10,two_page_activities=4,all_activities_at_most_two=True,production_started=False),ensure_ascii=False,indent=2)+'\n')
