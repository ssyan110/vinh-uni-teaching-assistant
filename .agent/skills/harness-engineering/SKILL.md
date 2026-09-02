---
name: harness-engineering
description: Portable project harness for the AI Teaching Material System. Read this before non-trivial tasks to keep context, validation, and durable feedback inside the repo instead of chat.
---

# Harness Engineering

This `.agent` copy is the canonical project harness. Kiro is retired for this project; do not create or maintain `.kiro/` and do not route new work through legacy Kiro files.

Minimum loop:

1. Define the artifact and success gate.
2. Read `AGENTS.md`, `PROJECT_REQUIREMENTS.md`, `memory/project-memory.md`, and the relevant `.agent/skills`.
3. Use existing project scripts, templates, lesson structure, and output folders.
4. Verify with concrete checks appropriate to the artifact: PPTX open/edit/audio checks, slide rendering, PDF/print checks, data/schema checks, or classroom-flow checks.
5. Inspect outputs/logs/screenshots before reporting.
6. Write durable repeated preferences back into project files when Adam asks.

For non-trivial multi-step production, create a local run packet with
`scripts/agent_loop.py`. Its phase and retry state describe only the current
agent execution. Never copy lesson approval or release state into the run packet;
the lesson registry, manifests, production gate and authority folders remain the
only sources of truth.
