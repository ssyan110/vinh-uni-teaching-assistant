# Huashu Teaching System Setup Reference

Session-derived reference for building Adam's local AI teaching material system with huashu-design.

## Goal

Create a complete AI teaching-material system that generates teacher-version materials without relying on Gamma-style GUI/SaaS deck generation. Use:

```bash
https://github.com/alchaincyf/huashu-design.git
```

## Proven Workspace

```bash
~/Desktop/Hermes Output/ai-teaching-material-system
```

## Proven Setup Commands

```bash
BASE="$HOME/Desktop/Hermes Output/ai-teaching-material-system"
mkdir -p "$BASE"
cd "$BASE"
git clone https://github.com/alchaincyf/huashu-design.git
npm install playwright pptxgenjs sharp pdf-lib
npx playwright install chromium
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip playwright
.venv/bin/python -m playwright install chromium
```

## Important huashu-design Files to Read

- `README.md` — install/capabilities overview
- `SKILL.md` — design workflow and asset protocol
- `references/slide-decks.md` — HTML-first deck architecture
- `references/editable-pptx.md` — PPTX-safe HTML constraints
- `scripts/export_deck_pdf.mjs` — PDF export
- `scripts/export_deck_pptx.mjs` — editable PPTX export
- `scripts/verify.py` — Playwright visual/console verification

## Proven Output Shape

```text
output/sample-teacher-deck/
├── index.html
├── slides/
│   ├── 01-cover.html
│   ├── 02-objectives.html
│   ├── 03-vocabulary.html
│   ├── 04-pattern.html
│   ├── 05-flow.html
│   ├── 06-practice.html
│   └── 07-assessment.html
├── screenshots/
├── TEACHER_GUIDE.md
├── teacher-deck.pdf
└── teacher-deck-editable.pptx
```

## Build Commands Used

```bash
npm run create:sample
.venv/bin/python huashu-design/scripts/verify.py output/sample-teacher-deck/index.html --slides 7 --output output/sample-teacher-deck/screenshots --wait 3000
node huashu-design/scripts/export_deck_pdf.mjs --slides output/sample-teacher-deck/slides --out output/sample-teacher-deck/teacher-deck.pdf --width 1280 --height 720
node huashu-design/scripts/export_deck_pptx.mjs --slides output/sample-teacher-deck/slides --out output/sample-teacher-deck/teacher-deck-editable.pptx
node scripts/validate-system.mjs
```

## Failure Encountered and Fix

### Symptom

`export_deck_pptx.mjs` failed with:

```text
require is not defined in ES module scope
This file is being treated as an ES module because package.json contains "type": "module".
```

### Root Cause

The project root had `"type": "module"`. Huashu's `export_deck_pptx.mjs` uses `createRequire()` to load `scripts/html2pptx.js`, and that `.js` file needs CommonJS semantics.

### Fix

Remove `"type": "module"` from the project `package.json`. `.mjs` project scripts still run as ESM, while huashu's `.js` translator remains require-compatible.

## Visual Bug Encountered and Fix

### Symptom

Playwright and export checks passed, but visual inspection of the cover screenshot showed the yellow teacher-note callout overlapping the footer.

### Fix

Move the teacher note upward, e.g. from:

```css
.note { bottom: 0; }
```

to:

```css
.note { bottom: 34pt; }
```

Then regenerate and re-run full build.

## Validation Standard

A system is not ready until all of these pass:

- HTML deck generated
- Playwright screenshots generated for all slides
- No JavaScript page errors
- Console clean or warnings understood
- PDF exported
- PPTX exported
- PPTX slide count equals expected slide count
- Visual inspection of representative screenshot passes
- Generated project content contains no unwanted legacy deck-tool wording

## False Positive Warning

Do not scan `node_modules`, `.git`, or `.venv` for deck-tool wording/content policy checks. Libraries can contain unrelated terms, e.g. image-processing docs mentioning “gamma correction.”
