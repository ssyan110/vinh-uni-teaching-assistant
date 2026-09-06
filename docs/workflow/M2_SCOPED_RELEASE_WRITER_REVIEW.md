# M2 lesson-scoped release writer — staged transaction review

Date: 2026-09-05
Status: implementation verified in synthetic temporary projects; no real release executed

## Implemented behavior

`build_release_package.py` now requires exactly one explicit mode:

- `--plan`: read-only scoped plan.
- `--inspect`: read-only transaction/recovery inspection; it never cleans or repairs state.
- `--execute`: lesson-scoped transaction writer.
- `--legacy-active-build`: isolated compatibility path.

Running the script without a mode cannot write. Both writer modes require `--release-id` and an exact repeat through `--confirm-release-id`. Scoped execution additionally requires `--lesson-key`; optional `--offering-id` is validated through the registry.

The scoped writer always creates a fresh plan, then:

1. Resolves the selected lesson's authority/release roots.
2. Rejects blocked plans, existing/partial targets, or stale transaction markers.
3. Acquires an exclusive release-id transaction reservation; an invocation that does not own it cannot modify or clean it.
4. Rechecks the authority-manifest hash and each authority source hash/byte count after planning and immediately before publish.
5. Copies only manifest-mapped files into transaction staging.
6. Rejects non-portable, backslash/control-character, Windows-reserved, non-NFC and case/Unicode-colliding release paths.
7. Verifies staged file count, paths, hashes, bytes, tree hash, deterministic ZIP and CRC.
8. Stages `latest-release.json` and the updated authority manifest as valid JSON.
9. Rechecks target absence and reads back the final package and ZIP before moving metadata pointers.
10. Attempts parent-directory `fsync` where supported, commits metadata, and checks exact identity/hash fields.
11. Runs the scoped end-to-end authority verifier; success requires integrity passed and `delivery_status=ready`.
12. Removes the transaction directory only after all read-back and verifier checks pass.

## Failure handling

If a normal exception occurs during staging or commit, rollback independently attempts every applicable action: restore authority metadata, restore prior latest-release metadata, remove the newly published ZIP, and remove the newly published directory. One rollback error does not skip later cleanup actions.

A complete rollback removes the transaction directory and raises a truthful failure. An incomplete rollback preserves `.release-id.transaction/transaction.json` with `rollback_incomplete` and error details; subsequent planning for the same ID is blocked for human review.

This is best-effort transactional publication, not a filesystem-wide atomic commit. A process kill, kernel failure, or power loss between separate `os.replace` calls can leave partial targets. The transaction marker and target-existence guards make that state detectable; they must not be automatically deleted. Cross-filesystem atomicity is not claimed.

## Tests and real execution boundary

Final verification:

- 95 unit tests passed.
- 20 scoped lesson identities passed.
- Python compile checks passed for builder, gate and verifier.
- `git diff --check` passed.
- Default real CLI invocation exited 2 because no mode was selected; no writer dispatched.
- Real L02-L12 exercises used `--plan` only. All 11 were blocked and reported `write_performed=false`.
- Before/after snapshots of L02-L12 `20-approved/` and `40-release/` remained identical across all 40 observed entries.

Scoped writer tests created releases only in temporary synthetic projects and covered:

- successful L10 staging, commit, ZIP and metadata read-back;
- exact typed confirmation before writes;
- blocked fresh plan before writes;
- authority mutation after planning and during copying;
- concurrent reservation loss without touching the winner's transaction;
- portable path hazards plus case/Unicode collision rejection;
- pending metadata transaction artifact rejection;
- commit failure before authority-manifest replacement;
- post-commit read-back failure restoring both metadata files;
- incomplete rollback retaining a review marker while continuing other cleanup;
- stale transaction rejection;
- explicit CLI execute dispatch;
- read-only transaction inspection for clear, review, malformed-marker, and CLI paths;
- default CLI refusing to dispatch either writer.

## Not performed

- No real `--execute` or `--legacy-active-build` command.
- No real authority/release file creation, replacement, deletion, approval, promotion or publication.
- No PPTX or lesson-content changes.
- No cleanup of existing dirty files.

## Remaining work

- Route scoped release through the future `lessonctl release` command only after command/state integration is designed; current implemented entry is the guarded builder utility.
- Define an explicit, human-authorized recovery protocol for inspected crash state; this slice intentionally adds no cleanup or recovery command.
- Migrate remaining active-context consumers before removing L01 config keys.
- `scripts/blocker_contract.py` now owns the shared structured blocker schema. `production_gate.py`, `agent_loop.py`, `lessonctl.py`, and release `--plan`/`--inspect` expose backward-compatible blocker strings plus `blocker_records`; `agent_loop release-check` attaches read-only plan/inspect evidence, while full release lifecycle orchestration remains a later slice.
- Requirements ownership migration to requirement IDs and large skill decomposition remain unfinished.
