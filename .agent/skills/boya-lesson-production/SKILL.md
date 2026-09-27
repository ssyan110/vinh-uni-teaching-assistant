---
name: boya-lesson-production
description: Use when producing or reviewing Boya lesson artifacts. Route through the canonical workflow, explicit lesson identity, and focused artifact references.
---

# Boya Lesson Production

This is an artifact-specific procedure skill. It does not own lifecycle semantics, requirements, lesson identity, authority, approval, promotion, release, rollback, or run-packet policy.

## Canonical ownership and precedence

Read these before using any procedure in this skill:

1. `docs/workflow/canonical-workflow-contract.md` — lifecycle, gates, artifact states, identity, protected paths, and fail-closed semantics.
2. `PROJECT_REQUIREMENTS.md` — canonical course and material requirements.
3. `docs/workflow/requirements-registry.md` — additive requirement IDs and verification mapping.
4. `.agent/skills/boya-lesson-production/references/ownership-map.md` — ownership boundary for this skill.
5. The focused reference below for the artifact being produced or reviewed.

The canonical workflow contract takes precedence over this skill. If a procedure here conflicts with the contract, stop and follow the contract; do not silently repair the conflict.

## Explicit identity is mandatory

Every operation must carry an explicit `lesson_key` and, where required by the command or contract, an explicit `offering_id`. Resolve paths through `LessonContext` and the project’s canonical lesson registry. Do not infer a lesson from active L01 configuration, current directories, filenames, or previously generated artifacts.

Historical L01 procedures are compatibility-only. They must remain behind the declared legacy adapter and must not be used for scoped production operations.

## Focused procedure references

Read only the relevant reference, plus the canonical sources above:

- `references/source-and-pbi.md` — source intake, PBI/task spine, content policy, and source/answer rules.
- `references/teacher-guide-and-materials.md` — teacher guide, supporting materials, preparation requirements, draft cleanup, and delivery language.
- `references/pptx-production.md` — selectable slide-authoring paths, student deck rules, page markers, layouts, and PPTX-specific constraints.
- `references/workflow-and-evidence.md` — shared workflow gates, authority/source architecture, evidence expectations, and reporting format.

These references describe artifact procedures only. They do not grant approval or release readiness.

## Required operating sequence

1. Confirm the explicit `lesson_key` and `offering_id` scope.
2. Read the canonical contract and requirements relevant to the operation.
3. Read the focused artifact reference.
4. Inspect source and existing evidence read-only before writing.
5. Record blockers using the project structured blocker contract; do not convert technical readiness into human approval.
6. Produce artifacts only within the scoped derived paths and required gates.
7. Run artifact QA and preserve evidence according to the canonical contract.
8. Stop at human, authority, or release gates unless the required authorization is explicit and independently verifiable.

## Safety boundaries

- Do not modify another lesson’s source, design, QA, authority, approved, or release paths.
- Reject path traversal, symlinks, ambiguous sources, identity mismatch, malformed evidence, and protected-output conflicts.
- Do not execute release, promotion, approval, recovery, cleanup, or migration from this skill.
- Do not treat a plan, inspection result, run packet, technical check, or synthetic test as approval, authority, rehearsal, or release authorization.
- Do not run production builders merely to test a routing decision; use read-only preflight or synthetic fixtures.

## Output discipline

Report the exact scope, command or procedure used, artifact paths touched, blockers, evidence paths, and whether any write occurred. If a required gate is blocked, report the blocker and stop rather than guessing or bypassing it.


## 2026-09-21：仅本届大一第一学期的课程路由

仅当年级=大一、学期=第一学期、日期=2026-09-21至2026-12-27、教材=`boya-elementary-i`同时匹配时，先读[本班课程规划与第四课起PPT制作规则](../../../docs/course-rules/BOYA-LS-E1-Y1S1-2026F/README.md)（`BOYA-LS-E1-Y1S1-2026F`）。按任务结果组织第四课起PPT，教材逐项覆盖；W02安排第4—6课，W12完成首轮覆盖、W13缓冲、W14评量规划。该局部规则取代本班旧课时预算与线性栏目顺序，不扩展到其他年级、学期或未来班级，不改共用offering顶层课表。现有教材与批准不回改；新版逐页内容仍须单独批准。新增双语说明仍待逐页决定，23 pt下限保持。
