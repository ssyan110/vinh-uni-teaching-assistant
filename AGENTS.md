# Agent instructions

This file is the entry point for any AI agent working in this repo (Kiro, Hermes, Claude Code, Codex, Cursor, etc.). Read it first.

## Quick start

1. Read this file.
2. Classify the request size before loading more context:
   - **Small existing-output edit:** one slide title/wording/layout tweak, or 1-2 image replacements in an already generated lesson.
   - **Structural/generator work:** new lesson, regenerated lesson, slide-order change, shared template/script change, database/pipeline change, presenter change, or a rule Adam explicitly wants made durable.
3. For a small existing-output edit, read only the narrow files needed for the affected slide/asset plus `docs/image-asset-workflow.md` when replacing images. Patch the existing output directly and run the smallest useful check.
4. For structural/generator work, read `memory/project-memory.md` if present, `.kiro/skills/harness-engineering/SKILL.md`, `.kiro/steering/ai-teaching-material-system.md`, relevant `.kiro/skills/*/SKILL.md`, and the relevant project docs below.
5. Read `docs/ai-teaching-material-system-requirements-context.md` only for full project spec, pipeline architecture, or broad lesson/database generation work.
6. For lesson slide/template work, read `docs/lesson-slide-template-guide.md`.
7. For slide image, vocabulary image, cover image, divider image, or image replacement work, read `docs/image-asset-workflow.md`.
8. For pinyin lesson database or pinyin slide generation, read `docs/pinyin-lesson-database-spec.md`.
9. Kiro agents also get `.kiro/steering/ai-teaching-material-system.md` auto-loaded.

## Project summary

Build a reusable AI teaching-material production system for Chinese courseware used in Vietnamese universities. Source textbook PDFs → structured data → reviewable database → teacher slides → student materials.

## Skills (`.kiro/skills/`)

| Skill | Purpose |
|-------|---------|
| `harness-engineering/` | Default project operating frame: context, success gates, execution, validation, observation, durable feedback |
| `ai-teaching-material-systems/` | Pipeline workflow, VP steps 1-18, language rules, QA pitfalls |
| `huashu-design/` | HTML-first slide/deck generation, visual QA, PDF export |
| `google-workspace/` | Google Drive/Sheets automation |
| `chinese-homework-question-bank/` | 作業題庫 generation: pinyin, vocabulary, hanzi retrieval, grammar, dialogue comprehension, and small output |
| `avoid-ai-writing/` | Clean user-facing docs and lesson copy of AI tells |

Each skill has a `SKILL.md` with full instructions. Read it before doing work in that domain.

## Project rules

- **Harness engineering default:** Do not depend on chat memory for recurring instructions. Every non-trivial task must define the artifact and success gate, read the local context harness, use project scripts/templates, verify with concrete checks, inspect outputs/screenshots/logs/data, and update durable project docs/skills/memory when Adam explicitly asks.
- **Change-scope rule:** Match the workflow to the requested change size. For a one-off edit to an existing generated lesson, such as changing one slide title, fixing wording, replacing 1-2 images, or adjusting spacing on one slide, edit the existing slide/output directly and verify only the affected slide plus any cheap structural check. Do not regenerate the whole lesson, rerun the full pipeline, or update every repo doc unless the change is a reusable rule/template/generator change or Adam explicitly asks for durable propagation.
- **Small visual edit check:** For a localized slide edit, prefer `npm run slides:screenshot -- --slides-dir <lesson-root>/slides --slide <file.html>` over full-deck screenshot/contact-sheet generation.
- **Slide engine:** Huashu Design (HTML-first). Not Gamma. HTML is the primary presentation format used in class. No PPTX in the workflow. PDF is a backup export only.
- **PDF export gate:** During drafting, do not export clean PDF backups. Work in HTML and use screenshots/contact sheets for QA. Before exporting any PDF, ask Adam whether the slide design and content are finalized; export only after Adam confirms they are finalized.
- **Classroom presentation:** Open the lesson-root `index.html` in class. Complete lessons launch the HTML presenter at `slides/index.html` — fullscreen 16:9, PowerPoint-style slide thumbnails, pen/highlighter, text boxes, undo, PDF download with annotations. Database-only draft lessons show a safe status page instead of redirecting to a missing presenter.
- **Shared slide assets:** Every lesson's `slides/assets/` must contain `slide-base.css`, `slide-base.js`, and `brand/logo-watermark.png`. Copy the watermark from `design/shared-slide-assets/brand/logo-watermark.png` into each lesson's `slides/assets/brand/`. Individual slides link to shared assets — do NOT inline common CSS or `revealNext` JS.
- **Slide CDN:** Every slide must load `lucide@0.460.0` from unpkg. No other CDN versions.
- **Language:** Vietnamese for student-facing instructions, activity names, section titles, labels, homework assignments, explanations, and classroom flow. Simplified Chinese appears only as target learning content: vocabulary, sample sentences, dialogue lines, grammar examples, cultural terms, lesson titles, and hanzi-writing characters. Pinyin is for pronunciation. No Traditional Chinese or English labels unless Adam asks.
- **Review gate:** Steps 1-8 can be automated. Steps 9-18 require teacher approval.
- **No separate student version.** The teacher deck IS the classroom material. The old step 14 (生成學生版) has been removed and the workflow renumbered to 18 steps total. Current step 14 = 生成作業題庫.
- **Page indicator:** Visible slide `.page-indicator` must show the printed textbook page, not the slide number or PDF page. `source_page` / `source_page_range` in lesson databases must mean printed textbook page; if extraction needs PDF positions, store those separately as `source_pdf_page` / `source_pdf_page_range`. Format visible labels as `Trang 1` or `Trang 1-2`. If a slide has no textbook source, omit `.page-indicator`. Do not show page indicators on generated classroom activity sections that do not appear directly in the textbook, especially `Luyện tập tổng hợp` and `Văn hóa bổ sung`. Do not add separate `.source` footers. The presenter navigation counter in `index.html` may still show slide position.
- **Persistence:** Durable project decisions go in repo files, not chat history.
- **Slide filenames:** Must be sequentially numbered matching their actual MANIFEST position (no gaps). Current lesson 01: 01–56.
- **你好 as standalone vocab slide:** Removed. 你好 appears only in vocab summary quiz and dialogue slides.
- **Vocab counter:** Format `XX/YY` badge in top-right of vocab card. Lesson 01 total = 11 (not 12).
- **Vocab slide template:** Reuse Lesson 01 `05-vocab-ni.html` as the canonical single-word vocab slide. Layout is centered vertical stack: rectangular 16:9 image frame (`288×162`, 14px radius, teal border), pinyin, large Simplified Chinese character, Vietnamese meaning, hán việt + word type. Do NOT use circular image crops or left-side icon cards.
- **Cover slide template:** Use Lesson 10 `output/book-1/lesson-10/slides/01-cover.html` as the canonical cover template for all future lessons. Reuse its layout/style directly; only replace lesson number, title text, and topic image. Do not include the old three keyword/topic pills on cover slides. Keep the lesson badge (`BÀI N · 第N课`) at the larger cover size, about 16pt / 30% larger than the old 12pt badge.
- **Lesson 01 as regular-lesson template:** Future regular lessons must follow Lesson 01's section structure and visual language: cover, objectives, warmup, vocabulary divider, vocab cards + sample sentence cards, vocab practice divider, mini quiz, comprehensive practice, text divider, two-line dialogue slides, hanzi writing, supplement/culture, homework divider, exercises list, closing. A lesson may add only lesson-specific extra sections, such as a grammar section in Lesson 10.
- **Reuse Lesson 01 reusable pages exactly:** Do not redesign reusable slide types from scratch. Dividers, objectives layout, homework divider, exercise-list structure, dialogue avatar layout, and hanzi-writing layout must reuse Lesson 01's existing visual templates; only swap lesson-specific content, textbook page numbers, counts, and images when needed.
- **Reusable divider template:** Use the same Lesson 01 divider templates across all lessons by default. Only change lesson-specific page numbers/counts and, when Adam requests a specific lesson theme, replace the divider image for that lesson.
- **Center content when possible:** Adam prefers main slide content centered vertically and horizontally when the slide is not a list, comparison, dialogue, or fixed Lesson 01 template. Use centered layouts for culture notes, single concepts, example sentences, and practice prompts unless a left-center composition is clearly more readable.
- **No crowded slides:** Do not squeeze all practice content into one slide. Split dense activities into multiple slides. For matching vocabulary practice, use about 4-5 vocabulary items per slide rather than forcing every word onto one screen.
- **Activity design:** Practice activities should be varied and include listening, speaking, reading, and writing where the lesson content supports it. For comprehensive practice and grammar practice, design questions by referencing HSK and TOCFL item formats, with a preference for practical life-use situations. Even when borrowing TOCFL-style formats, this system outputs Simplified Chinese unless Adam explicitly asks otherwise.
- **Interactive practice:** Prefer simple interactive slide/webapp formats when useful. For example, one multiple-choice question per slide with clickable options; correct answers show success feedback, wrong answers prompt the student to try again.
- **Instruction language:** Student operation text and activity instructions must be natural Vietnamese, e.g. `Ghép nối`, `Bài tập về nhà`, `Tập viết chữ Hán`, `Tập từ vựng`, `Luyện tập tổng hợp`, `Hội thoại`. Lesson 01 reusable divider templates may keep their fixed Chinese section heading (`生词`, `词汇练习`, `综合练习`, `课文`, `写汉字`, `补充学习`, `回家作业`) as part of the template; do not redesign those dividers from scratch.
- **No text overflow:** For new/regenerated decks, verify every slide in HTML/screenshot QA. For a small existing-slide edit, verify only the affected slide(s) unless the edit changes shared CSS/templates. Visible text must not overflow the 16:9 slide, any background image panel, card, bubble, tile, button, or fixed container. Split content into more slides or reduce the content inside the container; do not hide overflow as a workaround.
- **Vocabulary divider image:** Reuse Lesson 01 page 04 style: soft textbook desk scene with an open book. The book has only `汉` on the left page and `语` on the right page, placed inside the page margins. This generic `汉语` image can be reused across lessons. Do not add random Chinese filler or extra generated text.
- **Sample sentence slide template:** Every `sample-*` / `MẪU CÂU` slide includes a small bottom-left circular support image frame (`.sample-spot`, `left:52px;bottom:28px;width:116px;height:116px`) centered on the pale background circle graphic. The image must visually match the full sample phrase. Reuse the matching vocab image when correct; generate a new soft textbook image when the sentence needs a specific scene.
- **Vocab image style:** 16:9 soft textbook line-art, thin grey-blue outlines, muted pastel fills, white/pale-grey background, subtle shadows. No text, letters, numbers, Chinese characters, labels, watermarks, decorative blobs, thick teal icon outlines, glossy vector/sticker/chibi style.
- **Vocab image QA:** After inserting images, render vocab slides and verify each image matches its word before export. If a mismatch appears, regenerate that image and re-render the affected slide. Lesson 01 uses `一` = one raised finger, `五` = five fingers, `八` = Chinese eight hand gesture (thumb + index extended, other fingers folded), and `马` = white horse.
- **Pinyin word grouping:** Pinyin of a multi-syllable word must be written together (no space between syllables of one word). Correct: "dìèr kè · nǐ shì nǎguó rén?" Wrong: "dì èr kè · nǐ shì nǎ guó rén?" Each vocabulary word's pinyin is one unit. Sentence pinyin groups by word boundaries. Use Google Translate or another LLM to verify correct word-boundary pinyin.
- **Chinese + pinyin visual alignment:** When a slide shows Chinese and pinyin together for vocabulary, sample sentences, dialogue lines, grammar examples, culture examples, or Chinese lesson titles, the pinyin must sit above the matching Chinese character/word group. Do not center a whole pinyin sentence separately above or below a Chinese sentence when punctuation would make the mapping unclear. Keep punctuation visually attached to the Chinese line, with no pinyin above punctuation.
- **Regular lesson structure excludes pinyin modules:** Pinyin is taught in separate pinyin lessons. For normal `regular` lessons, do not add `Pinyin` or `Luyện pinyin` modules to the classroom lesson structure, even if the textbook pages contain pronunciation/pinyin exercises. Those pages may remain as raw extracted textbook exercises for review, but they are not classroom teaching modules for regular lessons.
- **Pinyin course (6 lessons):** Read `docs/pinyin-lesson-database-spec.md` for the complete pinyin database and slide-template architecture. Source material is the AI Mandarin independent pinyin course (`Pinyin lessons/` folder, 6 PDFs). Do NOT use 漢語教程 phonetics content. Pipeline config: `scripts/pipeline/configs/pinyin.json` v2.0.0. Record types: `concept`, `initials`, `finals`, `tone`, `spelling_rule`, `vocabulary`, `exercise`, `challenge`, `pinyin_table`, `summary_table`, `daily_phrase`, `appendix`. Output path: `output/pinyin/pinyin-{01-06}/`.
- **Pinyin Lesson 1 as pinyin-template baseline:** Future pinyin lessons reuse `output/pinyin/pinyin-01` as the slide template. Do not build pinyin decks from scratch. Keep the same soft textbook/course visual language, cover/objectives/divider/concept/tone/vocab/closing image style, flashcard behavior, presenter setup, and section rhythm; change only lesson-specific text, taught sounds, vocabulary, exercises, and images when needed.
- **Pinyin cover subtitles:** All pinyin lesson covers keep the Lesson 1 cover layout. The badge uses `PINYIN N · 拼音第N课`; the main title stays `pīn/yīn` above `拼音`; the subtitle slot below `拼音` shows only the pinyin sounds/rules learned in that lesson as grouped rounded chips. Increase spacing between sound tokens inside each chip, and allow chips to wrap to a second line when one line is crowded. Examples: chips `b p m f` + `a o e i u ü`; chips `d t n l` + `g k h` + `j q x → ju qu xu`. Do not use that slot for Vietnamese lesson-description notes.
- **Pinyin closing slides:** All pinyin ending slides use the `下课` visual composition from `/Users/ssyan110/Downloads/Mandarin_Pinyin_Foundations.pptx`: pale mint classroom background, large rounded white card, and students leaving through an open classroom door. Recreate the visual in HTML; do not use the full PPTX image as a baked background with old text. Keep the current lesson's original three text lines: `下课`, `Bạn có câu hỏi gì không?`, and `Bài tiếp theo: Pinyin N` where `N` is the next pinyin lesson number. Use `下课`, not `下课了`, and do not add extra motivational or content-summary text.
- **Pinyin classroom sequence:** Future pinyin lessons must include clear section dividers for concepts/review, initials, finals, sounds/chart, tones, vocabulary, review/practice, appendix/input setup when applicable, and closing. Omit sections that truly do not apply, but do not remove the divider rhythm. `Mục lục` and `Quy ước` slides are no longer used in any future pinyin classroom slides.
- **Pinyin practice/exercise styles:** Future pinyin practice slides reuse the Pinyin Lesson 1 exercise templates by activity type through `scripts/pinyin-exercise-templates.mjs`. Reading drills use slide 15's large sound-board style. `连连看` / matching activities use slide 36's three-column matching board with a dashed center workspace; the Vietnamese meaning column must be randomized/deranged so meanings do not stay in the same row as their pinyin/hanzi prompts. Split dense matching into more slides instead of crowding. Multiple-choice/listening-choice activities use slide 37's blue answer table. Fill-in-blank/listening-completion activities use slide 38's sound-bank plus underlined blanks, with no volume/speaker icon in the top bar or instruction header. Keep visible instructions in natural Vietnamese.
- **Pinyin wording and goal slides:** Use Vietnamese term `thanh điệu` exactly. Do not use `thanh điều`. Pinyin goal slides use the Pinyin Lesson 1 objectives template: highlighted taught initials/finals are bold and red, while the surrounding goal lines change per lesson, e.g. `Học 5 thanh điệu tiếng Trung` and `Học đọc 16 từ vựng`.
- **Pinyin page indicators:** Pinyin classroom slides do not show bottom-right `Trang ...` page indicators. The presenter navigation counter may still show slide position in the browser chrome.
- **Pinyin vocabulary grid slides:** For `Từ vựng 1`, `Từ vựng 2`, etc., keep only the top bar section text plus the vocabulary grid. Do not add extra description lines such as `Tập trung đọc...`; instructions belong in teacher notes or separate practice slides.
- **Vocab sub-entry extraction:** If a textbook vocabulary item has indented component words underneath it, extract those component words as separate vocabulary records too. Example: `办公室` also includes `办公`; `电话` also includes `电` and `话`; `手机` also includes `手`. Keep the printed source page and note the parent word in `raw_source_text`.
- **Grammar explanation style:** Grammar records must absorb the textbook explanation but rewrite it in simple Vietnamese that a 12-13-year-old can understand. Avoid loading students with terms like chủ ngữ/vị ngữ/tân ngữ unless the term is needed; lead with plain patterns, examples, and meaning. Contrast Vietnamese habits when useful, such as `请问` vs. literal Vietnamese-style translations.
- **Hanzi writing:** Use Lesson 01 hanzi-writing title, layout, method, and HanziWriter stroke animation. Do not replace stroke animation with static characters. All hanzi-writing slides must use the Lesson 01 slowed stroke timing: `strokeAnimationSpeed: 0.575` and `delayBetweenStrokes: 360` unless Adam changes the Lesson 01 template.
- **Database generation must carry slide rules:** VP steps 1-8 must output lesson structure/activity/database metadata that follows the cover, divider, activity-design, Simplified Chinese, pinyin, image, density, and hanzi-writing rules. Do not leave these rules only for manual slide cleanup after the database is generated.
- **Image asset workflow:** Images are lesson data, not post-generation cleanup. VP steps 1-8 must include image metadata (`image_role`, `image_prompt`, `image_file`, `image_reuse_from`, `image_status`, `image_semantic_check`) for records that need classroom visuals. New lesson generation starts with blank, correctly sized placeholder image files; do not generate AI images while creating slides. Every complete lesson must have `slides/assets/asset-manifest.json` and `exports/qa/asset-qa-report.json`. Build and check them for new/regenerated lessons with `npm run assets:manifest -- output/book-1/lesson-{NN}` and `npm run assets:qa -- output/book-1/lesson-{NN}`. Replace vocabulary images with `npm run assets:replace -- --lesson output/book-1/lesson-{NN} --record V001 --image /path/to/new.png`, or crop selected pinyin vocab images from a ChatGPT contact sheet with `npm run assets:crop-contact-sheet -- --lesson output/pinyin/pinyin-{NN} --sheet /path/to/sheet.png --records V001,V002`. Do not regenerate the lesson for image-only swaps.

## Lesson 01 current slide structure (56 slides)

| Range | Files | Module |
|-------|-------|--------|
| 01 | 01-cover | Trang bìa |
| 02 | 02-objectives | Mục tiêu |
| 03 | 03-warmup | Khởi động |
| 04–25 | 04-divider-vocab → 25-sample-ma | Từ vựng (11 từ + mẫu câu) |
| 26 | 26-divider-practice-vocab | Divider: Tập từ vựng |
| 27–28 | 27-vocab-summary-a/b | Mini quiz từ vựng |
| 29 | 29-divider-comprehensive | Divider: Luyện tập tổng hợp |
| 30–36 | 30-practice-flashcard-ni → 36-practice-negation | Luyện từ vựng tổng hợp |
| 37–38 | 37-divider-text, 38-dialogue | Bài đọc |
| 39 | 39-divider-writing | Divider: Tập viết chữ Hán |
| 40–50 | 40-stroke-yi → 50-stroke-hao | Tập viết 11 chữ Hán |
| 51–53 | 51-divider-supplement → 53-number-gestures | Văn hóa bổ sung |
| 54–55 | 54-divider-homework, 55-exercises-list | Bài tập về nhà |
| 56 | 56-closing | Kết thúc |

## Writing style

When writing user-facing copy, apply the `avoid-ai-writing` skill:
- Direct, specific, practical, concise.
- No "delve/leverage/robust/seamless", no em-dash overuse, no formulaic openings.
- Preserve Vietnamese/Chinese/pinyin terminology exactly.

## Directory layout

```
.kiro/
├── steering/          Kiro auto-loaded project rules
└── skills/            Agent skills (universal, not Kiro-specific)
scripts/
├── pipeline/          Generic VP steps 1-8 engine (router, core, configs)
├── build-slides-data.mjs     Generic — requires --slides-dir
├── export-slides-pdf.mjs     Generic — requires --slides-dir
├── watch-slides.mjs          Generic — requires --slides-dir
├── run_pipeline.py           Generic CLI for VP steps 1-8
└── create-teacher-deck.mjs   Generic — reads any lesson.json
docs/                  Specs, requirements
design/                Design tokens, style references
examples/              Sample lesson JSON input
output/
└── book-{N}/
    ├── lesson_list.csv  master index of all lessons in this book
    ├── lesson-{NN}/
    │   ├── index.html              classroom entry point; opens slides/index.html
    │   ├── README.md               short folder map for teachers/agents
    │   ├── slides/                 editable slide HTML + runtime assets
    │   ├── database/               review database + Google Sheets-ready CSV
    │   ├── exports/
    │   │   ├── final/              clean PDF backups for class/archive
    │   │   ├── qa/                 screenshots, contact sheets, visual checks
    │   │   └── archive/            deprecated generated files kept for traceability
    │   ├── teacher-guide/
    │   └── homework-question-bank/
    └── pinyin-{NN}/     database/
work/                  Working files (gitignored)
```

## Lesson Folder Cleanliness — required for every lesson

Every lesson root must be classroom-friendly. The file Adam opens in class is:

```text
output/book-{N}/lesson-{NN}/index.html
```

For complete lessons, that root `index.html` is a lightweight launcher/redirect to `slides/index.html`. For database-only draft lessons, it is a safe status page. Keep the real presenter in `slides/index.html` for script compatibility, but do not make Adam dig through `slides/` during class.

Use these folders consistently:
- `slides/` = editable slide source files and runtime assets only.
- `exports/final/` = final PDFs or final teacher-facing exports.
- `exports/qa/` = screenshots, contact sheets, visual QA, render checks.
- `exports/archive/` = deprecated generated files such as old `slides-data.js`.

Do not leave QA screenshots, contact sheets, toolbar screenshots, or deprecated generated data in the lesson root or directly in `slides/`.

For database-only draft lessons, the root `index.html` must be a safe status page, not a redirect to a missing `slides/index.html`. Run:

```bash
npm run lesson:shells
```

This keeps every lesson root openable while making the current stage clear.

## HTML Presenter — required for every lesson

Every lesson's `slides/` folder must contain an `index.html` presenter after slide generation. Every lesson root must also contain an `index.html` launcher that opens `slides/index.html` after the presenter exists. The presenter is derived from `output/book-1/lesson-01/slides/index.html`, but lesson-specific fields are synced by script, not manual edits.

Do not hand-edit those presenter fields. After numbered slide files exist, run:

```bash
npm run lesson:presenter -- output/book-1/lesson-{NN}
npm run lesson:shells
```

This syncs the lesson-specific title, MANIFEST, slide count, first slide, and PDF filename from the canonical Lesson 01 presenter template.

**index.html must include:**
- MANIFEST array of all slide filenames in order
- Fullscreen mode (`F` key / `▶ Present` button)
- Navigation (arrow keys + buttons, slide counter)
- Left slide thumbnail sidebar with live previews and click-to-jump navigation
- In presentation mode, the thumbnail sidebar auto-minimizes and appears when the cursor moves to the left edge
- Annotation tools: pen, highlighter, eraser, text boxes, undo, clear
- On-demand PDF export — renders slides live via `html2canvas` + jsPDF; always current; no pre-baked data file
- Localhost export rule: live PDF export must run from `http://127.0.0.1` / `localhost`, not direct `file://`. If a deck is opened from `file://`, the launcher/export UI must show a clear localhost instruction instead of getting stuck.
- Annotation scaling rule: the slide iframe, drawing canvas, text annotations, and any slide hotspot overlays must sit inside one fixed `960×540` `.slide-surface`; fullscreen mode scales that single surface, not each layer separately.
- Export failure rule: `exportPDF()` must use timeouts and `try/catch/finally` cleanup so failed slide loads or blocked iframe access never leave the export overlay stuck.

**CDN dependencies (required in every index.html):**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

**Do NOT use `slides-data.js`.** The old pre-baked screenshot approach is deprecated.

## Reuse for new lessons

**New regular lesson:**
```bash
# 1. Run pipeline (steps 1-8) to generate database
python scripts/run_pipeline.py --lesson-type regular --lesson-id lesson-02 \
  --lesson-title "第二课" --source-pdf work/pdf-pages/ \
  --output-dir output/book-1/lesson-02/database/ --content-file work/lesson-02/extract.json

# 1.5. Create blank placeholder images from database image metadata.
# Do not generate AI images during initial slide creation. Generate real images later only when Adam asks,
# then insert them with assets:replace or assets:crop-contact-sheet.
npm run assets:manifest -- output/book-1/lesson-02
npm run assets:qa -- output/book-1/lesson-02

# 2. Copy shared slide assets, including the watermark
mkdir -p output/book-1/lesson-02/slides/assets/brand
cp output/book-1/lesson-01/slides/assets/slide-base.css output/book-1/lesson-02/slides/assets/
cp output/book-1/lesson-01/slides/assets/slide-base.js output/book-1/lesson-02/slides/assets/
cp design/shared-slide-assets/brand/logo-watermark.png output/book-1/lesson-02/slides/assets/brand/

# 2.5. Add safe lesson shell while the lesson is still database-only
npm run lesson:shells

# 3. Generate slides (steps 12-13) — driven by database JSON
# (fine-tune per lesson after initial generation)

# 3.5. After numbered slide HTML files exist, sync the presenter and launcher
npm run lesson:presenter -- output/book-1/lesson-02
npm run lesson:shells
npm run assets:manifest -- output/book-1/lesson-02
npm run assets:qa -- output/book-1/lesson-02

# 4. Verify the presenter with HTML screenshots/contact sheets during drafting
# Only export a clean PDF after Adam confirms the design and content are finalized.
```

**New lesson type (e.g. conversation, grammar-focus):**
Drop a new JSON config in `scripts/pipeline/configs/` following the `_schema.json` spec.

## For non-Kiro agents

If your agent doesn't auto-discover `.kiro/skills/`, read the SKILL.md files directly:
- `.kiro/skills/ai-teaching-material-systems/SKILL.md` — AI Teaching Material Systems
- `.kiro/skills/avoid-ai-writing/SKILL.md` — Avoid AI Writing — Audit & Rewrite
- `.kiro/skills/google-workspace/SKILL.md` — Google Workspace
- `.kiro/skills/huashu-design/SKILL.md` — 花叔Design · Huashu-Design

These are plain markdown files. Any agent that can read files can use them.

Note: The `powerpoint` skill is deprecated. PPTX is no longer part of the workflow. Use HTML presenter directly in class.
