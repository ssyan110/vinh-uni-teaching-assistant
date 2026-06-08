# AI teaching-material system steering

Project-local rules and context. Auto-included by Kiro; referenced by AGENTS.md for other agents.

## Must-read order

1. `AGENTS.md` (cross-agent entry point)
2. Classify the request size.
3. For a small existing-output edit, read only the affected slide/asset plus the specific workflow doc needed for that edit.
4. For structural/generator work, read `memory/project-memory.md` if present, `.kiro/skills/harness-engineering/SKILL.md`, relevant `.kiro/skills/*/SKILL.md`, and task-relevant docs.
5. Read `docs/ai-teaching-material-system-requirements-context.md` or `.html` only for broad project spec, pipeline architecture, or full lesson/database generation.
6. Read `docs/lesson-slide-template-guide.md` for slide/template work.
7. Read `docs/image-asset-workflow.md` for slide image, vocabulary image, cover image, divider image, and image replacement work.

## Non-negotiable rules

- Use harness engineering by default. Do not rely on repeated chat reminders; make context, tools, success gates, verification, observations, and durable feedback explicit in repo-local files.
- Use Huashu Design instead of Gamma unless Adam explicitly changes direction.
- HTML is the primary presentation format. No PPTX in the workflow. PDF is a backup export only.
- The lesson-root `index.html` is used directly in class. Complete lessons open `slides/index.html`, the HTML presenter with fullscreen mode, PowerPoint-style slide thumbnails, pen/highlighter, straight-line, circle, box, text boxes, and PDF download. Database-only draft lessons show a safe status page instead of redirecting to a missing presenter.
- Default courseware language: Vietnamese (instructions/labels) + Simplified Chinese (target content) + pinyin (pronunciation). Avoid Traditional Chinese and English labels.
- Do not generate final classroom/homework materials before teacher review approval.
- Preserve original source page mapping for every slide, exercise, and homework question.
- Student-facing materials must not contain teacher tips, internal review notes, or in-class exercise answers.
- Durable project rules must be written into repo files, not only remembered in chat.
- Match the workflow to the requested change size. For a one-off edit to an existing generated lesson, such as one slide title, wording, spacing, or 1-2 image replacements, edit the affected output directly and run narrow checks. Do not regenerate the whole lesson, rerun the full pipeline, patch the generator, or sync every repo doc unless the change is structural, reusable for future lessons, or explicitly requested as a durable rule.
- Images are lesson data. VP steps 1-8 must carry image metadata (`image_role`, `image_prompt`, `image_file`, `image_reuse_from`, `image_status`, `image_semantic_check`) for records that need visuals. New slide generation starts with blank, correctly sized placeholder image files; generate real AI images later only when Adam asks. Complete lessons must have `slides/assets/asset-manifest.json` and `exports/qa/asset-qa-report.json`.
- Lesson types: `regular` (full lessons with vocab/grammar/text) and `pinyin` (pinyin-only lessons). Never call it "normal" — use "regular".
- Pinyin content in regular lessons is SKIPPED — pinyin is handled by the separate pinyin lesson workflow.
- **Pinyin course spec:** Read `docs/pinyin-lesson-database-spec.md` before any pinyin lesson work. The pinyin course is 6 independent lessons from AI Mandarin (source: `Pinyin lessons/`). Do NOT use 漢語教程 phonetics content. Pipeline config: `scripts/pipeline/configs/pinyin.json` (v2.0.0).
- **Pinyin slide template:** Future pinyin decks reuse `output/pinyin/pinyin-01` as the template baseline. Do not build pinyin lessons from scratch. Keep the Pinyin Lesson 1 cover, objectives, dividers, concepts, tone, vocabulary, flashcard, practice, appendix/input setup, closing, image style, and presenter behavior; swap only lesson-specific text, sounds, rules, vocabulary, exercises, and images.
- **Pinyin cover subtitle rule:** All pinyin covers use the Lesson 1 cover layout. The badge uses `PINYIN N · 拼音第N课`; the main title stays `pīn/yīn` above `拼音`; the subtitle slot below `拼音` shows only the pinyin sounds/rules learned in that lesson as grouped rounded chips. Increase spacing between sound tokens inside each chip, and allow chips to wrap to a second line when one line is crowded. Examples: chips `b p m f` + `a o e i u ü`; chips `d t n l` + `g k h` + `j q x`. Do not put Vietnamese descriptive notes in the cover subtitle slot.
- **Pinyin closing slide rule:** All pinyin ending slides use the `下课` visual composition from `/Users/ssyan110/Downloads/Mandarin_Pinyin_Foundations.pptx`: pale mint classroom background, large rounded white card, and students leaving through an open classroom door. Recreate the visual in HTML; do not use the full PPTX image as a baked background with old text. Keep the current lesson's original three text lines: `下课`, `Bạn có câu hỏi gì không?`, and `Bài tiếp theo: Pinyin N` where `N` is the next pinyin lesson number. Use `下课`, not `下课了`, and do not add extra motivational or content-summary text.
- **Pinyin sequence and wording:** Pinyin decks use section dividers for concepts/review, initials, finals, sounds/chart, tones, vocabulary, review/practice, appendix/input setup when applicable, and closing. Do not create `Mục lục` or `Quy ước` classroom slides. Use `thanh điệu`, never `thanh điều`.
- **Pinyin chart slides:** Pinyin chart and chart-based practice slides do not need a body title. Keep only the presenter/top-bar section label, then maximize the chart within the slide safe area. Chart columns must have equal width, and chart-based practice should reuse the same table layout with tone marks or target practice values added. For `j/q/x + ü`, display written forms `ju/qu/xu` under the `ü` column because the spelling drops the two dots but the sound is still `ü`.
- **Pinyin exercise templates:** Use `scripts/pinyin-exercise-templates.mjs`, which captures Pinyin Lesson 1's existing exercise/practice slide styles by type. Reading drills follow slide 15's large sound-board style. `连连看` / matching vocabulary activities use a two-row image layout: pinyin+hanzi cards on the top row, shuffled image cards on the bottom row, no Vietnamese meaning column and no top label pills. Use the generic title `Nối từ vựng với hình ảnh.`; do not include a lesson number such as `Bài 1` in the matching title. Leave a generous vertical gap between the pinyin+hanzi row and image row. Image order must be randomized/deranged so images do not stay under their matching prompts. Split dense matching across slides instead of squeezing. Multiple-choice/listening-choice follows slide 37's blue answer table. Fill-in-blank/listening-completion follows slide 38's sound-bank and underline blanks, with no volume/speaker icon in the top bar or instruction header; when students fill initials, keep the underline blank before the final and add small parentheses above the vowel to remind them to write the tone; comprehensive fill-in practice must target the lesson's learning goals, not automatically practice finals. Visible student instructions stay in Vietnamese.
- **Pinyin objectives/images/page labels:** Pinyin objective slides highlight taught initials/finals/rule anchors in bold red and adapt the main goal text by lesson. All pinyin cover/goal/divider/concept/tone/initials-finals/vocabulary/closing images use the same soft textbook/course style. Pinyin classroom slides do not show bottom-right `Trang ...` page indicators.
- **Background visual rule:** Future regular lessons and pinyin lessons use the updated Pinyin Lesson 1 soft multicolor background style, not plain monotone backgrounds. Use a warm off-white base with very light mint/sky/yellow/peach/lavender background shapes. Keep the design quiet enough for classroom reading. Background images, blobs, and the watermark are bottom-layer elements behind slide content; they must never overlay or wash over text, cards, tables, or main images.
- **Inserted image rule:** Full-slide/reference/diagram images inserted into a slide must stay clear and unfogged: `opacity:1`, `filter:none`, no pale overlay. Do not put an extra white rounded frame, border, or shadow behind inserted images unless Adam explicitly asks for a card-style image.
- **Pinyin vocabulary grids:** `Từ vựng 1`, `Từ vựng 2`, etc. keep only the top bar label plus the vocabulary grid. Do not add extra body descriptions like `Tập trung đọc...`.
- 課文 section is labeled "Bài đọc" in Vietnamese (not "Bài khóa").
- Default game platform is Blooket. Only use Kahoot or Quizizz when Blooket cannot support the exercise format.
- Slide design: Soft Classroom Presenter style (locked). See `reference/slide-style-guide.md`. Do NOT use dark themes, Oriental Fantasy, or 中國風.
- Vocabulary slides: one word per card, no examples inside. Examples go on a separate "Mẫu câu" page.
- All vocabulary must include hán việt (Sino-Vietnamese reading) in parentheses.
- Pinyin always above 漢字 on separate lines. Never inline.
- Pinyin word grouping: pinyin of a multi-syllable word must be written together (no space between syllables of one word). Correct: "dìèr kè · nǐ shì nǎguó rén?" Wrong: "dì èr kè · nǐ shì nǎ guó rén?" Each vocabulary word's pinyin is one unit. Sentence pinyin groups by word boundaries. Use Google Translate or another LLM to verify correct word-boundary pinyin when generating sentences.
- Use "từ vựng" not "sinh từ", "cụm từ" not "thành ngữ".

## Canonical MVP flow (steps 1-18)

Steps 1-8 are pre-review and can be automated. Steps 9-18 require teacher approval first.

1. 教材輸入: upload/source PDF or Google Drive material.
2. 課次切分: split into lesson list.
3. 內容抽取: extract pinyin, vocabulary, text/dialogue, grammar, exercises.
4. 頁碼標註: every item gets original source page mapping.
5. 教學重組: restructure into the standard lesson sequence.
6. 補充活動: generate warm-up, pinyin/vocab/grammar drills, text preview, culture supplement, discussion.
6.5 圖片資料化: for every classroom visual need, write image metadata into the database (`image_role`, `image_prompt`, `image_file`, `image_reuse_from`, `image_status`, `image_semantic_check`). New slide generation uses blank, correctly sized placeholder image files first. Generate vocabulary prompts or real AI images only when Adam asks for image production. The source of truth is the database plus `slides/assets/asset-manifest.json`, not prompts alone. Required style: soft textbook line-art, thin grey-blue outlines, muted pastel fills, white/pale-grey background, subtle shadows, no in-image text/letters/numbers/Chinese characters. Do not use circular icons, teal vector blobs, stickers, or chibi art.
7. 遊戲標記: mark activities suitable for Kahoot / Quizizz / Blooket.
8. 寫入資料庫: output Google Sheets-ready database.
9. 人工審閱: teacher checks content, pages, teaching order, and answer keys.
10. 生成老師備課版: generate teacher-facing guide from Approved Data.
11. 生成 Huashu Brief: convert Approved Data into Huashu-compatible deck instructions.
12. 生成教師版簡報: generate teacher deck using Huashu HTML source.
13. 建立課堂簡報: build HTML presenter (index.html with fullscreen, annotation tools, on-demand PDF download) + slides using shared assets (slide-base.css/js). Copy presenter template from lesson-01.
14. 生成作業題庫: generate vocabulary, pinyin, hanzi, grammar, and text-related homework/question bank.
15. 題庫審閱: teacher reviews questions and answers.
16. 建立作業: create homework (Sheets/CSV/HTML-ready if Formative unavailable).
17. 課堂測試: use lesson in class and collect feedback.
18. 回填修正: record issues and improvement suggestions in Improvement Log.

## Standard lesson sequence

暖身活動 → 學習目標 → 拼音 → 拼音練習 → 生詞 → 生詞練習 → 語法(if any) → 語法練習(if any) →  綜合練習 → 課文 → 文化補充 → 課程討論 → 課後作業說明

Rules:
- Warm-up comes before learning objectives.
- Grammar comes after vocabulary and before text preview.
- 課文理解 is not a separate module; avoid overlap with 課文預習.
- 任務活動 is not a default module unless the source textbook has it.
- 課堂總結 has been renamed 課程討論.
- Formative is for student reading version and homework, not live class drills.
- Pinyin, vocabulary, and grammar drills may be marked for Kahoot / Quizizz / Blooket.
- Student version does not include in-class exercise reference answers.

## HTML Presenter — required for every lesson (non-negotiable)

Every lesson root **must** contain an `index.html` launcher. Complete lessons open `slides/index.html` so teachers do not need to dig through slide source files during class. Database-only draft lessons must show a safe status page instead of redirecting to a missing `slides/index.html`.

### What index.html must include

- **MANIFEST array** — ordered list of all slide HTML filenames for this lesson
- **Fullscreen mode** — `F` key or `▶ Present` button; scales to any screen
- **Navigation** — `← →` arrow keys + Prev/Next buttons; slide counter `N / total`
- **Slide thumbnails** — left sidebar with live slide previews and click-to-jump navigation
- **Presentation thumbnail behavior** — sidebar auto-minimizes in presentation mode and appears when the cursor moves to the left edge
- **Annotation tools** — pen, highlighter (4 colors, 30% opacity), straight-line tool (click two points), circle tool (drag), box tool (drag), pixel eraser, object eraser, transparent draggable text boxes with black/blue/red color and font-size controls, undo, clear
- **On-demand PDF export** — `📥 PDF` button renders slides live via `html2canvas` + jsPDF; no pre-baked `slides-data.js` needed; always reflects latest slide content
- **Annotation overlay in PDF** — pen drawings and text boxes drawn during the session are composited into the exported PDF
- **Localhost export rule** — live PDF export must run from `http://127.0.0.1` / `localhost`, not direct `file://`. If a deck is opened from `file://`, the launcher/export UI must show a clear localhost instruction instead of getting stuck.
- **Single slide-surface rule** — the slide iframe, drawing canvas, text annotations, and hotspot overlays must live inside one fixed `960×540` `.slide-surface`; fullscreen mode scales that single surface so notes stay aligned.
- **Export failure rule** — `exportPDF()` must use load timeouts and `try/catch/finally` cleanup so failed slide loads or blocked iframe access never leave the export overlay stuck.

### index.html CDN dependencies (always use these exact versions)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

**Do NOT use `slides-data.js` for PDF export.** The old pre-baked screenshot approach is deprecated. The on-demand renderer in `index.html` handles PDF export directly.

### Canonical index.html reference

Do not hand-edit copied presenter fields. After numbered slide HTML files exist, run:

```bash
npm run lesson:presenter -- output/book-1/lesson-XX
npm run lesson:shells
```

This syncs from `output/book-1/lesson-01/slides/index.html` and updates:
1. `<title>` and `<h1>` — lesson title
2. `MANIFEST` array — list of slide filenames in order
3. Subtitle and thumbnail total — slide count
4. First iframe slide
5. `pdf.save(...)` filename

Run `npm run lesson:shells` after database generation too, so draft lesson roots stay openable and explain that the presenter is not ready yet.

### Keyboard shortcuts (same for all lessons)

| Key | Action |
|-----|--------|
| `← →` | Navigate slides |
| Move cursor to left edge | Show slide thumbnails in presentation mode |
| `F` | Enter fullscreen |
| `Esc` | Exit fullscreen / deactivate tool |
| `P` | Pen |
| `H` | Highlighter |
| `E` | Eraser |
| `T` | Text box |
| `Z` | Undo |
| `C` | Clear current slide |

## Shared slide assets — required in every lesson

Every lesson's `slides/` folder must have an `assets/` subfolder containing:

- `assets/slide-base.css` — base styles (960×540, color palette, typography, card/menu-bar/page-indicator classes)
- `assets/slide-base.js` — shared JS (`lucide.createIcons()`, `revealNext()`, message listener for click-to-reveal)
- `assets/brand/logo-watermark.png` — deck watermark logo copied from `design/shared-slide-assets/brand/logo-watermark.png`

**Copy from `output/book-1/lesson-01/slides/assets/` when creating a new lesson.** Do not modify per-lesson unless the change applies to all lessons.
For the watermark, use the canonical shared source at `design/shared-slide-assets/brand/logo-watermark.png`, then copy it into the lesson-local `slides/assets/brand/` folder so the deck remains portable.

Every individual slide HTML must reference them:
```html
<link rel="stylesheet" href="assets/slide-base.css">
<!-- slide-specific <style> block here if needed -->
...
<script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script>
<!-- slide-specific inline scripts (e.g. hanzi-writer) here if needed -->
<script src="assets/slide-base.js"></script>
```

**Do NOT inline the common CSS or `revealNext` JS in individual slides.** They belong in the shared files only.

## Slide design rules (apply to ALL lessons unless explicitly changed)

- Visible slide `.page-indicator` must show the printed textbook page, not the slide number or PDF page. `source_page` / `source_page_range` in lesson databases must mean printed textbook page; if extraction needs PDF positions, store those separately as `source_pdf_page` / `source_pdf_page_range`. Format visible labels as `Trang 1` or `Trang 1-2`. If a slide has no textbook source, omit `.page-indicator`. Do not show page indicators on generated classroom activity sections that do not appear directly in the textbook, especially `Luyện tập tổng hợp` and `Văn hóa bổ sung`. Do not add separate `.source` footers. The presenter navigation counter in `index.html` may still show slide position.
- Use Lesson 10 `output/book-1/lesson-10/slides/01-cover.html` as the canonical cover template for all future lessons. Reuse the cover layout and visual language; only replace lesson number, Chinese/pinyin title, Vietnamese title, and topic image. Do not include the old three keyword/topic pills on cover slides. Keep the lesson badge (`BÀI N · 第N课`) at the larger cover size, about 16pt / 30% larger than the old 12pt badge.
- Vocab slides use the Lesson 01 single-word template from `output/book-1/lesson-01/slides/05-vocab-ni.html`: centered vertical stack with rectangular 16:9 image frame, pinyin, large Simplified Chinese character, Vietnamese meaning, hán việt, and Vietnamese word type.
- Vocabulary divider slides use the Lesson 01 page 04 image pattern: soft textbook desk scene with an open book. The book has only `汉` on the left page and `语` on the right page, placed inside the page margins. This generic `汉语` image can be reused across lessons. Do not add random Chinese filler or extra generated text.
- Use the same Lesson 01 divider templates across all lessons by default. Only replace page numbers, counts, and lesson-theme images when Adam explicitly asks for that lesson.
- Sample sentence slides (`sample-*`, menu label `MẪU CÂU`) include a small bottom-left circular support image frame: `.sample-spot{left:52px;bottom:28px;width:116px;height:116px;border-radius:50%;overflow:hidden}`. It must sit centered on the pale background circle graphic. Use the matching vocab image when it directly fits; otherwise generate a sentence-specific soft textbook image.
- Full reusable template workflow is documented in `docs/lesson-slide-template-guide.md`.
- Vocab image CSS: `.vocab-img` frame, `width:288px;height:162px;border-radius:14px;overflow:hidden;background:#F0FAFA;border:2px solid #5AACAC;`. Image uses `<img>` with `width:100%;height:100%;object-fit:cover`.
- Do NOT use old `.vocab-illust` circular crops, 140×140 icons, left-side icon/card layouts, teal vector blobs, or decorative abstract backgrounds for vocabulary images.
- Vocab image style: 16:9 soft textbook line-art, thin grey-blue outlines, muted pastel fills, white/pale-grey background, gentle low-contrast shadows. No text, letters, numbers, Chinese characters, labels, or watermarks inside the image.
- Vocab image concept QA: after inserting images, render all vocabulary slides and confirm the image matches the word. If mismatched, regenerate that one image and re-render the affected slide. Lesson 01 uses `一` = one raised finger, `五` = five fingers, `八` = Chinese eight hand gesture (thumb + index extended, other fingers folded), and `马` = white horse.
- Vocab counter format: `XX/YY` badge in top-right of vocab card (e.g. `01/11`). Total reflects actual slide count, not original textbook count.
- 你好 is NOT a standalone vocab slide — it appears only in the vocab summary quiz and dialogue slides.
- Slide filenames must be sequentially numbered matching their actual MANIFEST position (no gaps).
- `26-divider-practice-vocab.html` = "TẬP TỪ VỰNG / 词汇练习" divider (purple accent).
- `29-divider-comprehensive.html` = "LUYỆN TẬP TỔNG HỢP / 综合练习" divider (amber accent).
- Shared watermark: `slide-base.css` places `assets/brand/logo-watermark.png` as a bottom-layer element behind slide content at `opacity:.02` with `pointer-events:none`. This is a deck-level watermark, not part of generated vocab images.
- Practice activities should be varied and can include listening, speaking, reading, and writing when the lesson content supports it. Comprehensive practice and grammar practice should reference HSK and TOCFL question formats, with a preference for practical daily-use situations. Even when borrowing TOCFL-style formats, generated Chinese content stays Simplified Chinese unless Adam explicitly asks otherwise.
- Prefer simple interactive slide/webapp practice when useful: one multiple-choice question per slide, clickable options, success feedback for correct answers, and a try-again prompt for wrong answers.
- Hanzi-writing slides must reuse Lesson 01's title, layout, method, and HanziWriter stroke animation. Do not use static characters in place of animation. Use Lesson 01 slowed timing: `strokeAnimationSpeed: 0.575` and `delayBetweenStrokes: 360`, unless Adam changes the Lesson 01 template itself.
- VP steps 1-8 must write lesson structure/activity/database metadata that already follows the cover, divider, activity-design, Simplified Chinese, pinyin, image, density, and hanzi-writing rules. Do not defer these rules to manual slide cleanup.
- Build image manifests and run asset QA for complete lessons:
  - `npm run assets:manifest -- output/book-1/lesson-XX`
  - `npm run assets:qa -- output/book-1/lesson-XX`
  - Use `npm run assets:replace -- --lesson output/book-1/lesson-XX --record V001 --image /path/to/new.png` for vocabulary image replacement.

## Lesson 01 slide sequence (56 slides)

| # | File | Content |
|---|------|---------|
| 01 | 01-cover | Trang bìa |
| 02 | 02-objectives | Mục tiêu |
| 03 | 03-warmup | Khởi động |
| 04 | 04-divider-vocab | Divider: Từ vựng |
| 05–25 | 05-vocab-ni → 25-sample-ma | 11 từ vựng + mẫu câu; `.page-indicator` uses printed textbook pages |
| 26 | 26-divider-practice-vocab | Divider: Tập từ vựng / 词汇练习 |
| 27–28 | 27-vocab-summary-a/b | Mini quiz từ vựng (01-06/11, 07-11/11) |
| 29 | 29-divider-comprehensive | Divider: Luyện tập tổng hợp / 综合练习 |
| 30–36 | 30-practice-flashcard-ni → 36-practice-negation | Flashcard + số + biến điệu 不 |
| 37–38 | 37-divider-text, 38-dialogue | Bài đọc: 你好 hội thoại |
| 39 | 39-divider-writing | Divider: Tập viết chữ Hán / 写汉字 |
| 40–50 | 40-stroke-yi → 50-stroke-hao | Tập viết 11 chữ Hán |
| 51–53 | 51-divider-supplement → 53-number-gestures | Văn hóa bổ sung |
| 54–55 | 54-divider-homework, 55-exercises-list | Bài tập về nhà |
| 56 | 56-closing | Kết thúc |

## Reuse for new lessons and course types

This system is designed to produce slides and PDFs for any lesson or course type, not just Lesson 01.

**Adding a new regular lesson:**
1. Run `python scripts/run_pipeline.py --lesson-type regular --lesson-id lesson-XX ...` to generate the database.
2. Generate slides driven by the database JSON (fine-tune per lesson after initial generation).
3. After numbered slide HTML files exist, run `npm run lesson:presenter -- output/book-1/lesson-XX` and `npm run lesson:shells`.
4. Verify the lesson-root `index.html` opens `slides/index.html`, then verify thumbnail sidebar and presentation hover behavior.

**Adding a new lesson type (e.g. conversation, grammar-focus, culture):**
Drop a new JSON config in `scripts/pipeline/configs/` following `_schema.json`. No code changes needed.

**Generic slide scripts (all require `--slides-dir`):**
- `node scripts/export-slides-pdf.mjs --slides-dir <path>` — export PDF
- `node scripts/watch-slides.mjs --slides-dir <path>` — watch + auto-rebuild

**Per-lesson fine-tuning:** After initial slide generation, fine-tune individual slides directly. The system does not overwrite manual edits. Fine-tuning is expected and normal — do it after the full deck is generated.

**Output path convention:** `output/book-{N}/lesson-{NN}/` or `output/book-{N}/pinyin-{NN}/`

Each lesson root must stay clean:
- `index.html` opens the classroom presenter when it exists; otherwise it shows a safe draft status page.
- `slides/` contains editable slide source files and runtime assets.
- `database/` contains review data.
- `exports/final/` contains clean PDF backups.
- `exports/qa/` contains screenshots, contact sheets, and visual QA artifacts.
- `exports/archive/` contains deprecated generated files retained only for traceability.

- Original planning document: `docs/ai-teaching-material-system-requirements-context.md`
- HTML view: `docs/ai-teaching-material-system-requirements-context.html`
- VP Lesson 01 database: `output/book-1/lesson-01/database/`
  - `03_lesson_structure.csv` — canonical slide sequence with file names
  - `vp_lesson_01_database.json` — full content database
- VP Pinyin 01 database: `output/pinyin/pinyin-01/database/`
