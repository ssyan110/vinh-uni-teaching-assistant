# Lesson readiness verification

- `python3 scripts/test_lesson_readiness.py`: 8 checks passed, including missing/malformed source records, real content-approval hash invalidation, unsupported approval strings, current/stale HTML, offering isolation, preserved completion decisions, cross-textbook authority rejection, and unsafe/archive/symlink paths.
- `python3 scripts/build_dashboard.py --readiness-only`: generated the current 33 registered lesson/offering rows. The 12 previously completed quasi-intermediate lessons retain their recorded completion without new historical tasks.
- `node dashboard/test-readiness.cjs`: installed Chrome, headless; lesson selection, textbook switching, return to existing course and lesson review, no page errors, no horizontal overflow at 390 px. It writes the adjacent screenshots and verification record.
- Visually inspected `desktop.png` (1440 px) and `mobile.png` (390 px): labels, selectors, evidence links and task text are readable without clipping. The selected lesson details appear before the course list on mobile.

The snapshot found a current Lesson 15 teacher-draft hash mismatch; its existing content-approval gate also rejects that changed input. This check reports the mismatch without changing any source or approval record. The HTML entry hash still matches its draft manifest.

This is local technical verification. No deployment, teacher playback, classroom rehearsal or source-content review was performed. Refresh the snapshot after input changes; the separate review-manifest builder does not refresh `readiness.js`.
