---
name: ai-teaching-material-systems
description: "Build and verify reusable AI teaching-material production systems: structured lesson inputs, teacher decks, browser HTML presentations, PDF exports, teacher guides, and classroom-ready validation. Use huashu-design as Adam's preferred deck/design engine. HTML is the primary presentation format — no PPTX in the workflow."
version: 1.1.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [teaching, education, slides, html-presenter, huashu-design, automation, chinese-learning]
    related_skills: [harness-engineering, huashu-design, google-workspace, avoid-ai-writing]
---

# AI Teaching Material Systems

## Overview

Use this skill when Adam wants a complete teaching-material production workflow, not just a single file. The target output is a reusable system that can turn structured lesson content into classroom-ready materials: teacher decks, browser presentations, PDF exports, teacher guides, scripts, and verification checks.

For Adam's current preference, all Gamma-like slide-generation content should be replaced with the **huashu-design** repo/workflow. The system should be local, inspectable, low/no-cost where possible, and project repos/systems should live under `~/Development/` like Adam's other projects. Final shareable artifacts or archives can still be copied/exported to `~/Desktop/Hermes Output/` when useful.

## When to Use

Use this skill when the user asks for any of these:

- “AI teaching material system,” “teacher material system,” “courseware system,” or “complete teaching material pipeline”
- Auto-generating teacher-version slides/decks from lesson inputs
- Replacing Gamma-style deck generation with `huashu-design`
- Chinese teaching decks, Vietnamese learner support, teacher run sheets, activity slides, assessment/homework materials
- Browser HTML decks plus PDF exports
- “No bugs,” “ready to use,” or similar launch-quality verification for teaching materials

Note: powerpoint skill is deprecated. PPTX is no longer part of the workflow.

## Core Principle for Adam

**Use huashu-design instead of Gamma-related content.**

**Use harness engineering by default.** Do not make Adam repeat the same rules in chat. Start by loading the repo-local harness (`AGENTS.md`, `memory/project-memory.md`, `.kiro/steering`, `.kiro/skills/*`, `.agent/skills/*` as relevant), define the artifact and success gate, use existing scripts/templates, verify with concrete checks, inspect generated outputs, and write durable decisions back into project docs/skills/memory when Adam asks.

**Audience/language default:** Adam's teaching materials are for Vietnamese universities. Unless the user explicitly asks otherwise, generated teaching materials should use **Vietnamese + Simplified Chinese**. Avoid Traditional Chinese in courseware. Use Vietnamese for teacher-facing guidance, labels, notes, instructions, and classroom flow; use Simplified Chinese for target-language examples, vocabulary, dialogues, and headings where Chinese is needed. Pinyin can be included as pronunciation support.

Practical interpretation:

- Do not build a workflow that depends on Gamma UI/SaaS as the main generation step.
- Use `https://github.com/alchaincyf/huashu-design.git` as the local design/deck engine.
- Make generated decks HTML-first. HTML is the classroom presentation format. PDF is backup only.
- During drafting, do not export clean PDF backups. Use HTML preview plus screenshots/contact sheets for QA. Before any PDF export, ask Adam whether the slide design and content are finalized; export only after Adam confirms finalization.
- Keep the source editable and versionable.
- Validate outputs with Playwright or equivalent before delivery.

## VP Production Flow for Adam

For Adam's VP teaching-material production system, implement only steps 1–8 before teacher review:

1. 教材輸入: PDF source reference / Google Drive location.
2. 課次切分: AI agent splits textbook into lesson list.
3. 內容抽取: extract pinyin, vocabulary, text/dialogue, grammar, exercises.
4. 頁碼標註: every extracted item includes original textbook page mapping.
5. 教學重組: restructure into the new teaching sequence.
6. 補充活動: generate warm-up, pinyin drills, vocabulary drills, grammar drills, text preview, culture supplement, discussion.
7. 遊戲標記: mark which activities are suitable for group games.
8. 寫入資料庫: output a Google Sheets-ready teaching-material database.

Steps 9–18 start after teacher review/approval and should not be automated as final classroom materials unless Adam explicitly asks:

9. 人工審閱: teachers check content, page mapping, teaching order, and answer keys in Google Sheets.
10. 生成老師備課版: generate teacher-facing teaching notes from Approved Data.
11. 生成 Huashu Brief: convert Approved Data into Huashu-compatible slide/deck brief. Original doc said Gamma Brief; replace Gamma with Huashu Design.
12. 生成教師版簡報: use Huashu Design to generate the teacher deck locally as HTML source, not paid slide software.
13. 建立課堂簡報: build HTML presenter (index.html with fullscreen, left slide thumbnails, annotation tools, and on-demand PDF download).
14. 生成作業題庫: create vocabulary, pinyin, hanzi, grammar, and text-related homework/question bank.
15. 題庫審閱: teachers review questions and answers in Google Sheets.
16. 建立作業: create homework in the chosen platform/workflow. If Formative is unavailable or paid, keep output as Sheets/CSV/HTML-ready content first.
17. 課堂測試: teach Lesson 1 in class and collect feedback.
18. 回填修正: record issues and improvement suggestions in the Improvement Log.

Note: The old step 14 (生成學生版內容) has been removed. There is no separate student version — the teacher deck IS the classroom material. The workflow is now 18 steps total.

See `references/vp-pinyin-lesson-database-and-redesign.md` for the Google Sheets-ready VP database shape, auth fallback, copyright-safe reference-design handling, and post-review steps 9–18.

## Recommended Output Structure

Save project/system repos under:

```bash
~/Development/ai-teaching-material-system/
```

If the user asks for portable deliverables, also export copies/archives under:

```bash
~/Desktop/Hermes Output/ai-teaching-material-system/
```

Recommended tree:

```text
ai-teaching-material-system/
├── README.md
├── package.json
├── huashu-design/                 # cloned upstream repo
├── examples/
│   └── sample-lesson.json          # structured lesson input
├── scripts/
│   ├── create-teacher-deck.mjs     # generator
│   └── validate-system.mjs         # project-level checks
└── output/
    └── <deck-name>/
        ├── index.html              # classroom entry; opens slides/index.html
        ├── slides/
        │   ├── index.html          # browser presentation
        │   ├── *.html              # source slides
        │   └── assets/
        ├── 教师手册.md                 # prep notes only, not classroom slide content
        └── exports/
            ├── final/              # PDF backup (clean, no annotations)
            ├── qa/                 # screenshots/contact sheets/render checks
            └── archive/            # deprecated generated files
```

## Setup Workflow

1. **Create workspace**

```bash
BASE="$HOME/Development/ai-teaching-material-system"
mkdir -p "$BASE"
cd "$BASE"
```

2. **Clone or update huashu-design**

```bash
if [ -d huashu-design/.git ]; then
  git -C huashu-design pull --ff-only
else
  git clone https://github.com/alchaincyf/huashu-design.git
fi
```

3. **Inspect repo instructions before using**

Read at minimum:

- `huashu-design/README.md`
- `huashu-design/SKILL.md`
- `huashu-design/references/slide-decks.md`
- `huashu-design/references/editable-pptx.md`

4. **Install dependencies locally**

```bash
npm install playwright sharp pdf-lib jspdf
npx playwright install chromium
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip playwright
.venv/bin/python -m playwright install chromium
```

5. **Build lesson generator**

Use structured JSON/YAML/Markdown lesson input. At minimum include:

- `lessonTitle`
- `level`
- `durationMinutes`
- `audience`
- `learningObjectives`
- `keyVocabulary`
- `lessonFlow`
- `assessment`
- `homework`

For Adam's Vietnamese-university Chinese decks, generate a separate `教师手册.md` for prep notes. Do **not** put teacher tips, source-page notes, tool/theme branding, or internal audience labels on classroom slides.

6. **Generate outputs**

- Browser HTML deck: `index.html`
- Source slide files: `slides/*.html`
- Teacher guide: `TEACHER_GUIDE.md`
- PDF via `huashu-design/scripts/export_deck_pdf.mjs`
- Classroom entry: `<lesson-root>/index.html`
- HTML presenter: `slides/index.html` (primary classroom tool)

### Prototype lesson workflow from a textbook PDF

When Adam asks for a prototype deck from a PDF lesson before generating the full lesson/course:

1. Locate the lesson page range first. If PDF text extraction is garbled, render a contact sheet of early pages and use visual inspection/OCR to identify where the target lesson starts/ends.
2. Extract only the requested lesson pages; do not generate all lessons until Adam approves the style.
3. If a visual theme repo is provided, clone/inspect it and translate its design tokens into the huashu-compatible HTML source rather than depending on the theme repo as a runtime dependency.
4. Build a small style prototype (often 5–8 slides) with enough real lesson content to judge typography, density, bilingual handling, and classroom flow.
5. Export HTML screenshots, PDF, then visually QA and fix issues before delivery.

See `references/lesson-pdf-kami-prototype.md` for a concrete Lesson 1 + Kami prototype workflow and pitfalls.

For Adam's newer pastel pinyin reference style, see `references/pinyin-reference-style-prototype.md` for copyright-safe adaptation rules, prototype slide shape, and Huashu export lessons.

When expanding an approved prototype into a full editable PPTX, see `references/full-lesson-pdf-to-pptx-vietnamese-university.md` for the proven full-lesson workflow, QA pitfalls, and verification snippets.

7. **Verify before final response**

Run the full build, open slides with Playwright, validate generated files, and visually inspect representative screenshots/contact sheets. Do not export a PDF during drafting. Ask Adam whether the design and content are finalized before exporting a clean PDF backup.

## HTML Presenter (Classroom Use)

The HTML presenter is the primary classroom tool. No PPTX needed.

Features:
- Fullscreen 16:9 (press F)
- Left slide thumbnail sidebar with live previews
- Click any thumbnail to jump to that slide
- Thumbnail sidebar auto-minimizes in presentation mode and appears when the cursor moves to the left edge
- Pen/highlighter with color swatches
- Pixel and object eraser
- Text box annotations (click T, click to place, type, resize, drag via handle)
- Undo (Z)
- Per-slide drawing/text persistence during session
- PDF download with all annotations included
- Live PDF export must be opened from `http://127.0.0.1` / `localhost`, not direct `file://`; if opened from `file://`, show a clear localhost instruction and do not leave the export overlay stuck.
- Keep iframe, drawing canvas, text annotations, and hotspot overlays inside one fixed `960×540` `.slide-surface`; scale that single surface in fullscreen so annotations do not disappear or drift.
- Guard `exportPDF()` with slide-load timeouts and `try/catch/finally` cleanup so blocked iframe access or failed resources are visible errors, not infinite progress.
- Arrow keys / Space for navigation

Build steps after any slide changes:
1. Open the lesson-root `index.html`; confirm it launches `slides/index.html`, then verify navigation, thumbnails, and annotation tools.
2. During drafting, use screenshots/contact sheets for QA. Use the presenter's `📥 PDF` button for annotated classroom export only when needed, and run `node scripts/export-slides-pdf.mjs --slides-dir <slides-dir>` for a clean PDF backup only after Adam confirms finalization.

## Verification Checklist

Before saying the system is ready:

- [ ] The task's artifact, success gate, source context, and verification method were identified before implementation
- [ ] Project-local harness files were read: `AGENTS.md`, `memory/project-memory.md` if present, relevant `.kiro/steering`, and relevant `.kiro/skills/*`
- [ ] `huashu-design/` exists and has the expected scripts/references
- [ ] Node dependencies installed successfully
- [ ] Python Playwright environment works for `verify.py`
- [ ] Sample lesson input exists
- [ ] Generator creates `index.html` and `slides/*.html`
- [ ] Playwright opens the deck and captures all slides
- [ ] No JavaScript page errors
- [ ] Console is clean or warnings are understood and non-blocking
- [ ] If Adam has confirmed finalization, PDF export succeeds
- [ ] Generated slides do not contain Gamma/legacy deck-tool wording unless explicitly requested
- [ ] For Vietnamese university materials, visible instructional labels are Vietnamese and Chinese text is Simplified Chinese (not Traditional); pinyin is allowed for pronunciation
- [ ] Chinese font fallbacks prefer SC/Simplified fonts such as `PingFang SC`, `Noto Sans/Serif SC`, `Microsoft YaHei`, or `Songti SC`, not TC/JhengHei defaults
- [ ] Visual screenshot check passes for at least one representative slide; for full lesson decks, inspect multiple sections or delegate full screenshot QA
- [ ] For full lesson decks, fix visual-QA findings, rebuild, and re-run screenshot/contact-sheet QA before delivery; export PDF only after Adam confirms finalization
- [ ] README/SOP explains how to create future lessons

## Common Pitfalls

### 1. `package.json` with `"type": "module"` can break huashu scripts

`export_deck_pptx.mjs` imports `scripts/html2pptx.js` using CommonJS `require`. If the project root has `"type": "module"`, Node may treat `html2pptx.js` as ESM and fail with:

```text
require is not defined in ES module scope
```

Fix: remove `"type": "module"` from the project `package.json`, or isolate/copy the huashu scripts into a folder with CommonJS semantics.

### 2. Visual verification matters even after tests pass

A generated deck can be technically valid while still having layout bugs. Inspect screenshots. In one setup, tests passed but the teacher note overlapped the footer; moving the note upward fixed it.

### 3. Avoid saying “ready” before finalization checks are verified

HTML generation alone is not enough. A complete system must prove HTML preview, validation, and visual QA work. PDF export is a finalization step only after Adam confirms the deck is finalized.

### 4. Keep generated content separate from upstream huashu-design

Do not edit upstream files unless the task explicitly requires changing huashu-design itself. Put project-specific generators, inputs, outputs, and README at the system root.

### 5. Do not scan `node_modules` for content policy checks

If validating that generated teaching content does not contain legacy wording, exclude `node_modules`, `.git`, and `.venv`. Libraries may contain unrelated words like “gamma correction,” causing false positives.

### 6. Vietnamese university materials: Vietnamese + Simplified Chinese

Adam corrected this during the Lesson 1 prototype work: teaching materials are for Vietnamese universities. Do not use English labels as a default and do not use Traditional Chinese unless explicitly requested.

Implementation rules:

- Vietnamese: slide labels, classroom instructions, activity names, section titles, assessment, homework, README/SOP wording, and visible student-facing explanations.
- Simplified Chinese: target learning content only, such as lesson titles, vocabulary, dialogues, sentence patterns, grammar examples, cultural terms, and hanzi-writing characters. Do not use Chinese as visible classroom instruction labels.
- Pinyin: acceptable as pronunciation support.
- Pinyin word grouping: pinyin of a multi-syllable word must be written together without space between syllables of one word. Correct: "dìèr kè · nǐ shì nǎguó rén?" Wrong: "dì èr kè · nǐ shì nǎ guó rén?" Each vocabulary word's pinyin is one unit. Sentence pinyin groups by word boundaries. Verify correct word-boundary pinyin using Google Translate or an LLM.
- Regular lesson structure excludes pinyin modules: pinyin is taught in separate pinyin lessons. For normal `regular` lessons, do not add `Pinyin` or `Luyện pinyin` modules to the classroom lesson structure, even if textbook pages contain pronunciation/pinyin exercises. Those pages may remain as raw extracted textbook exercises for teacher review, but they are not classroom teaching modules for regular lessons.
- Vocabulary extraction: if a textbook vocabulary item has indented component words underneath it, extract those component words as separate vocabulary records too. Keep printed page mapping and note the parent word in `raw_source_text`; e.g. `办公室` includes `办公`, `电话` includes `电` and `话`, `手机` includes `手`.
- Grammar explanation style: absorb the textbook explanation, then rewrite it in simple Vietnamese for beginner students. Prefer plain sentence patterns, examples, and Vietnamese/Chinese contrast over dense grammar terminology.
- Classroom slides must not show internal/source/tool/audience labels such as `Kami × Huashu`, `Nguồn: trang...`, `Dành cho sinh viên...`, or implementation notes.
- Teacher-prep guidance must not appear on classroom PPT/PDF slides. Put teacher tips, lesson flow notes, and prep explanations in a separate file named `教师手册`.
- Use Lesson 10 `output/book-1/lesson-10/slides/01-cover.html` as the canonical cover template for all future lessons. Reuse its cover layout and visual language; only replace lesson number, Chinese/pinyin title, Vietnamese title, topic chips, and topic image.
- Future regular lessons must use Lesson 01 as the strict section/template baseline: cover, objectives, warmup, vocabulary divider, vocab cards + sample sentence cards, vocab practice divider, mini quiz, comprehensive practice, text divider, dialogue with avatars, hanzi writing, supplement/culture, homework divider, exercises list, and closing. Add only lesson-specific extra sections, such as grammar for Lesson 10. Generated `Luyện tập tổng hợp` and `Văn hóa bổ sung` slides omit `.page-indicator` because they are classroom additions, not direct textbook pages.
- Reusable slide types must come from Lesson 01 templates, not fresh designs. Reuse Lesson 01 dividers, objectives layout, homework divider, exercise-list structure, dialogue avatar layout, and hanzi-writing layout; only adjust lesson-specific content, printed textbook page numbers, item counts, and images.
- Use the same Lesson 01 divider templates across all lessons by default. Only swap page numbers, counts, and images Adam explicitly asks to customize for a lesson-specific theme.
- When a slide is not a fixed Lesson 01 template, list, comparison, or dialogue layout, prefer centering the main content vertically and horizontally. Culture notes, single concepts, example sentences, and practice prompts should feel centered when possible. Use left-center layouts only when they make the content easier to scan.
- Do not squeeze dense practice into one slide. Split activities into more slides when needed; vocabulary matching should use about 4-5 words per slide.
- Practice activities should be varied and can include listening, speaking, reading, and writing when the lesson content supports it. Comprehensive practice and grammar practice should reference HSK and TOCFL item formats, with a preference for practical daily-use situations. Even when a question style is inspired by TOCFL, this system outputs Simplified Chinese unless Adam explicitly asks otherwise.
- Prefer simple interactive slide/webapp formats when useful. For example, use one multiple-choice question per slide with clickable options; correct choices show success feedback, and wrong choices prompt the student to try again.
- Student operation text and activity instructions must be natural Vietnamese, such as `Ghép nối`, `Bài tập về nhà`, `Tập viết chữ Hán`, `Tập từ vựng`, `Luyện tập tổng hợp`, and `Hội thoại`. Lesson 01 reusable divider templates may keep their fixed Chinese section heading (`生词`, `词汇练习`, `综合练习`, `课文`, `写汉字`, `补充学习`, `回家作业`) as part of the template; do not redesign those dividers from scratch.
- Before delivery, verify every HTML slide for visible overflow. Text must not spill outside the 16:9 slide, background image panels, cards, dialogue bubbles, matching tiles, buttons, or any fixed-size container. Fix by splitting content or changing layout, not by clipping hidden text.
- Hanzi-writing slides must reuse Lesson 01's title, layout, method, and HanziWriter stroke animation. Do not replace stroke animation with static characters. Use Lesson 01 slowed timing: `strokeAnimationSpeed: 0.575` and `delayBetweenStrokes: 360`, unless Adam changes the Lesson 01 template itself.
- VP steps 1-8 must carry these rules into generated lesson structure/activity/database metadata. Do not leave the cover, divider, activity-design, Simplified Chinese, pinyin, image, density, or hanzi-writing requirements as manual slide cleanup only.
- Use consistent student-facing titles, e.g. `Mục tiêu bài học`, `Từ vựng`, `Ngữ âm`, `Luyện tập`, `Tập viết chữ Hán`, `Kiểm tra cuối bài`.
- Vocabulary slides should include word type labels in Vietnamese (`đại từ`, `tính từ`, `số từ`, `phó từ`, `danh từ`, etc.) unless the user says otherwise.
- Avoid visible English teaching words such as `Teacher Guide`, `Design direction`, `Vocabulary`, `Example`, `Tone 1`; translate them to natural Vietnamese unless they are unavoidable brand/repo names.
- Avoid Traditional-oriented font fallbacks (`PingFang TC`, `Noto Sans TC`, `Microsoft JhengHei`) in generated courseware; use SC-oriented fallbacks.
- Visual QA can misread the requirement as English/Traditional; treat Adam's stated requirement as authoritative: Vietnamese + Simplified Chinese.

### 7. Vocabulary slide template and image workflow

Lesson 01 is the reusable template for future regular lessons. For single-word vocabulary slides, copy the structure from `output/book-1/lesson-01/slides/05-vocab-ni.html` and substitute only the word data and image filename.

Required vocab slide layout:

- Centered vertical stack: image, pinyin, large Simplified Chinese character, Vietnamese meaning, hán việt, word type.
- Image frame is rectangular 16:9, not circular: `288×162`, `border-radius:14px`, `background:#F0FAFA`, `border:2px solid #5AACAC`.
- Use `.vocab-img` and `<img src="assets/vocab-images/vocab-*.png" alt="<Simplified Chinese>">`.
- Keep the `XX/YY` counter in the top-right. `YY` is the actual number of standalone vocab slides.
- Vocab slide `.page-indicator` shows the printed textbook page from the lesson database, such as `Trang 1`; it is never a slide number or PDF page. `source_page` must mean printed textbook page. If the source PDF position differs, store it separately as `source_pdf_page` and never display it as `Trang ...`. Do not add separate `.source` footers, internal labels, examples, or teacher notes. Examples go on separate sample sentence slides.
- Do not use the old `.vocab-illust` circular crop, 140×140 icon frame, left-side card layout, teal vector icon style, or decorative blobs.

Vocabulary divider image:

- Use the Lesson 01 page 04 pattern: soft textbook desk scene with an open book.
- The book has only `汉` on the left page and `语` on the right page, placed inside the book page margins.
- This generic `汉语` image can be reused across regular lessons. Do not invent random Chinese filler or add extra generated text.

Sample sentence slides:

- Every `sample-*` slide with menu label `MẪU CÂU` has the main sentence card plus a small bottom-left circular support image frame.
- Use `.sample-spot` at `left:52px;bottom:28px;width:116px;height:116px;border-radius:50%;overflow:hidden`.
- The frame must sit centered on the pale background circle graphic, not floating above it.
- The image must match the sample phrase, not only the base vocabulary word. Reuse the vocab image when it directly fits; generate a sentence-specific soft textbook image when needed.

Vocabulary image generation:

1. Run `python scripts/generate-vocab-images.py --database <lesson database> --output-dir <lesson>/slides/assets/vocab-images --prompts-file <lesson>/slides/assets/vocab-images/prompts.json`.
2. Generate one image per prompt.
3. Save final images as 16:9 PNGs, ideally `576×324`, in `slides/assets/vocab-images/`.
4. Use soft textbook line-art: thin grey-blue outlines, muted pastel fills, white/pale-grey background, gentle low-contrast shadows.
5. Do not include text, letters, numbers, Chinese characters, labels, or watermarks inside images.
6. Avoid thick teal outlines, circular icons, glossy vector art, stickers, chibi proportions, harsh colors, and abstract blob backgrounds.

Shared deck watermark:

- Canonical reusable source: `design/shared-slide-assets/brand/logo-watermark.png`.
- Copy it into every lesson as `slides/assets/brand/logo-watermark.png` so the lesson folder is portable.
- `slide-base.css` renders the watermark as a top overlay above slide content at `opacity:.02` with `pointer-events:none`.
- This deck watermark is separate from generated vocab images. Vocab images still must not contain in-image watermarks.

Vocabulary image QA:

- After insertion, render every vocab slide with Playwright screenshots/contact sheets. Do not use PDF export for drafting QA.
- Check the slide word against the displayed image. If a mismatch exists, regenerate only that image and re-render the slide.
- Lesson 01 canonical mappings: `一` = one raised finger, `五` = five fingers, `八` = Chinese eight hand gesture with thumb and index extended and other fingers folded.
- Lesson 01 `马` uses a white horse. Preserve special concept decisions like this in the prompt generator and local docs.

### 8. Full lesson decks need deeper QA than prototypes

For a full lesson deck, automated Huashu verification only proves that the deck opens. It does not catch pedagogy/content/layout issues. Run screenshot QA across the full deck and fix common problems before final delivery:

- Blank grid cells from fixed-column practice tables with fewer items than columns.
- Accidental English labels in Vietnamese university materials.
- OCR/model drafting mistakes in pinyin, Vietnamese meanings, or Chinese examples.
- Vietnamese typos such as `hơi` becoming `hỏi`/`hồi`; preserve valid phrases like `chào hỏi`.
- Layout monotony in long decks; vary dense content, practice, and check slides.
- Internal version labels that look unpolished on classroom slides.

## Session Reference

See `references/huashu-teaching-system-setup.md` for a compact record of a proven setup sequence, commands, failure mode, and validation results.


---

## Reference Files

#[[file:references/full-lesson-pdf-to-pptx-vietnamese-university.md]]
#[[file:references/pinyin-reference-style-prototype.md]]
#[[file:references/vp-pinyin-lesson-database-and-redesign.md]]
#[[file:references/huashu-teaching-system-setup.md]]
#[[file:references/lesson-pdf-kami-prototype.md]]
