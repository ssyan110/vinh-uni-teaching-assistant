# Vinh University teaching project — Claude entry point

Read [AGENTS.md](AGENTS.md), then [the canonical workflow contract](docs/workflow/canonical-workflow-contract.md). This file routes to those owners; it does not define another production workflow.

- Online pre-study: editable PPTX. Read [online production and QA](docs/workflow/online-pptx-lifecycle.md).
- In-person classes: native React OpenSlide in the configured shared workspace. Read [workspace and editing checks](docs/open-slide-workspace.md) and [activity design](docs/classroom-activity-workflow.md). HTML, iframes, flattened pages and classroom PPTX backups are not substitutes.
- Use the [task router](.codex/steering/agent-routing.md) for the relevant local skill. Reuse the confirmed course/format style and language; do not impose the old Vietnamese-only instruction default or a new style-choice gate.
- Content approval is version- and scope-specific. Technical QA, human review and release remain separate. Preserve teacher edits and approved artifacts.
- Do not create or maintain `.kiro/`. Classic HTML documentation is historical compatibility guidance, not the current production route.

The superseded entry point is preserved in `.agent/runs/slide-guidance-cleanup-20261103/before/CLAUDE.md` for audit only.
