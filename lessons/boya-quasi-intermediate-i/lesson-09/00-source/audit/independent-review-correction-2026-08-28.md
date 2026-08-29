# 第9课来源包独立审核修正记录（2026-08-28）

## 修正目的与边界

独立审核发现：`canonical-source.json` 已记录 9-1（词语）、9-2（词语理解）、9-3（听说句子），但 `listening-exercise-contract.json` 只有 9-4 至 9-6 的六个短文小题组。本次依据 canonical 中已有内容补齐前三个 exercise-level 记录，并将相同的三条映射补入 `audio-manifest.json` 的 `exercise_bindings`。

- 只修改 `listening-exercise-contract.json`、`audio-manifest.json` 与 `source-manifest.json` 中受影响的 hash／count。
- 未修改 canonical、任何题目文字、任何答案、音频文件或批准状态。
- 不批准来源，不生成 PPTX，不进入 `20-approved/`。

## 前后差异

| 项目 | 修正前 | 修正后 |
|---|---|---|
| contract 记录数 | 6 | 9 |
| contract SHA-256 | `07260ec1dd3d0c2b955f04ed1465e8c2af1a16006174a717ad606ae37a536a2b` | `55ced7e6847745c70453c4ddf09af71a5fb7265d646773091f4b68e07a38da98` |
| canonical SHA-256 | `2284f4741b1f2393e9d036c9887b257e8dda87f36e38370473002d462484877d` | 相同（canonical 未改） |
| source manifest `listening_contract.count` | 6 | 9 |
| source manifest `listening_contract.sha256` | `07260ec1dd3d0c2b955f04ed1465e8c2af1a16006174a717ad606ae37a536a2b` | `55ced7e6847745c70453c4ddf09af71a5fb7265d646773091f4b68e07a38da98` |
| audio manifest `exercise_bindings` | 6（仅9-4至9-6） | 9（覆盖9-1至9-6） |
| audio manifest SHA-256 | `1a1b53058fa9628c9df3e4979cae195941c138c2cfe8922eae521a7eae01b0c1` | `a56870a2d601ad5a6eb082bb169e081df7def71005edfcfa567c8d695cb288a6` |
| source manifest `audio_manifest.sha256` | `1a1b53058fa9628c9df3e4979cae195941c138c2cfe8922eae521a7eae01b0c1` | `a56870a2d601ad5a6eb082bb169e081df7def71005edfcfa567c8d695cb288a6` |

## 新增的三条记录

以下字段均从 `canonical-source.json` 原有 section 内容复制／推导，没有改写题目或答案：

| exercise_id | 教材标题 | 印刷页 | 音频 | 题数 | coverage_refs |
|---|---|---:|---|---:|---|
| `text.vocabulary` | 词语 | P77–P78 | 9-1 | 27 | `vocabulary.entries[1..27]` |
| `text.vocabulary_comprehension` | 听词语。听第一遍，从图片中选择你听到的词语，并标上序号；听第二遍，跟读 | P78–P79 | 9-2 | 7 | `vocabulary_comprehension.groups[0]` |
| `text.listening_sentences.exercise_9_3` | 一、听句子，判断对错 | P79 | 9-3 | 10 | `listening_sentences.exercises.exercise_9_3.items[1..10]` |

每条记录保留教材原文标题、教材印刷页、对应音频标签、题数、`coverage_refs` 和 `semantic` pending 状态；新增 `items_sha256` 仅用于 canonical 内容回溯。

## 重新验证结果

### JSON 与 hash

- `canonical-source.json`：JSON 可解析；实际 SHA 与 contract 内及 source manifest 中记录均为 `2284f474…4877d`。
- `listening-exercise-contract.json`：JSON 可解析；9 条记录；实际 SHA 为 `55ced7e6…da98`。
- `audio-manifest.json`：JSON 可解析；实际 SHA 与 source manifest 保持 `a56870a2…88a6`。
- `source-manifest.json`：JSON 可解析；`listening_contract.sha256` 与修正后的 contract 实际 SHA 一致，`count=9`。

### contract 数量与音频覆盖

- contract 记录总数：**9**。
- 新增记录：**3**（9-1、9-2、9-3）。原有 9-4、9-5、9-6 六条保持题目、答案引用和内容不变。
- contract 中音频标签去重后为：**9-1、9-2、9-3、9-4、9-5、9-6（6/6）**。
- canonical 的前三个音频 section 现在均有对应 contract 记录。
- canonical 的 `listening_exercise_group_count=6` 继续表示 6 段音频／6 个板块；contract 的 9 条记录是把三段短文各自的第一遍与第二遍拆成 exercise-level 项目后的总数，二者计数口径不同，未修改 canonical。

### 音频绑定与六段音频文件

- `audio-manifest.exercise_bindings` 现为 9 条，与 contract 的 9 条记录一一对应；前三条分别绑定 9-1、9-2、9-3，未改题目文字或答案。
- 6/6 原始 MP3 均存在，重新计算 bytes／SHA-256 并用 `ffprobe` 解码通过；与 audio manifest 一致：

| 音频 | bytes | SHA-256（完整） | 解码 |
|---|---:|---|---|
| 9-1 | 819190 | `8322ba07d5f22db4c2a9f9b0f4cda6bda9e29db8b06871c77268e704b9a77320` | 通过 |
| 9-2 | 434250 | `39d304b722d8b382e41ff40467aa157c854f2a3b02d7cd781703f6259a02d292` | 通过 |
| 9-3 | 1074145 | `68a1dc11366ed1c6d4949de1f76edf01e8f361408c0350eebdf6a9448b698fc2` | 通过 |
| 9-4 | 1106746 | `9e5fbe68debdfe0fbaec36fd4264b14b6ed2bd9b930805a19d339d66961c234c` | 通过 |
| 9-5 | 1013959 | `4cda86d58af50ca4ecd5dca46ec712537ae0c0d6545c41d3bc14355a97f46213` | 通过 |
| 9-6 | 874779 | `e30f25b5a404d9f19e0c482181ed56a0fe62e49a144ea6bd86cf222f7c989ee7` | 通过 |

技术解码通过不等于语义听核或 PowerPoint 播放已经完成。

## 仍需 Adam 决定的事项（P1）

1. 答案 PDF 页码仍有 inventory `[24,25]`、视觉内部页 `[25,26]`、页脚印刷 `[22,23]` 三种口径；需 Adam 确认后统一引用。
2. 9-6 文本中的扫描注音 `逛（guì）` 及「后海」前动词仍需音频语义听核与页面确认。
3. 若 Adam 对 contract 的课次范围另有定义，应在不改题目／答案的前提下记录范围决定；本次已按“canonical 每个音频单元都需 exercise-level 回溯”处理。

## 其他待修事项（P2/P3）

- 原有短文六条的 `order` 仍按各短文内 1、2 编号；本次不改既有顺序。若全课排序要求全局唯一，应另行定义 `section_order`／`exercise_order` 或重编号。
- 当前 `scripts/` 未发现正式 listening-contract validator；本次完成 JSON、hash、路径、数量与音频技术等价检查，正式 validator 可用后需补跑。
- contract、source manifest、audio manifest 状态仍为 draft／`pending_review`；未新增 `approved` 或 release 状态。

## Gate 状态与下一步

- Gate A 来源审核：**仍 pending，有 P1 残留**。
- 来源批准：**未批准**；`source-manifest.status=pending_review`、`approved=false`。
- 下一最小可验证步骤：Adam 确认答案页口径、9-6 文本和 contract 范围；随后进行 6 段音频语义听核／课堂播放测试，再重跑正式 listening-contract validator（若工具恢复）。
