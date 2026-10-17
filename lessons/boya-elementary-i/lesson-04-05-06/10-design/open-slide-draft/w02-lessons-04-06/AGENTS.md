# open-slide — Agent Guide

You are authoring **slides** in this repo. Every slide is arbitrary React code that you write.

## Vinh project adapter (owner-maintained, not vendor skill cache)

The repository root `AGENTS.md`, `PROJECT_REQUIREMENTS.md`, canonical workflow contract, `docs/classroom-html-standard-2026-10-07.md` and `docs/classroom-activity-workflow.md` govern content, approval, typography, deliverables and QA. Read those from the repository root before authoring. Vendor skills below supply runtime/file-contract techniques only; conflicting procedural defaults do not override the project.

- Classroom style is the standing L9–10 baseline. Do not re-ask style, canvas preference or page count already determined by the approved content; preserve actual activity needs. Do not impose vendor density or fixed page-count templates.
- Obtain the actual version's content approval before new visual production. Existing style selection is not content approval.
- Use system KaiTi for Chinese and Times New Roman for Latin text; no webfonts, custom font installation or font assets. Retain runtime-required canvas dimensions for native React pages, but apply project role typography and rendered readability checks rather than vendor visual defaults.
- Presenter `notes` may accompany React pages. They do not replace the separate teacher reading/answer materials required by the project; deliver those in the prescribed format and scoped lesson design directory. Markdown content-review files and teacher-script files are permitted.
- Register and verify every deck through the shared homepage, including all pages, navigation and entry motion; run scoped sync/build checks. Start the existing dev service when needed for this authorized QA, checking for an existing instance first. A preview is not authority, release or classroom acceptance.
- Do not update packages or sync vendor skills as routine slide work. Preserve this adapter when an explicitly authorized dependency update is performed; never fix project policy only inside `.agents/skills/`.

## Hard rules

- Put your slide under `slides/<kebab-case-id>/`.
- The entry is `slides/<id>/index.tsx`.
- Put slide-specific images/videos/fonts under `slides/<id>/assets/`. For assets reused across decks or themes (logos, avatars), use the global `assets/` folder and import via `@assets/...`.
- Do **not** touch `package.json`, `open-slide.config.ts`, or other slides.
- Do not add dependencies. Use only `react` and standard web APIs.

## Which skill to use

- **Drafting a new deck** — use the `create-slide` skill. It walks through scoping questions, structure, and hand-off.
- **Applying inspector comments** (`@slide-comment` markers in a page) — use the `apply-comments` skill.
- **Creating or extracting a theme** — use the `create-theme` skill. Themes live as markdown under `themes/<id>.md` and are read by `create-slide` before authoring.
- **Resolving "this page" / "this element"** — when the user references the current slide or selection without naming it, consult the `current-slide` skill. It reads the dev server's `node_modules/.open-slide/current.json` to find which slide, page, and inspector-picked element they mean.
- **Writing a speech script / speaker notes** — use index-aligned `notes` for presenter display when appropriate, and the separate teacher materials required by the project adapter above.
- **Any other slide edit** — read the `slide-authoring` skill before writing. It is the technical reference for everything inside `slides/<id>/`: file contract, the 1920×1080 canvas, type scale, palette, layout, assets, self-review checklist, and anti-patterns. `create-slide` and `apply-comments` both defer to it for the *how*.

Keep this file short: hard rules only. All deeper guidance lives in the skills above.

## Updating skills

The skills above are managed by `@open-slide/core`. Do not edit them in place. To pull the latest versions:

```
pnpm up @open-slide/core
pnpm sync:skills
```

`pnpm dev` will also detect drift on startup and offer to sync. `pnpm sync:skills --dry-run` (via `pnpm exec open-slide sync:skills --dry-run`) previews changes without writing.
