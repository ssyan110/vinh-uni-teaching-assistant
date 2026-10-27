# Classroom HTML lifecycle

Status: registered HTML decks support guarded approval and release. Content approval, formal approval and release authorization are distinct decisions; one explicit human decision may cover multiple named actions.
Owner: canonical-workflow-contract.md. Visual and activity acceptance remain in the classroom standard and activity workflow.

## Prepare and produce

Resolve the explicit offering and lesson keys from the registry. For a combined deck, record every covered lesson key, the owning lesson directory and each source/copy input. A single owner never approves content belonging to another lesson. Reuse actual user approval evidence; do not retrofit synthetic approvals to existing decks.

Before creating a new classroom deck or image, obtain approval of its concrete reviewed content and bind each lesson's own source, nonempty source-check report, review and actual decision to an `artifact-content` record. Set `approval_records` in the workspace deck keyed by every lesson key and set the same `class_scope` on the workspace deck, copy contract and draft manifest. Record the actual teaching sequence and progress; no separate repeat confirmation of the standing online/classroom split is required.

For each covered lesson run the scoped check using its own record; the owning lesson's output is `lessons/<textbook>/<lesson>/10-design/open-slide-draft/<offering>/<deck-id>`. Pass `--approval-record`, `--artifact-scope classroom`, `--artifact-id <deck-id>`, `--class-scope <class>` and `--offering-id` in addition to `--purpose classroom-html --stage draft --lesson-key` and `--output-dir`. The check writes and approves nothing; source or review changes invalidate the affected approval. Existing registered decks retain their specific legacy compatibility; it is not a shortcut for new decks.

## Verify and hand off the draft

Optional rehearsal and classroom speaker checks follow the current user scope. When Adam explicitly excludes both, the draft manifest may record `classroom_checks_exclusion` with `checks: ["classroom_rehearsal", "speaker_test"]`, exact `offering_id`, `deck_id`, `class_scope`, and the lesson-local actual decision's `evidence` path and `evidence_sha256`. The readiness board validates that scope and evidence, displays “本次不需要”, and does not count them as pending or passed. Missing, changed or cross-term evidence cannot waive a check. This record does not approve or release the deck.

Keep a lesson-local draft manifest recording lesson keys, entry HTML, all packaged resources and SHA-256 values, approved source/copy references, teacher materials, actual page/activity mapping and QA evidence paths. Resources must be local, self-contained or packaged relative to the entry; no absolute file paths, unshipped files or required network fonts/media. Inspect actual pages and offline behavior, not just the manifest.

Use classroom-activity-workflow.md for activity design and copy; use the single current QA checklist in classroom-html-standard-2026-10-07.md (including its 2026-10-20 additions) for visual references, rendering, navigation and evidence. The reference split is L9–10 for cover/overall visual system, L11–12 for route icon cards, and the nearest reviewed matching activity page for repeated activity types. Verify teacher reading files against the approved content. Record technical checks separately from teacher listening, classroom playback, rehearsal and classroom acceptance.

The shared-homepage sync is a narrow preview-output exception: only the registered workspace's generated slide/asset directories may be written. Keep authored source in its owning lesson. Sync never modifies source content, approval records or authority/release. Its current gate validates a per-deck reviewed-copy contract, registered source/lesson identity, the draft manifest and existing content-approval preflights. Schema-v2 browser evidence covers every page's actual text, computed typography, visible glyph/image/paint geometry, finite footer clearance, source/contract/asset hashes, and saved screenshot integrity. Sync rerenders read-only to recheck those material measurements and the exact named negative cases. Historical W06-specific assertions are not the generic production path. The existing pipeline is orchestrated by `scripts/verify_classroom_slides.py`; it creates no approval or authority. Cross-run screenshot raster differences are diagnostics only when material hashes and measured page contents match. A homepage card or a successful build cannot promote an artifact.

## Formal approval, archive and release

The implemented route supports registered HTML decks with the current copy contract and visual profile. Native React decks and historical HTML without a current profile must first be converted or registered with equivalent current evidence; do not use the legacy preview exemption as release approval.

1. Run `python3 scripts/plan_classroom_release.py --deck-id <deck-id>`. It checks every lesson's scoped approved inputs, used sources, current files, teaching materials and QA and returns a candidate fingerprint and blockers. Historical registered decks without scoped records need a nonempty per-lesson `source_check_reports` entry with matching SHA-256 before formal approval. It does not require another lesson's full release or approval of unused material. A passing check is not human approval.
2. Preserve the actual explicit user decision under the owning lesson's `10-design/`. A single `classroom-package-approval` record can approve the exact deck and teacher materials: include the candidate fingerprint, deck, offering, ordered lesson keys, `class_scope` for scoped decks, `approved_by`, timezone-aware `approved_at`, actual `user_decision` and `approved_components: ["deck", "teacher_materials"]`. If this same decision also explicitly authorizes release, include `authorized_actions: ["release"]` and the exact `release_id`. Separate legacy `classroom-deck-approval` and `classroom-teacher-materials-approval` records remain supported. Never infer a decision.
3. Run `python3 scripts/classroom_release.py promote --deck-id <deck-id> --candidate-sha256 <hash> --evidence <package-evidence>`. For separate legacy decisions add `--teacher-evidence <teacher-evidence>`. This checks the candidate and copies approved files into a new `20-approved/html/<version>/` without overwriting history.
4. Run `python3 scripts/classroom_release.py release --lesson-key <owner-key> --offering-id <offering> --version <approved-version> --release-id <new-id> --evidence <release-evidence>`. The evidence is either the combined record explicitly authorizing this exact release, or a separate `classroom-release` decision with the same identity and `release_id`. Optional `human_checks` entries for `teacher_rehearsal` and `audio_playback` require actual hash-bound evidence when marked `passed` or `explicitly-waived`; absent checks are recorded as `not_requested`. Never invent a test, pass or waiver. This setting does not change weekly assessment audio rules.
5. Run `python3 scripts/classroom_release.py verify --lesson-key <owner-key> --offering-id <offering> --release-id <id>` to verify authority, evidence, package and ZIP without writing. Existing release IDs are never overwritten.

All operations stage inside `.agent/runs/`, hold a project-wide classroom authority/release lock, use no-replace directory renames and retain transaction evidence. The legacy PPTX release writer does not share that lock; do not run it concurrently with classroom approval or release. On failure they restore the prior manifest and move published files back to staging. A crash can leave a staged transaction; run `python3 scripts/classroom_release.py inspect --lesson-key <owner-key> --offering-id <offering>` and preserve the reported files for review. A staged transaction blocks further classroom authority/release operations; no automatic deletion or invented approval is allowed.

An existing legacy authority inventory may be repaired only when the actual files match their already recorded hashes and sizes. `scripts/repair_legacy_authority_inventory.py` first plans read-only; execution requires an explicit lesson and a new snapshot path in `.agent/runs/`. It adds inventory entries and an actual activity count without changing historical approval or delivery statuses. Ambiguous or changed files remain blocked.

This classroom release is a separately scoped HTML release. The older PPTX release tool, its release pointer and historic packages stay unchanged. A homepage sync or successful build is still not formal approval or release.

After rebuilding the existing lesson dashboard cache with `python3 scripts/build_dashboard.py`, its file group lists each verified classroom ZIP and release record. A corrupt or incomplete classroom release is marked for review instead of linked as verified. A classroom-only release does not mark the entire lesson package delivered.

## Read-only candidate inventory

`python3 scripts/plan_classroom_release.py --deck-id <registered-html-deck-id>`
checks the registered draft identity, current visual profile, local file hashes,
declared HTML resources, teacher materials and the owning lesson's existing authority inventory. It exercises all pages in a network-disabled
browser and returns a candidate fingerprint and blockers without writing.
It does not record human approval, write authority, or release a package;
the browser check does not cover interactions beyond the page navigation tested. Approved authority retains copies of the hash-bound review inputs and screenshots as well as the classroom package; the review evidence is not placed in the teacher delivery ZIP. A fingerprint or passing visual check must never be treated as a gate
override. Preserve historical approved files when an authority audit is blocked.
