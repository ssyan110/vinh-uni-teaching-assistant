#!/usr/bin/env python3
"""Retired compatibility entry point.

This coordinator is intentionally disabled because it predates the canonical
lesson context, gate, run-packet, and promotion workflow. It remains in the
repository as historical evidence only. Use ``scripts/lessonctl.py`` and the
canonical workflow contract instead; do not bypass the guarded workflow with a
second coordinator.
"""
from __future__ import annotations
import argparse, json, os, shutil, subprocess, sys, time, uuid, zipfile
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]

def parse_args():
 p=argparse.ArgumentParser(); p.add_argument('--lesson-key',required=True); p.add_argument('--approval-file',required=True); p.add_argument('--workers',type=int,default=2,choices=[2,3]); return p.parse_args()

def fail(state,msg):
 state['phase']='blocked'; state['stop_reason']=msg; (Path(state['run_dir'])/'state.json').write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n'); raise SystemExit(msg)

def expected_assets(lesson_dir):
    source=json.loads((lesson_dir/'00-source/canonical-source.json').read_text())
    number=int(lesson_dir.name.split('-')[-1])
    out=[(f'L{number:02d}-cover',f'lesson-{number:02d}-cover-gathering.png','cover'),(f'L{number:02d}-context-01',f'lesson-{number:02d}-context-01.png','short_text_context'),(f'L{number:02d}-context-02',f'lesson-{number:02d}-context-02.png','short_text_context'),(f'L{number:02d}-context-03',f'lesson-{number:02d}-context-03.png','short_text_context')]
    for e in source['sections'][0]['entries']:
        n=int(e['no']); out.append((f'L{number:02d}-V{n:02d}',f'l{number:02d}-vocab-dedicated-{n:02d}.png','vocabulary'))
    return out

def validate_png(p,cat):
 if not p.exists() or p.read_bytes()[:8]!=b'\x89PNG\r\n\x1a\n': return False
 try:
  with Image.open(p) as im:
   min_w,min_h=(1400,800) if cat!='vocabulary' else (800,800)
   return im.format=='PNG' and im.width>=min_w and im.height>=min_h and im.mode in ('RGB','RGBA')
 except Exception: return False

def main():
 raise SystemExit('Retired: use scripts/lessonctl.py with docs/workflow/canonical-workflow-contract.md')

 # Historical implementation retained below for audit only; unreachable by design.
 a=parse_args();
 if ':' not in a.lesson_key: raise SystemExit('lesson-key must be <textbook_id>:<lesson_id>')
 textbook,lesson_id=a.lesson_key.split(':',1); lesson_dir=ROOT/'lessons'/textbook/lesson_id
 approval=Path(a.approval_file); approval=approval if approval.is_absolute() else ROOT/approval
 if not approval.exists(): raise SystemExit(f'Approval file missing; no production started: {approval}')
 ap=json.loads(approval.read_text())
 if ap.get('lesson_key')!=a.lesson_key or ap.get('approved') is not True or not ap.get('approved_by') or not ap.get('approved_at'):
  raise SystemExit('Approval gate failed: require matching lesson_key, approved=true, approved_by, approved_at')
 run=ROOT/'.agent/runs'/f'{time.strftime("%Y%m%d-%H%M%S")}-{uuid.uuid4().hex[:8]}'; run.mkdir(parents=True)
 state={'run_id':run.name,'lesson_key':a.lesson_key,'phase':'defined','run_dir':str(run),'approval_file':str(approval),'workers':[],'success_criteria':['approval verified','all image workers succeed','all expected PNGs pass validation','manifest promotion succeeds','both PPTX builds and package QA succeed'],'deliverable_ready':False}
 (run/'state.json').write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n')
 expected=expected_assets(lesson_dir); staging=run/'staging'; staging.mkdir();
 # Two independent lanes: context/cover and vocabulary. Each lane has its own output root.
 groups=[expected[i::a.workers] for i in range(a.workers)]
 prompts=[]
 for idx,group in enumerate(groups,1):
  items='\n'.join(f'- {aid}: {fn} ({cat})' for aid,fn,cat in group)
  out=staging/f'worker-{idx}'; out.mkdir()
  prompts.append((idx,out,f'''You are image worker {idx} for approved lesson {a.lesson_key}. Approval has already been granted. Work only in {out}. Use the image_generate tool for every asset; do not use Pillow, SVG, vector drawings, icons, placeholders, stock substitutes, or unrelated lesson assets. Generate these exact PNG files:\n{items}\nUse a consistent lesson-specific watercolor/colored-pencil textbook illustration style, no readable text/logos/watermarks. After generation, inspect every image with vision, write {out}/worker-result.json with {{"status":"success","ai_visual_qa":"passed","files":[...]}}, and stop with status failed if image generation is unavailable. Do not write outside {out}.'''))
 procs=[]
 for idx,out,prompt in prompts:
  cmd=['hermes','chat','-Q','-t','image_gen,terminal,file,vision','-q',prompt]
  log=(run/f'worker-{idx}.log').open('w')
  procs.append((idx,out,subprocess.Popen(cmd,cwd=ROOT,stdout=log,stderr=subprocess.STDOUT),log))
  state['workers'].append({'id':idx,'output':str(out),'status':'running'})
 state['phase']='verifying'; (run/'state.json').write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n')
 for idx,out,proc,log in procs:
  rc=proc.wait(); log.close(); result=out/'worker-result.json';
  state['workers'][idx-1].update({'returncode':rc,'result':str(result)})
  if rc!=0 or not result.exists(): fail(state,f'worker {idx} failed or did not return worker-result.json')
  data=json.loads(result.read_text())
  if data.get('status')!='success' or data.get('ai_visual_qa')!='passed': fail(state,f'worker {idx} AI visual QA failed')
  for aid,fn,cat in groups[idx-1]:
   if not validate_png(out/fn,cat): fail(state,f'invalid or missing staged PNG: {fn}')
 # Atomic promotion only after all workers pass.
 assets_dir=lesson_dir/'10-design/assets'; assets_dir.mkdir(parents=True,exist_ok=True)
 manifest_path=assets_dir/'image-manifest.json'; manifest=json.loads(manifest_path.read_text()); records=[]
 for aid,fn,cat in expected:
  src=next((staging/f'worker-{i}'/fn for i in range(1,a.workers+1) if (staging/f'worker-{i}'/fn).exists()),None)
  if src is None: fail(state,f'promote source missing: {fn}')
  assert src is not None
  dst=assets_dir/fn; shutil.copy2(src,dst)
  import hashlib; records.append({'asset_id':aid,'file':fn,'category':cat,'status':'ai_qa_passed','can_enter_ppt':True,'sha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'source_kind':'ai_image_generation_provider','ai_visual_qa':'passed'})
 manifest['assets']=records; manifest['pending_assets']=[]; manifest['approval_boundary']['generation_status']='ai_generated_and_qa_passed'; manifest['approval_boundary']['authorization_status']='lesson_approved_ai_pipeline'; manifest['approval_boundary']['can_enter_ppt']=True; manifest['approval_boundary']['reason']='Lesson approval, parallel image generation, and AI visual QA passed.'
 manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 # Build only after atomic image promotion.
 build=['node','scripts/build_l23_pptx_drafts.js','--lesson-key',a.lesson_key]
 result=subprocess.run(build,cwd=ROOT,text=True,capture_output=True)
 (run/'build.stdout').write_text(result.stdout); (run/'build.stderr').write_text(result.stderr)
 if result.returncode!=0: fail(state,'PPTX build failed; no complete product is deliverable')
 with zipfile.ZipFile(lesson_dir/'10-design/pptx-draft/online'/f'{lesson_id}-在线预习.pptx') as z:
  if z.testzip() is not None: fail(state,'online PPTX ZIP QA failed')
 with zipfile.ZipFile(lesson_dir/'10-design/pptx-draft/face-to-face'/f'{lesson_id}-实体课.pptx') as z:
  if z.testzip() is not None: fail(state,'face-to-face PPTX ZIP QA failed')
 state['phase']='complete'; state['deliverable_ready']=True; state['completed_at']=time.strftime('%Y-%m-%dT%H:%M:%S%z'); (run/'state.json').write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'status':'complete','run_dir':str(run),'lesson_key':a.lesson_key,'deliverables':[str(lesson_dir/'10-design/pptx-draft/online'/f'{lesson_id}-在线预习.pptx'),str(lesson_dir/'10-design/pptx-draft/face-to-face'/f'{lesson_id}-实体课.pptx')]},ensure_ascii=False))
if __name__=='__main__': main()
