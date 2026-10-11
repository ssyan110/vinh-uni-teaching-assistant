# Attendance exception verification

Scope: `classroom-tools/student-tracker` only. No lesson assets, real attendance, grades, student records, remote database or deployments were modified. Baseline unrelated untracked paths (`OmniVoice/` and lesson-03 support draft) were preserved.

## Results

- Node 24.19.0: `npm run typecheck`, `npm test` (35 tests across 9 files), and `npm run build` passed.
- New synthetic repository tests cover create/edit/reload, single record per student/session, reason/time/date validation, independent makeup and official verification, cross-class rejection, preservation of historical attendance and learning events, trusted owner writes, missing-table compatibility, and class/session/student/date/status filtering.
- PostgreSQL 16.13: `attendance-exceptions-db-test.sql` passed in a disposable `/tmp/vinh-attendance-pg` cluster on Unix socket `/tmp`, port 55439. It creates synthetic auth/teacher/student/class fixtures and checks create/edit, verification date constraint, enrollment rejection, cross-owner read/insert/update denial, anonymous access denial and delete denial. Fixture writes roll back. This test emulates auth.uid; it does not verify hosted Supabase Auth or REST.
- Static accessibility review: every new input/select/textarea has a wrapping label, action buttons use native button elements, save/error feedback uses status/alert roles, and edit buttons identify student/date. No browser or assistive-technology verification is claimed.
- Vite started on `http://127.0.0.1:4317` using Node 24. Local entry: demo login → More → attendance exceptions; also available in session and student details.

## Remaining checks

- `agent-browser` is unavailable. The local skill requires stopping browser work when its CLI is missing, and prohibits replacing it with ad hoc scripts. Therefore visual, keyboard, mobile layout, and browser reload checks remain blocked. Repository reload tests passed, but are not browser reload evidence.
- Supabase CLI unavailable; npm registry lookup failed with ENOTFOUND. SQL remains a migration candidate (`supabase/attendance-exceptions.sql`), with instructions to create the timestamped migration via CLI. No remote migration was applied.
- Real Supabase Data API, hosted RLS and authenticated create/edit/reload require an approved migration and an authorized synthetic test account/class. Do not use real student data for those checks.
- Default Node 20 is below the supported baseline; Homebrew Node 22 currently fails to load a dylib. Node 24 works and was used for final verification and dev server.

No new dependencies or services were added. Official QR attendance remains separate; the app never claims automatic sync. Lesson-specific agent_loop gates are inapplicable to this app change and were not run against a fabricated lesson identity.
