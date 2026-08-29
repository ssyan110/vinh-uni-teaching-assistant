# 第一课并行补齐产出 QA（只读）

检查日期：2026-08-29  
课次身份：`boya-quasi-intermediate-i:lesson-01`  
检查范围：批准 PPTX、教学设计、回溯 storyboard、教师手册草案、预习卡／活动材料草案、来源语义审计草案与现有 QA。  
权威规则：当前系主任批准的两份 PPTX 是内容决定；本检查不修改 PPTX，不把任何草案提升到 `20-approved/`，不建立 `40-release/`，不读取或混用 `boya-intermediate-i`。

## 结论

- 两份批准 PPTX 内容未被改动，哈希与 `20-approved` 登记一致。
- 教学设计、教师手册、预习卡、活动卡、评量表、Exit Ticket 与 storyboard 都明确声明由批准 PPTX 回溯或整理而来；它们仍是 `10-design` 草案，不能视为已批准课次包。
- 所有 DOCX 均可由 LibreOffice 导出 PDF；教师手册 14 页，预习卡 2 页，活动卡 1 页，评量表 1 页，Exit Ticket 2 页。
- 发现 3 项需要在进入 authority 前处理的结构／一致性问题：
  1. 回溯 storyboard 和 `content-contract.json` 使用 `canonical-source.json#sections...`，但当前 canonical source 没有 `sections` 对象；这些 `source_refs` 目前不可机器解析。
  2. 教师手册逐页记录仍写着“1-7 尚未取得／1-8 尚未取得”，与当前已有并已技术解码的本地音频及音频清单矛盾；应在人工听核时修订记录，不修改 PPTX。
  3. 四份学生 DOCX 内部没有 `lesson_key` 字段；身份只能从目录与“材料索引”推断。`lesson-01-Exit Ticket-draft.docx` 含空格和英文大小写，且学生标题仍使用英文“Exit Ticket”，未符合统一交付命名／全中文学生材料要求（虽仍为草案）。

## 已验证

### 批准 PPTX 基线

| 文件 | 检查结果 |
| --- | --- |
| `20-approved/pptx/lesson-01-在线预习.pptx` | 72 页，16:9，ZIP 完整，SHA-256 `7c2c62d4f2d55677181822610524c3fc49a963e5a0bfa042274ab629980bd900` |
| `20-approved/pptx/lesson-01-实体课.pptx` | 51 页，16:9，ZIP 完整，SHA-256 `c476cf51f63f75bc6d9afe4886b6df6a0c38d90e8a90d73e5649160c97b545e1` |

实体课 PPTX 的 1-2 至 1-8 音频关系与来源音频哈希静态匹配 8/8；实际 PowerPoint 播放仍须 Adam／教师完成。

### 草案与批准 PPTX 的来源关系

| 产出 | `derived_from_approved_pptx` | 结果 |
| --- | --- | --- |
| `10-design/teaching-design/lesson-01-teaching-design.md`、`content-contract.json`、`exercise-coverage.csv` | 是 | 页面、任务、音频编号和开放题政策均以批准 PPTX 为依据；未批准。`content-contract.json` 的结构化 source ref 需修正。 |
| `10-design/storyboard/lesson-01-ppt-storyboard-retrospective.csv` | 是 | 123 行 = 在线 72 + 实体 51；全部 `lesson_key` 正确；`retrospective_not_generation_input=true`；只作回溯证据。 |
| `10-design/storyboard/lesson-01-visual-storyboard-retrospective.md` | 是 | 明确只记录现有版式、图片、音频和页码；不作为生成输入。 |
| `10-design/teacher-manual/lesson-01-教师手册-draft.md/.docx` | 是 | 逐页文字、页码、音频和 speaker notes 回溯批准 PPTX；未加入正式课时、评分或唯一开放题答案。存在 1-7／1-8 旧音频备注冲突。 |
| `10-design/support-materials/lesson-01-预习卡-draft.docx` | 是 | 任务对应在线预习 34–47、64–71 页；只提供记录栏，不新增教材答案。DOCX 内未写 `lesson_key`。 |
| `10-design/support-materials/lesson-01-活动卡01-家庭工作爱好-draft.docx` | 是 | 对应实体课 21、31、40、46–49 页；只整理丽丽介绍与个人介绍任务。DOCX 内未写 `lesson_key`。 |
| `10-design/support-materials/lesson-01-评量表-draft.docx` | 是 | 对应实体课 47–49 页；数量和句数要求来自 PPT；评分权重保留待确认。DOCX 内未写 `lesson_key`。 |
| `10-design/support-materials/lesson-01-Exit Ticket-draft.docx` | 是 | 对应实体课 46–49 页及在线预习 70–72 页；未加入唯一答案。DOCX 内未写 `lesson_key`；文件名有空格，学生标题含英文“Exit Ticket”。 |
| `00-source/audit/semantic-review-draft-2026-08-29.md` | 否（来源审计） | 依据教材扫描页、参考答案 PDF 和音频技术清单；确认 1-7／1-8 教材段落标题，但明确内容级听核仍 pending。 |

## 简体中文与跨教材检查

- 教学设计、教师手册、预习卡、活动卡、评量表、Exit Ticket、语义审计均未发现常见繁体字；学生材料文字为简体中文。
- Exit Ticket 草案的标题含英文，不能按全中文学生材料要求直接交付；批准 PPT 封面中的既有 “Online preview” 属锁定内容，不在本次修改。
- 没有活动材料把 `boya-intermediate-i` 作为来源；回溯文件中出现的“中级冲刺篇”仅用于明确排除跨教材混用。
- 所有 storyboard 行的 `lesson_key` 均为 `boya-quasi-intermediate-i:lesson-01`；无裸课号身份。

## 待 Adam／教师完成

1. 播放并记录 1-1 至 1-8 的内容级听核，特别是 1-7 与 1-8；确认 1-7＝《丽丽工作很努力》、1-8＝《丽丽的爱好很多》的音频实际内容。
2. 将 `canonical-source.json` 的可解析 section／content ID 与 storyboard、content contract 对齐；在此之前不能宣称完整 source_refs coverage。
3. 确认正式实体课时与线上／实体边界；目前教学设计把 4 段页面分组当作暂存分段，不是已批准课表。
4. 审阅并批准教师手册及学生配套；批准前不得复制到 `20-approved/`。
5. 完成 PowerPoint 实际播放、投影／列印与教师 rehearsal；之后才能建立不可变 `40-release`。

## 现有报告的解释

`30-qa/current/pptx-chair-approved/qa-report.*` 仍正确地表示 PPTX 静态 QA 为 partial pass，但其中“教师手册、学生配套尚未建立”应理解为“尚未批准／尚未进入 authority”；本次检查确认对应草案现在已经存在。

本报告只读检查并记录上述差异，不改变批准 PPTX 或任何 authority 状态。
