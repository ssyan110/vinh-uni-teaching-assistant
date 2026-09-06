# 第十课 PPTX Draft QA

- 课次身份：`boya-quasi-intermediate-i:lesson-10`
- 课题：中国人喜欢聚餐
- 日期：2026-09-03
- 状态：`draft_not_approved`
- 输出范围：`10-design/pptx-draft/`

## Gate and generation

| 检查 | 结果 | 证据 |
|---|---|---|
| Lesson identity | PASS | `scripts/validate_lesson_identity.py`：20 scoped lessons |
| Draft production gate | PASS | `scripts/production_gate.py`：status `ready`；blockers `[]` |
| Source-reference map | PASS | `10-design/storyboard/lesson-10-source-refs.csv` |
| Online/face boundary record | PASS | `10-design/storyboard/lesson-10-boundary-confirmation-2026-09-03.md` |
| Image manifest input | PASS | `10-design/assets/image-manifest.json` |
| PPTX generation | PASS | `scripts/build_l23_pptx_drafts.js --lesson-key boya-quasi-intermediate-i:lesson-10` |

## Generated drafts

| Mode | Slides | Bytes | SHA-256 |
|---|---:|---:|---|
| 在线预习 | 67 | 18,771,940 | `e1a7f83c6106f34f8eb2803bea6fc0d2a19b3c8b2805e1f696a24008d2c8df13` |
| 实体课 | 51 | 58,373,205 | `6786735760e0b0b75d48e21d70698fef0034541e4188c7b2a4ab65b0d5c5394d` |

## Package QA

- ZIP integrity: PASS for both files.
- Slide dimensions: generated using the project’s 16:9 native PPTX path.
- Blank slides: 0 detected in both files.
- Out-of-bounds drawable objects: 0 detected in both files.
- Explicit text size below 20 pt: 0 detected in both files.
- Online embedded audio files: 3 (`10-4`, `10-5`, `10-6`).
- Face-to-face embedded audio files: 9 media audio objects, including the Lesson 10 audio tracks.
- Required lesson flow and classroom sections: present in the generated decks.

## Open blockers / limitations

1. Lesson-specific raster illustrations have not been generated or reviewed. The image manifest therefore contains `assets: []` and pending asset declarations. Vocabulary slides display the generator’s draft image placeholder state and are not release-ready.
2. Source review remains pending: the scanned textbook transcription, answer-page mapping, and all six audio tracks still require teacher/Adam semantic review and PowerPoint playback testing.
3. Teacher manual, support materials, visual prototype approval, classroom rehearsal, `20-approved`, `30-qa/current`, and `40-release` artifacts do not exist for Lesson 10.
4. PowerPoint/LibreOffice visual rendering was not available in this environment; structural QA does not replace full visual and playback review.

## Authority boundary

These are draft artifacts only. They must not be copied into `20-approved` or `40-release` until the open source, image, teacher-material, playback, rehearsal, and approval gates are completed.
