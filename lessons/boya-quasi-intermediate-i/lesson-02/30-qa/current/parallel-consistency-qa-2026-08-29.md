# 第二课并行产出一致性 QA

审核日期：2026-08-29  
审核范围：`00-source/`、`10-design/teaching-design/`、`10-design/teacher-manual/`、`10-design/support-materials/`、`10-design/assets/`、`10-design/storyboard/`。  
目标课次：`boya-quasi-intermediate-i:lesson-02`（《准中级加速篇 I》第二课《王红的一天》）。

## 结论

**结果：带阻塞的并行一致性通过。** 目前文件都位于第二课目录，结构化文件使用正确的复合 `lesson_key`，图片文件可读取，DOCX ZIP 完整且包含 KaiTi／Times New Roman 字体声明。没有发现把《中级冲刺篇 I》内容实际导入本课的证据。材料仍是 `10-design` 草案，不能视为批准或交付。

## 已通过

1. **课次身份**：`canonical-source.json`、`source-manifest.json`、`audio-manifest.json`、`listening-exercise-contract.json`、`content-contract.json`、图片 manifest、storyboard manifest，以及两个 CSV 均标记 `boya-quasi-intermediate-i:lesson-02`；两个 CSV 各有 10 条记录且没有其他课次键。
2. **目录归属**：来源、教学设计、教师手册、预习卡、图片和 storyboard 均在 `lessons/boya-quasi-intermediate-i/lesson-02/` 内。没有发现指向 `boya-intermediate-i` 的结构化来源路径。
3. **图片**：图片 manifest 登记 36 项；登记的 36 个 PNG 均在 `10-design/assets/` 中并通过独立解码检查。manifest 明确标记为候选草案，尚不能进入 approved PPTX，并保留来源引用与授权状态。
4. **DOCX**：`lesson-02-教师手册-draft.docx` 与 `lesson-02-预习卡-draft.docx` 均可解压，核心 Word 部件齐全；正文运行使用 Times New Roman，中文 eastAsia 使用 KaiTi。两份文件均明确为 draft，未冒充最终交付。
5. **禁止混用记录**：文件中出现《中级冲刺篇 I》的地方均是“不得引用／不得复制”的防混用说明，不是内容来源、答案或素材导入。此类文字属于审计记录，可保留。
6. **草案标记**：教学重组、教师手册、预习卡、图片、视觉 brief、storyboard preflight 与 PPTX manifest 都明确写出 `draft`、`pending` 或候选状态；没有把候选素材登记到 `20-approved/` 或 `40-release/`。

## 阻塞与需修正

### P1：活动材料索引列出但文件不存在

`10-design/support-materials/lesson-02-活动材料索引.md` 列出以下草案，但当前目录没有对应文件：

- `lesson-02-听力关键词记录表-draft.md`
- `lesson-02-王红一天安排表-draft.md`
- `lesson-02-学校生活口语任务卡-draft.md`
- `lesson-02-生日午餐口语任务卡-draft.md`
- `lesson-02-课外活动口语任务卡-draft.md`

这会造成“索引覆盖了材料、实际发放材料不存在”的一致性失败。补齐前不能宣称第二课配套材料完整。

### P1：来源与音频状态仍未完全批准

- `source-manifest.json` 顶层仍为 `source_status: pending_review`。
- `audio-manifest.json` 明确为 2-1 至 2-6 待教师语义／播放核对，2-7 才是用户恢复音频并已确认。
- 教师手册、教学设计与 storyboard 均正确保留此 pending 状态，不能把技术解码通过当作语义来源批准。

### P2：尚无完整逐页 storyboard 或 authority PPTX

`lesson-02-source-refs.csv` 和 `lesson-02-ppt-preflight.md` 是候选页面／来源映射，不是完整 slide spec。当前已有线上／实体 PPTX draft，但还没有第二课 authority PPTX。因此不能进行“材料是否逐页来自批准 PPT”的最终核对。升格时，教师手册、预习卡和活动卡只能按批准来源与最终批准 PPTX 的文字、音频、页码和动作同步，不得另起一套内容。

## 复核边界

- 未修改任何 `00-source`、`10-design`、PPTX、`20-approved` 或 `40-release` 文件。
- 本报告只记录当前可见产出的结构与一致性，不替代 Adam 的来源、教学边界、教师手册或 PPTX 批准。
- Divider 按共用母版复用，不作为缺图项。
