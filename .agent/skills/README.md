
# Project-local portable skills

Canonical workflow contract: `docs/workflow/canonical-workflow-contract.md`
Optimization roadmap: `docs/workflow/WORKFLOW_V2_OPTIMIZATION_SPEC.md`

Use the canonical contract for lifecycle, gates, artifact states, identity, and safety. Use only the task-relevant skill below for domain/artifact rules; do not load the full PPTX production bundle for workflow, requirements, source-inventory, audio, or classroom-tool tasks.

Project-specific skills are the durable production rules for this repository. Read the matching skill before changing courseware files.

## Required skills

- `harness-engineering/SKILL.md` — minimum artifact, gate, execution and verification loop for non-trivial work.
- `boya-lesson-production/SKILL.md` — artifact-specific PPTX/content production procedures. Its ownership boundary is defined in `boya-lesson-production/references/ownership-map.md`; lifecycle, identity, gate and release semantics remain canonical elsewhere.

Read `AGENTS.md`, `PROJECT_REQUIREMENTS.md` and `memory/project-memory.md` before either skill. New decks default to `native-pptx`; Adam may select the Open Slide path in `tools/open-slide/` for a deck. Open Slide remains draft-only until its lesson QA/release path is defined.

The current student-deck rules are in `boya-lesson-production/SKILL.md`. They cover the approved educational textbook visual style, textbook section dividers, readable same-audio merging, plain student actions, visible material names, audio buttons, varied layouts and native PowerPoint QA. Retired v2/v3/v4 outline and deck scripts are not supported production inputs.

Reusable cross-project workflows should stay in:

`/Users/ssyan110/Development/_agent_shared/workflows/`

Do not create or maintain `.kiro/`; any old Kiro material is legacy context only. Keep project-local workflows in Markdown so Codex, Hermes, Claude and IDE agents can read the same rules.
