# Agent Operating Contract

Canonical workflow contract: `docs/workflow/canonical-workflow-contract.md`
Optimization roadmap: `docs/workflow/WORKFLOW_V2_OPTIMIZATION_SPEC.md`

This contract controls how an agent executes multi-step work in this repository. Lifecycle, gate semantics, artifact states, lesson identity and safety are defined once in the canonical workflow contract.
It does not redefine lesson approval, teaching content, QA or release authority.

## Control loop

`define → preflight → bounded attempt → verify → record evidence → continue or stop`

Before changing an artifact, the agent must identify:

1. The exact `offering_id`, `textbook_id`, `lesson_id` and `lesson_key`.
2. The source-of-truth files and protected authority paths.
3. The intended artifact, allowed output root and observable success criteria.
4. The deterministic checks, artifact-level checks and human gates required.
5. The maximum repair attempts and the stop condition.

For a course-routing decision, the declared artifact is the lesson-scoped
boundary record. It must state the online scope, face-to-face scope, time policy,
`lesson_key`, confirmation date and independent gates that remain open. A
boundary record never promotes a lesson artifact and never permits a generator
to bypass source, teacher-guide, PPTX, playback, rehearsal or release checks.

## Run state boundary

`scripts/agent_loop.py` writes local packets under `.agent/runs/<run-id>/`.
Each packet contains `state.json`, `plan.md`, `decision-log.md`, `trace.jsonl`
and `final-report.md`.

Run phases are limited to:

- `defined`: context and success criteria are recorded.
- `ready`: the existing production gate passed for the configured scope.
- `verifying`: one bounded attempt was made and now needs evidence.
- `needs_human`: a real teacher or Adam decision is required.
- `blocked`: the gate failed or the retry budget was exhausted.
- `complete`: success criteria were verified and evidence hashes were recorded.

Run state is never lesson authority. It must not promote a draft, approve a
teacher guide, pass audio playback, pass rehearsal or create a release. Those
transitions remain controlled by the existing lesson manifests, explicit human
evidence, `production_gate.py`, `record_lesson_gate.py` and the release builder.

## Failure handling

- Do not edit a gate status to make a run pass.
- Keep failed output in its scoped draft or temporary root for diagnosis.
- After a failed verification, repair only within the declared output scope.
- Stop when the retry budget is exhausted or a human gate is reached.
- Parallel workers use separate draft roots or independent artifacts; only the
  main run reconciles results, and no worker writes to `20-approved/`, `30-qa/`
  or `40-release/`.

## Completion rule

A run may be marked `complete` only when its latest preflight is ready, at least
one bounded attempt was recorded, every declared success criterion was checked,
and one or more project-local evidence files were hashed into the run state.
