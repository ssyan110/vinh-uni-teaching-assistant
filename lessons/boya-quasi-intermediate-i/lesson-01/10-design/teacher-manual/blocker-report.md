# 第一课教师手册草案：production gate 阻塞报告

检查日期：2026-08-29  
课次身份：`boya-quasi-intermediate-i:lesson-01`  
检查目的：`teacher-guide`

## 检查结果

`scripts/production_gate.py --purpose teacher-guide` 未通过（只读检查，未绕过 gate）。草案仍写入本课 `10-design/teacher-manual/`，未写入 `20-approved/` 或 `40-release/`。

## 阻塞项

- gate 要求的专用 draft 输出根目录为 `10-design/teacher-manual-draft/`；本次按任务指定写入 `10-design/teacher-manual/`。
- `10-design/teaching-design/manifest.json` 不存在或无效。
- 来源 gate 尚未验证，来源 QA 尚未通过。
- PBI teaching-design gate 尚未批准。
- 当前 source package 状态为 `active_source_pending_review`，不属于可生成教师手册的已批准状态。
- authority manifest 的 source package 与配置的 frozen input 不一致。
- frozen source package tree hash 不匹配。
- source package 文件数量未登记（manifest=None，实际 5 个文件）。

## 当前可用范围

本次草案只整理系主任已批准的两份 PPTX：现有学生画面文字、页面顺序、教材页码、音频编号和 speaker notes。未新增教材例句、题目、活动、答案、正式课时或分组安排。

## 待人工确认

来源语义审核、PBI 教学重组及正式课时、教师手册批准、配套材料、PPT 播放与教师 rehearsal 完成后，才能继续建立正式 authority/release。
