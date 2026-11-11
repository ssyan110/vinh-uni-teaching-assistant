# Upstream source and local adaptation

- Source: [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar)
- Upstream skill: `plugin/skills/lemo-opuscar/SKILL.md`
- Reviewed source revision: `bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00` (2026-11-02)
- Upstream skill file blob: `89b1a84f849cfbbb872696d767f917273d9a5b83`
- License: MIT; see [LICENSE](LICENSE).

This project-local copy adapts the skill routing and production workflow to the Vinh teaching project. It omits upstream `scripts/setup.sh`: that script defaults the library to `~/lemo-opuscar`, can reset a managed clone and uses `rm -rf`, and its dependency mode installs packages and a browser. The library, plugin, and dependencies have not been installed.
