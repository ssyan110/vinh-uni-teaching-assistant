"""Read-only installed-runtime discovery via the supported app-server protocol."""
import json
import os
import subprocess
import sys

transport=['proxy'] if os.getenv('EVOLUTION_RPC_DAEMON')=='1' else ['--stdio']
p=subprocess.Popen(['/Applications/ChatGPT.app/Contents/Resources/codex','app-server',*transport],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True)
def request(n,method,params):
 p.stdin.write(json.dumps({'jsonrpc':'2.0','id':n,'method':method,'params':params})+'\n');p.stdin.flush()
 while True:
  line=p.stdout.readline()
  if not line:raise RuntimeError('app-server exited')
  data=json.loads(line)
  if data.get('id')==n:return data
try:
 request(1,'initialize',{'clientInfo':{'name':'skill_evolution_verification','version':'1.0'},'capabilities':{'experimentalApi':True}})
 p.stdin.write(json.dumps({'jsonrpc':'2.0','method':'initialized'})+'\n');p.stdin.flush()
 method=sys.argv[1]
 params=json.loads(sys.argv[2])
 print(json.dumps(request(2,method,params)))
finally:
 p.terminate()
 try:p.wait(timeout=5)
 except subprocess.TimeoutExpired:pass
