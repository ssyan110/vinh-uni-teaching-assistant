# Canonical Workflow Contract

Status: active workflow contract
Version: 2.1.0
Date: 2026-10-15

This file owns the project lifecycle, gate semantics, artifact states, and agent safety rules. It does not own lesson content, PPTX visual rules, audio details, or classroom activity design; those belong to the relevant artifact/domain contract.

## Identity

Every lesson-scoped operation requires:

- `offering_id`
- `textbook_id`
- `lesson_id`
- `lesson_key` in the form `<textbook_id>:<lesson_id>`

Resolve lesson paths from `course/lesson-registry.json` through `scripts/lesson_context.py`. Do not select lesson-specific paths from hardcoded active-lesson fields.

Project audits and tool maintenance declare their actual scope and allowed paths; they do not invent a lesson key. Assessment work uses an explicit exam ID plus its registered offering and lesson-key list. Course planning uses the actual offering/cohort. None of these identities grants lesson approval.

For execution-only records, `agent_loop.py init --scope project|tool|course|assessment --purpose audit --output-dir <project-local-evidence-directory>` is implemented. Its preflight checks the execution boundary only (`production_authorized=false`); task-specific production and approval gates remain separate. See `scripts/agent_loop.py --help` for the local command surface.

## Lifecycle

`inspect → plan → preflight → execute → verify → needs_human → promote → release`

Not every task uses every phase. `promote` and `release` are always separate from technical verification.

### Textbook source-library gate

For textbook-wide or multi-lesson work, complete one source database per textbook and review it before lesson review copies, storyboards, or slides. SQLite is the sole structured master; spreadsheets and lesson copies are generated views. Keep raw sources, page mappings, hashes, provenance, unresolved findings, and review states traceable; distinguish database review from scoped lesson-content approval and technical checks from human listening or classroom playback. Follow `docs/workflow/boya-textbook-source-database.md` for extraction, schema coverage, audio checks, and review steps.

## Artifact states

Lifecycle: `source`, `design_draft`, `technical_verified`, `human_review`, `approved`, `released`, `archived`.

Verification: `not_run`, `blocked`, `technical_pass`, `human_pass`, `complete`.

Technical verification never implies human approval. A changed artifact invalidates its approval and release evidence.

## Run packet

Every non-trivial task uses `.agent/runs/<run-id>/` and records:

- identity and artifact
- purpose and gate stage
- input sources
- allowed output root
- success criteria
- retry limit
- blockers and next action
- evidence paths and SHA-256 values

Run state is execution evidence only. It is never lesson authority.

## Output safety

- Drafts write only to the declared lesson `10-design` or run-scoped staging root. Native OpenSlide also requires a narrowly scoped live-authoring destination: the configured workspace’s `slides/<artifact-id>/` and its assets. Declare and validate that absolute destination before writing; follow `docs/open-slide-workspace.md` and its workspace instructions. This is the live editable source, not an HTML preview or an approval/release destination. A workspace outside the authorized project root requires existing explicit authorization; configuration alone does not grant it.
- No generator writes to `20-approved/`, `30-qa/`, `40-release/`, or archive paths.
- Archive and legacy/share folders are evidence only, never active production inputs.
- Promotion requires an explicit human confirmation and an atomic, manifest-driven copy.
- Release copies only from `20-approved/`; it does not regenerate materials.

## Gate semantics

- `blocked`: a required technical or policy check failed; preserve the exact blocker.
- `needs_human`: deterministic checks passed but human review, playback, rehearsal, or approval is required.
- `complete`: all declared criteria passed, evidence is recorded, and no human gate remains open.

Never alter source, approval, authority, or release status to make a run pass.

## Command surface: implemented versus target

Implemented public CLI: `scripts/lessonctl.py` supports only `preflight`, `compile`,
`image-probe`, `build`, and `qa` (verify with `--help`). `build` copies finalized
PPTX into staging; it does not generate a new deck or publish a release.

The following is the migration target, NOT currently executable commands:

```text
context, inspect, plan, preflight, execute, verify, human-gate, promote, release, status
```

Existing `build`/`qa` commands are compatibility adapters. New scripts should call shared modules rather than create a parallel gate model.

A guarded lesson-scoped release writer exists on `vinh-uni-main` as
`scripts/build_release_package.py`; it is absent from this checkout. Inspect it
read-only with `git show vinh-uni-main:scripts/build_release_package.py` when needed.
It is not a locally executable capability. This checkout supports no verified
native formal release writer; report that limitation rather than manually
writing authority or release folders. `lessonctl release` remains a target command.

Intake modes remain distinct: `--source finalized-pptx` is read-only intake of
Adam-confirmed external files (currently scoped to the quasi-intermediate corpus);
`--source repo` checks repository-native source/approval evidence. Neither mode
grants authority, human approval, or release. Preflight readiness is input
availability/policy readiness, not package, visual, playback, or rehearsal QA.

Migration status: explicit lesson context is being adopted incrementally. Legacy
active-context config fields must remain until every dependent consumer migrates;
the identity rule above is the target and is not yet enforced by every script.

## Task routing

Load only:

1. this contract
2. the task router in `.codex/steering/agent-routing.md`
3. one domain/artifact skill
4. the lesson source or artifact manifest needed for the task

PPTX rules are not required for workflow, source-inventory, audio, classroom-tool, or requirements tasks.

## Human approval record

A valid approval identifies the exact `lesson_key`, artifact path, artifact hash, approver, timestamp, gate name, and evidence path. Approval is invalid if the file changes afterward.

### Content approval before production (Adam, 2026-09-19)

For all new lesson images, visual prototypes, classroom OpenSlide decks, classroom HTML and PPTX (including drafts), stop
before production until Adam explicitly approves the lesson's concrete content.
"Start/continue the workflow", structure approval, exercise-title formatting and
online/face boundary confirmation authorize preparation, not content approval.
The later-lesson draft exception relaxes teacher-guide completion only; it never
waives this prerequisite. Source inspection and review-copy drafting remain allowed.

New work stores a separate decision under each lesson's `10-design/approvals/`. The JSON has `status: approved`, `gate: artifact-content`, `lesson_key`, `offering_id`, `artifact_scope` (`online` or `classroom`), `artifact_id`, `class_scope`, named `approved_by` and timezone-aware `approved_at`. `source_path`, `review_path` and `source_check_path` identify the actual source or lesson-local source snapshot, the concrete reviewed copy and a nonempty source-check report. All three must appear with their SHA-256 in `artifacts`; include other inputs relied on by the version. `evidence` and `evidence_sha256` point to the actual explicit user decision. One real decision can cover multiple specified artifacts, but create a separate scoped record for each lesson and version; do not invent a decision.

Before producing images, prototypes or a deck, run `production_gate.py --purpose content-approval --lesson-key KEY --offering-id OFFERING --approval-record PATH --artifact-scope online|classroom --artifact-id ID --class-scope CLASS`. Pass the same scope to the corresponding draft gate; online output is `10-design/pptx-draft/online/<offering>/<artifact-id>/`, classroom output is `10-design/open-slide-draft/<offering>/<artifact-id>/`. Source or copy changes invalidate only the records bound to changed files. Missing, unsafe, cross-scope or changed inputs fail closed. A hash verifies bytes, not the authenticity or pedagogical correctness of the decision: inspect the actual user message and source.

The earlier `10-design/storyboard/<lesson_id>-content-approval.json` with `gate: lesson-content` is retained for existing artifacts and legacy compatibility; it cannot authorize new registered classroom decks or new scoped versions. Finalized-PPTX read-only intake remains unchanged. No gate creates human approval.

Online PPTX versioned generation, QA, formal approval and immutable release follow `docs/workflow/online-pptx-lifecycle.md`. Each is independent of classroom production; source and actual audio playback requirements still apply to online content.

Every new or revised Vinh in-person deck, across grades and courses, uses native React pages in the configured shared OpenSlide workspace. The `classroom-native` draft gate requires scoped content approval and a lesson-local output path; its post-authoring verifier checks the registered live React source, rejects HTML/iframe wrappers and requires stable page IDs. Then verify text editing, pointer dragging and save/reopen persistence for every page in OpenSlide and record the evidence. The `classroom-html` draft gate is disabled; its existing sync/release machinery remains for historical registered HTML only. The native format still has no verified equivalent of the formal approval/promotion/release pipeline; report that gap and retain those gates. See `docs/open-slide-workspace.md`.

Historical registered classroom HTML follows `docs/workflow/classroom-html-lifecycle.md`. Its draft gate is disabled; existing registered HTML may use only its documented legacy sync/release operations. New or revised in-person decks must use `classroom-native`. The HTML `scripts/classroom_release.py` route remains separately authorized and does not apply to native React decks. Homepage sync and the legacy PPTX release writer do not approve or publish an HTML deck. Draft completion and formal release remain distinct outcomes.

The earlier `future-semester-workflow-audit-2026-10-27.md` is a preserved point-in-time audit; the implementation and verification follow-up is `future-semester-workflow-implementation-2026-10-27.md`.

## Semester schedule consistency

The local material-progress dashboard is the current editable weekly schedule for each recorded term, grade and textbook. In the dashboard, lesson-week displays derive from the associated weekly plan; backup includes the plans. Schedule plans and actual classroom completion remain separate. A dashboard save does not edit independent teacher manuals, lesson materials, assessments, or historical records. When a schedule change is used for teaching or publication, identify affected active course documents, teacher materials and schedules, update and verify those within the authorized scope, and explicitly report any unresolved mismatch; preserve dated historical sources. Do not claim all files are synchronized solely because the dashboard was saved.

## Rule maintenance

When a current user decision changes a rule, update its owning text and remove or
scope the superseded active clause. Inspect references, registries, templates,
generators, checkers and tests in the affected route; appending a newer exception
alone is not closure. Keep a dated disposition record listing old rule, current
scope, owner, affected consumers and verification. Preserve historical evidence
and approved artifacts. Global memory changes require explicit user authorization
and the host's designated update mechanism; project cleanup does not authorize
editing global memory or third-party managed skills.

## Verification baseline

Before completion, run the smallest complete checks for the artifact type plus:

- lesson identity isolation
- protected-output rejection
- manifest/hash integrity
- no archive/legacy input routing
- truthful blocked-result behavior

The full optimization roadmap is in `docs/workflow/WORKFLOW_V2_OPTIMIZATION_SPEC.md`.


### 实体课活动研究前置条件（2026-11-04）

每次新设计或实质重设计实体课活动，先完成实际ChatGPT研究与记录，再编写方案。审阅前用 `production_gate.py --purpose classroom-research` 验证研究证据；classroom内容核准门禁与原生制作门禁均要求 `--research-record`。证据格式与边界见 [classroom-chatgpt-research-gate.md](classroom-chatgpt-research-gate.md)。已有完成记录保持历史状态；不得补造、倒填研究。

<!-- project-rule-repairs-20261105 -->
Research scope clarification: unchanged pre-2026-11-04 scoped content approvals retain their historical status only after all bound source/review/check/decision hashes pass. New or changed activity content requires the current research gate. Shared combined-lesson packets and independent lesson approval bindings follow `docs/workflow/classroom-chatgpt-research-gate.md`. Run `python3 scripts/check_governance.py` after changes to routing or workflow owners.
