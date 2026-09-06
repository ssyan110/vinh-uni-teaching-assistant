# Canonical Workflow Contract

Status: active workflow contract
Version: 2.0.0
Date: 2026-09-05

This file owns the project lifecycle, gate semantics, artifact states, and agent safety rules. It does not own lesson content, PPTX visual rules, audio details, or classroom activity design; those belong to the relevant artifact/domain contract.

## Identity

Every lesson-scoped operation requires:

- `offering_id`
- `textbook_id`
- `lesson_id`
- `lesson_key` in the form `<textbook_id>:<lesson_id>`

Resolve lesson paths from `course/lesson-registry.json` through `scripts/lesson_context.py`. Do not select lesson-specific paths from hardcoded active-lesson fields.

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

## Verification baseline

Before completion, run the smallest complete checks for the artifact type plus:

- lesson identity isolation
- protected-output rejection
- manifest/hash integrity
- no archive/legacy input routing
- truthful blocked-result behavior

The full optimization roadmap is in `docs/workflow/WORKFLOW_V2_OPTIMIZATION_SPEC.md`.
