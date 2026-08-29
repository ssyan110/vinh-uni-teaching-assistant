# 第11课来源包独立 coverage correction

修正日期：2026-08-28  
范围：`lesson-11/00-source/` 的 listening exercise contract 与 audio bindings。只补回 canonical 已有的 exercise-level 记录；不修改教材文字、答案、页码争议或批准状态。

## 发现（P1）

原 `listening-exercise-contract.json` 只有三篇短文的六个题组（6 条），遗漏 canonical source 已有的前三个听力板块：

| canonical section | 音频 | canonical 页码 | 题数／覆盖 |
|---|---|---:|---|
| `vocabulary` | 11-1 | P96–P97 | 23 个词语 |
| `vocabulary_comprehension` | 11-2 | P97 | 1 组、4 个图片词语 |
| `listening_sentences` (`exercise_11_3`) | 11-3 | P98 | 10 题 |

## 已完成的安全修正

在 contract 前置加入上述 3 条，保留 canonical 原有标题、页码、audio label、item 数、coverage refs 与内容 hash：

- `text.vocabulary` → `11-1`，`vocabulary.entries[1..23]`，SHA-256 `9a41e6fdea21655b8db8417b4085a45cd515fb7684383df69575344e5df5fa88`。
- `text.vocabulary_comprehension` → `11-2`，`vocabulary_comprehension.groups[0]`，组内 4 个词语，SHA-256 `87c34e42311fac78b666bb338919da7d91970fbf632deacd1c80f4dd66555da0`。
- `text.listening_sentences.exercise_11_3` → `11-3`，`listening_sentences.exercises.exercise_11_3.items[1..10]`，SHA-256 `1747247634790140520b84af6e01a2f09e3e3684a7b3122ffd927328ba8aa285`。

同步更新 `source-manifest.json`：

- listening contract SHA-256：旧 `5c0d93c4b07435a39fd7b1cec314201940a081b8027402a7241ee3671a018d41` → 新 `2c3f7c7e9f69402f6f152c80d0b8187ddea559cee4afde3671c9ff419ae394f1`。
- `listening_exercise_contract_detail.exercise_count`：`6` → `9`。

`audio-manifest.json` 已有完整的 11-1 至 11-6 tracks 与路径／bytes／SHA 绑定，无需修改。

## 只读验证结果

- canonical、contract、audio manifest、source manifest 均可解析；contract 现在 9 条，source manifest 的 canonical／contract／audio-manifest SHA 全部与实际文件一致。
- 新增 3 条的 item count、canonical compact hash、页码与 audio label 一致；9 条 contract coverage 的现有短文记录保持不变。
- 11-1 至 11-6 六段本地 MP3 的 bytes、SHA-256、ffprobe 均通过；语义听核与教师播放仍 pending。
- `approved=false`、`source_status=pending_review`、contract `status=draft` 保持不变；未写入 `20-approved/`，未生成 PPTX 或 release。

## 待 Adam 确认（P2）

答案 PDF 文件页与印刷答案页的编号差异、扫描教材视觉转录与页码 mapping 仍按独立审核报告保留待确认；本次只修复 contract coverage，不代表来源批准。
