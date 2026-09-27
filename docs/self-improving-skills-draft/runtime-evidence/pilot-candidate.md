---
name: learned-codex-skill-verification
description: Verify discovery and actual use after installing or updating a local Codex skill, especially when a task still shows an old skill catalog.
---

# Verify a local Codex skill

Run structural validation first, then query the installed app-server with `skills/list`, `cwds` containing the intended workspace, and `forceReload: true`. Match the exact absolute SKILL.md path and inspect `enabled`; a folder existing or a plugin listing does not establish user-skill discovery.

Discovery is a separate result from use. In a subsequent relevant task, verify that the agent reads the current SKILL.md and follows its procedure. Do not claim that a prior task snapshot changed or that every future task will load it. Retain the actual discovery result and the relevant task evidence.

After an edit, compare the current file hash and refresh discovery. If the runtime does not expose the method, report that limitation and inspect its installed protocol rather than inventing a CLI command. Do not modify task history, unrelated skills, or permission settings to make the check pass.
