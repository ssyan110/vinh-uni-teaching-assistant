# Bài 1 · 你好 — Teacher Presentation

## How to use

1. From the lesson root, open `../index.html` in any modern browser (Chrome, Edge, Safari, Firefox)
2. Press **F** for fullscreen presentation mode
3. Use **← →** arrow keys to navigate
4. Use the left thumbnail sidebar to preview slides and jump directly to any slide

In presentation mode, the thumbnail sidebar minimizes to the left edge. Move the cursor to the left side of the screen to show it.

## Annotation tools (in-class use)

| Key | Tool |
|-----|------|
| P | Pen (draw on slide) |
| H | Highlighter |
| E | Eraser |
| T | Text box (click to place, type notes) |
| Z | Undo |
| C | Clear current slide |
| Esc | Exit fullscreen / deactivate tools |

- Color swatches: click to change pen/highlighter color
- Text box: hover to see size controls (−/+) and delete (×). Drag via the ✥ handle.
- Drawings and text boxes persist per-slide during the session (lost on page refresh).

## PDF download

Click the **📥 PDF** button to download all slides as a PDF with your annotations included.

The PDF button renders the current slide HTML live with `html2canvas` and jsPDF. It does not use `slides-data.js`.

Manual commands:

```bash
npm run lesson1:pdf
npm run lesson1:watch
```

## Requirements

- Modern browser (Chrome recommended)
- Internet connection (for fonts and icons on first load; browser caches them after)
- No installation needed. Just open the HTML file.

## Files in this folder

| File | Purpose |
|------|---------|
| `index.html` | Main presenter runtime, launched by the lesson-root `../index.html` |
| `01-cover.html` ... `55-closing.html` | Individual slide files (55 total, sequentially numbered) |
| `README.md` | This file |

## Reusable Lesson 01 template rules

Use this folder as the source template for future regular lessons.

Full reusable workflow: `../../../../docs/lesson-slide-template-guide.md`.

### Shared watermark

The reusable logo source for all future lessons is:

```text
../../../../design/shared-slide-assets/brand/logo-watermark.png
```

For each lesson, copy it into:

```text
slides/assets/brand/logo-watermark.png
```

`assets/slide-base.css` places this watermark as a top overlay above slide content at `2%` opacity with `pointer-events:none`. It is a deck-level watermark, not part of vocabulary images.

### Vocabulary slides

`05-vocab-ni.html` is the canonical single-word vocabulary slide template. Future vocab slides should keep this structure:

- Centered vertical stack: image, pinyin, large Simplified Chinese character, Vietnamese meaning, hán việt, word type.
- Rectangular 16:9 image frame: `.vocab-img`, `288×162`, 14px radius, teal border.
- Top-right counter: `XX/YY`, where `YY` is the actual standalone vocab slide count.
- `.page-indicator` shows the printed textbook page from the database, not the slide number or PDF page.
- No separate `.source` footer, no teacher notes, no examples inside the vocab card.
- Do not use circular image crops, left-side icon cards, or `.vocab-illust`.

### Vocabulary divider image

`04-divider-vocab.html` uses `assets/photos/vocab-divider.png` as the reusable divider image pattern: a soft textbook desk scene with an open book. The book has only `汉` on the left page and `语` on the right page, placed inside the page margins. This generic `汉语` image can be reused across regular lessons. Do not use random Chinese filler or add extra generated text.

### Vocabulary images

Final images live in `assets/vocab-images/` and are inserted by filename in the matching vocab slide.

Image style:

- 16:9 PNG, usually `576×324`.
- Soft textbook line-art, thin grey-blue outlines, muted pastel fills.
- White or very pale grey background, gentle low-contrast shadows.
- No in-image text, letters, numbers, Chinese characters, labels, or watermarks.
- Avoid thick teal icon outlines, decorative blobs, glossy vector art, stickers, chibi proportions, and harsh colors.

Before delivery, render the vocab slides and check every image against the word. Regenerate only mismatched images. Lesson 01 fixed choices: `一` = one raised finger, `五` = five fingers, `八` = Chinese eight hand gesture, `马` = white horse.

Every `MẪU CÂU` sample slide uses a bottom-left circular `.sample-spot` image frame at `left:52px;bottom:28px;width:116px;height:116px`. The frame should sit centered on the pale background circle graphic. The image must match the sample phrase; reuse the vocab image only when it is a direct match.

## Sharing

For classroom use, copy the whole lesson folder so the root `index.html`, `slides/`, `database/`, and `exports/` stay together.
