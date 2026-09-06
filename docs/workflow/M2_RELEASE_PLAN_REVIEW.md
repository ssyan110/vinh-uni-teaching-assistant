# M2 lesson-scoped read-only release planning

Date: 2026-09-05
Status: implemented and verified; scoped release writing remains disabled

## Scope

This slice changed workflow code, tests, and documentation only. It did not copy authority files, create ZIPs, update authority manifests, write `latest-release.json`, approve artifacts, or publish a release.

## Implemented

- Added `build_release_package.py --plan` with required explicit `--lesson-key`, `--release-id`, and optional `--offering-id`.
- The planner resolves authority and release roots through `LessonContext` rather than active Lesson 01 config.
- It runs the selected lesson's release gate, verifies authority-manifest identity, builds manifest-driven mappings, verifies every selected authority file's path/hash/byte count, and reports exact destination paths.
- It rejects malformed identity/release IDs, wrong offerings, cross-lesson authority sources, changed authority files, existing release IDs, partial ZIP markers, and symlinked release roots.
- Every planner result states `write_performed: false`. The public CLI never calls `build_release` in plan mode.
- Scoped release writing is explicitly rejected at the CLI unless `--plan` is used. The existing no-key builder remains only for legacy active-context compatibility and was not executed.
- Updated `scripts/README.md` to put read-only planning before the legacy writing command and label the latter appropriately.
- Hardened `production_gate.require_release_ready` so legacy string-valued `qa` or `qa.rehearsal` fields become blockers rather than uncaught exceptions.

## Verification

Final independent command:

`python3 -m unittest discover -s tests -p 'test_*.py' -q && python3 scripts/validate_lesson_identity.py && python3 scripts/build_release_package.py --help && git diff --check`

Result:

- 70 tests passed.
- Lesson identity validation passed for 20 scoped lessons.
- CLI help shows `--plan`, `--lesson-key`, `--offering-id`, and `--release-id`.
- `git diff --check` passed.

Seven focused planning tests cover L02/L10/L12 complete plans in synthetic temporary trees, no writes or global mutation, missing manifests, existing/partial releases, changed authority, cross-lesson paths, bad identity/release ID/offering, symlinks, and CLI dispatch. A separate gate regression covers invalid rehearsal schema.

## Real repository read-only exercise

Command shape used for L02-L12:

`python3 scripts/build_release_package.py --plan --lesson-key <key> --offering-id 2026-fall --release-id workflow-v2-review`

All 11 plans returned `blocked` with exit code 1, as required by current authority/release evidence. L07-L09 could map two existing authority entries but remained blocked by release gates and other evidence; all other lessons mapped zero eligible entries. No plan claimed release readiness.

| Lessons | Plan status | Entry count | Blocker count |
|---|---|---:|---:|
| L02-L06 | blocked | 0 each | 24 each |
| L07 | blocked | 2 | 18 |
| L08-L09 | blocked | 2 each | 17 each |
| L10 | blocked | 0 | 18 |
| L11-L12 | blocked | 0 each | 17 each |

A content/hash/path snapshot of all existing L02-L12 `20-approved/` and `40-release/` trees was taken before and after the 11 CLI plans. All 40 snapshot entries were unchanged.

## Remaining boundaries

- This does not authorize or implement lesson-scoped release writing.
- Existing dirty teaching, PPTX, image, source, classroom-tool, and authority files were preserved.
- The legacy active-context builder still exists and still uses config globals internally. It must not become the new scoped path by merely adding CLI arguments.
- Before migrating writes, implementation must use one reviewed plan object, stage all outputs in a new temporary sibling, validate tree/ZIP/metadata completely, then atomically publish and read back the exact target. Failure cleanup and rollback behavior need dedicated temporary-tree tests.
- Config L01 path fields remain until every consumer, including release writes, has migrated and compatibility tests pass.
- Requirements ownership, skill decomposition, and full agent-loop structured-blocker integration remain separate unfinished slices.
