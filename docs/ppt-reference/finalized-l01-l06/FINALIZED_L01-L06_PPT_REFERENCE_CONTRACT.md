# Finalized L01–L06 PPT Reference Contract

Status: **read-only reference / audit input**  
Source of truth: `/Users/ssyan110/Desktop/finalized_博雅汉语_准中级加速篇1_第一课到第六课`  
Scope: the 12 finalized native PPTX files for `boya-quasi-intermediate-i`, Lessons 01–06.  
Non-effect: this contract does **not** approve, replace, move, overwrite, or release any project PPTX.

## Canonical outputs

Each lesson has exactly two distinct student-facing decks:

| Mode | Canonical role | Student-facing language pattern |
|---|---|---|
| `在线预习` | Vocabulary preparation; pre-listening; textbook read/listen; three short-text key-point records; personal preparation; pre-class check | Chinese learning content plus concise Vietnamese vocabulary equivalents where present in the finalized reference |
| `实体课` | Listening comprehension; peer speaking; retell/compare; pattern production; integrated expression; feedback/retry | Chinese student-facing instructions and learning content; no Vietnamese translation layer in finalized L01–L06 |

## Shared native PPTX contract

- 16:9 slide size: `12192000 × 6858000` EMU.
- Persistent upper-left lesson header: `594360,228600,4114800,256032` EMU.
- Every slide has a sequential two-digit upper-right slide number at `10972800,228600,594360,256032` EMU.
- Main section-title slot normally uses `658368,896112,7315200,566928` EMU.
- Hanzi uses the finalized run-level `KaiTi` convention; Vietnamese/Latin uses `Times New Roman` in `latin`/`cs`. Do not normalize whole files with a blanket font rewrite. Mixed Chinese/Vietnamese fields must use separate font runs.
- Images/media are embedded in the PPTX package. The slide canvas is pure white `#FFFFFF`; warm white is local-only for cards, image frames, or illustration content. Some slides inherit white from the master, so visual output plus XML inspection—not one XML representation alone—is the acceptance criterion.
- All visible student-facing text in the audited decks is at least `20 pt`. The role baseline is: header/page/material/audio/keyword `20 pt`; compact body `21 pt`; body `22 pt`; pinyin `24 pt`; standard title `34 pt`; long title `27 pt`; task prompt `28–34 pt`; divider `48 pt`; cover title `44–50 pt`; goals title `36 pt`, label `23 pt`, number `20 pt`, item `24 pt`; vocabulary headword `42 pt` or `34 pt` when long, part of speech about `20–22 pt`, Vietnamese meaning about `20–22 pt`, usage `20 pt`, vocabulary example `22 pt`; online expression-practice examples are a separate role at `35 pt`.

## Online sequence contract

`Cover (no bottom subtitle) → learning-flow map → learning goals frame (3–4 lesson-specific numbered goals) → vocabulary groups (one target per slide) → Vietnamese equivalent / word-specific examples when supplied / image → “说中文并造句” retrieval after each group → three short-text topic + record-practice blocks → information synthesis → personal preparation → difficulty note → pre-class check.`

Online decks do not paste full long texts into slides and do not carry the face-to-face integrated speaking finale.

Online vocabulary is the deliberate language exception: the visible `意思` field is reviewed Vietnamese vocabulary, never English, a canonical gloss, or a Chinese fallback. In the audited L1–L6 files, `使用场合`, `用法`, `扩展`, `详细语法`, `常用短语`, and `例句` vary by word and may be blank; for all new lesson drafts, the example bank requires exactly two short examples per vocabulary item. A blank optional field must render as no label; examples must never be synthesized from a long textbook sentence.

The audited cover has only the lesson title, mode badge, header/page number and main visual. The audited learning-goals page has the stable outer frame `学完这课后，我能……` plus `听懂 · 介绍 · 讨论 · 准备`, followed by 3 or 4 numbered lesson-specific goals. The numbered markers are filled circles in teal, coral, purple and yellow sequence, with white numerals and no outlined square. The frame is reusable; the goal text and item count are not global.

For an online expression-practice slide, the persistent lesson header and textbook page marker remain, but the black expression title and visible `情境：` line are omitted. The purple round-rectangle pattern box is the sole visible expression heading. It is followed by exactly two independent short examples at `35 pt`, then the student instruction and three writing lines. The PBI/context requirement remains in the teacher-manual and teaching-design layer, not on this student slide.

## Face-to-face sequence contract

`Cover → learning route → Can-Do → warm-up → listening practice → low-stakes speaking → [short text 1 / 2 / 3: listening, oral practice, retell/compare, pattern practice, common expressions, constrained speaking] → integrated expression → textbook questions → final speaking.`

Each classroom slide serves one observable learner action. The short-text listening prompt family is: `先看题、抓关键词，再听并记重点，最后回答。`

## Controlled variability

Slide count, warm-up count, vocabulary/pattern count, listening task type, and second-pass response wording may change by lesson. The mode boundary, recurring sequence, header/page-number geometry, deck family, and role of section types may not be changed without an explicit design decision.

## Required checks before future promotion

1. Compare against `finalized-ppt-reference-manifest.json` and the full audit `FINALIZED_L01-L06_PPT_AUDIT_2026-09-02.md`.
2. Verify 16:9, pure-white canvas, page-number sequence, protected geometry, embedded media and in-bounds shapes.
3. Verify online/face-to-face content routing, lesson-specific route variant, section names and slide count.
4. Verify one-item vocabulary cards, reviewed Vietnamese meaning, optional per-word fields, short-text record format, and no full-text slide dumps.
5. Verify font runs and visible size by role; render/inspect the complete PPTX before any approval decision.

## Audited protected geometry

The audited common EMU positions are recorded in `course/boya-online-layout-contract.json`: canvas `12192000 × 6858000`; header `594360,228600,4114800,256032`; upper-right page number `10972800,228600,594360,256032`; header rule `594360,630936,10972800,0`; main title `658368,896112,10607040,566928`; bottom textbook marker `9464040,6419088,2103120,256032`. The learning-goals and vocabulary card geometry is also locked there. Lesson-specific route assets and cover title sizes belong in `course/boya-online-content-contract.json`.

## Content defects observed but not copied

The finalized corpus is the visual authority, not a clean content source. The audit observed isolated legacy defects, including an English `hot` in a Lesson 05 vocabulary meaning and duplicated Vietnamese text in Lesson 06. These finalized files remain unchanged; future drafts fail closed until their own content contract supplies reviewed `meaning_vi`, explicit blank markers for optional fields, and lesson-specific goals.
