# OpenSlide 37-slide output validation

## Delivered artifacts

- `lesson-09-10.html` plus `assets/` is the standalone OpenSlide HTML export. The final HTML ZIP integrity check passed and contains 20 object PNGs and five required font files.
- `lesson-09-10.pptx` keeps the OpenSlide native text, shapes, and notes, with 40 separate source PNG picture objects across the image-bearing slides. PPTX contains 37 slide XML files, 20 distinct `ppt/media` PNGs, 40 `<p:pic>` objects, 420 text runs, and no broken image relationships. ZIP integrity check passed.
- `source/lesson-09-10-index.tsx` records the source edits; `source/page-map.csv` maps output pages to original pages. `notes/teacher-notes.md` preserves classroom notes.

## Content corrections

- Removed the unrelated cafeteria/classroom illustrations from slides 5, 7, and 10.
- Removed the redundant venue-name labels from slide 29 while retaining the location constraints and venue pictures.
- Checked the two cola prices remain distinct: 3 元 9 角 8 分／瓶 on slide 14 and 4 元／瓶 on slide 31.

## Visual reference and limit

`check-version-contact-sheet.png` shows the pre-correction browser screenshots and is retained only as check-version evidence. It is not a visual check of the final corrected slides. I could not render the corrected HTML or repaired PPTX for a fresh visual pass: the OpenSlide preview server at `127.0.0.1:5183` was unavailable, `agent-browser` was not installed, Library returned zero renderable PPTX pages, and no headless Office/LibreOffice converter was available. Content changes are verified against the standalone HTML's slide DOM, source JSX, and PPTX XML/package integrity; PowerPoint visual QA remains outstanding.
