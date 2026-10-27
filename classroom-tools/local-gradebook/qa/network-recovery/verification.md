# Network recovery verification — 2026-10-19

Scope: local-gradebook tool maintenance. No lesson production or approval changes.

Root cause: startup-only Host allowlist rejected the current LAN IP after a network change; launcher reused the same process.

Fix: validate current interface address on requests; reject previous IP and untrusted Host; retain cookie, request token, Origin and stale-revision protections. Offline message directs reconnection and another click, without restart.

Evidence:
- Three network regression tests failed before repair and passed afterward: changed address accepted/old address rejected; offline loopback retained; mobile entry recovered with same session.
- test_mobile.py: real LAN HTTP authentication and isolated shared-grade save, invalid cookie/key/Host/Origin/token and stale-revision checks passed.
- test_gradebook.py: all source hashes, raw imported records, scoring, backup/restore, persistence, export and security checks passed. Original desktop sources moved; verified retained private/sources copies via existing SHA-256 checks.
- test_feedback.py, test_feedback_ui.cjs and test_ui.cjs passed; app.js syntax passed.
- Live SQLite backup made before controlled service restart. Full /api/state equality before/after restart passed. Live mobile endpoint returned current connection entry; no credential copied into this evidence.
- Existing Chrome page: mobile dialog opened successfully. Reloaded to refresh request token, restored NNTQ1 / first exam; 18/28 scored and first student pending supplementation unchanged; obsolete network error absent.

Limits: physical phone and campus device-to-device connectivity not tested. Mac must stay awake with service running; phone and Mac need a mutually reachable local network. After IP changes, obtain latest link from desktop. No claim of guaranteed connectivity on isolated Wi-Fi.
