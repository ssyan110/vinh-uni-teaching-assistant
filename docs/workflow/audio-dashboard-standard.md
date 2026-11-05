# Audio dashboard: naming, layout and delivery standard

This standard applies to every future book, lesson, playlist, management link and related page created or revised for `classroom-tools/audio-dashboard/`. Preserve the existing dashboard design. Current user instructions take precedence; do not introduce a separate visual or naming convention for a new course.

## Shared implementation

- Use `dashboard.css` for the navy/teal palette, typography, spacing, controls, focus outlines and responsive layout. Use `ui.js` for playlist labels, track titles, numeric ranges, metadata and checklist names. Add reusable changes there rather than per-book styles or formatters.
- Register new material in the authoritative course/assessment/audio sources and the shared catalog workflow. Preserve book-level `management_url` and `tools` destinations when regenerating a catalog; re-verify their actual sheet IDs instead of dropping them or substituting another book’s URLs. Do not create a standalone lesson player to avoid this standard. Check the actual source/version before changing generated data. If the generator is missing, report that limitation and make only an explicitly scoped change; do not invent registrations or use a different lesson's links.
- Preserve audio IDs, filenames, URLs, question mappings, order and source meaning. Formatting operates on displayed text, not identifiers. Never infer approval or publication from playback or a passing check.

## Names and visible text

| Item | Convention/example |
| --- | --- |
| Book | Use the authoritative full book title, including volume, consistently in every selector. |
| Assessment playlist | `一年级 W08 第16–17课听力测验（审阅稿）`; use the real year, week, lessons, assessment type and review state. |
| Weekly textbook playlist | `二年级 W10 教材原音` |
| Collected source playlist | `二年级 已登记课次教材原音`; do not claim all lessons unless coverage is verified. |
| Ranges | `第1–4题`, `P12–P13`; keep `Audio 4-2` unchanged. |
| Track title | Use a source-backed descriptive title. If unavailable, show `音频（标题待补）` and retain the original ID below it; report the gap. |
| Track metadata | `第4课 · Audio 4-2 · 第1–2题`; omit question range for non-assessment audio. Player and list use the same formatter. |
| Management links | Reuse `综合管理总表`, `本卷成绩`, `题库／答案`, `音频管理表`, `评分／表单回应`, `表单设置`, `教师答案（审阅稿）`, `表单编辑（审阅稿）`, `周测检查` as applicable. Editing a form and changing settings are different actions; labels must describe the actual destination. |
| Playback controls | `上一段`, `从头播放`, `下一段`; row action `播放`, played state `已播放`, missing state `音频缺失`. Do not use an external-link arrow for local playback. |

Use simplified Chinese. Keep necessary instructions visible and specific. Status text must distinguish registered snapshots, unpublished/review materials, missing data and actual release decisions.

## Layout and behavior

1. Keep the order: header → book/playlist/lesson filters → applicable management links → exam entry or explanatory state → player and grouped queue → footer. Reuse the shared desktop columns and phone stacking.
2. Keep existing assessment section headings/order. Group other audio by lesson without changing track order or filter membership. Preserve cross-lesson entries when either related lesson is selected.
3. Always show the same seven management buttons in this exact order: 综合管理总表 → 本卷成绩 → 题库／答案 → 音频管理表 → 评分／表单回应 → 表单设置 → 周测检查. Reuse `ui.managementLabels` and `ui.managementTools` for every book and playlist, including empty books and source-only lists. Use verified book-level destinations where applicable and the selected assessment’s own form/grade/checklist destinations. Missing destinations keep a visible, keyboard-focusable `aria-disabled` button with no href and an explanation; never hide the button, fabricate its destination or use another exam’s link. Additional review/answer links go in the separate supplemental row.
4. Keep missing audio visible, disabled and counted. An empty book has a disabled playlist placeholder. An empty selection disables all playback controls. Preserve keyboard focus visibility, labeled selectors, live status and dialog controls.
5. Previous/next select a track without autoplay. Row selection plays from the beginning. Keep QR projection separate from source audio, reset stale QR/link state on selection changes, and check local host-page availability before offering its link.
6. Checklist pages reuse the same stylesheet and playlist labels, retain the selected exam in the return link, and describe the scope/time of saved checks accurately.

## Required checks before delivery

Run from the project root:

```sh
node classroom-tools/audio-dashboard/check-consistency.cjs
node classroom-tools/audio-dashboard/check-consistency.cjs --strict --book BOOK_ID --set PLAYLIST_ID
```

Replace `BOOK_ID` and `PLAYLIST_ID` with the actual catalog IDs. The first command checks the whole catalog and reports existing data gaps as warnings. The second checks the changed/new playlist and fails on missing files or placeholder titles. If a real source gap prevents a strict pass, retain the honest missing state and explicitly report incomplete source coverage; do not invent a title/file or claim a pass. Run the strict command for each changed/new playlist. These commands are manual delivery gates, not installed CI or proof of visual consistency.

In the browser, verify every new/changed playlist and related page at desktop width and 390/320 px: inspect actual names, grouping, reading order, spacing, truncation, contrast and overflow; exercise each lesson filter, all-deselected state, navigation, playback initiation and available QR/dialog/checklist controls. Compare cross-lesson filtering against source membership. Inspect screenshots and save scoped evidence. Check affected existing playlists when changing shared code. Automated checks do not replace this visual/behavior review or teacher listening.

Existing source gaps remain explicit until source-backed repairs are authorized. Do not regenerate historical lessons or change Google Forms/Sheets, approvals or release state merely to meet UI consistency.
