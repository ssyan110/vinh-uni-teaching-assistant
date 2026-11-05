# Agent routing

> 2026-11-04 字号优先级：未来新制 Vinh 实体课原生 OpenSlide 的学生正文按 `docs/classroom-html-standard-2026-10-07.md` 的新课规则执行：1920×1080 画布默认 56 px，最低 54 px，通常 54–60 px；其他画布按比例换算。复用旧参考的布局与层级时，不复用其较小正文字号。现有课件不回改，线上 PPTX 与其他媒介不适用此 px 规则。

## Presentation routes

| Requested artifact | Governing workflow |
|---|---|
| Online pre-study PPT/PPTX | [Online PPTX lifecycle](../../docs/workflow/online-pptx-lifecycle.md), applicable `PROJECT_REQUIREMENTS.md` sections, teaching-material skill below |
| New or revised in-person deck | [Native OpenSlide workspace](../../docs/open-slide-workspace.md), [activity workflow](../../docs/classroom-activity-workflow.md), teaching-material skill below |
| Existing historical HTML | Its specific maintenance authorization and [legacy lifecycle](../../docs/workflow/classroom-html-lifecycle.md); no new HTML draft |

Choose format before a design skill. Huashu and generic HTML-first skills cannot select the output format for either current route. Preserve historical artifacts; do not migrate them merely because these instructions changed.

## Student management system

The active web app is `荣市大学_学生管理系统` in `classroom-tools/student-tracker/`. Adam retired its former name and desktop app; do not restore either. Keep the existing student database and participation counts. Before publishing, verify that the candidate includes the `回答次数` page, uses the existing database, and is the source of future automatic deployments. Never reset, migrate, or overwrite student data merely to restore the app.

Deploy copies under `.agent/deploy-nntq/` and `.agent/runs/20260918-classroom-recovery/` are historical evidence, not current app sources. Do not deploy or copy their branding back into the app.


Read [AGENTS.md](../../AGENTS.md) first. Load only the skill needed for the task.

| Task | Local skill |
|---|---|
| Non-trivial project work | `../skills/harness-engineering/SKILL.md` |
| Teaching-material preparation | `../skills/ai-teaching-material-systems/SKILL.md` |
| Explicitly requested Huashu HTML design | `../skills/huashu-design/SKILL.md` |
| Google Workspace work | `../skills/google-workspace/SKILL.md` |

Select the project teaching skill by its exact local path (declared name `vinh-teaching-materials`); the global `ai-teaching-material-systems` HTML-first skill is not this project’s workflow.

Use the language-specific writing skill required by Adam's instructions. Do not copy project rules into every tool's configuration.


## 实体课 ChatGPT 研究前置门禁（2026-11-04）

所有新设计或实质重设计的实体课活动，必须先实际使用 ChatGPT 研究，再编写活动方案和学生文案；不得以自行构思、旧记忆或旧研究替代本次研究。保存实际提示词、完整回复、会话链接、来源核对及后续改写对照。提交内容审阅前运行 classroom-research 门禁；内容批准与 classroom-native 制作门禁同时要求 --research-record，缺失、空白、范围不符、哈希变化或研究时间晚于改写均阻断。记录和哈希只能证明材料完整性，不能替代真实会话证据；禁止伪造。此要求不追溯改写已完成课件，不增加人工批准阶段。

## Checkout capability preflight

Before online, native classroom, or assessment-audio production, run `python3 scripts/check_project_readiness.py --capability online|native|assessment-audio` with the actual choice. `inputs-and-runtime-present` is availability only; run scoped content/production gates afterward. Missing dependencies remain blocked. Do not switch branches, copy old approvals or replace the requested format to pass. Review `docs/workflow/project-portability.md` before sharing or committing workflow changes.
