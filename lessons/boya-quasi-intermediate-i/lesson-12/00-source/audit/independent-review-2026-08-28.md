# 第12课《散步》来源包独立审核

审核日期：2026-08-28  
范围：`lesson-12/00-source/` 四份 JSON、主教材／答案 PDF 页码与视觉证据、QR 记录、6 个本地音频及现有 audit。  
性质：只读审核；未修改 canonical source、未批准来源、未生成 PPTX。

## 已验证

### JSON 与 manifest

四份 JSON 均可解析，当前实际 SHA-256 如下：

| 文件 | bytes | SHA-256 |
|---|---:|---|
| `canonical-source.json` | 14,071 | `d465dec552b8efef27dea0d9f0d772634e45eb6db4cfd4caf5e99cbc547d6f01` |
| `listening-exercise-contract.json` | 3,975 | `59f9c13e90dae911e61a2bb20cbdf2f223879445d78e03f8` |
| `audio-manifest.json` | 3,003 | `205f334a669ef3d7b5d23853f8b5b22d0615c8b70c0d1f615c4ec541d8dfb458` |
| `source-manifest.json` | 3,799 | `17fa0874b4c2305e8d62ab603c8225ea9c35a56315e42abfc1ebcb8353c146d2` |

manifest 交叉引用通过：

- `source-manifest.canonical_source_sha256` 与 canonical 实际 SHA 一致；contract 对 canonical 的 SHA 引用一致。
- `source-manifest.listening_exercise_contract_sha256` 与 contract 实际 SHA 一致。
- `source-manifest.audio.manifest_sha256` 与 audio manifest 实际 SHA 一致。
- source PDF、答案 PDF 的 manifest SHA 也与当前文件一致。
- page audit 与 answer audit 路径存在，登记 SHA 与当前文件一致；但两者目前都指向同一个 `source-pages-105-113-audit-draft.md`，没有独立答案审计文件（见 P2）。

### 页码与题组

- 主教材 PDF 文件页 118–126 对应印刷 P105–P113，视觉上覆盖课名、词语、词语理解、听说句子、三篇短文、常用词语和表达、综合练习。
- 词语 27 个；词语理解 7 题；听说句子 10 题；三篇短文各有（一）（二），contract 目前登记 6/6 个短文听力题组，题数和 item hash 均与 canonical 一致。
- P112–P113 的综合填表、小组活动和拓展练习被记录为开放产出；没有虚构唯一答案。
- 视觉核对确认 12-2 答案为 `1.A 2.E 3.F 4.D 5.B 6.C 7.G`；12-3 十项判断答案为：错、对、错、对、错、对、错、对、错、对。

### 音频

12-1 至 12-6 六个文件均存在；重新计算 bytes／SHA、ffprobe 时长并以 ffmpeg 解码，6/6 通过。与 canonical 和 audio manifest 的路径、bytes、SHA、时长均一致。

| 音频 | bytes | ffprobe 时长 | 解码 | semantic／教师播放 |
|---|---:|---:|---|---|
| 12-1 | 751,063 | 46.628571 s | PASS | pending |
| 12-2 | 388,274 | 23.954286 s | PASS | pending |
| 12-3 | 848,865 | 52.741224 s | PASS | pending |
| 12-4 | 939,144 | 58.383673 s | PASS | pending |
| 12-5 | 725,567 | 45.035102 s | PASS | pending |
| 12-6 | 971,745 | 60.421224 s | PASS | pending |

## 问题分级

### P1：批准前必须修正

1. **答案 PDF 页码范围冲突。** 实际答案 PDF 文件页 31–32 才是本课内容，页面底部印刷为 P28–P29；文件页 33 是后续封面／非本课内容。当前 canonical `page_map.answer_pdf_pages=[28,29]` 和 source manifest `pdf_page_range_in_review="28–29"` 把印刷页号当成文件页号；source inventory 则记录 `[31,33]`，且含有非本课页。必须统一字段语义并改为实际文件页 31–32、印刷页 P28–P29 后再批准。
2. **常用词语和表达的来源内容大量缺失。** canonical 的 `common_expressions_1`、`common_expressions_2`、`common_expressions_3` 只有 21 个表达名称，没有记录教材 P108–P109、P110、P112 中的例句。下游无法可靠覆盖例句或核对教材原文。
3. **三个说一说任务的参考词语／常用表达没有结构化记录。** P108、P109、P111 明确列有词语参考和常用表达参考，canonical 的 `present` 只保留要求句，漏掉这些来源字段。
4. **P112–P113 综合练习表格结构和活动原文不完整。** `comprehensive_1` 只有“请你根据听过的三段短文填表”，没有教材表格的列／行字段；`comprehensive_2` 把教材三项任务和参考词语压缩改写，未保留完整的三项提示、参考词语和常用表达。必须补齐原表结构与原题，再把教学改写另存为教师设计字段。

### P2：需确认／建议修正

1. **三个 compare 字段不是教材比较框原文。** P108、P109–110、P111 的粉色比较框均被 canonical 改写成摘要，目前没有标记为“教师示例／摘要”。若要保留摘要，必须改名并标注用途；若字段代表来源，则应恢复教材原文。
2. **短文三转录有标点差异。** 答案 PDF P29 视觉为「走得很慢，很稳，很小心」，canonical 使用「走得很慢、很稳、很小心」。请 Adam 决定是否严格保留答案文本标点。
3. **答案审计路径语义不清。** source manifest 的 `answer_audit` 与 `page_audit` 共用 `source-pages-105-113-audit-draft.md`；建议建立独立答案页审计或明确该文件同时承担两者并更新字段名称。
4. **听力 contract 目前只登记三篇短文的 6 个题组。** 12-1 词语、12-2 词语理解、12-3 听说句子各有独立音频单元但未建立 exercise-level record。若按当前“每个教材听力单元都要有题组契约”的规则，应另建 3 条记录，或由 Adam 明确将“题组”限定为短文（一）（二）。

### P3：仍待后续人工核对

- 六段音频尚未逐段语义听核，也未在 PowerPoint 中实际播放。
- 主教材与答案 PDF 均为扫描影像，无可用文字层；汉字、题目、页码和答案仍需 Adam 终审视觉转录。
- QR 与音频标签目前沿用 source inventory 的解码证据；本审核未把网络 landing page 重新视为批准依据。
- 开放式口语、综合填表和拓展练习不设唯一标准答案，当前政策保持正确。

## Gate 结论

当前状态仍为 `source_status=pending_review`、`review_status=awaiting_adam_review`、`approved=false`、contract `draft`。技术音频检查 6/6 通过，但来源 QA 维持 **blocked**；P1 的答案页码、表达例句、参考词语／表达和综合表格未修正前，不应进入教师手册、配套材料、PPT storyboard 或 PPTX 生成。

下一最小步骤：先统一答案 PDF 文件页／印刷页字段并补齐上述来源结构；重新计算 canonical、contract、manifest 及相关 audit SHA，再由 Adam 审核视觉转录与 12-1 至 12-6 语义播放。
