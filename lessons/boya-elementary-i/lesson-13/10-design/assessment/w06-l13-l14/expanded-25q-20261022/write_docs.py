from pathlib import Path
import json,csv,hashlib
R=Path(__file__).resolve().parent;b=json.loads((R/'items.json').read_text()); ss=json.loads((R/'form-sections.json').read_text())['sections']; old=json.loads((R.parent/'audio-manifest.json').read_text())
student=['# 一年级 W06｜第13—14课听力测验','共25题，每题4分，满分100分。','先看本组题目，再听录音。每组录音播放两遍。选择一个答案；图片题按图片下的A、B、C作答。']
teacher=['# W06 第13—14课听力测验｜教师答案与播放稿','审阅稿，暂不发布。25题，每题4分，满分100分。课本14题，TOCFL官方原题11题；5段课本原音及11段TOCFL原音，共16组。','TOCFL部分保留官方三项图片选项、顺序和评分键。第15、16、17、20、21题的题干是原问答理解题的通用操作指令；第18、19、22—25题保留官方音频中的提问。题号按本卷重新编号，来源原题号只用于教师记录。','所有音频每组播放两遍。亲听、课堂设备及发布验收未完成。']
for s in ss:
 student+=['',f'## 第{s["question_start"]}'+(f'—{s["question_end"]}' if s['question_end']!=s['question_start'] else '')+'题']
 teacher+=['',f'## {s["title"]}','播放两遍。']
 group=[x for x in b['items'] if s['question_start']<=x['number']<=s['question_end']]
 a=next((a for a in old if a['audio_id']==s['audio_ids'][0]),None)
 script=a['script'] if a else group[0]['script'];teacher+=['','听力文本：','',script,'']
 for x in group:
  student+=['',f'{x["number"]}. {x["prompt"]}']
  if 'option_image' in x:student+=['',f'![A、B、C三个图片选项]({x["option_image"]})','', 'A　　B　　C']
  else:student += [f'{chr(65+i)}. {v}' for i,v in enumerate(x['options'])]
  teacher += [f'{x["number"]}. {x["prompt"]}',f'答案：{x["answer"]}'+('（见原图）' if 'option_image'in x else ' '+x['answer_text']),f'依据：{x["evidence"]}']
  if 'source_question_id'in x:teacher += [f'来源：TOCFL入门基础级第{x["source_volume"]}辑第{x["source_question"]}题；简体题本PDF第{x["source_pdf_page"]}页。',f'原图：![原选项]({x["option_image"]})']
(R/'student.md').write_text('\n'.join(student)+'\n');(R/'teacher.md').write_text('\n'.join(teacher)+'\n')
(R/'scope.md').write_text('''# W06 第13—14课25题听力测验

适用班级：BOYA-LS-E1-Y1S1-2026F；offering_id：2026-fall；exam_id：W06-L13L14-20261016；本版：W06-L13L14-25Q-20261022／version 4。

范围：boya-elementary-i:lesson-13《你打算买什么样子的》、boya-elementary-i:lesson-14《祝你生日快乐》。教学周为2026-10-26—11-01，实际课堂使用仍由教师确认。

2026-10-22 Adam要求扩充为25题，每题4分，共100分；部分课本题，其余采用相关TOCFL／HSK题，按W05方式同步但暂不发布。本版选用14道既有课本原音题及11道TOCFL官方原题，无HSK题。

TOCFL第4辑13、14、23、26、28题及第5辑13、25、29、31、33、37题。保留官方图片三选项、选项顺序与答案键；不把旧版按官方音频自编的问题冒称官方题。每题保存来源题本、脚本、答案网址、题号和题本页码。

课程搭配：第13课为物品、颜色、大小、价格及衣物状态；第14课为礼物、生日食品、饮品、喜好和活动约定。原题包含商店、拜访老师或书店约会等迁移情境，并不伪称原音都在谈生日。

输出仅在本10-design审阅目录。不得发布或写入20-approved／40-release。教师亲听、课堂设备试听和学生用时均未验收。
''')
with (R/'score-sheet.csv').open('w') as f:
 w=csv.writer(f);w.writerow(['student_id','student_name']+[f'Q{i:02}' for i in range(1,26)]+['total_100','teacher_notes'])
print('docs ready')
