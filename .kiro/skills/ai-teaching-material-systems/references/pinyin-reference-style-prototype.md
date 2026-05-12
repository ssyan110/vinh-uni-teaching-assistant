# Pinyin reference-style prototype workflow

Use when Adam asks for a small pinyin lesson prototype based on an attached design reference.

## Design constraints

- Treat attached PDFs as style inspiration only; never copy exact artwork, title lettering, layout, color values, contact/copyright text, or branding.
- For Vietnamese university Chinese materials, visible classroom slides are Vietnamese + Simplified Chinese. Pinyin is allowed for pronunciation support.
- Keep teacher prep/source/tool notes out of classroom slides. Put prep in `教师手册.md` only when needed.

## Prototype shape

A 5–8 slide prototype is enough to judge design:

1. Cover with a large pinyin/topic anchor, e.g. `Pinyin Lesson 1` + `你好 nǐ hǎo`.
2. Objectives / lesson map using student-facing Vietnamese.
3. Pinyin concept slide with color-coded thanh mẫu / vận mẫu / thanh điệu.
4. Tone explanation slide.
5. Practice/game slide with a few real drills.

## Copyright-safe visual language

Good adaptation pattern:

- Pastel classroom backgrounds.
- Rounded cards and sticker-like labels.
- Original CSS/vector doodles: pencil, flashcard, notebook, tone cards.
- Color-coded pinyin concepts:
  - thanh mẫu: blue
  - vận mẫu: coral/orange
  - thanh điệu: green
  - vocabulary: purple
  - practice: yellow/cream

Avoid copying:

- exact illustrations from the reference
- exact compositions from the reference
- `ai mandarin` or other source branding
- copyright/contact/footer text

## Huashu / PPTX export lessons

- Keep slides fixed at `960pt × 540pt`.
- Avoid CSS `box-shadow` if it creates repeated `shadow.opacity can only be 0-1` warnings during PPTX export; use solid outlines or offset duplicate shapes instead.
- Do not put classroom-slide footers like `Bản mẫu thiết kế` or `Vietnamese + 简体中文` if Adam wants clean student-facing slides.
- HTML viewer counters are okay in screenshots but are not exported slide content; mention this when visual QA flags the black counter overlay.

## Verification

Run the full prototype loop before delivery:

```bash
node scripts/create-<prototype>.mjs
.venv/bin/python huashu-design/scripts/verify.py output/<slug>/index.html --slides N --output output/<slug>/screenshots --wait 3000
node huashu-design/scripts/export_deck_pdf.mjs --slides output/<slug>/slides --out output/<slug>/<slug>.pdf --width 1280 --height 720
node huashu-design/scripts/export_deck_pptx.mjs --slides output/<slug>/slides --out output/<slug>/<slug>-editable.pptx
```

Then visually QA at least cover, concept, and practice slides; fix Vietnamese accents such as `CẶP ÂM DỄ NHẦM` and `Nghe và giơ thẻ` before final export.
