# 第三课并行产出一致性 QA

审核日期：2026-08-29  
审核范围：`00-source/`、`10-design/teaching-design/`、`10-design/teacher-manual/`、`10-design/support-materials/`、`10-design/assets/`、`10-design/storyboard/`。  
目标课次：`boya-quasi-intermediate-i:lesson-03`（《准中级加速篇 I》第三课《我对学中文越来越有兴趣》）。

## 结论

**结果：带阻塞的并行一致性通过。** 结构化文件和 CSV 使用正确的复合 `lesson_key`，全部当前图片可读取，DOCX ZIP 完整且包含 KaiTi／Times New Roman 字体声明。教学正文使用教材原文“越来越”；没有发现将《中级冲刺篇 I》内容实际导入本课。当前已有 `10-design/pptx-draft/` 草稿，但尚无第三课 authority PPTX 或完整 storyboard。

## 已通过

1. **课次身份**：四件 `00-source` JSON、图片 manifest、content contract、两个 CSV 和已有 storyboard preflight 均指向 `boya-quasi-intermediate-i:lesson-03`；两个 CSV 各有 10 条记录且没有其他课次键。
2. **目录归属**：所有来源、教学设计、教师手册、预习卡、活动材料、图片和 storyboard 文件均在 `lessons/boya-quasi-intermediate-i/lesson-03/` 内。没有发现将另一本教材的来源路径写入结构化内容。
3. **图片**：图片 manifest 登记 28 项；登记的 28 个 PNG 均在 `10-design/assets/` 中并通过独立解码检查。5 个 3-2 图片（饺子、画画儿、大夫、画花儿、看望）在 `pending_assets` 中明确标记为未生成，没有用无关图片替代；全部现有图片仍为候选草案，尚不能进入 approved PPTX。
4. **DOCX**：`lesson-03-教师手册-draft.docx` 与 `lesson-03-预习卡-draft.docx` 均可解压，核心 Word 部件齐全；正文运行使用 Times New Roman，中文 eastAsia 使用 KaiTi。两份文件均明确为 draft，未冒充最终交付。
5. **简体中文**：可见教学标题、词语、题目、活动说明和手册正文均使用简体字；canonical source、教学设计、教师手册及预习卡的教学文字均为“越来越”。
6. **禁止混用记录**：出现《中级冲刺篇 I》或 `boya-intermediate-i` 的文件都是历史阻塞／防混用说明，明确写着不得作为本课来源；没有发现其内容被复制到第三课 canonical、教学设计、图片或材料。
7. **草案标记**：教师手册、预习卡、活动材料、视觉 brief 和 storyboard preflight 均写明 `draft`、`pending` 或候选状态；未登记到 `20-approved/` 或 `40-release/`。

## 阻塞与需修正

### P1：严格扫描仍会找到历史错误短语

“越来越越”共出现在 8 个审计／说明位置：

- `00-source/canonical-source.json` 的批准说明 1 处；
- `00-source/audit/adam-review-2026-08-29.md` 1 处；
- `00-source/audit/answer-pages-11-13-audit-draft.md` 1 处；
- `00-source/audit/independent-package-qa-2026-08-29.md` 1 处；
- `00-source/audit/source-audit-summary-2026-08-29.md` 2 处；
- `00-source/audit/source-pages-22-31-audit-draft.md` 1 处；
- `10-design/teacher-manual/blocker-report.md` 1 处。

这些都是“不要使用旧写法”的历史说明，不是学生教学正文；当前教学内容已统一为“越来越”。如果交付检查采用“文件中不得出现该字符串”的硬扫描，主代理需要在不改变证据含义的前提下另行清理这些说明文字。

### P1：来源 manifest 状态字段不一致

`00-source/source-manifest.json` 同时出现 `source_status: approved_by_adam_source_and_images` 与顶层 `approved: false`、`approved_by: []`。来源摘要已正确解释为“来源／图片批准，但音频语义与完整课次仍待核”；进入下一 gate 前必须由主代理统一状态字段，避免 dashboard 将部分批准误读为整课批准。

### P1：五个听词图片仍缺失

`L03-E03-2-FOOD-B`（饺子）、`L03-E03-2-STUDY-A/B/C`（画画儿、大夫、画花儿）及 `L03-E03-2-LIFE-D`（看望）仍在 `pending_assets`，因此 3-2 图片题尚未达到完整覆盖。manifest 已正确标记，不应以现有词语图冒充这五项。

### P2：尚无完整逐页 storyboard 或 authority PPTX

当前有 `lesson-03-ppt-preflight.md`、`lesson-03-source-refs.csv` 与 preflight manifest，但没有完整逐页 storyboard；已有 PPTX 仍是 `10-design/pptx-draft` 草稿。因此不能进行最终的逐页来源、材料、音频按钮和 authority PPTX 对齐核对。

### P2：部分小型材料缺少显式复合 lesson_key

活动 01–03、评量表、Exit Ticket 以及若干旧审计文件依靠所在目录和文件名表达课次，正文未重复写完整 `lesson_key`。这不构成跨课混用证据，但会降低单文件脱离目录后的可追踪性；正式交付前应在材料索引／manifest 中补回复合键。

## 复核边界

- 未修改任何 `00-source`、`10-design`、PPTX、`20-approved` 或 `40-release` 文件。
- 本报告只记录当前可见产出的结构与一致性，不替代 Adam 的来源、教学边界、教师手册或 PPTX 批准。
- Divider 按共用母版复用，不作为缺图项。
