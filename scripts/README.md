# Project scripts

## Authority and output paths

The only approved Lesson 1 source is:

`lessons/lesson-01/20-approved/lesson-manifest.json`

The final confirmed input used to create it was preserved read-only at:

`output/boya-intermediate/lesson-01/share/第一课-教学资料`

The old `output/` tree is legacy evidence. New generators write drafts under
`lessons/lesson-01/10-design/` and must never overwrite `20-approved/`.

Build the read-only dashboard cache with:

```bash
python3 scripts/build_dashboard.py
```

Build a release only from authority files with:

```bash
python3 scripts/build_release_package.py
```

The release builder writes `lessons/lesson-01/40-release/` and does not
regenerate teaching materials.

Before any production generator writes a draft, it runs the fail-fast gate:

```bash
python3 scripts/production_gate.py --purpose audit
```

The gate rejects legacy `output/` and `share/` inputs, output paths outside
`10-design/`, missing source/PBI approvals, unapproved PPT storyboard or
visual alignment, and release attempts without a passed teacher playback and
300-minute rehearsal. The generator stops before creating files when a gate
fails.

Record a real approval only after the relevant human review, with an existing
evidence file and an explicit confirmation flag:

```bash
python3 scripts/record_lesson_gate.py --gate storyboard --approved-by Adam --approved-at YYYY-MM-DD --evidence lessons/lesson-01/10-design/storyboard/lesson-01-ppt-outline-v5.md --confirm
python3 scripts/record_lesson_gate.py --gate visual-alignment --approved-by Adam --approved-at YYYY-MM-DD --evidence lessons/lesson-01/20-approved/pptx/第一课-中国人的姓名.pptx --confirm
python3 scripts/record_lesson_gate.py --gate rehearsal --approved-by Adam --approved-at YYYY-MM-DD --evidence lessons/lesson-01/30-qa/current/rehearsal-v1/rehearsal-notes.md --confirm
```

## Current status

The current lesson-production path is native PPTX plus editable support materials. The first lesson's final confirmed teaching package is preserved in the new authority tree; source-review and teaching-design scripts remain review utilities for already completed evidence:

- `build_lesson_01_teacher_guide.js` — builds the teacher-guide content master from the canonical source, approved PBI activity coverage, and the internal 50-minute storyboard schedule.
- `build_lesson_01_pptx.js` — canonical entry point for the current native PPTX build.
- `build_lesson_01_pptx_native.js` — current native PPTX implementation; writes the current outline, storyboard, exercise coverage, audio manifest and PPTX.
- `build_lesson_01_prototype.js` — canonical entry point for the approved six-slide educational textbook-style prototype.
- `build_lesson_01_source_review.js`
- `build_lesson_01_teaching_design.js`

Do not use them as the future classroom deck pipeline. Do not add HTML animation or an HTML presenter to the course workflow unless Adam explicitly changes the project requirement.

## Future production rule

New lesson production should follow:

`source gate → PBI redesign → teacher guide content master → teacher guide approval → prep/activity materials → internal PPT storyboard → visual storyboard → 6-slide prototype → native editable PPTX → audio/content/visual/layout QA`

The teacher guide is the content source of truth. Run `node scripts/build_lesson_01_teacher_guide.js` after the canonical source or approved coverage changes. It writes a draft under `lessons/lesson-01/10-design/teacher-manual-draft/`; it must be explicitly approved before it can enter `20-approved/`. The guide must be completed and approved before the PPT storyboard, visual prototype, or full PPTX can be treated as production artifacts. A prototype made earlier is only a visual discussion draft.

For a future lesson, run `node scripts/build_lesson_01_pptx.js` only after the teacher guide, support materials, storyboard, visual storyboard and prototype are approved. It writes `lessons/lesson-01/10-design/pptx-draft/lesson-01-draft.pptx`; it never overwrites the approved PowerPoint. After manual PowerPoint review, approval is an explicit copy-and-manifest update step. A changed authority PPTX must pass the manifest hash check before a release can be built.

Activity cards are currently delivered as editable DOCX files only. The former `render_lesson_01_activity_pdfs.py` renderer is legacy and is not part of the current production workflow; do not run it for current lesson materials.

For Vinh University, all student-facing PPTX, prep cards, activity cards, assessment cards, teacher guides, and teacher review documents use Simplified Chinese. Vietnamese is allowed only when a necessary explanation cannot be made clear in Simplified Chinese.

All human-facing outputs must read as finished professional teaching materials. Do not add AI self-descriptions, workflow explanations, tool references, or template openings such as “這不是……”. Keep source, QA, debug, and production notes in separate internal records.

Read the repository root `AGENTS.md`, `PROJECT_REQUIREMENTS.md` and `.agent/skills/boya-lesson-production/SKILL.md` before adding or changing a production script.
