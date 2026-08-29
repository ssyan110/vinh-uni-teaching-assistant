# 第12课《散步》来源包 listening exercise contract 覆盖修正审核

审核／修正日期：2026-08-28  
范围：`lessons/boya-quasi-intermediate-i/lesson-12/00-source/`。本次只修正听力题组 contract 的 exercise-level 覆盖，重跑 JSON、交叉 SHA、coverage 与六段音频技术检查；不改教材文字、答案、页码争议、canonical source、audio 文件或批准状态，不生成 PPTX。

## 结论与分级

- **P1（结构覆盖，已修正）**：原 `listening-exercise-contract.json` 只有三篇短文的一至三共 6 条记录，遗漏 canonical source 已有的 12-1 词语、12-2 词语理解和 12-3 听说句子。已在 contract 前部补入 3 条 exercise-level 记录，现为 9 条。
- **P2（仍待 Adam）**：答案 PDF 文件页／印刷页口径、常用词语与表达例句、三项说一说参考词语／表达、综合练习结构及三个 compare 字段等既有审核事项不在本次修正范围，保持原状态；页面与答案争议没有改写。
- **P3（音频／工具）**：六段音频仍待语义听核与教师／PowerPoint 实际播放；工作区未提供正式 `validate_listening_exercise_contract.py` 与 schema，本次完成等价 JSON、hash、coverage、路径、bytes、ffprobe 与解码检查。

## 已完成的安全修正

新增记录均依据 `canonical-source.json` 现有标题、页码、题数、音频标签、coverage locator 与 canonical 内容 hash；既有短文六条未改：

| exercise_id | canonical 覆盖 | 教材标题／页码 | 音频 | 题数 | items_sha256 |
|---|---|---|---|---:|---|
| `text.vocabulary` | `vocabulary.entries[1..27]` | 词语／P105–P106 | 12-1 | 27 | `0ae1975bdb0d54cf6942c5bdb759a2faf3c34ec77d849b50baf693465766602e` |
| `text.vocabulary_comprehension` | `vocabulary_comprehension.groups[0]` | 听词语……跟读／P106 | 12-2 | 7 | `ba270ba15b4c0464ca03dd65af1f44a4563d019aced0924e05c81adabf977bfe` |
| `text.listening_sentences.exercise_12_3` | `listening_sentences.exercises.exercise_12_3.items[1..10]` | 听句子，判断对错／P107 | 12-3 | 10 | `78c287b9e7cadb21ad97a7242abb215e39d2d8172fdc7840ca7d91acf65b0b2a` |

`source-manifest.json` 已同步 `listening_exercise_contract_sha256` 为 `d7f8b7ebd5a588e3b5eba1137abcd3e560ae15da915762fc29bba5460873db76`，`listening_exercise_contract_detail.exercise_count` 由 6 更新为 9。`audio-manifest.json` 没有 `exercise_bindings` 字段，因此无需新增或同步 bindings；其六条 track 记录保持不变。

canonical 的 `content_inventory.listening_exercise_group_count=6` 保持不变：它表示 6 段教材音频／板块；contract 的 9 条是将三篇短文各拆成第一遍与第二遍后的 exercise-level 记录，计数口径不同。

## 重新验证

### JSON 与交叉 SHA

| 文件 | bytes | 实际 SHA-256 | 结果 |
|---|---:|---|---|
| `canonical-source.json` | 14,071 | `d465dec552b8efef27dea0d9f0d772634e45eb6db4cfd4caf5e99cbc547d6f01` | JSON PASS |
| `listening-exercise-contract.json` | 6,441 | `d7f8b7ebd5a588e3b5eba1137abcd3e560ae15da915762fc29bba5460873db76` | JSON PASS；manifest contract SHA 一致 |
| `audio-manifest.json` | 3,003 | `205f334a669ef3d7b5d23853f8b5b22d0615c8b70c0d1f615c4ec541d8dfb458` | JSON PASS；manifest audio SHA 一致 |
| `source-manifest.json` | 3,799 | `8e302bfc0f5c0fa84c806d0c5824066797d42164c57b59b1d477706a4964dacc` | JSON PASS |

交叉结果：contract 的 `canonical_source.sha256` 与 source manifest 的 canonical SHA 均回指 canonical 实际 SHA；source manifest 的 contract SHA 回指 contract 实际 SHA；audio manifest SHA 回指 audio-manifest 实际 SHA，全部 PASS。原 source／answer PDF hash 与审计路径也保持原登记。

### contract 覆盖

- 记录数：**9**；音频标签去重后为 **12-1、12-2、12-3、12-4、12-5、12-6（6/6）**。
- 新增 12-1／12-2／12-3 的题数分别为 27／7／10；与 canonical 对应数组重算的 `items_sha256` 分别一致。
- canonical 的前三个教材听力单元现在均有 exercise-level contract；9 条音频引用全部存在于 audio-manifest。

### 六段音频技术复核

重新计算本地文件 bytes／SHA-256，以 `ffprobe` 读取时长并以 FFmpeg 解码；6/6 通过。时长按 manifest 小数位比较：

| 音频 | bytes | SHA-256 | ffprobe 时长（s） | 解码 |
|---|---:|---|---:|---|
| 12-1 | 751,063 | `0046a2acc58578a44402eed233213858b7bc33229a2665072a077a53df39adc5` | 46.628571 | PASS |
| 12-2 | 388,274 | `427c06de928174b14cb3152bc9673ba67d9ad87b70f2f30a9d5ec7aec1d6ebdf` | 23.954286 | PASS |
| 12-3 | 848,865 | `cd6492e404f3e090c87c8eeb1246f43d70925c2cb4ac92bc072d0e14d03ccd44` | 52.741224 | PASS |
| 12-4 | 939,144 | `9685d6f19a703e68786b3890da2dd5c1695d39f2888432ec773bad09569155af` | 58.383673 | PASS |
| 12-5 | 725,567 | `94256f12b0900b9d622a5c64e7b1d0d30aaf9d9f2641f5aedbc9f28a90446240` | 45.035102 | PASS |
| 12-6 | 971,745 | `fb8c2763dd7f5993a55871fc13df63a9af461bad1b684d9fbc7e4b7bfd23a179` | 60.421224 | PASS |

### 状态与边界

`source_status=pending_review`、`source_qa_status=blocked`、`review_status=awaiting_adam_review`、`approved=false`、canonical `review.approved=false` 与 contract `status=draft` 均保持不变。没有写入 `20-approved/`，没有生成 PPTX 或 release。既有答案页码、例句／参考词语、综合表格及 compare 字段争议未在本次触碰。

## 下一步

Adam 需先审核 canonical 与新增 3 条 contract 的标题／页码／题数，再完成六段音频语义听核和教师播放测试；来源批准前不得进入教师手册、配套材料或 PPT storyboard。
