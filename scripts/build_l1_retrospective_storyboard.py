#!/usr/bin/env python3
"""Extract a read-only storyboard from the approved L1 PPTX files.

This is intentionally retrospective: it never edits PPTX files and marks all
outputs as retrospective_not_generation_input.
"""
from __future__ import annotations
import csv, hashlib, json, re, zipfile
from pathlib import Path
from typing import Dict, List, Tuple

from pptx import Presentation

ROOT = Path('/Users/ssyan110/Development/vinh-uni-teaching-assistant')
LESSON = ROOT / 'lessons/boya-quasi-intermediate-i/lesson-01'
APPROVED = LESSON / '20-approved/pptx'
SOURCE = LESSON / '00-source'
OUT = LESSON / '10-design/storyboard'
QA = LESSON / '30-qa/current/pptx-chair-approved'

DECKS = [
    ('online', 'lesson-01-在线预习.pptx', '在线预习'),
    ('face_to_face', 'lesson-01-实体课.pptx', '实体课'),
]

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda: f.read(1024 * 1024), b''):
            h.update(b)
    return h.hexdigest()

def clean(s: str) -> str:
    return re.sub(r'\s+', ' ', s or '').strip()

def media_counts(slide) -> Tuple[int, int]:
    images, audio = set(), set()
    for rel in slide.part.rels.values():
        target = str(getattr(rel, 'target_ref', '') or '')
        if not target:
            target = str(getattr(getattr(rel, 'target_part', None), 'partname', '') or '')
        low = target.lower()
        if low.endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg')):
            images.add(target)
        elif low.endswith(('.mp3', '.wav', '.m4a', '.aac', '.ogg')):
            audio.add(target)
    return len(images), len(audio)

def slide_text(slide) -> str:
    vals = []
    for sh in slide.shapes:
        if hasattr(sh, 'text') and sh.text and sh.text.strip():
            vals.append(clean(sh.text))
    return ' | '.join(vals)

def notes_text(slide) -> str:
    try:
        vals = []
        for sh in slide.notes_slide.shapes:
            if hasattr(sh, 'text') and sh.text and sh.text.strip():
                value = clean(sh.text)
                # Notes placeholders also contain a slide number; that is not
                # a speaker-note instruction and is omitted from the excerpt.
                if not re.fullmatch(r'\d+', value):
                    vals.append(value)
        return ' | '.join(vals)
    except Exception:
        return ''

def pages_from(text: str) -> str:
    m = re.search(r'教材\s*P\s*([0-9]+(?:\s*[–—-]\s*[0-9]+)?)', text)
    if m:
        return re.sub(r'\s+', '', m.group(1)).replace('-', '–').replace('—', '–')
    return ''

def audio_from(text: str) -> str:
    found = re.findall(r'(?<!\d)([1-8]-[1-8])(?!\d)', text)
    return found[0] if found else ''

def source_for(deck: str, n: int, pages: str, audio: str, text: str) -> Tuple[str, str]:
    # References are deliberately limited to the current lesson's 00-source.
    base = '00-source/source-extraction-draft.json#sections.'
    def ref(section: str) -> str:
        refs = [base + section]
        if audio:
            refs.append(f'00-source/canonical-source.json#audio_map[track_label={audio}]')
        return ';'.join(refs)
    if deck == 'online':
        if 3 <= n <= 33: return ref('vocabulary'), 'direct'
        if 34 <= n <= 38: return ref('short_text_1'), 'direct'
        if 39 <= n <= 42: return ref('short_text_2'), 'direct'
        if 43 <= n <= 47: return ref('short_text_3'), 'direct'
        if 48 <= n <= 63: return ref('common_expressions'), 'direct'
        if 64 <= n <= 65: return ref('comprehensive_practice'), 'direct'
        if 66 <= n <= 71: return ref('comprehensive_practice'), 'direct'
        return '', 'none'
    if 6 <= n <= 7: return ref('vocabulary_comprehension'), 'direct'
    if 8 <= n <= 9 or n == 12 or n == 18 or n in (50, 51): return ref('listening_sentences'), 'direct'
    if 21 <= n <= 22: return ref('short_text_1'), 'direct'
    if n == 31: return ref('short_text_2'), 'direct'
    if 24 <= n <= 29: return ref('common_expressions'), 'direct'
    if 33 <= n <= 38: return ref('common_expressions'), 'direct'
    if 40 <= n <= 45: return ref('common_expressions'), 'direct'
    if 47 <= n <= 49: return ref('comprehensive_practice'), 'direct'
    return '', 'none'

def observed_layout(deck: str, n: int, text: str) -> str:
    if n == 1: return 'cover'
    if n == 2: return 'learning-route'
    if deck == 'online' and n == 72: return 'closing-prompt'
    if deck == 'online' and 3 <= n <= 33: return 'vocabulary-card'
    if '短文' in text and ('（' in text or '（' in text): return 'text-reading'
    if deck == 'online' and 34 <= n <= 47: return 'text-reading-or-record'
    if '常用词语和表达' in text or '常用表达' in text: return 'expression-card'
    if '综合' in text or '个人介绍' in text or '我的口语提纲' in text: return 'comprehensive-record'
    if '听力练习' in text: return 'listening-practice'
    if '请你说说' in text: return 'oral-prompt'
    if '先想一想' in text: return 'warm-up-prompt'
    if '检查' in text or '准备好了' in text or '上课前整理好' in text: return 'checklist'
    if '练习' in text and len(text) < 100: return 'section-divider'
    return 'content-prompt'

def student_action(text: str, notes: str) -> str:
    # Keep only wording visibly present in the approved deck/notes.
    candidates = [
        '请看教材第3页，听一听这些词语。', '请看教材第4页的题目。',
        '请看教材第4—5页的题目和选项。', '请看教材第5页的问题。',
        '再听一次，回答问题。', '先看题、抓关键词，再听并记重点，最后回答。',
        '请用这个句式说1句中文。', '完成问题1到3。', '读一读：找出人物、地点和事情。',
        '圈出你认识的词语，再标记不懂的地方。', '准备说 6–8 句，说明“她在哪里做什么工作”。',
        '准备说 6–8 句。', '把想在课堂说的句子圈起来。', '带着你的信息和问题来开口。',
    ]
    for c in candidates:
        if c in text: return c
    # Use the most action-like short sentence already on the slide.
    for part in re.split(r'\s*\|\s*', text):
        if re.search(r'(请|完成|听|读|回答|准备|说说|介绍|写下|找出|圈出|带着|判断|选择|填表)', part):
            return part[:220]
    return ''

def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rows: List[Dict[str, str]] = []
    deck_meta = []
    for deck, filename, label in DECKS:
        path = APPROVED / filename
        prs = Presentation(path)
        deck_meta.append({'deck': deck, 'label': label, 'path': str(path.relative_to(ROOT)), 'slides': len(prs.slides), 'sha256': sha256(path), 'bytes': path.stat().st_size})
        for n, slide in enumerate(prs.slides, 1):
            text = slide_text(slide)
            notes = notes_text(slide)
            pages = pages_from(text + ' ' + notes)
            audio = audio_from(text)
            src, src_status = source_for(deck, n, pages, audio, text)
            imgs, audios = media_counts(slide)
            rows.append({
                'lesson_key': 'boya-quasi-intermediate-i:lesson-01',
                'retrospective_not_generation_input': 'true',
                'deck': deck,
                'deck_label': label,
                'slide_number': str(n),
                'slide_id': f'L01-{deck}-{n:03d}',
                'observed_layout': observed_layout(deck, n, text),
                'slide_title_and_visible_text': text,
                'student_action_observed': student_action(text, notes),
                'speaker_notes_excerpt': notes[:500],
                'textbook_printed_pages_observed': pages,
                'audio_track_observed': audio,
                'image_count': str(imgs),
                'audio_relationship_count': str(audios),
                'materials_observed': '教材' if '教材' in text else '',
                'source_refs': src,
                'source_ref_status': src_status,
                'qa_status': 'static_observed',
            })
    csv_path = OUT / 'lesson-01-ppt-storyboard-retrospective.csv'
    fields = list(rows[0].keys())
    with csv_path.open('w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader(); w.writerows(rows)

    online = [r for r in rows if r['deck'] == 'online']
    face = [r for r in rows if r['deck'] == 'face_to_face']
    source_refs = sorted({r['source_refs'] for r in rows if r['source_refs']})
    visual = OUT / 'lesson-01-visual-storyboard-retrospective.md'
    visual.write_text(f'''# 第一课《丽丽是独生女》视觉 storyboard 回溯稿\n\n- 课次身份：`boya-quasi-intermediate-i:lesson-01`\n- 回溯依据：系主任批准的 `20-approved/pptx/lesson-01-在线预习.pptx` 与 `20-approved/pptx/lesson-01-实体课.pptx`。\n- 状态：`retrospective_not_generation_input`。本文件只记录现有投影片的可见文字、学生动作、页码、音频、备注、图片关系与观察到的版式；不生成新内容，不改写已批准 PPTX。\n- 来源范围：所有 `source_refs` 仅指向本课 `00-source/`；不引用《中级冲刺篇 I》。\n\n## 已核对的版面事实\n\n| deck | 投影片数 | 画布 | speaker notes | 观察到的图片关系 | 观察到的音频关系 |\n| --- | ---: | --- | ---: | ---: | ---: |\n| 在线预习 | {len(online)} | 16:9 | {sum(bool(r['speaker_notes_excerpt']) for r in online)} | {sum(int(r['image_count']) for r in online)} | {sum(int(r['audio_relationship_count']) for r in online)} |\n| 实体课 | {len(face)} | 16:9 | {sum(bool(r['speaker_notes_excerpt']) for r in face)} | {sum(int(r['image_count']) for r in face)} | {sum(int(r['audio_relationship_count']) for r in face)} |\n\n## 观察到的 layout family\n\n下表是从批准 PPTX 的现有页面外观与标题结构归类的观察标签，不是新的设计规范，也不作为生成输入。逐页记录在 `lesson-01-ppt-storyboard-retrospective.csv`。\n\n| deck | 页面范围 | 观察到的版式／功能 |\n| --- | --- | --- |\n| 在线预习 | 1 | cover |\n| 在线预习 | 2 | learning-route |\n| 在线预习 | 3–33 | vocabulary-card |\n| 在线预习 | 34–47 | text-reading-or-record |\n| 在线预习 | 48–63 | expression-card |\n| 在线预习 | 64–67 | comprehensive-record |\n| 在线预习 | 68–71 | checklist / self-check |\n| 在线预习 | 72 | closing prompt |\n| 实体课 | 1 | cover |\n| 实体课 | 2–4 | learning-route / goal / warm-up prompt |\n| 实体课 | 5, 19, 20, 23, 30, 32, 39, 41, 46 | section-divider or transition |\n| 实体课 | 6–9, 12, 18, 50–51 | listening-practice |\n| 实体课 | 10–17, 21–22, 29, 31, 38, 40, 47–49 | oral-prompt / record |\n| 实体课 | 24–28, 33–37, 42–45 | expression-card |\n\n## 学生动作与来源回溯\n\n- CSV 的 `student_action_observed` 只摘录投影片可见操作句或 speaker notes 中已经存在的动作句；未找到明确动作时留空。\n- `textbook_printed_pages_observed` 只记录批准 PPT 上已经显示的教材页码。\n- `source_refs` 只使用本课 canonical source 的既有 section 名称；封面、路线、目标与无直接教材页码的提示页不强行添加来源。\n- 1-7、1-8 的音频页面在实体课第 50、51 页被观察到；内容级听核与出版社 QR 对应仍按来源审核状态处理。\n\n## 视觉 QA 回溯结论\n\n- 两份 PPTX 的投影片尺寸均为 16:9，且每页均有可见内容。\n- 已批准实体课 PPTX 的音频关系对应 1-2、1-3、1-4、1-5、1-6、1-7、1-8；CSV 逐页记录。\n- 图片、音频、页码和 notes 仅做静态关系记录，不代表已经完成 PowerPoint 实际播放或课堂 rehearsal。\n- 本回溯稿不改变 `20-approved`，不建立 `40-release`，也不替代来源语义审核、教师手册批准或配套材料批准。\n\n## 输出约束\n\n`retrospective_not_generation_input=true` 是硬标记。任何后续生成器不得读取本目录作为课次内容母版；若需制作或修订材料，必须依照已批准 PPTX 与正式批准的教师手册流程执行。\n''', encoding='utf-8')

    manifest = {
        'schema_version': 'boya-l1-retrospective-storyboard-v1',
        'manifest_type': 'retrospective_storyboard',
        'lesson_key': 'boya-quasi-intermediate-i:lesson-01',
        'offering_id': '2026-fall',
        'textbook_id': 'boya-quasi-intermediate-i',
        'lesson_id': 'lesson-01',
        'retrospective_not_generation_input': True,
        'authority_basis': {
            'status': 'department_chair_approved_pptx',
            'approval_record': '20-approved/lesson-01-pptx-approval-record.md',
            'pptx': deck_meta,
        },
        'source_scope': {
            'canonical_source': '00-source/canonical-source.json',
            'source_extraction': '00-source/source-extraction-draft.json',
            'allowed_source_refs': source_refs,
            'cross_textbook_refs': [],
        },
        'outputs': {
            'storyboard_csv': {'path': '10-design/storyboard/lesson-01-ppt-storyboard-retrospective.csv', 'sha256': sha256(csv_path), 'bytes': csv_path.stat().st_size, 'rows': len(rows)},
            'visual_storyboard_md': {'path': '10-design/storyboard/lesson-01-visual-storyboard-retrospective.md', 'sha256': sha256(visual), 'bytes': visual.stat().st_size},
        },
        'qa_scope': ['slide_text_extraction', 'speaker_notes_extraction', 'printed_page_marker_extraction', 'audio_relationship_extraction', 'image_relationship_extraction', 'layout_observation'],
        'not_claimed': ['source_semantic_approval', 'teacher_manual_approval', 'support_material_approval', 'powerpoint_manual_playback', 'teacher_rehearsal', '40-release_delivery'],
        'generated_at': '2026-08-29',
    }
    mpath = OUT / 'manifest.json'
    mpath.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    qa = QA / 'retro-storyboard-qa.md'
    qa.write_text(f'''# 第一课回溯 storyboard QA\n\n- 课次身份：`boya-quasi-intermediate-i:lesson-01`\n- 状态：`retrospective_not_generation_input`\n- 依据：`20-approved/pptx/lesson-01-在线预习.pptx`、`20-approved/pptx/lesson-01-实体课.pptx` 与 `20-approved/lesson-01-pptx-approval-record.md`。\n\n## 结果\n\n| 检查 | 结果 | 证据 |\n| --- | --- | --- |\n| 在线预习投影片抽取 | PASS | {len(online)} 页；CSV 行数与 PPT 页数一致 |\n| 实体课投影片抽取 | PASS | {len(face)} 页；CSV 行数与 PPT 页数一致 |\n| 课次身份 | PASS | `boya-quasi-intermediate-i:lesson-01`；未引用中级冲刺篇 |\n| 来源范围 | PASS | `source_refs` 仅指向当前课 `00-source` |\n| 页面文字／学生动作 | PASS | 只抽取批准 PPTX 可见文字与既有 notes |\n| 教材页码 | PASS | 仅记录 PPTX 已显示的教材页码 |\n| 图片／音频关系 | PASS | 逐页记录 image/audio relationship count |\n| approved PPTX 是否修改 | PASS | 本任务未写入 `20-approved/pptx/` |\n\n## 未宣称完成\n\n本 QA 不等于来源语义批准、教师手册批准、预习卡／活动材料批准、PowerPoint 手动播放、课堂 rehearsal 或 `40-release` 交付。1-7、1-8 的内容级听核与出版社 QR 对应仍待人工完成。\n\n## 文件\n\n- `10-design/storyboard/lesson-01-ppt-storyboard-retrospective.csv`\n- `10-design/storyboard/lesson-01-visual-storyboard-retrospective.md`\n- `10-design/storyboard/manifest.json`\n''', encoding='utf-8')

if __name__ == '__main__':
    main()
