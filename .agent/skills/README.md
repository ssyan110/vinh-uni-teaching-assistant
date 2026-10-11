
# Project-local portable skills

Canonical workflow contract: `docs/workflow/canonical-workflow-contract.md`
Optimization roadmap: `docs/workflow/WORKFLOW_V2_OPTIMIZATION_SPEC.md`

Use the canonical contract for lifecycle, gates, artifact states, identity, and safety. Use only the task-relevant skill below for domain/artifact rules; do not load the full PPTX production bundle for workflow, requirements, source-inventory, audio, or classroom-tool tasks.

Project-specific skills are the durable production rules for this repository. Read the matching skill before changing courseware files.

## Required skills

Online classes remain unchanged and continue to prioritize PPT/PPTX, preserving one-word-per-page preparation and approved styles. Only physical classes prioritize HTML slides/OpenSlide, with optional editable PPTX backup (2026-10-07 06:52 UTC).

- `harness-engineering/SKILL.md` — minimum artifact, gate, execution and verification loop for non-trivial work.
- `boya-lesson-production/SKILL.md` — artifact-specific PPTX/content production procedures. Its ownership boundary is defined in `boya-lesson-production/references/ownership-map.md`; lifecycle, identity, gate and release semantics remain canonical elsewhere.
- `boya-weekly-assessment/SKILL.md` — schedule-aligned Year 1 weekly listening/speaking assessment packs, including paired-lesson scope, item and audio QA, and unpublished Form review.

Read `AGENTS.md`, `PROJECT_REQUIREMENTS.md` and `memory/project-memory.md` before either skill. Future face-to-face decks default to HTML/OpenSlide under `docs/classroom-html-standard-2026-10-07.md`; online preparation retains native-pptx unless otherwise selected. Open Slide remains draft-only until its lesson QA/release path is defined.

The current student-deck rules are in `boya-lesson-production/SKILL.md`. They cover the approved educational textbook visual style, textbook section dividers, readable same-audio merging, plain student actions, visible material names, plain non-clickable top-right `Audio n-n` references, varied layouts and native PowerPoint QA. Future PPTs preserve the actual source track mapping without embedded audio, playback buttons or playable audio hyperlinks; the audio reference has no purple styling. Retired v2/v3/v4 outline and deck scripts are not supported production inputs.

Reusable cross-project workflows should stay in:

`/Users/ssyan110/Development/_agent_shared/workflows/`

Do not create or maintain `.kiro/`; any old Kiro material is legacy context only. Keep project-local workflows in Markdown so Codex, Hermes, Claude and IDE agents can read the same rules.
