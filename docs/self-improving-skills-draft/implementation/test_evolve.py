"""Offline safety/state tests; probe stubs are explicitly not model-quality evidence."""
import importlib.util
import json
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('evolve', ROOT/'evolve.py')
e = importlib.util.module_from_spec(spec); spec.loader.exec_module(e)

def fails(fn, term):
    try: fn()
    except ValueError as ex: assert term in str(ex), str(ex)
    else: raise AssertionError('Expected refusal: ' + term)

base = Path(tempfile.mkdtemp(prefix='evolution-test-', dir=ROOT)).resolve()
e.STATE = base/'state'; e.LEARNED = base/'learned'; e.SKILL = ROOT/'SKILL.md'
e.STATE.mkdir()
name='learned-fixture-check'
suite={'evidence':'Fixture-only observation: sample download previously failed verification.', 'cases':[
    {'kind':kind,'prompt':'Choose a verification step.', 'options':{'a':'Check the bytes','b':'Assume success'},'expected':'a'}
    for kind in ['target','regression','heldout']]}
p=base/'spec.json'; e.write(p,suite)
c=base/'candidate.md'; e.write(c,'---\nname: '+name+'\ndescription: Verify a fixture download.\n---\nCheck the downloaded bytes.\n')
payload={'session_id':'fixture','turn_id':'one','cwd':str(base),'hook_event_name':'UserPromptSubmit','prompt':'Build a small fixture'}
assert 'additionalContext' in e.hook(payload)['hookSpecificOutput']
assert e.hook(dict(payload,hook_event_name='Stop')) == {}
for _ in range(2): e.hook(dict(payload,hook_event_name='PostToolUse'))
assert e.hook(dict(payload,hook_event_name='Stop'))['decision']=='block'
assert e.hook(dict(payload,hook_event_name='Stop')) == {}
assert e.hook(dict(payload,turn_id='two',hook_event_name='Stop',stop_hook_active=True)) == {}
fails(lambda:e.prepare('../escape',p),'Only learned-')
r=e.prepare(name,p)['run']; e.stage(r,c)
# A deterministic stub isolates gate behavior from model sampling.
e.probe=lambda procedure,case,cwd,output: {'choice':'a' if procedure else 'b','reason':'stub','passed':bool(procedure)}
assert e.evaluate(r)['status']=='validated'
assert e.promote(r)['status']=='promoted'
assert e.target(name).read_text()==c.read_text()
ctx=e.hook(dict(payload,turn_id='three'))['hookSpecificOutput']['additionalContext']; assert name in ctx
assert e.rollback(r)['status']=='reverted'; assert not e.target(name).exists()
assert (e.run_dir(r)/'withdrawn.md').exists()
# Failed comparison never promotes.
r=e.prepare(name,p)['run']; e.stage(r,c)
e.probe=lambda *args: {'choice':'b','reason':'stub','passed':False}
assert e.evaluate(r)['status']=='rejected'; fails(lambda:e.promote(r),'No intact')
fails(lambda:e.stage(r,c),'Held-out failure')
# Frozen suite and candidate modifications are detected.
r=e.prepare(name,p)['run']; e.stage(r,c)
f=e.run_dir(r)/'spec.json'; bad=e.read(f);bad['evidence']+=' tampered';e.write(f,bad)
fails(lambda:e.evaluate(r),'Frozen')
r=e.prepare(name,p)['run']; e.stage(r,c)
e.probe=lambda procedure,*args: {'choice':'a','reason':'stub','passed':bool(procedure)}
e.evaluate(r)
e.target(name).parent.mkdir(parents=True,exist_ok=True);e.target(name).write_text('User edit')
fails(lambda:e.promote(r),'Concurrent')
fails(lambda:e.prepare(name,p),'Unregistered')
# No symlink escape.
link=base/'link';link.symlink_to(base/'state',target_is_directory=True)
fails(lambda:e.safe(link/'file'),'Unsafe')
# Restore a prior registered version, and refuse intervening edits on rollback.
e.target(name).rename(base/'preserved-user-edit.md')
old=c.read_text().replace('Check the downloaded bytes.', 'Inspect the downloaded bytes and preserve names.')
e.write(e.target(name),old)
e.write(e.STATE/'registry.json',{name:{'hash':e.digest(old),'description':'Old version','active':True,'run':'seed'}})
r=e.prepare(name,p)['run'];e.stage(r,c)
e.probe=lambda procedure,*args: {'choice':'a','reason':'stub','passed':procedure==c.read_text()}
assert e.evaluate(r)['status']=='validated';e.promote(r)
e.write(e.target(name),'Intervening edit')
fails(lambda:e.rollback(r),'Intervening')
e.write(e.target(name),c.read_text())
e.rollback(r);assert e.target(name).read_text()==old
# A modified evaluation receipt cannot authorize promotion.
r=e.prepare(name,p)['run'];e.stage(r,c);e.evaluate(r)
report=e.run_dir(r)/'evaluation.json'; data=e.read(report);data['limitation']='tampered';e.write(report,data)
fails(lambda:e.promote(r),'No intact')
print(json.dumps({'status':'passed','coverage':['bounded hooks','retrieval metadata','path rejection','promotion','withdrawal','failed comparison','frozen suite','concurrent edits','symlink rejection','prior-version restoration','rollback conflict','tampered receipt','held-out tuning refusal'],'fixture_root':str(base),'probe_kind':'stub; not real model evaluation'}))
