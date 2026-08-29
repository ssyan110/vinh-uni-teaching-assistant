# 第8课《孙子和〈孙子兵法〉》独立来源审核

## 审核结论

- 审核日期：2026-08-28
- 审核范围：`lessons/boya-quasi-intermediate-i/lesson-08/00-source/` 四份 JSON、主教材 P68–P76、答案 PDF、QR 证据与 8-1 至 8-6 音频。
- 当前 gate：**BLOCKED；不得批准来源，不得生成 PPT。**
- 核心媒体完整性通过，但来源页码、答案证据、听力题干和若干教材文字仍有必须先修正／确认的项目。

## 已确认通过

### 文件与交叉 SHA

四份 JSON 均为合法 JSON，且 `source-manifest.json` 中的 canonical 与 listening contract SHA-256 与实际文件一致：

| 文件 | 实际 SHA-256 | manifest 交叉结果 |
| --- | --- | --- |
| `canonical-source.json` | `8667e605b2753f7baac33cbc211102647088b6ea9c90d20aa5803ab377e3f109` | 一致 |
| `listening-exercise-contract.json` | `2de0c33340b383cc3cb624de379b45a5a61e7974330e179a9676f141bff3efb7` | 一致 |
| `audio-manifest.json` | `ded3c457de89e6f1faab52f51fa2ff6bc53604651dda86a78aafb20215e442e1` | 未在 source manifest 登记 audio-manifest SHA |

`page_audit` 与 `answer_audit` 的路径及 SHA 也与当前文件一致。主教材 PDF SHA `39899d0f…bfea806`、答案 PDF SHA `3c21e157…9d2c20b8` 与 manifest 记录一致。

### 主教材范围、课名、QR

- PDF 文件页 81 为印刷 P68，PDF 文件页 89 为印刷 P76；PDF 文件页 90 已进入下一课《北方菜和南方菜》（印刷 P77）。因此 canonical 的 `[81, 89]` 是正确范围，但 `source-manifest.json` 的 `pdf_page_range: "81–90"` 与 `page_count_in_review: 10` 错误，误把下一课首页纳入来源包。
- 课名「孙子和《孙子兵法》」与 P68 课名页一致。
- QR 截图存在，QR 为 `http://qr31.cn/JjDVWY`，落地页列出 8-1 至 8-6；标签与本地音频目录一致。

### 音频完整性

6/6 本地 MP3 的实际 bytes、SHA-256 与 canonical／audio manifest／全书 inventory 一致，ffprobe 均可解码。实际时长与 manifest 的差异小于 0.001 秒。

| 音频 | bytes | SHA-256 | manifest 时长（秒） | 解码 |
| --- | ---: | --- | ---: | --- |
| 8-1 | 976761 | `4ee0ae390aa808652db94f1af28358729422b59215aaaef5bfcda8e72d9638c2` | 60.735 | 通过 |
| 8-2 | 405828 | `4510530d12236865d6c35aa4640d388c83005716e45826ba589979a1a2980143` | 25.051 | 通过 |
| 8-3 | 885645 | `cdbeb41756155fe7435902859a07d0ad7d1acc55f5234b4e490a6786e8e1f474` | 55.040 | 通过 |
| 8-4 | 1158979 | `6e8a109c37d868b290ee98647028607df9863f52052ddf75fe5c6b9d8a529536` | 72.124 | 通过 |
| 8-5 | 1074981 | `f5e40224124fabbe596cc3ed9e3e87194d0166a54598c9ce8e852da941e870fd` | 66.873 | 通过 |
| 8-6 | 1049068 | `1ce2666355336e2f89705864fb9e135ea000969b6a8e9286bf27a171d581b4e1` | 65.254 | 通过 |

语义听核、教师播放／PowerPoint 实播仍为 pending，不能把技术通过写成课堂播放通过。

### 词语与专名数量

主教材 P68–P69 视觉核对到 29 个词语和 2 个专名，数量与 `content_inventory` 一致；六个听力题组的数量与音频关系为：8-4 两组（3、3题）、8-5 两组（2、3题）、8-6 两组（2、3题），总数 6 组，contract 的 `item_count` 数字一致。

## 必须修正的高风险问题

### P1 — 答案 PDF 页码错位，当前答案证据混入第7课

`canonical-source.json.page_map.answer_pdf_pages`、`source-manifest.json.answer_pdf.pdf_page_range_in_review`、contract 的答案 evidence 都写成文件页 22–23。实际视觉核对结果：

| 答案 PDF 文件页 | 页面内容 |
| ---: | --- |
| 22 | 第7课《小张热爱登山》，答案印刷页 19 |
| 23 | 第8课，答案印刷页 20 |
| 24 | 第8课，答案印刷页 21 |
| 25 | 第9课《北方菜和南方菜》，答案印刷页 22 |

第8课应引用答案 PDF **文件页 23–24（印刷页 20–21）**。当前范围会把第7课页 22 误当成第8课证据，并漏掉第8课文件页 24。必须先改正所有 page map、evidence locator、answer audit 文件名／内容和 approval_basis，再进入 Adam 审核。

### P1 — 六个第二遍题组标题不是教材原文

contract 与 canonical 的六个 `second_listen` metadata 都写「用括号中的词语说出两三个句子，不少于20字」。教材视觉文字为：

- P71（短文一）：`（二）听第二遍，用括号中的词语说出三个句子，不少于20字`
- P72（短文二）：`（二）听第二遍，用括号中的词语说出三个句子，不少于20字`
- P74（短文三）：`（二）听第二遍，用括号中的词语说出两个句子，不少于20字`

这同时违反 package 自己的 `heading_must_be_textbook_verbatim: true`；必须按题组逐项改正，不能用一个通用标题替代。

### P1 — `listening_sentences` 把答案句替换成了学生题干，并漏了教材页码

主教材 P70（文件页 83）显示第 1–8 题，P71（文件页 84）顶部显示第 9–10 题；canonical 将 section 页码写成 `[70]`，应覆盖 **P70–P71**。

教材学生题干为：

1. 他写了很多书。
2. 这件事有根据。
3. 他们下星期开始训练。
4. 将军可以决定很多事情。
5. 他的方法现在还在用。
6. 大家都很高兴。
7. 仗打完了。
8. 下学期要开设两门新课。
9. 大家都知道这几个句子。
10. 大家了解这本书的内容。

canonical 的 10 条却是答案 PDF 中的另一组陈述（例如「他提出的策略现在还有影响」「我们打了败仗」「战争结束了」「这本书大家都比较熟悉」）。答案页可以保存为答案／听力证据，但不能覆盖学生 PDF 的原题。需同时保存 `prompt_verbatim` 与答案陈述及其对错，逐题建立 mapping；否则 PPT 可能投影错误题目。

### P1 — 短文正文与答案听力文本存在未登记差异

当前 canonical 的三篇 `text` 没有对答案 PDF 的逐页文字证据，且与视觉答案文本可见差异，例如：

- 短文一漏记答案页中的「阖闾（Hélǚ）」注音。
- 短文二写「如果可以通过……」「而且要尽可能在短时间内」，答案文本为「如果能通过……」「要尽可能在最短的时间内」。
- 短文三写「不仅在中国……」，答案文本为「不但在中国……」；漏掉「《孙子兵法》里面」和两处成语括号解释。

这些差异可能是教材正文与听力文本的不同版本，也可能是转录错误；必须以答案 PDF 文件页 23–24 与主教材逐字对照，并把差异标成待 Adam 确认，不能静默选择一个版本。

### P1 — answer audit 没有实际答案证据

`audit/answer-pages-22-23-audit-draft.md` 只有标题和一句说明，没有逐页截图定位、题组答案、听力文本、文件页／印刷页映射。source manifest 将其状态写为 `visual_first_pass`，但当前文件不足以支持该声明；应在改正文件页 23–24 后补充逐项证据。

## 中风险教材忠实度问题

### P2 — 词语页的印刷编号与星号没有保留

P69 视觉页把「既」和「战败」都印成序号 28；canonical 为便于计数将后者编号为 29，但没有记录这是教材原页的重复编号。P68–P69 的星号（例如「权力、根据、曾经、妻子、制定、严肃、按」）也没有字段。数量 29 正确，但正式来源应保留 `printed_no`／`starred` 或明确说明规范化，避免下游误以为教材原编号是 1–29。

### P2 — 常用词语和表达分组数量不一致

`content_inventory.common_expression_group_count` 写 3，但 canonical 的 `common_expressions.groups` 只有 1 个 topic「说明情况」，覆盖 P72–P74。主教材视觉上有三组标题：P72「说明情况」、P73「介绍事情」、P74「谈论语言文化」。应拆成三组并保留各组原页归属；当前单组会使内容覆盖表与教材结构不一致。

### P2 — 综合练习只保留了短标签，漏掉可执行要求

P75–P76 的来源还包括表格栏位「姓名、生卒年月、特长、著作」、小组活动的「一名同学先说 8–10 个句子（不少于 80 字），同伴补充，最后总结说 10–12 个句子（不少于 100 字）」以及拓展练习的「使用本课词语和常用表达；说 10–12 句、不少于 100 字」。canonical 仅保留三条概括性字符串，不能独立支撑下游活动卡或 coverage。

### P2 — contract 无题目文本或 coverage refs

六条 contract 只有 `item_count` 与 `items_sha256`，没有可审阅的逐题 `items`／`coverage_refs`。虽然 canonical sections 内有部分题目数组，contract 仍无法单独核对题干、顺序和题目 hash。正式批准前应补逐题原文或明确的 canonical content IDs。

## 工具与状态

- 当前仓库没有 `scripts/validate_listening_exercise_contract.py`，因此不能声称已运行正式听力题组 validator；本次只做 JSON、hash、视觉页码和媒体完整性核对。
- 四份 JSON 当前状态均为草稿／待审：`source_status=pending_review`、`approved=false`、`approved_by=[]`、`approved_at=null`；保持正确，不能改成 approved。
- `source_qa_status=blocked` 与未完成的答案页、文本忠实度和语义播放核验相符。

## 分级结论与下一步

- **P1（必须先修）**：答案 PDF 23–24 页映射；六组第二遍标题；听说句子学生题干／P70–P71 页码；三篇短文与答案文本逐字差异；答案 audit 证据。
- **P2（审核前应补）**：词语重复编号与星号；三组常用词语分组；综合练习完整要求；contract 逐题 coverage；audio manifest SHA 登记。
- **P3（工具阻塞）**：正式 validator 脚本缺失。

下一最小可验证步骤：先只修正第8课 `00-source` 的页码／题干／答案证据与对应 SHA，保持 `pending_review`；再由 Adam 审核 canonical 与 listening contract，之后才进入教学重组 gate。

