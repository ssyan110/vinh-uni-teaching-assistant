from pathlib import Path
import json,whisper,torch
R=Path(__file__).resolve().parent;(R/'source'/'asr').mkdir(exist_ok=True)
torch.set_num_threads(4);m=whisper.load_model('/Users/ssyan110/.cache/whisper/base.pt',device='cpu')
for a in json.loads((R/'audio-manifest.json').read_text())[5:]:
 p=R/'source'/'asr'/f'{a["audio_id"]}.json'
 if p.exists():d=json.loads(p.read_text())
 else:d=m.transcribe(str(R/a['file']),language='zh',fp16=False,condition_on_previous_text=False);p.write_text(json.dumps(d,ensure_ascii=False,indent=2))
 print(a['audio_id'],d['text'],flush=True)
