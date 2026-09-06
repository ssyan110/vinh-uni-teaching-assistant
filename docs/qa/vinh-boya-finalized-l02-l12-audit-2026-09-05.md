# 《准中级加速篇 I》L02–L12 finalized PPTX audit

- audit date: 2026-09-05
- source of truth: `/Users/ssyan110/Desktop/Work/Teaching/VinhUni/00_上課教材`
- scope: L02–L12, online / face-to-face, 22 Desktop finalized PPTX
- authority effect: read-only audit only; no `20-approved/` or `40-release/` status changed

## Results

| Lesson | Mode | Slides | ZIP | 16:9 | Blank | Media | Min explicit pt | Repo comparison |
|---|---:|---:|---|---|---:|---:|---:|---|
| L02 | online | 80 | PASS | PASS | 0 | 43 | 20.0 | match |
| L02 | face-to-face | 57 | PASS | PASS | 0 | 18 | 20.0 | different |
| L03 | online | 68 | PASS | PASS | 0 | 39 | 20.0 | match |
| L03 | face-to-face | 50 | PASS | PASS | 0 | 18 | 20.0 | match |
| L04 | online | 75 | PASS | PASS | 0 | 37 | 20.0 | match |
| L04 | face-to-face | 57 | PASS | PASS | 0 | 18 | 20.0 | match |
| L05 | online | 76 | PASS | PASS | 0 | 40 | 20.0 | match |
| L05 | face-to-face | 55 | PASS | PASS | 0 | 18 | 20.0 | match |
| L06 | online | 69 | PASS | PASS | 0 | 36 | 20.0 | match |
| L06 | face-to-face | 50 | PASS | PASS | 0 | 18 | 20.0 | match |
| L07 | online | 83 | PASS | PASS | 0 | 42 | 20.0 | different |
| L07 | face-to-face | 54 | PASS | PASS | 0 | 18 | 20.0 | different |
| L08 | online | 86 | PASS | PASS | 0 | 47 | 20.0 | different |
| L08 | face-to-face | 55 | PASS | PASS | 0 | 21 | 20.0 | different |
| L09 | online | 79 | PASS | PASS | 0 | 41 | 20.0 | different |
| L09 | face-to-face | 54 | PASS | PASS | 0 | 17 | 20.0 | different |
| L10 | online | 80 | PASS | PASS | 0 | 44 | 20.0 | different |
| L10 | face-to-face | 53 | PASS | PASS | 0 | 21 | 20.0 | different |
| L11 | online | 69 | PASS | PASS | 0 | 38 | 20.0 | different |
| L11 | face-to-face | 52 | PASS | PASS | 0 | 21 | 20.0 | different |
| L12 | online | 75 | PASS | PASS | 0 | 42 | 20.0 | different |
| L12 | face-to-face | 52 | PASS | PASS | 0 | 21 | 20.0 | different |

## Interpretation

- All 22 Desktop files were found and passed ZIP integrity, 16:9 canvas, and zero-blank-slide structural checks.
- The Desktop finalized files are the comparison truth for this audit. Where the repository has an approved or draft counterpart, the hash comparison is recorded above; a different hash is not treated as an error because the finalized Desktop file takes precedence for migration/audit input.
- `minimum_explicit_font_pt` is a structural scan of explicit run/default-run sizes. It does not replace rendered PowerPoint/PDF visual QA or teacher rehearsal.
- L10–L12 remain separate from repository authority/release unless Adam explicitly authorizes registration/promotion.

## Run-scoped verification

- `scripts/lessonctl.py build --source finalized-pptx` equivalent: 11/11 lesson-scoped builds passed (G3), using isolated `.agent/runs/audit-l02-l12-20260905-lNN/build/` directories.
- `scripts/lessonctl.py qa --source finalized-pptx` equivalent: 11/11 lesson-scoped QA runs passed (G4), with no blockers.
- QA verified for each deck: SHA-256, byte count, slide count, speaker-note count, embedded media count, and 16:9 slide size.
- Run IDs: `audit-l02-l12-20260905-l02` through `audit-l02-l12-20260905-l12`.
