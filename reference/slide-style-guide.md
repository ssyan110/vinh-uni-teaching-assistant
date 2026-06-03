# Slide Style Guide - Soft Classroom Presenter (Final)

> Locked design system for Huashu HTML classroom decks.
> Learned from the finalized Lesson 1 deck. Apply this for Lesson 2+ unless Adam approves a redesign.

## Design Identity

Style: light classroom presenter. Clean, soft, readable, and built for direct projection in Vietnamese university classrooms.

Format: 960px x 540px, 16:9. Each slide is a standalone HTML file loaded by `index.html`.

Primary use: teach directly from the HTML presenter. PDF export is a backup. PPTX is not part of the current classroom workflow.

## Color System

| Role | Hex / CSS | Usage |
|---|---|---|
| Base background | `#FFFFFF` | Main slide surface |
| Teaching background | `linear-gradient(to top, #F4FAFA, #FFFFFF)` | Default content slides |
| Cover gradient | `linear-gradient(160deg, #D6F0F0 0%, #E8ECF8 50%, #F0E8F4 100%)` | Cover only |
| Teal accent | `#5AACAC` | Pinyin, pills, menu icon color, section lines |
| Navy text | `#1A3A5A` | Chinese, headings, primary labels |
| Secondary text | `#4A6080` | Vietnamese meanings and body text |
| Muted text | `#8A9AB0` | Source labels, page numbers, hints, Hán Việt |
| Pale teal | `#E8F4F4` | Pills, menu icon background, card accents |
| Teal panel | `#D4EDED` to `#E8F4F4` | Vocab card strip and divider accents |
| Lavender | `#C8B8E8` | Soft secondary accent |
| Lavender panel | `#E4E8F7` | Dialogue speaker B and soft contrast |
| Green | `#10B981` | Reading/text section accent |
| Purple | `#8B5CF6` | Practice section accent |
| Pink | `#EC4899` | Culture/supplement accent |
| Orange | `#F59E0B` | Homework/exercise accent |

Global background decoration:

```css
.slide:before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 12% 84%, rgba(90,172,172,.08) 0 92px, transparent 94px),
    radial-gradient(circle at 90% 16%, rgba(200,184,232,.12) 0 120px, transparent 122px);
  pointer-events: none;
}
```

## Typography

Import both font families on every slide:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;700;900&display=swap" rel="stylesheet">
```

| Role | Font | Size | Weight | Color |
|---|---|---:|---:|---|
| Chinese characters | Noto Sans SC | 44-112pt | 900 | `#1A3A5A` |
| Pinyin | Inter | 16-52pt | 600 | `#5AACAC` |
| Vietnamese meaning | Inter | 13-18pt | 400-800 | `#4A6080` or `#1A3A5A` |
| Hán Việt | Inter | 11-13pt | 400 italic | `#8A9AB0` |
| Page title | Inter | 20-29pt | 800 | `#1A3A5A` |
| Section label | Inter | 9pt | 700 | `#4A6080` |
| Source and page labels | Inter | 9pt | 400 | `#8A9AB0` |

Do not use viewport-scaled type. Keep letter spacing at `0` for normal text. Uppercase menu labels may use `1.2px`.

## Shared Shell

### Slide Root

```css
body {
  width: 960px;
  height: 540px;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  color: #1A3A5A;
  background: #fff;
}

.slide {
  position: relative;
  width: 960px;
  height: 540px;
  overflow: hidden;
  background: linear-gradient(to top, #F4FAFA, #FFFFFF);
}
```

### Menu Bar

Use this on every teaching slide except cover and closing.

```css
.menu-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: rgba(255,255,255,.90);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(26,58,90,.08);
  display: flex;
  align-items: center;
  padding: 0 28px;
  z-index: 20;
  box-shadow: 0 8px 22px rgba(26,58,90,.10);
}

.menu-icon {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  background: #E8F4F4;
  color: #5AACAC;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  box-shadow: inset 0 0 0 1px rgba(90,172,172,.18);
}

.menu-icon svg {
  width: 15px;
  height: 15px;
  stroke-width: 2.4;
}

.menu-icon.char {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 14px;
  font-weight: 900;
  line-height: 1;
}

.section-label {
  font-size: 9pt;
  font-weight: 700;
  color: #4A6080;
  text-transform: uppercase;
  letter-spacing: 1.2px;
}
```

### Source And Page Labels

Source labels are required when a slide maps to source pages, lesson database rows, or a specific activity.

```css
.page-indicator {
  position: absolute;
  bottom: 16px;
  right: 28px;
  font-size: 9pt;
  color: #8A9AB0;
  z-index: 20;
}

.source {
  position: absolute;
  bottom: 16px;
  left: 28px;
  font-size: 9pt;
  color: #8A9AB0;
  z-index: 20;
}
```

Examples: `Trang 19`, `Trang 19-20`, `Trang 30`, `Từ vựng 01/12`.

Cover has no page indicator. Closing has a page indicator but no menu bar.

### Cards

```css
.card {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 28px rgba(90,172,172,.13);
  border: 1px solid rgba(90,172,172,.14);
}
```

Use 20-24px radius for content cards. Keep repeated cards equal in size within the same slide.

### Pills

```css
.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #E8F4F4;
  color: #5AACAC;
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 10pt;
  font-weight: 700;
}
```

## Core Components

### Cover

- Full soft gradient background.
- Centered frosted card.
- Pill `BÀI N`.
- Large lesson Chinese phrase.
- Pinyin below Chinese.
- Small course subtitle at bottom-left.
- Thin teal/lavender gradient bar at bottom.
- No menu bar and no page indicator.

### Objectives

- Three numbered cards.
- Short Vietnamese objective text.
- Use stable card sizes and clear spacing.

### Warmup

- Left question card.
- Right local photo panel.
- Prompt chips below the main question.
- Mini prompt cards for teacher-led oral answers.
- Avoid answer text on the warmup slide.

### Section Divider

- Menu bar at top.
- Left 58% white area with section label, Chinese title, accent line, and short Vietnamese subtitle.
- Right photo panel or visual block.
- Include source label when tied to source pages.

### Vocabulary Card

One vocabulary item per slide.

Required structure:

1. Counter pill, for example `01/12`.
2. Pinyin.
3. Chinese.
4. Vietnamese meaning.
5. Hán Việt in parentheses.
6. Type pill.

Use a vertical teal strip on the left side of the card. Do not put examples inside vocabulary cards.

### Sample Sentence

Each vocabulary item may be followed by a separate `Mẫu câu` slide.

Required structure:

1. Pill `Mẫu câu`.
2. Pinyin.
3. Chinese.
4. Vietnamese meaning.

Keep the sample card centered and uncluttered.

### Vocabulary Summary Mini Quiz

- Use a 3-column grid.
- Show Chinese first.
- Hide pinyin, Vietnamese, and Hán Việt behind click reveal.
- Add a short note such as `Click để hiện từng đáp án.`
- Split long vocabulary lists across multiple summary slides.

### Practice Flashcard

- One large centered flashcard.
- Click sequence: Chinese -> pinyin -> meaning -> reset.
- Use CSS reveal states and `transform: rotateY(...)`.
- Add a short Vietnamese instruction at the bottom.

### Number Practice

- Three equal cards in one row.
- Pinyin above Chinese.
- No extra decoration that shifts card sizes.

### Guess Meaning Practice

- Show Chinese first.
- Reveal pinyin and Vietnamese by click.
- Use equal cards and centered layout.

### Dialogue

- Two avatar rows.
- Each row has an avatar and a white dialogue card.
- Pinyin above Chinese.
- Use a teal left border for speaker A and lavender for speaker B.

### Stroke Practice

- Use Hanzi Writer when stroke data exists.
- Center a writer card on the slide.
- Include pinyin, meaning, and Hán Việt below the writing target.
- Include a `▶ Viết mẫu` replay button.
- Provide a large static fallback character if Hanzi Writer is unavailable.

### Culture And Supplement

- Use simple comparison cards.
- Keep culture text concise and student-facing.
- Inline pinyin in parentheses is allowed for culture notes, for example `您好 (nín hǎo)`.

### Exercises And Homework

- Center the task list.
- Use numbered items, checkboxes, or clear card rows.
- Keep teacher-only notes and answers out of student-facing slides.

### Closing

- Use the local closing background image.
- Add a soft white overlay and centered translucent card.
- Main title: `下课`.
- Show next lesson preview with pinyin and Chinese.
- No menu bar. Page indicator remains at bottom-right.

## Language And Content Rules

1. Vietnamese labels and instructions.
2. Simplified Chinese for target content.
3. Pinyin for pronunciation.
4. Pinyin above Chinese on vocabulary, sample, practice, and dialogue slides.
5. Vietnamese meaning below Chinese.
6. Hán Việt in parentheses below Vietnamese meaning on vocabulary and summary slides.
7. Use `từ vựng`, not `sinh từ`.
8. Use `cụm từ`, not `thành ngữ`.
9. Use character separators: `一、八、大、不、五、口、白、女、马、你、好`.
10. Keep source mapping visible through concise source labels.
11. Do not show review status, internal IDs, teacher-only tips, or non-classroom notes.
12. Do not use Traditional Chinese unless Adam requests it.

## Interaction Rules

- Slides receive reveal events through `postMessage({ type: 'reveal-next' })`.
- Elements with `data-reveal-step` reveal one by one.
- Elements with `data-reveal-all` toggle together.
- Click interactions must reset cleanly after the final reveal state.
- Presenter click should reveal slide content before slide navigation.

## Regular Lesson Template

Use this order as the current deck pattern:

| Order | Slide type | Notes |
|---:|---|---|
| 1 | Cover | Lesson number and key phrase |
| 2 | Objectives | Three concise goals |
| 3 | Warmup | Oral activation prompt |
| 4 | Vocabulary divider | Section intro and source pages |
| 5+ | Vocabulary and sample pairs | One vocab slide, then one sample slide when useful |
| After vocab | Vocabulary summary mini quiz | Split into pages if needed |
| Next | Practice divider | Introduce drills |
| Practice | Flashcards and drills | Click reveal where useful |
| Next | Text divider | Dialogue or reading section |
| Text | Dialogue or reading | Pinyin above Chinese |
| Next | Stroke practice | One character per slide |
| Next | Supplement divider | Culture or extra learning |
| Supplement | Culture and extension | Student-facing only |
| Next | Homework divider | Transition to exercises |
| Homework | Exercise list | Student-facing task list |
| Last | Closing | `下课` and next lesson preview |

If a future lesson has grammar, insert grammar and grammar practice after vocabulary practice and before text/dialogue, unless the approved lesson structure says otherwise.

## Asset Rules

- Use local assets under each lesson's `slides/assets/` directory.
- Use local photos from `slides/assets/photos/`.
- Use local reference images from `slides/assets/reference/`.
- Use embedded Hanzi Writer data from `slides/assets/hanzi-data/`.
- Avoid remote random image services in final decks.
- Do not copy reference PDFs as artwork. Recreate the style with original layout and safe assets.

## What Not To Do

- Do not bring back the old three-version design proposal.
- Do not use Gamma, PPTX, or slide-by-slide manual presentation tooling as the primary workflow.
- Do not use dark Oriental-fantasy backgrounds.
- Do not put examples inside vocabulary cards.
- Do not remove source labels from mapped slides.
- Do not use inline pinyin on vocabulary, sample, practice, or dialogue slides.
- Do not use emoji as classroom icons.
- Do not use English labels unless Adam asks.
- Do not use screenshots, logs, internal review notes, or answer keys as visible student-facing content.
