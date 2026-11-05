# Checkout portability and local prerequisites

The reviewed workflow code, rules, configuration and synthetic tests are versioned through an explicit file allowlist. Private/local teaching inputs and unrelated working-tree changes remain local. A fresh checkout can run the synthetic workflow suite without real lesson directories; it cannot reproduce the full classroom library without restoring the authoritative local inputs. Preserve existing changes and review an explicit file list before staging anything.

The scoped online generator/release tool and assessment-audio implementation have been recovered and tested. Native draft/source verification is available; a verified native formal release writer is not. Book II's 18 lesson identities and 2027-spring offering are registered from SQLite, with source/content review still pending and no invented timetable.

Follow `docs/workflow/workflow-verification.md` to install pinned dependencies, run synthetic integration tests and create the allowlisted source ZIP. The archive contains source hashes and can be tested in an isolated directory without importing real approvals or teaching artifacts. This is a portable workflow test package, not a complete classroom delivery package or proof that Git HEAD is self-contained.

Run `scripts/check_project_readiness.py` using the verification Python environment before production. It checks required inputs and imports, including the online renderer. Then run the actual version-scoped production and artifact QA gates. A runtime/import pass never grants production or release authorization.

The source kit excludes student records, credentials, source books, databases, media, real approvals and local evidence. `tools/workflow-verification/local-inputs.json` lists exact local capability inputs with hashes and availability at packaging time. Restore them from the authoritative project/source locations; do not replace absent evidence with synthetic fixtures. The Book II SQLite database remains the structured source of truth; a registration snapshot does not supersede it.

The repair evidence directories retain provenance, before-images, patches and test results. Older reports describe their observed state at that time; current availability is determined by the current scripts and the latest verification report. The final authorized commit includes only the reviewed source/configuration allowlist. No blanket staging, deployment or teaching release is part of these checks.
