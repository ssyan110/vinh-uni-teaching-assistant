# 第六课来源包结构复核与修正记录

**复核日期：** 2026-08-28  
**复核范围：** `lessons/boya-quasi-intermediate-i/lesson-06/00-source/` 及其登记的第六课来源音频  
**复核性质：** 只读结构、哈希和技术音频复核；不批准来源，不生成或修改 PPTX

## 结论

本次没有进行结构性写入。`canonical-source.json` 已把六个教材听力单元分别登记为 exercise-level contract；当前 `listening-exercise-contract.json` 已包含 6-1 词语、6-2 词语理解、6-3 听说句子，以及 6-4 至 6-6 三篇短文。因而不应再补入重复记录，也不应改动教材题目、原文或答案。

`audio-manifest.json` 没有 `exercise_bindings` 字段，只有六条音频技术记录。依据本次任务中的“若有”，没有擅自新增该字段；音频仍通过 contract 的 `audio_tracks` 与 canonical 的 `audio`/`audio_tracks` 对齐。四份 JSON、source-manifest 交叉 SHA 和六段音频复核均通过。所有状态保持未批准，语义听核和 PowerPoint 播放实测仍待完成。

## 已核对的 exercise-level 覆盖

| contract | canonical section | 教材页 | 音频 | 题数 | coverage |
|---|---|---:|---|---:|---|
| L06-E01 | `vocabulary` | 51–52 | 6-1 | 25 | `vocabulary.entries[1..25]` |
| L06-E02 | `vocabulary_comprehension` | 52 | 6-2 | 5 | `vocabulary_comprehension.groups[0]` |
| L06-E03 | `listening_sentences` | 53 | 6-3 | 10 | `listening_sentences.exercise_6_3.items[1..10]` |
| L06-E04 | `short_text_1` | 53–54 | 6-4 | 6 | first-listen 2 题 + second-listen 4 题 |
| L06-E05 | `short_text_2` | 54–55 | 6-5 | 7 | first-listen 2 题 + second-listen 3 题 |
| L06-E06 | `short_text_3` | 56–57 | 6-6 | 5 | first-listen 2 题 + second-listen 3 题 |

canonical 的 `sections` 在综合练习中会再次引用 6-4、6-5、6-6；按唯一音频标签去重后仍为 `6-1` 至 `6-6`，与六条 contract 记录完全覆盖。`listening_exercise_group_count=6` 与上述六段音频单元一致。

## 变更与哈希

本次没有修改以下权威文件，因此前后内容与 SHA-256 均不变：

| 文件 | SHA-256 | 结果 |
|---|---|---|
| `canonical-source.json` | `e3c3a7dc72d72a25ce137693af868911781dde44e85e21756a262361ce2dfce2` | 与 source-manifest 一致 |
| `listening-exercise-contract.json` | `589fbae5ee126646f371082e02e618245fc0f7137c712bb3642c43cba3224faa` | 与 source-manifest 一致 |
| `audio-manifest.json` | `2977587fe3ba1f07b0598a35197d6726bf8a04797155934386ff56e37d129cec` | 与 source-manifest 一致 |

没有加入 `audio-manifest.exercise_bindings`，所以不需要更新 audio manifest 或 source-manifest 的音频 SHA；也没有更新 contract SHA。唯一新增文件是本审计记录。

## 重跑检查

- JSON 解析：4/4（canonical、contract、audio manifest、source-manifest）通过。
- 交叉 SHA：canonical、contract、audio manifest 的实际 SHA 均与 `source-manifest.json` 登记值一致。
- contract：6 条、顺序 L06-E01–L06-E06；六个 canonical 音频标签均有且仅有对应记录，页码、题数、coverage_refs 与 canonical 对齐。
- 音频：6/6 文件存在、bytes 与 manifest 一致、SHA-256 一致、`ffprobe` 解码通过；采样率均 44,100 Hz、单声道。核对值如下：

  - 6-1：835,908 bytes，`e6a10655fad4e516ee464b3abf473a8b265690687fbcb503856e6f0f340e00e8`，51.931429 s
  - 6-2：417,531 bytes，`4fd7127fe75a122db88809a652f37116876fd117b9ade982d90fa64eec2b5b68`，25.782857 s
  - 6-3：1,029,841 bytes，`c12e3a9488ba340ea856e79b4881787ffa586886f170dcd47e5e570386403e83`，64.052245 s
  - 6-4：921,590 bytes，`fb40784e9b2d9a441d858900a77f1186134c82238d9423da572b9c2ee7dc414f`，57.286531 s
  - 6-5：949,175 bytes，`03b57cddfcff2e4a76801a592d50af1eb449b984a4df5c465c2726d27512406e`，59.010612 s
  - 6-6：773,214 bytes，`61198dc3eaef408f46b1b57c97952d9c91561b30f3ef4c2ce018185e1fc851e2`，48.013061 s

## 保留的未决事项

- **P1（需 Adam 决定）：** 主教材标题、页面文字和听力文本均为“大岛”，但 `source-inventory` OCR/索引写为“大圣”。本次不擅自统一。
- **P2（需核对页码）：** canonical 与当前 source-manifest 将答案文本定位为答案 PDF 19–20；全局 inventory/部分审计命名使用 18–19。需在来源批准前确认偏移，不能把任一推测写成最终页码。
- **待完成但未结构性修正：** 六段音频逐段语义听核与 PowerPoint 播放实测尚未完成；现有 `pending_teacher_playback`、`technical_audio_passed_semantic_playback_pending`、`approved=false` 等状态保持不变。

本记录不改变 `canonical-source.json`、`listening-exercise-contract.json`、`audio-manifest.json`、`source-manifest.json`，不改变 draft/pending_review 状态，不批准来源，也不产生 PPTX 或 release 包。
