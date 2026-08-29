# 第8课来源包独立 coverage correction

审核／修正日期：2026-08-28  
范围：`lesson-08/00-source/` 的 listening exercise contract 与 audio bindings。仅补回 canonical 已有的来源绑定；不修改教材文字、答案、canonical source 或批准状态。

## 发现

原 `listening-exercise-contract.json` 只有三篇短文的六个题组（6 条），遗漏 canonical source 中已有的：

| canonical section | 音频 | 题数／覆盖 |
|---|---|---|
| `vocabulary`（P68–P69） | 8-1 | 29 个词语 |
| `vocabulary_comprehension`（P70） | 8-2 | 1 组、5 个图片词语 |
| `listening_sentences`（P70） | 8-3 | `exercise_8_3`，10 题 |

## 已完成的安全修正

在 contract 前置加入上述 3 条，保留 canonical 原有标题、页码、audio label、item 数与内容 hash：

- `text.vocabulary` → `8-1`，`vocabulary.entries[1..29]`，SHA-256 `ba433eed1bd69d2012f3c91733fb09f67d7cf3faff175014f6320d89663a9aa1`。
- `text.vocabulary_comprehension` → `8-2`，`vocabulary_comprehension.groups[0]`，SHA-256 `8de0c800e7a3ecb0c10f214053c442dc90f1be52bf5fc73c62f0e7446b6ec7e8`。
- `text.listening_sentences.exercise_8_3` → `8-3`，`listening_sentences.exercises.exercise_8_3.items[1..10]`，SHA-256 `2df03a8f9df9bbcb6fe60153bc95fd1b101a8e1f6cbd3bc04a438b8dbc11d82e`。

同步更新 `source-manifest.json`：

- listening contract SHA-256：旧 `2de0c33340b383cc3cb624de379b45a5a61e7974330e179a9676f141bff3efb7` → 新 `dce6eb8c7a7477d2535ac7c3f3cd63f9e232bdd5db75d148f491ab66803ca81d`。
- `listening_exercise_contract_detail.exercise_count`：`6` → `9`。

## 只读验证结果

- contract 可解析，9 条记录；source manifest 的 contract hash 与文件实际 hash 一致。
- 新增 3 条的 item count 与 canonical 数组分别为 29、5、10，三组内容 hash 全部一致。
- 8-1、8-2、8-3 均与 canonical section 的 audio label 及 `audio-manifest.json` 的 track label 一致；6 段 MP3 的原有技术状态不变（bytes／SHA／解码通过，语义与教师播放仍 pending）。
- `approved` 仍为 `false`；contract 仍为 `draft`；没有进入 20-approved、PPTX 或 release。

## 待 Adam 确认

扫描教材的视觉转录、答案映射及六段音频的语义／教师播放仍属于来源审核 gate；本次修正不代表来源批准。
