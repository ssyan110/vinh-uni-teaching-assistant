# Claude Code Instructions — AI Teaching Material System

## Project Overview

Reusable AI teaching-material production system for Chinese courseware used in Vietnamese universities. Pipeline: Source textbook PDFs → structured data → reviewable database → teacher slides → student materials.

---

## Non-Negotiable Rules

0. **Harness engineering default.** Do not rely on chat memory for recurring instructions. For every non-trivial task, define the artifact and success gate, read the local context harness, use project scripts/templates, verify with concrete checks, inspect outputs/screenshots/logs/data, and update durable project docs/skills/memory when Adam explicitly asks.
1. **Slide engine is Huashu Design (HTML-first).** Not Gamma. HTML is the primary presentation format used in class. No PPTX in the workflow. PDF is a backup export only.
2. **Classroom presentation:** Use the HTML presenter (index.html) directly — fullscreen 16:9, PowerPoint-style slide thumbnails, pen/highlighter, text boxes, undo, PDF download with annotations.
3. **Shared slide assets:** Every lesson's `slides/assets/` must contain `slide-base.css` and `slide-base.js`. Copy from lesson-01. Individual slides link to them — do NOT inline common CSS or `revealNext` JS. Lucide CDN: `unpkg.com/lucide@0.460.0` (locked version).
3. **Language rules:** Vietnamese for instructions/labels, Simplified Chinese for target content, pinyin for pronunciation. No Traditional Chinese or English labels unless Adam asks.
4. **Review gate:** Steps 1-8 can be automated. Steps 9-18 require teacher approval.
5. **No separate student version.** The teacher deck IS the classroom material. The old step 14 (生成學生版) has been removed and the workflow renumbered to 18 steps total. Current step 14 = 生成作業題庫.
5. **Page mapping:** Visible slide `.page-indicator` shows the printed textbook page from the database, such as `Trang 1` or `Trang 1-2`. It is not a slide number or PDF page. Generated classroom activity sections that do not appear directly in the textbook, especially `Luyện tập tổng hợp` and `Văn hóa bổ sung`, omit page indicators. Do not add separate source footers.
6. **No AI-isms:** Direct, specific, practical, concise. No "delve/leverage/robust/seamless."
8. **Cross-tool sync.** When updating `.kiro/`, also update AGENTS.md and this file.
9. **Slide filenames:** Sequentially numbered matching MANIFEST position (no gaps). Lesson 01: 01–56.
10. **你好 as standalone vocab slide:** Removed. Appears only in vocab summary quiz and dialogue.
11. **Vocab counter:** Format `XX/YY` badge. Lesson 01 total = 11.
12. **Pinyin word grouping:** Pinyin of a multi-syllable word must be written together (no space between syllables of one word). Correct: "dìèr kè · nǐ shì nǎguó rén?" Wrong: "dì èr kè · nǐ shì nǎ guó rén?" Each vocabulary word's pinyin is one unit. Sentence pinyin groups by word boundaries. Use Google Translate or another LLM to verify correct word-boundary pinyin.
13. **Chinese + pinyin alignment:** When a slide shows Chinese and pinyin together, put each pinyin chunk directly above the matching Chinese character or word group. Keep punctuation attached to the Chinese line, with no pinyin above punctuation.
14. **Cover template:** Use Lesson 10 `output/book-1/lesson-10/slides/01-cover.html` as the canonical cover template for all future lessons. Reuse layout/style directly; only replace lesson number, Chinese/pinyin title, Vietnamese title, and topic image. Do not include the old three keyword/topic pills on cover slides. Keep the lesson badge (`BÀI N · 第N课`) at the larger cover size, about 16pt / 30% larger than the old 12pt badge.
15. **Reusable templates:** Use Lesson 01 templates for dividers, objectives, homework divider, exercise-list structure, dialogue avatar layout, and hanzi-writing layout. Use the same Lesson 01 dividers by default; only change page numbers/counts and images Adam explicitly asks to customize.
16. **Activity design:** Practice activities should be varied and can include listening, speaking, reading, and writing when the lesson supports it. Comprehensive practice and grammar practice should reference HSK and TOCFL item formats, favor practical daily-use situations, and still output Simplified Chinese unless Adam explicitly asks otherwise.
17. **Interactive practice:** Prefer simple interactive slide/webapp formats when useful, such as one multiple-choice question per slide with clickable options, success feedback for correct answers, and a try-again prompt for wrong answers.
18. **Hanzi writing:** Reuse Lesson 01 hanzi-writing title, layout, method, and HanziWriter stroke animation. Do not use static characters instead of stroke animation. Use `strokeAnimationSpeed: 0.575` and `delayBetweenStrokes: 360` unless Adam changes the Lesson 01 template.
19. **Database rule propagation:** VP steps 1-8 must output lesson structure/activity/database metadata that follows cover, divider, activity-design, Simplified Chinese, pinyin, image, density, and hanzi-writing rules. Do not defer these rules to manual slide cleanup.
20. **Image asset workflow:** Images are lesson data, not post-generation cleanup. VP databases carry `image_role`, `image_prompt`, `image_file`, `image_reuse_from`, `image_status`, and `image_semantic_check`. Complete lessons must have `slides/assets/asset-manifest.json` and `exports/qa/asset-qa-report.json`.
21. **Pinyin course (6 lessons):** Source is AI Mandarin independent material (`Pinyin lessons/`). Do NOT use 漢語教程 phonetics. Read `docs/pinyin-lesson-database-spec.md` for full spec. Pipeline config: `scripts/pipeline/configs/pinyin.json` v2.0.0. Output to `output/pinyin/pinyin-{01-06}/`.
22. **Pinyin Lesson 1 template baseline:** Future pinyin decks reuse `output/pinyin/pinyin-01` as the template. Do not build pinyin lessons from scratch. Keep the same cover, objectives, dividers, concept slides, tone slides, vocabulary grids, flashcards, practice slides, input setup, closing, soft textbook/course image style, and presenter behavior; swap only lesson-specific text, sounds, rules, vocabulary, exercises, and images.
23. **Pinyin classroom sequence and wording:** Pinyin decks use clear dividers for concepts/review, initials, finals, sounds/chart, tones, vocabulary, review/practice, appendix/input setup when applicable, and closing. Do not create `Mục lục` or `Quy ước` classroom slides. Use `thanh điệu`, never `thanh điều`.
24. **Pinyin objectives and page labels:** Pinyin objective slides highlight taught initials/finals/rule anchors in bold red and adapt the goal text by lesson. Pinyin classroom slides do not show bottom-right `Trang ...` page indicators.
25. **Pinyin vocabulary grids:** `Từ vựng 1`, `Từ vựng 2`, etc. keep only the top bar label plus the vocabulary grid. Do not add extra body descriptions like `Tập trung đọc...`.
26. **Slide style selection (required gate):** Before generating any lesson slide deck, ask Adam which visual style to use: `original`, `coral-studio`, or `slate-citrus`. **Default is Slate Citrus** when Adam doesn't specify. Styles are visual-only CSS skins over the locked layouts — reference skins live at `output/pinyin/pinyin-01/design-prototypes/<style>-full-deck/prototype.css` (`original` = no extra skin). To apply: copy the skin to the lesson's `slides/assets/style-<name>.css` and link it as the LAST stylesheet in every slide (after `slide-base.css` and the inline style block). Never change layout geometry, content, ordering, or presenter behavior when applying a style. The 3-style comparison picker is `output/pinyin/pinyin-01/design-options/index.html`.

---

## Critical Files to Read Before Any Task

| File | When to Read |
|------|-------------|
| `.kiro/skills/harness-engineering/SKILL.md` | Default project workflow for context, verification, and durable feedback |
| `docs/ai-teaching-material-system-requirements-context.md` | Full project spec |
| `.kiro/steering/ai-teaching-material-system.md` | Project rules (auto-loaded by Kiro) |
| `.kiro/skills/ai-teaching-material-systems/SKILL.md` | Pipeline workflow, VP steps 1-18 |
| `docs/image-asset-workflow.md` | Image metadata, asset manifest, image replacement, and asset QA |
| `docs/pinyin-lesson-database-spec.md` | Pinyin course database architecture (6 lessons, independent from 漢語教程) |

---

## Task Routing Table

| When asked to... | Read these skills |
|------------------|-------------------|
| Any non-trivial project task or repeated preference | `.kiro/skills/harness-engineering/SKILL.md` |
| Pipeline workflow, VP steps, lesson processing | `.kiro/skills/ai-teaching-material-systems/SKILL.md` |
| Pinyin lesson database or slide generation | `docs/pinyin-lesson-database-spec.md` |
| Slide design, deck generation, HTML presenter, visual QA | `.kiro/skills/huashu-design/SKILL.md` |
| Google Drive/Sheets automation | `.kiro/skills/google-workspace/SKILL.md` |
| Clean user-facing docs/lesson copy | `.kiro/skills/avoid-ai-writing/SKILL.md` |

Note: PPTX is removed from the workflow. The `powerpoint` skill is deprecated.

---

## Skills Registry

| Skill | Path | Description |
|-------|------|-------------|
| harness-engineering | `.kiro/skills/harness-engineering/SKILL.md` | Default project harness: context, success gates, validation, observation, durable feedback |
| ai-teaching-material-systems | `.kiro/skills/ai-teaching-material-systems/SKILL.md` | Pipeline workflow, VP steps 1-18, language rules, QA |
| huashu-design | `.kiro/skills/huashu-design/SKILL.md` | HTML-first slide/deck generation, visual QA, PDF export |
| google-workspace | `.kiro/skills/google-workspace/SKILL.md` | Google Drive/Sheets automation |
| avoid-ai-writing | `.kiro/skills/avoid-ai-writing/SKILL.md` | Clean user-facing docs and lesson copy of AI tells |

---

## Key Reference Files

- `.kiro/skills/ai-teaching-material-systems/references/full-lesson-pdf-to-pptx-vietnamese-university.md`
- `.kiro/skills/ai-teaching-material-systems/references/pinyin-reference-style-prototype.md`
- `.kiro/skills/ai-teaching-material-systems/references/vp-pinyin-lesson-database-and-redesign.md`
- `.kiro/skills/google-workspace/references/gmail-search-syntax.md`
- `.kiro/skills/huashu-design/references/workflow.md`
- `.kiro/skills/huashu-design/references/content-guidelines.md`

---

## Presentation Workflow (Step 12-13)

Every lesson gets an `index.html` presenter in its `slides/` folder. This is the primary classroom tool — used directly in the browser, no installation needed.

### index.html is required for every lesson and must include

- MANIFEST array of all slide filenames in order
- Fullscreen mode (`F` key / `▶ Present` button)
- Navigation (arrow keys + buttons, slide counter)
- Left slide thumbnail sidebar with live previews and click-to-jump navigation
- In presentation mode, the thumbnail sidebar auto-minimizes and appears when the cursor moves to the left edge
- Annotation tools: pen, highlighter (4 colors), pixel/object eraser, text boxes, undo, clear
- On-demand PDF export (`📥 PDF`) — renders slides live via `html2canvas` + jsPDF; always current; no pre-baked data file needed
- Annotation overlay in PDF — pen drawings and text boxes are composited into the exported PDF

### CDN dependencies (use these exact versions in every index.html)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

**Do NOT use `slides-data.js`.** The old pre-baked screenshot approach is deprecated. On-demand rendering handles PDF export.

### Creating index.html for a new lesson

Do not hand-edit copied presenter fields. After numbered slide HTML files exist, run:

```bash
npm run lesson:presenter -- output/book-1/lesson-XX
npm run lesson:shells
```

This syncs from `output/book-1/lesson-01/slides/index.html` and updates the title, `MANIFEST`, slide count, thumbnail total, first slide, and PDF filename. Run `npm run lesson:shells` after database generation too, so database-only draft lessons show a safe status page instead of redirecting to a missing presenter.

### Convenience shortcuts for Lesson 01

```bash
npm run lesson1:pdf        # export PDF via Playwright (server-side, high quality)
npm run lesson1:watch      # watch slides for changes
```

### Generic commands (any lesson)

```bash
npm run slides:pdf output/book-1/lesson-02/slides
npm run slides:watch output/book-1/lesson-02/slides
```

## Image Asset Workflow

Read `docs/image-asset-workflow.md` before generating, replacing, or QA-ing slide images.

Required commands for complete lessons:

```bash
npm run assets:manifest -- output/book-1/lesson-XX
npm run assets:qa -- output/book-1/lesson-XX
```

Replace one vocabulary image without hand-editing slide HTML:

```bash
npm run assets:replace -- --lesson output/book-1/lesson-XX --record V001 --image /path/to/new.png
```

## Pipeline Workflow (Steps 1-8)

```bash
python scripts/run_pipeline.py \
  --lesson-type regular \
  --lesson-id lesson-02 \
  --lesson-title "第二课 · 你是哪国人？" \
  --source-pdf work/pdf-pages/ \
  --output-dir output/book-1/lesson-02/database/ \
  --content-file work/lesson-02/extract.json
```

Lesson types: `regular`, `pinyin`, `auto` (auto-detect from content).
Add new lesson types by dropping a JSON config in `scripts/pipeline/configs/`.

## Output directory convention

```
output/
├── book-{N}/
│   ├── lesson_list.csv      master index of all regular lessons
│   ├── lesson-{NN}/
│   │   ├── slides/          index.html + NN-name.html files
│   │   ├── database/        02_content_items.csv ... vp_database.json
│   │   └── exports/         screenshots/, PDF
└── pinyin/
    ├── pinyin_lesson_list.csv   index of pinyin-01 through pinyin-06
    └── pinyin-{NN}/
        ├── slides/          index.html + NN-name.html files
        ├── database/        02_content_items.csv ... vp_pinyin_NN_database.json
        └── exports/
```
