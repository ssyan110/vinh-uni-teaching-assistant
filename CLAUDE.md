# Claude Code Instructions — AI Teaching Material System

## Project Overview

Reusable AI teaching-material production system for Chinese courseware used in Vietnamese universities. Pipeline: Source textbook PDFs → structured data → reviewable database → teacher slides → student materials.

---

## Non-Negotiable Rules

1. **Slide engine is Huashu Design (HTML-first).** Not Gamma. PDF/PPTX are exports only.
2. **Language rules:** Vietnamese for instructions/labels, Simplified Chinese for target content, pinyin for pronunciation. No Traditional Chinese or English labels unless Adam asks.
3. **Review gate:** Steps 1-8 can be automated. Steps 9-19 require teacher approval.
4. **Page mapping:** Every slide, exercise, and homework question must trace back to original source pages.
5. **Student safety:** Student-facing materials must not contain teacher tips, internal review notes, or in-class exercise answers.
6. **No AI-isms:** Direct, specific, practical, concise. No "delve/leverage/robust/seamless."
7. **Cross-tool sync.** When updating `.kiro/`, also update AGENTS.md and this file.

---

## Critical Files to Read Before Any Task

| File | When to Read |
|------|-------------|
| `docs/ai-teaching-material-system-requirements-context.md` | Full project spec |
| `.kiro/steering/ai-teaching-material-system.md` | Project rules (auto-loaded by Kiro) |
| `.kiro/skills/ai-teaching-material-systems/SKILL.md` | Pipeline workflow, VP steps 1-19 |

---

## Task Routing Table

| When asked to... | Read these skills |
|------------------|-------------------|
| Pipeline workflow, VP steps, lesson processing | `.kiro/skills/ai-teaching-material-systems/SKILL.md` |
| Slide design, deck generation, visual QA | `.kiro/skills/huashu-design/SKILL.md` |
| PPTX inspection, editing, export | `.kiro/skills/powerpoint/SKILL.md` |
| Google Drive/Sheets automation | `.kiro/skills/google-workspace/SKILL.md` |
| Clean user-facing docs/lesson copy | `.kiro/skills/avoid-ai-writing/SKILL.md` |

---

## Skills Registry

| Skill | Path | Description |
|-------|------|-------------|
| ai-teaching-material-systems | `.kiro/skills/ai-teaching-material-systems/SKILL.md` | Pipeline workflow, VP steps 1-19, language rules, QA |
| huashu-design | `.kiro/skills/huashu-design/SKILL.md` | HTML-first slide/deck generation, visual QA, PDF/PPTX export |
| powerpoint | `.kiro/skills/powerpoint/SKILL.md` | PPTX inspection, editing, export support |
| google-workspace | `.kiro/skills/google-workspace/SKILL.md` | Google Drive/Sheets automation |
| avoid-ai-writing | `.kiro/skills/avoid-ai-writing/SKILL.md` | Clean user-facing docs and lesson copy of AI tells |

---

## Key Reference Files

- `.kiro/skills/ai-teaching-material-systems/references/full-lesson-pdf-to-pptx-vietnamese-university.md`
- `.kiro/skills/ai-teaching-material-systems/references/pinyin-reference-style-prototype.md`
- `.kiro/skills/ai-teaching-material-systems/references/vp-pinyin-lesson-database-and-redesign.md`
- `.kiro/skills/google-workspace/references/gmail-search-syntax.md`
- `.kiro/skills/huashu-design/references/workflow.md`
- `.kiro/skills/huashu-design/references/content-guidelines.md`
- `.kiro/skills/powerpoint/editing.md`
- `.kiro/skills/powerpoint/pptxgenjs.md`
