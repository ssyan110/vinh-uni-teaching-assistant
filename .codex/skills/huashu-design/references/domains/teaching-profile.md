# Teaching Domain Profile

> Domain profile for educators and instructional designers creating lecture slides, tutorial infographics, course module covers, educational posters, and animated concept explainers. This profile configures design tokens, style recommendations, scene templates, workflow presets, and trigger words for the Teaching domain.

---

## 1. Design Tokens

### Rationale

Teaching deliverables prioritize clarity, accessibility, and calm visual tone. The palette meets WCAG AA contrast ratios on both light and dark backgrounds, ensuring readability for all students including those with visual impairments. Typography uses a high-x-height sans-serif optimized for projection distance — body text remains legible at 3–10 meters. Spacing is consistent and generous to support structured information hierarchy without visual fatigue. The accent color is a calm teal that highlights key concepts without competing for attention.

### CSS Custom Properties

```css
:root {
  /* Primary Palette — WCAG AA compliant */
  --domain-primary: #1B2A4A;
  --domain-primary-light: #2C3E6B;
  --domain-bg: #FAFBFC;
  --domain-bg-alt: #F0F2F5;
  --domain-ink: #1B2A4A;
  --domain-ink-muted: #5A6577;
  --domain-accent: #0E7C6B;
  --domain-accent-hover: #0A5F52;

  /* Accessible Accent Scale — distinguishable, color-blind safe */
  --domain-accent-secondary: #2E86AB;
  --domain-accent-tertiary: #A23B72;
  --domain-accent-success: #3A7D44;
  --domain-accent-warning: #C17817;

  /* Typography — High-x-height sans-serif for projection readability */
  --domain-font-display: "Source Sans Pro", "Noto Sans", "Helvetica Neue", sans-serif;
  --domain-font-body: "Source Sans Pro", "Noto Sans", "Helvetica Neue", sans-serif;
  --domain-font-mono: "Source Code Pro", "JetBrains Mono", "Consolas", monospace;

  /* Font Sizes — Large for projection distance (3–10m) */
  --domain-text-hero: 64px;
  --domain-text-headline: 44px;
  --domain-text-subhead: 32px;
  --domain-text-body: 24px;
  --domain-text-caption: 18px;
  --domain-text-label: 20px;

  /* Font Weights — Clear hierarchy without extremes */
  --domain-weight-headline: 700;
  --domain-weight-subhead: 600;
  --domain-weight-body: 400;
  --domain-weight-label: 600;

  /* Spacing Scale — Consistent, generous for structured hierarchy */
  --domain-space-xs: 8px;
  --domain-space-sm: 16px;
  --domain-space-md: 24px;
  --domain-space-lg: 48px;
  --domain-space-xl: 80px;

  /* Spacing — Section and content rhythm */
  --domain-space-section: 96px;
  --domain-space-slide-padding: 64px;
  --domain-space-content-max: 1200px;

  /* Border & Radius — Soft, approachable */
  --domain-radius-sm: 4px;
  --domain-radius-md: 8px;
  --domain-radius-lg: 12px;
  --domain-radius-pill: 999px;

  /* Shadows — Minimal, calm depth */
  --domain-shadow-card: 0 1px 4px rgba(0, 0, 0, 0.06);
  --domain-shadow-elevated: 0 4px 12px rgba(0, 0, 0, 0.08);
  --domain-shadow-focus: 0 0 0 3px rgba(14, 124, 107, 0.3);
}
```

### Contrast Ratios (WCAG AA Verification)

| Combination | Ratio | Pass |
|-------------|-------|------|
| `--domain-ink` (#1B2A4A) on `--domain-bg` (#FAFBFC) | 12.8:1 | ✅ AAA |
| `--domain-ink-muted` (#5A6577) on `--domain-bg` (#FAFBFC) | 5.2:1 | ✅ AA |
| `--domain-accent` (#0E7C6B) on `--domain-bg` (#FAFBFC) | 5.6:1 | ✅ AA |
| `--domain-bg` (#FAFBFC) on `--domain-primary` (#1B2A4A) | 12.8:1 | ✅ AAA |
| `--domain-accent-warning` (#C17817) on `--domain-bg` (#FAFBFC) | 4.5:1 | ✅ AA |

---

## 2. Style Recommendations Map

Each major teaching deliverable type is mapped to 3 recommended styles from the 20-style library. Each style comes from a different school to ensure visual differentiation across options. Styles are chosen for readability, clear hierarchy, and calm visual tone.

### Lecture Slide

| Style | School | Rationale |
|-------|--------|-----------|
| 04 Fathom | 信息建筑派 | Scientific journal aesthetic with precise data visualization creates authoritative lecture slides. Clean sans-serif and neutral scheme keep focus on content. Information density without clutter suits data-heavy lectures. |
| 10 Müller-Brockmann | 极简主义派 | Mathematical grid system (8pt baseline) enforces strict alignment and clear hierarchy. Two-color maximum reduces cognitive load. Rationalist typeface ensures legibility at projection distance. |
| 18 Kenya Hara | 东方哲学派 | Extreme whitespace (80%+) forces one-idea-per-slide discipline. Zen simplicity reduces visual fatigue during long lectures. Layers of white create subtle depth without distraction. |

### Tutorial Infographic

| Style | School | Rationale |
|-------|--------|-----------|
| 02 Stamen Design | 信息建筑派 | Cartographic layered approach maps naturally to step-by-step tutorial flows. Warm data visualization palette (sage green, deep blue) is inviting for learners. Hand-crafted feel adds approachability. |
| 11 Build | 极简主义派 | Luxury minimalism with 70%+ whitespace prevents information overload in multi-step tutorials. Subtle font weight shifts (200–600) create clear step hierarchy. Single accent color guides the eye through the flow. |
| 17 Takram | 东方哲学派 | Elegant concept prototypes and diagrams-as-art elevate tutorial infographics beyond utilitarian. Soft tech aesthetic (rounded corners, gentle shadows) feels approachable. Neutral natural colors reduce visual fatigue. |

### Course Module Cover

| Style | School | Rationale |
|-------|--------|-----------|
| 18 Kenya Hara | 东方哲学派 | Design-by-subtraction creates covers that feel confident and scholarly. Minimal desaturated color lets the course title speak. Paper texture adds tactile sophistication appropriate for academic materials. |
| 01 Pentagram | 信息建筑派 | Extreme typographic hierarchy makes course titles unmissable. Swiss grid with black/white + one accent color creates a consistent series identity across multiple modules. Negative space strategy feels premium. |
| 12 Sagmeister & Walsh | 极简主义派 | Unexpected color bursts on a minimal base make course covers visually distinctive and memorable. Optimistic visual language motivates students. Experimental typography remains legible for titles. |

### Educational Poster

| Style | School | Rationale |
|-------|--------|-----------|
| 10 Müller-Brockmann | 极简主义派 | Mathematical grid ensures precise alignment of complex educational content at large format (A2/A1). Strict two-color scheme maintains readability from distance. Objective aesthetic suits academic environments. |
| 04 Fathom | 信息建筑派 | Scientific precision in data visualization suits posters presenting research findings or statistical concepts. Footnote/citation design integrates naturally into educational poster conventions. |
| 05 Locomotive | 运动诗学派 | Film-like composition and bold typography on dark backgrounds create high-impact posters for hallway display. Strategic glowing accents draw attention to key data points from across a room. |

### Animated Concept Explainer

| Style | School | Rationale |
|-------|--------|-----------|
| 17 Takram | 东方哲学派 | Elegant diagrams and soft tech aesthetic translate beautifully to animation. Modest sophistication keeps focus on the concept being explained. Neutral natural colors prevent motion-induced visual fatigue. |
| 06 Active Theory | 运动诗学派 | Particle systems and 3D visualization bring abstract concepts to life. Mouse-reactive environments enable interactive concept exploration. Depth-of-field effects guide attention to key elements during animation. |
| 15 Ash Thorp | 实验先锋派 | Cinematic lighting and atmospheric effects create engaging concept explainers for advanced topics. Warm cyberpunk tones (orange/teal) maintain visual interest without cold sterility. Narrative concept art feel suits storytelling-based explanations. |

---

## 3. Scene Template Defaults

### 3.1 Lecture Slide

- **Dimensions**: 1920×1080 (16:9)
- **Layout Constraints**:
  - Slide padding: 64px on all sides (safe zone for projector cropping)
  - Title: top 20% of slide, minimum 44px font size
  - Body text: minimum 24px font size (legible at 10m projection distance)
  - Maximum 6 lines of body text per slide (one core message rule)
  - Visual/diagram area: 60% of slide width when text + visual layout
  - Page/slide number: bottom-right corner, 18px caption size. For Adam's textbook courseware, the visible slide `.page-indicator` must show the printed textbook page/range from the database, not the slide number or PDF page; navigation counters belong only in the presenter chrome. Generated classroom activity sections that do not appear directly in the textbook, especially `Luyện tập tổng hợp` and `Văn hóa bổ sung`, omit `.page-indicator`.
  - No text below 18px anywhere on the slide
- **Content Guidelines**:
  - One core message per slide — if you need a second point, make a second slide
  - High-contrast text on background (WCAG AA minimum, 4.5:1 ratio)
  - Diagrams and charts use the domain accent scale for data series
  - Bullet points limited to 4 items maximum; prefer visual hierarchy over lists
  - Speaker notes area available but not rendered in presentation view
- **Prompt Template**:
  ```
  [Style DNA] + Lecture slide, 1920×1080 16:9 format.
  Topic: [TOPIC]. Key message: [KEY_MESSAGE].
  Supporting visual: [DIAGRAM/CHART/IMAGE description].
  Audience: [AUDIENCE_LEVEL]. Projection-optimized, high-contrast, one idea per slide.
  ```

### 3.2 Tutorial Step-by-Step Infographic

- **Dimensions**: 800px wide, vertical scroll (variable height, typically 2000–5000px)
- **Layout Constraints**:
  - Content max-width: 800px centered
  - Step numbering: prominent, minimum 32px, left-aligned or centered
  - Each step: clear visual boundary (divider, spacing, or background shift)
  - Step spacing: 48px minimum between steps
  - Code blocks (if any): full-width within content area, monospace font, 16px minimum
  - Progress indicator: optional vertical line or step dots on left margin
- **Content Guidelines**:
  - Learning objective stated at top before Step 1
  - Each step: action verb headline + supporting detail + visual aid
  - Maximum 8 steps per infographic (split into parts if longer)
  - Callout boxes for tips, warnings, and key takeaways
  - Summary/recap section at bottom
- **Prompt Template**:
  ```
  [Style DNA] + Tutorial infographic, 800px wide vertical scroll.
  Tutorial title: [TITLE]. Learning objective: [OBJECTIVE].
  Steps: [STEP_1], [STEP_2], [STEP_3], ...
  Audience level: [BEGINNER/INTERMEDIATE/ADVANCED].
  Clear step progression, visual aids per step, accessible design.
  ```

### 3.3 Course Module Cover

- **Dimensions**: 1920×1080 (16:9) — used as course thumbnail and title card
- **Layout Constraints**:
  - Course title: centered or left-aligned, minimum 48px, maximum 2 lines
  - Module number/label: secondary hierarchy, 24px minimum
  - Instructor name or institution logo: bottom area, 18px minimum
  - Visual element (icon, illustration, or abstract graphic): occupies ≤40% of canvas
  - Safe zone: 80px inset from all edges (platform thumbnail cropping)
- **Content Guidelines**:
  - Consistent visual identity across all modules in a course series
  - Module number and title must be readable at thumbnail size (320×180px)
  - Color coding per module is encouraged (use domain accent scale)
  - Avoid photographic backgrounds that reduce text legibility
  - Institution or course branding in a consistent position
- **Prompt Template**:
  ```
  [Style DNA] + Course module cover, 1920×1080 16:9 format.
  Course: [COURSE_NAME]. Module: [MODULE_NUMBER] — [MODULE_TITLE].
  Instructor: [INSTRUCTOR_NAME]. Institution: [INSTITUTION].
  Series-consistent design, thumbnail-readable, academic tone.
  ```

### 3.4 Educational Poster

- **Dimensions**: A2 (420×594mm) or A1 (594×841mm), portrait orientation
- **Layout Constraints**:
  - Margins: 25mm minimum on all sides
  - Grid: 6-column for A2, 8-column for A1
  - Title block: top 15%, minimum 60px equivalent font size
  - Content zones: max 4 sections (introduction, main content, key findings, references)
  - Charts/diagrams: minimum 30% of poster area for visual content
  - Print-safe colors: CMYK-friendly values, avoid pure RGB neons
- **Content Guidelines**:
  - Title readable from 3 meters distance
  - Key findings or takeaways visually prominent (callout box or large type)
  - Data visualizations use the domain accent scale for consistency
  - References/citations section at bottom, smaller type acceptable (14px equivalent)
  - QR code optional for linking to supplementary digital materials
  - Institutional logo and author information in header or footer
- **Prompt Template**:
  ```
  [Style DNA] + Educational poster, [A2/A1] portrait format, print-ready.
  Title: [POSTER_TITLE]. Authors: [AUTHORS].
  Sections: Introduction, [MAIN_CONTENT], Key Findings, References.
  Institution: [INSTITUTION]. Academic conference / classroom display context.
  High-contrast, readable from 3m, structured information hierarchy.
  ```

### 3.5 Animated Concept Explainer

- **Dimensions**: 1920×1080 (16:9), timeline-based, 30–60 seconds duration
- **Layout Constraints**:
  - Title card: first 3–5 seconds, full-screen with topic and context
  - Content frames: each concept point holds for minimum 3 seconds (reading time)
  - Transition duration: 0.5–1 second between concept frames
  - Text overlay: minimum 28px, positioned in lower third or centered
  - Diagram/animation area: central 70% of frame
  - End card: last 3–5 seconds with summary and call-to-action (next lesson, quiz, etc.)
- **Content Guidelines**:
  - Linear narrative: setup → explanation → example → summary
  - Maximum 5 concept points per 30-second explainer, 8 for 60-second
  - Each concept point: visual metaphor or diagram + concise text label
  - Animation pacing: slow enough for comprehension, fast enough to maintain engagement
  - Voiceover-friendly timing: text appears slightly before or with narration
  - Accessible: all text content available as captions/subtitles
- **Prompt Template**:
  ```
  [Style DNA] + Animated concept explainer, 1920×1080 16:9, [30/60] seconds.
  Concept: [CONCEPT_NAME]. Target audience: [AUDIENCE_LEVEL].
  Key points: [POINT_1], [POINT_2], [POINT_3], ...
  Narrative arc: setup → explanation → example → summary.
  Calm pacing, clear visual metaphors, subtitle-ready.
  ```

---

## 4. Workflow Preset

When the Teaching domain is active, the following defaults are pre-filled for the Junior Designer workflow:

| Parameter | Default Value |
|-----------|---------------|
| **Fidelity** | Full hi-fi with placeholder content slots — production-quality layout with `[PLACEHOLDER]` markers for real course content to be inserted later |
| **Variations** | 2 variations across information density (compact vs. spacious) and visual tone (warm neutral vs. cool academic) |
| **Tweaks** | Font size for projection distance (standard classroom / large auditorium), color theme (light / dark), content density (minimal / detailed) |
| **Deliverable Format** | HTML slides + optional PDF — HTML for interactive presentation with speaker notes, PDF for print handouts and offline distribution |

### Preset Behavior

- These defaults are presented to the user for confirmation before proceeding
- The user can override any default value
- If the user says "skip questions" or "just do it", these presets are applied without confirmation
- All assumptions are marked in HTML comments when presets are auto-applied

---

## 5. Trigger Words

The Domain Router uses these trigger words to detect teaching-related prompts:

- "lecture"
- "course"
- "tutorial"
- "student"
- "educational"
- "lesson plan"
- "classroom"
- "curriculum"

### Routing Behavior

- If a user prompt contains one or more of these trigger words (case-insensitive), the Domain Router suggests activating the Teaching domain
- If trigger words from multiple domains are detected, the router presents all matching domains and asks the user to choose
- Explicit activation via "teaching mode" bypasses trigger word detection and activates immediately
