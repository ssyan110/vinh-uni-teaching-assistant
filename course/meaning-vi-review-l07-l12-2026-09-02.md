# 第 7–12 课 `meaning_vi` 补充审核记录

日期：2026-09-02  
范围：`boya-quasi-intermediate-i:lesson-07` 至 `boya-quasi-intermediate-i:lesson-12`  
权威内容契约：`course/boya-online-content-contract.json`

## 执行方式

已分配六个相互隔离的子代理，每个代理只读取一个课次的 canonical source，并返回该课词语顺序、越南文释义、语境判断和缺漏说明；子代理没有直接写入文件。主流程逐项对照 canonical source 后统一写回内容契约。

| 课次 | canonical vocabulary | 写入契约的项目 | 处理 |
|---|---:|---:|---|
| 第七课 | 26 | 26 | 保留并按语境修正 3 项 |
| 第八课 | 29 + 2 个 proper nouns | 31 | 新增 |
| 第九课 | 27 | 27 | 新增 |
| 第十课 | 27 | 27 | 新增 |
| 第十一课 | 23 | 23 | 新增 |
| 第十二课 | 27 | 27 | 新增 |

第 8–12 课新增 135 项；第 7 课修正「根本」「感受」「愉快」3 项。每个写入项目均设置 `meaning_vi_status: "reviewed"`，释义使用越南文，不使用英文 `gloss` fallback。

## 关键判断

- 第 9 课「早茶」的意思按 Adam 最新修改为 `dim sum, điểm tâm sáng`；此前误录为「早餐」的词条与拼音已按教材更正。
- 第 8 课的「孙子」和「《孙子兵法》」属于 canonical `proper_nouns`，按线上词语页的必填规则一并补充。
- 第 11 课的「春捂秋冻」「饱吹饿唱」「远亲不如近邻」位于 canonical 的 `idioms`，不是 `vocabulary.entries`；本次不把它们伪装成普通词语写入 `meaning_vi`。
- 第 9 课词语理解中的「凉拌西红柿」「涮羊肉」以及第 10、12 课题目选项中的组合词不是 canonical vocabulary entries；没有另行加入未经批准的补充生词。

## 状态边界

本次只完成 `meaning_vi` 内容契约，不代表来源批准、学习目标批准、学习流程批准、教师手册批准、PPT storyboard、PPTX、PowerPoint 播放或教师 rehearsal 已完成。第 8–12 课仍使用 `draft_meaning_vi_reviewed_pending_lesson_content` 状态，不能直接生成完整在线预习 PPT。

## 验证

- JSON 解析通过。
- 第 7–12 课均逐项与对应 canonical `vocabulary.entries` 对齐；第 8 课另核对 2 个 `proper_nouns`。
- 各课无缺失、无多余项目；所有写入项目均为非空越南文并标记 `reviewed`。
- 更新后的内容契约 SHA-256：`f46f2205f526a1dcfe99aa81f2d4904b717e1aec95eb7f8ae0280af16bdc60e2`。
