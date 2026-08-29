# 第7课来源包独立 coverage correction

审核／修正日期：2026-08-28  
范围：`lesson-07/00-source/` 的 listening exercise contract 与 audio bindings。仅补回 canonical 已有的来源绑定；不修改教材文字、答案、canonical source、页码或批准状态。

## 发现（P1）

原 `listening-exercise-contract.json` 只有三篇短文的六个题组（6 条），遗漏 canonical source 中已有的：

| canonical section | 音频 | 题数／覆盖 |
|---|---|---|
| `vocabulary`（P59–P60） | 7-1 | 26 个词语 |
| `vocabulary_comprehension`（P60） | 7-2 | 1 组、6 个图片词语 |
| `listening_sentences`（P61） | 7-3 | `exercise_7_3`，10 题 |

缺少这三条会使完整来源包的 7-1／7-2／7-3 无法进入 contract coverage。

## 已完成的安全修正

在 contract 前置加入上述 3 条，使用 canonical 原有标题、页码、audio label、item 数、coverage refs 与内容 hash：

- `text.vocabulary` → `7-1`，`vocabulary.entries[1..26]`，SHA-256 `3a32a405caf0d5798cfbfb49a64053feefc55d7b21cab1bd08cf13b2b2b73d61`。
- `text.vocabulary_comprehension` → `7-2`，`vocabulary_comprehension.groups[0]`，6 个词语，SHA-256 `11c3ca02dce529cab6481708767f53c491d5f2dcb29123716113cd31e81df6b1`。
- `text.listening_sentences.exercise_7_3` → `7-3`，`listening_sentences.exercises.exercise_7_3.items[1..10]`，SHA-256 `71fb9abd03082629c97e248c611305b0c4d5108f18a26a7c523a9ba421e6d4dc`。

同步更新 `source-manifest.json`：

- listening contract SHA-256：旧 `8410eeb3ac04a230b265a9976227e77ff52ab0deafe628e0e017c2839a10c7d1` → 新 `1fd3a4f5e019de8d2d57a9dd7acd2973c12cd88c4176543071f51afbee6d87fd`。
- `listening_exercise_contract_detail.exercise_count`：`6` → `9`。

`audio-manifest.json` 已有完整的 `7-1` 至 `7-6` tracks 与路径／bytes／SHA 绑定，无需同步改动。

## 只读验证结果

- canonical、contract、audio manifest、source manifest 均可解析；contract 现在 9 条，source-manifest 的 contract hash 与文件实际 hash 一致。
- 新增 3 条的 canonical 内容 hash、audio label、页码与 coverage refs 一致；词语理解的 `item_count=6` 表示该组内 6 个词语，组数组 hash 与 canonical 一致。
- 6 段本地 MP3 的 bytes、SHA-256、ffprobe 与既有 technical audit 均通过；语义听核及教师播放仍 pending。
- `approved=false`、`source_status=pending_review`、contract `status=draft` 保持不变；未进入 `20-approved/`，未生成 PPTX 或 release。

## 待 Adam 确认（P2）

扫描教材的视觉转录、答案映射与六段音频语义／教师播放仍属于来源审核 gate；本次只修复 contract coverage，不代表来源批准。
