
# Agent Workflow Index

Canonical workflow contract: `docs/workflow/canonical-workflow-contract.md`
Optimization roadmap: `docs/workflow/WORKFLOW_V2_OPTIMIZATION_SPEC.md`

Read the canonical contract first for lifecycle, gate, artifact-state, identity, and safety decisions. The longer files below remain compatibility context during migration.

This is the portable entry point for AI agents working in this project. The current course decisions are project requirements, not chat-only reminders.

## Scope-based reading order

1. Read AGENTS.md, the canonical workflow contract and the operating contract.
2. Declare project, tool, course, lesson or assessment scope; only lesson work requires lesson_key.
3. Read relevant requirements and project context, then one matching task skill. Lesson artifacts use boya-lesson-production; assessments use boya-weekly-assessment; workflow/tool changes use harness-engineering without loading the PPTX bundle.

Year-1 weekly assessment creation, correction and cleanup follow [the fixed synchronization procedure](../docs/workflow/weekly-assessment-sync.md): one current input, all output surfaces synchronized and read back, one audio group per Section, and superseded active rows deleted after replacement verification. Preserve responses, grades and valid references from other exams.
4. Read the focused artifact references and actual source/evidence needed. Shared workflows are optional context, not mandatory external dependencies.

When an authorized decision changes workflow, update its owning project rule, remove or scope superseded clauses, reconcile consumers and registry entries, and record verification. Preserve historical approval evidence. Update global memory only when Adam explicitly requests a memory update; project rule maintenance does not imply that authorization.

The adopted baseline assigns reading, audio preview, vocabulary and preparation to online PPT; in-person OpenSlide covers listening, interaction, presentation and feedback. Batch online materials ahead of the semester; plan each in-person session approximately one month to one week before class using actual progress. Do not require a new per-lesson confirmation of the established division. Exact version content still requires explicit approval.

## Default harness

Use harness engineering for every non-trivial task: identify the artifact, success gate, local context, execution path, verification method, observed outputs, and durable feedback target. Keep the harness lightweight, but do not skip it for slide, data, PDF, Google Sheets, lesson pipeline, image, or automation work.

For multi-step or artifact-producing work, use `scripts/agent_loop.py` to create a
local run packet, execute the existing production gate as a read-only preflight,
record one bounded attempt, and finish with evidence. Run state is execution
evidence only; lesson authority remains in the lesson registry and manifests.

## Shared workflow hub

Reusable cross-project workflows live at:

`/Users/ssyan110/Development/_agent_shared/`

Use those workflows only after applying this project's local rules and constraints.
Any `.kiro/` material in the shared hub is legacy context only; do not read it as
an active project requirement or maintain it.

## Course-specific routing

2026-10-27: Across future semesters, Year 1 and Year 2 physical classes use OpenSlide and the shared homepage; online preparation uses PPT/PPTX. Do not create classroom PPTX backups. Existing finalized PPTX is retained for explicit historical maintenance and read-only intake.

For future face-to-face decks, first apply the [2026-10-07 classroom HTML standard](../docs/classroom-html-standard-2026-10-07.md): HTML/OpenSlide first, the current L9–10 visual/activity reference, and level-appropriate TOCFL-style assessment. This standing choice supersedes the native-pptx default and repeated style-selection question below for this scope. Keep online preparation, lesson-specific content approvals and release gates separate.

For Boya lesson work, use the `boya-lesson-production` skill. Follow the canonical contract for lesson, offering, class, mode and artifact-specific content approval. Online and classroom versions proceed independently; neither depends on the release of a previous lesson. Existing historical records stay intact. For registered classroom HTML, use the classroom HTML lifecycle for QA, formal approval and release; homepage sync is a preview, not release. The legacy quasi-intermediate L02–L12 PPT generator does not support new scoped online versions; use the online PPTX lifecycle for new versions.

For a classroom package, the approved teacher guide or practical teacher instructions define the activity before classroom authority production: it defines
the full lesson content, key points, timing, audio, exercise coverage, teacher
actions, repair routes, answer policy, assessment and required materials. A
lesson-specific draft may precede guide approval only as reversible design
evidence and must still trace back to the source package.

## Online / selected legacy PPTX rule set

The old typography, purple accents and fixed page layouts below apply only to online preparation or explicitly selected legacy PPTX maintenance. Future classroom OpenSlide uses the 2026-10-07 classroom standard.

Face-to-face decks use the standing 2026-10-07 HTML style. For other scopes without a standing or current choice, use `course/ppt-style-registry.json` to select a style. Style selection does not replace lesson-specific workflow or content approval.

The current student-deck decisions are recorded in `.agent/skills/boya-lesson-production/SKILL.md`, `AGENTS.md` and `PROJECT_REQUIREMENTS.md`. In short:

- Use the approved educational textbook illustration system and the approved ChatGPT/Chrome contact sheet.
- Use a pure-white `#FFFFFF` slide canvas; reserve warm-white tones for local cards, image frames, or illustration content only.
- Use the finalized role-specific typography matrix: 20 pt for header/page/material/audio/keyword labels; 21 pt compact body; 22 pt ordinary body; 24 pt pinyin; 27 pt long titles; 28–34 pt task prompts with 34 pt as the default; 34 pt standard titles; 48 pt dividers; 44–50 pt lesson-specific cover titles; goals title 36 pt, teal label 23 pt, number 20 pt, goal item 24 pt; vocabulary headword 42 pt (34 pt for long headwords), part of speech about 20–22 pt, Vietnamese meaning about 20–22 pt, usage 20 pt, vocabulary examples 22 pt, and online expression examples 35 pt. Never let visible slide text fall below 20 pt; shorten, reflow, or split instead of shrinking below the floor.
- The finalized cover has no bottom subtitle. The third slide uses the lesson-specific learning-goals frame: title, teal label, then 3–4 numbered goals from the lesson content contract. Number markers are filled teal/coral/purple/yellow circles with white numerals, not outlined squares. Do not copy a protagonist, goal, subtitle, or fallback from another lesson.
- Online vocabulary pages always keep the word, pinyin, part of speech, Vietnamese meaning and image. For new lesson drafts, every vocabulary item (including proper nouns) must have exactly two short examples in `course/boya-example-bank.json`; usage, usage detail, expansion, grammar detail and common phrase remain word-specific optional fields and are omitted when blank. Never use English or canonical gloss as the meaning, and never synthesize a filler example.
- Online expression-practice pages keep only the purple rounded pattern box, two short examples at 35 pt, the student instruction and writing lines; omit the black expression title and visible context line. Context remains in the teacher-manual/design layer.
- Online preparation uses textbook section names as dividers; classroom decks use meaningful activity/section titles under the classroom standard.
- Keep coherent activities together when readable; split only for learning purpose or capacity, not merely because task types differ.
- Use plain student action language, visible material names, plain non-clickable top-right `Audio n-n` references and varied layouts. Preserve the actual source track mapping; do not embed audio, add playback buttons or playable audio hyperlinks, or style the audio reference in purple.
- Before writing or revising classroom copy, follow `.agent/skills/boya-lesson-production/classroom-copy-review.md`: teacher execution check, student instruction check, then language polish and layout. Recheck generated visible text; a keyword-only task page cannot pass merely because its notes explain the task.
- Keep teacher notes, internal IDs, time/group footers and QA information out of the student canvas.
- Run native PowerPoint PDF, contact-sheet, text, audio, notes and canvas-boundary checks before delivery.

For the historical `boya-intermediate-i:lesson-01` only, the canonical build
command is `node scripts/build_lesson_01_pptx.js`; it delegates to
`scripts/build_lesson_01_pptx_native.js`. Its prototype and outline paths are
textbook-scoped under `lessons/boya-intermediate-i/lesson-01/`. Do not use these
entries for the active quasi-intermediate lessons, and do not use retired
versioned outlines, the old 69-row storyboard generator, or the old visual
storyboard generator.

## Safety

Do not delete, move, overwrite, or broadly refactor project files unless Adam explicitly approves the scope.
Never access password notes or use credit card information. Do not create or maintain `.kiro/`; treat old Kiro files as legacy context only.


## 2026-09-21：仅本届大一第一学期的课程路由

仅当年级=大一、学期=第一学期、日期=2026-09-21至2026-12-27、教材=`boya-elementary-i`同时匹配时，先读[本班课程规划与第四课起PPT制作规则](../docs/course-rules/BOYA-LS-E1-Y1S1-2026F/README.md)（`BOYA-LS-E1-Y1S1-2026F`）。按任务结果组织第四课起PPT，教材逐项覆盖；W02安排第4—6课，W12完成首轮覆盖、W13缓冲、W14评量规划。该局部规则取代本班旧课时预算与线性栏目顺序，不扩展到其他年级、学期或未来班级，不改共用offering顶层课表。现有教材与批准不回改；新版逐页内容仍须单独批准。新增双语说明仍待逐页决定，23 pt下限保持。

## OpenSlide 统一工作区（Adam 确认，2026-10-11）

制作前先执行 `docs/classroom-html-standard-2026-10-07.md` 的「后续制作的默认执行与交付自检」。以第9–10课当前HTML的实际页型、封面、学习流程和字号为持续基准；制作agent自行完成全页内容／版面及首页播放检查，修复后交付，不重新询问已确认风格。

实体课开头固定为：第一页封面，第二页「今天我们会做什么」活动路线，第三页开始主要内容。包含现有第9–10课、第11–12课和今后制作的实体课；具体标准见 `docs/classroom-html-standard-2026-10-07.md`。

今后本项目所有 OpenSlide／课堂 HTML 简报必须登记到同一首页，不再建立孤立入口。工作区由 `course/open-slide-workspace.json` 指定；新增原生 React 简报放入该工作区的 `slides/<textbook-id>-<lesson-id>/`，HTML 简报登记到 `html_decks` 并运行同步。制作完成时验证首页可见及入口可打开。各课来源、设计、批准及交付记录仍留在原课目录；首页登记不授予教材批准。启动、同步和 HTML 播放限制见 `docs/open-slide-workspace.md`。

首页接入须保留实际页数、逐页缩略图和OpenSlide翻页，不得将多页实体课slides作为一张图片或单页入口交付。

## 2026-10-14 实体课默认制作

先读 [实体课活动制作流程](../docs/classroom-activity-workflow.md)。默认一页完成，每活动最多两页，仅必要时分离任务和资料；不强塞分级框或额外纯标题divider。先验证输入—动作—成果和教师朗读／答案，再提交当周具体内容；已确认视觉和结构不重复询问。完成批准后自主排版与逐页QA，保留真实的人类内容批准及试教边界。
