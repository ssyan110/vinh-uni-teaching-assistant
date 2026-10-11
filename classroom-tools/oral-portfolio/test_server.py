import base64, io, json, tempfile, threading, unittest, urllib.request, urllib.error, zipfile
from pathlib import Path
from unittest.mock import patch
from server import Store, ROOT, serve, MAX_AUDIO, MAX_TOTAL, audio_bytes

WAV = b'RIFF'+(36).to_bytes(4,'little')+b'WAVEfmt '+(16).to_bytes(4,'little')+b'\x01\x00\x01\x00'+(8000).to_bytes(4,'little')+(16000).to_bytes(4,'little')+b'\x02\x00\x10\x00data'+(0).to_bytes(4,'little')
class StoreTests(unittest.TestCase):
 def setUp(self):
  (ROOT/'qa/test-data').mkdir(exist_ok=True); self.temp=tempfile.TemporaryDirectory(dir=ROOT/'qa/test-data'); self.store=Store(self.temp.name)
  self.change('class',name='合成班'); self.cls=self.store.snapshot()['classes'][0]['id']
  self.change('roster',class_id=self.cls,csv='學號,姓名\nS001,合成學生\nS002,合成學生乙')
  self.student=self.store.snapshot()['students'][0]['id']; self.change('task',class_id=self.cls,title='合成任務',lesson_key='boya-quasi-intermediate-i:lesson-01',external=False); self.task=self.store.snapshot()['tasks'][0]['id']
 def tearDown(self): self.store.db.close(); self.temp.cleanup()
 def change(self,action,**data): return self.store.mutate(action,dict(data,revision=self.store.snapshot()['revision']))
 def take(self,**extra): return self.change('take',student_id=self.student,task_id=self.task,stage='first',mime='audio/wav',audio=base64.b64encode(WAV).decode(),evidence='合成證據',feedback='合成回饋',**extra)
 def test_identity_and_pairing(self):
  self.change('roster',class_id=self.cls,csv='學號,姓名\nS001,更新姓名'); self.assertEqual(self.store.snapshot()['students'][0]['id'],self.student)
  self.take(); first=self.store.snapshot()['takes'][0]
  data={'student_id':self.student,'task_id':self.task,'stage':'redo','first_id':first['id'],'mime':'audio/wav','audio':base64.b64encode(WAV).decode()}
  self.change('take',**data); self.assertEqual(self.store.snapshot()['takes'][1]['first_id'],first['id'])
  data['student_id']=self.store.snapshot()['students'][1]['id']
  with self.assertRaises(ValueError): self.change('take',**data)
  with self.assertRaises(ValueError): self.change('task',class_id=self.cls,title='bad',lesson_key='lesson-01')
  self.change('class',name='另班'); cls2=self.store.snapshot()['classes'][1]['id']; self.change('roster',class_id=cls2,csv='學號,姓名\nS001,另一學生'); self.assertNotEqual(self.store.snapshot()['students'][-1]['id'],self.student)
 def test_backup_roundtrip_restart_and_restore_snapshot(self):
  self.take(); backup=self.store.backup(); before=self.store.snapshot(); self.change('feedback',take_id=before['takes'][0]['id'],evidence='修改',feedback='')
  restored=self.store.restore(backup,self.store.snapshot()['revision']); self.assertEqual(restored['takes'],before['takes']); self.assertEqual(self.store.db.execute('SELECT body FROM audio').fetchone()[0],WAV)
  self.assertTrue((Path(self.temp.name)/'backups'/restored['restore_backup']).exists())
  self.store.db.close(); self.store=Store(self.temp.name); self.assertEqual(self.store.snapshot()['takes'],before['takes'])
 def test_corrupt_traversal_duplicate_and_missing_audio(self):
  self.take(); backup=self.store.backup(); before=self.store.snapshot()
  with self.assertRaises(ValueError): self.store.restore(b'not zip',before['revision'])
  for extra in ['../escape.wav','/absolute.wav','audio/unknown.wav']:
   out=io.BytesIO()
   with zipfile.ZipFile(io.BytesIO(backup)) as src,zipfile.ZipFile(out,'w') as dst:
    for info in src.infolist(): dst.writestr(info.filename,src.read(info.filename))
    dst.writestr(extra,WAV)
   with self.assertRaises(ValueError): self.store.restore(out.getvalue(),before['revision'])
  self.assertEqual(self.store.snapshot(),before)
 def test_mime_size_roster_and_stale_revision(self):
  for mime in ['audio/flac','text/html','audio/webm']:
   with self.assertRaises(ValueError): audio_bytes(WAV,mime)
  with self.assertRaises(ValueError): audio_bytes(b'RIFF'+b'x'*MAX_AUDIO,'audio/wav')
  with self.assertRaises(ValueError): self.store.preview('學號,姓名\nx,A\nx,B')
  rev=self.store.snapshot()['revision']; self.change('class',name='新班')
  with self.assertRaises(ValueError): self.store.mutate('class',{'name':'舊視窗','revision':rev})
 def test_concurrent_writes_one_revision(self):
  rev=self.store.snapshot()['revision']; results=[]
  def update():
   try:self.store.mutate('class',{'name':'並行','revision':rev});results.append('ok')
   except ValueError:results.append('stale')
  a=threading.Thread(target=update);b=threading.Thread(target=update);a.start();b.start();a.join();b.join();self.assertCountEqual(results,['ok','stale'])
 def test_total_audio_quota_rejects_without_partial_write(self):
  self.take(); before=self.store.snapshot()
  with patch('server.MAX_TOTAL',len(WAV)):
   with self.assertRaises(ValueError):self.take()
  self.assertEqual(self.store.snapshot(),before)
  self.assertEqual(self.store.db.execute('SELECT count(*) FROM audio').fetchone()[0],1)
 def test_metadata_and_collection_limit_roll_back_new_audio(self):
  before=self.store.snapshot()
  cap=len(self.store.capacity({k:v for k,v in before.items() if k!='revision'},before['revision']))
  with patch('server.MAX_METADATA',cap):
   with self.assertRaises(ValueError):self.take()
  self.assertEqual(self.store.snapshot(),before)
  self.assertEqual(self.store.db.execute('SELECT count(*) FROM audio').fetchone()[0],0)
  with patch('server.MAX_COLLECTION',1):
   with self.assertRaises(ValueError):self.change('class',name='超過集合上限')
  self.assertEqual(self.store.snapshot(),before)
  self.take()
  with patch('server.MAX_TOTAL',len(WAV)):
   self.store.validate_backup(self.store.backup())
 def test_two_connections_reject_stale_writes(self):
  second=Store(self.temp.name)
  try:
   revision=second.snapshot()['revision']; self.change('class',name='第一連線')
   with self.assertRaises(ValueError): second.mutate('class',{'name':'過期第二連線','revision':revision})
   self.assertEqual(second.snapshot(),self.store.snapshot())
  finally: second.db.close()
 def test_http_host_origin_and_audio_bytes(self):
  self.take(); http=serve(Path(self.temp.name)/'http',0);thread=threading.Thread(target=http.serve_forever,daemon=True);thread.start();base=f'http://127.0.0.1:{http.server_port}'
  try:
   with urllib.request.urlopen(base+'/api/state') as r:self.assertIn('revision',json.load(r))
   for headers in [{'Host':'evil.example'},{'Origin':'https://evil.example'},{'Sec-Fetch-Site':'cross-site'}]:
    with self.assertRaises(urllib.error.HTTPError):urllib.request.urlopen(urllib.request.Request(base+'/api/state',headers=headers))
   with urllib.request.urlopen(base+'/api/backup') as r:self.assertEqual(r.headers['Content-Type'],'application/zip')
   backup=self.store.backup()
   with patch('server.MAX_BODY',50):
    request=urllib.request.Request(base+'/api/restore',data=backup,headers={'Content-Type':'application/zip','X-Portfolio-Revision':'0'})
    with urllib.request.urlopen(request) as r: restored=json.load(r)
    self.assertEqual(restored['takes'][0]['size'],len(WAV))
   with urllib.request.urlopen(base+'/api/audio/'+restored['takes'][0]['id']) as r:self.assertEqual(r.read(),WAV)
   request=urllib.request.Request(base+'/api/class',data=b'[]',headers={'Content-Type':'application/json'})
   with self.assertRaises(urllib.error.HTTPError):urllib.request.urlopen(request)

  finally:http.shutdown();http.server_close();http.store.db.close();thread.join()
if __name__=='__main__':unittest.main()
