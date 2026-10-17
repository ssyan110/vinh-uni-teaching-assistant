import csv
import json
import math
import wave
from array import array
from pathlib import Path

ROOT = Path('/Users/ssyan110/Development/vinh-uni-teaching-assistant')
BASE = ROOT / 'course/offerings/2026-fall/博雅汉语听说初级起步篇一/weekly-assessment-review'
MANIFEST = ROOT / 'OmniVoice/audio/博雅汉语测验音频/题号音频清单.jsonl'
AUDIOS = {x['audio_id']: x for line in MANIFEST.read_text().splitlines() if (x := json.loads(line))['book'] == '初级起步篇I'}
LESSONS = {int(x['lesson_number']): x for x in csv.DictReader((ROOT/'textbooks/boya-elementary-i-ii/source/reference-dataset/csv/lessons.csv').open(encoding='utf-8-sig')) if x['textbook_id']=='boya-elementary-i'}

def mc(a, q, options, correct, lesson, focus):
    return dict(type='mc', audio_id=a, prompt=q, options=options, answer_index=correct, lesson_keys=[f'boya-elementary-i:lesson-{x:02d}' for x in lesson], focus=focus, points=2)

def short(a, q, answer, lesson, focus):
    return dict(type='short', audio_id=a, prompt=q, answer=answer, lesson_keys=[f'boya-elementary-i:lesson-{x:02d}' for x in lesson], focus=focus, points=4)

PACKS = {
'w05': dict(title='第11–12课综合听说测验', dates='2026-10-19—2026-10-25', lessons=[11,12], page='教材 P80–98', minutes='听力约18分钟，口语每人约3分钟；听力可在第20节后、口语在活动轮换中实施',
mc=[
mc('E11-A01','明天最高多少度？',['五度','十五度','二十五度','三十五度'],1,[11],'温度'),
mc('E11-A02','今天的天气怎么样？',['很冷，而且下雨','不太冷，但是风很大','很热，没有风','不冷，也没有风'],1,[11],'天气状况'),
mc('E11-A03','说话人不喜欢夏天的原因是什么？',['夏天常下雨','夏天风很大','夏天太热','夏天太冷'],2,[11],'天气与偏好'),
mc('E11-A04','哪天天气有小雨？',['今天','明天','星期五','星期日'],1,[11],'天气变化'),
mc('E11-A05','现在多少度？',['零下三度','三度','十三度','三十度'],0,[11],'温度'),
mc('E11-A06','说话人最喜欢哪个季节？',['春天','夏天','秋天','冬天'],2,[11],'季节偏好'),
mc('E12-A01','说话人现在做什么？',['在教室上课','在车站等车','在家做作业','在食堂吃饭'],1,[12],'正在进行的动作'),
mc('E12-A02','汉语课到几点结束？',['八点','九点','十点','十二点'],2,[12],'时间范围'),
mc('E12-A03','他每个星期日做什么？',['去爬山','去上网','去看电影','给老师打电话'],0,[12],'每周习惯'),
mc('E12-A04','请说话人转告老师什么？',['他今天不来','他晚一会儿到','他已经到教室','他明天再来'],1,[12],'转告信息'),
mc('E12-A05','说话人现在做什么？',['正在上网','正在看电影','正在做作业','正在等公共汽车'],2,[12],'正在进行的动作'),
mc('E12-A06','电影几点开始？',['上午八点','中午十二点','下午两点','下午四点'],2,[12],'时间信息'),
mc('E11-B01','两人最后决定哪天去长城？',['今天','明天','星期六','星期日'],3,[11],'按天气改期'),
mc('E11-B02','今天最高多少度？',['十八度','二十度','二十八度','三十八度'],2,[11],'天气细节'),
mc('E11-B03','小王最喜欢哪个季节？',['春天','夏天','秋天','冬天'],0,[11],'季节偏好'),
mc('E11-B04','外面现在的天气和温度是什么？',['下雪，十二度','下雨，十二度','下雨，零下十二度','阴天，二十度'],1,[11],'天气细节'),
mc('E12-B01','小王请小林转告老师什么？',['他不去上课','他晚一会儿到','他已经到教室','他明天有事'],1,[12],'转述人员状态'),
mc('E12-B02','两人约几点去看电影？',['两点','三点','四点','六点'],2,[12],'约定时间'),
mc('E12-B03','小王这周哪天给家里打电话？',['星期五','星期六','星期日','下星期一'],2,[12],'习惯与当天安排'),
mc('E12-B04','下午的课几点结束？两人约几点去食堂？',['两点结束，两点一刻去','三点结束，三点一刻去','三点结束，三点半去','四点结束，四点一刻去'],1,[12],'时间安排'),
mc('E11-C02','安娜的同屋最喜欢哪个季节？',['春天','夏天','秋天','冬天'],3,[11],'季节偏好与理由'),
mc('E11-C01','预报建议什么时候逛街？',['星期五上午','星期五下午','星期六上午','星期六下午'],3,[11],'筛选可行时间'),
mc('E12-C01','中午，大卫在哪里？',['在食堂吃饭','在车站等车','在教室做作业','在家上网'],1,[12],'地点与正在进行的动作'),
mc('E12-C01','王老师几点开始上课？',['上午八点','中午十二点','下午一点','下午三点'],2,[12],'时间信息'),
mc('E12-C02','电影改到什么时候？',['星期三下午','星期三晚上','星期四下午','星期四晚上'],2,[12],'日程调整')],
short=[],
oral=[('天气与等车状态','你和同学原定明天下午去公园。对方手上有天气卡，显示明天下午下雨；你手上有朋友状态卡，显示他正在车站等车、会晚到。互相询问后，说出保留什么、改动什么，以及新的见面时间或活动。','天气、正在进行的动作、变更理由均说清楚。'),('新消息后修订','教师说：“雨停了，但朋友还在等车。”请只调整受影响的部分，向同伴确认新安排。','能听取新条件、回应并确认。')]),
'w06': dict(title='第13–14课综合听说测验', dates='2026-10-26—2026-11-01', lessons=[13,14], page='教材 P99–118', minutes='听力约18分钟，口语每人约3分钟；在第24节活动轮换中实施',
mc=[
mc('E13-A01','说话人想要哪一件？',['大一点儿的','小一点儿的','红色的','贵一点儿的'],1,[13],'尺寸偏好'),
mc('E13-A06','两件衣服相比，哪件更便宜？',['红的','白的','蓝的','黑的'],2,[13],'比较价格'),
mc('E14-A01','他们先做什么？',['唱歌','吃饭','买花','打电话'],1,[14],'活动顺序'),
mc('E14-A05','说话人请对方带什么？',['蛋糕','礼物','饮料','花'],2,[14],'分工'),
mc('E13-B02','小王最后选哪个手机？',['三千块、屏幕大的','两千块、屏幕小一点儿的','三千块、屏幕小的','两千块、屏幕大的'],1,[13],'权衡价格与特点'),
mc('E14-B01','安娜的生日礼物决定买什么？',['蛋糕','一束花','衣服','汉语书'],1,[14],'喜好与礼物'),
mc('E14-B02','最后约几点吃饭？',['六点','七点','七点半','八点半'],2,[14],'按课程改时间'),
mc('E13-C02','安娜最后买了哪件衣服？',['红色、很贵的','蓝色、二百块的','蓝色、三百块的','白色、二百块的'],1,[13],'最终选择')],
short=[short('E14-C01','周五大家几点、在哪里见面？','六点半，在学校对面的饭店。',[14],'集合信息'),short('E13-C01','想买的手机是什么颜色？价格大约多少？','白色，约两千块。',[13],'选购条件')],
oral=[('选礼物并排顺序','同伴有寿星偏好卡：喜欢看书，晚上七点以后有空。你有商店卡：汉语书两百元，花三百元；饭店六点半和七点半各有位置。互相问清楚后，选礼物、定吃饭时间，并说先后顺序与理由。','第13课商品选择与第14课生日安排都产生可观察结果。'),('预算变化','教师说：“书涨到四百元，预算只有三百元。”请向同伴提出替代并回应一次不同意见。','能依新预算修改礼物并完成意见协商。')]),
'w07/lesson15': dict(title='第15课请求与回应单课测验', dates='2026-11-02—2026-11-08', lessons=[15], page='教材 P119–128', minutes='听力材料约12分钟；本周第25—26节以第15课教学和重做活动为主，本卷供嵌入活动作形成性诊断，不另占用第27—28节阶段检查时间',
mc=[
mc('E15-A01','说话人提出什么请求？',['试衣服','退衣服','换颜色','问价格'],0,[15],'请求试用'),
mc('E15-A03','这件衣服有什么问题？',['太贵','太大','有点儿小','太长'],2,[15],'不合适的原因'),
mc('E15-A04','说话人为什么想请假？',['要去机场接朋友','生病了','要看电影','要买衣服'],0,[15],'请求理由'),
mc('E15-B01','试衣间在哪里？',['左边','右边','楼上','门外'],1,[15],'许可后行动'),
mc('E15-B02','老师同意请假吗？',['同意，并请他回来后看看当天学的内容','不同意，因为他没说明原因','同意，并取消课程','没作出回应'],0,[15],'听取回应'),
mc('E15-B04','小林最后打算怎么办？',['买白色手机','买蓝色手机','再看看别的','马上去试衣服'],2,[15],'拒绝后决定')],
short=[short('E15-C01','安娜为什么换小号？最后买吗？','原来蓝色衣服有点儿大；换小号后正合适，她决定买。',[15],'试用和决定'),short('E15-C02','李明何时到教室？老师为什么希望他下午来？','下午两点；下午有重要的课。',[15],'请求后的条件')],
oral=[('店内请求','顾客卡：想买蓝色衣服，先试大号，发现太大；预算三百元。店员卡：可试穿，小号有货，价格二百六十元。两人轮流问答；顾客最后决定买或不买并说明理由。','请求、回应、修改决定都要说出。'),('请假与补课','学生卡：明天上午要去机场接家人，下午两点能到。教师卡：上午可请假，下午有重要课程，希望学生两点到。学生说明原因、请求请假并确认到课时间。','用明确请求和确认结束对话。')]),
'w07/stage': dict(title='第1–14课100分钟个人阶段听说检查', dates='2026-11-02—2026-11-08', lessons=list(range(1,15)), page='教材 P1–118；听力抽样第4–14课，口语语音/声调检查第1–3课', minutes='严格放在第27–28节的100分钟：说明5分钟、个人听力25分钟、独立准备20分钟、双人轮换互动与记录50分钟',
mc=[
mc('E04-B01','安娜是老师还是学生？',['老师','学生','医生','售货员'],1,[4],'身份'),
mc('E05-B01','安娜是哪国人？',['中国人','美国人','英国人','法国人'],2,[5],'国籍'),
mc('E06-B01','笔是谁的？',['小林的','小王的','李美的','安娜的'],2,[6],'归属'),
mc('E07-B01','小王住在哪里？',['学校里','学校东边、校外','学校西边、校外','宿舍楼上'],1,[7],'地点'),
mc('E08-B01','最后约几点在食堂见？',['六点','七点','七点半','八点'],2,[8],'改约时间'),
mc('E09-B01','两人决定怎么去动物园？',['骑自行车','坐地铁','坐公共汽车','走路'],1,[9],'交通方式'),
mc('E10-B01','两斤西瓜共多少钱？',['三块','六块','十块','十三块'],1,[10],'数量与总价'),
mc('E11-B01','长城活动改到哪天？',['今天','明天','星期六','星期日'],3,[11],'天气与改期'),
mc('E12-B01','小王请同伴转告老师什么？',['今天不去','晚一会儿到','要先去食堂','明天请假'],1,[12],'正在发生的状态'),
mc('E13-B02','小王最终选哪种手机？',['三千块、屏幕大的','两千块、屏幕小一点儿的','黑色、三千块的','没有买'],1,[13],'商品比较'),
mc('E14-B02','两人最后决定何时吃饭？',['六点','七点','七点半','八点'],2,[14],'协商时间')],
short=[short('E08-B01','为什么不在六点吃饭？','小王六点有课，七点才下课。',[8],'改约理由'),short('E09-B01','两人在哪里、几点见面？','九点在学校东门。',[9],'集合细节'),short('E11-B01','为什么改变去长城的日子？','明天风很大，星期日晴天。',[11],'改期理由'),short('E14-B01','安娜喜欢什么？谁准备蛋糕？','她喜欢花；大卫准备蛋糕。',[14],'喜好与分工')],
oral=[('个人信息与采购','开场每位学生朗读语音卡：“你好、谢谢、再见、不要、一天”（第1–3课语音与声调抽样；每人约十秒）。随后教师给 A 卡：你叫安娜，周六九点在学校东门集合，要买两斤西瓜。教师给 B 卡：你叫李明，坐地铁去，西瓜每斤三块，商店十点开门。两人依次问答，确认集合、交通、总价，再各自说出采购方案。','第1–3课抽样：五个词组的声母、韵母和声调可辨识，包含“不／一”变调；第4–10课抽样：身份／地点／时间／交通／购物；逐人记录。'),('天气变化与生日计划','教师给 A 卡：周六上午下雨、下午晴天，朋友正在上课，三点下课。教师给 B 卡：朋友过生日，喜欢看书；书二百元、花一百元，预算二百元。两人原定上午去公园，问清后改活动、选礼物、说明顺序。新条件：书已售完；每人独立回应替代方案。','第11–14课抽样：天气、状态、商品与安排；每人要有新条件后的独立回应。')])
}

def audio_path(aid):
    d = AUDIOS[aid]
    return next((ROOT / 'OmniVoice/audio/博雅汉语测验音频/初级起步篇I' / d['folder']).rglob(d['filename']))

def audio_info(p):
    try:
        with wave.open(str(p),'rb') as w:
            n, rate, channels, width = w.getnframes(), w.getframerate(), w.getnchannels(), w.getsampwidth()
            raw=w.readframes(n)
        if width != 2 or len(raw) != n*channels*width: raise ValueError('PCM帧长度或样本位宽异常')
        samples=array('h');samples.frombytes(raw)
        peak=max(abs(x) for x in samples)/32768
        rms=math.sqrt(sum(x*x for x in samples)/len(samples))/32768
        status='PCM可解码；待教师亲听' if 0.002<rms and peak<0.999 else '电平异常；待重查'
        return f'{n/rate:.2f}', str(rate), str(channels), str(width*8), f'{peak:.3f}',f'{rms:.3f}',status
    except Exception as e:
        return '', '', '', '', '', '',f'技术解码失败：{e}'

for key, pack in PACKS.items():
    out = BASE / key
    if key == 'w05' and (out / 'items.json').exists() and json.loads((out / 'items.json').read_text()).get('version', 1) >= 2:
        print('w05: preserve registered official-audio v2; legacy TTS generator skipped')
        continue
    out.mkdir(parents=True, exist_ok=True)
    items = pack['mc'] + pack['short']
    if key == 'w05':
        for it in items:
            if it['type'] == 'mc': it['points'] = 4
    for i, it in enumerate(items,1): it['id'] = f'{key.replace("/","-").upper()}-{i:02d}'
    scope = [f'# {pack["title"]}｜审阅稿／未发布', '', f'- 班级：BOYA-LS-E1-Y1S1-2026F；开课实例：2026-fall；周次：{key.split("/")[0].upper()}；课表日期：{pack["dates"]}。', f'- 课次：{", ".join(f"boya-elementary-i:lesson-{n:02}" for n in pack["lessons"])}。', f'- 教材范围：{pack["page"]}。', f'- 执行时间：{pack["minutes"]}。', '- 课程计划依据：`docs/course-rules/BOYA-LS-E1-Y1S1-2026F/README.md` 与 `course/offerings/2026-fall/博雅汉语听说初级起步篇一/semester-teacher-manual.md`。', '- 音频朗读稿依据：`OmniVoice/audio/博雅汉语测验音频/题号音频清单.jsonl`；这些是既有课堂题库 TTS，不是出版社录音。', '- 教材核对：`textbooks/boya-elementary-i/source/source-inventory.json` 与 `.tmp/ocr-elementary-i/page-*.txt` 的相应页；OCR 是待复核衍生资料。第11–15课无逐课 `00-source/canonical-source.json`，不能宣称逐题得到批准的 canonical source。', '- 本卷是参考 TOCFL 听力题型的课堂诊断题，未作官方等值定级。教学进度在考前需由任课教师确认。']
    scope += ['', '## 逐课教材对照']
    for n in pack['lessons']:
        row=LESSONS[n]
        scope.append(f'- `{row["lesson_key"]}`：〈{row["lesson_title"]}〉，印刷教材从 P{row["textbook_printed_start_page"]} 开始，PDF 从第 {row["source_pdf_start_page"]} 页开始；数据状态 `{row["source_status"]}`。')
    if 13 in pack['lessons']:scope.append('- 第13课标题存在来源差异：参考数据表记为〈你打算买什么样子〉，学期手册和 OCR 页眉记为〈你打算买什么样子的〉。以教材原页人工复核前不消除此差异。')
    if key=='w07/stage': scope.append('- 阶段检查范围为第1–14课；听力抽样第4–14课，口语任务1开场约十秒观察第1–3课语音与声调（L1 日常用语、L2 声调标记与朗读、L3 不／一变调），计入该口语题10分之内，不延长100分钟。第15课不列入本卷。正式成绩比例未确认。')
    (out/'scope.md').write_text('\n'.join(scope)+'\n',encoding='utf-8')
    audio_groups={}
    for idx,it in enumerate(items,1): audio_groups.setdefault(it['audio_id'],[]).append(idx)
    shared_audio=any(len(v)>1 for v in audio_groups.values())
    listening_points=sum(x['points'] for x in items if x['type']=='mc')
    s=[f'# {pack["title"]}｜学生审阅稿／未发布','','姓名：________　班级：________','',f'听力选择题：{len(pack["mc"])}题，每题{4 if key=="w05" else 2}分，共{listening_points}分；口语任务：2题，每题10分，另计。','听力播放方法：先看题目、抓关键词；每段音频播放两遍，边听边记重点，再选答案并核对。不要看朗读稿。']
    if shared_audio: s.append('同一段音频可能对应多题；题号旁会注明，请听完该段后一起作答。')
    s.append('')
    t=[f'# {pack["title"]}｜教师审阅稿／未发布','',f'时间：{pack["minutes"]}。选择题自动核分；简答与口语人工核分。', '本次Google Form范围为25道听力单选题（每题4分，共100分）；口语两题每题10分，单独计分，不纳入Form。', '音频仍需教师逐题亲听；建议每段音频播放两遍。播放安排是本班诊断方案，并非 TOCFL 官方统一规则。', '','## 逐题朗读稿、答案与依据','']
    for i,it in enumerate(items,1):
        d=AUDIOS[it['audio_id']]
        group=audio_groups[it['audio_id']]
        shared_note=f'（与第{"、".join(str(n) for n in group if n!=i)}题听同一段）' if len(group)>1 else ''
        s += [f'{i}. {it["prompt"]}{shared_note}']
        if it['type']=='mc': s += [f'   {chr(65+j)}. {x}' for j,x in enumerate(it['options'])]
        else:s += ['   答：________________________________']
        s+=['']
        ans=it['options'][it['answer_index']] if it['type']=='mc' else it['answer']
        ans_display=ans.rstrip('。.')+'。'
        shared_play=[f'本音段也对应第{"、".join(str(n) for n in group if n!=i)}题；集中播放一次后作答，必要时整段重放一次。'] if len(group)>1 else []
        t += [f'### {i}. {it["audio_id"]}｜{it["focus"]}',f'题目：{it["prompt"]}',f'题库角色标记稿（供教师辨识人物；非音档逐字稿）：{d["source_text"]}',f'实际送入语音模型的文本（manifest `speech_units`；未亲听核实输出）：{" / ".join(d["speech_units"])}',f'答案：{ans_display}',f'依据：上述题库文本中的直接陈述；课程范围 {", ".join(it["lesson_keys"])}。', *shared_play, '播放两遍；先看题目抓关键词，边听边记要点，再核对答案。','']
    s+=['## 口语任务','','根据教师给的两张不同资料卡，和同伴轮流问答。老师会记录每个人的表现。','']
    t+=['## 口语任务与量表','']
    student_oral={
      'w05':['两人各拿一张资料卡，分别掌握天气和朋友状态。互相问清楚后，说明新的活动与时间。','听教师的新消息后，只修改受影响的安排，并向同伴确认。'],
      'w06':['两人分别掌握寿星偏好和商店、饭店资料。问清后选礼物，决定吃饭时间及活动顺序。','听到预算变化后，向同伴提议替代礼物并回应同伴意见。'],
      'w07/stage':['先逐个清楚读出“你好、谢谢、再见、不要、一天”。然后两人各拿一张资料卡；互相询问集合、交通、价格和需求，再各自口头确认采购方案。','两人分别掌握天气和礼物资料；问清后修改活动、选礼物。教师改变条件时，每人独立回应。']}
    for j,(title,prompt,evidence) in enumerate(pack['oral'],1):
        s += [f'{j}. {title}：{student_oral.get(key,[x[1] for x in pack["oral"]])[j-1]}','']
        t += [f'{j}. {title}：{prompt}',f'观察重点：{evidence}','']
    if key=='w07/stage':
        t += ['阶段口语任务1（10分）：语音与声调0–2分（五个词组可辨识；关注“不要、一天”中的变调，不按口音扣分）、听取并回应0–2分、主动提问0–2分、关键信息0–2分、最终采购方案与确认0–2分。语音检查安排在50分钟轮换开始，每人约十秒。','阶段口语任务2（10分）：听取并回应0–2分、主动提问0–2分、表达关键条件0–2分、协商／澄清0–2分、最终决定与确认0–2分。']
    else:t += ['每题10分：听取并回应信息0–2分、主动提问／请求0–2分、表达关键条件0–2分、协商／澄清0–2分、最终决定与确认0–2分。']
    t += ['教师逐人记录；允许不改变意思的自然表达，不能只按固定措辞给分。','', '现有音频和新口语卡未经过任课教师亲听及课堂试行；暂不向学生发布。']
    (out/'student.md').write_text('\n'.join(s)+'\n',encoding='utf-8')
    (out/'teacher.md').write_text('\n'.join(t)+'\n',encoding='utf-8')
    oral_json=[{'title':x[0],'prompt':x[1],'evidence':x[2],'points':10} for x in pack['oral']]
    if key=='w07/stage':oral_json[0]['pronunciation_tone_check']={'lesson_keys':[f'boya-elementary-i:lesson-{n:02d}' for n in (1,2,3)],'text':['你好','谢谢','再见','不要','一天'],'points_within_oral_task_1':2,'not_additional_points':True}
    (out/'items.json').write_text(json.dumps({'status':'review_unpublished','cohort':'BOYA-LS-E1-Y1S1-2026F','offering_id':'2026-fall','week':key,'lesson_keys':[f'boya-elementary-i:lesson-{n:02d}' for n in pack['lessons']],'items':items,'oral_tasks':oral_json},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    with (out/'audio-map.csv').open('w',newline='',encoding='utf-8-sig') as f:
        w=csv.writer(f);w.writerow(['item_id','audio_id','file','seconds','sample_rate_hz','channels','bit_depth','peak_ratio','rms_ratio','role_marked_source_text','synthesis_input_speech_units','role_label_difference','script_source','technical_status','semantic_status','human_playback_status'])
        for it in items:
            aid=it['audio_id'];p=audio_path(aid);dur,rate,ch,bits,peak,rms,status=audio_info(p)
            d=AUDIOS[aid]
            role_note='B类角色稿的“姓名：”在合成输入改成“姓名，”；可能听到姓名前缀，待亲听' if d['section']=='B' else '无B类角色前缀差异'
            w.writerow([it['id'],aid,str(p.relative_to(ROOT)),dur,rate,ch,bits,peak,rms,d['source_text'],' / '.join(d['speech_units']),role_note,'题号音频清单.jsonl',status,'题干/答案已对照两个文本版本；未完成独立语音识别','待教师亲听'])
    with (out/'score-sheet.csv').open('w',newline='',encoding='utf-8-sig') as f:
        w=csv.writer(f);score_items=[it for it in items if it['type']=='mc'] if key=='w05' else items;total=sum(x['points'] for x in score_items)+(20 if pack['oral'] and key!='w05' else 0);w.writerow(['学生姓名','学号']+[it['id']+f'/{it["points"]}' for it in score_items]+(['口语1内含-语音声调项/2（不可另加）'] if key=='w07/stage' else [])+(['口语1/10','口语2/10'] if key!='w05' else ['口语（另计，不纳入Form）'])+['总分/'+str(total),'首听正确数','重听后正确数','教师备注'])
    qa=[f'# {pack["title"]}｜核对记录', '', f'- 题数：{len(pack["mc"])}道单选、{len(pack["short"])}道简答、2道口语；总分{sum(x["points"] for x in items)+20}。', '- 单选每题一个指定正确项；教师卷保留朗读稿与答案。简答保留意义相同表达的人工核分空间。', '- 所引用 WAV 已逐项通过 `wave` 容器解码并登记采样率、时长等；尚未做主观音质、语速、发音逐题亲听，因此不能标“声音合格”。', '- 未建立 Google Form；`items.json` 与 `audio-map.csv` 可用于录入未发布审阅表单。', '- 教材 OCR 与题库仅作交叉依据，逐课 canonical source 缺失；教师应对照原教材与当前实际进度做最终内容核对。', '- 状态：审阅稿／未发布；无 20-approved 或 40-release 变更。']
    if key == 'w05': qa = [f'# {pack["title"]}｜核对记录', '', f'- 题数：{len(pack["mc"])}道单选，听力共{sum(x["points"] for x in items if x["type"]=="mc")}分；另有2道口语，各10分。', '- 本次Google Form范围为25道听力单选题，每题4分、共100分；口语任务不纳入Form。', '- 每道单选只有一个指定正确项；题目和选项依据听力稿中的直接信息改写，未复制外部范题。', '- 所引用 WAV 已逐项通过 `wave` 容器解码并登记采样率、时长等；尚未做主观音质、语速、发音逐题亲听，因此不能标“声音合格”。', '- Form尚未建立；`items.json` 与 `audio-map.csv` 可用于录入未发布审阅表单。', '- 教材 OCR 与题库仅作交叉依据，逐课 canonical source 缺失；教师应对照原教材与当前实际进度做最终内容核对。', '- 状态：审阅稿／未发布；无 20-approved 或 40-release 变更。']
    b_ids=sorted({it['audio_id'] for it in items if AUDIOS[it['audio_id']]['section']=='B'})
    qa.append(f'- B类引用逐一核对 manifest 的角色标记稿与实际合成输入：{", ".join(b_ids)}。这些音档的合成输入把“姓名：”改为“姓名，”，会影响听到的说话人提示；教师卷和音频表分列两个版本。此处仅确认输入文本，不声称已听到或已验收最终声音。')
    if key in ('w05','w06'):qa.append('- 两课各有单独听力题；口语任务明确整合两课。')
    if key=='w07/stage':qa.append('- 第1–3课语音与声调作为口语任务1内含2分的个人观察，第4–14课通过听力与互动抽样；不是逐课完整考试。100分钟轮换表仍需按实际人数核算；现有资料未记录这些题库脚本是否此前练过，任课教师须据班级进度替换已练材料。')
    if key=='w07/lesson15':qa.append('- 课表第25–26节安排第15课教学和重做活动，没有另列独立测验时段；本卷应嵌入形成性任务使用。若要逐人教师口试并记录40分总成绩，须先核实课内可观察时间和实施方式。')
    (out/'qa.md').write_text('\n'.join(qa)+'\n',encoding='utf-8')
    print(key,len(items),sum(x['points'] for x in items)+20)
