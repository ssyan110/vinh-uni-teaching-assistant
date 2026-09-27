"""Real model comparison against a deliberately defective incumbent in a scoped lab."""
import importlib.util
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('evolve',ROOT/'evolve.py');e=importlib.util.module_from_spec(s);s.loader.exec_module(e)
lab=ROOT.parent/'runtime-evidence/learning-pilot-v2'
lab.mkdir(exist_ok=True)
e.STATE=lab/'state';e.LEARNED=lab/'.agents/skills'
name='learned-fixture-export'
e.STATE.mkdir(exist_ok=True)
legacy="""---
name: learned-fixture-export
description: Download exports from the local Aurora fixture API.
---

# Aurora export

After an export job reports ready, download its artifact using artifact_id. If the job is pending, poll it before download. Never overwrite an existing destination without authorization.
"""
# Seed a known defective fixture, not a learned production skill.
e.write(e.target(name),legacy)
e.write(e.STATE/'registry.json',{name:{'hash':e.digest(legacy),'description':'Legacy fixture only','active':True,'run':'fixture'}})
spec=lab/'spec.json'
e.write(spec,{'evidence': 'Executed the local fixture contract check: fetching by artifact_id failed with Unknown fetch key; fetching by job_id returned the expected exported bytes. This is a synthetic fixture protocol, not a production API. The pending job remained unavailable. See fixture-evidence.json.', 'cases':[
 {'kind':'target','prompt':'Aurora fixture export returned {"status":"ready","job_id":"job-104","artifact_id":"asset-602"}. Choose the fetch request for this export.', 'options':{'a':'fetch("asset-602")','b':'fetch("job-104")','c':'fetch("job-104/asset-602")'},'expected':'b'},
 {'kind':'regression','prompt':'Aurora fixture export returned {"status":"pending","job_id":"job-205","artifact_id":"asset-702"}. What happens next?', 'options':{'a':'fetch("job-205") immediately','b':'fetch("asset-702") immediately','c':'Poll job-205 until ready, then fetch using the documented key.'},'expected':'c'},
 {'kind':'heldout','prompt':'Two Aurora fixture exports completed. The current requested export is {"status":"ready","job_id":"job-306","artifact_id":"asset-802"}; an older export used job-104. Choose the current download request.', 'options':{'a':'fetch("job-104")','b':'fetch("asset-802")','c':'fetch("job-306")'},'expected':'c'}]})
# Execute the actual local fixture contract; this is not a mocked model response.
jobs={'job-104':{'status':'ready','bytes':'export-one'},'job-205':{'status':'pending','bytes':None},'job-306':{'status':'ready','bytes':'export-two'}}
def fetch(key):
 if key not in jobs: raise ValueError('Unknown fetch key')
 if jobs[key]['status']!='ready':raise ValueError('Export is not ready')
 return jobs[key]['bytes']
evidence=[]
for key in ['asset-602','job-104','job-205','job-306']:
 try:evidence.append({'key':key,'result':fetch(key)})
 except ValueError as ex:evidence.append({'key':key,'error':str(ex)})
e.write(lab/'fixture-evidence.json',evidence)
r=e.prepare(name,spec)['run']
e.write(lab/'pilot.json',{'run':r,'fixture':'Local Aurora export fixture, isolated project skill root','scope':'synthetic protocol recovery; real Codex decision probes'})
candidate=lab/'candidate.md'
e.write(candidate,"""---
name: learned-fixture-export
description: Download exports from the local Aurora fixture API after observing its fetch-key contract.
---

# Aurora fixture export

This procedure applies only to the local Aurora test fixture. Poll the requested export job until status is ready. Its fetch operation takes job_id, even when the response also contains artifact_id. Pass the current requested job's job_id to fetch; do not substitute artifact_id or an older job. Check the downloaded bytes against the expected export. Pending jobs cannot be fetched. Never overwrite an existing destination without authorization.
""")
e.stage(r,candidate)
result=e.evaluate(r)
if result['status']=='validated':result.update(e.promote(r))
e.write(lab/'result.json',result)
print(json.dumps(result))
