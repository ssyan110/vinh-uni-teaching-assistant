# Vinh University PPTX audit — 2026-09-03

Scope:
- Finalized quasi-intermediate Boya PPTX under `lessons/boya-quasi-intermediate-i/*/20-approved/pptx/`
- Lesson 7–12 teaching folder: `/Users/ssyan110/Desktop/Work/Teaching/VinhUni/00_上課教材/第七课到第十二课`
- Lesson 10 current draft package

## Technical checks

Checks used: PPTX ZIP integrity, 16:9 canvas (`12192000 × 6858000` EMU), slide count, blank-slide risk, minimum explicit font size, embedded PNG count.

### Finalized quasi-intermediate decks

- Lessons 01–09: 18 approved PPTX files found.
- All 18: ZIP PASS, 16:9 PASS, 0 blank slides, minimum explicit font 20 pt.
- Lessons 07–09 desktop copies: 6 PPTX files found; all pass the same technical checks.

### Lesson 10 draft decks

- Online: 67 slides; ZIP PASS; 16:9; 0 blank slides; minimum explicit font 20 pt; 69 embedded PNGs.
- Face-to-face: 51 slides; ZIP PASS; 16:9; 0 blank slides; minimum explicit font 20 pt; 44 embedded PNGs.
- Build gate: READY; blockers: none.
- Both remain `draft_not_approved`.

## Lesson 10 asset work completed

Generated and registered 31 lesson-specific PNG candidates:

- 1 cover image
- 3 short-text context images
- 27 vocabulary images

Manifest:
`lessons/boya-quasi-intermediate-i/lesson-10/10-design/assets/image-manifest.json`

Generator:
`scripts/generate_lesson10_raster_assets.py`

Asset status remains `candidate_pending_review`; release approval was not claimed. The images are semantic, textured raster study candidates, but still require Adam/teacher visual approval before promotion to approved/release.

Contact sheet:
`lessons/boya-quasi-intermediate-i/lesson-10/10-design/assets/lesson-10-vocab-contact-sheet.png`

## Folder inventory finding

The named desktop folder currently contains only six PPTX files:

- Lesson 07 online / face-to-face
- Lesson 08 online / face-to-face
- Lesson 09 online / face-to-face

No Lesson 10, 11, or 12 PPTX is present in that folder. Lesson 10 exists only in the development project as draft decks; Lessons 11–12 were not found as PPTX deliverables in the searched project scope.

## Excluded historical/legacy anomalies

The broad recursive project search also found archived/prototype PPTX files. They are not treated as finalized deliverables. Some intentionally fail current standards, including sub-20-point text and one archived file with blank slides. They remain historical files and were not modified.

## Overall status

- Finalized quasi-intermediate Lessons 01–09: technically PASS.
- Desktop Lesson 07–09 package: technically PASS, but incomplete for the folder name “Lesson 07–12”.
- Lesson 10: technically valid draft rebuilt with all required PNG files embedded; visual/source approval still pending.
- Lesson 11–12: not present as PPTX deliverables in the searched scope.
