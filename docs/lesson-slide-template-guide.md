# Lesson Slide Template Guide

Use Lesson 01 as the template for future regular lessons:

```text
output/book-1/lesson-01/
```

The classroom format is HTML-first. Open the lesson-root `index.html` in class; it launches `slides/index.html`, the real browser presenter. PDF is a backup export only after Adam confirms the design and content are finalized.

Student-facing language rule: keep the Lesson 01 visual language. Student operation text and activity instructions must be Vietnamese. Lesson 01 reusable divider templates may keep their fixed Chinese section heading (`生词`, `词汇练习`, `综合练习`, `课文`, `写汉字`, `补充学习`, `回家作业`) as part of the template. Simplified Chinese also appears as target learning content: vocabulary, examples, dialogue, grammar patterns, cultural terms, lesson titles, and hanzi-writing characters.

Chinese + pinyin alignment rule: when a slide shows Chinese and pinyin together, place each pinyin chunk directly above the matching Chinese character or word group. This applies to vocabulary cards, sample sentences, dialogue lines, grammar examples, culture examples, and Chinese lesson titles. Do not show a whole pinyin sentence as one centered line above or below a Chinese sentence when punctuation makes the mapping unclear.

Cover rule: use Lesson 10 `output/book-1/lesson-10/slides/01-cover.html` as the canonical cover template for all future lessons. Reuse its cover layout and visual language directly; only replace lesson number, Chinese/pinyin title, Vietnamese title, topic chips, and topic image.

Reusable page rule: do not redesign reusable slide types for each lesson. Copy Lesson 01's visual templates for dividers, objectives, homework divider, exercise list, dialogue avatar layout, and hanzi-writing layout. Only replace lesson-specific content, printed page numbers, counts, and images.

Reusable divider rule: use the same Lesson 01 divider templates across all lessons by default. Swap only page numbers, lesson-specific counts, and images Adam explicitly asks to customize for a specific lesson theme.

Centering rule: when a slide is not a fixed Lesson 01 template, list, comparison, or dialogue layout, prefer centering the main content vertically and horizontally. This is especially important for culture notes, single concepts, example sentences, and practice prompts. Use left-center layouts only when they make the content easier to scan.

Activity design rule: practice activities should be varied and can include listening, speaking, reading, and writing when the lesson content supports it. Comprehensive practice and grammar practice should reference HSK and TOCFL item formats, with a preference for practical daily-use situations. The generated content still uses Simplified Chinese unless Adam explicitly asks otherwise, even when the question style is inspired by TOCFL.

Interactive practice rule: prefer simple interactive slide/webapp formats when useful. For example, create one multiple-choice question per slide with clickable options; correct choices show success feedback, and wrong choices prompt the student to try again.

Hanzi writing rule: every hanzi-writing slide must reuse Lesson 01's title, layout, method, and HanziWriter stroke animation. Do not use a static character in place of stroke animation. Use the Lesson 01 slowed timing: `strokeAnimationSpeed: 0.575` and `delayBetweenStrokes: 360`, unless Adam changes the Lesson 01 template itself.

Database rule: VP steps 1-8 must generate lesson structure, activity, and database metadata that already follows these slide rules. Do not postpone the cover/divider/activity/Simplified-Chinese/pinyin/image/density/hanzi-writing requirements until manual slide cleanup.

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

- `index.html`: classroom entry point. It opens `slides/index.html`.
- `slides/`: editable slide files and runtime assets only.
- `exports/final/`: clean PDF backups.
- `exports/qa/`: screenshots, contact sheets, and render checks.
- `exports/archive/`: deprecated generated files kept only for traceability.

Do not leave QA screenshots, contact sheets, or deprecated generated data directly in `slides/`.

## New Lesson Setup

1. Copy `output/book-1/lesson-01/slides/assets/slide-base.css` and `slide-base.js` into the new lesson's `slides/assets/`.
2. Copy `design/shared-slide-assets/brand/logo-watermark.png` into the new lesson's `slides/assets/brand/logo-watermark.png`.
3. Copy `output/book-1/lesson-01/slides/index.html` into the new lesson's `slides/` folder and update the title, `MANIFEST`, slide count, thumbnail total, and PDF filename.
4. Copy `output/book-1/lesson-01/index.html` into the new lesson root and update its visible lesson title.
5. Use Lesson 10 `01-cover.html` as the new lesson cover template and replace only lesson-specific title/chips/image.
6. Generate slide files sequentially with filenames matching their `MANIFEST` order. No gaps.
7. For regular lessons, use the Lesson 01 vocabulary slide pattern for every standalone vocabulary word.
8. During drafting, render screenshots/contact sheets under `exports/qa/` for visual QA. Do not export a PDF until Adam confirms the lesson is finalized.
9. Check every slide for overflow before delivery. Text must not spill outside the 16:9 slide, background image panels, cards, bubbles, tiles, buttons, or fixed containers. If content is too dense, split it into more slides.

Presenter rule for every new lesson:

- Live PDF export must be tested from `http://127.0.0.1` / `localhost`; direct `file://` opening must show a localhost instruction instead of allowing a stuck export.
- The presenter must keep the slide iframe, drawing canvas, text annotations, and hotspot overlays inside one fixed `960×540` `.slide-surface`; fullscreen scales that one surface so notes stay aligned.
- `exportPDF()` must use slide-load timeouts and `try/catch/finally` cleanup so blocked iframe access or failed resources never leave the export overlay stuck.

The watermark is a shared deck-level overlay from `slide-base.css`: `assets/brand/logo-watermark.png`, top layer above slide content, `opacity:.02`, `pointer-events:none`. It is separate from vocabulary images, which still must not contain in-image watermarks.

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

Generate prompts:

```bash
python scripts/generate-vocab-images.py \
  --database output/book-1/lesson-XX/database/vp_lesson_XX_database.json \
  --output-dir output/book-1/lesson-XX/slides/assets/vocab-images/ \
  --prompts-file output/book-1/lesson-XX/slides/assets/vocab-images/prompts.json
```

Generate one image per prompt and save it as:

```text
output/book-1/lesson-XX/slides/assets/vocab-images/{filename}
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
