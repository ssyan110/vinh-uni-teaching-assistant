# PPT Style Guide — Gamma Soft Gradient (Final)

> This is the locked design system for all lessons. Do NOT deviate without Adam's approval.
> Learned from Lesson 1 iterations. Apply exactly for Lesson 2+.

## Design Identity

**Style:** Gamma-inspired soft gradient. Clean, modern, educational.
**Audience:** Vietnamese university students, projected on classroom screen.
**Format:** 960pt × 540pt (16:9)

## Color System

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#FFFFFF` or `linear-gradient(to top, #F4FAFA, #FFFFFF)` | All vocab slides, content slides |
| Gradient panels | `linear-gradient(180deg, #D4EDED, #E8F4F4)` | Section divider right panels |
| Cover/closing gradient | `linear-gradient(135deg, #E0F2F2, #E8ECF8)` | Cover and closing only |
| Teal accent | `#5AACAC` | Pinyin, pills, vocab section, dots |
| Navy text | `#1A3A5A` | Characters, headings |
| Secondary text | `#4A6080` | Vietnamese meanings, body |
| Muted text | `#8A9AB0` | Labels, page indicators, hán việt |
| Card shadow | `0 4px 24px rgba(90,172,172,0.10)` | All cards |
| Card border | `1px solid #E0ECEC` | Subtle card borders |
| Pill background | `#E8F4F4` | Type pills, counter pills |

### Section colors (for menu bar dots and divider accents)

| Section | Color | Gradient for divider |
|---------|-------|---------------------|
| Từ vựng | `#5AACAC` | teal |
| Mục tiêu | `#5AACAC` | teal |
| Khởi động | `#F59E0B` | warm orange |
| Bài đọc | `#10B981` | green |
| Luyện tập | `#8B5CF6` | purple |
| Văn hóa | `#EC4899` | pink |
| Bài tập | `#F59E0B` | orange |

## Typography

| Role | Font | Size | Weight | Color |
|------|------|------|--------|-------|
| Chinese characters | Noto Sans SC | 44-72pt (single char), 56pt (2-char phrase) | 900 | `#1A3A5A` |
| Pinyin | Inter / Noto Sans SC | 16-20pt | 500 | `#5AACAC` |
| Vietnamese meaning | Inter | 13-14pt | 400 | `#4A6080` |
| Hán Việt | Inter | 10-11pt | 400 italic | `#8A9AB0` |
| Page titles | Inter / Noto Sans SC | 20pt | 700 | `#1A3A5A` |
| Section labels | Inter | 9-10pt | 600 | section color |
| Page indicator | Inter | 9pt | 400 | `#8A9AB0` |

**Google Fonts import:** `Inter:wght@400;500;600;700` + `Noto+Sans+SC:wght@400;700;900`

## Layout Components

### macOS Menu Bar (every slide except cover/closing)

```css
.menu-bar {
  position: absolute; top: 0; left: 0; right: 0; height: 36px;
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0,0,0,0.06);
  display: flex; align-items: center; padding: 0 28px; z-index: 10;
}
.menu-bar .dot { width: 8px; height: 8px; border-radius: 50%; background: [SECTION_COLOR]; margin-right: 10px; }
.menu-bar .section-label { font-size: 9pt; font-weight: 600; color: #4A6080; text-transform: uppercase; letter-spacing: 1px; }
```

### Page Indicator (every slide except cover)

```css
.page-indicator { position: absolute; bottom: 16px; right: 28px; font-size: 9pt; color: #8A9AB0; }
```
Format: `N / TOTAL`

### Vocabulary Card (single word)

```
┌─────────────────────────────┐
│         [NN/12]             │  ← counter pill
│          pinyin             │  ← teal, 20pt
│           漢字              │  ← navy, 72pt, Noto Sans SC 900
│      Vietnamese meaning     │  ← gray, 14pt
│         (hán việt)          │  ← muted italic, 11pt
│         [loại từ]           │  ← teal pill
│      optional note          │  ← teal italic, 10pt
└─────────────────────────────┘
```

- Max-width: 400px, border-radius: 20px, padding: 32px 36px
- Background: white, shadow: 0 4px 24px rgba(90,172,172,0.10)
- NO examples inside the card. Examples go on a separate "Mẫu câu" page.
- For key phrases (你好): add border-left: 4px solid #5AACAC, counter pill inverted (white on teal)

### Numbers Card Row (multiple words on one slide)

- 3 cards in flex row, gap: 20px
- Each card: 220×260px, same style as vocab card but smaller text (48pt character, 16pt pinyin)
- Shared type pill below the row

### Section Divider

- Split layout: left 55-60% white (centered text), right 40-45% colored gradient panel
- Left content: section label (uppercase, section color) → Chinese title (48pt) → colored line (40px, 3px) → subtitle (muted)
- Right: gradient panel with border-radius 20px on left corners

### Dialogue

- Soft gradient background
- Two conversation blocks (flex column, gap 24px)
- Each block: white card, border-left 4px solid (teal for A, lavender for B)
- Inside: speaker label → pinyin (separate line) → 漢字 (separate line)

### Practice Flashcards (Matching)

- 3 columns with 60px gap, centered
- Column headers: uppercase, muted
- Cards: 160px wide, 56px tall, equal size, bg #F8FCFC, border-radius 12px
- Randomized order (answers not aligned)

### Exercises/Homework

- Content centered on slide (flex column, align-items center, justify-content center)
- Numbered items with colored circles or checkbox squares

### Cover Slide

- Full gradient background (teal→lavender)
- Centered: pill "BÀI N" → large character → pinyin → line → Vietnamese → course subtitle
- NO menu bar, NO page indicator

### Closing Slide

- Full gradient background
- "下课" as title
- Next lesson info: pinyin → 漢字 → Vietnamese
- NO menu bar
- Page indicator only

## Text Format Rules (NON-NEGOTIABLE)

1. **Pinyin always ABOVE 漢字** (separate lines, never inline)
2. **Vietnamese meaning below**
3. **Hán Việt in parentheses** after Vietnamese meaning on all vocab
4. **"từ vựng"** not "sinh từ"
5. **"cụm từ"** not "thành ngữ"
6. **Characters with separators:** 一、八、大、不、五、口、白、女、马、你、好
7. **No page footer references** (no "p.19" etc.)
8. **Dialogue format:** top-to-bottom (A: then B:), pinyin above 漢字 on separate lines
9. **Culture page format:** 你好(nǐ hǎo) — pinyin in parentheses after character, not above
10. **Examples live on a separate "Mẫu câu" page** — never inside vocab cards
11. **Closing slide:** 下课 title, next lesson with pinyin/漢字/Vietnamese, no 你好 repeat

## Slide Sequence Template (for any regular lesson)

| # | Slide type | Notes |
|---|-----------|-------|
| 1 | Cover | Gradient bg, lesson number + key phrase |
| 2 | Objectives | 3 numbered cards |
| 3 | Warmup | Question + stock image (split layout) |
| 4 | Vocab divider | Split layout with gradient panel |
| 5-N | Vocab cards | One word per slide (clean, no examples) |
| N+1 | Mẫu câu | Example sentences using the vocab |
| N+2 | Vocab summary | Table with all words + hán việt (centered columns) |
| N+3 | Text divider | Green gradient |
| N+4 | Dialogue | A:/B: conversation blocks |
| N+5 | Practice divider | Purple gradient |
| N+6+ | Practice slides | Flashcards, drills, Blooket |
| N+7 | Culture divider | Pink gradient |
| N+8 | Culture content | Comparison cards |
| N+9 | Exercises divider | Orange gradient |
| N+10 | Exercises list | Centered, numbered |
| N+11 | Homework | Centered, checkboxes |
| Last | Closing | 下课 + next lesson preview |

## What NOT to do

- ❌ Dark backgrounds or Oriental Fantasy style
- ❌ Examples inside vocabulary cards (makes them dense)
- ❌ Unequal card sizes in the same row
- ❌ Content not centered on exercises/homework pages
- ❌ Pinyin inline with characters (always separate lines)
- ❌ "sinh từ" or "thành ngữ" terminology
- ❌ Page source references (p.19 etc.)
- ❌ Emoji as icons
- ❌ Text-only slides without visual structure
- ❌ Different backgrounds for same-category slides (all vocab = same bg)
