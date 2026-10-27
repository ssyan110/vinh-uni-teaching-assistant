from pathlib import Path
import json,requests,subprocess,re,csv,hashlib,concurrent.futures
import numpy as np
from scipy.signal import correlate
R=Path(__file__).resolve().parent;P=Path('/Users/ssyan110/Development/vinh-uni-teaching-assistant');bank=json.loads((R/'items.json').read_text());maps=json.loads((R/'source/official-audio-map.json').read_text());(R/'audio-single').mkdir(exist_ok=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def get(i):
 p=R/f'audio/{i["audio_id"]}.mp3';u=maps[str(i['source_volume'])][str(i['source_question'])]
 if not p.exists():
  for attempt in range(3):
   try:s=requests.get(u,timeout=30);s.raise_for_status();p.write_bytes(s.content);break
   except Exception:
    if attempt==2:raise
 duration=float(json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(p)]))['format']['duration'])
 log=subprocess.run(['ffmpeg','-hide_banner','-i',str(p),'-af','silencedetect=noise=-35dB:d=0.6','-f','null','-'],capture_output=True,text=True,check=True).stderr
 starts=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',log)];ends=[(float(x),float(y)) for x,y in re.findall(r'silence_end: ([\d.]+) \| silence_duration: ([\d.]+)',log)];sil=[{'start':e-d,'end':e,'duration':d} for e,d in ends]
 start=2.2;mid=[s for s in sil if s['duration']>=4.5 and s['start']>4 and s['end']<duration-1]
 if i['source_question']<=40:
  assert mid,(i['audio_id'],'no clear inter-rendition gap')
  cut=mid[0];end=cut['start']+0.25;policy='one_complete_first_rendition_including_original_question_and_spoken_options_when_present'
  x=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-ac','1','-ar','4000','-f','f32le','-']),np.float32)
  voice=[(a['end'],z['start']) for a,z in zip(sil,sil[1:]) if a['end']>2.2 and z['start']<cut['start']+0.01 and z['start']-a['end']>0.25]; va,vz=max(voice,key=lambda p:p[1]-p[0]); ts=va+0.1; t=x[int(ts*4000):int(min(ts+1.0,vz)*4000)];search=x[int(cut['end']*4000):];c=correlate(search,t,mode='valid',method='fft'); cs=np.concatenate(([0.0],np.cumsum(search.astype(float)**2))); norms=np.sqrt(np.maximum(1e-20,(cs[len(t):]-cs[:-len(t)])*float(np.dot(t,t)))); scores=c/norms;corr=float(np.max(scores))
  assert corr>0.75,(i['audio_id'],corr)
 else:
  trailing=[s for s in sil if s['end']>duration-0.2 and s['duration']>=3]
  end=trailing[-1]['start']+0.25 if trailing else duration;policy='complete_single_official_part4_question_with_spoken_answer_options_retained';corr=None
 out=R/f'audio-single/{i["audio_id"]}.wav'
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str(start),'-i',str(p),'-t',str(end-start),'-acodec','pcm_s16le',str(out)],capture_output=True,check=True)
 od=float(json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(out)]))['format']['duration']);subprocess.run(['ffmpeg','-v','error','-i',str(out),'-f','null','-'],check=True,capture_output=True)
 return {'audio_id':i['audio_id'],'file':str(out.relative_to(R)),'source_file':str(p.relative_to(R)),'source_url':u,'source_volume':i['source_volume'],'source_question':i['source_question'],'source_status':'official_original_speech_excerpt_no_resynthesis','source_segments':[{'start_seconds':start,'end_seconds':round(end,6)}],'source_sha256':sha(p),'sha256':sha(out),'duration_seconds':od,'question_ids':[i['question_id']],'question_range':str(i['number']),'play_count':2,'title':i['focus'],'section_title':f'第{i["number"]}题｜TOCFL官方听力｜Audio {i["audio_id"]}','source_script_pdf':f'source/A{i["source_volume"]}-listen.pdf','source_script_pdf_pages':i['source_script_pdf_pages'],'semantic_status':'official_question_script_key_and_source_label_mapping_reviewed','technical_decode':'pass','teacher_listening_accepted':False,'classroom_speaker_acceptance':False,'script':f'内容摘要（非逐字稿）：{i["evidence"]} 完整原稿见官方第{i["source_volume"]}辑听力文本，第{i["source_question"]}题。','clip_policy':policy,'first_second_rendition_waveform_correlation':corr,'speech_modified':False}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as e:rows=list(e.map(get,bank['items']))
(R/'audio-manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));(R/'audio-trim-check.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
with (R/'audio-map.csv').open('w') as f:
 w=csv.writer(f);w.writerow(['audio_id','audio_path','question_range','play_count','duration_seconds','sha256','source_type'])
 for a in rows:w.writerow([a['audio_id'],str((R/a['file']).relative_to(P)),a['question_range'],2,a['duration_seconds'],a['sha256'],'TOCFL官方原音单遍剪辑'])
sec={'assessment_id':bank['exam_id'],'version':1,'status':'PREPARED_NOT_SYNCED','sections':[{'id':f'w07-v1-g{i["number"]:02}','title':f'第{i["number"]}题｜TOCFL官方听力｜Audio {i["audio_id"]}','question_start':i['number'],'question_end':i['number'],'audio_ids':[i['audio_id']],'description':'先看本题图片或选项，再听录音，选出一个正确答案。每题录音播放两遍。'} for i in bank['items']]}
(R/'form-sections.json').write_text(json.dumps(sec,ensure_ascii=False,indent=2))
student=['# 一年级 W07｜第4—15课累计听力测验（审阅稿）','','共50题，每题2分，满分100分。先看本题图片或选项，再听录音，选出一个正确答案。每题录音播放两遍。','']
teacher=['# W07 第4—15课累计听力测验｜教师答案（审阅稿）','','本卷全部采用TOCFL官方入门基础级模拟题原题、原图、原音及评分键。仅重新编号；文字选项忠实转为简体。50题，每题2分，满分100分；每题播放两遍是本课堂安排。','','第1—40题类型的原音已保留完整第一遍，去掉来源题号、重复录音及冗长等待；原来口头呈现的题干和选项均保留。第四部分的完整单题及口头选项保留。完整官方脚本见source目录；下面为教师用答案依据摘要。','']
for i in bank['items']:
 student += [f'## {i["number"]}. {i["prompt"]}','']
 if i.get('option_image'):student += [f'![本题图片]({(P/i["option_image"]).as_posix()})','']
 student += [f'{chr(65+j)}. {o}' for j,o in enumerate(i['options'])]+['']
 teacher += [f'## 第{i["number"]}题｜答案{i["answer"]}｜2分',f'- 答案内容：{i["answer_text"]}',f'- 依据：{i["evidence"]}',f'- 来源：TOCFL Band A 第{i["source_volume"]}辑原第{i["source_question"]}题；题本PDF第{i["source_pdf_page"]}页；脚本PDF第'+ '、'.join(map(str,i['source_script_pdf_pages']))+'页。',f'- 音频：{i["audio_id"]}；播放两遍。',f'- 对应内容：第'+ '、'.join(x[-2:] for x in i['lesson_keys'])+f'课；{i["focus"]}。','']
(R/'student.md').write_text('\n'.join(student));(R/'teacher.md').write_text('\n'.join(teacher))
with (R/'topic-coverage.csv').open('w') as f:
 w=csv.writer(f);w.writerow(['lesson_key','question_numbers','coverage_limit'])
 for l in bank['lesson_keys']:w.writerow([l,'，'.join(str(i['number']) for i in bank['items'] if l in i['lesson_keys']),'身份辨认关联；未直接抽查姓名姓氏音节或国籍' if l.endswith(('04','05')) else '按相关交际主题抽样，不代表词语语法全覆盖'])
source={'record_type':'official_source_provenance_not_approval','retrieved_date':'2026-10-22','official_index':'https://tocfl.edu.tw/tocfl/index.php/teach/test/page/1','selection':'50 original questions from official TOCFL Band A volumes4/5; original options, images, answer positions and keys preserved; no HSK','official_sources':[],'question_source_ids':[i['audio_id'] for i in bank['items']],'topic_coverage':'topic-coverage.csv','human_gates':{'content_review':'pending','teacher_full_listening':'pending','classroom_speaker_acceptance':'pending','publication':'not_authorized'}}
for v in [4,5]:
 for typ in ['en_s','listen','answer']:
  p=R/f'source/A{v}-{typ}.pdf';source['official_sources'].append({'url':f'https://tocfl.edu.tw/tocfl/assets/files/mock/ls_mock{v}_test_BandA_{typ}.pdf','local_file':str(p.relative_to(R)),'sha256':sha(p)})
(R/'source-manifest.json').write_text(json.dumps(source,ensure_ascii=False,indent=2))
with (R/'score-sheet.csv').open('w') as f:
 w=csv.writer(f);w.writerow(['student_id','student_name']+[f'Q{i}' for i in range(1,51)]+['total_100'])
qa={'question_count':len(bank['items']),'points':sum(i['points'] for i in bank['items']),'audio_count':len(rows),'single_pass_audio_minutes':round(sum(a['duration_seconds'] for a in rows)/60,2),'two_pass_audio_minutes':round(sum(a['duration_seconds'] for a in rows)/30,2),'images':sum('option_image' in i for i in bank['items']),'numbering_contiguous':[i['number'] for i in bank['items']]==list(range(1,51)),'decode_all':'pass','source_audio_label_mapping':'live_official_map','original_keys':'official_ordered_key_verified','remote_sync':'root_integrator_pending','teacher_full_listening':'pending','classroom_speaker_acceptance':'pending'}
(R/'content-qa.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2));print(json.dumps(qa),flush=True)
