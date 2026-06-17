---
name: pinyin-vocab-contact-sheet-images
description: Generate and insert pinyin vocabulary images by using Google Chrome with ChatGPT to create one big contact sheet, then crop it into lesson asset slots and QA the deck.
---

# Pinyin Vocab Contact Sheet Images

Use this skill when Adam asks to generate or replace pinyin vocabulary images for an existing pinyin lesson deck.

## Default Tool

Use Google Chrome as the UI surface for ChatGPT image generation.

- Prefer the existing Chrome profile/session where Adam is already signed in.
- If Computer Use is requested, operate Google Chrome with Computer Use.
- Do not use ChatGPT Atlas as the default for this workflow unless Adam explicitly asks.
- If a Chrome ChatGPT conversation hangs, open a fresh Chrome tab at `https://chatgpt.com/` and retry with one compact prompt.

## Workflow

1. Identify the lesson root, for example `output/pinyin/pinyin-04`.
2. Read `slides/assets/asset-manifest.json` and list vocabulary assets in record order.
3. Build one prompt for one large contact sheet, not one image per vocabulary item.
4. Ask ChatGPT in Google Chrome to generate one single contact sheet image:
   - exact grid, such as `7 columns x 3 rows = 21 panels`
   - equal crop-safe cells
   - thin pale grid only
   - no labels
   - no text, letters, numbers, Chinese characters, pinyin, symbols, or watermarks inside panels
   - soft Chinese textbook style, thin grey-blue outlines, muted pastel fills, pale background, gentle shadows
   - vocabulary concepts ordered left-to-right, top-to-bottom by record ID
5. Save the generated sheet under `<lesson-root>/exports/qa/generated-vocab-source/`.
6. Preview crop mapping before writing:
   ```bash
   npm run assets:crop-contact-sheet -- \
     --lesson output/pinyin/pinyin-04 \
     --sheet output/pinyin/pinyin-04/exports/qa/generated-vocab-source/pinyin-04-vocab-contact-sheet.png \
     --records V001,V002,V003 \
     --cols 7 \
     --rows 3 \
     --dry-run
   ```
7. Crop the sheet into the existing asset slots:
   ```bash
   npm run assets:crop-contact-sheet -- \
     --lesson output/pinyin/pinyin-04 \
     --sheet output/pinyin/pinyin-04/exports/qa/generated-vocab-source/pinyin-04-vocab-contact-sheet.png \
     --records V001,V002,V003 \
     --cols 7 \
     --rows 3
   ```
8. Run asset QA:
   ```bash
   npm run assets:qa -- output/pinyin/pinyin-04
   ```
9. Render affected vocabulary grid slides and representative flashcards:
   ```bash
   npm run slides:screenshot -- --slides-dir output/pinyin/pinyin-04/slides --slide 13-vocabulary-1.html
   ```
10. Make or inspect a QA contact sheet and verify:
    - every image matches the word
    - no text or symbols appear inside generated image cells
    - images are not placeholders
    - slide layout still looks clean
11. Run system validation for the lesson:
    ```bash
    node scripts/validate-system.mjs --lesson output/pinyin/pinyin-04
    ```

## Prompt Pattern

Use compact prompts in Chrome so the composer does not split the message:

```text
Create ONE BIG CONTACT SHEET image, exactly 7 columns x 3 rows = 21 equal square panels, crop-safe, thin pale grid only, no labels. Soft Chinese textbook illustration style, thin grey-blue outlines, muted pastel fills, pale background, gentle shadows. Absolutely no text, no letters, no Chinese characters, no pinyin, no numbers, no symbols, no watermark inside panels. Fill panels left-to-right/top-to-bottom: 1 <concept>, 2 <concept>, ... 21 <concept>. One single generated image contact sheet, not separate images.
```

## Important

- Do not generate one image at a time for pinyin vocabulary batches unless Adam explicitly asks.
- Do not crop a malformed sheet just because it exists. Check the grid and concept order first.
- If the sheet uses a different grid, pass matching `--cols` and `--rows` only when all records are still present and in order.
- Keep the original downloaded/generated sheet in `exports/qa/generated-vocab-source/` for traceability.
- Do not export a PDF during image drafting.
