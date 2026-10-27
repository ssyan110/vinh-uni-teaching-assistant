---
name: boya-weekly-assessment
description: Produce and audit schedule-aligned weekly listening and speaking assessment packs for the Vinh University Boya Elementary I Year 1 Semester 1 cohort; use when one teaching week covers one or more lessons or a scheduled stage/final check.
---

# 一年级每周综合听说测验

命题或审阅时，另用 [`education-evidence-review.md`](../../../docs/workflow/education-evidence-review.md) 的 assessment check 核对「目标→学生表现→答案／量表→分数→教学决定」，并核查题目是否混入阅读负担、音频不清或同伴表现等无关因素。此审阅只生成修订意见；本卷来源、答案同步、教师亲听和批准要求仍以下文为准。

适用范围仅为 `BOYA-LS-E1-Y1S1-2026F`／`2026-fall`／`boya-elementary-i`。先读专案 `AGENTS.md`、`PROJECT_REQUIREMENTS.md`、`memory/project-memory.md`、`.agent/agent-workflow-index.md`、`.agent/agent-operating-contract.md` 与 `.agent/skills/boya-lesson-production/SKILL.md`；依专案 run loop 留下来源、验证和停止原因。课程周次以 `docs/course-rules/BOYA-LS-E1-Y1S1-2026F/README.md` 的当前版本为准，每次制作前重新核对。不要把大二课表或其他《博雅》册次混入。

## 每周固定同步流程（Adam，2026-10-16）

制作或修改测验必须执行 [周测整理与同步流程](../../../docs/workflow/weekly-assessment-sync.md)。同一现行清单同步本地题库、教师答案、Google Sheets、Google Form 和音频 dashboard；逐题读回并逐段核对及实际播放后才报告完成。一段独立音频一个题组／Section；不同题组不混放。替代版本读回正确后，直接删除现行中心内被取代的旧题、旧组卷行及无人引用的旧音频记录，不另建隐藏或 archive 分页。保留其他有效卷引用、学生作答、成绩和批准证据。题数及音频数读取本卷配置，不固定套用 W05。

## 定义测验单位

先写下 `offering_id`、周次、日期区间和完整 `lesson_key` 列表。**同一周一起上的课合成一卷**，两课都须有可见题目覆盖，并至少有一道整合两课信息的任务。不要按裸课号各做一卷。只考该周结束前实际教过的内容；若进度改变，先重核范围。

课表按本班 README 读取；实际测验版本以 `lessons/boya-elementary-i/assessment-management.json` 为入口。先解析用户指定的 `exam_id`，未指定时按实际日期、课表与登记核实目标；`current_review_exam_id` 仅作审阅入口，不能替代“最新／下周”的判断，再核对唯一登记的 directory、lesson_keys、题数、音频数、题库 SHA-256 与该卷批准记录。教学周范围不自动等于累计测验范围，Form URL 也不能识别内容版本；历史卷可能与现行卷共用 Form ID。标为 SUPERSEDED/HISTORICAL 的卷只可查档，不得成为默认输入。规划时长不是学生实测；PUBLISHED 不等于 student_ready 或教师亲听、课堂播放及实际用时通过。W07 阶段检查须留下第1–3课拼音与声调的个人表现证据；W13 诊断题依实际错题或进度另定。

## 取材与命题

逐课核对教材 source／canonical 资料、课次标题与页码、学期教师手册、实际教学进度、现有题库和音频清单。题库、旧 Google Form、旧音频只供复用和核对，不自动成为教材权威。来源缺页、课次身份冲突、进度未核实时明确标记，不以合理想象补成「已教」。保存每题的课次、考点和来源依据。

参考 [TOCFL 官方听力题型](https://tocfl.edu.tw/tocfl/index.php/test/listening/list/4) 设计听后辨识主旨、关键细节、顺序、意图及信息整合。称为「参考 TOCFL 题型的课堂测验」，不宣称官方真题、官方认证或已经做过等值定级。选择题的三个或四个选项应只有一个可辩护的正确答案；错项应来自可听出的真实误解，不能靠字面提示猜出。题目和选项与朗读稿互相独立，学生卷不泄漏全文或答案。在该卷已确认包含口说的范围内，才加入简短问答和实际开口的个人／双人任务；W04不加口说。按当卷目标检验学生是否能听懂一次、在有需要时重听，以及能否回应、追问和澄清。所有朗读稿注明说话人、听几遍、题间停顿；播放次数按题型目的决定，不假称 TOCFL 所有题目统一播放次数。

每周先定可在实际课堂执行的题数和分钟数，再写学生卷、教师卷、逐题答案依据、口语观察量表与评分表。未来测验采用适合学生程度和已教词汇／语法的TOCFL风格；实际命题时核对当时官方规格。W04 各历史／现行卷的题数不通用化，已取消的9–10听说卷不作模板。客观选择题可自动评分；简答、翻译和口语须教师人工核分。学生端用简体中文直述可执行的动作；教师端保留来源、朗读稿、正确答案、可接受变体和评分依据。口语任务给出真实信息差或变化条件，不能只重复朗读音频。读者应能在没有聊天背景的情况下开始并完成测验。

## 音频与 Google Form

Google Form题目不显示Audio编号。需要编号时，只放在对应Section名称中，按播放顺序列出；内部题库保留音频映射。

先核对音档与本题朗读稿逐字／语义相符，再做格式、时长、峰值、静音、解码和实际播放检查。旧题库对话可能把「小林：」这样的角色标记改写为会读出的「小林，」；教师卷必须区分角色标记稿与实际合成输入，不能以冒号排版掩盖音档里读出的人名。优先使用适合本班程度的课本原音或可用官方音频；另获准合成且语速或发音有问题时，使用项目已有的 OmniVoice／合适的语音工具只重做受影响的题号；重新核对说话人、停顿、清晰度与题目答案。自动转写只是辅助证据，**教师亲听前不能写「声音已验收」**。保留原档、修订档和题号映射，不覆盖来源音档。缺乏可用语音工具时交付固定朗读稿并标注待录制，不能把文本冒充音频。

全新且尚未获准发布的 Google Form，建立未发布的审阅版：身份栏、明确的播放说明、听力选择题正确答案与分值、人工核阅简答；口语现场另记分。实际打开表单核对题目顺序、媒体链接、答案键、必填、作答路径和成绩接收处。无法访问 Form 时交付可导入的题目／答案与媒体映射，不声称线上版已完成。发给学生或把材料升为 `20-approved`／`40-release`，仍须本专案相应的人类审核与播放证据。

## 每卷交付与复核

本学期一年级全新测验产出放在 `lessons/boya-elementary-i/` 下对应课次／用途的独立审阅目录。已登记的卷继续使用 management 的 directory：W05-L11L12-20261015 延用 `course/offerings/2026-fall/博雅汉语听说初级起步篇一/weekly-assessment-review/w05`，这是既有审阅包例外，不是新卷的通用输出目录，不为统一路径搬动资产。既有 course 来源／索引保留，不另在 Documents/Codex 建立教材交付目录。放置：`scope.md`（周次、课次、真实进度、来源及缺口）、`student.md`、`teacher.md`（含朗读稿与答案依据）、`items.json`、`audio-map.csv`、`score-sheet.csv` 和 `qa.md`；音频另存并登记路径、版本与检验状态。不适用文件说明原因；新审阅产出标「审阅稿／未发布」，不改写已有发布与批准历史。

复核者逐题检查：①只涉及本周已教课次或明示的累计范围；②双课各有覆盖与整合题；③文本、音频、题干、选项、答案互相一致；④简答和口语可人工判分；⑤播放和 Google Form 的真实验证范围写清；⑥时间和分数可执行。发现缺口时保留阻碍及可用审阅稿，不改教材来源、批准状态或注册表来让检查通过。

## 统一测验与音频中心（Adam，2026-10-11）

教师统一入口为 `classroom-tools/audio-dashboard/index.html`，管理来源为 `lessons/boya-elementary-i/assessment-management.json`。未来新卷沿用同一份综合管理 Sheet；按 assessment-management 的 response_policy、raw_response_spreadsheet_id 与 fixed_sheets 登记。每卷独立 Form 及原始答卷分页位于本学期原始答卷工作簿，管理中心隐藏系统数据以 exam_id 汇总；每卷另建清楚命名的“成绩-Wxx-第x–x课”，登记grade_sheet_id/title，公式读取本卷数据。成绩总览只列各卷统计。不要把中心与原始答卷后台误当同一份，也不新增每周题库／音频分页。逐卷登记学生作答链接／二维码、Form Section 音频映射、题库、音频、作答和评分链接，完成后重建并验证统一入口。没有表单的清单不可复用另一卷二维码。提交提示为「测验结束，请等待其他同学做完。」，成绩改为人工审核后公布，关闭结果摘要和再次提交链接；需要批改后发送个人结果时，收集学生手动填写的邮箱，开启答错题目和分值显示，关闭正确答案显示；不要求验证 Google 账号。配置及真实提交后的表现分别核验，不能用静态检查冒充学生端提交验收。被取代的现行资料按固定同步流程直接删除；本地历史证据与学生原始作答保留，不作现行题库输入。

## 答案同步完成条件（Adam，2026-10-11）

每次更新答案卷或答案键，必须在同一次工作中同步该卷 `items.json`、教师答案卷、Google Sheets 题库及 Google Form 自动评分答案键；题号、题型、答案内容与分值逐题读回比对，不一致不得报告完成，不等 Adam 再提醒。多项标准答案用中文逗号「，」分隔；可接受格式变体单独进入表单答案键，不把整批变体写进标准答案单元格。保留既有学生作答和批准历史；获准的格式修订记录为 amendment，实质内容变更仍须对应版本批准。核验时包含正确格式变体与内容错误的反例，明确实际提交、配置读回和学生结果页分别验证到哪里。

已获准的整理、修正与同步直接执行，不重复索取同一授权；音频 dashboard 及 Section 映射也必须同步。实质内容变更按实际批准范围执行，不能自填批准。

## 音频技术审阅 gate

现行卷使用 `production_gate.py --purpose assessment-audio-current --exam-id ID --offering-id 2026-fall --output-dir <登记目录>/audio-review-<名称>`。该路由只验证已批准输入的 hash、登记身份、音频清单与题号覆盖，允许隔离技术审阅，不批准合成、改题、发布或课堂使用。缺少批准或 hash 已改变就保留 blocker，不能更新批准 hash 来求通过。外部原始音频、听感及课堂播放另行核实。

`--purpose assessment-audio` 是旧 W04-L01L10-20261006 的固定版本修复入口，不能验证新 W04 或 W05。其固定 hash 和33段检查保留历史适用范围。W05 当前审阅包若缺批准，现行 gate 应阻挡，不能由本次规则维护补造批准。
