# Presentation guidance cleanup — 2026-11-03

Completed documentation cleanup in the current checkout. Inventoried 76 Markdown files across root entry points, `.codex`, `.agents`, `memory`, `docs`, `reference` and the configured OpenSlide workspace adapter. Updated 25 existing documents and added the online workflow below. This report is an audit record, not a new rule owner or approval for lesson production.

## Current routes

| Artifact | Owner and completion requirements |
|---|---|
| Online pre-study | [Online PPTX workflow](online-pptx-lifecycle.md): editable native PPTX, scoped content approval, applicable online typography/content rules, full-page QA and actual application/audio evidence |
| New/revised in-person deck | [Native OpenSlide workspace](../open-slide-workspace.md) and [activity workflow](../classroom-activity-workflow.md): native React source, individually editable/draggable elements, per-page save/reopen verification, shared-homepage and full visual/content QA |
| Historical HTML | [Historical lifecycle](classroom-html-lifecycle.md): existing compatibility only; the new HTML draft gate stays disabled |

The [canonical contract](canonical-workflow-contract.md) owns lifecycle/approval semantics; [PROJECT_REQUIREMENTS.md](../../PROJECT_REQUIREMENTS.md) owns course/material requirements; [the local router](../../.codex/steering/agent-routing.md) selects the relevant procedure. No new style or routine boundary-confirmation gate was introduced.

## Conflicts and disposition

| Finding | Correction and affected documents |
|---|---|
| `CLAUDE.md` mandated HTML, prohibited PPTX, required Kiro and imposed old language/style defaults | Replaced the duplicated rulebook with links to current owners; exact prior text preserved in run evidence |
| README and old requirements-context claimed the classic implementation was current authority | Marked the entire classic workflow as historical; added current route links and removed the obsolete precedence claim |
| Project memory called HTML the primary format and required style choice for every deck | Added current scoped decisions; explicitly retained the former rules as historical context and removed the active format/style mandates |
| Canonical contract routed to absent `.agent/skills/README.md` | Routed to the existing `.codex/steering/agent-routing.md`; added both presentation routes to the router, AGENTS and skills index |
| Teaching skill specified classroom behavior but lacked an explicit online route | Added online PPTX route and the distinction between online typography/content rules and classroom-only limits |
| HTML teaching references could still be read as current online defaults | Scoped five presentation-related teaching references, template guides, the style reference, pinyin database specification and Huashu skill entry to their proper domain/history |
| Image workflow required classic HTML replacement commands for every classroom deck | Scoped those commands to classic HTML; retained provenance and visual checks for PPTX/native assets |
| Requirements demanded renewed online/classroom boundary approval before every storyboard | Reused the standing split; only changes need a specific decision. Exact version content approval before visual production remains mandatory |
| Storyboard minutes applied to online work despite the no-fixed-online-duration rule | Restricted minutes to in-person activities |
| Activity rules forced identical names despite approved phase labels | Kept consistent activity identity/number while allowing listening/checking/reporting phase wording |
| Playback checklist required task-first ordering despite approved data-first pages | Made playback follow the current approved sequence; clarified one cover/route for a combined deck |
| OpenSlide documentation retained narrower reference routing | Pointed route/activity selection to the current elementary L11–12/L13–14 and quasi-intermediate L4–5 mapping |
| Draft-output safety omitted the real OpenSlide save destination | Added a narrowly scoped, validated live-workspace destination without granting access outside authorized roots or approval/release writes |
| Requirements implied a missing HTML checker verified current native output | Scoped it to historical HTML, recorded its absence, and specified native verification evidence |
| Online lifecycle file missing from this checkout | Added a local workflow with current requirements and explicit tooling limitations; consulted `vinh-uni-main` read-only without copying its outdated classroom routing |

## Preserved scope and unresolved consumers

Approved lesson content, generated decks, source databases, approvals, release packages, application code and existing unrelated edits were preserved. The workspace adapter already required native React and needed no change. Vendor runtime/cache files, global skills/memory, other branches/worktrees, dated run records and old lesson artifacts were not rewritten. This is a project-document audit, not a full review of every lesson or third-party skill.

`vinh-uni-main` was inspected read-only. Its `.agent/skills/README.md` and `.agent/skills/boya-lesson-production/SKILL.md` still contain HTML-first classroom routing; its online lifecycle introduction also points classroom work to HTML. Those are stale consumers outside this checkout and must not override the current native route if consulted. They were not changed by switching branches or overwriting this checkout.

The following referenced resources are absent locally: the requirements registry, workflow optimization roadmap, some course-rule files, `scripts/build_scoped_online_pptx.py`, `scripts/online_ppt_release.py`, and `scripts/verify_classroom_slides.py`. Follow the existing `git show vinh-uni-main:<path>` read-only guidance for missing documents. Missing generators/checkers are actual capability gaps; documentation does not install them. A requested production step that depends on them must report that blocker.

Native OpenSlide formal QA/promotion/release automation remains unverified. The verified draft gate and live editing requirements do not establish formal release support. This cleanup does not implement that pipeline or claim that an online/classroom artifact is ready for use.

## Verification and evidence

Twelve focused checks passed: route consistency, existing router/online owner, stated tool availability, removal of repeated boundary/name/order mandates, skill frontmatter, active-entry Markdown link resolution, whitespace checks, and three negative production-gate checks. `classroom-html` remains blocked; `classroom-native` and `pptx` refuse production without required identity/approval. These are documentation and gate checks, not slide rendering or classroom acceptance tests.

Read-back review checked that a future author can select the format, find the governing requirements, identify approval prerequisites, locate the output, perform format-specific QA and distinguish missing tooling from permission. Existing Chinese passages retained their character variant; the classic Vietnamese README body was preserved.

Evidence is under `.agent/runs/slide-guidance-cleanup-20261103/`:

- `inventory.json`: scanned files, hashes and matching routing/format clauses.
- `before/` and `before.json`: exact pre-task copies and hashes, including pre-existing user edits.
- `diffs/` and `changes.json`: task-baseline differences and final hashes, including files untracked by Git.
- `verification.json`: focused check results and boundaries.
- `gate-*.json`: actual negative gate outputs.

No presentation was generated, no release was published, and no human approval was inferred.
