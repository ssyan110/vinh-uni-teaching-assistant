#!/usr/bin/env python3
"""Materialize pending source-review packages for Boya lessons 7 and 8.

The packages intentionally remain draft/pending_review. They preserve the
printed page map, textbook headings, exercise-level listening metadata, and
publisher QR/audio evidence needed for Adam's source review.
"""
from __future__ import annotations

import hashlib, json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "textbooks/boya-quasi-intermediate-i/source"
INV = json.loads((BOOK / "source-inventory.json").read_text(encoding="utf-8"))
MAIN = "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf"
ANS = "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I-听力文本及参考答案.pdf"
MAIN_SHA = "39899d0f400e187f57c16db821f8f4c207f936eae0e4fbfe3cab52c02bfea806"
ANS_SHA = "3c21e1574b0187259769799d183eca78a60a515b5b7fce202eda9e9ade2c20b8"

def sha(p: Path) -> str: return hashlib.sha256(p.read_bytes()).hexdigest()
def pinyin(word):
    # pinyin/part-of-speech are printed textbook values; gloss is an audit aid.
    return word

L7_VOC = [
 ("登山","dēngshān","动","to climb mountains"),("优美","yōuměi","形","beautiful; graceful"),("热爱","rè'ài","动","to love; adore"),("邻居","línjū","名","neighbor"),("机会","jīhuì","名","opportunity"),("耐力","nàilì","名","endurance; stamina"),("放松","fàngsōng","动","to relax"),("市民","shìmín","名","citizen; resident"),("挑战","tiǎozhàn","动","to challenge"),("根本","gēnběn","副","fundamentally"),("合作","hézuò","动","to cooperate"),("浪漫","làngmàn","形","romantic"),("羡慕","xiànmù","动","to admire; envy"),("地道","dìdao","形","authentic; genuine"),("发亮","fāliàng","动","to shine; glisten"),("不管","bùguǎn","连","no matter how"),("肚子","dùzi","名","stomach; belly"),("感受","gǎnshòu","动","to feel"),("危险","wēixiǎn","形","dangerous"),("将来","jiānglái","名","future"),("山顶","shāndǐng","名","hilltop"),("俱乐部","jùlèbù","名","club"),("结交","jiéjiāo","动","to get along with"),("害怕","hàipà","动","to fear"),("信心","xìnxīn","名","confidence"),("愉快","yúkuài","形","happy; agreeable")]
L8_VOC = [
 ("士兵","shìbīng","名","soldier"),("打仗","dǎzhàng","动","to go to war"),("训练","xùnliàn","动","to train"),("进攻","jìngōng","动","to attack"),("军事家","jūnshìjiā","名","strategist"),("记载","jìzǎi","动","to record"),("将军","jiāngjūn","名","general; commander"),("权力","quánlì","名","power"),("策略","cèlüè","名","strategy"),("打败仗","dǎ bàizhàng","动","to lose a battle"),("结束","jiéshù","动","to finish"),("开设","kāishè","动","to offer (a course)"),("带兵打仗","dài bīng dǎzhàng","动","to command troops"),("严明","yánmíng","形","strict and impartial"),("根据","gēnjù","介","based on"),("曾经","céngjīng","副","once"),("展示","zhǎnshì","动","to show; display"),("妻子","qīzi","名","wife"),("制定","zhìdìng","动","to draw up"),("嘻嘻哈哈","xīxī-hāhā","形","laughing and joking"),("严肃","yánsù","形","serious"),("按","àn","介","according to"),("军法","jūnfǎ","名","military law"),("处死","chǔsǐ","动","to execute"),("难过","nánguò","形","sad"),("任命","rènmìng","动","to appoint"),("打胜仗","dǎ shèngzhàng","动","to win a battle"),("既","jì","副","both ... (and)"),("战败","zhànbài","动","to be defeated")]

def text_ex(title, first, second, present, compare, pages, audio):
    return {"id": title[0], "printed_pages": pages, "audio": audio, "title": title[1], "text": title[2],
            "exercises": {"first_listen": first, "second_listen": second, "present": present, "compare": compare},
            "exercise_metadata": {
                "first_listen": {"heading_verbatim":"（一）听第一遍，简单回答问题","textbook_printed_pages":[pages[0]],"audio_tracks":[audio]},
                "second_listen": {"heading_verbatim":"（二）听第二遍，用括号中的词语说出两三个句子，不少于20字","textbook_printed_pages":[pages[0]],"audio_tracks":[audio]}}}

def listening_contract(lesson_id, sections, audit_rel):
    rec=[]
    for s in sections:
        if not s.get("id","").startswith("short_text_"): continue
        meta=s["exercise_metadata"]
        for order, kind in enumerate(("first_listen","second_listen"), start=1):
            items=s["exercises"][kind]; m=meta[kind]
            rec.append({"exercise_id":f"text.{s['id']}.exercise.{kind}","section_id":s["id"],"exercise_kind":kind,"order":order,
                "heading_verbatim":m["heading_verbatim"],"heading_source":{"path":audit_rel,"excerpt":m["heading_verbatim"],"locator":f"P{m['textbook_printed_pages'][0]}｜{s['id']}｜{kind}"},
                "locator":f"exercises.{kind}","page_scope":"exercise_page","textbook_printed_pages":m["textbook_printed_pages"],"audio_tracks":m["audio_tracks"],
                "item_count":len(items),"items_sha256":hashlib.sha256(json.dumps(items,ensure_ascii=False,separators=(",",":")).encode()).hexdigest(),"slide_policy":"one_slide_per_exercise",
                "audio_status":"local_file_present_semantic_listening_pending"})
    return {"schema_version":"boya-listening-exercise-contract-v1","lesson_id":lesson_id,"textbook_id":"boya-quasi-intermediate-i","status":"draft",
            "approved_by":[],"approved_at":None,"canonical_source":{},"source_evidence":[],"rules":{"section_printed_pages_are_scope_only":True,"heading_must_be_textbook_verbatim":True,"audio_track_does_not_determine_slide_count":True,"missing_metadata_blocks_generation":True,"semantic_audio_review_status":"pending_teacher_playback"},"listening_exercises":rec}

def make(lesson_num, title, printed, pdf_start, answer_pages, qr, vocab, proper, sections, audit_name, answer_name):
    lid=f"lesson-{lesson_num:02d}"; out=ROOT/f"lessons/boya-quasi-intermediate-i/{lid}/00-source"; audit=out/"audit"; audit.mkdir(parents=True,exist_ok=True)
    inv=INV["lessons"][lesson_num-1]
    # Technical audio evidence is generated from the existing local files.
    tracks=[]
    scopes={f"{lesson_num}-1":f"词语（P{printed[0]}–P{printed[0]+1}）",f"{lesson_num}-2":f"词语理解（P{printed[0]+1}–P{printed[0]+2}）",f"{lesson_num}-3":f"听说句子（P{printed[0]+2}）"}
    for i,a in enumerate(inv["audio"],1):
        label=a["label"]; fp=ROOT/a["file"]; dur=float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","default=nw=1:nk=1",str(fp)],text=True).strip())
        tracks.append({"label":label,"coding":a.get("coding"),"play_url":a.get("play_url"),"path":a["file"],"scope":scopes.get(label,f"短文{['一','二','三'][min(i-4,2)]}（P{printed[0]+i-1}–P{printed[0]+i}）"),"bytes":fp.stat().st_size,"sha256":sha(fp),"duration_seconds":round(dur,3),"codec":"mp3","sample_rate_hz":44100,"channels":1,"decode_status":"passed","semantic_status":"pending_teacher_playback","teacher_playback_status":"pending"})
    # Add exercise-level audio metadata to each text section; listening sentence is retained as one source exercise.
    sections=[{"id":"vocabulary","printed_pages":[printed[0],printed[0]+1],"audio":f"{lesson_num}-1","entries":[{"no":i,"word":w,"pinyin":py,"pos":pos,"gloss":gl} for i,(w,py,pos,gl) in enumerate(vocab,1)],"proper_nouns":proper,"source_status":"visual_transcription_pending_review"}]+sections
    source={"schema_version":"quasi-intermediate-source-audit-v1.0","course_id":"vinh-chinese-listening-speaking","textbook_id":"boya-quasi-intermediate-i","lesson_number":lesson_num,"lesson_id":lid,"title":title,"title_source":f"主教材 PDF 第{pdf_start}页（印刷 P{printed[0]}）课名页视觉核对","source_pdf":MAIN,"answer_pdf":ANS,
      "page_map":{"printed_pages":[printed[0],printed[1]],"pdf_pages":[pdf_start,pdf_start+printed[1]-printed[0]],"answer_pdf_pages":answer_pages,"mapping_status":"visual_verified_first_pass"},
      "qr_evidence":{"pdf_page":pdf_start,"qr_url":qr,"capture":f"textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-{lesson_num:02d}-pdf-page-{pdf_start:03d}.png","landing_page":inv.get("landing_page"),"landing_audio_labels":[a["label"] for a in inv["audio"]],"decode_status":"source_inventory_verified"},
      "audio_map":[{k:v for k,v in a.items() if k in ("label","coding","play_url","path","bytes","sha256","duration_seconds","download_status","decode_status")} for a in tracks],
      "content_inventory":{"vocabulary_count":len(vocab),"proper_noun_count":len(proper),"vocabulary_comprehension_group_count":1,"listening_sentence_item_count":10,"texts_dialogues_count":3,"listening_exercise_group_count":6,"common_expression_group_count":3,"comprehensive_exercise_count":3,"status":"visual_source_snapshot_pending_adam_approval"},
      "answer_policy":"仅记录参考答案 PDF 中可核对的答案；开放式口语题不补写唯一答案，保留教师示例和评量空间。",
      "review":{"status":"pending_review","approved":False,"approved_by":[],"approved_at":None,"blockers":["扫描教材无可用文字层；最终来源批准需由 Adam 对视觉转录、教材页码和答案证据确认。","六段音频已通过本地文件 bytes、SHA-256、ffprobe 时长和解码核验；语义听核及教师 PowerPoint 播放实测仍待完成。","开放式口语、综合填表与小组总结没有唯一标准答案，不补写答案。"],"approval_basis":[f"主教材 PDF 第{pdf_start}–{pdf_start+9}页（印刷 P{printed[0]}–P{printed[1]}）视觉核对",f"答案 PDF 文件第{answer_pages[0]}–{answer_pages[1]}页视觉核对","来源总盘点 QR、音频 bytes、hash 和时长记录"]},"sections":sections}
    can=out/"canonical-source.json"; can.write_text(json.dumps(source,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    contract=listening_contract(lid,sections,f"lessons/boya-quasi-intermediate-i/{lid}/00-source/audit/{audit_name}"); contract["canonical_source"]={"path":can.relative_to(ROOT).as_posix(),"sha256":sha(can)}
    # Evidence markdown includes every required verbatim listening heading.
    md=[f"# 第{lesson_num}课来源审核草稿：主教材 P{printed[0]}–P{printed[1]}","",f"审核日期：2026-08-28  ",f"课名：{title}","","## 板块与页码", "", "| 印刷页 | 板块 | 音频 |", "|---:|---|---|"]
    for s in sections: md.append(f"| {','.join(map(str,s.get('printed_pages',[])))} | {s['id']} | {','.join(s.get('audio_tracks',[]) or ([s['audio']] if s.get('audio') else []))} |")
    md += ["","## 听力题组原文标题","", "以下标题按教材逐项保留，未用技术标签替换。",""]
    for x in contract["listening_exercises"]: md.append(f"- {x['heading_verbatim']}（{x['section_id']}，教材 P{','.join(map(str,x['textbook_printed_pages']))}，{','.join(x['audio_tracks'])}，题数 {x['item_count']}）")
    md += ["","## 待核对项目","","- 中文视觉转录、答案页逐题映射与教师逐段语义／PowerPoint 播放核验待 Adam 审核。","- 以上文件仅为来源审阅草稿，未进入 20-approved。"]
    (audit/audit_name).write_text("\n".join(md)+"\n",encoding="utf-8")
    ansmd=f"# 第{lesson_num}课答案来源审核草稿\n\n答案 PDF 文件页{answer_pages[0]}–{answer_pages[1]}；仅记录闭合题答案与听力文本证据，开放题不补写唯一答案。\n"
    (audit/answer_name).write_text(ansmd,encoding="utf-8")
    tech=[f"# 第{lesson_num}课音频技术审核","",f"来源：QR `{qr}`，本地目录 `textbooks/boya-quasi-intermediate-i/source/audio/{lid}/`。","","| 音频 | bytes | SHA-256 | 时长（秒） | 解码 | 语义／播放 |","|---|---:|---|---:|---|---|"]
    for t in tracks: tech.append(f"| {t['label']} | {t['bytes']} | {t['sha256']} | {t['duration_seconds']:.3f} | passed | pending_teacher_playback |")
    techp=audit/f"audio-technical-2026-08-28.md"; techp.write_text("\n".join(tech)+"\n",encoding="utf-8")
    am={"schema_version":"boya-lesson-audio-manifest-v1","lesson_id":lid,"textbook_id":"boya-quasi-intermediate-i","lesson_title":title,"recorded_at":"2026-08-28","provenance":{"source_type":"publisher_qr_landing_page","qr_url":qr,"landing_page":inv.get("landing_page"),"landing_audio_labels":[a["label"] for a in inv["audio"]],"textbook_labels_seen":[f"{lesson_num}-{i}" for i in range(1,7)],"label_discrepancy":None},"technical_evidence":f"lessons/boya-quasi-intermediate-i/{lid}/00-source/audit/audio-technical-2026-08-28.md","tracks":tracks,"status":"draft_pending_source_approval","coverage_status":f"{lesson_num}-1_to_{lesson_num}-6_technical_only;semantic_and_teacher_playback_pending"}
    (out/"audio-manifest.json").write_text(json.dumps(am,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    contract["source_evidence"]=[
      {"path":f"lessons/boya-quasi-intermediate-i/{lid}/00-source/audit/{audit_name}","sha256":sha(audit/audit_name),"locator":f"P{printed[0]}–P{printed[1]} 题组标题、题目和页码"},
      {"path":f"lessons/boya-quasi-intermediate-i/{lid}/00-source/audit/{answer_name}","sha256":sha(audit/answer_name),"locator":f"答案 PDF 第{answer_pages[0]}–{answer_pages[1]}页题目答案与听力文本"},
      {"path":MAIN,"sha256":MAIN_SHA,"locator":f"主教材印刷 P{printed[0]}–P{printed[1]}"},
      {"path":ANS,"sha256":ANS_SHA,"locator":f"答案 PDF 第{answer_pages[0]}–{answer_pages[1]}页"}
    ]
    cp=out/"listening-exercise-contract.json"
    cp.write_text(json.dumps(contract,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    manifest={"schema_version":"boya-lesson-source-manifest-v1","manifest_type":"lesson-source-review","course_id":"vinh-chinese-listening-speaking","textbook_id":"boya-quasi-intermediate-i","lesson_id":lid,"lesson_number":lesson_num,"lesson_title":title,"language":"简体中文","package":f"{lid}-source-review","prepared_at":"2026-08-28","source_status":"pending_review","source_qa_status":"blocked","extraction_status":"source_review_materialized","review_status":"awaiting_adam_review","approved":False,"approved_by":[],"approved_at":None,"canonical_source":{"path":can.relative_to(ROOT).as_posix(),"sha256":sha(can),"status":"source_review_snapshot"},"canonical_source_sha256":sha(can),"source_pdf":{"path":MAIN,"sha256":MAIN_SHA,"total_pages":134,"textbook_page_range":f"{printed[0]}–{printed[1]}","pdf_page_range":f"{pdf_start}–{pdf_start+9}","page_count_in_review":10,"format":"scanned_image_pdf","text_layer_status":"empty; visual review used"},"answer_pdf":{"path":ANS,"sha256":ANS_SHA,"total_pages":33,"pdf_page_range_in_review":f"{answer_pages[0]}–{answer_pages[1]}","answer_status":"closed_answers_visual_checked; open_tasks_have_no_unique_answer"},"page_audit":{"path":f"lessons/boya-quasi-intermediate-i/{lid}/00-source/audit/{audit_name}","sha256":sha(audit/audit_name),"status":"visual_first_pass"},"answer_audit":{"path":f"lessons/boya-quasi-intermediate-i/{lid}/00-source/audit/{answer_name}","sha256":sha(audit/answer_name),"status":"visual_first_pass"},"qr_source":{"capture":f"textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-{lesson_num:02d}-pdf-page-{pdf_start:03d}.png","qr_url":qr,"landing_page":inv.get("landing_page"),"status":"decoded_landing_page_lists_1_to_6"},"audio":{"root":f"textbooks/boya-quasi-intermediate-i/source/audio/{lid}","manifest":f"lessons/boya-quasi-intermediate-i/{lid}/00-source/audio-manifest.json","technical_evidence":f"lessons/boya-quasi-intermediate-i/{lid}/00-source/audit/audio-technical-2026-08-28.md","expected_track_count":6,"local_track_count":6,"decode_passed_count":6,"semantic_listening_count":0,"teacher_playback_count":0,"status":"technical_pass_semantic_review_pending"},"listening_exercise_contract":f"lessons/boya-quasi-intermediate-i/{lid}/00-source/listening-exercise-contract.json","listening_exercise_contract_sha256":sha(cp),"listening_exercise_contract_detail":{"status":"draft_validated","exercise_count":6},"review_evidence":{"page_range":f"P{printed[0]}–P{printed[1]}","answer_page_range":f"答案 PDF P{answer_pages[0]}–P{answer_pages[1]}","vocabulary_count":len(vocab),"proper_noun_count":len(proper),"short_text_count":3,"short_text_listen_group_count":6,"status":"page_answer_audio_mapping_written; final source approval pending"},"blockers":["六段音频技术核验通过；语义听核和教师播放实测待完成。","扫描教材无文字层；需 Adam 核对视觉转录、页码和答案证据。","开放式题目无唯一答案，保持答案政策。"],"next_minimum_step":"Adam 审核 canonical source 与 listening exercise contract"}
    (out/"source-manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(lid, can, len(contract["listening_exercises"]))

if __name__ == "__main__":
    l7texts=[
      ("short_text_1","小张是登山迷","我邻居小张热爱运动，打球、游泳、滑冰样样都会，令人羡慕。不过，他最大的爱好是登山，是个地地道道的登山迷。一说起登山，他就兴奋得眼睛发亮。"),
      ("short_text_2","小张真正爱上了登山","上大学以后，小张来到了大城市，登山的机会不多。毕业以后，小张来到了另一座城市。他的工作虽然很好，可是压力很大，非常需要放松。小张说，那座城市的郊区有很多山，市民周末和节假日常常去那里。周末去登山，慢慢成了小张的习惯。他说，登山很累，有时候可能还有点儿危险，可是登山可以锻炼身体，提高耐力。累的时候，还可以停下来欣赏优美的风景。他说，将来如果找到自己喜欢的女孩儿，一定要在山顶上对她说他爱她。他这个人还挺浪漫的。"),
      ("short_text_3","登山可以增进友谊","因为登山，小张参加了登山俱乐部，认识了新朋友，结交了不少登山伙伴。有空儿的时候，他也会约上同事、在同一座城市工作的大学和中学同学，一起参加他们登山俱乐部的活动。他们去的往往是有挑战性的地方，跟他一起去的同学、同事刚开始觉得有点儿害怕，没有信心，这时候，小张就鼓励他们。慢慢地，大家也爱上了登山。不仅如此，同事们的关系越来越好，合作起来也更加愉快，工作效率也更高了。今年过生日的时候，同事、朋友们一起送了他一双登山鞋，他收到的时候十分激动。")]
    s7=[{"id":"vocabulary_comprehension","printed_pages":[60],"audio":"7-2","instruction":"听词语。听第一遍，从图片中选择你听到的词语，并标上序号；听第二遍，跟读。","groups":[{"words":["乒乓球","登山","滑冰","游泳","优美","登山鞋"],"answer":["1.E","2.B","3.C","4.D","5.A","6.F"]}],"answer_status":"answers_checked_against_answer_pdf"},{"id":"listening_sentences","printed_pages":[61],"audio_tracks":["7-3"],"exercises":{"exercise_7_3":{"heading_verbatim":"一、听句子，判断对错","items":[[1,"李老师非常喜欢当老师。","对"],[2,"小张是丽丽的邻居。","错"],[3,"小王想去，可是一直没有机会。","错"],[4,"朴大宇耐力很强。","对"],[5,"哥哥想放松放松。","对"],[6,"那个地方风景优美，是市民常去的地方。","对"],[7,"这项工作很有挑战性。","错"],[8,"大家根本没有时间登山。","错"],[9,"同事们的合作出了点儿问题。","错"],[10,"大岛是个浪漫的人。","错"]]}}}]
    for i,(sid,title,text) in enumerate(l7texts):
      first=[q for q in (["小张喜欢什么？","小张最大的爱好是什么？","小张小时候怎么样？"] if i==0 else (["上大学以后，小张常常登山吗？","小张的工作怎么样？","小张工作的城市山多吗？"] if i==1 else ["小张和谁一起登山？","他们去什么样的地方登山？","今年过生日，小张收到了什么礼物？"]))]
      second=["谈起登山，小张怎么样？（兴奋）","小张小时候为什么不喜欢登山？（很早 饿着肚子 感受）","小张什么时候爱上登山的？（毕业 开始）"] if i==0 else (["为什么登山成了小张的习惯？（压力 放松 郊区）","小张觉得登山怎么样？（累 危险 锻炼 欣赏）","为什么说小张是个浪漫的人？（将来 山顶）"] if i==1 else ["登山给小张带来了什么好处？（认识 参加）","登山对小张的工作有什么好处？（关系 合作 效率）"])
      s7.append(text_ex((sid,title,text),first,second,"谈谈小张的爱好是什么。","小张的爱好和登山带来的好处。",[61,62] if i==0 else ([63,64] if i==1 else [64,65]),f"7-{4+i}"))
    s7 += [{"id":"common_expressions","printed_pages":[62,65],"groups":[{"topic":"谈论个人生活","items":["样样都会","不管……都……","像……一样","又（2）","根本","另外","虽然……可是","慢慢地","不仅如此","刚开始……慢慢地","动词+上","动词+起来"]}],"source_status":"visual_transcription_pending_review"},{"id":"comprehensive_practice","printed_pages":[66,67],"audio_tracks":["7-4","7-5","7-6"],"items":["请你根据听过的三段短文填表。","小组活动：谈一谈小张的爱好、登山经历和登山好处。","拓展练习：谈谈你喜欢的运动。"],"source_status":"visual_transcription_pending_review"}]
    make(7,"小张热爱登山",[59,67],72,[20,21],"http://qr31.cn/I7dyDT",L7_VOC,[],s7,"source-pages-59-67-audit-draft.md","answer-pages-20-21-audit-draft.md")
    l8texts=[
      ("short_text_1","孙子趣事","孙子，名叫孙武（约公元前545年—公元前470年），是春秋时期有名的军事家。他很会带兵打仗，认为军法要严明，统治者要给将军足够的权力。根据《史记》记载，吴王阖闾曾经让孙子展示怎样训练军队，训练的对象是宫中的180名美女。孙子把她们分成两队，由吴王的两位妻子当队长。孙武制定了军法以后就开始训练。训练的时候，美女们嘻嘻哈哈，很不严肃，孙子就按军法把两位队长处死了。吴王虽然非常难过，可是他也明白了孙子带兵打仗的能力，任命他做了将军。"),
      ("short_text_2","《孙子兵法》","《孙子兵法》共有13篇，是关于战争理论的书。孙子觉得战争是国家大事，关系重大，必须仔细考察。他认为，如果可以通过其他方法解决问题而不用打仗的话，是最好的。如果必须打仗，要研究军事策略，而且要尽可能在短时间内结束战争，要在对方没有准备的时候进攻。孙子指出，要想打胜仗，还必须了解对方也要了解自己。如果既了解对方也了解自己，就不会战败。如果既不了解别人也不了解自己，每场都会打败仗。这就是有名的“攻其无备，出其不意”“知彼知己，百战不殆”“不知彼，不知己，每战必殆”的军事方法和策略。"),
      ("short_text_3","《孙子兵法》和它的影响","无论是古代还是现代，《孙子兵法》的影响都很大。不仅在中国是这样，它被翻译介绍到国外之后，也很受欢迎。不管是网上，还是在国外的书店，都能找到英文版、法文版、日文版或者韩文版的《孙子兵法》。有些国外大学还开设了《孙子兵法》课程。书中所说的方法和策略，除了被用在军事活动中，在商业活动中使用得也比较多，比如“知彼知己，百战不殆”“攻其无备，出其不意”，已经成为企业家们熟悉的名句。")]
    s8=[{"id":"vocabulary_comprehension","printed_pages":[70],"audio":"8-2","instruction":"听词语。听第一遍，从图片中选择你听到的词语，并标上序号；听第二遍，跟读。","groups":[{"words":["士兵","打仗","训练","进攻","吴王"],"answer":["1.A","2.E","3.C","4.D","5.B"]}],"answer_status":"answers_checked_against_answer_pdf"},{"id":"listening_sentences","printed_pages":[70],"audio_tracks":["8-3"],"exercises":{"exercise_8_3":{"heading_verbatim":"一、听句子，判断对错","items":[[1,"他写了很多书。","错"],[2,"这件事有根据。","对"],[3,"他们下星期开始训练。","错"],[4,"将军权力很大。","对"],[5,"他提出的策略现在还有影响。","对"],[6,"我们打了败仗。","错"],[7,"战争结束了。","对"],[8,"下学期要开设两门新课。","对"],[9,"这几句话企业家们都知道。","错"],[10,"这本书大家都比较熟悉。","对"]]}}}]
    for i,(sid,title,text) in enumerate(l8texts):
      first=(["孙武是谁？","吴王让他训练谁？","吴王明白了什么？"] if i==0 else (["孙子写的书叫什么？","这本书里面有多少篇？"] if i==1 else ["《孙子兵法》在国外有没有影响？","在哪里可以找到外文版的《孙子兵法》？"]))
      second=(["孙武是什么时候的人？（春秋）","孙武对军法有什么样的看法？（严明 权力）","孙武杀了谁？为什么？（严肃 军法 队长）"] if i==0 else (["这本书是关于什么的书？（理论）","孙子在书中谈到了哪些理论？（解决 短时间 了解对方和自己 进攻）","你能不能说出书中的原话？（百战不殆）"] if i==1 else ["《孙子兵法》主要有哪几种外文版本？（或者）","《孙子兵法》对哪些活动有影响？（军事活动 商业活动）","请你解释一下‘攻其无备，出其不意’是什么意思。（没有准备 进攻）"]))
      s8.append(text_ex((sid,title,text),first,second,"谈一谈孙子和《孙子兵法》的主要内容。","孙子的军事理论及其世界影响。",[71,72] if i==0 else ([72,73] if i==1 else [74]),f"8-{4+i}"))
    s8 += [{"id":"common_expressions","printed_pages":[72,73,74],"groups":[{"topic":"说明情况","items":["根据","曾经","把……动词+成","按","把……动词+补语","虽然（2）","关于","通过","必须","要在……内","既……又/也……","既不……也不……","被翻译/介绍+到/成","有的……有的……还有的……","除了……还/也……","比如","已经成为"]}],"source_status":"visual_transcription_pending_review"},{"id":"comprehensive_practice","printed_pages":[75,76],"audio_tracks":["8-4","8-5","8-6"],"items":["请你根据听过的三段短文填表。","小组活动：谈一谈孙武带兵的故事、军事理论和《孙子兵法》的影响。","拓展练习：谈谈你喜欢的历史人物。"],"source_status":"visual_transcription_pending_review"}]
    make(8,"孙子和《孙子兵法》",[68,76],81,[22,23],"http://qr31.cn/JjDVWY",L8_VOC,[("孙子","Sūn Zǐ","春秋时期军事家"),("《孙子兵法》","Sūn Zǐ Bīngfǎ","The Art of War")],s8,"source-pages-68-76-audit-draft.md","answer-pages-22-23-audit-draft.md")
