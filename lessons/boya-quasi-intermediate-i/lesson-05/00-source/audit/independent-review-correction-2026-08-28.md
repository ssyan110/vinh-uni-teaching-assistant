# 第5课听力题组契约覆盖修正审核

**审核日期：2026-08-28**  
**范围：** `lessons/boya-quasi-intermediate-i/lesson-05/00-source/`。本次只补齐 listening-exercise-contract 对 canonical 的前三个听力单元覆盖，并同步 source-manifest contract hash；不改 P44 题目文字、答案或页码争议，不改 audio-manifest，不批准来源，不生成 PPT。

## 1. 修正内容

原 contract 仅有短文一至三的 6 个题组，遗漏 canonical 的 5-1 词语、5-2 词语理解和 5-3 听说句子。已按 canonical 原有标题、页码、题数、音频和 coverage locator 在 `listening_exercises` 前部补入 3 项：

| exercise_id | 教材标题 | 教材页码 | 音频 | 题数 | items_sha256 |
|---|---|---:|---|---:|---|
| `text.vocabulary` | 词语 | P42–P43 | 5-1 | 24 | `6f22ac46b97bcf806d790edc6e0ad44c74d10cde46c42d752df3a93e7cbae06e` |
| `text.vocabulary_comprehension` | 听词语。听第一遍，从图片中选择你听到的词语，并标上序号；听第二遍，跟读 | P43–P44 | 5-2 | 7 | `6464b05e55c5751f0dcbecda5aeb55568c1f915051a2f34bbe5216f757a8a3ff` |
| `text.listening_sentences.exercise_5_3` | 一、听句子，判断对错 | P44 | 5-3 | 10 | `8c805c8f62a8747ac64a32c8fbece0625891ebbeaa08e1238e6e1ba44359b272` |

contract 现为 9 个题组：前三项加既有短文一／二／三各 2 项（5-4、5-5、5-6），音频标签覆盖 5-1 至 5-6，无重复或缺漏。既有 5-3 canonical 题目文字、答案与页码争议未作任何改动。

`source-manifest.listening_exercise_contract_sha256` 已由旧值 `fa475b237cbc0a0c9c6a5cdf05f9e5b667d749c8d86b5625eb27777499326c91` 更新为新值 `8189422789bb71d6a3ccd11328b12894aa8dc27658ab6f2f154de1edc98ca26d`；`listening_exercise_contract_detail.exercise_count` 由 6 同步为 9、状态仍为 `draft_pending_source_approval`。audio-manifest 未改动。

## 2. JSON、交叉 SHA 与状态复核

四份 JSON 均以 `python3 -m json.tool` 解析通过：

| 文件 | 实际 SHA-256 | 交叉引用结果 |
|---|---|---|
| `canonical-source.json` | `d7f8283e371bef2e4d40e1ae7f6458ae8a43e92f7e489d467bc902317625a509` | source-manifest 与 contract canonical 回指一致 |
| `listening-exercise-contract.json` | `8189422789bb71d6a3ccd11328b12894aa8dc27658ab6f2f154de1edc98ca26d` | source-manifest contract 回指一致 |
| `audio-manifest.json` | `8881142e2803efd2d289ee11c9b2dcf5f0c06298982ce685a53fca399c513189` | source-manifest `audio.manifest_sha256` 一致；文件未变更 |
| `source-manifest.json` | `13d6dcdf47b008bcd96f6c97ad168bb95af1eda0cab70499db5955e3f56f6798` | 三项核心 hash 均与实际文件一致 |

coverage 检查结果：前三项的 section、heading、页码、音频、item_count、coverage_refs 和 items hash 均与 canonical 对应对象一致；9/9 contract 音频引用均存在于 audio-manifest。`source_status=pending_review`、canonical `review.approved=false`、contract `status=draft`、source-manifest `approved=false` 保持未批准。

## 3. 六段音频技术复核

audio-manifest 已有 6 个 track binding，本次未新增或修改。重新检查每个本地文件的 bytes、SHA-256、ffprobe 及 MP3 解码，6/6 通过：

| 音频 | bytes | SHA-256 | 时长(s) | 格式／解码 |
|---|---:|---|---:|---|
| 5-1 | 885645 | `1c1d9029e5b40f886ea8203d8480add879170111ed44fba7d67ac6621e30d480` | 55.040000 | MP3／44100 Hz／mono；passed |
| 5-2 | 585551 | `ea449e40711cebcca767b5ab2374f30e90dcde11399975050ae2757c9b7ee5d7` | 36.284082 | MP3／44100 Hz／mono；passed |
| 5-3 | 983030 | `4f335875bde65cf149b6f979511ff07b2fabc69a8fd4c0fdc11af0cc9bcd5a97` | 61.126531 | MP3／44100 Hz／mono；passed |
| 5-4 | 645737 | `be587417124680e0a8a7f713967ee1b05a415a88944e5331c50e7bbb10f32454` | 40.045714 | MP3／44100 Hz／mono；passed |
| 5-5 | 896512 | `2a0aa676c6195103d295b3f9282c6625ff9ef99f844a541d51837ccd45b6b177` | 55.719184 | MP3／44100 Hz／mono；passed |
| 5-6 | 788261 | `ee68c73d15eb6dfbbc6aca39c01ff7649e2870fa624600091a6f66975b19d189` | 48.953469 | MP3／44100 Hz／mono；passed |

语义听辨和教师／PowerPoint 播放状态仍为 pending；技术 decode 通过不等于来源批准。

## 4. 待办与最小后续步骤

- 旧的 P44 题目文字、答案页变体及答案页码口径争议保持原状，须由 Adam 决定 authority 后再同步 canonical、题目 hash 与审计证据。
- 正式 validator 的 source/schema 缺失问题仍待恢复；本次只完成结构覆盖与交叉自查。
- 下一最小步骤：用恢复后的正式 schema／validator 对新的 9 题组 contract 重跑检查，再进入来源批准 gate；在此之前不改变 `pending_review` 状态。
