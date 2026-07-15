# Lesson Slide Template Guide

Use Lesson 01 as the template for future regular lessons:

```text
output/book-1/lesson-01/
```

The classroom format is HTML-first. Open the lesson-root `index.html` in class. Complete lessons launch `slides/index.html`, the real browser presenter; database-only draft lessons show a safe status page. PDF is a backup export only after Adam confirms the design and content are finalized.

## Formal Course Design Choice

Before starting any new formal course slide or deck — regular textbook lessons and Pinyin lessons included — ask Adam to choose a design option. Do not silently assume the most recently used option.

- **Design Option 1 — Original Course:** use the course's established canonical template: Lesson 01 / Lesson 10 cover language for regular textbook lessons, or Pinyin Lesson 1 for Pinyin lessons.
- **Design Option 2 — Coral Studio:** use the warm paper, coral, and indigo Coral Studio visual system while preserving the selected course's canonical content structure, title positions, teaching templates, and interactions. Pinyin reference trial: `output/pinyin/pinyin-01/design-prototypes/coral-studio-full-deck/slides/index.html`.

The choice changes visual styling only. It never changes lesson content, text hierarchy, slide layout rules, interaction behavior, or pedagogical sequence.

Image workflow rule: read `docs/image-asset-workflow.md` before generating or replacing slide images. Images are tracked as lesson data through database image metadata, `slides/assets/asset-manifest.json`, and `exports/qa/asset-qa-report.json`; do not handle them only through ad hoc HTML edits. For wording/title/spacing edits that do not touch images, use the small-edit path and do not run image workflow commands.

Student-facing language rule: keep the Lesson 01 visual language. Student operation text and activity instructions must be Vietnamese. Lesson 01 reusable divider templates may keep their fixed Chinese section heading (`生词`, `词汇练习`, `综合练习`, `课文`, `写汉字`, `补充学习`, `回家作业`) as part of the template. Simplified Chinese also appears as target learning content: vocabulary, examples, dialogue, grammar patterns, cultural terms, lesson titles, and hanzi-writing characters.

Chinese + pinyin alignment rule: when a slide shows Chinese and pinyin together, place each pinyin chunk directly above the matching Chinese character or word group. This applies to vocabulary cards, sample sentences, dialogue lines, grammar examples, culture examples, and Chinese lesson titles. Do not show a whole pinyin sentence as one centered line above or below a Chinese sentence when punctuation makes the mapping unclear.

Cover rule: use Lesson 10 `output/book-1/lesson-10/slides/01-cover.html` as the canonical cover template for all future lessons. Reuse its cover layout and visual language directly; only replace lesson number, Chinese/pinyin title, Vietnamese title, and topic image. Do not include the old three keyword/topic pills on cover slides. Keep the lesson badge (`BÀI N · 第N课`) at the larger cover size, about 16pt / 30% larger than the old 12pt badge.

Background rule: use the background system belonging to Adam's selected formal-course design option. Do not revert either option to a plain monotone background. Keep backgrounds visually quiet enough that main text, cards, tables, and lesson images remain dominant. All decorative backgrounds, blobs, and watermarks must sit behind slide content as bottom-layer elements; they must not overlay or fade across primary content.

Inserted image rule: when a slide contains a separately inserted full-slide reference image, diagram, chart, or classroom illustration, display it clearly with `opacity:1` and `filter:none`. Do not add an extra white rounded rectangle, border, or shadow frame behind the inserted image unless the slide design specifically calls for a card. If the image is contained without cropping, transparent/empty margins should reveal the slide background instead of a white box.

Reusable page rule: do not redesign reusable slide types for each lesson. Copy Lesson 01's visual templates for dividers, objectives, homework divider, exercise list, dialogue avatar layout, and hanzi-writing layout. Only replace lesson-specific content, printed page numbers, counts, and images.

Reusable divider rule: use the same Lesson 01 divider templates across all lessons by default. Swap only page numbers, lesson-specific counts, and images Adam explicitly asks to customize for a specific lesson theme.

Centering rule: when a slide is not a fixed Lesson 01 template, list, comparison, or dialogue layout, prefer centering the main content vertically and horizontally. This is especially important for culture notes, single concepts, example sentences, and practice prompts. Use left-center layouts only when they make the content easier to scan.

Concise classroom slide rule: slides should be `簡潔有力有重點`. Use one clear title and one clear task. Avoid subtitles, explanatory notes, teacher tips, or redundant helper text on classroom slides unless Adam explicitly asks for them. Put extra explanation in teacher prep notes instead of the slide.

Activity design rule: practice activities should be varied and can include listening, speaking, reading, and writing when the lesson content supports it. Comprehensive practice and grammar practice should reference HSK and TOCFL item formats, with a preference for practical daily-use situations. The generated content still uses Simplified Chinese unless Adam explicitly asks otherwise, even when the question style is inspired by TOCFL.

Interactive practice rule: prefer simple interactive slide/webapp formats when useful. For example, create one multiple-choice question per slide with clickable options; correct choices show success feedback, and wrong choices prompt the student to try again.

Hanzi writing rule: every hanzi-writing slide must reuse Lesson 01's title, layout, method, and HanziWriter stroke animation. Do not use a static character in place of stroke animation. Use the Lesson 01 slowed timing: `strokeAnimationSpeed: 0.575` and `delayBetweenStrokes: 360`, unless Adam changes the Lesson 01 template itself.

Database rule: VP steps 1-8 must generate lesson structure, activity, and database metadata that already follows these slide rules. Do not postpone the cover/divider/activity/Simplified-Chinese/pinyin/image/density/hanzi-writing requirements until manual slide cleanup.

Image metadata rule: records that need classroom visuals must carry `image_role`, `image_prompt`, `image_file`, `image_reuse_from`, `image_status`, and `image_semantic_check` where relevant. For new/regenerated lessons and image edits, build and check the manifest with:

```bash
npm run assets:manifest -- output/book-1/lesson-XX
npm run assets:qa -- output/book-1/lesson-XX
```

## Pinyin Lesson Template

Pinyin lessons use their own pinyin-course template, not the regular Lesson 01 textbook template. Use Pinyin Lesson 1 as the baseline:

```text
output/pinyin/pinyin-01/
```

For future pinyin lessons, do not build slides from scratch. Reuse the Pinyin Lesson 1 cover, objective layout, divider rhythm, concept-slide style, initials/finals teaching slides, tone slides, vocabulary grid, flashcard style, practice slide styling, appendix/input setup style, closing slide, and presenter setup. Replace only lesson-specific text, taught sounds, rules, vocabulary, exercises, and images. Closing slides use the `下课` visual composition from `/Users/ssyan110/Downloads/Mandarin_Pinyin_Foundations.pptx` while keeping each lesson's original closing text.

Pinyin background rule: apply the selected formal-course design option to the Pinyin-specific templates below. Background colors should stay subtle, and every background/decorative element must remain below the content layer.

Required pinyin section rhythm:

- Cover
- Objectives / lesson goal
- Concept or review divider
- Concepts or previous-lesson review
- Initials divider and teaching slides, when applicable
- Finals divider and teaching slides, when applicable
- Sounds/chart divider and pinyin chart/practice slides
- Tone divider and tone/rule slides, when applicable
- Vocabulary divider, vocabulary grids, and one-word flashcards
- Review/practice divider and exercises
- Appendix/input setup, when applicable
- Closing

For pinyin review sections, the `Ôn bài X` divider shows `Khởi động` above the `ÔN BÀI X` label.

`Mục lục` and `Quy ước` slides are no longer used in future pinyin classroom decks. Source contents/rules can remain in database/review notes if useful, but they should not become classroom slides.

Pinyin classroom slides do not show bottom-right `Trang ...` page indicators. Keep source page metadata in the database when useful, but do not render page indicators on pinyin slides.

Use `thanh điệu` exactly in Vietnamese text. Do not use `thanh điều`.

Objective slides:

- Reuse the Pinyin Lesson 1 objective template.
- Highlight taught initials/finals/rule anchors in bold red.
- Main text changes by lesson. Lesson 1 example: bold red `bmpf`, bold red `aoeiuü`, `Học 5 thanh điệu tiếng Trung`, `Học đọc 16 từ vựng`.

Pinyin images:

- Cover, goal, divider, concept, tone, initials/finals, vocabulary, appendix, and closing images all use the same soft textbook/course style.
- Concept slides use the provided or generated soft textbook illustration style.
- Treat recurring pinyin images as templates; swap main text/content/image subject per lesson instead of redesigning the whole slide.

Pinyin vocabulary and flashcards:

- Pinyin vocabulary grids can use square `1:1` soft textbook images when the pinyin-template slide requires that shape.
- Pinyin vocabulary grid slides (`Từ vựng 1`, `Từ vựng 2`, etc.) keep only the top bar label plus the vocabulary grid. Do not add extra body descriptions like `Tập trung đọc...`.
- Any pinyin vocabulary grid or regular-lesson vocabulary overview/summary grid with 1-8 cards uses the balanced 8-track layout with a 20px row gap / 14px column gap: 8 = 4 + 4, 7 = 4 + 3 centered, 6 = 4 + 2 under the inner columns, 5 = 4 + 1 centered, and 1-4 = one centered evenly spaced row.
- Flashcards follow the Lesson 1/Lesson 10 flashcard behavior adapted for pinyin: one word per page, pinyin with tone first, click to reveal image and Vietnamese meaning.
- Do not include repeated helper text such as `Đọc lại pinyin trước khi qua thẻ tiếp theo.`

## Required Lesson Folder Shape

```text
output/book-{N}/lesson-{NN}/
├── index.html
├── README.md
├── slides/
├── database/
├── exports/
│   ├── final/
│   ├── qa/
│   └── archive/
├── teacher-guide/
└── homework-question-bank/
```

- `index.html`: safe lesson entry point. It opens `slides/index.html` after the presenter exists.
- For database-only draft lessons, `index.html` is a safe status page instead of a redirect to a missing presenter.
- `slides/`: editable slide files and runtime assets only.
- `exports/final/`: clean PDF backups.
- `exports/qa/`: screenshots, contact sheets, and render checks.
- `exports/archive/`: deprecated generated files kept only for traceability.

Do not leave QA screenshots, contact sheets, or deprecated generated data directly in `slides/`.

## New Lesson Setup

1. Copy `output/book-1/lesson-01/slides/assets/slide-base.css` and `slide-base.js` into the new lesson's `slides/assets/`.
2. Copy `design/shared-slide-assets/brand/logo-watermark.png` into the new lesson's `slides/assets/brand/logo-watermark.png`.
3. Run `npm run lesson:shells` so the lesson root is safe to open while slides are not generated yet.
4. Use Lesson 10 `01-cover.html` as the new lesson cover template and replace only the lesson-specific title and image. Do not add keyword/topic pills.
5. Generate slide files sequentially with filenames matching their `MANIFEST` order. No gaps.
6. After numbered slide files exist, run `npm run lesson:presenter -- output/book-1/lesson-XX`, then run `npm run lesson:shells` again. This syncs `slides/index.html` from the Lesson 01 presenter template and updates the title, `MANIFEST`, slide count, thumbnail total, first slide, and PDF filename.
7. For regular lessons, use the Lesson 01 vocabulary slide pattern for every standalone vocabulary word.
8. During drafting, render screenshots/contact sheets under `exports/qa/` for visual QA. Do not export a PDF until Adam confirms the lesson is finalized.
9. Check every slide for overflow before delivery. Text must not spill outside the 16:9 slide, background image panels, cards, bubbles, tiles, buttons, or fixed containers. If content is too dense, split it into more slides.

## Fast Path For Existing Slide Edits

Use this when Adam asks for a small edit in an already generated lesson.

- Title/wording/content on one slide: edit that numbered slide HTML directly, then inspect that slide with `npm run slides:screenshot -- --slides-dir <lesson-root>/slides --slide <file.html>`.
- Spacing/layout on one slide: edit that slide's local CSS, then inspect that slide at 16:9 with the same single-slide screenshot command.
- One or two image swaps: use `npm run assets:replace -- --lesson <lesson-root> --record <record-id> --image <file>` or `npm run assets:crop-contact-sheet -- --lesson <lesson-root> --sheet <sheet.png> --records V001,V002`, then run asset manifest/QA and inspect the affected slide.
- Do not rerun the lesson generator, pipeline, presenter sync, full screenshot set, or repo-wide doc sync unless the change affects slide order, the presenter MANIFEST, shared templates, database fields, or future lesson rules.

Validation:

```bash
npm run validate:book1
```

The validator is status-aware: database-only draft lessons pass when their root `index.html` explains that `slides/index.html` is not ready yet; complete lessons must have a valid presenter with a lesson-specific MANIFEST and PDF filename.

Presenter rule for every new lesson:

- Live PDF export must be tested from `http://127.0.0.1` / `localhost`; direct `file://` opening must show a localhost instruction instead of allowing a stuck export.
- The presenter must keep the slide iframe, drawing canvas, text annotations, and hotspot overlays inside one fixed `960×540` `.slide-surface`; fullscreen scales that one surface so notes stay aligned.
- `exportPDF()` must use slide-load timeouts and `try/catch/finally` cleanup so blocked iframe access or failed resources never leave the export overlay stuck.

The watermark is a shared deck-level bottom-layer element from `slide-base.css`: `assets/brand/logo-watermark.png`, `opacity:.02`, `pointer-events:none`. It must stay behind slide content. It is separate from vocabulary images, which still must not contain in-image watermarks.

## Vocabulary Slide Template

Canonical source:

```text
output/book-1/lesson-01/slides/05-vocab-ni.html
```

Required layout:

- Centered vertical stack.
- Image first, then pinyin aligned above the matching Simplified Chinese character/word group, Vietnamese meaning, hán việt + word type.
- Top-right counter: `XX/YY`, where `YY` is the actual standalone vocab count.
- `.page-indicator` shows the printed textbook page from the database, such as `Trang 1` or `Trang 1-2`; it is never a slide number or PDF page. `source_page` must mean printed textbook page. If extraction uses PDF positions, keep them separately as `source_pdf_page` / `source_pdf_page_range`. Slides with no textbook source omit `.page-indicator`. Generated classroom activity sections that do not appear directly in the textbook, especially `Luyện tập tổng hợp` and `Văn hóa bổ sung`, also omit `.page-indicator`.
- Do not add separate `.source` footers.
- No sample sentence or example inside the vocab slide. Put examples on separate `sample-*` slides.
- Vietnamese labels/word types, Simplified Chinese target word, pinyin pronunciation.

Required image frame:

```css
.vocab-img{
  width:288px;height:162px;
  border-radius:14px;
  overflow:hidden;
  background:#F0FAFA;
  border:2px solid #5AACAC;
}
.vocab-img img{width:100%;height:100%;object-fit:cover}
```

Do not use:

- Circular crops.
- `.vocab-illust`.
- 140×140 icon frames.
- Left-side icon/card layouts.
- Teal vector icon art.
- Decorative abstract blob backgrounds.

## Visible Instruction Language

Use Vietnamese for visible classroom instructions and activity labels.

Do not use Chinese labels as standalone activity instructions like:

- `連連看`
- `词汇练习`
- `综合练习`
- `改错句`

Use Vietnamese labels instead:

- `Ghép nối`
- `Bài tập về nhà`
- `Tập viết chữ Hán`
- `Tập từ vựng`
- `Luyện tập tổng hợp`
- `Hội thoại`

## Vocabulary Divider Image Template

Use Lesson 01 page 04 as the reusable vocabulary-divider image pattern.

- Image concept: soft textbook desk scene with an open book.
- The only in-image text is `汉` on the left page and `语` on the right page, placed inside the book page margins.
- This generic `汉语` image can be reused across regular lessons.
- Do not invent random Chinese filler or add extra generated text.
- This is an exception to the no-text rule for vocabulary word illustrations; standalone vocab images still must not contain text.

## Sample Sentence Slide Template

Use this for every `sample-*` slide with menu label `MẪU CÂU`.

- Main sentence content stays in the centered `.sample-card`.
- Add a bottom-left circular `.sample-spot` image frame centered on the pale background circle graphic.
- The support image must match the full sample phrase. Reuse the vocab image only when it is semantically correct.

Required support image frame:

```css
.sample-spot{
  position:absolute;
  left:52px;bottom:28px;
  width:116px;height:116px;
  border-radius:50%;
  overflow:hidden;
  background:#F8FBFB;
  border:2px solid rgba(90,172,172,.22);
  box-shadow:0 8px 22px rgba(90,172,172,.12);
}
.sample-spot img{width:100%;height:100%;object-fit:cover}
```

## Vocabulary Image Workflow

Initial slide generation uses blank placeholders, not AI-generated images.

When Adam asks for real images, you may prepare prompts with:

```bash
python scripts/generate-vocab-images.py \
  --database output/book-1/lesson-XX/database/vp_lesson_XX_database.json \
  --output-dir output/book-1/lesson-XX/slides/assets/vocab-images/ \
  --prompts-file output/book-1/lesson-XX/slides/assets/vocab-images/prompts.json
```

Then generate images in Chrome/ChatGPT or from an approved source and insert them with `assets:replace` or `assets:crop-contact-sheet`. Save regular vocabulary images as:

```text
output/book-1/lesson-XX/slides/assets/vocab-images/{filename}
```

Then rebuild the manifest and run asset QA:

```bash
npm run assets:manifest -- output/book-1/lesson-XX
npm run assets:qa -- output/book-1/lesson-XX
```

To replace one vocabulary image later, use:

```bash
npm run assets:replace -- --lesson output/book-1/lesson-XX --record V001 --image /path/to/new.png
```

Image requirements:

- PNG, 16:9 landscape, ideally `576×324` or larger.
- Soft textbook line-art.
- Thin grey-blue outlines.
- Muted pastel fills.
- White or very pale grey background.
- Gentle low-contrast shadows.
- No in-image text, letters, numbers, Chinese characters, labels, or watermarks.
- No thick teal outlines, circular icons, glossy vector art, stickers, chibi proportions, harsh colors, or abstract blobs.

## Concept QA

After inserting images, render all vocabulary slides and check each word against its displayed image.

If the image does not match the vocabulary word:

1. Regenerate that one image.
2. Save it to the same filename.
3. Re-render the affected slide.
4. Re-check before exporting the full deck.

Lesson 01 fixed concept choices:

| Word | Image concept |
|---|---|
| `一` | one raised finger |
| `五` | five raised fingers |
| `八` | Chinese eight hand gesture: thumb + index extended, other fingers folded |
| `马` | white horse |
| `你好` | not a standalone vocab slide |

## Verification

Run a full PDF export only after Adam confirms the slides and content are finalized:

```bash
node scripts/export-slides-pdf.mjs --slides-dir output/book-1/lesson-XX/slides
```

Default PDF output:

```text
output/book-1/lesson-XX/exports/final/lesson-XX-teacher-deck.pdf
```

For drafting visual QA, render representative vocab slides with Playwright screenshots/contact sheets, then inspect:

- Correct image for each word.
- Rectangular frame used everywhere.
- No circular crops.
- No text inside images.
- Counter is `XX/YY`.
- Pinyin grouping is correct.
