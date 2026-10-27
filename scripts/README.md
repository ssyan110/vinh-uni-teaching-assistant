# Project scripts

## Project and tool execution records

For non-lesson work, `agent_loop.py init --scope project|tool|course|assessment --purpose audit --output-dir <project-local-evidence-directory>` creates an execution-only run. Do not pass a lesson/offering key. Course/assessment identities still belong in the task's scope/evidence; this execution record cannot authorize their production.

Example (replace the run ID and criteria for the actual task):

```sh
python3 scripts/agent_loop.py init --run-id project-rules-review --scope project --purpose audit --artifact "Rules review" --output-dir docs/audits --success-criterion "Every finding has evidence and disposition"
python3 scripts/agent_loop.py preflight --run-id project-rules-review
```

Preflight checks the execution boundary only and returns `production_authorized=false`. Record an attempt and hash-pinned evidence with the existing attempt/result commands. Completion describes the declared audit or maintenance work, never content approval. Protected source/authority/QA/release/archive output directories remain rejected.

## Assessment audio review

`production_gate.py --purpose assessment-audio-current --exam-id <registered-exam-id> --output-dir <registered-exam-directory>/audio-review-<run-id>` validates the current registered assessment's content approval hashes, identity, local audio bytes and question mapping. Omitting the exam ID selects `current_review_exam_id`. This is technical review only, not synthesis, publication or human listening acceptance. Changed approved inputs remain blocked until actual review; never rewrite approval hashes to pass.

`--purpose assessment-audio` retains the explicitly historical W04 repair contract. It must not select current W04/W05 work or impose its old counts on them.

## Classroom HTML and legacy PPTX

```sh
python3 scripts/production_gate.py --purpose classroom-html --stage draft --lesson-key boya-elementary-i:lesson-11 --offering-id 2026-fall --output-dir lessons/boya-elementary-i/lesson-11/10-design/open-slide-draft/lesson-11-12
```

This is a read-only approved-input/output-boundary preflight. Follow `docs/workflow/classroom-html-lifecycle.md` for combined lessons, resource packaging, teacher materials, homepage QA and the guarded formal HTML promotion/release process. It does not generate a deck or verify its rendered pages. The shared-homepage synchronizer separately requires each registered HTML deck to have a visual-check profile (unchanged L09–10/L11–12 baselines are SHA-pinned) and blocks preview writes when the profile fails; use `python3 scripts/sync_open_slide_workspace.py --check-only` for a read-only check.

`build_l23_pptx_drafts.js` defaults to online preparation. Its `--mode legacy-face` route and `verify_boya_face_to_face_order.py --mode legacy-face` are explicit maintenance routes for the old quasi-intermediate PPTX order contract, not the default future classroom workflow. Plain `Audio n-n` labels replace embedded audio; package verification rejects audio media/relationships/actions. Never run a builder simply to test routing.


Canonical workflow contract: `docs/workflow/canonical-workflow-contract.md`
Optimization roadmap: `docs/workflow/WORKFLOW_V2_OPTIMIZATION_SPEC.md`

Use explicit task scope and the canonical contract for all new work. Lesson operations require `lesson_key`; project/tool maintenance does not invent one. This README documents command compatibility and implementation details; it does not redefine lifecycle or gate semantics.

`lessonctl.py` is a compatibility coordinator for the currently implemented
preflight, compile, image-probe, build staging, and QA adapters. Its default finalized-PPTX route is for existing quasi-intermediate finalized files and requires both historical PPTX inputs; it is not the new-course OpenSlide workflow. Use the classroom HTML preflight and lifecycle above for new physical lessons. Its JSON results
preserve legacy `blockers` strings and also expose shared `blocker_records` with
stable `code`, `message`, and `scope`; this is diagnostic output, not an approval
or release authorization.

`run_lesson_production.py` is retired compatibility evidence and must not be used.
It is intentionally disabled because it predates the canonical context/gate/run-packet flow.

## Active context and authority paths

Migration is incremental: legacy generic scripts still read active-context fields from `project.config.json`; new lesson-scoped code resolves an explicit key through `lesson_context.py`. Do not remove legacy config keys until their consumers have migrated. The stable cross-textbook identity is `lesson_key` in `course/lesson-registry.json`, formatted as `<textbook_id>:<lesson_id>`; a bare `lesson-01` is never enough to select a source or output directory. Status is read from the selected key's manifests rather than from this README.

《中级冲刺篇 I》第一课的既有 authority 是：

`lessons/boya-intermediate-i/lesson-01/20-approved/lesson-manifest.json`

The original director-review input snapshot is preserved read-only at:

`archive/legacy-materials-2026-08-27/boya-intermediate/lesson-01/share/第一课-教学资料`

The archived director-review snapshot is evidence only. Book-specific legacy generators may reference `lessons/boya-intermediate-i/lesson-01/10-design/`, but they are blocked while that lesson is not the active context and must never read from `archive/` or overwrite `20-approved/`.

## Submission filenames

New teacher-facing lesson files use `lesson-<nn>-<用途>.<extension>` with a two-digit lesson number, hyphens, and a lowercase extension. When the requested artifact is PPTX, the mode names are:

- `lesson-01-在线预习.pptx`

Across future semesters, Year 1 and Year 2 physical classes use OpenSlide and the shared homepage; do not produce a classroom PPTX backup. `lesson-01-实体课.pptx` refers only to an existing historical file.

Teacher guides, prep cards, activity materials, previews, audio, CSV exports, and ZIP packages use the same `lesson-01-<用途>` prefix. Existing approved or archived files keep their original names because their paths and hashes are part of the recorded evidence; new releases must use the canonical names.

Build the dashboard cache with:

```bash
python3 scripts/build_dashboard.py
```

This command writes only `dashboard/manifest.js`; it does not write lesson
materials, authority, QA, or release paths.

The generated `dashboard/manifest.js` aggregates the active textbook's lesson summaries from its source inventory and any available `lessons/<textbook_id>/lesson-XX/20-approved/lesson-manifest.json` files. Each summary is keyed by `lesson_key`; the dashboard only expands the selected lesson and does not copy every lesson's evidence into the course overview.

The audit is read-only and inventories remaining consumers as `migration-required`, `historical-legacy`, or `identity-compatibility`:

```bash
python3 scripts/audit_active_context_consumers.py
```

The audit does not execute builders or remove legacy config fields.

Validate that direct legacy active-config fallbacks remain confined to the explicit
historical allowlist:

```bash
python3 scripts/audit_legacy_usage.py
```

The audit is read-only. It allowlists `scripts/legacy/` and the `build_lesson_01_*`
historical builder family; any direct legacy config fallback outside those scopes
is a blocker.

The audit is read-only and fails closed when a top-level requirements section has no registry mapping.

```bash
python3 scripts/audit_requirements_coverage.py
```

Audit lifecycle wording so technical verification, human approval, authority, and
release are not conflated:

```bash
python3 scripts/audit_lifecycle_wording.py
```

Validate the identity boundary before rebuilding the dashboard:

```bash
python3 scripts/validate_lesson_identity.py
```

Plan a lesson-scoped release without writing anything:

```bash
python3 scripts/build_release_package.py --plan \
  --lesson-key boya-quasi-intermediate-i:lesson-10 \
  --offering-id 2026-fall \
  --release-id YYYY-MM-DD-description
```

A read-only transaction/recovery inspection is available for crash or partial
state. It requires an explicit lesson key and never cleans or repairs anything:

```bash
python3 scripts/build_release_package.py --inspect \
  --lesson-key boya-quasi-intermediate-i:lesson-10 \
  --offering-id 2026-fall \
  --release-id YYYY-MM-DD-description
```

`status=clear` means no matching transaction/recovery artifacts were found.
`status=review` means artifacts exist and require human inspection; `blocked`
means the inspector found an unsafe or malformed state. All statuses return
`write_performed=false`. Do not interpret `review` as authorization to delete,
recover, or publish.

After reviewing a `ready` plan and receiving explicit release authorization, the
scoped writer requires the exact release id twice:

```bash
python3 scripts/build_release_package.py --execute \
  --lesson-key boya-quasi-intermediate-i:lesson-10 \
  --offering-id 2026-fall \
  --release-id YYYY-MM-DD-description \
  --confirm-release-id YYYY-MM-DD-description
```

It acquires an exclusive release-id transaction reservation, stages the package,
ZIP, and metadata beneath the selected lesson's release root, and verifies hashes,
byte counts, portable/collision-safe paths, CRC, mappings, and JSON. Authority
sources and the authority-manifest hash are rechecked immediately before publish.
The final package and ZIP are read back before metadata pointers move; afterward,
the scoped authority verifier must pass before success is reported. A competing
invocation that does not own the reservation cannot modify or clean it. A failed
commit rolls back files created by that transaction. If rollback is incomplete,
the transaction marker remains and all later plans for that release id are blocked
pending human review. Parent-directory `fsync` is attempted where supported.
Process or machine crashes cannot be made fully atomic across directory, ZIP, and
two metadata files; a remaining transaction marker, pending metadata artifact, or
partial target must never be auto-deleted.

The legacy active-context writer is separately gated and requires both an
explicit legacy flag and the repeated release id:

```bash
python3 scripts/build_release_package.py --legacy-active-build \
  --release-id YYYY-MM-DD-description \
  --confirm-release-id YYYY-MM-DD-description
```

The legacy builder writes the active context's configured `40-release/`; the
scoped writer resolves the selected lesson instead. Neither regenerates teaching
materials. The release id is required, path-safe, and must
not already exist. Optional authority `release_materials` entries are copied
to their declared release paths (for example, an approved worksheet, video, or
Blooket import); the builder still refuses to publish until audio playback and
the lesson's approved contact-hour rehearsal are recorded. No generic
300-minute assumption is permitted.

Before dispatching image workers or promoting their assets, check explicit
approval of the current lesson content (read-only; does not grant approval):

```bash
python3 scripts/production_gate.py --purpose content-approval --lesson-key boya-elementary-i:lesson-04 --offering-id 2026-fall
```

The canonical workflow contract defines the content-approval record and required
hash-bound source, slide-copy review and independent human evidence. Pending,
missing or changed content blocks production. Structure/boundary approval and
"start/continue" are not content approval. Existing finalized read-only intake
does not regenerate a lesson and is unchanged.

For new versions, use `build_scoped_online_pptx.py` and the complete [online PPTX lifecycle](../docs/workflow/online-pptx-lifecycle.md); its version-specific gate binds the actual approved slide JSON and source snapshot, not the historical singleton. Historical `build_l23_pptx_drafts.js` accepts quasi-intermediate L02–L12 only, uses legacy shared inputs and requires explicit `--lesson-key`; it rejects new scoped approval and is not the new-semester generator. Historic boundary records remain evidence, but the standing online/classroom division does not require a new confirmation for each version.

The scoped builder also requires `layout_reference`, `reference_slide` and native `reference_shape_id` bindings. It copies the actual approved native layout with `render_reference_online_pptx.py` (Python with the existing `python-pptx` and Pillow dependencies); `render_scoped_online_pptx.js` is a historical free-coordinate renderer, not the new production path. Use the applicable reference in `course/ppt-style-registry.json`, inspect scene images and every rendered page, and compare rendered text coverage rather than relying only on slide XML or hashes.
New or revised online PPTX student content defaults to a hard minimum of 25 pt. Only page headers, slide numbers, textbook markers and plain Audio labels may declare `text_role: chrome` and use the applicable 20/23 pt auxiliary minimum; the builder rejects other uses of that role. Historical PPTX files remain read-only references.

The textbook-page marker tools require a slide-level storyboard. A candidate-page
inventory such as `lesson-02-source-refs.csv` records source blocks rather than
slide numbers and must not be passed as `--storyboard` until a current
slide-to-source mapping has been created.

Record a real approval only after the relevant human review, with an existing
evidence file from the same lesson tree, an explicit `lesson_key`, and a
confirmation flag. The recorder resolves the lesson through the registry,
stores the evidence SHA-256 and refuses cross-lesson evidence:

```bash
python3 scripts/record_lesson_gate.py --lesson-key boya-intermediate-i:lesson-01 --gate storyboard --approved-by Adam --approved-at YYYY-MM-DD --evidence lessons/boya-intermediate-i/lesson-01/10-design/storyboard/lesson-01-ppt-outline-v5.md --confirm
python3 scripts/record_lesson_gate.py --lesson-key boya-intermediate-i:lesson-01 --gate visual-alignment --approved-by Adam --approved-at YYYY-MM-DD --evidence lessons/boya-intermediate-i/lesson-01/20-approved/pptx/第一课-中国人的姓名.pptx --confirm
python3 scripts/record_lesson_gate.py --lesson-key boya-intermediate-i:lesson-01 --gate audio-playback --approved-by Adam --approved-at YYYY-MM-DD --evidence lessons/boya-intermediate-i/lesson-01/30-qa/current/pptx-v15/qa-report.md --confirm
python3 scripts/record_lesson_gate.py --lesson-key boya-intermediate-i:lesson-01 --gate rehearsal --approved-by Adam --approved-at YYYY-MM-DD --evidence lessons/boya-intermediate-i/lesson-01/30-qa/current/rehearsal-v1/rehearsal-notes.md --confirm
```

## Read-only authority verification (scoped)

```bash
python3 scripts/verify_lesson_authority.py --lesson-key boya-quasi-intermediate-i:lesson-10 --offering-id 2026-fall
```

This audits the selected lesson's authority and existing release without writing
materials. Omit `--lesson-key` only for legacy active-context compatibility.
`status=passed` and exit 0 mean integrity checks passed; inspect `delivery_status`
and `delivery_blockers` separately. Pending manual acceptance, playback or rehearsal
never becomes permission to deliver. Failed repository checks do not prevent the
separate read-only finalized-PPTX intake workflow.

## Agent control loop

For a non-trivial, multi-step task, create a local run packet before execution:

```bash
python3 scripts/agent_loop.py init \
  --run-id lesson-02-online-draft \
  --lesson-key boya-quasi-intermediate-i:lesson-02 \
  --offering-id 2026-fall \
  --artifact "lesson-02 online PPTX draft" \
  --purpose pptx \
  --gate-stage draft \
  --output-dir lessons/boya-quasi-intermediate-i/lesson-02/10-design/pptx-draft/online \
  --success-criterion "PPTX opens and is ZIP-valid" \
  --success-criterion "current storyboard source mapping passes"
python3 scripts/agent_loop.py preflight --run-id lesson-02-online-draft
```

Attach a read-only plan/inspect result to the run packet without changing its
phase or granting authority:

```bash
python3 scripts/agent_loop.py check \
  --run-id lesson-02-release-review \
  --result-file .agent/checks/lesson-02-plan.json
```

The command also verifies that the returned `lesson_key`, `offering_id`,
`release_id`, and command mode exactly match the requested arguments before any
result artifact is written. Cross-lesson or cross-offering results are rejected.

The result file is kept as a hash-pinned `latest_external_check` record with
`blocker_records`. It must be inside the project, and tampering invalidates run
state. This records evidence only; it does not approve, promote, recover, or
publish anything.

For the scoped release utility, `release-check` runs only the read-only modes and
attaches the result automatically. `--mode execute` is not accepted:

```bash
python3 scripts/agent_loop.py release-check \
  --run-id lesson-02-release-review \
  --mode plan \
  --lesson-key boya-quasi-intermediate-i:lesson-02 \
  --offering-id 2026-fall \
  --release-id review-2026-09-05
```

After one bounded execution, record the attempt and its verified result:

```bash
python3 scripts/agent_loop.py attempt \
  --run-id lesson-02-online-draft \
  --summary "generated one online draft inside the declared output root"
python3 scripts/agent_loop.py result \
  --run-id lesson-02-online-draft \
  --result passed \
  --summary "all declared criteria passed" \
  --evidence lessons/boya-quasi-intermediate-i/lesson-02/10-design/pptx-draft/online/qa-report.json \
  --all-criteria-passed
python3 scripts/validate_workflow_state.py --run-id lesson-02-online-draft
```

Run packets stay under ignored `.agent/runs/<run-id>/`. They track agent
execution, evidence hashes, retry budget and stop reasons only. Preflight now also
stores backward-compatible `blocker_records` with stable `code`, `message`, and
`scope` fields; legacy `blockers` strings remain for compatibility. These records
classify gate and result blockers, but do not approve lesson content, promote a
draft, pass manual playback or rehearsal, or replace any lesson manifest.

## 《中级冲刺篇 I》现有生成器状态

以下脚本是《中级冲刺篇 I》第一课的书本专属工具。该教材保留给三年级使用，但这些脚本不是当前《准中级加速篇 I》的生成入口：

本节列出的 `build_lesson_01_*` 中凡是引用〈中国人的姓名〉、E01 或
`boya-intermediate-i` 来源的脚本，均是历史工具；它们会检查 active
`lesson_key` 与 `lesson_root`，在当前准中级上下文中直接停止，避免把中级第一课
内容写入准中级课次。

The preserved authority is the Adam-approved v11-final package. Its static QA is
recorded, but classroom delivery remains pending manual PowerPoint playback,
projection review, and teacher rehearsal. The previous immutable release is
retained as historical evidence and is not the current v11 delivery.

- `build_lesson_01_teacher_guide.js` — historical `boya-intermediate-i:lesson-01` builder only; its 50-minute storyboard schedule and exercise counts are not a template for the current quasi-intermediate offering.
- `build_lesson_01_pptx.js` — historical entry point for `boya-intermediate-i:lesson-01`; it refuses to run when the active context is the current quasi-intermediate offering.
- `build_lesson_01_pptx_native.js` — historical native PPTX implementation for that same lesson; it is not a current-offering generator and cannot be used without the matching `lesson_key` context.
- `build_lesson_01_prototype.js` — canonical entry point for the approved six-slide educational textbook-style prototype.
- `legacy/build_lesson_01_source_review.js`
- `legacy/build_lesson_01_teaching_design.js`

Do not use them as the future classroom deck pipeline. The `scripts/legacy/` directory is read-only historical evidence; any fixed lesson counts, fixed hours, or HTML output there do not apply to current lesson requirements and must not be used as generator inputs or release criteria. For new decks, use the selected `native-pptx` or `open-slide` path documented in `AGENTS.md`; Registered OpenSlide HTML decks follow the guarded approval and release path in `docs/workflow/classroom-html-lifecycle.md`.

## Future production rule

Online preparation and classroom sessions are independently scoped and produced. Use `docs/workflow/online-pptx-lifecycle.md` for a new online version and `docs/workflow/classroom-html-lifecycle.md` for OpenSlide. Exact content approval precedes visual production; each format has its own QA and formal authorization. Existing teacher-guide and historical PPTX builders are legacy-specific and do not impose a pre-class design or rehearsal gate on a new online PPT.

Only when `boya-intermediate-i:lesson-01` is the active context may the preserved
`build_lesson_01_pptx.js` entry run, and only after its teacher guide, support
materials, storyboard, visual storyboard and prototype are approved. It never
overwrites the approved PowerPoint. Current `boya-quasi-intermediate-i` lessons
must use a lesson-key-scoped generator and output only to their own draft root.

Activity cards are currently delivered as editable DOCX files only. Internal
`10-design` preview PDFs may be rendered for QA, but are not release materials. The former
`legacy/render_lesson_01_activity_pdfs.py` renderer is retained for historical
reference and is not part of the current production workflow; do not run it for
current lesson materials.

All text-bearing output, including drafts, previews, QA artifacts, legacy
mirrors, authority files, and releases, uses the cross-device font policy in
`project.config.json`: Chinese `KaiTi`; Vietnamese and other Latin-script text
use `Times New Roman`. Do not add a font file or require a local installation.
When an already-approved Office file needs a font-only normalization, use
`normalize_boya_fonts.py` to write a temporary copy, verify it, then explicitly
replace the approved authority and rebuild the immutable release. The
normalizer changes Office font declarations only.

For Vinh University, all student-facing PPTX, prep cards, activity cards, assessment cards, teacher guides, and teacher review documents use Simplified Chinese. Vietnamese is allowed only when a necessary explanation cannot be made clear in Simplified Chinese.

All human-facing outputs must read as finished professional teaching materials. Do not add AI self-descriptions, workflow explanations, tool references, or template openings such as “這不是……”. Keep source, QA, debug, and production notes in separate internal records.

Read the repository root `AGENTS.md`, `PROJECT_REQUIREMENTS.md` and `.agent/skills/boya-lesson-production/SKILL.md` before adding or changing a production script.

## Optimization closure boundaries

Dashboard selection is centralized in `dashboard_context.py`, not removed. Its output root is restricted to `dashboard/`; no material paths are permitted.
The active-context audit is a lexical inventory of Python/JavaScript files, not a complete data-flow or historical-builder safety proof. Unknown matches are blocked (exit 1); known compatibility matches remain review (exit 0).
Requirements coverage checks top-level chapter mappings only. Empty input is blocked; this is not per-requirement acceptance or human approval. Remaining CLI consolidation and legacy removal are optional roadmap work, not automatic next tasks.


## Current classroom HTML verification

Run `python3 scripts/verify_classroom_slides.py --deck-id <registered-id> --sync --build` after editing the registered source. It orchestrates existing content-approval preflights, reviewed page-contract validation, schema-v2 browser measurements/screenshots, guarded sync and the existing workspace build. Without flags it refreshes draft-local QA and performs read-only sync validation. `sync_open_slide_workspace.py --check-only` remains read-only and rerenders to verify current evidence. The page contract is a technical mapping of reviewed inputs, never a new approval record. Generic constraints live outside W06-specific data; the historical W06 tests do not define another lesson's content. Use the classroom standard as the single visual QA checklist.


### Future-semester artifact scope

New online and classroom production uses the scoped `artifact-content` record described in `docs/workflow/canonical-workflow-contract.md`. Pass all of `--offering-id`, `--approval-record`, `--artifact-scope`, `--artifact-id`, and `--class-scope` to `production_gate.py`; partial scope fails closed. `agent_loop.py init` accepts `--approval-record`, `--artifact-id`, and `--class-scope` with an explicit lesson and offering. Registered multi-lesson OpenSlide decks declare an `approval_records` map for all lesson keys.

The legacy `build_l23_pptx_drafts.js` uses historical inputs and rejects scoped approvals and existing output paths. For future versions use `build_scoped_online_pptx.py` and `online_ppt_release.py`; commands, exact QA and evidence schema are in `docs/workflow/online-pptx-lifecycle.md`. The older PPTX authority/release tools retain their historical gates and do not govern this separately scoped online flow. Do not reuse a historical approval.
