# Agent instructions — ai-teaching-material-system

Keep this file small; Codex reads `AGENTS.md` automatically.

## Critical defaults

- Work only in this project unless Adam explicitly asks for cross-project changes.
- Be conservative: no destructive/broad changes without confirmation.
- Do not read secrets/password notes or use Adam's credit card.
- Do not commit or expose secrets from `.env`, local DBs, or private data.
- For Notion tasks, use Notion MCP/API only; do not open Notion in browser/desktop.

## Project note

AI teaching-material system. For structural/generator work, read `.codex/agent-guide-full.md` first; do not use `/Users/ssyan110/Development/huashu_design` for this project.

Slide style gate: before generating any slide deck, ask Adam which style — `original`, `coral-studio`, or `slate-citrus` (default: Slate Citrus). Skins: `output/pinyin/pinyin-01/design-prototypes/<style>-full-deck/prototype.css`, visual-only, applied as the last stylesheet per slide.

## Load-on-demand docs

- Full previous project instructions: `.codex/agent-guide-full.md`
- Legacy materials index: `.codex/kiro-parity-index.md`
- Direct legacy folders: `.codex/skills/`, `.codex/specs/`, `.codex/steering/`

Do not scan migrated skills/specs by default. Load only the relevant files for the current task.
