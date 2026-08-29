# 第10课《中国人喜欢聚餐》独立来源包审核

**审核日期：2026-08-28**  
**范围：** `lessons/boya-quasi-intermediate-i/lesson-10/00-source/` 四份 JSON、主教材 P87–P95、答案 PDF 第27–28页、6个题组、10-1至10-6音频及审计引用。  
**结论状态：** `pending_review` / `draft`；未批准、未生成 PPT、未修改教学内容。

## 1. 核对方法与来源文件

- 四份 JSON 逐一用 `python3 -m json.tool` 解析，并重新计算 SHA-256；source-manifest 中 canonical、contract、audio manifest 的三项 hash 均与实际文件一致。
- 主教材扫描 PDF 第100–108页视觉核对为印刷 P87–P95；答案 PDF 第27–28页视觉核对为本课内容，页脚分别为答案印刷 P24、P25。扫描 PDF 没有可用文字层，最终文字仍需人工确认。
- 音频逐项核对文件存在、bytes、SHA-256、ffprobe 时长／编解码／采样率／声道及 `ffmpeg` 解码；语义听辨和教师设备／PowerPoint 播放不在本次自动核对范围内。

来源文件 SHA-256：主教材 PDF `39899d0f400e187f57c16db821f8f4c207f936eae0e4fbfe3cab52c02bfea806`；答案 PDF `3c21e1574b0187259769799d183eca78a60a515b5b7fce202eda9e9ade2c20b8`；QR 截图 `78caa2d9f4c0910a5f62edfd49821dcbc739fd327b3acb6fa2d4738853f9daae`。

## 2. 四份 JSON、hash 与交叉引用

| 文件 | 实际 SHA-256 | manifest 引用 | 结果 |
|---|---|---|---|
| `canonical-source.json` | `8f3cf1f0ab7d4b570aa20318164420151932f61784e8f3f3f06371fae886754e` | `source-manifest.canonical_source_sha256`、contract `canonical_source.sha256` 均一致 | PASS |
| `listening-exercise-contract.json` | `3e072acb38dffb2c05bafca823c279417dd99a26349e5d25196e6752dfff6896` | `source-manifest.listening_exercise_contract_sha256` 一致 | PASS |
| `audio-manifest.json` | `c48f88b65712d1445b0509809b0de16158db05fbfa3394b59ac1e227c85dc771` | `source-manifest.audio_manifest_sha256` 一致 | PASS |
| `source-manifest.json` | `73d57a65b162ecfe51d37946b625591d4887301aeadea21dc1e81dc43ec04c15` | 自身无回指；三项核心引用逐项通过 | PASS |

`source-manifest.audit_files` 的 source-pages、answer-pages、audio-technical 三条路径均存在；QR capture 路径存在。manifest 状态仍为 `source_status=pending_review`、`source_qa_status=technical_audio_passed_semantic_playback_pending`、`approved=false`。

## 3. 主教材 P87–P95 视觉盘点

| 印刷页 | PDF页 | 视觉核对内容 | 音频／题组 |
|---:|---:|---|---|
| P87 | 100 | 第10课标题；词语1–16 | 10-1 |
| P88 | 101 | 词语17–27；词语理解图片 A、B | 10-2 |
| P89 | 102 | 词语理解图片 C、D；听说句子10题；短文一问题 | 10-3、10-4 |
| P90 | 103 | 短文一第二、三、四项；常用表达「谈论时间和安排」 | 10-4 |
| P91 | 104 | 短文二第一至四项 | 10-5 |
| P92 | 105 | 常用表达「说明情况」；短文三第一项与第二项第1题 | 10-6 |
| P93 | 106 | 短文三第二项第2–3题、第三／四项；常用表达续 | 10-6 |
| P94 | 107 | 常用表达续；综合练习填表 | 回听10-4/10-5/10-6 |
| P95 | 108 | 综合练习小组活动；拓展练习 | — |

盘点数量：27个词语、1组词语理解（4图）、听说句子10题、3篇短文／6个听力题组、2组常用表达、3项综合练习；与 canonical inventory 一致。

## 4. 六个题组契约

| exercise_id | 教材原题名 | 页码 | 音频 | 题数 | 结果 |
|---|---|---:|---|---:|---|
| `L10-E01` | 词语 | P87–P88 | 10-1 | 27 | PASS |
| `L10-E02` | 一、听词语。听第一遍，从图片中选择你听到的词语，并标上序号；听第二遍，跟读 | P88 | 10-2 | 4 | PASS |
| `L10-E03` | 听句子，判断对错 | P88–P89 | 10-3 | 10 | PASS |
| `L10-E04` | 短文一　周五晚上咱们聚餐怎么样 | P89–P90 | 10-4 | 6（3+3） | PASS |
| `L10-E05` | 短文二　年轻人喜欢聚餐 | P91–P92 | 10-5 | 6（3+3） | PASS |
| `L10-E06` | 短文三　聚餐是中国人最重要的社交活动 | P92–P93 | 10-6 | 6（3+3） | PASS |

契约共6组，音频标签10-1至10-6无缺漏，exercise-level 页码、heading、audio_tracks、item_count 与 coverage_refs 均存在。官方 validator 当前无法正常执行：工作区缺少 `scripts/validate_listening_exercise_contract.py` 和 `course/listening-exercise-contract.schema.json`，仅有 pyc；按 pyc 运行结果唯一失败为 schema unavailable（见 P2）。

闭合答案视觉核对：10-2 为 `1.B 2.A 3.D 4.C`；10-3 为 `1错、2错、3错、4错、5对、6对、7对、8错、9错、10对`。三篇短文的听力文本在答案页存在；成段表达、综合表格和拓展练习属于开放产出，不补唯一答案。

## 5. 六段音频技术复核

| 音频 | bytes | SHA-256 | 时长(s) | 编解码 | 结果 |
|---|---:|---|---:|---|---|
| 10-1 | 822534 | `d350814320cef507831c2371153f75b743d99ca699010b5155ba6b2f5309f057` | 51.095510 | MP3／44100 Hz／mono；decode passed | PASS |
| 10-2 | 342717 | `793e304a288aef1c068e39a8b90b354b3c5e206e9fba4089b3ef5a058a7a5d61` | 21.106939 | MP3／44100 Hz／mono；decode passed | PASS |
| 10-3 | 1125554 | `9f6b47496ed12b4983e595cb6f8715ec94d3c89d2ee248e33e856ae8e32f2795` | 70.034286 | MP3／44100 Hz／mono；decode passed | PASS |
| 10-4 | 1045724 | `bc5bb13e286bc5f27c1b18c647b5b67da216f0bac65a22749bf4c11546e70a90` | 65.044898 | MP3／44100 Hz／mono；decode passed | PASS |
| 10-5 | 842596 | `c82e05aff3eef84dfbd67ea7b13d263bf3920d39d1bca6298afef3adc757dc70` | 52.349388 | MP3／44100 Hz／mono；decode passed | PASS |
| 10-6 | 806651 | `50945d2452e793281c3746a6c8047e719ddb9a37bcf2cde5fa6b2af98b3d1a27` | 50.102857 | MP3／44100 Hz／mono；decode passed | PASS |

6/6 文件的 bytes、SHA-256 与 canonical、audio-manifest、source-inventory 一致。`semantic_status`／`teacher_playback_status` 仍为 pending；技术解码通过不等于语义或课堂播放批准。

## 6. 缺陷分级

### P1 — 必须 Adam 确认：10-3 题目文字在主教材、答案页与 canonical 之间冲突

主教材 P89、答案 PDF P24（PDF 27）和 canonical `sections.listening_sentences.exercise_10_3.items` 的逐字核对如下。canonical 的第1、2项采用答案页版本；第3项三方一致；第4–10项采用主教材版本，但与答案页版本不同：

| 题号 | 主教材 P89 | canonical 当前文字 | 答案 PDF P24 |
|---:|---|---|---|
| 1 | `丽丽要加班。` | `周六丽丽打算和同事聚餐。` | `周六丽丽打算和同事聚餐。` |
| 2 | `翻译哪篇小说，大岛想和同学商量商量。` | `翻译哪篇小说，大岛想和老师商量商量。` | `翻译哪篇小说，大岛想和老师商量商量。` |
| 3 | `朴大宇和高中同学一起来北京了。` | `朴大宇和高中同学一起来北京了。` | `朴大宇和高中同学一起来北京了。` |
| 4 | `张华已经正式开始工作了。` | `张华已经正式开始工作了。` | `张华已经找到实习单位了。` |
| 5 | `小李也去爬山。` | `小李也去爬山。` | `小张约同事小李一起爬山，小李答应了。` |
| 6 | `老张在食堂工作。` | `老张在食堂工作。` | `老张是学校食堂的厨师。` |
| 7 | `小张挣的钱不少。` | `小张挣的钱不少。` | `小张的收入还可以。` |
| 8 | `小张常常和朋友一起玩儿。` | `小张常常和朋友一起玩儿。` | `刚来到这个地方，小张没什么社交活动。` |
| 9 | `丽丽常请同事去饭馆儿吃饭。` | `丽丽常请同事去饭馆儿吃饭。` | `丽丽中午常和同事一起去餐馆儿吃饭，费用大家分摊。` |
| 10 | `调查结果是，越来越多的人希望在家里吃年夜饭。` | `调查结果是，越来越多的人希望在家里吃年夜饭。` | `根据调查，最近两年，希望在家里吃年夜饭的人多了起来。` |

不能在 Adam 确认前自动选择主教材题目或答案页文字作为 authority。确认后需同步 canonical、题组审计转录、items hash／contract 引用并重跑 QA；本报告不修改来源。

### P1 — 必须 Adam 确认：答案 PDF 页码口径偏移

- `source-inventory.json` 将本课答案页登记为 `[26,27]`。
- canonical `page_map.answer_pdf_pages` 与 source-manifest 记录为 PDF `[27,28]`。
- 实际视觉内容从 PDF 27 开始，延续至 PDF 28，页脚为答案印刷 P24、P25。

需 Adam 确认项目统一采用 PDF 内部页、答案印刷页或 inventory 页码；确认后同步 canonical、source-manifest、answer audit 和 locator。当前不自动改号。

### P2 — 可自动修正的技术待办：正式 listening-contract validator 缺文件

`scripts/validate_listening_exercise_contract.py` 与 `course/listening-exercise-contract.schema.json` 不在工作区，只有 `scripts/__pycache__/validate_listening_exercise_contract.cpython-314.pyc`。pyc 逻辑运行唯一失败为 schema unavailable；恢复正式源脚本和 schema 后需重跑正式 validator。本次未修改共享脚本或 course authority。

### P2 — 必须完成但当前标记符合规则：语义与教师播放仍 pending

10-1 至 10-6 已完成 bytes／hash／解码技术核对，但尚未逐段语义听核、音文逐句核对和 PowerPoint／教室设备播放实测；不得把 `decode_status=passed` 视为来源批准。

### P3 — 记录清晰度观察

`source-manifest.answer_audit` 使用 `audit/answer-pages-26-27-audit-draft.md`，内容存在且已记录实际 PDF 27–28 偏移；若项目要求独立命名，可在 Adam 确认页码后拆分并更新 hash。当前不阻挡 pending review。

## 7. 最终状态

四份核心 JSON 可解析、核心 hash 与交叉引用通过；P87–P95 板块、6个题组和6段音频技术证据已核对。当前不能标记 `approved`：10-3 题目三方文字冲突、答案页码口径待确认，且音频语义／教师播放尚未完成。canonical review `approved=false`、contract `approved=false`、source-manifest `approved=false` 均保持原状。
