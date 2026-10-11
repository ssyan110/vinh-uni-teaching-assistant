# Validation — classroom follow-up export

- Final output: 46 HTML slides and a 46-slide editable static PPTX. HTML reveal motion is teacher-controlled, one-time per entry, and supports arrow/space/buttons and reduced motion. Static PPTX does not retain browser motion.
- Full HTML browser QA: 46/46 pages rendered; zero broken images, out-of-canvas content, hidden-content pages, or JavaScript exceptions. Arrow/space/button navigation advances exactly one page; no auto-advance; revisit replays; reduced-motion mode disables animation and reveals all content.
- Source mapping preserves original v3 IDs. Thirteen original slide pairs merged and one divider added before original slide 31: original 18+19 → output 14; 27+28 → 21; 31+32 → 25 (after new divider at 24); 45+46 → 36; 49+50 → 38, numbered 01–09. See `slide-merge-map.md` and `source/classroom-motion-map.json` for the full map.
- Callout cards are three equal columns; their text is 46px source size and one line. Banana `4 元 5 角／斤` is one line at 46px. Original slide 44’s three route-fare labels each remain one line at 48px. The welcome-budget page uses compact single-column question rows to keep `元` attached and clear the footer.
- Meaningful emphasis only: deadlines, budgets, constraints, critical exceptions, and true contrasts. Routine `几点见？`, `上午 9:00`, and `学校东门` remain plain; 42 targeted highlight phrases are matched across the deck and colored as 45 editable text runs.
- Key facts preserved: 100 元, 70 元, 80 元, banana 4 元 5 角／斤, cola 3 元 9 角 8 分／瓶, separate cola 4 元／瓶.
- HTML ZIP contains the standalone HTML plus 25 local resources in 26 archive files; integrity and missing-resource checks passed.
- PPTX structural QA: 46 slide XML parts, 20 embedded images, 42/42 focus phrases matched, zip integrity passed. Microsoft PowerPoint opened the final uniquely named PPTX and reported 46 slides with no content-repair prompt. A full PowerPoint PDF render was not obtained; HTML received full-page browser rendering.

- Library replacement was attempted for the existing ZIP and PPTX identities using version-3 guards; both writes returned `access_denied`, so those Library items remain at version 3 pending write access. Canonical project files above are current.
