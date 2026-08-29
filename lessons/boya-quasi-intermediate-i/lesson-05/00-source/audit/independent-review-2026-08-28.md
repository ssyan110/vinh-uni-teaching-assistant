# 第五课《我的音乐老师》独立来源包审核

**审核日期：2026-08-28**  
**审核范围：** `lessons/boya-quasi-intermediate-i/lesson-05/00-source/` 四份 JSON、既有页面／答案／音频审计、主教材 P42–P50、答案页、QR 映射和本地 5-1 至 5-6。  
**结论状态：`pending_review` / `draft`；未批准、未生成 PPT、未修改教学内容。**

## 1. 审核方法与证据

- JSON 逐一解析，并重新计算 canonical、听力契约、音频 manifest 和 QR 截图 SHA-256。
- 主教材视觉复核：`/tmp/boya-l5-review-8hoWSH/main-055.png` 至 `main-063.png`（PDF 第55–63页，印刷 P42–P50）。扫描 PDF 没有可用文字层，因此以页脚、标题、板块、题目和音频编号视觉核对。
- 答案视觉复核：`/tmp/boya-l5-review-8hoWSH/answer-17.png`、`answer-18.png`。画面页脚为答案印刷 P14–P15；source-inventory 将本课答案页记为 P16–P17，编号差异列为待确认项。
- 音频重新执行文件存在、文件大小、SHA-256、ffprobe 时长／容器／采样率／声道和 MP3 解码核对；语义听辨与教师设备播放不在本次自动核对范围内。

主教材 PDF SHA-256：`39899d0f400e187f57c16db821f8f4c207f936eae0e4fbfe3cab52c02bfea806`。  
答案 PDF SHA-256：`3c21e1574b0187259769799d183eca78a60a515b5b7fce202eda9e9ade2c20b8`。

## 2. 四份核心 JSON 与交叉引用

| 文件 | 实际 SHA-256 | source-manifest／contract 引用 | 解析 |
|---|---|---|---|
| `canonical-source.json` | `d7f8283e371bef2e4d40e1ae7f6458ae8a43e92f7e489d467bc902317625a509` | source-manifest `canonical_source_sha256`、contract `canonical_source.sha256` 均一致 | PASS |
| `listening-exercise-contract.json` | `fa475b237cbc0a0c9c6a5cdf05f9e5b667d749c8d86b5625eb27777499326c91` | source-manifest `listening_exercise_contract_sha256` 一致 | PASS |
| `audio-manifest.json` | `8881142e2803efd2d289ee11c9b2dcf5f0c06298982ce685a53fca399c513189` | source-manifest `audio.manifest_sha256` 一致 | PASS |
| `source-manifest.json` | `512ed07200752487e9dfe68e41981c7ee78c1d522e4f23d3f169519da8d6b2bd` | 自身无回指，内部所有文件路径／hash 逐项核对 | PASS |

source-manifest 的 page audit、answer audit、audio technical audit、QR capture 和 listening contract 路径均存在且 hash 一致。`answer_audit` 当前复用 `audit/source-pages-42-50-audit-draft.md`；该文件确实包含答案及听力文本记录，因此不是缺档，但命名不够独立（见观察项）。

## 3. P42–P50 视觉板块覆盖

| 印刷页 | 视觉核对到的内容 | 音频／题组 |
|---:|---|---|
| P42 | 第5课《我的音乐老师》课名页；词语 1–17 | 5-1 |
| P43 | 词语 18–24；专有名词《茉莉花》《康定情歌》；词语理解「关于音乐的词语」图片 A–D | 5-2 |
| P44 | 词语理解「关于生活的词语」图片 A–C；听说句子「听句子，判断对错」10题 | 5-3 |
| P45 | 短文一《我从小就喜欢唱歌》；第一、二、三、四项 | 5-4 |
| P46 | 常用词语和表达「介绍经历」；短文二《老师上课教什么》第一、二项 | 5-5 |
| P47 | 短文二第三、四项；常用词语和表达「介绍人物」 | 5-5 |
| P48 | 短文三《老师讲课的风格》第一至四项 | 5-6 |
| P49 | 常用词语和表达「谈论学习」；综合练习填表 | 回听 5-4/5-5/5-6 |
| P50 | 综合练习「说一说」；拓展练习 | 回听 5-4/5-5/5-6 |

视觉页码、板块顺序、词语数量（24）、专有名词数量（2）、词语理解 2 组／7 题、听说句子 10 题、三篇短文和综合练习 3 项与 canonical 的 inventory 一致。

## 4. 六个短文听力题组

逐项检查 `exercise_id`、教材原题名、题目页、音频、题数、locator、`exercise_metadata` 和 items hash。独立加载 validator 逻辑后，六组均为 `ready`（6 个 canonical 题组 = 6 个 contract 题组，`failures=[]`）。

| exercise_id | 教材原题名 | 题目页 | 音频 | 题数 | 检查 |
|---|---|---:|---|---:|---|
| `text.short_text_1.exercise.first_listen` | （一）听第一遍，简单回答问题 | P45 | 5-4 | 2 | PASS |
| `text.short_text_1.exercise.second_listen` | （二）听第二遍，用括号中的词语说出三个句子，不少于20字 | P45 | 5-4 | 3 | PASS |
| `text.short_text_2.exercise.first_listen` | （一）听第一遍，简单回答问题 | P46 | 5-5 | 2 | PASS |
| `text.short_text_2.exercise.second_listen` | （二）听第二遍，用括号中的词语说一句，第3题要求说三个句子，不少于30字 | P46 | 5-5 | 3 | PASS |
| `text.short_text_3.exercise.first_listen` | （一）听第一遍，简单回答问题 | P48 | 5-6 | 2 | PASS |
| `text.short_text_3.exercise.second_listen` | （二）听第二遍，用括号中的词语说出三个句子，不少于20字 | P48 | 5-6 | 3 | PASS |

词语理解和听说句子不被错误地伪装成短文一／二题组：5-2 仍是两组图片题，5-3 仍是独立的 10 题判断题。

## 5. 答案页与封闭答案

答案视觉页核对到：

- 词语理解 5-2：「关于音乐的词语」`1.A 2.B 3.D 4.C`；「关于生活的词语」`1.A 2.B 3.C`。
- 听说句子 5-3：`1 错、2 对、3 错、4 错、5 错、6 对、7 错、8 错、9 对、10 错`。
- 三篇听力文本均存在于答案页，并在既有页面审计中转录；短文题组的简单回答、造句、口语表现和综合表格属于开放任务，不补唯一标准答案。

## 6. 六段音频技术复核

| 音频 | 文件 bytes | 实测 SHA-256 前12位 | ffprobe 时长 | 编解码 | 结果 |
|---|---:|---|---:|---|---|
| 5-1 | 885,645 | `1c1d9029e5b4` | 55.040 s | MP3／44100 Hz／mono；decode passed | PASS |
| 5-2 | 585,551 | `ea449e40711c` | 36.284 s | MP3／44100 Hz／mono；decode passed | PASS |
| 5-3 | 983,030 | `4f335875bde6` | 61.127 s | MP3／44100 Hz／mono；decode passed | PASS |
| 5-4 | 645,737 | `be5874171246` | 40.046 s | MP3／44100 Hz／mono；decode passed | PASS |
| 5-5 | 896,512 | `2a0aa676c619` | 55.719 s | MP3／44100 Hz／mono；decode passed | PASS |
| 5-6 | 788,261 | `ee68c73d15eb` | 48.953 s | MP3／44100 Hz／mono；decode passed | PASS |

六段实际 SHA-256、bytes 和时长均与 canonical、audio-manifest 及 source-inventory 一致。audio-manifest 的 `semantic_status=not_listened`、`teacher_playback_status=pending` 与 canonical 的 `semantic_status=pending_teacher_playback` 均保持未批准状态；这是待完成 gate，不是技术文件通过的替代品。

## 7. 缺陷分级与处理建议

### P1 — 必须 Adam 确认：5-3 题目文字与教材／答案存在逐字冲突

主教材 P44（`main-057.png`）、答案页（`answer-17.png`）与 canonical 的 `sections.listening_sentences.exercises.exercise_5_3.items` 三方对照发现：canonical 的 1、2、3、4、6、7、8、9、10 共九项采用答案页文字而非主教材原题；第5项采用主教材文字，但与答案页文字不同。三方文字如下：

| 题号 | 主教材 P44 视觉原文 | canonical 当前文字 | 答案 |
|---:|---|---|---|
| 1 | `他从小就不喜欢音乐。` | `他从小就喜欢音乐。` | 错 |
| 2 | `他爱唱歌。` | `他积极参加合唱比赛。` | 对 |
| 3 | `这门课很容易学。` | `这门课我觉得很深奥。` | 错 |
| 4 | `王红每天都听音乐。` | `王红说听音乐是一种享受。` | 错 |
| 5 | `爸爸个子很高。` | `爸爸个子很高。` | 错（答案页文字为 `爸爸中等个子。`） |
| 6 | `他们喜欢乐器。` | `他们都对学习乐器很感兴趣。` | 对 |
| 7 | `上课的时候，我们不常听民族音乐。` | `老师教我们欣赏欧洲音乐和民族音乐。` | 错 |
| 8 | `老师常常问学生们问题。` | `老师鼓励同学们问问题。` | 错 |
| 9 | `老师愿意回答问题。` | `老师回答学生们的问题很耐心。` | 对 |
| 10 | `李老师对我们很热情，很关心。` | `李老师常常亲切地鼓励我们。` | 错 |

答案页视觉内容与 canonical 的 1、2、3、4、6、7、8、9、10 项一致，第5项则显示 `爸爸中等个子。`；十项判断键仍为答案页所示的「错／对／错／错／错／对／错／错／对／错」。不能在未获 Adam 决定前自动选择「主教材原题」或「答案页文字」作为 authority；应由 Adam 确认后修正 canonical、相关审计转录、items hash 和 contract 引用，再重跑 QA。

### P1 — 必须 Adam 确认：答案 PDF 页码口径不一致

- source-inventory：`answer_pdf_pages=[16,17]`。
- canonical：`page_map.answer_pdf_pages=[17,18]`。
- source-manifest：视觉复核写为 PDF 第17–18页、答案印刷 P14–P15，并把 inventory P16–P17 标为待确认。
- 本次渲染 `answer-17.png`、`answer-18.png` 的页脚确实为 P14、P15。

这不是音频或题目缺档，但会影响来源 locator 和批准证据。需 Adam 确认项目统一采用 PDF 内部页、答案印刷页，或 source-inventory 页码；确认后同步四份 manifest／audit 的页码说明。

### P2 — 可自动修正但不在本次范围：官方 validator 运行环境缺文件

工作区没有 `scripts/validate_listening_exercise_contract.py` 源文件，也没有 `course/listening-exercise-contract.schema.json`；只有 `scripts/__pycache__/validate_listening_exercise_contract.cpython-314.pyc`。使用 pyc 的正确 project-root 路径运行时，唯一失败是：

`listening contract schema unavailable: [Errno 2] No such file or directory: .../course/listening-exercise-contract.schema.json`

为核对 lesson package，本次以临时等价 schema 运行 validator 逻辑，得到 `status=ready`、6=6、`failures=[]`。恢复正式 schema／源脚本后应再跑一次正式命令；本次没有修改共享脚本或 course authority。

### P2 — 必须完成但当前状态符合规则：语义／教师播放仍 pending

5-1 至 5-6 的技术证据通过，尚未逐段语义听辨、音频与文本逐句核对、PowerPoint／教室设备播放实测。不得把 `decode_status=passed` 宣称为来源批准；完成后需更新 semantic/playback 状态并保留新的 hash 证据。

### P3 — 可自动修正的记录清晰度观察

`source-manifest.answer_audit` 复用页面审计文件，内容上已包含答案与听力文本，因而不构成缺档；若项目要求每类证据独立文件，可在不改教材内容的情况下复制／拆分为独立 answer audit，并同步 manifest hash。此项不阻挡当前 pending review。

## 8. 批准状态结论

四份核心 JSON 均可解析、hash 与交叉引用通过；六个短文题组和六段音频技术核对通过；视觉页码／板块覆盖 P42–P50。当前不能标记 `approved`，原因是 5-3 题目逐字来源差异、答案页码口径待确认，以及六段音频语义／教师播放尚未完成。`source_status=pending_review`、`approved=false`、contract `status=draft` 均符合当前状态；本次未改这些状态。
