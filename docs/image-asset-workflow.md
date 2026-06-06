# Image Asset Workflow

This workflow is required for every lesson with classroom slides.

## Why This Exists

Images were previously handled after database generation. That caused repeated manual work: generate prompts, create images, edit slide HTML, retake screenshots, then fix mismatches one by one.

The current workflow treats images as lesson data:

```text
VP database image metadata
→ slides/assets/asset-manifest.json
→ slide generation or image replacement
→ asset QA report
→ screenshot/contact-sheet visual QA
```

New lesson decks start with blank, correctly sized placeholder image files. Do not generate AI images during initial slide creation. Generate real images only when Adam asks for them.

## Required Database Fields

VP steps 1-8 must carry image metadata for records that need classroom visuals:

| Field | Use |
|---|---|
| `image_role` | `vocabulary_image`, `sample_sentence_support`, `cover_topic`, `divider_photo`, `culture_image`, or blank |
| `image_prompt` | Image generation prompt or reusable asset description |
| `image_file` | Final lesson-local file path or filename when known |
| `image_reuse_from` | Shared asset path when reusing an approved image |
| `image_status` | `placeholder_needs_generation`, `needs_generation`, `existing_asset_preserved`, `generated`, `ready_for_visual_qa`, `approved`, or `needs_regeneration` |
| `image_semantic_check` | Plain check, for example: `Image must clearly show one raised finger` |

Do not leave image decisions only in `prompts.json` or slide HTML.

## Standard Commands

Build the manifest after database generation, after real image replacement, and for new/regenerated lessons. Do not run this just for a title or wording-only slide edit:

```bash
npm run assets:manifest -- output/book-1/lesson-XX
```

Run asset QA before delivering a new/regenerated lesson or an image-related edit. A wording-only slide edit should use a single-slide screenshot check instead:

```bash
npm run assets:qa -- output/book-1/lesson-XX
```

Replace a vocabulary image without editing slide HTML by hand:

```bash
npm run assets:replace -- \
  --lesson output/book-1/lesson-XX \
  --record V001 \
  --image /path/to/new-image.png
```

This resizes regular vocabulary images to 576x324 PNG, preserves square `1:1` pinyin vocabulary targets, writes the image to the existing target path, and rebuilds `asset-manifest.json`.

Crop selected records from a Chrome/ChatGPT contact sheet:

```bash
npm run assets:crop-contact-sheet -- \
  --lesson output/pinyin/pinyin-01 \
  --sheet output/pinyin/pinyin-01/exports/qa/generated-vocab-source/chatgpt-contact-sheet.png \
  --records V001,V005
```

Use this after generating one contact sheet in Chrome/ChatGPT. It maps record IDs to their full vocabulary order in the manifest, crops only the requested records, and rebuilds the manifest. It does not regenerate slides or the lesson.

Before writing files, preview the crop mapping:

```bash
npm run assets:crop-contact-sheet -- \
  --lesson output/pinyin/pinyin-01 \
  --sheet output/pinyin/pinyin-01/exports/qa/generated-vocab-source/chatgpt-contact-sheet.png \
  --records V001,V005 \
  --dry-run
```

## Manifest Location

Each complete lesson must have:

```text
output/book-1/lesson-XX/slides/assets/asset-manifest.json
output/book-1/lesson-XX/exports/qa/asset-qa-report.json
output/book-1/lesson-XX/exports/qa/asset-manifest-report.json
```

The manifest records:

- every image, stylesheet, script, and shared asset referenced by slides
- which slides use each asset
- record IDs and vocabulary metadata when available
- dimensions and aspect ratio for image files
- prompt and visual description when available
- replacement rule for each asset

## QA Gates

`npm run assets:qa -- output/book-1/lesson-XX` must pass before delivering a new/regenerated lesson or an image-related edit.

It checks:

- required shared assets exist: `slide-base.css`, `slide-base.js`, `brand/logo-watermark.png`
- every referenced local asset exists
- regular vocabulary images are 16:9; pinyin vocabulary images are 1:1 when the pinyin template uses square image slots
- vocabulary images map to a record or Chinese word
- standalone vocabulary records have image coverage
- all numbered slides use `lucide@0.460.0`
- all numbered slides link `assets/slide-base.css` and `assets/slide-base.js`

Asset QA does not replace visual judgment. After it passes, still render screenshots/contact sheets and inspect whether each image matches its word or sample sentence.

## Image Rules

Regular vocabulary images:

- PNG, 16:9, ideally 576x324 or larger
- soft textbook line-art
- thin grey-blue outlines
- muted pastel fills
- white or very pale grey background
- no in-image text, letters, numbers, Chinese characters, labels, or watermarks
- no circular icon crops, teal vector blobs, stickers, chibi style, or harsh colors

Sample sentence images:

- must match the full sample phrase, not only one word
- reuse the vocab image only when the phrase meaning still matches
- otherwise generate a sentence-specific support image

Reusable images:

- approved generic images should live in `design/shared-slide-assets/` when they are meant for reuse across lessons
- lesson-local copies still live under `slides/assets/` so every lesson remains portable

## Pinyin Lesson Images

Future pinyin lessons reuse Pinyin Lesson 1 as the image/template baseline:

```text
output/pinyin/pinyin-01/
```

Do not create a new visual system for each pinyin lesson. Cover, goal, divider, concept, tone, initials/finals, vocabulary, appendix/input setup, and closing images should all use the same soft textbook/course style. Treat these as templates: keep the style and layout, then change the main lesson text, taught sounds, vocabulary, exercise content, and image subject.

Pinyin concept slides must use the provided or generated soft textbook illustration style.

Pinyin vocabulary images:

- Use the soft education textbook style.
- Use square `1:1` images when the pinyin vocabulary grid/flashcard template calls for square assets.
- Keep the normal no-text rule unless the image is an approved divider/cover/concept template where text is part of the design.
- On pinyin vocabulary grid slides, keep only the top bar section label and the grid; do not add extra description/instruction text above the cards.

Pinyin divider/cover/goal images:

- Use the approved Pinyin Lesson 1 image family as the style baseline.
- Replace only the main subject or lesson-specific text when adapting to later pinyin lessons.
- Do not use unrelated stock-like images or a different illustration style for closing/cover/goal slides.

## Lesson 01 And Lesson 10

Lesson 01 and Lesson 10 are the current regression lessons for this workflow. After changing scripts, templates, image rules, or presenter rules, run:

```bash
npm run assets:manifest -- output/book-1/lesson-01
npm run assets:qa -- output/book-1/lesson-01
npm run validate:lesson1

npm run assets:manifest -- output/book-1/lesson-10
npm run assets:qa -- output/book-1/lesson-10
node scripts/validate-system.mjs --lesson output/book-1/lesson-10
```
