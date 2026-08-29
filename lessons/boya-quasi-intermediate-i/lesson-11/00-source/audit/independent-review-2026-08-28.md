# 第11课《原来他们是关心我》来源包独立审核

审核日期：2026-08-28  
范围：`lessons/boya-quasi-intermediate-i/lesson-11/00-source/` 四份 JSON、主教材 P96–P104、答案页编号、六个听力题组与 11-1 至 11-6 音频。只读审核；不改 canonical／contract，不批准，不生成 PPTX。

## 结论

来源包仍为 `pending_review`／`approved=false`，不能进入教师手册、PPT storyboard 或 release。主教材页码与六个短文题组的基本结构可核对，但答案 PDF 的文件页编号证据存在 P1 阻塞；另有数项 canonical 页码／转录覆盖需 Adam 确认。

## 已验证通过

### JSON 与交叉 SHA

- `canonical-source.json`、`listening-exercise-contract.json`、`audio-manifest.json`、`source-manifest.json` 均可解析。
- canonical 实际 SHA-256：`c7c4c4bbcb3b28daffaa11dcb4660d8278427287f303774934aebd6ac75baf9f`，与 source manifest 注册值一致。
- listening contract 实际 SHA-256：`5c0d93c4b07435a39fd7b1cec314201940a081b8027402a7241ee3671a018d41`，与注册值一致。
- audio manifest 实际 SHA-256：`fef4f9657e699e9fa9bbe0006173a3c93901e88f3b2726c45496f864ae605ab1`，与 source manifest 的 `audio.manifest_sha256` 一致。
- `page_audit` 路径存在且 hash 一致；但 `answer_audit` 当前错误地复用同一份 source-pages 审核文件，详见 P2。

### 主教材页码与结构

- 主教材 PDF 文件页 109–117 对应印刷 P96–P104，课名为《原来他们是关心我》；canonical／source manifest 的主教材范围一致。
- canonical 记录 23 个词语、3 条俗语、1 组词语理解（4 题）、听说句子 10 题、3 篇短文、6 个短文听力题组、3 组常用词语和 3 项综合练习；与既有 source-pages 视觉初审的总数一致。
- 六个 contract 题组及 canonical item hash／题数／音档映射均一致：

| 题组 | 教材印刷页 | 音频 | 题数 |
|---|---:|---|---:|
| 短文一（一） | P98 | 11-4 | 3 |
| 短文一（二） | P99 | 11-4 | 2 |
| 短文二（一） | P100 | 11-5 | 3 |
| 短文二（二） | P100 | 11-5 | 3 |
| 短文三（一） | P102 | 11-6 | 3 |
| 短文三（二） | P102 | 11-6 | 3 |

### 音频技术检查

六段本地 MP3 均存在，bytes／SHA-256 与 audio manifest 一致，ffprobe 可解码；均为 44100 Hz、单声道。实测时长如下：11-1 55.902 秒、11-2 21.055 秒、11-3 64.444 秒、11-4 58.880 秒、11-5 50.051 秒、11-6 79.229 秒。语义听核与教师 PowerPoint 播放仍是 `pending`，不把技术通过当作可听核通过。

## 缺陷与风险分级

### P1 — 答案 PDF 文件页与课次证据未对齐（阻塞来源批准）

视觉检查答案 PDF 后，Lesson 11 的内容实际位于**文件页 29–30**，页面底部印刷答案页为 **P26–P27**。文件页 26 是第9课、文件页 27–28 是第10课；因此当前 `source-manifest.answer_pdf.pdf_page_range_in_review: "26–27"`、canonical `page_map.answer_pdf_pages: [26,27]` 及 source-pages 草稿“第26–27页”都没有明确指向实际文件页 29–30。全书 source inventory 的 `[28,30]` 也不是本课连续文件范围（文件页 28 属第10课）。答案审计证据必须先由 Adam 确认采用“文件页 29–30／印刷答案 P26–P27”的表示方式，再作为来源批准依据。

### P2 — canonical／audit 的页码与转录覆盖需要确认

- `source-manifest.answer_audit` 与 `page_audit` 指向同一份 `source-pages-96-104-audit-draft.md`，没有独立的答案页审计文件；现有 hash 虽自洽，但不能证明答案页证据。
- 主教材 P97 底部开始的词语理解图片延续到 P98 顶部；canonical 只标 `vocabulary_comprehension.printed_pages: [97]`，需确认是否改为跨页范围。
- `common_expressions_1` 表格从 P99 延续到 P100，但 canonical 只标 P99；`common_expressions_3` 表格视觉位于 P103，而 canonical 标为 P102。属于学生页码标记前必须解决的 mapping 问题。
- canonical `short_text_1` 第三个第一遍问题写成“他向了老师什么问题？”，主教材 P99 为“他问了老师什么问题？”。这是可直接回指视觉来源的转录差异，需 Adam 决定后再改 canonical。
- canonical `short_text_2` 第一遍三题使用“哪里”，主教材 P100 使用“哪儿”；需按来源批准决定是否保留教材口语形式。
- P99、P100、P102 的（三）呈现任务在教材还要求“使用下面的词语或常用表达”并列出参考词语；canonical 的 `present` 只保留主题与句数要求，完整词语清单／用法仍需确认是否纳入来源记录。

### P3 — 尚未完成的审核工作

- 六段音频只完成技术完整性检查，`semantic_status`／教师播放仍为 pending。
- 扫描教材无可用文字层，需 Adam 终审视觉转录、页码和答案映射。
- 开放式口语与综合练习没有唯一标准答案，当前答案政策正确地保持开放，不应补写伪标准答案。

## 可安全修正与需 Adam 确认

可安全修正：建立独立的答案页审计文件并在 source manifest 中回指；把答案证据明确写为“文件页 29–30／印刷答案 P26–P27”；补充 contract／audit 的证据 locator（不改教材内容）。

需 Adam 确认：是否修正 canonical 的跨页范围、P99 转录“问／向”、P100“哪儿／哪里”、呈现任务参考词语，以及最终答案页编号语义。确认前不得改 canonical、批准或生成后续教材。

## 状态门

本次报告只记录独立审核结果。`canonical.review.approved=false`、`source-manifest.approved=false`、contract `status=draft` 保持不变；没有写入 `20-approved/`，没有生成 PPTX 或 release。
