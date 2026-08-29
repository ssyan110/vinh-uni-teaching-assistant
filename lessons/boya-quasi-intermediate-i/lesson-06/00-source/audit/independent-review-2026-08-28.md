# 第6课来源包独立审核（2026-08-28）

## 审核范围与方法

- 课次：第6课《大岛参加了学校的合唱团》
- 范围：`00-source/` 四份 JSON、来源页／答案页审计、全书 source inventory、6 个原始 MP3。
- 方法：只读解析 JSON；重新计算课次 manifest 交叉 SHA-256；逐一检查音频路径、bytes、SHA-256 与 `ffprobe` 解码时长；核对题组顺序、标题、教材印刷页码和音频标签。
- 本报告不修改 canonical、contract、audio manifest 或 source manifest，不批准来源，不生成 PPTX。

## 总结

课次来源包四件套完整，JSON 均可解析，manifest 交叉 hash 与 6/6 音频文件均通过技术核对。当前仍有两个必须在来源批准前处理的事项：

1. **高优先级待确认：**印刷教材与答案文本使用人名「大岛」，全书 `source-inventory.json` 与全书结构盘点写作「大圣」。当前课次 canonical 采用视觉来源的「大岛」，但尚未取得 Adam 明确确认。
2. **中优先级可修正：**答案证据的页码表示不一致：全书 inventory／结构审计登记 PDF 18–19，课次审计与 manifest 记录实际含第6课文本的 PDF 19–20；答案审计文件名仍为 `answer-pages-18-19-audit-draft.md`，容易造成回溯误读。

6 段音频目前仅完成文件级技术验证；语义逐段听核和 PowerPoint 内嵌播放仍为 pending。因此本课不可标记 ready、approved 或 release。

## 1. 四份 JSON 与交叉 manifest

| 文件 | JSON | 实际 SHA-256 | source manifest 记录 | 结果 |
|---|---|---|---|---|
| `canonical-source.json` | 通过 | `e3c3a7dc72d72a25ce137693af868911781dde44e85e21756a262361ce2dfce2` | 相同 | 通过 |
| `listening-exercise-contract.json` | 通过 | `589fbae5ee126646f371082e02e618245fc0f7137c712bb3642c43cba3224faa` | 相同 | 通过 |
| `audio-manifest.json` | 通过 | `2977587fe3ba1f07b0598a35197d6726bf8a04797155934386ff56e37d129cec` | 相同 | 通过 |
| `source-manifest.json` | 通过 | `65c5213c66fc126d79bcc3e4d264bb086faaf689b5533e5c2ea1958f59224ede` | 不适用（自身 hash 未登记） | 通过 |

四份文件的 `lesson_id` 均为 `lesson-06`，标题均为「大岛参加了学校的合唱团」。`source-manifest.json` 的 `approved=false`、`source_status=pending_review` 与 `canonical.review.approved=false` 一致，未发现误标批准状态。

## 2. 教材页、答案证据与题组

### 教材页

- 主教材 PDF 第64–71页对应印刷 P51–P58；课次页面审计已逐页列出 P51 至 P58 的板块、词语、题组和综合练习。
- canonical 的 `page_map.printed_pages` 为 `[51,52,53,54,55,56,57,58]`，`pdf_pages` 为 `[64,65,66,67,68,69,70,71]`，与来源页审计一致。
- 词语共25项；词语理解 5项；听说句子判断 10题；短文3篇；常用表达2组；综合练习3项。contract 登记6个音频题组，顺序为 L06-E01 至 L06-E06。

### 听力题组与音频映射

| 题组 | 原文标题 | 教材页 | 音频 | 题数 |
|---|---|---|---|---:|
| L06-E01 | 词语 | P51–P52 | 6-1 | 25 |
| L06-E02 | 一、听词语。听第一遍，从图片中选择你听到的词语，并标上序号；听第二遍，跟读 | P52 | 6-2 | 5 |
| L06-E03 | 听句子，判断对错 | P53 | 6-3 | 10 |
| L06-E04 | 短文一　大岛的业余爱好 | P53–P54 | 6-4 | 6 |
| L06-E05 | 短文二　一次偶然事件让她进入了合唱团 | P54–P55 | 6-5 | 7 |
| L06-E06 | 短文三　参加合唱团的得与失 | P56–P57 | 6-6 | 5 |

题组 `order` 连续为 1–6；contract 的所有音频标签恰好覆盖 6-1 至 6-6，无缺失、重复或跨课次标签。短文的成段表达与比较阅读属于开放式产出，canonical 明确标记为无唯一答案，未被冒充为参考答案。

### 答案证据差异

- 课次答案审计记录：PDF 第19页（印刷页16）含词语理解、6-3 判断答案和短文一开头；PDF 第20页（印刷页17）含短文续文。
- `canonical-source.json` 和 `source-manifest.json` 采用 PDF `[19,20]`，这是当前课次材料中更具体的定位。
- 全书 inventory 与结构审计仍登记 `[18,19]`；`canonical` 中的 `answer_status` 文本还出现 `answer_pdf_18/19` 与 `answer_pdf_19` 标记，且答案审计文件名为 `answer-pages-18-19-audit-draft.md`。

**结论：**不是音频或题组映射错误，而是答案证据命名／引用范围不统一。来源批准前需用扫描页再次确认并统一文件名、字段和所有引用；在未统一前，不应删除旧证据或直接覆盖 inventory。

## 3. 六段音频技术检查

实际文件全部存在，实际 bytes、SHA-256 和 `ffprobe` 时长均与 `audio-manifest.json` 一致。

| 标签 | bytes | SHA-256 | 时长（秒） | 解码 | 语义听核／PPT播放 |
|---|---:|---|---:|---|---|
| 6-1 | 835908 | `e6a10655fad4e516ee464b3abf473a8b265690687fbcb503856e6f0f340e00e8` | 51.931429 | 通过 | pending |
| 6-2 | 417531 | `4fd7127fe75a122db88809a652f37116876fd117b9ade982d90fa64eec2b5b68` | 25.782857 | 通过 | pending |
| 6-3 | 1029841 | `c12e3a9488ba340ea856e79b4881787ffa586886f170dcd47e5e570386403e83` | 64.052245 | 通过 | pending |
| 6-4 | 921590 | `fb40784e9b2d9a441d858900a77f1186134c82238d9423da572b9c2ee7dc414f` | 57.286531 | 通过 | pending |
| 6-5 | 949175 | `03b57cddfcff2e4a76801a592d50af1eb449b984a4df5c465c2726d27512406e` | 59.010612 | 通过 | pending |
| 6-6 | 773214 | `61198dc3eaef408f46b1b57c97952d9c91561b30f3ef4c2ce018185e1fc851e2` | 48.013061 | 通过 | pending |

技术结果为 **6/6 bytes、6/6 SHA-256、6/6 解码通过**；这不等同于语义内容与教材题号已经由教师确认。

## 4. 「大岛／大圣」差异

- 主教材 P51 标题页、P53–P57 正文及答案文本均写作「大岛」（短文中为「大岛由美」）。
- 全书 `source-inventory.json`、`book-content-inventory.md`、`book-structure-audit.md` 与 QR inventory 的课名字段写作「大圣」。
- 课次四份 JSON 统一采用「大岛」，并在 blockers 中保留差异说明；这是可追溯的暂存选择，不是 Adam 的最终批准。

**必须由 Adam 决定：**以印刷／答案视觉证据统一修正全书索引为「大岛」，或保留「大圣」作为历史索引别名并在课程 manifest 中登记映射。决定后需同步更新所有派生字段并重新计算 hash。

## 5. 缺陷分级与可直接修正项

### P1／阻塞来源批准

- 人名／标题冲突尚未获得 Adam 决定。
- 6 段音频尚未完成语义逐段听核与 PowerPoint 内嵌播放实测。

### P2／应在下一次来源修订中修正

- 统一答案 PDF 的实际页码范围（当前具体课次证据为 PDF 19–20），并同步修改审计文件名、`canonical` 的 `answer_status` 引用和 `source-manifest` 的 audit 列表；全书 inventory 的 18–19 需保留为待 reconciliation 记录，不能静默覆盖。
- 正式 `validate_listening_exercise_contract.py` 不在当前 `scripts/` 中；目前仅完成等价的 JSON、结构、hash、路径和音频技术检查。脚本恢复后，应补跑正式 validator。

### 未发现的结构错误

- 四份 JSON 可解析，交叉 SHA-256 一致。
- 6 个题组顺序、标题、页码、题数和 6-1…6-6 音频映射完整。
- 六段 MP3 均存在且技术可解码。
- 未发现 `approved=true` 或 release 写入。

## Gate 状态与下一最小步骤

- Gate A 来源审核：**pending／有 P1 blocker**。
- 来源批准：**未批准**。
- 教学重组、教师手册、配套材料、Storyboard、PPTX：**不得进入**。
- 下一最小可验证步骤：Adam 先确认「大岛」及答案 PDF 页码；随后统一证据引用并补做 6 段音频语义听核与教师播放测试，再重新计算受影响 manifest hash。

