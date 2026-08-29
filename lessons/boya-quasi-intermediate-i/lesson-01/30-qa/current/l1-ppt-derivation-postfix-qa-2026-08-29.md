# 第一课：批准 PPTX 衍生材料修正后核验

检查日期：2026-08-29  
课次身份：`boya-quasi-intermediate-i:lesson-01`

## 修正结果

- 活动卡三栏已改回批准 PPT 第 64 页原文「对去北京的态度」。
- `exercise-coverage.csv` 中批准 PPT 未出现的第一／第二遍听力、短文比较、小组拓展均保留为 `source_only_not_in_ppt` 审核记录，不再标记为已覆盖的 PPT 任务。
- 「介绍丽丽」已移除来源额外的「不少于 60 字」；综合题已改为批准 PPT 第 48 页的「根据课本回答问题并说明课文信息」。
- `content-contract.json` 的词语来源路径已改为可解析的 `source-extraction-draft.json#/sections/0`。
- 评量表已移除 PPT 未决定的「听者理解／提出问题」维度；课末检查仅保留批准 PPT 明示的阅读、表达、提问、提纲与口语准备项目。
- 教师手册生成脚本已修复并可重现；手册明确说明 PPT 中「1-7／1-8 尚未取得」是历史 speaker-notes 备注，不是当前音频状态。

## 自动核验

- 两份批准 PPTX SHA-256 未变：在线预习 `7c2c62d4f2d55677181822610524c3fc49a963e5a0bfa042274ab629980bd900`（72 页）；实体课 `c476cf51f63f75bc6d9afe4886b6df6a0c38d90e8a90d73e5649160c97b545e1`（51 页）。
- 第一课预习卡、活动卡、评量表、课末检查 4 份 DOCX 可解压、XML 可读；学生材料未检出「越来越越」、繁体字或旧英文 Exit Ticket。
- 练习对应表 40 行、`lesson_key` 全部为 `boya-quasi-intermediate-i:lesson-01`；8 行来源审核项明确标记为 `source_only_not_in_ppt`。
- `scripts/validate_lesson_identity.py` 通过（20 个复合课次身份）；`git diff --check` 通过。

## 尚未批准项目

第一课来源语义听核（含 1-7、1-8）、正式实体课时、线上／实体边界、教师手册与配套材料批准、PowerPoint 实际播放、教师 rehearsal 及 `40-release` 交付包仍待完成。批准版 PPTX 保持锁定，未被本次修正修改。
