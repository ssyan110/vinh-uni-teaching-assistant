from pathlib import Path
import csv, hashlib, json, re, subprocess

R = Path(__file__).resolve().parent
P = R.parents[5]
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def put(name, data): (R/name).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
def probe(p): return float(json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(p)]))['format']['duration'])
def clip(source, target, start, end):
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(start),'-i',str(source),'-t',str(end-start),'-ac','1','-ar','44100','-c:a','pcm_s16le',str(target)],check=True)
    subprocess.run(['ffmpeg','-v','error','-i',str(target),'-f','null','-'],check=True,capture_output=True)

bank=json.loads((R/'items.json').read_text()); assert bank['version']==2
before={i['number']:i for i in bank['items']}
novice=[
 (40,'Q00799500','美美今年要去哪里玩？',['日本','台湾','美国'],'B','台湾',[14],'目的地辨认'),
 (41,'Q00799600','明天他们要一起做什么？',['运动','学习','吃饭'],'A','运动',[9],'明天的活动'),
 (42,'Q00799700','大明在做什么？',['找书','买书','看书'],'A','找书',[7],'正在做的事'),
 (43,'Q00799800','林太太的儿子今年几岁？',['十一岁','十四岁','十七岁'],'C','十七岁',[6],'年龄数字'),
 (44,'Q00799900','小张星期天要做什么？',['唱歌','看电影','参加考试'],'C','参加考试',[7],'周日安排'),
 (45,'Q01025800','张老师今年的生日是星期几？',['星期四','星期五','星期六'],'B','星期五',[14],'生日日期'),
 (46,'Q01026000','大明要找谁？',['王小姐','林先生','张先生'],'C','张先生',[4,5],'电话找人'),
 (47,'Q01026100','大山怎么来公司？',['开车','坐地铁','坐公交'],'B','坐地铁',[9],'交通方式'),
]
band=[
 (48,21,'女的为什么没接电话？',['手机坏了','她在看书','她去买衣服了'],'A','手机坏了',[12],'电话联系'),
 (49,27,'女的要喝什么？',['热咖啡','茶','牛奶'],'A','热咖啡',[10],'点餐饮料'),
 (50,35,'女的还准备了什么？',['汤和水果','面条和鸡蛋','汉堡和咖啡'],'A','汤和水果',[10],'晚餐准备'),
]
new=[]; audio=json.loads((R/'audio-manifest.json').read_text()); audio=[a for a in audio if int(a['question_range'].split('–')[0])<40]
novbase=R/'source/tocfl-novice-database-part3'
for n,sid,prompt,opts,key,answer,lessons,focus in novice:
    aid='TOCFL-N-'+sid; src=novbase/'audio'/f'{sid}.mp3'; dst=R/'audio-single'/f'{aid}.wav'
    log=subprocess.run(['ffmpeg','-v','info','-i',str(src),'-af','silencedetect=noise=-35dB:d=1','-f','null','-'],capture_output=True,text=True,check=True).stderr
    gaps=[(float(x),float(y)) for x,y in re.findall(r'silence_start: ([\d.]+).*?silence_end: ([\d.]+)',log,re.S)]
    middle=[(x,y) for x,y in gaps if y-x>4 and x>15 and y<probe(src)-10]
    assert middle,(sid,gaps)
    end=middle[0][0]+0.2; clip(src,dst,0,end)
    old=before[n]; qid=f'W07-L04L15-03-{n:02}'
    new.append({'id':qid,'question_id':qid,'number':n,'type':'mc','points':2,'prompt':prompt,'options':opts,'answer':key,'answer_index':ord(key)-65,'answer_text':answer,'audio_id':aid,'lesson_keys':[f'boya-elementary-i:lesson-{x:02}' for x in lessons],'focus':focus,'evidence':f'TOCFL准备级第三部分{sid}官方听力稿与答案表；{answer}。','source_type':'tocfl_novice_official_original_question','source_question_id':sid,'source_level':'Novice','source_url':'https://tocfl.edu.tw/tocfl/index.php/exam/test/page/1?pressBtn=(%E9%A1%8C%E5%BA%AB)','source_script_pdf':str((novbase/'scripts'/f'{sid}.pdf').relative_to(R)),'source_answer_file':str((novbase/'N_L_Part_Three_Answer.xlsx').relative_to(R)),'version':3,'play_count':2,'replaces_question_id':old['question_id']})
    audio.append({'audio_id':aid,'file':str(dst.relative_to(R)),'source_file':str(src.relative_to(R)),'source_url':'https://tocfl.edu.tw/tocfl/assets/files/mock_database/N_L_Part%20Three_MP3.rar','source_status':'official original first rendition; second repetition and middle pause trimmed','source_segments':[{'start_seconds':0,'end_seconds':end}],'source_sha256':sha(src),'sha256':sha(dst),'duration_seconds':probe(dst),'question_ids':[qid],'question_range':str(n),'play_count':2,'title':focus,'section_title':f'第{n}题｜TOCFL准备级｜Audio {sid}','semantic_status':'official script and answer key matched; teacher listening pending','technical_decode':'pass','teacher_listening_accepted':False,'classroom_speaker_acceptance':False,'script':f'官方准备级第三部分{sid}听力稿；答案{key}。','clip_policy':'first_complete_original_rendition','speech_modified':False})
for n,srcnum,prompt,opts,key,answer,lessons,focus in band:
    aid=f'TOCFL-A4-Q{srcnum:02}'; src=R/'audio'/f'{aid}.mp3'; dst=R/'audio-single'/f'{aid}.wav'
    log=subprocess.run(['ffmpeg','-v','info','-i',str(src),'-af','silencedetect=noise=-35dB:d=0.6','-f','null','-'],capture_output=True,text=True,check=True).stderr
    gaps=[(float(x),float(y)) for x,y in re.findall(r'silence_start: ([\d.]+).*?silence_end: ([\d.]+)',log,re.S)]
    middle=[(x,y) for x,y in gaps if y-x>4 and x>8 and y<probe(src)-8]
    assert middle,(aid,gaps)
    end=middle[0][0]+0.2; clip(src,dst,2.2,end)
    old=before[n];qid=f'W07-L04L15-03-{n:02}'
    new.append({'id':qid,'question_id':qid,'number':n,'type':'mc','points':2,'prompt':prompt,'options':opts,'answer':key,'answer_index':ord(key)-65,'answer_text':answer,'audio_id':aid,'lesson_keys':[f'boya-elementary-i:lesson-{x:02}' for x in lessons],'focus':focus,'evidence':f'根据TOCFL Band A第4辑第{srcnum}题官方听力稿改写单一细节问题；{answer}。','source_type':'tocfl_band_a_adapted_detail_question','source_volume':4,'source_question':srcnum,'source_level':'Band A','source_url':'https://tocfl.edu.tw/tocfl/assets/files/mock/ls_mock4_test_BandA_en_s.pdf','source_script_url':'https://tocfl.edu.tw/tocfl/assets/files/mock/ls_mock4_test_BandA_listen.pdf','source_answer_url':None,'version':3,'play_count':2,'replaces_question_id':old['question_id'],'adapted_question':True})
    audio.append({'audio_id':aid,'file':str(dst.relative_to(R)),'source_file':str(src.relative_to(R)),'source_url':json.loads((R/'source/official-audio-map.json').read_text())['4'][str(srcnum)],'source_status':'official original first rendition; repeated rendition trimmed','source_segments':[{'start_seconds':2.2,'end_seconds':end}],'source_sha256':sha(src),'sha256':sha(dst),'duration_seconds':probe(dst),'question_ids':[qid],'question_range':str(n),'play_count':2,'title':focus,'section_title':f'第{n}题｜TOCFL官方短对话｜Audio A4-{srcnum}','semantic_status':'official script matched to adapted one-detail question; teacher listening pending','technical_decode':'pass','teacher_listening_accepted':False,'classroom_speaker_acceptance':False,'script':f'TOCFL Band A第4辑第{srcnum}题；改写问题答案{key}。','clip_policy':'first_complete_original_rendition','speech_modified':False})
items=[i for i in bank['items'] if i['number']<40]+new
assert len(items)==50 and [i['number'] for i in items]==list(range(1,51))
bank.update(version=3,status='UNPUBLISHED_DRAFT_PENDING_EXTERNAL_SYNC_AND_TEACHER_REVIEW',tocfl_question_count=48,textbook_question_count=2,audio_count=49,question_group_count=49,revision_basis='2026-10-23 level/repeat review: Q40-50 replaced; TOCFL Novice originals Q40-47 and Band A source audio with simpler adapted questions Q48-50; W04-W06 exact source/audio repeats removed.',items=items)
put('items.json',bank);audio.sort(key=lambda a:int(a['question_range'].split('–')[0]));put('audio-manifest.json',audio)
with (R/'audio-map.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['audio_id','audio_path','question_range','play_count','duration_seconds','sha256','source_type'])
 for a in audio:w.writerow([a['audio_id'],str((R/a['file']).relative_to(P)),a['question_range'],2,f"{a['duration_seconds']:.6f}",a['sha256'],a['source_status']])
sections=[{'id':f'w07-v3-g{a["question_range"]}','title':a['section_title'],'question_start':int(a['question_range'].split('–')[0]),'question_end':int(a['question_range'].split('–')[-1]),'audio_ids':[a['audio_id']],'description':'先看题目，再听录音，选出一个正确答案。每段录音播放两遍。'} for a in audio]
put('form-sections.json',{'assessment_id':bank['exam_id'],'version':3,'status':'PREPARED_NOT_SYNCED','sections':sections})
student=['# 一年级 W07｜第4—15课累计听力练习（审阅稿）','','共50题，每题2分，满分100分。先看题目，再听录音，选出一个正确答案。每段录音播放两遍。','']
teacher=['# W07 第4—15课累计听力练习｜教师答案（审阅稿）','','50题，每题2分，共100分。第12—13题使用博雅第15课15-11原题原音；第40—47题使用TOCFL准备级原题原音；第48—50题使用TOCFL官方原音，题干与选项按第1—15课范围改写。','', '未发布；教师完整亲听与课堂音箱验收待完成。','']
for i in items:
 student += [f'## {i["number"]}. {i["prompt"]}','']
 if i.get('option_image'):student += [f'![本题图片]({(P/i["option_image"]).as_posix()})','']
 student += [f'{chr(65+j)}. {o}' for j,o in enumerate(i['options'])]+['']
 teacher += [f'## 第{i["number"]}题｜答案{i["answer"]}｜2分',f'- 答案内容：{i["answer_text"]}',f'- 依据：{i["evidence"]}',f'- 音频：{i["audio_id"]}；播放两遍。','']
(R/'student.md').write_text('\n'.join(student));(R/'teacher.md').write_text('\n'.join(teacher))
with (R/'topic-coverage.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['lesson_key','question_numbers','coverage_limit'])
 for lesson in bank['lesson_keys']:w.writerow([lesson,'，'.join(str(i['number']) for i in items if lesson in i.get('lesson_keys',[])),'交际主题抽样，不代表该课全部词语语法已掌握'])
put('content-qa.json',{'exam_id':bank['exam_id'],'version':3,'question_count':50,'points':100,'audio_count':49,'question_group_count':49,'numbering_contiguous':True,'last_11_review':'Q40-47 Novice short dialogues; Q48-50 adapted from three Band A short dialogues; each single-answer; no exact W04-W06 source repeat','technical_decode':'pass','remote_sync':'pending','teacher_full_listening':'pending','classroom_speaker_acceptance':'pending','content_approved':False,'publication_authorized':False})
(R/'scope.md').write_text('# W07 第4—15课累计听力练习审阅稿 v3\n\n50题，每题2分，共100分。以本册第1—15课逐课词汇、语法表作范围参考；这些表含OCR待人工核对条目，不代表全部已掌握。第12—13题保留第15课15-11原题原音。第40—47题替换为TOCFL准备级短对话原题，第48—50题用Band A官方短音频和按本班范围改写的单细节题。排除了与W06重复的原第48—50题。\n\n本地音轨只保留第一遍完整语音及题目；播放时每段放两遍。当前未发布，线上同步、教师逐段亲听和教室音箱验收状态见QA。\n')
(R/'qa.md').write_text('# W07 本地内容与音频核验 v3\n\n- 50题、100分、49个音频题组。第12—13题共享第15课15-11出版社原音。\n- 第40—47题TOCFL准备级原题；第48—50题Band A原音与按范围改写的单细节题。准备级Q01025900因双答案风险排除。\n- W04—W06原题音频ID对照无重复；原第48—50题重复W06，已替换。\n- 音频技术解码通过；教师完整亲听、课堂音箱验收、线上Form/Sheets/dashboard同步及逐题读回仍待完成。未发布。\n')
src=json.loads((R/'source-manifest.json').read_text());src['selection']='40-47 TOCFL Novice original items, 48-50 Band A official audio with adapted questions, 12-13 Boya L15 originals; other original items preserved.';src['tocfl_novice_bank']={'index':'https://tocfl.edu.tw/tocfl/index.php/exam/test/page/1?pressBtn=(%E9%A1%8C%E5%BA%AB)','local_dir':str(novbase.relative_to(R)),'question_ids':[x[1] for x in novice],'excluded':'Q01025900 both A and B true; not used'};src['human_gates']['external_form_sheet_sync']='pending';put('source-manifest.json',src)
sync=json.loads((R/'form-sync.json').read_text());sync.update(status='PENDING_RESYNC',question_version=3,previous_readback_stale=True,publication_authorized=False,content_approved=False,pending=['Form v3 update/readback','Sheets v3 update/readback','audio dashboard v3 rebuild/playback','teacher full listening','classroom speaker acceptance']);put('form-sync.json',sync)
mg=P/'lessons/boya-elementary-i/assessment-management.json';mgd=json.loads(mg.read_text());ex=next(x for x in mgd['exams'] if x['exam_id']==bank['exam_id']);ex.update(status='DRAFT_V3_LOCAL_PENDING_SYNC_UNPUBLISHED',question_version=3,audio_count=49,question_group_count=49,student_ready=False,publication_authorized=False,content_approved=False,question_bank_sha256=sha(R/'items.json'),scope_decision=bank['revision_basis'],sync_verification_evidence=None);mg.write_text(json.dumps(mgd,ensure_ascii=False,indent=2)+'\n')
print('v3 local 50 items, 49 audio groups')
