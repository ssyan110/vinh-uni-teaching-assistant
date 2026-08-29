#!/usr/bin/env python3
"""Create internal draft-gate inputs for Boya quasi-intermediate lessons 5-10.

These records document the already confirmed online/face-to-face boundary and
candidate source references. They do not approve the source or create an
authority storyboard.
"""
import csv, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'lessons' / 'boya-quasi-intermediate-i'

for n in range(5, 11):
    lid = f'lesson-{n:02d}'
    lesson = BASE / lid
    source = json.loads((lesson / '00-source/canonical-source.json').read_text())
    design = lesson / '10-design/storyboard'
    design.mkdir(parents=True, exist_ok=True)
    text = f'''# {lid} 线上／实体课边界确认（draft）

本记录依据 Adam 2026-08-29 的明确指示建立。第{n}课沿用第1–4课已确认的共用架构，不另创整体结构。

## 共用顺序

词语 → 听力 → 短文（一）及练习 → 句式练习 → 短文（二）及练习 → 句式练习 → 短文（三）及练习 → 句式练习 → 综合练习。每次切换 section 先放 divider；短文后立即进入对应句式 divider。

## 内容边界

- 线上预习：学习流程、词语、教材音频预习、三篇短文的阅读／听取与重点记录、对应句式预习、综合练习准备。
- 实体课：预习回收、听力证据、教材题目、同伴问答、三篇短文的口语重述／比较、对应句式口语练习、综合表达。
- 线上学习是课外额外准备，不折抵或替代实体课。

## 状态

边界已确认，允许进入 10-design PPTX draft；来源批准、句式语义核对、音频语义核对与 PowerPoint 实播、教师手册、完整 storyboard、visual prototype 和正式 QA 仍为 pending。此文件不是 authority。
'''
    (design / f'{lid}-boundary-confirmation-2026-08-29.md').write_text(text, encoding='utf-8')
    rows = []
    for s in source.get('sections', []):
        rows.append({
            'record_type': 'candidate_source_ref', 'deck': 'online+face-to-face',
            'section_id': s.get('id',''),
            'source_ref': f'00-source/canonical-source.json#sections.{s.get("id","")}',
            'textbook_printed_pages': '、'.join(map(str, s.get('printed_pages', []))),
            'audio_tracks': s.get('audio') or '；'.join(s.get('audio_tracks', [])),
            'status': 'candidate_mapping_not_final_storyboard'
        })
    with (design / f'{lid}-source-refs.csv').open('w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader(); writer.writerows(rows)
