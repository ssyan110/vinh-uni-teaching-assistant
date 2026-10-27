from pathlib import Path
import json,urllib.request,concurrent.futures,shutil,subprocess,re,hashlib
R=Path(__file__).resolve().parent; (R/'audio').mkdir(exist_ok=True);(R/'source'/'audio').mkdir(exist_ok=True)
b=json.loads((R/'items.json').read_text()); urls=json.loads((Path.cwd()/'lessons/boya-elementary-i/lesson-15/10-design/assessment/w07-l04-l15-20261022/source/official-audio-map.json').read_text())
sel=[x for x in b['items'] if x.get('source_volume')]
def dl(x):
 aid=x['audio_id'];v=x['source_volume'];q=x['source_question'];f=R/'source'/'audio'/f'{aid}.mp3';u=urls[str(v)][str(q)]
 old=Path.cwd()/f'.tmp/w06-mixed-official/sources/A{v}-Q{q}.mp3'
 if not f.exists():
  if old.exists():shutil.copy2(old,f)
  else:
   with urllib.request.urlopen(u,timeout=60) as h:f.write_bytes(h.read())
 dur=float(subprocess.check_output(['ffprobe','-v','quiet','-show_entries','format=duration','-of','csv=p=0',str(f)]))
 z=subprocess.run(['ffmpeg','-hide_banner','-i',str(f),'-af','silencedetect=noise=-38dB:d=1.5','-f','null','-'],capture_output=True,text=True).stderr
 (R/'source'/'audio'/f'{aid}-silence.txt').write_text(z)
 print(aid,'dur',dur,[(a,c) for a,c in re.findall(r'silence_end: ([\d.]+) \| silence_duration: ([\d.]+)',z)],flush=True)
 return dict(audio_id=aid,source_url=u,source_file=str(f.relative_to(R)),duration=dur)
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:r=list(ex.map(dl,sel))
(R/'source'/'raw-audio-map.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
