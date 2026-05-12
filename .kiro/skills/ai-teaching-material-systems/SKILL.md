---
name: ai-teaching-material-systems
description: "Build and verify reusable AI teaching-material production systems: structured lesson inputs, teacher decks, browser HTML presentations, PDF/PPTX exports, teacher guides, and classroom-ready validation. Use huashu-design as Adam's preferred deck/design engine when replacing Gamma-like workflows."
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [teaching, education, slides, pptx, huashu-design, automation, chinese-learning]
    related_skills: [powerpoint, word-document-editing, claude-design, systematic-debugging]
---

# AI Teaching Material Systems

## Overview

Use this skill when Adam wants a complete teaching-material production workflow, not just a single file. The target output is a reusable system that can turn structured lesson content into classroom-ready materials: teacher decks, browser presentations, PDF/PPTX exports, teacher guides, scripts, and verification checks.

For Adam's current preference, all Gamma-like slide-generation content should be replaced with the **huashu-design** repo/workflow. The system should be local, inspectable, low/no-cost where possible, and project repos/systems should live under `~/Development/` like Adam's other projects. Final shareable artifacts or archives can still be copied/exported to `~/Desktop/Hermes Output/` when useful.

## When to Use

Use this skill when the user asks for any of these:

- “AI teaching material system,” “teacher material system,” “courseware system,” or “complete teaching material pipeline”
- Auto-generating teacher-version slides/decks from lesson inputs
- Replacing Gamma-style deck generation with `huashu-design`
- Chinese teaching decks, Vietnamese learner support, teacher run sheets, activity slides, assessment/homework materials
- Browser HTML decks plus PDF/PPTX exports
- “No bugs,” “ready to use,” or similar launch-quality verification for teaching materials

Also load `powerpoint` whenever `.pptx`, deck export, or presentation editing is involved.

## Core Principle for Adam

**Use huashu-design instead of Gamma-related content.**

**Audience/language default:** Adam's teaching materials are for Vietnamese universities. Unless the user explicitly asks otherwise, generated teaching materials should use **Vietnamese + Simplified Chinese**. Avoid Traditional Chinese in courseware. Use Vietnamese for teacher-facing guidance, labels, notes, instructions, and classroom flow; use Simplified Chinese for target-language examples, vocabulary, dialogues, and headings where Chinese is needed. Pinyin can be included as pronunciation support.

Practical interpretation:

- Do not build a workflow that depends on Gamma UI/SaaS as the main generation step.
- Use `https://github.com/alchaincyf/huashu-design.git` as the local design/deck engine.
- Make generated decks HTML-first, then export PDF/PPTX from source.
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

Steps 9–19 start after teacher review/approval and should not be automated as final classroom materials unless Adam explicitly asks. Adam later provided the original planning document with the canonical MVP steps 9–19:

9. 人工審閱: teachers check content, page mapping, teaching order, and answer keys in Google Sheets.
10. 生成老師備課版: generate teacher-facing teaching notes from Approved Data.
11. 生成 Huashu Brief: convert Approved Data into Huashu-compatible slide/deck brief. Original doc said Gamma Brief; replace Gamma with Huashu Design.
12. 生成教師版簡報: use Huashu Design to generate the teacher deck locally as HTML source, not paid slide software.
13. 匯出備份: export PPTX/PDF backups from Huashu.
14. 生成學生版內容: remove teacher tips, internal review info, and in-class exercise answers.
15. 生成作業題庫: create vocabulary, pinyin, hanzi, grammar, and text-related homework/question bank.
16. 題庫審閱: teachers review questions and answers in Google Sheets.
17. 建立學生版與作業: create student version and homework in the chosen student platform/workflow. If Formative is unavailable or paid, keep output as Sheets/CSV/HTML-ready content first.
18. 課堂測試: teach Lesson 1 in class and collect feedback.
19. 回填修正: record issues and improvement suggestions in the Improvement Log.

See `references/vp-pinyin-lesson-database-and-redesign.md` for the Google Sheets-ready VP database shape, auth fallback, copyright-safe reference-design handling, and post-review steps 9–19.

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
        ├── index.html              # browser presentation
        ├── slides/*.html           # source slides
        ├── 教师手册.md                 # prep notes only, not classroom slide content
        ├── teacher-deck.pdf
        ├── teacher-deck-editable.pptx
        └── screenshots/*.png
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
npm install playwright pptxgenjs sharp pdf-lib
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
- Editable PPTX via `huashu-design/scripts/export_deck_pptx.mjs`

### Prototype lesson workflow from a textbook PDF

When Adam asks for a prototype deck from a PDF lesson before generating the full lesson/course:

1. Locate the lesson page range first. If PDF text extraction is garbled, render a contact sheet of early pages and use visual inspection/OCR to identify where the target lesson starts/ends.
2. Extract only the requested lesson pages; do not generate all lessons until Adam approves the style.
3. If a visual theme repo is provided, clone/inspect it and translate its design tokens into the huashu-compatible HTML source rather than depending on the theme repo as a runtime dependency.
4. Build a small style prototype (often 5–8 slides) with enough real lesson content to judge typography, density, bilingual handling, and classroom flow.
5. Export HTML screenshots, PDF, and editable PPTX, then visually QA and fix issues before delivery.

See `references/lesson-pdf-kami-prototype.md` for a concrete Lesson 1 + Kami prototype workflow and pitfalls.

For Adam's newer pastel pinyin reference style, see `references/pinyin-reference-style-prototype.md` for copyright-safe adaptation rules, prototype slide shape, and Huashu/PPTX export lessons.

When expanding an approved prototype into a full editable PPTX, see `references/full-lesson-pdf-to-pptx-vietnamese-university.md` for the proven full-lesson workflow, QA pitfalls, and verification snippets.

7. **Verify before final response**

Run the full build, open slides with Playwright, export PDF/PPTX, validate generated files, and visually inspect at least the cover slide or a representative screenshot.

## PPTX-Safe HTML Rules

If editable PPTX is required, write slides in the huashu-design editable path from the start:

- `body` fixed at `960pt × 540pt`
- Text inside `<p>` or `<h1>`–`<h6>`, not bare text in `<div>`
- No CSS gradients
- No background/border/shadow directly on text tags
- No `div { background-image: ... }`; use `<img>`
- Prefer separate slide files in `slides/*.html`
- Put backgrounds, borders, and shadows on `<div>` containers only. Do **not** style text tags (`<p>`, `h1`–`h6`, `li`) with background/border/shadow; huashu `html2pptx` rejects them.
- For pill/chip UI, use `<div class="pill"><p>text</p></div>`, with the border/background on `.pill` and text styling on `.pill p`.
- Keep content at least 0.5" from slide edges; vocabulary grids often need smaller row padding/font sizes to avoid bottom overflow.

This avoids the common 2–3 hour rewrite trap where a visually rich HTML deck cannot convert to editable PPTX.

## Verification Checklist

Before saying the system is ready:

- [ ] `huashu-design/` exists and has the expected scripts/references
- [ ] Node dependencies installed successfully
- [ ] Python Playwright environment works for `verify.py`
- [ ] Sample lesson input exists
- [ ] Generator creates `index.html` and `slides/*.html`
- [ ] Playwright opens the deck and captures all slides
- [ ] No JavaScript page errors
- [ ] Console is clean or warnings are understood and non-blocking
- [ ] PDF export succeeds
- [ ] Editable PPTX export succeeds
- [ ] PPTX slide count matches source slide count
- [ ] Generated slides do not contain Gamma/legacy deck-tool wording unless explicitly requested
- [ ] For Vietnamese university materials, visible instructional labels are Vietnamese and Chinese text is Simplified Chinese (not Traditional); pinyin is allowed for pronunciation
- [ ] Chinese font fallbacks prefer SC/Simplified fonts such as `PingFang SC`, `Noto Sans/Serif SC`, `Microsoft YaHei`, or `Songti SC`, not TC/JhengHei defaults
- [ ] Visual screenshot check passes for at least one representative slide; for full lesson decks, inspect multiple sections or delegate full screenshot QA
- [ ] For full lesson decks, fix visual-QA findings, rebuild, and re-run PDF/PPTX export before delivery
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

### 3. Avoid saying “ready” before exports are verified

HTML generation alone is not enough. A complete system must prove HTML preview, PDF export, PPTX export, and validation all work.

### 4. Keep generated content separate from upstream huashu-design

Do not edit upstream files unless the task explicitly requires changing huashu-design itself. Put project-specific generators, inputs, outputs, and README at the system root.

### 5. Do not scan `node_modules` for content policy checks

If validating that generated teaching content does not contain legacy wording, exclude `node_modules`, `.git`, and `.venv`. Libraries may contain unrelated words like “gamma correction,” causing false positives.

### 6. Vietnamese university materials: Vietnamese + Simplified Chinese

Adam corrected this during the Lesson 1 prototype work: teaching materials are for Vietnamese universities. Do not use English labels as a default and do not use Traditional Chinese unless explicitly requested.

Implementation rules:

- Vietnamese: slide labels, classroom instructions, assessment, homework, README/SOP wording.
- Simplified Chinese: lesson headings, vocabulary, dialogues, sentence patterns, Chinese labels where useful.
- Pinyin: acceptable as pronunciation support.
- Classroom slides must not show internal/source/tool/audience labels such as `Kami × Huashu`, `Nguồn: trang...`, `Dành cho sinh viên...`, or implementation notes.
- Teacher-prep guidance must not appear on classroom PPT/PDF slides. Put teacher tips, lesson flow notes, and prep explanations in a separate file named `教师手册`.
- Use consistent student-facing titles, e.g. `Mục tiêu bài học`, `Từ vựng`, `Ngữ âm`, `Luyện tập`, `Tập viết chữ Hán`, `Kiểm tra cuối bài`.
- Vocabulary slides should include word type labels in Vietnamese (`đại từ`, `tính từ`, `số từ`, `phó từ`, `danh từ`, etc.) unless the user says otherwise.
- Avoid visible English teaching words such as `Teacher Guide`, `Design direction`, `Vocabulary`, `Example`, `Tone 1`; translate them to natural Vietnamese unless they are unavoidable brand/repo names.
- Avoid Traditional-oriented font fallbacks (`PingFang TC`, `Noto Sans TC`, `Microsoft JhengHei`) in generated courseware; use SC-oriented fallbacks.
- Visual QA can misread the requirement as English/Traditional; treat Adam's stated requirement as authoritative: Vietnamese + Simplified Chinese.

### 7. Full lesson decks need deeper QA than prototypes

For a full lesson PPTX, automated Huashu verification only proves that the deck opens and exports. It does not catch pedagogy/content/layout issues. Run screenshot QA across the full deck and fix common problems before final delivery:

- Blank grid cells from fixed-column practice tables with fewer items than columns.
- Accidental English labels in Vietnamese university materials.
- OCR/model drafting mistakes in pinyin, Vietnamese meanings, or Chinese examples.
- Vietnamese typos such as `hơi` becoming `hỏi`/`hồi`; preserve valid phrases like `chào hỏi`.
- Layout monotony in long decks; vary dense content, practice, and check slides.
- Internal version labels that look unpolished on classroom slides.

## Session Reference

See `references/huashu-teaching-system-setup.md` for a compact record of a proven setup sequence, commands, failure mode, and validation results.
