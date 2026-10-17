from pathlib import Path
import hashlib,json,zipfile
O=Path(__file__).resolve().parents[1]
(O/'README.md').write_text('''# 第11—12课｜实体课教材包 v06

打开 lesson-11-12-实体课.html；保留 assets 文件夹在同一目录。方向键、空格或页面下方按钮翻页，不需联网。统一首页使用第11—12课（21页）入口。

- 课件：21页；11个本课活动＋3题综合口语。每活动最多两页。
- 教师朗读稿PDF：6个活动，8段完整消息，标有课件页码与读法。只给教师，不投影全文。
- 教师速用说明：各活动答案、示范、帮助、反馈与课堂预算。
- 两个“看图说故事”都是单人练习，六格各在同一页。
- 活动11-1至11-5按展示顺序连续编号；封面主题“天气与日常活动”，另行生成新插画。
- 课本七天天气表直接使用原图；11-5自由选择越南城市，查询真实天气。其余朗读天气、日程和课表为教学模拟。

内容已获Adam对v06的批准；本包为本地课件输出，不代表已完成教师实播、课堂试教或正式release。检查证据留在项目qa目录。
''')
files=['lesson-11-12-实体课.html','lesson-11-12-教师朗读稿.pdf','lesson-11-12-教师速用说明.md','README.md','assets/story-lesson-11.png','assets/story-lesson-12.png','assets/textbook-week-weather.png','assets/cover-weather-daily-v06.png']
manifest=dict(version='v06',pages=21,activities=14,pdf_pages=6,reading_messages=8,files=[dict(path=f,sha256=hashlib.sha256((O/f).read_bytes()).hexdigest()) for f in files])
(O/'source/package-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(O/'lesson-11-12-教材包.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in files:z.write(O/f,f)
 z.write(O/'source/package-manifest.json','package-manifest.json')
with zipfile.ZipFile(O/'lesson-11-12-教材包.zip') as z:
 assert z.testzip() is None
 for f in manifest['files']:assert hashlib.sha256(z.read(f['path'])).hexdigest()==f['sha256']
(O/'qa/package-check.json').write_text(json.dumps(dict(status='passed',all_hashes_match=True,files=len(files),zip_sha256=hashlib.sha256((O/'lesson-11-12-教材包.zip').read_bytes()).hexdigest()),indent=2)+'\n')
print('ZIP integrity and eight file hashes verified')
