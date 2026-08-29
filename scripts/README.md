# Project scripts

## Active context and authority paths

All generic workflow scripts resolve the active offering, textbook and lesson from `project.config.json`. The stable cross-textbook identity is `lesson_key` in `course/lesson-registry.json`, formatted as `<textbook_id>:<lesson_id>`; a bare `lesson-01` is never enough to select a source or output directory. Status is read from the selected key's manifests rather than from this README.

《中级冲刺篇 I》第一课的既有 authority 是：

`lessons/boya-intermediate-i/lesson-01/20-approved/lesson-manifest.json`

The original director-review input snapshot is preserved read-only at:

`archive/legacy-materials-2026-08-27/boya-intermediate/lesson-01/share/第一课-教学资料`

The archived director-review snapshot is evidence only. Book-specific legacy generators may reference `lessons/boya-intermediate-i/lesson-01/10-design/`, but they are blocked while that lesson is not the active context and must never read from `archive/` or overwrite `20-approved/`.

## Submission filenames

New teacher-facing files use `lesson-<nn>-<用途>.<extension>` with a two-digit lesson number, hyphens, and a lowercase extension. The two classroom decks are always:

- `lesson-01-在线预习.pptx`
- `lesson-01-实体课.pptx`

Teacher guides, prep cards, activity materials, previews, audio, CSV exports, and ZIP packages use the same `lesson-01-<用途>` prefix. Existing approved or archived files keep their original names because their paths and hashes are part of the recorded evidence; new releases must use the canonical names.

Build the read-only dashboard cache with:

```bash
python3 scripts/build_dashboard.py
```

The generated `dashboard/manifest.js` aggregates the active textbook's lesson summaries from its source inventory and any available `lessons/<textbook_id>/lesson-XX/20-approved/lesson-manifest.json` files. Each summary is keyed by `lesson_key`; the dashboard only expands the selected lesson and does not copy every lesson's evidence into the course overview.

Validate the identity boundary before rebuilding the dashboard:

```bash
python3 scripts/validate_lesson_identity.py
```

Build a release only from authority files with:

```bash
BOYA_RELEASE_ID=YYYY-MM-DD-description python3 scripts/build_release_package.py
```

The release builder writes the active context's configured `40-release/` and does not
regenerate teaching materials. The release id is required, path-safe, and must
not already exist. Optional authority `release_materials` entries are copied
to their declared release paths (for example, an approved worksheet, video, or
Blooket import); the builder still refuses to publish until audio playback and
the lesson's approved contact-hour rehearsal are recorded. No generic
300-minute assumption is permitted.

Before a generator writes a draft, it runs the lesson-specific fail-fast gate:

```bash
python3 scripts/production_gate.py --purpose pptx --stage draft \\
  --lesson-key boya-quasi-intermediate-i:lesson-02 \\
  --output-dir lessons/boya-quasi-intermediate-i/lesson-02/10-design/pptx-draft/online
```

The draft gate rejects `archive/`, legacy `output/` and `share/` inputs, output paths
outside the lesson's `10-design/pptx-draft/`, missing lesson identity/source package,
missing boundary confirmation, and mismatched source hashes. It does not grant
authority and does not replace the full authority/release gate, which checks
approved design inputs, audio playback and the lesson's approved contact-hour
rehearsal. The generator stops before creating files when a gate fails.

`scripts/build_l23_pptx_drafts.js` is currently scoped only to
`boya-quasi-intermediate-i:lesson-02` and `:lesson-03`; it rejects other lesson
keys and requires an explicit `--lesson-key`, so its L2/L3 content tables cannot
silently leak into later lessons. Any
older draft found under a later lesson must be treated as legacy evidence until
that lesson has its own source package, boundary confirmation, and generator
scope.

The textbook-page marker tools require a slide-level storyboard. A candidate-page
inventory such as `lesson-02-source-refs.csv` records source blocks rather than
slide numbers and must not be passed as `--storyboard` until a current
slide-to-source mapping has been created.

Record a real approval only after the relevant human review, with an existing
evidence file and an explicit confirmation flag:

```bash
python3 scripts/record_lesson_gate.py --lesson-key boya-intermediate-i:lesson-01 --gate storyboard --approved-by Adam --approved-at YYYY-MM-DD --evidence lessons/boya-intermediate-i/lesson-01/10-design/storyboard/lesson-01-ppt-outline-v5.md --confirm
python3 scripts/record_lesson_gate.py --lesson-key boya-intermediate-i:lesson-01 --gate visual-alignment --approved-by Adam --approved-at YYYY-MM-DD --evidence lessons/boya-intermediate-i/lesson-01/20-approved/pptx/第一课-中国人的姓名.pptx --confirm
python3 scripts/record_lesson_gate.py --lesson-key boya-intermediate-i:lesson-01 --gate audio-playback --approved-by Adam --approved-at YYYY-MM-DD --evidence lessons/boya-intermediate-i/lesson-01/30-qa/current/pptx-v15/qa-report.md --confirm
python3 scripts/record_lesson_gate.py --lesson-key boya-intermediate-i:lesson-01 --gate rehearsal --approved-by Adam --approved-at YYYY-MM-DD --evidence lessons/boya-intermediate-i/lesson-01/30-qa/current/rehearsal-v1/rehearsal-notes.md --confirm
```

## 《中级冲刺篇 I》现有生成器状态

以下脚本是《中级冲刺篇 I》第一课的书本专属工具。该教材保留给三年级使用，但这些脚本不是当前《准中级加速篇 I》的生成入口：

本节列出的 `build_lesson_01_*` 中凡是引用〈中国人的姓名〉、E01 或
`boya-intermediate-i` 来源的脚本，均是历史工具；它们会检查 active
`lesson_key` 与 `lesson_root`，在当前准中级上下文中直接停止，避免把中级第一课
内容写入准中级课次。

The preserved authority is the Adam-approved v11-final package. Its static QA is
recorded, but classroom delivery remains pending manual PowerPoint playback,
projection review, and teacher rehearsal. The previous immutable release is
retained as historical evidence and is not the current v11 delivery.

- `build_lesson_01_teacher_guide.js` — historical `boya-intermediate-i:lesson-01` builder only; its 50-minute storyboard schedule and exercise counts are not a template for the current quasi-intermediate offering.
- `build_lesson_01_pptx.js` — historical entry point for `boya-intermediate-i:lesson-01`; it refuses to run when the active context is the current quasi-intermediate offering.
- `build_lesson_01_pptx_native.js` — historical native PPTX implementation for that same lesson; it is not a current-offering generator and cannot be used without the matching `lesson_key` context.
- `build_lesson_01_prototype.js` — canonical entry point for the approved six-slide educational textbook-style prototype.
- `legacy/build_lesson_01_source_review.js`
- `legacy/build_lesson_01_teaching_design.js`

Do not use them as the future classroom deck pipeline. The `scripts/legacy/` directory is read-only historical evidence; any fixed lesson counts, fixed hours, or HTML output there do not apply to current lesson requirements and must not be used as generator inputs or release criteria. Do not add HTML animation or an HTML presenter to the course workflow unless Adam explicitly changes the project requirement.

## Future production rule

New lesson authority production should follow:

`source gate → PBI redesign → teacher guide content master → teacher guide approval → prep/activity materials → internal PPT storyboard → visual storyboard → 6-slide prototype → native editable PPTX → audio/content/visual/layout QA`

The teacher guide is the content source of truth. Run the textbook-scoped
teacher-guide builder after the canonical source or approved coverage changes.
It must be explicitly approved before it can enter `20-approved/`. For later
lessons, a reversible `10-design/pptx-draft` may start after the source package
and recorded online/face-to-face boundary pass the lesson-specific draft gate.
That draft is design evidence only and cannot bypass the teacher-guide, support,
visual, prototype, QA, rehearsal, or release gates.

Only when `boya-intermediate-i:lesson-01` is the active context may the preserved
`build_lesson_01_pptx.js` entry run, and only after its teacher guide, support
materials, storyboard, visual storyboard and prototype are approved. It never
overwrites the approved PowerPoint. Current `boya-quasi-intermediate-i` lessons
must use a lesson-key-scoped generator and output only to their own draft root.

Activity cards are currently delivered as editable DOCX files only. Internal
`10-design` preview PDFs may be rendered for QA, but are not release materials. The former
`legacy/render_lesson_01_activity_pdfs.py` renderer is retained for historical
reference and is not part of the current production workflow; do not run it for
current lesson materials.

All text-bearing output, including drafts, previews, QA artifacts, legacy
mirrors, authority files, and releases, uses the cross-device font policy in
`project.config.json`: Chinese `KaiTi`; Vietnamese and other Latin-script text
use `Times New Roman`. Do not add a font file or require a local installation.
When an already-approved Office file needs a font-only normalization, use
`normalize_boya_fonts.py` to write a temporary copy, verify it, then explicitly
replace the approved authority and rebuild the immutable release. The
normalizer changes Office font declarations only.

For Vinh University, all student-facing PPTX, prep cards, activity cards, assessment cards, teacher guides, and teacher review documents use Simplified Chinese. Vietnamese is allowed only when a necessary explanation cannot be made clear in Simplified Chinese.

All human-facing outputs must read as finished professional teaching materials. Do not add AI self-descriptions, workflow explanations, tool references, or template openings such as “這不是……”. Keep source, QA, debug, and production notes in separate internal records.

Read the repository root `AGENTS.md`, `PROJECT_REQUIREMENTS.md` and `.agent/skills/boya-lesson-production/SKILL.md` before adding or changing a production script.
