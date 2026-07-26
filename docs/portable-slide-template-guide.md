# Portable Slide Template Guide

Use this guide when a future project already has approved slide content and needs the same **Soft Classroom Presenter** slides as this project—without repeating lesson discovery, content extraction, or design exploration.

This is an HTML-first deck system: editable slide HTML plus a browser presenter. It is not a PPTX workflow. The result is visually identical only when the source template HTML and its assets are copied; do not redraw the system from a written description.

## The fast path

1. Confirm that the slide content is final enough to place. Do not research, rewrite, add a teaching sequence, or invent extra slides unless the supplied content cannot fit safely.
2. Copy the selected source template and the shared `assets/` directory into the target project's `slides/` directory.
3. Replace only the content, local images, source-page labels, and slide order. Keep the template's HTML structure, classes, geometry, fonts, color tokens, and interactions.
4. Number slides sequentially (`01-...html`, `02-...html`), create the presenter manifest, then use the target project's `index.html` as the classroom entry point.
5. Render and inspect the complete deck at 16:9. Split dense content into new slides; never make text smaller, clip it, or cover it with another element.

## Copy the source, not an approximation

From this repository, use these as the canonical sources:

| Need | Canonical source |
|---|---|
| Shared visual system and reusable components | `output/book-1/lesson-01/slides/assets/` |
| Current regular-course cover | `output/book-1/lesson-10/slides/01-cover.html` |
| Objectives, warm-up, dividers, vocabulary, practice, dialogue, writing, culture, homework, closing | `output/book-1/lesson-01/slides/` |
| Browser presenter behavior | `output/book-1/lesson-01/slides/index.html` |
| Visual-spec reference | `reference/slide-style-guide.md` |

Copy the whole `assets/` directory first. It contains the shared CSS/JS, watermark, and supporting runtime assets. Then copy only the individual slide HTML files needed for the deck. If a chosen slide references an image or Hanzi Writer data, copy that referenced asset too. Keep all asset references local and relative so the target `slides/` folder remains portable.

For the closest visual match, start from a copied template page and replace content in place. Do not rebuild a cover, menu bar, cards, vocabulary card, divider, dialogue bubble, or closing slide from scratch.

## Content-ready build request

Give a future agent the completed content in this compact form. It is intentionally a placement brief, not a request to develop the lesson.

```md
# Slide build request

Use the Soft Classroom Presenter template from ai-teaching-material-system.
Mode: content-ready — do not research, expand, or rewrite the supplied content.

Deck title: [title]
Audience: [audience]
Language: [visible-language rules]
Source-page labels: [page mapping, or “none”]

## Slide map

1. cover
   - badge: [text]
   - Chinese/title line: [text]
   - pinyin/subtitle: [text]
   - Vietnamese/title support: [text]
   - image: [local asset path or description]

2. objectives
   - [objective 1]
   - [objective 2]
   - [objective 3]

3. divider: [section]

4. [template type: vocabulary | sample | two-card comparison | dialogue | quiz | practice | culture | homework | closing]
   - title: [text]
   - content: [final content]
   - image: [local asset path, if any]

## Fixed constraints

- Keep the supplied slide order unless content overflow requires a split.
- Keep all provided wording exactly unless a correction is explicitly requested.
- Keep the source template's layout and interactions.
- Put explanations or speaker notes outside classroom slides.
```

## Template selection

Choose the smallest matching template for each content block.

| Content | Start from |
|---|---|
| Cover | Lesson 10 `01-cover.html` |
| Three goals | Lesson 01 `02-objectives.html` |
| Opening prompt | Lesson 01 `03-warmup.html` |
| Any section transition | Lesson 01 divider matching the section, e.g. `04-divider-vocab.html`, `26-divider-practice-vocab.html`, `37-divider-text.html`, `51-divider-supplement.html`, `54-divider-homework.html` |
| One vocabulary item | Lesson 01 `05-vocab-ni.html` |
| A vocabulary example | Lesson 01 `07-sample-ni.html` |
| Recall/flashcard practice | Lesson 01 `30-practice-flashcard-ni.html` |
| Dialogue | Lesson 01 `38-dialogue.html` |
| Character-writing activity | Lesson 01 `40-stroke-yi.html` |
| Culture/comparison | Lesson 01 `52-culture-greetings.html` |
| Exercise list | Lesson 01 `55-exercises-list.html` |
| Closing | Lesson 01 `56-closing.html` |

For a non-teaching project, retain the same shell, typography, card system, quiet background, and spacing. Use the closest layout above (cover, divider, card, comparison, or closing) rather than introducing a new design language. The Chinese-learning-specific elements—pinyin alignment, vocabulary counters, source-page labels, Hanzi Writer, and Vietnamese labels—apply only when the target project needs them.

## Non-negotiable visual rules

- Canvas: exactly `960 × 540 px` (16:9). Do not use responsive slide dimensions or viewport-scaled type.
- Fonts: `Inter` for Latin/Vietnamese UI; `Noto Sans SC` for Simplified Chinese. Preserve the template font import and SC-oriented fallbacks.
- Base palette: navy `#1A3A5A`, teal `#5AACAC`, secondary text `#4A6080`, muted text `#8A9AB0`, pale teal `#E8F4F4`, white cards, and the existing soft mint/lavender background.
- Content slides retain the 40px menu bar; cover and closing do not.
- Retain the low-opacity watermark and all decorative background elements behind content. Never put an overlay, blur, or faded wash over primary text, cards, diagrams, or inserted images.
- Cards remain white with equal sizing within a repeated group, 20–24px rounded corners, thin teal-tinted borders, and soft shadows.
- Use one clear task per slide. Center standalone concepts, prompts, and examples; use left-aligned layouts only when a list, comparison, or dialogue is easier to scan.
- Use local images at full opacity. Do not use random remote image services or bake reference artwork into the slide.
- Do not add visible tool names, review notes, internal IDs, answer keys, speaker notes, or generic English labels to classroom slides.

## Language and teaching rules

Use these only for this project's Chinese-teaching deck family:

- Vietnamese for visible instructions and activity labels; Simplified Chinese for target-language content; pinyin as pronunciation support.
- Put pinyin directly above the Chinese character or word group it matches. Do not use one unaligned full-sentence pinyin line.
- Vocabulary pages use the fixed order: image → pinyin → Chinese → Vietnamese meaning → Hán Việt → word type. Examples belong on a separate sample slide.
- `.page-indicator` means the printed textbook page, never a slide number or PDF page. Omit it when no source page exists.
- Keep teacher guidance and answer keys in a separate guide, never in classroom slide HTML.

## Presenter and QA handoff

The copied deck must have an updated presenter manifest that lists every numbered slide in order. Reuse the existing presenter rather than replacing it with a static webpage; it preserves navigation, thumbnails, annotations, reveal behavior, and classroom PDF export.

Before delivery, check:

- Every slide opens from the presenter in the intended order.
- No text overflows, clips, overlaps, or interferes with the menu bar, footer, watermark, or an image panel.
- Repeated cards are aligned and equal-sized.
- Every local image loads and matches the content it supports.
- Click/reveal interactions reset correctly, where used.
- Classroom slides contain only audience-facing content.

For a deck built inside this repository, run the relevant `npm run lesson:presenter -- <lesson-root>` and `npm run validate:book1` checks, then render screenshots under `exports/qa/`. Do not create a clean PDF backup until the design and content are confirmed final.

## What this guide intentionally skips

This fast path does not run the full textbook-to-database pipeline, generate images, create a new visual direction, or redesign slide types. Those are separate tasks. Its purpose is to turn already-approved content into the established slide family quickly and consistently.
