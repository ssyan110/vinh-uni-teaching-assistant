# 第一课：批准 PPTX 衍生材料核验

检查日期：2026-08-29  
课次身份：`boya-quasi-intermediate-i:lesson-01`  
检查性质：只读核验；本报告没有修改 `20-approved/pptx/`、草案内容或 authority。

## 核验规则与范围

本次把系主任批准的两份 PPTX 当作第一课的内容决定，使用完整复合课次键，不读取或混用《中级冲刺篇 I》第一课。核对范围为：

- `20-approved/pptx/lesson-01-在线预习.pptx`
- `20-approved/pptx/lesson-01-实体课.pptx`
- `10-design/teaching-design/`（教学设计、content contract、练习对应表）
- `10-design/teacher-manual/`（教师手册 Markdown／DOCX）
- `10-design/support-materials/`（预习卡、活动卡、评量表、课末检查）
- `10-design/storyboard/`（回溯 storyboard，仅作观察证据）

判断分为四类：`PPT 直接内容`、`PPT 内容的版式整理`、`内部元数据`、`PPT 未决定的新增或漂移`。只有前两类可以作为 PPT 的衍生内容；后两类不能在未确认前写成已批准教学要求。

## 批准 PPTX 基线

| 文件 | 页数 | SHA-256 | 核验 |
|---|---:|---|---|
| `20-approved/pptx/lesson-01-在线预习.pptx` | 72 | `7c2c62d4f2d55677181822610524c3fc49a963e5a0bfa042274ab629980bd900` | ZIP 完整；页数与回溯记录一致 |
| `20-approved/pptx/lesson-01-实体课.pptx` | 51 | `c476cf51f63f75bc6d9afe4886b6df6a0c38d90e8a90d73e5649160c97b545e1` | ZIP 完整；页数与回溯记录一致 |

两份 PPTX 共 123 页，并各有 123 份对应 speaker notes。实体课 PPTX 的音频编号 1-2 至 1-8 关系已静态核对；本报告不把技术可用当成内容级听核批准。

## 衍生材料结果

### 1. 教师手册：部分通过（主体为逐页回溯）

文件：

- `10-design/teacher-manual/lesson-01-教师手册-draft.md`
- `10-design/teacher-manual/lesson-01-教师手册-draft.docx`

核验结果：Markdown 1,817 行，含在线预习 72 个页面段、实体课 51 个页面段及 123 个 speaker-notes 段；DOCX 有 394 个非空段落。逐页学生文字、教材页码、音频编号和 notes 均可回溯到批准 PPTX，未发现跨教材内容或繁体字。

仍需隔离的内容：

1. `lesson-01-教师手册-draft.md:33-51` 的“四节／页面 01–18、19–29、30–40、41–51”是按页码做的暂存分段，不是 PPT 已批准的课时、节数、分组或转场安排。
2. `:114-115` 的评分字段、恢复路线、课后提交及音频故障暂停／改用教材音频，是缺失字段或备用流程记录，不是 PPT 内容决定。
3. `:1580` 与 `:1680`（对应实体课第 31、40 页）逐字保留 speaker notes 的“1-7 尚未取得／1-8 尚未取得，不虚构播放”。这是历史性的 speaker-notes 元数据；当前本地 1-7、1-8 音频已取得并通过技术检查，不能把这两句当成现在的教材状态。应在人工听核记录中修订，不能改动锁定 PPTX。

### 2. 学生预习卡：通过（内容为 PPT 整理）

文件：`10-design/support-materials/lesson-01-预习卡-draft.docx`

预习卡的三篇短文标记、三栏信息、6–8 句提纲、16 项表达／48 句自检、带入实体课的四项材料和课前检查，分别对应在线预习第 34–47、64–72 页。没有新增教材答案或固定题目；“圈出认识的词语／标记不懂处”等文字也在批准 PPT（第 35–46 页）中明示。当前仍是 DOCX 草案，未进入 authority。

### 3. 家庭／工作／爱好活动卡：部分通过（有一处标签漂移）

文件：`10-design/support-materials/lesson-01-活动卡01-家庭工作爱好-draft.docx`

6–8 句介绍丽丽、课本问题、P10 三栏整理及 P11 个人介绍要求均对应实体课第 21、31、40、46–49 页和在线预习第 64–67 页。表格第一栏使用“父母与丽丽的想法”，而在线预习第 64 页的原标签是“对去北京的态度”；这是同一信息的改写，但不是 PPT 原字，进入批准材料前应改回 PPT 标签。其余栏目（单位／职位／时间／表现、爱好／原因／有意思的事）可由 PPT 直接回溯。文件仍是草案。

### 4. 口语评量表：部分通过（核心要求来自 PPT，评价维度有新增）

文件：`10-design/support-materials/lesson-01-评量表-draft.docx`

家庭、学习／工作、兴趣爱好三部分，10 个课本词语、5 个句式和 8–10 句，直接来自实体课第 49 页；依据课本问题回答及补充短文信息可由在线预习第 65 页／实体课第 48 页回溯。

“听者理解：同伴能听懂主要信息，并能提出问题／确认”不是 PPT 的明确要求，虽然该行同时写了“具体标准 PPT 未提供”。它只能作为待批准的评量建议，不能当作第一课已批准的新增学习要求。分数、等级、权重、合格线及“需要再做一次”也属于未由 PPT 决定的评量元数据。

### 5. 课末检查：不属于纯 PPT 衍生（需单独批准）

文件：`10-design/support-materials/lesson-01-课末检查-draft.docx`

“我能说出丽丽的家庭、工作和爱好中的主要信息”及“我能介绍自己的家庭、学习／工作和兴趣爱好”可视为对实体课第 03、48–49 页的学习结果转写；但“今天实际使用了一个常用表达”“我还想问同学的问题”“我下一步要重做或补充”并未出现在批准 PPT 的课末页面。它们是可用的补充反思字段，不是 PPT 已决定的内容，必须保持草案状态并等待确认。旧的 `90-archive/lesson-01-Exit Ticket-draft.docx` 只是历史重复文件，不是当前材料。

## 教学设计与练习对应表

### 可直接回溯的部分

- `lesson-01-teaching-design.md` 的四项 Can-Do、在线／实体范围和实体课第 2 页路线，均可由实体课第 02–04 页及在线预习第 64–72 页回溯。
- `content-contract.json` 的 Can-Do、词语／短文／常用表达／综合练习的页码和 slide 证据，大部分直接指向批准 PPT；`authority_basis` 也明确写出只读 PPTX。
- `exercise-coverage.csv` 的常用表达（第 23–38 行）、综合三栏整理（第 39 行）和最终个人介绍（第 41 行）对应 PPT 页面，`lesson_key` 全部正确。

### 必须修正或标为“非 PPT 内容”的部分

1. `exercise-coverage.csv:11` 写“介绍丽丽 6–8 句不少于 60 字”。批准 PPT 第 21、38 页只要求 6–8 句，没有“不少于 60 字”；这是从 canonical source 带入的额外要求。
2. `exercise-coverage.csv:9-10、13-14、18-19` 把短文任务拆成“第一遍／第二遍听力问题”。批准 PPT 的在线页面是阅读、记录和准备，未提供这两个听力遍次标签；只能保留为来源审计元数据，不能写成 PPT 任务。
3. `exercise-coverage.csv:17` 的“读短文并与口语比较”没有出现在短文（二）对应 PPT 第 39–42 页；`exercise-coverage.csv:22` 的“小组谈谈丽丽的爱好”也没有出现在短文（三）对应 PPT 第 43–47 页。两项来自 canonical source／旧练习结构，不能作为已批准 PPT 活动。
4. `exercise-coverage.csv:40` 的“根据表格和参考词语谈丽丽”中，“参考词语”不是实体课第 48 页或在线预习第 65 页的明确文字；应删除该限定或标为来源辅助信息。
5. `content-contract.json:65` 的 `source_ref` 写成 `canonical_source.content_inventory.sections[vocabulary]`，但当前 `00-source/canonical-source.json` 的 `content_inventory` 没有 `sections` 对象。它是不可解析的追踪路径，不是内容新增；应改指向实际的 `source-extraction-draft.json#sections.vocabulary` 或另建可解析 source ID。
6. `content-contract.json:108` 以及 `lesson-01-teaching-design.md:54` 的“ 小组总结／小组补充／拓展练习”不在批准 PPT 的学生页面；作为答案政策或来源说明可以保留为待核对注记，但不能当作本课 PPT 已批准活动。

## 简体中文与课次隔离

- 对 `10-design` 的 Markdown、JSON、CSV 以及 DOCX `word/document.xml` 做简体转换差异扫描，结果为 0 个映射命中；当前学生材料正文为简体中文。批准 PPT 的封面既有英文标签 `Online preview` 是锁定内容，不属于繁体字问题。
- 全部核对文件的 `lesson_key` 为 `boya-quasi-intermediate-i:lesson-01`；本范围未发现 `boya-intermediate-i`、《中级冲刺篇 I》或《中国人的姓名》作为内容来源。

## 结论与下一步

结论：教师手册主体、预习卡和活动卡主体确实是从已批准 PPTX 整理出来的，但目前不能宣称“所有剩余材料完全等于 PPT 内容”。评量表的听者理解维度、课末检查的反思字段，以及练习对应表列出的 60 字／两遍听力／比较／小组／参考词语，都是应隔离并等待确认的新增或漂移；content contract 另有一个不可解析 source ref。它们都在 `10-design/` 草案层，尚未污染 `20-approved/`。

最小修正顺序：

1. 以 PPT 原文替换活动卡“父母与丽丽的想法”为“对去北京的态度”；
2. 从练习对应表移除或标注上述 5 类非 PPT 要求；
3. 将评量表听者理解、课末检查反思字段明确标为“补充建议，待批准”；
4. 修正 `content-contract.json` 的 `source_ref`，再进行教师手册／配套材料人工批准；
5. 完成 1-7、1-8 内容级听核后，更新手册中的 stale speaker-notes 说明；不修改已批准 PPTX。

当前 gate：PPTX authority 保持锁定且完整；衍生材料可供审阅，但教师手册、配套材料、来源语义及 `40-release` 仍未批准。
