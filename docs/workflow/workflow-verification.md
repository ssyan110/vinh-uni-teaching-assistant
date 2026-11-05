# Reproduce the workflow checks

Use this procedure after changing workflow rules or tools, or when setting up another checkout. It verifies policy enforcement, native source constraints, online PPTX generation and controlled release behavior using synthetic fixtures. It does not create teaching approval or prove classroom acceptance.

From the project root, create an isolated Python environment and install the locked dependencies:

```sh
python3 -m venv .agent/workflow-venv
.agent/workflow-venv/bin/python -m pip install -r tools/workflow-verification/requirements.txt
npm ci --prefix tools/workflow-verification --ignore-scripts --no-audit --no-fund
.agent/workflow-venv/bin/python -B scripts/run_workflow_verification.py
.agent/workflow-venv/bin/python -B scripts/check_project_readiness.py
python3 -B scripts/check_governance.py
```

Use Python 3.11 or later and Node 20 or later. The tested host used Python 3.14.4 and Node 20.15.1. Test results and retained synthetic fixtures are written under `.agent/runs/workflow-verification-*`; the runner prints the exact result path. A successful test run must have zero failures, errors and unexpected skips. It runs from a fresh source checkout without real lesson directories. Native-route tests create their own synthetic identities; the dashboard grouping test injects a synthetic import-time context. It never imports a real exam to create test approvals. All test approval records are synthetic and live inside test fixture directories.

Create a portable source snapshot without staging existing changes:

```sh
python3 -B scripts/package_workflow_verification.py --output .agent/runs/workflow-verification-kit.zip
```

The output path must be new. The allowlist is `tools/workflow-verification/manifest.json`; the archive contains per-file SHA-256 hashes in `SOURCE-SHA256.json`. Extract it to a new directory inside an authorized project root and run the same dependency installation and test commands there. Never extract over a working checkout. The generated placeholder lesson directories support identity tests only; they contain no teaching artifacts.

The kit includes reviewed code, rules, configuration and synthetic tests. It excludes local databases, student records, textbooks, audio, real approvals, teaching artifacts and generated outputs. Therefore capability checks in the kit must report missing real inputs. Restore those inputs separately from their authoritative sources, then run scoped production and artifact QA gates in the full checkout. Do not interpret a synthetic test pass as permission to generate or publish real materials.

For audio changes, additionally run the strict dashboard consistency command documented in `docs/workflow/audio-dashboard-standard.md`, decode newly registered files, and inspect controls at desktop and phone widths. For workspace registration changes, run `scripts/sync_open_slide_workspace.py --check-only`; source checks do not replace live editing, dragging and save/reopen QA when a deck itself changes.

Book II’s 18 lesson identities and `2027-spring` offering are registered from its authoritative SQLite `course_index` and `lesson_index`. Registration preserves pending source/content review; it does not invent a timetable or an approval. The database remains local and is not included in the kit.
