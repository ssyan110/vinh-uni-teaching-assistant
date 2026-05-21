---
inclusion: always
---

# Agent Routing — AI Teaching Material System

## Routing Table

| Request Pattern | Skill |
|----------------|-------|
| Pipeline workflow, VP steps, lesson processing | `.kiro/skills/ai-teaching-material-systems/SKILL.md` |
| Slide design, deck generation, visual QA | `.kiro/skills/huashu-design/SKILL.md` |
| PPTX inspection, editing, export | `.kiro/skills/powerpoint/SKILL.md` |
| Google Drive/Sheets automation | `.kiro/skills/google-workspace/SKILL.md` |
| Clean user-facing docs/lesson copy | `.kiro/skills/avoid-ai-writing/SKILL.md` |

## Cross-Tool Sync Rule (MANDATORY)

Whenever any skill or rule is updated in `.kiro/`, ALSO update:
1. `AGENTS.md` (project root)
2. `CLAUDE.md` (project root)
3. `.cursorrules` (project root)
4. `.windsurfrules` (project root)

This ensures all AI tools (Kiro, Claude Code, Codex, Hermes, Cursor, Windsurf) stay synchronized.
