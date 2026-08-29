# 第4课来源包 listening exercise contract 覆盖修正审核

审核／修正日期：2026-08-28  
范围：`lessons/boya-quasi-intermediate-i/lesson-04/00-source/`。本次只修正听力题组 contract 的 exercise-level 覆盖，重跑 JSON、交叉 SHA、覆盖与六段音频技术检查；不改教材内容、答案、canonical source、audio 文件或批准状态，不生成 PPTX。

## 结论与分级

- **P1（已修正）**：原 `listening-exercise-contract.json` 只有三篇短文的一至三共 6 条记录，遗漏 canonical source 已有的 4-1 词语、4-2 词语理解和 4-3 听说句子。已在 contract 前部补入 3 条 exercise-level 记录，现为 9 条。
- **P2（仍待 Adam）**：六段音频的语义听核和教师／PowerPoint 实际播放仍 pending；扫描页转录、P37「两三个句子」、三个比较框与 P36「又（1）」等既有审核事项不在本次修正范围，保持原状态。
- **P3（工具）**：工作区未提供正式 `validate_listening_exercise_contract.py` 与 schema；本次完成等价的 JSON、交叉 SHA、canonical coverage、路径、bytes、ffprobe 和解码检查，正式工具恢复后仍需补跑。

## 已完成的安全修正

新增记录均依据 `canonical-source.json` 现有标题、页码、题数、音频标签、coverage locator 与 canonical 内容 hash；既有短文六条未改：

| exercise_id | canonical 覆盖 | 教材标题／页码 | 音频 | 题数 | items_sha256 |
|---|---|---|---|---:|---|
| `text.vocabulary` | `vocabulary.entries[1..24]` | 词语／P32–P33 | 4-1 | 24 | `5ef33718d44e145cfdd6aa02a0d91e28c89961599ab8730b4a6f40a9406e16ae` |
| `text.vocabulary_comprehension` | `vocabulary_comprehension.groups[0]`、`[1]` | 听词语……跟读／P33–P34 | 4-2 | 8 | `e97470892a33870c4606924a47ce185a8ff495365d5dd0f8f2ea284282f43fe9` |
| `text.listening_sentences.exercise_4_3` | `listening_sentences.exercises.exercise_4_3.items[1..15]` | 一、听句子，判断对错／P34 | 4-3 | 15 | `67ba6b2a0e4b6f2ba811d1cb05ab81366b8158f82bc21c63053a7e793415b80d` |

`source-manifest.json` 已同步 `listening_exercise_contract.sha256` 为 `3888ee24eb40850b53bdfe2ec10dec396e51c5ec7dac6103ace6657dccbc8892`，`listening_exercise_contract.exercise_count` 由 6 更新为 9。`audio-manifest.json` 没有 `exercise_bindings` 字段，因此无需新增或同步 bindings；其六条 track 记录保持不变。

canonical 的 `content_inventory.listening_exercise_group_count=6` 保持不变：它表示 6 段教材音频／板块；contract 的 9 条是将三篇短文各拆成第一遍与第二遍后的 exercise-level 记录，计数口径不同。

## 重新验证

### JSON 与交叉 SHA

| 文件 | bytes | 实际 SHA-256 | 结果 |
|---|---:|---|---|
| `canonical-source.json` | 20,378 | `a83b72aa736ea30c0ce1af23b35fb83de386b47e148e0171274c526f9ef13ac3` | JSON PASS |
| `listening-exercise-contract.json` | 8,857 | `3888ee24eb40850b53bdfe2ec10dec396e51c5ec7dac6103ace6657dccbc8892` | JSON PASS；manifest contract SHA 一致 |
| `audio-manifest.json` | 3,921 | `6ac862deb05b2ba93ce7bf3c5b1e6dd15ea870931244e36ab91083a7aa4d20bc` | JSON PASS；manifest audio SHA 一致 |
| `source-manifest.json` | 3,740 | `76d246fd54fb4356e86960fc78f6508dce4c5f290ec2a36df796e10b5c89ddb1` | JSON PASS |

交叉结果：contract 的 `canonical_source.sha256`、source manifest 的 canonical 两处 SHA 均回指 canonical 实际 SHA；source manifest 的 contract SHA 回指 contract 实际 SHA；audio manifest SHA 回指 audio-manifest 实际 SHA，全部 PASS。

### contract 覆盖

- 记录数：**9**；音频标签去重后为 **4-1、4-2、4-3、4-4、4-5、4-6（6/6）**。
- 新增 4-1／4-2／4-3 的题数分别为 24／8／15；与 canonical 对应数组重算的 `items_sha256` 分别一致。
- canonical 的前三个教材听力单元现在均有 exercise-level contract；9 条音频引用全部存在于 audio-manifest。

### 六段音频技术复核

重新计算本地文件 bytes／SHA-256，以 `ffprobe` 读取时长并以 FFmpeg 解码；6/6 通过。时长按 manifest 小数位比较：

| 音频 | bytes | SHA-256 | ffprobe 时长（s） | 解码 |
|---|---:|---|---:|---|
| 4-1 | 824,205 | `46f02a4c825b2c0e1d08d5a35496fa34453142ec0c8ad2514f9a0e02c3e26797` | 51.200000 | PASS |
| 4-2 | 530,380 | `2ce4035b96a931c3192f135707d04190d772dcc69b04b69a2cdf29d4a14c0689` | 32.835918 | PASS |
| 4-3 | 1,525,541 | `b7f2d459172de811c551557926474ef0318c7d2cffca4ecc7f69c81609bcd9d0` | 95.033469 | PASS |
| 4-4 | 1,125,554 | `ea9f2e63b3cb0971d621c8ce5460a04ef1308547f5635514bde80846bcbe479e` | 70.034286 | PASS |
| 4-5 | 981,776 | `76693000356a2b28cc1381e8a7e520943a3b2c178cd96a0f025f8ea2e1456083` | 61.048163 | PASS |
| 4-6 | 1,359,193 | `c3f757061c2f300f21a3b8d2222f5eda6b29d3ce30c9224c8ae47734c66a8f11` | 84.636735 | PASS |

### 状态与边界

`source_status=pending_review`、`source_qa_status=blocked`、`review_status=awaiting_adam_review`、`approved=false`、canonical `review.approved=false` 与 contract `status=draft` 均保持不变。没有写入 `20-approved/`，没有生成 PPTX 或 release。页面审计 SHA 旧值、P37 标题、比较框摘要／原文界线和「又（1）」缺条例句仍按既有独立审核报告列为待处理事项，本次未触碰。

## 下一步

Adam 需先审核 canonical 与新增 3 条 contract 的页码／标题／题数，再完成六段音频语义听核和教师播放测试；来源批准前不得进入教师手册、配套材料或 PPT storyboard。
