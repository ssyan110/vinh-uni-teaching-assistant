---
name: harness-engineering
description: Default project workflow for the AI Teaching Material System. Use this before any non-trivial lesson, slide, database, Google Sheets, PDF, image, pipeline, automation, or repeated-preference task so agents do not depend on chat reminders.
---

# Harness Engineering

Use this as the first project-local skill for non-trivial work.

## Goal

Make the project reliable for Codex, Kiro, Hermes, Claude Code, Cursor, and Windsurf by keeping context, rules, tools, checks, and lessons learned inside the repo.

## Loop

1. Define the artifact
   - Lesson database, HTML deck, presenter, slide asset, vocabulary image set, homework bank, Google Sheets export, PDF backup, teacher guide, script, or docs.
   - Name the success gate before editing: build passes, screenshots inspected, no overflow, database schema valid, source pages mapped, presenter opens, PDF exported only after Adam confirms finalization.

2. Load local context
   - `AGENTS.md`
   - `memory/project-memory.md` if present
   - `.kiro/steering/ai-teaching-material-system.md`
   - Relevant `.kiro/skills/*/SKILL.md`
   - `docs/ai-teaching-material-system-requirements-context.md`
   - `docs/lesson-slide-template-guide.md` for slide/template work

3. Execute inside the project
   - Prefer existing templates, scripts, configs, and Lesson 01 slide patterns.
   - Keep outputs under the existing `output/book-{N}/lesson-{NN}/` structure.
   - Do not touch unrelated generated output or deleted legacy files.
   - No PPTX workflow unless Adam explicitly changes the project rule.

4. Verify with concrete checks
   - Pipeline/data: run the relevant script and validate JSON/CSV shape.
   - Slides: open the lesson-root `index.html`, confirm it launches `slides/index.html`, render screenshots/contact sheets, and inspect overflow/content/image matches.
   - Presenter: verify MANIFEST order, thumbnails, navigation, annotation tools, and locked CDN versions.
   - PDF: export a clean backup only after Adam confirms design/content finalization.
   - Research/current facts: browse and cite sources.

5. Observe and report
   - Inspect terminal logs, browser errors, screenshots, generated files, and diffs.
   - Final response should say what changed, which checks ran, and what risk remains.

6. Feed durable lessons back
   - If Adam says he keeps repeating an instruction, encode it in `AGENTS.md`, `.kiro/steering`, relevant `.kiro/skills`, `.agent/skills`, and cross-tool files.
   - If the lesson is project-specific, add it to `memory/project-memory.md`.
   - If the lesson is global to Adam, add a Codex memory update note under `~/.codex/memories/extensions/ad_hoc/notes/`.

## Done Means

The artifact works, the verification was run or clearly reported as unavailable, and the rule that prevents repeat reminders is now in a repo-local file.
