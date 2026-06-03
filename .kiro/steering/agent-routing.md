---
inclusion: always
---

# Agent Routing — AI Teaching Material System

## Routing Table

| Request Pattern | Skill |
|----------------|-------|
| Any non-trivial project task, repeated preference, reliability issue, or "Codex keeps forgetting" issue | `.kiro/skills/harness-engineering/SKILL.md` |
| Pipeline workflow, VP steps, lesson processing | `.kiro/skills/ai-teaching-material-systems/SKILL.md` |
| Slide design, deck generation, HTML presenter, visual QA | `.kiro/skills/huashu-design/SKILL.md` |
| Google Drive/Sheets automation | `.kiro/skills/google-workspace/SKILL.md` |
| Clean user-facing docs/lesson copy | `.kiro/skills/avoid-ai-writing/SKILL.md` |

Note: PPTX is removed from the workflow. The `powerpoint` skill is deprecated. Use HTML presenter directly in class.

## Cross-Tool Sync Rule (MANDATORY)

Whenever any skill or rule is updated in `.kiro/`, ALSO update:
1. `AGENTS.md` (project root)
2. `CLAUDE.md` (project root)
3. `.cursorrules` (project root)
4. `.windsurfrules` (project root)

This ensures all AI tools (Kiro, Claude Code, Codex, Hermes, Cursor, Windsurf) stay synchronized.
