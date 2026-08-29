# 《准中级加速篇 I》第一至第三课并行进度

记录日期：2026-08-29  
范围：`boya-quasi-intermediate-i:lesson-01`、`boya-quasi-intermediate-i:lesson-02`、`boya-quasi-intermediate-i:lesson-03`

## 当前结果

| 课次 | 已完成 | 当前状态 | 下一项 |
|---|---|---|---|
| 第一课《丽丽是独生女》 | 系主任批准的在线预习与实体课 PPTX；来源音频 1-1 至 1-8 技术核对；来源语义摘要；完全依据批准 PPTX 整理并修正的教师手册、预习卡、活动卡、评量表、课末检查草案；回溯 storyboard 与静态 QA；相关 DOCX 已重渲染并嵌入 KaiTi | PPTX authority 已锁定；其余文件仍在 `10-design` 草案区；已完成 PPT 衍生材料修正核验与可见性核验 | 教师语义听核、手册/配套批准、PowerPoint 播放与 rehearsal、release |
| 第二课《王红的一天》 | 来源审核摘要；2-7 用户确认记录；29 词语、7 段音频、练习 coverage；现有图片 QA；PBI/content contract；教师手册、预习卡、5 份活动卡、评量表、课末检查 DOCX 草案；PPT 前置 storyboard；线上／实体 PPTX draft 已写入 `10-design/pptx-draft/` | 来源与图片部分已由 Adam 确认；已有可回滚的 PPTX 草稿，尚未成为 authority | 2-1 至 2-6 语义听核/播放；补齐索引列出的活动材料；完成来源与课程边界批准后，才能升格为 authority |
| 第三课《我对学中文越来越有兴趣》 | 来源审核摘要；来源与图片及“越来越”用字已由 Adam 确认；PBI/content contract；教师手册、预习卡、三份活动材料、评量表、课末检查 DOCX 草案；现有图片 QA；PPT 前置 storyboard；线上／实体 PPTX draft 已写入 `10-design/pptx-draft/` | 教学材料与 PPTX 均为 `10-design` 草案；尚未有 authority PPTX | 六段音频语义听核/播放；3-2 的 5 个听力图片候选仍待决定；完成来源与课程边界批准后，才能升格为 authority |

## 不可混淆的边界

- 第一课的两份 PPTX 是系主任批准的最终内容；教师手册、预习卡和补充材料只从这两份 PPTX 抽取，不另造教材内容。
- 第二、三课可以有可回滚的 `10-design/pptx-draft`，但不能把草稿称为已批准或已交付 PPTX；`20-approved` 与 `40-release` 仍保持锁定。
- 所有文件属于《准中级加速篇 I》自己的 `lesson_key`；不使用《中级冲刺篇 I》第一课作为来源或补件。
- L3 教学内容统一使用教材原文“越来越”，不使用“越来越越”。

## 已通过的统一检查

- `scripts/validate_lesson_identity.py`：20 个 compound `lesson_key` 通过。
- 三课 JSON/CSV 可解析；现有 DOCX ZIP 可打开，中文字体声明为 KaiTi，拉丁字母为 Times New Roman。
- L1–L3 当前 21 份 DOCX 已通过 ZIP/XML、KaiTi/TNR、LibreOffice PDF 渲染与中文文本抽取检查；替换字符为 0。
- 第一课批准 PPTX：在线 72 页、实体课 51 页、16:9、ZIP 完整；实体课 1-2 至 1-8 的 8/8 来源 hash 对上。

## 仍不能标记为完成的 gate

来源语义批准、正式 PBI 课时与线上/实体边界、教师手册和学生配套批准、PPTX 实际播放、教师 rehearsal，以及从完整 authority 建立 `40-release` 不可变教材包。
