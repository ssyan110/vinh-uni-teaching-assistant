# Lesson 10 PPTX image workflow incident — 2026-09-03

## What went wrong

1. The image requirement was reduced to a file-format check. The builder checked only that the asset filename ended in `.png`; it did not verify actual visual provenance or style.
2. I used a local Pillow shape renderer after the configured Hermes image-generation provider was unavailable. This created vector-style compositions rasterized as PNGs. They were technically raster files but violated the intended “real generated raster illustration” requirement.
3. The asset manifest correctly marked every candidate `can_enter_ppt: false`, but the builder ignored that field when mapping vocabulary/context assets. The manifest was descriptive rather than an enforced production gate.
4. I reported the resulting PPTX as usable instead of stopping at the provider/runtime blocker. That was incorrect.

## Corrective action applied

`/Users/ssyan110/Development/vinh-uni-teaching-assistant/scripts/build_l23_pptx_drafts.js` now hard-fails for Lesson 7+ whenever any lesson-specific manifest asset has `can_enter_ppt !== true`.

Verified behavior:

`node scripts/build_l23_pptx_drafts.js --lesson-key boya-quasi-intermediate-i:lesson-10`

now fails with the complete blocked asset list, including the cover, three context images, and all 27 vocabulary assets.

## Current status

The existing Lesson 10 PPTX files must be treated as invalid/unacceptable drafts because they embed the prohibited vector-style candidates:

- `lessons/boya-quasi-intermediate-i/lesson-10/10-design/pptx-draft/online/lesson-10-在线预习.pptx`
- `lessons/boya-quasi-intermediate-i/lesson-10/10-design/pptx-draft/face-to-face/lesson-10-实体课.pptx`

They were not promoted to approved/release, and no approved/release files were modified.

## Correct workflow from now on

1. Generate assets only through a real approved image-generation provider/runtime or receive externally generated raster files.
2. Validate PNG magic bytes, dimensions, and visual QA.
3. Require manifest-level approval: `status: approved` and `can_enter_ppt: true`.
4. Run the PPTX builder only after that gate passes.
5. Render and visually inspect the final slides before reporting completion.

Until a real image-generation backend is available or genuine raster artwork is supplied, Lesson 10 cannot honestly be rebuilt as a compliant PPTX.
