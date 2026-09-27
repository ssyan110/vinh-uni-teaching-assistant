# Project tools

## Open Slide

[`open-slide/`](open-slide/) is a pinned Git submodule of [open-slide/open-slide](https://github.com/open-slide/open-slide). It provides an agent-oriented React slide framework with a 1920×1080 canvas and browser, HTML, PDF, and PPTX output.

For each new deck, Adam can select `open-slide`; otherwise use the project default, `native-pptx`. Keep Open Slide lesson work under that lesson's `10-design/open-slide-draft/` and declare the intended output format. Until an Open Slide QA, approval, and release path is defined, its artifacts are design drafts and cannot enter `20-approved/`, `30-qa/`, or `40-release/`.

Initialize the pinned source after cloning the project:

```sh
git submodule update --init tools/open-slide
```
