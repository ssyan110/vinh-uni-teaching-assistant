# Workflow V2 review and bounded M2 implementation

Scope: workflow control code, documentation, and tests only. No teaching production, approval recording, promotion, or release was requested or executed in this slice.

## Audit verdict

The prior baseline was real (32 unit tests passed on independent rerun), but it did not establish completion of M2. Documentation links are not a path-resolution migration. Prior narratives about AGENTS.md conflicted; current file inspection found the retired coordinator still called standard. The coordinator sentence was corrected successfully during this review. A separate attempt to clarify precedence in AGENTS.md was blocked by approval timeout and was not retried.

The checkout already contained many unrelated modified/untracked course, classroom-tool, source, image and PPTX files. They were preserved; no claim is made that the entire dirty tree originated in this workflow task. No commit, reset, cleanup, or publication was performed.

## Corrected findings

- Canonical contract listed future CLI commands as if implemented. It now distinguishes actual preflight/compile/image-probe/build/qa from migration targets.
- Source duplicate detection raised an uncaught exception. Finalized preflight now returns structured blocked output.
- Finalized lookup accepted `.pptx*` and ignored textbook scope. It now requires exact regular `.pptx` files, excludes symlinks/escaping paths, resolves registry identity, and restricts this existing corpus adapter to quasi-intermediate. Supporting another textbook needs an explicit mapping, not same-number filename inference.
- Build run IDs were not validated; compile checked syntax but not symlinks. Shared run-root validation now rejects traversal and symlinks for compile/build/QA staging paths.
- Failed build/image-probe results lost command identity through dictionary merge order. Adapter command names now survive preflight failure.
- AGENTS coordinator wording now accurately states the limited implemented CLI and preserves existing approval/visual QA requirements. The retired coordinator is not replaced by a functioning image-production/promotion pipeline yet.

## M2 implemented in this slice

`LessonContext` exposes safe derived source, canonical source, design, authority, QA and release paths. Derivation rejects symlink aliases.

`production_gate.check` and `assert_ready` accept an explicit lesson key; authority CLI forwards it. Scoped checks use that context for manifests, canonical hashes, design inputs, teacher manual, QA and protected roots, rather than the active L01 paths. Missing scoped evidence does not borrow the configured L01 historical snapshot. Cross-lesson manual and QA paths are rejected. Legacy no-key callers retain their compatibility behavior; global config keys are intentionally not deleted yet.

## Verification

- Independent prior baseline: 32 unit tests passed.
- New tests cover all L02–L12 derived paths, duplicate/wrong-corpus input, staging traversal/symlinks, and explicit authority context isolation.
- Synthetic fixtures are confined to temporary test trees; their approval/hash fields are test data, not real course approvals.
- Live finalized preflight: L02–L12 all ready, with no blockers. This means identity/file selection readiness only, not ZIP/media/visual/playback/human QA.
- Live read-only authority audit: L02 blocked with 9 blockers; L10 blocked with 6; L12 blocked with 5. Missing teaching-design/authority manifests and source status gates remain visible. Nothing was promoted to make these pass.
- Final independent run after worker edits: 51 unit tests passed; lesson identity validation passed for 20 scoped lessons; `git diff --check` passed. The combined command used `&&`, so later successes could not mask test failure.

## Remaining migration / known limitations

1. `verify_lesson_authority.py`, `build_release_package.py`, other legacy consumers and parts of draft routing still need explicit-context migration; do not remove L01 config fields first.
2. Canonical precedence amendment in AGENTS.md is now landed. Other duplicate course/skill rules also remain; no claim of complete requirements consolidation.
3. Run packet modes and blocker records are now partially unified with `agent_loop`; full plan/release command integration remains a later slice.
4. Finalized extraction currently orders slide XML by filename, not presentation relationship order. Before using compile output as a faithful lesson-content specification, fix presentation ordering and test reordered decks. Package QA is not native playback or teacher rehearsal.
5. Finalized corpus identity is an explicit single-textbook adapter restriction, not an externally approved artifact-to-textbook manifest. Future multi-textbook support must supply that mapping.
6. Staging paths are checked before access; this is not an adversarial concurrent-filesystem/TOCTOU guarantee, nor a completed atomic-promotion implementation.
7. Requirements ownership IDs, skill decomposition, and full CI enforcement remain future slices.

Next bounded slice: migrate read-only authority verification and its tests before changing release writing; then remove legacy config keys only after a complete consumer inventory and compatibility tests.
