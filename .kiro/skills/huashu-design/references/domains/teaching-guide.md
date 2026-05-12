# Teaching Domain Reference Guide

> This guide is consulted by the Skill_System when generating educational deliverables. It provides projection-optimized design standards, accessibility requirements, pedagogical structure patterns, and a validation checklist to ensure every output supports effective learning.
>
> **Validates: Requirements 6.2, 6.4**

---

## 1. Slide Design for Projection

### 1.1 Minimum Font Sizes

Projected slides are viewed from distances of 3–15 meters. Font sizes must account for the worst-case viewing distance.

| Element | Minimum Size | Recommended Size | Notes |
|---|---|---|---|
| **Slide title** | 40 pt | 44–54 pt | Bold weight; single line preferred |
| **Body text** | 24 pt | 28–32 pt | Regular weight; maximum 6 lines per slide |
| **Bullet points** | 24 pt | 26–30 pt | Use sentence fragments, not full paragraphs |
| **Captions / labels** | 18 pt | 20–24 pt | For chart labels, image captions, source citations |
| **Footnotes** | 14 pt | 16–18 pt | Absolute minimum; use sparingly |
| **Code snippets** | 20 pt | 24–28 pt | Monospace font; fewer lines = larger size |

### 1.2 Contrast Ratios (WCAG AA)

All text on slides must meet WCAG AA contrast requirements for large text:

| Combination | Minimum Ratio | Status |
|---|---|---|
| Dark text on light background | 3:1 (large text) / 4.5:1 (body text) | Required |
| Light text on dark background | 3:1 (large text) / 4.5:1 (body text) | Required |
| Text on photographic backgrounds | 4.5:1 with semi-transparent overlay | Required |
| Chart labels on colored backgrounds | 3:1 minimum | Required |

**Projection-specific considerations:**
- Projectors wash out colors — increase contrast by 20% beyond WCAG minimums
- Avoid pure white backgrounds (#FFFFFF) on projectors — use off-white (#F5F5F0 or #FAFAF8) to reduce glare
- Avoid low-saturation colors for important elements — they disappear on washed-out projectors
- Test designs at reduced brightness (simulate projector conditions)

### 1.3 Information-Per-Slide Limits

Each slide should communicate **one core message**. Use these constraints:

- **Text**: maximum 6 lines of body text, or 30–40 words total
- **Bullet points**: maximum 5 bullets per slide; each bullet ≤ 10 words
- **Data points**: maximum 5 data series on a single chart; simplify or split complex data
- **Images**: 1 primary image per slide; supporting images should be small and subordinate
- **Cognitive load rule**: if a student cannot grasp the slide's message in 8 seconds, it has too much content
- **The "billboard test"**: if you can't read and understand the slide at a glance (like a highway billboard), simplify it

---

## 2. Educational Infographic Structure

### 2.1 Learning Objective → Content → Assessment Flow

Every educational infographic should follow a three-part pedagogical structure:

```
┌─────────────────────────────────┐
│  1. LEARNING OBJECTIVE          │
│  "By the end, you will..."      │
│  Clear, measurable outcome      │
├─────────────────────────────────┤
│  2. CONTENT                     │
│  Visual explanation of concept  │
│  Progressive complexity:        │
│    Simple → Intermediate →      │
│    Advanced                     │
│  Use diagrams, icons, examples  │
├─────────────────────────────────┤
│  3. ASSESSMENT / TAKEAWAY       │
│  Quick check: "Can you..."      │
│  Summary of key points          │
│  Next steps or further reading  │
└─────────────────────────────────┘
```

### 2.2 Content Structuring Rules

- **Chunking**: break content into 3–5 digestible sections; each section has a clear sub-heading
- **Progressive disclosure**: start with the simplest concept, build toward complexity
- **Visual anchors**: each section should have a distinct visual element (icon, illustration, diagram) that aids memory
- **Numbering / sequencing**: use explicit step numbers or flow arrows to show progression
- **White space**: minimum 20% of total infographic area should be whitespace for visual breathing room
- **Vertical flow**: educational infographics read top-to-bottom; avoid complex multi-directional layouts

### 2.3 Typography for Infographics

- **Section headers**: 20–28 pt, bold, high contrast
- **Body text**: 14–18 pt, regular weight, high readability
- **Data labels**: 12–16 pt, can use a secondary typeface for differentiation
- **Line length**: 45–75 characters per line for optimal readability
- **Line height**: 1.4–1.6× font size for body text

---

## 3. Animation Pacing for Concept Explanation

### 3.1 Minimum Text Display Time

- **Minimum display time**: 3 seconds for any text element that appears on screen
- **Reading time formula**: (word count ÷ 3) + 1 second = minimum display time in seconds
  - Example: 12-word sentence → (12 ÷ 3) + 1 = 5 seconds minimum
- **Complex diagrams**: allow 5–8 seconds for the audience to parse a diagram before adding the next element
- **Transition pauses**: 0.5–1 second pause between animated elements to prevent cognitive overload

### 3.2 Animation Pacing Guidelines

| Animation Type | Duration | Pause After |
|---|---|---|
| Text appear (fade/slide) | 0.3–0.5 s | 3 s minimum (or reading time) |
| Diagram element appear | 0.3–0.5 s | 2–3 s |
| Chart data animation | 1–2 s | 3–5 s |
| Section transition | 0.5–1 s | 1 s |
| Highlight / emphasis | 0.3 s | 2 s |
| Full slide transition | 0.5–0.8 s | 1 s |

### 3.3 Concept Explanation Sequence

For animated concept explainers (30–60 seconds), follow this structure:

1. **Hook** (0–5s): State the question or problem being explained
2. **Setup** (5–15s): Introduce the key elements / vocabulary with simple visuals
3. **Build** (15–40s): Progressively construct the concept, one element at a time
4. **Reveal** (40–50s): Show the complete picture / answer
5. **Reinforce** (50–60s): Summarize with a simplified version of the complete visual

### 3.4 Motion Design Principles for Education

- **Purposeful motion**: every animation must serve a pedagogical purpose (reveal sequence, show relationship, highlight change). Decorative animation distracts.
- **Consistent direction**: establish a spatial logic (e.g., time flows left-to-right, hierarchy flows top-to-bottom) and maintain it throughout
- **Easing**: use ease-out for elements entering, ease-in for elements leaving; avoid linear motion (feels mechanical)
- **Reduce, don't add**: if removing an animation doesn't reduce understanding, remove it


---

## 4. Accessibility Requirements for Educational Materials

### 4.1 Color-Blind Safe Palettes

Approximately 8% of males and 0.5% of females have some form of color vision deficiency. Educational materials must be usable by all students.

**Rules:**
- **Never use color alone** to convey meaning — always pair with shape, pattern, label, or position
- **Avoid red-green combinations** as the primary differentiator (most common deficiency: deuteranopia)
- **Use a color-blind safe palette** for data visualization:
  - Recommended: blue (#0077BB), orange (#EE7733), cyan (#33BBEE), magenta (#EE3377), grey (#BBBBBB)
  - Alternative: IBM Design palette or ColorBrewer qualitative schemes
- **Test with simulation tools**: verify designs using color blindness simulators (protanopia, deuteranopia, tritanopia)
- **Provide redundant encoding**: use both color AND pattern/texture for chart fills; use both color AND icon for status indicators

### 4.2 Alt Text for Visual Elements

- **Every image, chart, and diagram** must have descriptive alt text
- **Alt text formula**: [Type of visual] + [What it shows] + [Key takeaway]
  - Example: "Bar chart showing student test scores improving from 65% to 82% over 4 weeks of tutoring"
- **Complex diagrams**: provide a detailed text description in addition to short alt text (use `longdesc` or adjacent text block)
- **Decorative images**: mark as decorative (`alt=""`) — do not describe purely aesthetic elements
- **Charts and graphs**: include a data table alternative for screen reader users

### 4.3 Screen Reader Considerations

- **Heading hierarchy**: use proper H1 → H2 → H3 nesting; never skip levels
- **Reading order**: ensure the DOM order matches the visual reading order
- **Link text**: use descriptive link text ("Download the study guide"), not "click here"
- **Table structure**: use proper `<th>` headers with `scope` attributes for data tables
- **ARIA labels**: add `aria-label` to interactive elements and complex widgets
- **Language attribute**: set `lang` attribute on the HTML element and on any foreign-language passages
- **Focus indicators**: ensure keyboard focus is visible on all interactive elements

### 4.4 Additional Accessibility Standards

- **Captions**: all video and audio content must have synchronized captions
- **Transcript**: provide text transcripts for audio-only content
- **Keyboard navigation**: all interactive elements must be operable via keyboard alone
- **Motion sensitivity**: provide a way to pause, stop, or reduce animations (respect `prefers-reduced-motion`)
- **Text resizing**: content must remain usable when text is resized up to 200%

---

## 5. Common Teaching Design Anti-Patterns

### ❌ Anti-Pattern 1: Text Walls
Slides or infographics filled with dense paragraphs of text. Students read ahead, stop listening, and retain less. **Fix**: maximum 6 lines / 40 words per slide; use visuals to carry the explanation; move detailed text to handouts.

### ❌ Anti-Pattern 2: Low Contrast on Projectors
Using light grey text on white, or pastel colors that look fine on a monitor but vanish on a projector. **Fix**: exceed WCAG AA minimums by 20%; test at reduced brightness; avoid pure white backgrounds.

### ❌ Anti-Pattern 3: Inconsistent Visual Systems
Mixing different icon styles (outline + filled + 3D), different color palettes across slides, or different font families without purpose. **Fix**: establish a visual system in slide 1 and maintain it throughout; use the domain token set for consistency.

### ❌ Anti-Pattern 4: Decorative Animation Overload
Fly-in, spin, bounce, and zoom effects on every element. Students focus on the animation, not the content. **Fix**: use animation only to reveal sequence or show relationships; every motion must serve a pedagogical purpose.

### ❌ Anti-Pattern 5: Information Overload Per Slide
Cramming an entire topic onto one slide with multiple charts, bullet lists, and images. **Fix**: one core message per slide; split complex topics across multiple slides with clear transitions.

### ❌ Anti-Pattern 6: Inaccessible Color Coding
Using red vs. green to distinguish correct vs. incorrect answers, or using color as the only differentiator in charts. **Fix**: pair color with shape, pattern, or label; use color-blind safe palettes.

### ❌ Anti-Pattern 7: Missing Learning Objectives
Jumping straight into content without telling students what they'll learn or why it matters. **Fix**: every presentation or infographic starts with a clear learning objective; every section ties back to it.

---

## 6. Validation Checklist

> The Skill_System MUST verify each item before delivering an educational deliverable.

### Typography & Readability
- [ ] Slide titles ≥ 40 pt
- [ ] Body text ≥ 24 pt
- [ ] Code snippets ≥ 20 pt (monospace)
- [ ] Line length 45–75 characters for body text
- [ ] Maximum 6 lines / 40 words of text per slide
- [ ] Font weight contrast between title and body ≥ 200

### Contrast & Visibility
- [ ] All text meets WCAG AA contrast ratios (3:1 large text, 4.5:1 body text)
- [ ] Contrast exceeds WCAG AA by ≥ 20% for projection environments
- [ ] No pure white (#FFFFFF) backgrounds (use off-white for projection)
- [ ] Text on photographic backgrounds has semi-transparent overlay
- [ ] Low-saturation colors avoided for critical elements

### Information Density
- [ ] One core message per slide
- [ ] Maximum 5 bullet points per slide, each ≤ 10 words
- [ ] Maximum 5 data series per chart
- [ ] Billboard test passed: slide message graspable in ≤ 8 seconds
- [ ] Infographics follow Learning Objective → Content → Assessment structure

### Animation & Pacing
- [ ] Minimum 3-second display time for all text elements
- [ ] Reading time formula applied: (word count ÷ 3) + 1 second
- [ ] Transition pauses of 0.5–1 second between elements
- [ ] All animations serve a pedagogical purpose (no decorative motion)
- [ ] `prefers-reduced-motion` respected

### Accessibility
- [ ] Color-blind safe palette used for data visualization
- [ ] Color never used alone to convey meaning (paired with shape/pattern/label)
- [ ] Alt text provided for all images, charts, and diagrams
- [ ] Heading hierarchy is correct (H1 → H2 → H3, no skipped levels)
- [ ] Reading order matches visual order
- [ ] Keyboard navigation functional for all interactive elements
- [ ] Language attribute set on HTML element

### Pedagogical Structure
- [ ] Learning objective stated at the beginning
- [ ] Content progresses from simple to complex
- [ ] Visual anchors present for each major section
- [ ] Summary / assessment / takeaway at the end
- [ ] Consistent visual system maintained throughout

### Anti-Pattern Check
- [ ] No text walls (dense paragraphs on slides)
- [ ] No low-contrast elements that would fail on projectors
- [ ] No inconsistent visual systems (mixed icon styles, random colors)
- [ ] No decorative animation overload
- [ ] No information overload per slide
- [ ] No inaccessible color coding
- [ ] Learning objectives present and clear
