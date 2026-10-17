# Classroom HTML lifecycle

Status: active draft procedure; formal HTML promotion/release remains unsupported.
Owner: canonical-workflow-contract.md. Visual and activity acceptance remain in the classroom standard and activity workflow.

## Prepare and produce

Resolve the explicit offering and lesson keys from the registry. For a combined deck, record every covered lesson key, the owning lesson directory and each source/copy input. A single owner never approves content belonging to another lesson. Reuse actual user approval evidence; do not retrofit synthetic approvals to existing decks.

Before creating new HTML courseware, images or a PPTX backup, obtain approval of the concrete visible copy and necessary teacher materials. Use the existing hash-bound content record for each lesson represented by new content. Run the read-only draft preflight for each lesson; the owning lesson's declared output is the actual deck output. Other lessons' checks do not authorize cross-lesson writes.

```sh
python3 scripts/production_gate.py --purpose classroom-html --stage draft --lesson-key boya-elementary-i:lesson-11 --offering-id 2026-fall --output-dir lessons/boya-elementary-i/lesson-11/10-design/open-slide-draft/lesson-11-12
```

This command checks content approval and a named output directory below the selected lesson's open-slide-draft root. It writes nothing, approves nothing and does not certify visual, pedagogical, audio or release readiness. Source/copy hashes changing invalidates content approval. Legacy approved-copy formats require an explicit evidence-preserving adapter before they can pass; a current preview is not such an adapter.

## Verify and hand off the draft

Keep a lesson-local draft manifest recording lesson keys, entry HTML, all packaged resources and SHA-256 values, approved source/copy references, teacher materials, actual page/activity mapping and QA evidence paths. Resources must be local, self-contained or packaged relative to the entry; no absolute file paths, unshipped files or required network fonts/media. Inspect actual pages and offline behavior, not just the manifest.

Apply classroom-html-standard-2026-10-07.md and classroom-activity-workflow.md: cover, actual activity route, complete executable tasks, private answers, readable typography, full-page rendering, source/copy fidelity, once-on-entry motion, reduced motion, and keyboard/thumbnail navigation. Verify teacher reading files against the approved content. Record technical checks separately from teacher listening, classroom playback, rehearsal and classroom acceptance.

The shared-homepage sync is a narrow preview-output exception: only the registered workspace's generated slide/asset directories may be written. Keep authored source in its owning lesson. Sync never modifies source content, approval records or authority/release. A homepage card or a successful build cannot promote an artifact.

## Formal approval and release boundary

The intended authority layout is the owning lesson's 20-approved/html/ with a manifest covering the entry and every resource; release must copy those exact approved bytes into an immutable 40-release package. Approval must bind the exact deck/resource/teacher-material hashes and independent human evidence; QA must refer to the same hashes. Copy approval, deck approval, teacher playback, rehearsal and release authorization are distinct.

This layout is a defined target, not an implemented writer. The current PPTX-oriented authority/release tools must not be used to bypass HTML packaging or missing evidence. Until a guarded HTML promotion/release adapter implements manifest validation, protected-path checks, atomic copy, rollback and readback with regression tests, return an explicitly labelled design draft and report formal release as unsupported. Do not create authority/release files manually to make a task look complete.

A requested draft handoff can be technically complete while formal release remains out of scope. A requested formal release cannot be reported complete under this limitation. No existing lesson approval, source file or finalized deck is changed by this procedure.
