# Agent instructions

This file is the entry point for any AI agent working in this repo (Kiro, Hermes, Claude Code, Codex, Cursor, etc.). Read it first.

## Quick start

1. Read this file.
2. Read `docs/ai-teaching-material-system-requirements-context.md` for full project spec.
3. Read the relevant skill under `.kiro/skills/*/SKILL.md` for the task at hand.
4. Kiro agents also get `.kiro/steering/ai-teaching-material-system.md` auto-loaded.

## Project summary

Build a reusable AI teaching-material production system for Chinese courseware used in Vietnamese universities. Source textbook PDFs → structured data → reviewable database → teacher slides → student materials.

## Skills (`.kiro/skills/`)

| Skill | Purpose |
|-------|---------|
| `ai-teaching-material-systems/` | Pipeline workflow, VP steps 1-19, language rules, QA pitfalls |
| `huashu-design/` | HTML-first slide/deck generation, visual QA, PDF/PPTX export |
| `powerpoint/` | PPTX inspection, editing, export support |
| `google-workspace/` | Google Drive/Sheets automation |
| `avoid-ai-writing/` | Clean user-facing docs and lesson copy of AI tells |

Each skill has a `SKILL.md` with full instructions. Read it before doing work in that domain.

## Project rules

- **Slide engine:** Huashu Design (HTML-first). Not Gamma. PDF/PPTX are exports only.
- **Language:** Vietnamese for instructions/labels, Simplified Chinese for target content, pinyin for pronunciation. No Traditional Chinese or English labels unless Adam asks.
- **Review gate:** Steps 1-8 can be automated. Steps 9-19 require teacher approval.
- **Page mapping:** Every slide, exercise, and homework question must trace back to original source pages.
- **Student safety:** Student-facing materials must not contain teacher tips, internal review notes, or in-class exercise answers.
- **Persistence:** Durable project decisions go in repo files, not chat history.

## Writing style

When writing user-facing copy, apply the `avoid-ai-writing` skill:
- Direct, specific, practical, concise.
- No "delve/leverage/robust/seamless", no em-dash overuse, no formulaic openings.
- Preserve Vietnamese/Chinese/pinyin terminology exactly.

## Directory layout

```
.kiro/
├── steering/          Kiro auto-loaded project rules
└── skills/            Agent skills (universal, not Kiro-specific)
scripts/               Project pipeline scripts
docs/                  Specs, requirements
design/                Design tokens, style references
examples/              Sample inputs
output/                Generated artifacts
work/                  Working files (gitignored)
```

## For non-Kiro agents

If your agent doesn't auto-discover `.kiro/skills/`, read the SKILL.md files directly:
- `.kiro/skills/ai-teaching-material-systems/SKILL.md` — AI Teaching Material Systems
- `.kiro/skills/avoid-ai-writing/SKILL.md` — Avoid AI Writing — Audit & Rewrite
- `.kiro/skills/google-workspace/SKILL.md` — Google Workspace
- `.kiro/skills/huashu-design/SKILL.md` — 花叔Design · Huashu-Design
- `.kiro/skills/powerpoint/SKILL.md` — Powerpoint Skill

These are plain markdown files. Any agent that can read files can use them.
