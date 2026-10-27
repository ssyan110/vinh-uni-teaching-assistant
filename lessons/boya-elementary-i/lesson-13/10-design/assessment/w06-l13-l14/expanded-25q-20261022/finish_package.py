from pathlib import Path
import json,re,hashlib,shutil,subprocess,csv
R=Path(__file__).resolve().parent;ROOT=Path.cwd(); B=json.loads((R/'items.json').read_text()); old=json.loads((R.parent/'audio-manifest.json').read_text()); sections=[]; manifest=[]
h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for a in old[:5]:
 a=dict(a);src=R.parent/a['file'];dst=R/a['file'];dst.parent.mkdir(exist_ok=True);shutil.copy2(src,dst)
 group=[x for x in B['items'] if x['audio_id']==a['audio_id']];a['question_ids']=[x['id'] for x in group];a['question_range']=str(group[0]['number']) if len(group)==1 else f'{group[0]["number"]}–{group[-1]["number"]}'
 manifest.append(a)
for x in B['items'][14:]:
 aid=x['audio_id'];src=R/'source'/'audio'/f'{aid}.mp3';z=(R/'source'/'audio'/f'{aid}-silence.txt').read_text()
 sil=[(float(a),float(d)) for a,d in re.findall(r'silence_end: ([\d.]+) \| silence_duration: ([\d.]+)',z) if float(d)>4]
 assert sil,(aid,'missing repeat gap');end=sil[0][0]-sil[0][1]+.25;start=2.2
 dst=R/'audio'/f'{aid}.mp3';subprocess.run(['ffmpeg','-v','error','-y','-ss',str(start),'-to',str(end),'-i',str(src),'-c:a','libmp3lame','-q:a','2',str(dst)],check=True)
 a=dict(audio_id=aid,file=str(dst.relative_to(R)),title=x['focus'],source_url=next(z['source_url'] for z in json.loads((R/'source'/'raw-audio-map.json').read_text()) if z['audio_id']==aid),source_script_url=x['source_script_url'],source_volume=x['source_volume'],source_question=x['source_question'],source_sha256=h(src),sha256=h(dst),source_segments=[dict(start_seconds=start,end_seconds=round(end,3))],duration_seconds=round(end-start,3),script=x['script'],source_status='TOCFL_official_original_audio',semantic_status='official_script_and_key_compared; human_listening_pending',speech_modified=False,teacher_listening_accepted=False,lesson_keys=x['lesson_keys'],question_ids=[x['id']],question_range=str(x['number']),play_count=2,section_title=f'第{x["number"]}题｜TOCFL官方听力｜Audio {aid}',clipping_note='Remove announced source question number and second identical repetition; retain first complete dialogue and original spoken question where present. End located at first 5-second repeat pause; teacher hearing remains pending.')
 manifest.append(a)
for i,a in enumerate(manifest,1):
 group=[x for x in B['items'] if x['audio_id']==a['audio_id']]
 sections.append(dict(id=f'w06-v4-g{i:02}',title=a['section_title'],question_start=group[0]['number'],question_end=group[-1]['number'],audio_ids=[a['audio_id']],description='先看本组题目，再听录音。录音播放两遍。',play_count=2))
(R/'audio-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(R/'source'/'prepared-form-sections.json').write_text(json.dumps(dict(assessment_id=B['exam_id'],version=4,variant_id=B['variant_id'],form_id='1M33yrhHQHPAI2JE66VqO2nyuxNZQChUOwyWXIHGFnSU',status='PREPARED_PENDING_SYNC',sections=sections),ensure_ascii=False,indent=2)+'\n')
with (R/'audio-map.csv').open('w') as f:
 w=csv.writer(f);w.writerow(['question_id','number','audio_id','audio_file','group_number','play_count','points'])
 for x in B['items']:
  ai=next(i for i,a in enumerate(manifest) if a['audio_id']==x['audio_id']);a=manifest[ai];w.writerow([x['id'],x['number'],x['audio_id'],a['file'],ai+1,2,4])
print('manifest ready',len(manifest))
