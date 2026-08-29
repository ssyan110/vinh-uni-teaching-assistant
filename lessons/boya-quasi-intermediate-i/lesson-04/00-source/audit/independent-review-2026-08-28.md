# 第4课来源包独立审核

审核日期：2026-08-28  
审核范围：`lesson-04/00-source/` 四份核心 JSON、主教材与答案 PDF 视觉证据、QR／音频本地文件及现有审计记录。  
审核性质：只读独立审核；未修改 canonical source、未批准来源、未生成 PPTX。

## 1. 核心文件与交叉 SHA

四份 JSON 均可解析：

| 文件 | 实际 bytes | 实际 SHA-256 | 交叉结果 |
|---|---:|---|---|
| `canonical-source.json` | 20,378 | `a83b72aa736ea30c0ce1af23b35fb83de386b47e148e0171274c526f9ef13ac3` | contract 与 source manifest 一致 |
| `listening-exercise-contract.json` | 6,350 | `25840ba3f6eebca2530a1e9a91b0c4196a6dfd24b63075963c7d8847c4470d64` | source manifest 一致；canonical 引用一致 |
| `audio-manifest.json` | 3,921 | `6ac862deb05b2ba93ce7bf3c5b1e6dd15ea870931244e36ab91083a7aa4d20bc` | source manifest 一致 |
| `source-manifest.json` | 3,740 | `53cb4100de30cf9866b348c5bb62a80adf834dc572757990ad837336811c7c56` | — |

contract 的 6 个题组 item hash、题数、顺序与 canonical 对应：6/6 一致。6 个 audio label、bytes、SHA、时长和路径在 canonical 与 audio manifest 间：6/6 一致。

发现一个交接级问题：`source-manifest.json` 中 `page_audit.sha256` 仍为 `c11799be...`，当前 `source-pages-32-41-audit-draft.md` 实际 SHA 为 `66d3de51fde07b0206195e24f2e49ece906b0ae13a0fe7d7670e1bb18d5de6f8`，不一致。必须重新计算后再交接。`answer_audit.sha256` 当前一致；音频技术审计有路径但未登记 SHA。

## 2. 教材与答案页证据

- 主教材 PDF 共 134 页，无可用文字层；文件页 45–54 视觉核对到印刷 P32–P41，课名为《在中国学汉语》，QR 位于文件页 45。
- P32–P33：24 个词语，词语理解 4-2 两组共 8 题。
- P34：听说句子 4-3 共 15 题；答案文件页 14–15 的 15 个判断结果顺序与 canonical 一致。
- P35–P36：短文一 4-4《对北京的印象》；P36–P37：短文二 4-5《学习内容》；P38–P39：短文三 4-6《在中国学汉语和在本国学汉语的异同》。
- P40：综合填表与小组口语；P41：拓展口语。开放题没有唯一标准答案，当前答案政策正确地保留为开放产出。
- 答案 PDF 文件页 14、15、16（页面底部印刷 P11、P12、P13）均有证据；短文三在文件页 16 续完。索引记录的文件页范围与实际续页语义需在 Adam 审核时确认，但当前 canonical 没有截断续段。

## 3. 音频技术核对

本地 `textbooks/boya-quasi-intermediate-i/source/audio/lesson-04/` 中 4-1 至 4-6 全部存在。逐项重新计算 bytes／SHA，并以 ffprobe 读取时长、ffmpeg 解码：

| 音频 | bytes | SHA | ffprobe 时长 | 解码 |
|---|---:|---|---:|---|
| 4-1 | 824,205 | `46f02a4c...c3e26797` | 51.200 s | PASS |
| 4-2 | 530,380 | `2ce4035b...14c0689` | 32.835918 s | PASS |
| 4-3 | 1,525,541 | `b7f2d459...09bcd9d0` | 95.033469 s | PASS |
| 4-4 | 1,125,554 | `ea9f2e63...be479e` | 70.034286 s | PASS |
| 4-5 | 981,776 | `76693000...e1456083` | 61.048163 s | PASS |
| 4-6 | 1,359,193 | `c3f75706...c66a8f11` | 84.636735 s | PASS |

技术通过不等于课堂语义听核；6/6 的 `semantic_status` 和教师／PowerPoint 实播仍为 pending。

## 4. 必须先修正或确认的内容问题

1. **高：4-5 第二遍题组标题不忠实。** P37 视觉文字是「第3～4题要求说两三个句子，不少于20字」；canonical 的 `short_text_2.exercise_metadata.second_listen.heading_verbatim` 与 contract 写成「要求说三个句子」。应以教材原文为准，并同步更新 contract、source audit 与所有下游草稿。
2. **高：三个“比较”段落被写成改写摘要，却在 source audit 中标作原文。**
   - P35 比较框原文包含「发现北京街上汽车特别多」「因为天气热，对北京又不熟悉」「出租车司机说的话他能听懂一些，也能聊几句」；canonical `short_text_1.exercises.compare` 使用了不同措辞（如「街上汽车多了」「路又不熟」「听得懂司机的话，也能和司机聊几句」）。
   - P37 比较框原文是「每天上午都有课」「一共上三门课」「和中国语伴互相练习」「提高汉语水平」「可是听力还不行，他决定加倍努力」；canonical `short_text_2.exercises.compare` 为压缩改写。
   - P39 比较框原文强调大课／韩语解释／听力少与「课上学到的词语马上就能用上」；canonical `short_text_3.exercises.compare` 同样为改写摘要。
   
   必须由 Adam 决定：将这些字段改回视觉核对的教材原文，或明确重命名并标注为「教师示例／摘要」，不能继续同时当作来源原文使用。
3. **中：P36 常用词语和表达“又（1）”漏记一条例句。** 视觉页还有「每周六要学习，学校平时功课又多，真没时间休息。」；canonical 仅记录前两条例句。补录后需重新计算 canonical、contract 与 source manifest 的相关 SHA。
4. **中：来源 manifest 追踪字段不完整。** `source-manifest.json` 未登记主教材 PDF、答案 PDF 与音频技术审计文件的 SHA；原始 PDF 当前 SHA 分别为 `39899d0f400e187f57c16db821f8f4c207f936eae0e4fbfe3cab52c02bfea806` 与 `3c21e1574b0187259769799d183eca78a60a515b5b7fce202eda9e9ade2c20b8`。这不是内容批准依据，但应在交接前补齐可追溯性。

## 5. Gate 状态与下一最小步骤

- 来源状态：`source_status=pending_review`、`review_status=awaiting_adam_review`、`approved=false`。
- 听力题组 contract：`draft`；6/6 题组结构与 item hash 通过。
- 音频：技术核对通过；语义听核与实际播放未完成。
- 来源 QA：因 stale page-audit SHA、题组标题差异、比较段落原文／摘要界线及漏条例句，维持 blocked。

下一最小步骤：先修正并重新 hash page audit；Adam 确认 P37「两三个句子」及三个比较段落的字段政策；补录 P36 例句后再冻结第4课 canonical source。完成来源批准前不得进入教师手册、配套材料或 PPT storyboard。
