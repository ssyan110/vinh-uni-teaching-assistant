# 第一课教学设计草案：生产 Gate 阻塞记录

生成日期：2026-08-29
课次身份：`boya-quasi-intermediate-i:lesson-01`

## 检查结果

已运行：

`python3 scripts/production_gate.py --purpose draft --output-dir lessons/boya-quasi-intermediate-i/lesson-01/10-design/teaching-design`

结果为 `blocked`。当前目录只保存依据已批准 PPTX 回溯的教学设计草案，不进入 `20-approved/`，也不生成或覆盖 PPTX。

## 当前阻塞项

- 生产工具没有登记 `draft` 这一 purpose，不能把本次草案当作可生成 PPT 的通过信号。
- `10-design/teaching-design/manifest.json` 尚未存在。
- 来源 Gate 与来源 QA 尚未通过；`active_source_pending_review` 仍是来源状态。
- PBI 教学设计尚未获得批准。
- 当前 authority 的来源包状态与冻结输入不一致，来源树 hash／文件数仍需由来源流程修正。
- 本课线上／实体边界已由 Adam 于 2026-08-31 确认并记录；正式实体课时仍待依教材内容量与学校正式课表核定。

## 处理原则

本草案只记录批准的两份 PPTX、其 speaker notes、教材页码与已存在的 canonical source 对照。PPTX 中未提供的正式课时、题目、活动顺序、答案或来源语义听核，不在本文件中推测补写。
