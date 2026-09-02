
# Agent Workflow Index

This is the portable entry point for AI agents working in this project. The current course decisions are project requirements, not chat-only reminders.

## Required reading order

1. `AGENTS.md`
2. `PROJECT_REQUIREMENTS.md`
3. `memory/project-memory.md`
4. `.agent/agent-operating-contract.md`
5. `.agent/skills/harness-engineering/SKILL.md`
6. `.agent/skills/boya-lesson-production/SKILL.md`
7. Canonical lesson source and the relevant PDF/audio index
8. Shared reusable workflows: `/Users/ssyan110/Development/_agent_shared/WORKFLOW_INDEX.md`

If a current user decision changes the course workflow, update the project files and the ad-hoc memory note in the same task; do not leave the decision only in conversation.

The adopted online/face-to-face baseline is content routing, not a time quota:
online preparation covers textbook reading, audio preview, vocabulary and key-point
recording, and preparation of personal information/questions; face-to-face work
covers listening comprehension, peer interaction, information-gap work, oral
practice, presentation, feedback and retry. Each `lesson_key` must keep a dated
boundary confirmation record under its own `10-design/storyboard/`; the record
does not approve the source, teacher guide, PPTX, playback, rehearsal or release.

## Default harness

Use harness engineering for every non-trivial task: identify the artifact, success gate, local context, execution path, verification method, observed outputs, and durable feedback target. Keep the harness lightweight, but do not skip it for slide, data, PDF, Google Sheets, lesson pipeline, image, or automation work.

For multi-step or artifact-producing work, use `scripts/agent_loop.py` to create a
local run packet, execute the existing production gate as a read-only preflight,
record one bounded attempt, and finish with evidence. Run state is execution
evidence only; lesson authority remains in the lesson registry and manifests.

## Shared workflow hub

Reusable cross-project workflows live at:

`/Users/ssyan110/Development/_agent_shared/`

Use those workflows only after applying this project's local rules and constraints.
Any `.kiro/` material in the shared hub is legacy context only; do not read it as
an active project requirement or maintain it.

## Course-specific routing

For Boya lesson work, use the `boya-lesson-production` skill. The required route is:

For authority/release work, use:

`source gate → PBI redesign gate → teacher guide content master → teacher guide approval → support materials → PPT storyboard → visual storyboard → 6-slide prototype → native PPTX → QA → delivery`

For later-lesson drafts, a source-package and boundary-confirmed lesson may use
the lesson-specific draft gate to write only to its own
`lessons/<textbook_id>/<lesson_id>/10-design/pptx-draft/<mode>/`.

When Adam confirms a lesson boundary, first write or update the lesson-scoped
`<lesson_id>-boundary-confirmation-YYYY-MM-DD.md` record and link it from the
lesson content contract. This step does not require reading or modifying PPTX;
the existing gate and later production steps remain separate.

Authority and release remain lesson-by-lesson within each `textbook_id`. Drafts
may run in parallel when each lesson has an explicit `lesson_key`, source package
and recorded online/face-to-face boundary; a draft never unlocks authority or
release for the next lesson.

PPTX is the only classroom deck format. Historical HTML review pages are kept under `archive/` and must not become the future production path. Teacher guides, prep cards, supplemental activity materials and assessments remain part of the complete lesson package.

The approved teacher guide comes before full PPTX/authority production: it defines
the full lesson content, key points, timing, audio, exercise coverage, teacher
actions, repair routes, answer policy, assessment and required materials. A
lesson-specific draft may precede guide approval only as reversible design
evidence and must still trace back to the source package.

## Current PPTX rule set

The current student-deck decisions are recorded in `.agent/skills/boya-lesson-production/SKILL.md`, `AGENTS.md` and `PROJECT_REQUIREMENTS.md`. In short:

- Use the approved educational textbook illustration system and the approved ChatGPT/Chrome contact sheet.
- Use a pure-white `#FFFFFF` slide canvas; reserve warm-white tones for local cards, image frames, or illustration content only.
- Use the finalized role-specific typography matrix: 20 pt for header/page/material/audio/keyword labels; 21 pt compact body; 22 pt ordinary body; 24 pt pinyin; 27 pt long titles; 28–34 pt task prompts with 34 pt as the default; 34 pt standard titles; 48 pt dividers; 44–50 pt lesson-specific cover titles; goals title 36 pt, teal label 23 pt, number 20 pt, goal item 24 pt; vocabulary headword 42 pt (34 pt for long headwords), part of speech about 20–22 pt, Vietnamese meaning about 20–22 pt, usage 20 pt, vocabulary examples 22 pt, and online expression examples 35 pt. Never let visible slide text fall below 20 pt; shorten, reflow, or split instead of shrinking below the floor.
- The finalized cover has no bottom subtitle. The third slide uses the lesson-specific learning-goals frame: title, teal label, then 3–4 numbered goals from the lesson content contract. Number markers are filled teal/coral/purple/yellow circles with white numerals, not outlined squares. Do not copy a protagonist, goal, subtitle, or fallback from another lesson.
- Online vocabulary pages always keep the word, pinyin, part of speech, Vietnamese meaning and image. For new lesson drafts, every vocabulary item (including proper nouns) must have exactly two short examples in `course/boya-example-bank.json`; usage, usage detail, expansion, grammar detail and common phrase remain word-specific optional fields and are omitted when blank. Never use English or canonical gloss as the meaning, and never synthesize a filler example.
- Online expression-practice pages keep only the purple rounded pattern box, two short examples at 35 pt, the student instruction and writing lines; omit the black expression title and visible context line. Context remains in the teacher-manual/design layer.
- Use textbook section names as dividers and keep divider pages simple.
- Merge continuous questions from the same audio when the page stays readable; keep different task types separate.
- Use plain student action language, visible material names, clear audio buttons and varied layouts.
- Keep teacher notes, internal IDs, time/group footers and QA information out of the student canvas.
- Run native PowerPoint PDF, contact-sheet, text, audio, notes and canvas-boundary checks before delivery.

For the historical `boya-intermediate-i:lesson-01` only, the canonical build
command is `node scripts/build_lesson_01_pptx.js`; it delegates to
`scripts/build_lesson_01_pptx_native.js`. Its prototype and outline paths are
textbook-scoped under `lessons/boya-intermediate-i/lesson-01/`. Do not use these
entries for the active quasi-intermediate lessons, and do not use retired
versioned outlines, the old 69-row storyboard generator, or the old visual
storyboard generator.

## Safety

Do not delete, move, overwrite, or broadly refactor project files unless Adam explicitly approves the scope.
Never access password notes or use credit card information. Do not create or maintain `.kiro/`; treat old Kiro files as legacy context only.
