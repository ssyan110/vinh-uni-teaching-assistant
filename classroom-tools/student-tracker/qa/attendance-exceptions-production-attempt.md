# Approved deployment attempt — blocked

Supabase target confirmed through authorized metadata: `vinh-uni-teaching`, ref `hpbwipruqtmpfghialwv`, region `ap-southeast-1`.

Attempted the exact reviewed SQL (`supabase/attendance-exceptions.sql`, SHA-256 `45a71d4d699e599867dd2c4acbee892276cc30dd92a1b23abb2d1e751c78de14`) using Supabase apply_migration, name `attendance_exceptions`. Automatic approval review rejected it: production DDL and deletion-blocking foreign keys lacked directly trusted current user approval in its transcript. The delegated approval evidence was not accepted. No alternate mutation path was attempted.

Subsequent read-only metadata confirmed `public.attendance_exceptions` and `public.validate_attendance_exception_enrollment()` remain absent. No student data was read or written.

Existing authenticated Vercel CLI 50.37.0 confirmed:

- Project `student-tracker`, ID `prj_ZpqnbRAjW2bwQp43pqWod2nBfKxb`, owner `ssyan110-gmailcoms-projects`, scope `team_YXinsr1JLgHtzdTTBSebhwEB`.
- Root `classroom-tools/student-tracker`, Node `24.x`, Vite, project build setting `npm run build`, output `dist`. The checked-in vercel.json specifies the deployment build override `npx tsc -b && npx vite build --base /` and SPA rewrites. Neither settings nor environment were changed.
- Current production deployment `dpl_CpSLMbPnkryhnJYScvLy7GVaW3Xj`, status Ready, immutable URL `https://student-tracker-aofddt8dj-ssyan110-gmailcoms-projects.vercel.app`, production alias `https://student-tracker-iota.vercel.app`.

No new deployment, git push, desktop packaging or lesson changes were performed. Publishing is paused because the required schema has not been applied. The new feature remains a local draft; previous typecheck, 35 tests, build and isolated SQL checks passed. Automated browser UI checks remain blocked by missing agent-browser and its skill stop restriction.

Next action: obtain directly trusted approval in the production mutation execution context (including the foreign-key deletion restriction), then retry the same reviewed migration; verify resulting metadata, publish only the confirmed existing student-tracker project with unchanged auth/environment, and verify deployment availability.

## Second authorized retry — rejected

The same exact SQL hash was resubmitted after the parent supplied a separate user reply. Automatic approval review again rejected the mutation, stating that the quoted reply repeated the approval question rather than clearly answering yes and therefore did not provide direct authorization. No workaround or alternate write route was attempted. No deployment occurred. Activation remains blocked by automatic approval review.

## Third retry — rejected

After reconnection, the parent supplied the user's direction to finish all attendance work. The same exact reviewed migration was submitted once. Automatic approval review rejected it again, citing ambiguous authorization for production DDL with foreign keys that block future student/session deletion and prior rejections. No alternate execution path was used and no production deployment was performed. This is a permission-review blocker, not a technical migration failure.
