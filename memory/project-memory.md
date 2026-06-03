# AI Teaching Material System Project Memory

This file is durable project context for AI agents. Read it after `AGENTS.md` and before doing non-trivial work.

## Harness Engineering Default

Adam added this because he has had to repeat the same instructions to Codex too often.

For this project, use harness engineering by default:

- Define the artifact under work and its success gate before editing.
- Load project-local context first: `AGENTS.md`, `.kiro/skills/harness-engineering/SKILL.md`, `.kiro/steering/`, relevant `.kiro/skills`, and project docs.
- Use existing scripts, lesson templates, output folders, presenter patterns, and validation routines.
- Verify with concrete checks: pipeline/data validation, HTML presenter smoke tests, browser screenshots/contact sheets, no-overflow review, vocab image match review, and PDF export only after Adam confirms finalization.
- Inspect outputs, logs, screenshots, and diffs before saying work is done.
- When Adam says a preference should persist, update repo-local files and cross-tool rules so future agents do not depend on chat history.

## Current High-Value Project Rules

- Huashu Design is the slide engine. HTML presenter is primary. No PPTX workflow unless Adam explicitly changes this rule.
- Vietnamese is used for instructions and labels; Simplified Chinese is used for target learning content; pinyin supports pronunciation.
- Steps 1-8 can be automated before teacher review. Steps 9-18 require teacher approval.
- Lesson 01 is the canonical template for regular lessons.
- Clean PDF backups are finalization artifacts; ask Adam before exporting them.
