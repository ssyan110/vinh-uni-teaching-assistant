# OpenSlide editability decision — 2026-10-31

Scope: future Vinh in-person OpenSlide decks. Adam requires text directly editable by a person and individually draggable elements in OpenSlide; HTML/iframe wrappers are excluded. Existing artifacts and online PPTX remain unchanged. Verify edits and moves persist after reopening; an unverified capability is not a pass.

The former HTML-first and literal DOM/CSS-copy instructions are superseded for this scope. The active owners are `AGENTS.md`, `PROJECT_REQUIREMENTS.md`, `docs/open-slide-workspace.md`, `docs/classroom-activity-workflow.md` and `docs/workflow/canonical-workflow-contract.md`; the teaching-material skill and older presenter guides route to them. Pedagogy, approved-copy integrity, visual reference fidelity, content approval, teacher checks and formal release remain independent requirements.

## Remaining consumers and limitations

- `docs/classroom-html-standard-2026-10-07.md` and `docs/workflow/classroom-html-lifecycle.md` were restored from `vinh-uni-main` and updated in this checkout. They retain the applicable pedagogy and approval gates, scope the implemented HTML workflow to historical decks, and route future decks to native pages.
- `scripts/sync_open_slide_workspace.py` generates sandboxed iframe HTML pages only for the existing entries in `classroom-tools/openslide-mac/html-decks.json`; it rejects new registrations through this route. `scripts/classroom_slide_contract.py`, visual checks and `scripts/classroom_release.py` target HTML and do not verify or release native pages.
- The shared workspace exists in this checkout. Its previously absent local adapter was recreated as `lessons/boya-elementary-i/lesson-04-05-06/10-design/open-slide-draft/w02-lessons-04-06/AGENTS.md`, with a `CLAUDE.md` entry point. The upstream `tools/open-slide` guide and managed vendor skills were not rewritten.
- Native editor text editing, movement and persistence were exercised on isolated copies of both Jady decks, including one text element on each page and an image on each deck. This does not establish editability of every element or a general native QA and controlled release route. Report uncovered gaps for affected delivery or release; do not infer approval from registration.

Verification: searched project-local AGENTS files, skills, steering, documentation, requirements and template guidance; inspected available HTML sync and contract code and updated the two restored documents. The legacy-only sync guard was checked against existing entries and a new-deck rejection case. Native editor evidence is in the workspace `.tmp-jady-inspector/EVIDENCE.md`.
