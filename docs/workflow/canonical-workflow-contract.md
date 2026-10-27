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

For execution-only records, `agent_loop.py init --scope project|tool|course|assessment --purpose audit --output-dir <project-local-evidence-directory>` is implemented. Its preflight checks the execution boundary only (`production_authorized=false`); task-specific production and approval gates remain separate. See `scripts/README.md` for the command example.

## Lifecycle

`inspect → plan → preflight → execute → verify → needs_human → promote → release`

Not every task uses every phase. `promote` and `release` are always separate from technical verification.

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

- Drafts write only to the declared lesson `10-design` or run-scoped staging root.
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

A guarded lesson-scoped release writer is implemented in
`scripts/build_release_package.py` behind `--execute`, an exact repeated release
ID, a fresh ready plan, transaction staging, rollback, and read-back. It is not
yet exposed as `lessonctl release`, so `release` remains a target command in the
public command surface. Default or plan-only invocations cannot publish.

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
2. the task router in `.agent/skills/README.md`
3. one domain/artifact skill
4. the lesson source or artifact manifest needed for the task

PPTX rules are not required for workflow, source-inventory, audio, classroom-tool, or requirements tasks.

## Human approval record

A valid approval identifies the exact `lesson_key`, artifact path, artifact hash, approver, timestamp, gate name, and evidence path. Approval is invalid if the file changes afterward.

### Content approval before production (Adam, 2026-09-19)

For all new lesson images, visual prototypes, classroom HTML and PPTX (including drafts), stop
before production until Adam explicitly approves the lesson's concrete content.
"Start/continue the workflow", structure approval, exercise-title formatting and
online/face boundary confirmation authorize preparation, not content approval.
The later-lesson draft exception relaxes teacher-guide completion only; it never
waives this prerequisite. Source inspection and review-copy drafting remain allowed.

New work stores a separate decision under each lesson's `10-design/approvals/`. The JSON has `status: approved`, `gate: artifact-content`, `lesson_key`, `offering_id`, `artifact_scope` (`online` or `classroom`), `artifact_id`, `class_scope`, named `approved_by` and timezone-aware `approved_at`. `source_path`, `review_path` and `source_check_path` identify the actual source or lesson-local source snapshot, the concrete reviewed copy and a nonempty source-check report. All three must appear with their SHA-256 in `artifacts`; include other inputs relied on by the version. `evidence` and `evidence_sha256` point to the actual explicit user decision. One real decision can cover multiple specified artifacts, but create a separate scoped record for each lesson and version; do not invent a decision.

Before producing images, prototypes or a deck, run `production_gate.py --purpose content-approval --lesson-key KEY --offering-id OFFERING --approval-record PATH --artifact-scope online|classroom --artifact-id ID --class-scope CLASS`. Pass the same scope to the corresponding draft gate; online output is `10-design/pptx-draft/online/<offering>/<artifact-id>/`, classroom output is `10-design/open-slide-draft/<offering>/<artifact-id>/`. Source or copy changes invalidate only the records bound to changed files. Missing, unsafe, cross-scope or changed inputs fail closed. A hash verifies bytes, not the authenticity or pedagogical correctness of the decision: inspect the actual user message and source.

The earlier `10-design/storyboard/<lesson_id>-content-approval.json` with `gate: lesson-content` is retained for existing artifacts and legacy compatibility; it cannot authorize new registered classroom decks or new scoped versions. Finalized-PPTX read-only intake remains unchanged. No gate creates human approval.

Online PPTX versioned generation, QA, formal approval and immutable release follow `docs/workflow/online-pptx-lifecycle.md`. Each is independent of classroom production; source and actual audio playback requirements still apply to online content.

Classroom HTML follows `docs/workflow/classroom-html-lifecycle.md`. Its implemented
`production_gate.py --purpose classroom-html --stage draft` route validates
approved inputs and the declared draft output only. Registered HTML decks use
`scripts/classroom_release.py` for separately authorized promotion, release and
verification, as documented in the classroom HTML lifecycle. Homepage sync and
the legacy PPTX release writer do not approve or publish an HTML deck. Requested
draft completion and formal release remain distinct outcomes.

The earlier `future-semester-workflow-audit-2026-10-27.md` is a preserved point-in-time audit; the implementation and verification follow-up is `future-semester-workflow-implementation-2026-10-27.md`.

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
