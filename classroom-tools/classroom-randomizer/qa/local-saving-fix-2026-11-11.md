# Local classroom saving repair — 2026-11-11

## Cause and bounded change

`persist()` saved the full pretty-printed state, including a complete classroom snapshot for every undo step. The stored JSON grew quadratically. With 30 synthetic students, 100 voluntary answers produced approximately 9.51 million characters, exceeding Web Storage capacity even though the current classroom data was about 113 thousand characters.

Local saving now stores reverse differences between undo snapshots. All answers, identifiers, audit events, absence history and every undo step remain recoverable. The same 100-answer case uses approximately 146 thousand characters. Existing saved sessions and full JSON backups remain importable. Downloaded backups retain the original readable format.

The saved indicator now reflects successful local writes. A failed write remains visibly unsaved, cannot be hidden by subsequent success toasts, warns before leaving, and offers a retry without inventing an extra answer. This is separate from the cloud synchronization indicator.

## Verification

- `npm test`: 76 tests passed, including five compact-storage tests and three additional cloud queue regressions.
- Syntax checks for app/model and `git diff --check` passed.
- Isolated Chromium, mock cloud, synthetic rosters only: legacy 60-answer session resumed; 30 further +1 actions saved; all 90 answers and undo steps survived reload.
- Repeated undo, same-pending voluntary conversion, independent teacher +1 while another answer remains pending, normal answer completion, and voided records verified.
- A nearly full origin retained an unrelated 4 MiB key. Blocked and quota-exceeded writes retained the previous durable snapshot; the downloaded backup contained the new in-memory answer; retry persisted it without duplication.
- Desktop and 390px mobile warning/retry UI tested; mobile screenshot visually inspected. No browser page errors.
- Concurrent newer queue versions survived older upload acknowledgements; partial enqueue and cleanup write failures remained recoverable and retried idempotently.

## Release safeguards and limits

No real student records or production database tables were changed during tests. The existing production app/model/index/styles/cloud assets were read and matched the pre-fix checkout byte-for-byte. Deploy only the reviewed app assets; do not include private rosters, databases, environment files, test downloads or unrelated repository content.

Do not refresh a classroom page with unsaved data before downloading its complete backup. Deployment does not update an already-open page. New code can import that backup after reload.

This repair does not change database synchronization semantics or add cross-tab locking. Continue using one teacher tab per live classroom. A browser that blocks storage entirely still shows an honest warning and requires backup/retry.
