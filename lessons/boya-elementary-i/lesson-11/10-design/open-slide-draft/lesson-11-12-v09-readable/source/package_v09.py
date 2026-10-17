from pathlib import Path
import hashlib,json,zipfile
O=Path(__file__).resolve().parents[1]
files=[O/'lesson-11-12-实体课.html',O/'lesson-11-12-教师朗读稿.pdf',O/'lesson-11-12-教师速用说明.md',O/'README.md']
files += sorted(p for p in (O/'assets').rglob('*') if p.is_file())
entries=[]
for p in files:
 rel=p.relative_to(O).as_posix()
 entries.append({'path':rel,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size})
manifest={'version':'v09','stage':'design draft; no authority/release promotion','pages':21,'activities':14,'teacher_reading_pdf_pages':6,'files':entries}
(O/'source/package-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
zip_path=O/'lesson-11-12-教材包.zip'
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED) as z:
 for e in entries:z.write(O/e['path'],e['path'])
 z.write(O/'source/package-manifest.json','package-manifest.json')
with zipfile.ZipFile(zip_path) as z:
 assert z.testzip() is None
 for e in entries:assert hashlib.sha256(z.read(e['path'])).hexdigest()==e['sha256'],e['path']
qa={'status':'passed','version':'v09','included_files':len(entries),'zip_sha256':hashlib.sha256(zip_path.read_bytes()).hexdigest(),'all_file_hashes_match':True}
(O/'qa/package-check.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2)+'\n')
bm=O/'source/build-manifest.json'; d=json.loads(bm.read_text())
d.update(version='v09-unified-icons-projector-readable',page_count=21,activity_count=14,visual_scope='unified generated textbook-style icons, larger classroom text, centered image-only comics, varied practice wind-force values',html_sha256=hashlib.sha256((O/'lesson-11-12-实体课.html').read_bytes()).hexdigest(),package_manifest_sha256=hashlib.sha256((O/'source/package-manifest.json').read_bytes()).hexdigest())
bm.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(qa,ensure_ascii=False))
