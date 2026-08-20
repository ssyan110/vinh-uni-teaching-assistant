# Project scripts

## Current status

The current approved lesson-production path is native PPTX plus printable support materials. The first-lesson teacher-guide generator is now the next formal production step; the two older scripts remain historical/review utilities for the already completed first-lesson HTML source and teaching-design pages:

- `build_lesson_01_teacher_guide.js` — builds the teacher-guide content master from the canonical source, approved PBI activity coverage, and the internal 50-minute storyboard schedule.
- `build_lesson_01_source_review.js`
- `build_lesson_01_teaching_design.js`

Do not use them as the future classroom deck pipeline. Do not add HTML animation or an HTML presenter to the course workflow unless Adam explicitly changes the project requirement.

## Future production rule

New lesson production should follow:

`source gate → PBI redesign → teacher guide content master → teacher guide approval → prep/activity materials → internal PPT storyboard → visual storyboard → 6-slide prototype → native editable PPTX → audio/content/visual/layout QA`

The teacher guide is the content source of truth. Run `node scripts/build_lesson_01_teacher_guide.js` after the canonical source or approved coverage changes. It writes `output/boya-intermediate/lesson-01/teacher/lesson-01-teacher-guide.md` and `manifest.json`. The guide must be completed and approved before the PPT storyboard, visual prototype, or full PPTX can be treated as production artifacts. A prototype made earlier is only a visual discussion draft.

For Vinh University, all student-facing PPTX, prep cards, activity cards, assessment cards, teacher guides, and teacher review documents use Simplified Chinese. Vietnamese is allowed only when a necessary explanation cannot be made clear in Simplified Chinese.

All human-facing outputs must read as finished professional teaching materials. Do not add AI self-descriptions, workflow explanations, tool references, or template openings such as “這不是……”. Keep source, QA, debug, and production notes in separate internal records.

Read the repository root `AGENTS.md`, `PROJECT_REQUIREMENTS.md` and `.agent/skills/boya-lesson-production/SKILL.md` before adding or changing a production script.
