# Remaining-item verification and LT_02 cleanup

Started 2026-10-25; completed 2026-10-26, Asia/Ho_Chi_Minh.
This follow-up supersedes the remaining-item status in the initial audit.

## LT_02: the duplicate class is resolved

Adam confirmed that both 2026-09-10 session records represented the same class,
then explicitly instructed: keep the 33 randomizer attempts and delete the 30
manual replacements added because those attempts were not visible.

The cleanup was tested against the restored application data before production.
Production now retains session `b191bbe0-25bb-437e-8428-03eb5156ad93` as class
number 1. Exactly 30 manual-adjustment events were removed; the duplicate session
was removed after its correction history was relinked. A new correction audit
records Adam's decision and the cleanup. Both original and latest application
snapshots remain in the restricted local backup folder.

All 33 original attempts are byte-equivalent before and after cleanup:

- 32 answered attempts.
- 1 pending attempt.
- Of the 32 answered attempts, 26 match the current roster. Six have no student ID
  and are already redacted as `TRANSFERRED` / `已转出`. Their identities were not
  guessed or reassigned.

The participation page previously summed only the roster rows, hiding those six
historical answers from its headline total. Its summary now uses all effective
participation records, explains unmatched historical answers, and includes a
separate historical-answer subtotal in CSV export.

Evidence: `approved-lt02-cleanup.sql`, `lt02-cleanup-result.json`,
`data-diff.json`, and the final live-page screenshot. All 690 raw attempts across
the database are unchanged. Thirteen application tables are identical to the
pre-test snapshot. The remaining changes are the authorized session/event cleanup,
correction audit, and the linked randomizer session's updated_at timestamp.

## Authenticated application checks

Using the existing signed-in teacher session on the real production tracker:

1. Created a uniquely marked synthetic course through the UI.
2. Imported one synthetic student through the UI.
3. Reloaded and verified both persisted.
4. Seeded an isolated class session through the existing resolver.
5. Added a participation event through the UI, reloaded, and verified count 1.
6. Corrected that event through the UI, reloaded, and verified count 0 plus a
   persisted correction audit.
7. Saved attendance through the UI, reloaded, and verified its persisted status.
8. Removed only the exact synthetic IDs and verified the original roster counts
   returned to 99 students and 4 courses.

The randomizer's existing teacher login and live 28-student NNTQ1 roster loaded
successfully; its UI reported connected synchronization. No real classroom was
started and no real student's participation was changed for this check.
Credential entry and a real teaching session were not simulated.

Screenshots and database readback are stored beside this report. Synthetic test
data is not left in production.

## Backups and restoration

The signed-in Supabase dashboard explicitly reports that the Free Plan has no
project backups; scheduled backups require Pro. Leaked-password protection is
also restricted to Pro or above. No billing or subscription change was made.

A consistent read-only snapshot of all 17 application tables was saved locally
under `classroom-tools/private/supabase-audit-20261025/`, which Git ignores.
The folder is mode 0700 and data files are mode 0600. The original snapshot and
the latest post-cleanup snapshot are both retained.

The original snapshot was restored after replaying the schema migrations:
every field of every row matched, with foreign keys enforced. Historical
business triggers were temporarily suspended only in the disposable local
restore, then re-enabled. A custom-format application dump was restored into a
second new local database and compared successfully. Finally, the latest real
post-cleanup snapshot was restored after all 30 migrations and matched exactly
across all 17 application tables. The rebuilt schema matches the live schema
across all seven catalog categories.

Managed Auth passwords, sessions, platform configuration, and off-site backup
storage are outside these application-data recovery checks. Local owner-ID
placeholders were used; no Auth passwords were copied or restored. This does
not establish full Supabase-project disaster recovery.

The tracker UI's “full backup” label was inaccurate: it exported the loaded
tracker snapshot, omitting other application tables and account configuration.
The label now says “匯出管理資料 JSON” and explains that the file cannot directly
restore Supabase. This copy was reviewed using the Traditional Chinese editing
skill and checked visibly in the local and staged browser.

Evidence: `restore-verification.json`, `dump-restore-verification.json`,
`latest-restore-verification.json`, `schema-comparison.json`, restore logs and
`backups-free-plan.png`. Private student data is not included in these public
QA summaries.

## Performance and advisor review

On the restored application data, a bounded read benchmark executed 200
transactions across five concurrent clients: zero failed transactions, average
transaction latency 16.534 ms, and 302.4 transactions/second. Each transaction
read the 12 tracker snapshot tables under the authenticated role and owner RLS.
This tests local query behavior, not Supabase network latency or production
capacity.

A read-only live EXPLAIN ANALYZE of the raw-attempt/class-session join reported
4.334 ms execution and 3.074 ms planning at inspection.

Index review found one genuinely redundant non-unique index:
`classroom_record_corrections_owner_record_idx` duplicated the column order and
predicate of `classroom_record_corrections_unique_record`. The redundant index
was removed through migration `20261025165245_remove_duplicate_correction_lookup_index`;
the unique index remains. This was verified locally and live.

The final performance advisor has no missing foreign-key index or auth-initplan
warnings. Remaining unused-index notices were reviewed as usage observations,
not proof that the indexes should be removed. Intentional restricted RPC and
interaction-table security notices remain; the initial report explains their
authorization model.

## Frontend release scope

Only MorePage and ParticipationPage have code changes in the frontend release.
All other 41 build files were recovered from the previous production deployment
and verified against its source hashes. Private data, environment files,
classroom materials, QA files and unrelated local work were excluded.
The final screenshot also confirmed a pre-existing broken logo reference. The
original production logo bytes were restored at the public path already used by
the app and favicon. Its exact file is exempted from the general generated-PNG
ignore rule so future source releases retain it.

The regression test verifies that a historical answered record with no roster
identity remains visible in the class total while a pending attempt does not
count. The tracker suite passes 52 tests in 13 files. The isolated production
source build passed with Node 24, then the staged production build passed browser
checks before promotion. The existing randomizer's 68 tests passed in the
initial audit; no randomizer source changed in this follow-up.

Release ID: `dpl_6KPpVDew25ixYVT1uUh3x6DBk75g`.
Production URL: [student tracker](https://student-tracker-iota.vercel.app).
Source manifest: `deployment-file-manifest.json`.

Promotion and the production hostname were read back as READY for this release.
The signed-in live LT_02 page now visibly shows 32 answers and explicitly explains
the six unmatched historical answers; screenshot: `lt02-final-live.png`.
CSV export was clicked, but browser automation did not deliver a download event,
so the downloaded file's bytes were not read back. Opening Chrome's downloads
page was blocked by browser URL policy; no alternate access path was attempted.

## Items that still require external evidence

- Real classroom use and school-network/device behavior.
- Full managed-Auth/project recovery and a separately stored off-site backup.
- Paid-plan features if Adam later chooses to subscribe.

No automatic LCU update was performed. The available update was reported and
left pending Adam's choice.
