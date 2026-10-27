# Current root-cause controls — 2026-10-21

This record supersedes earlier current-status claims below. The 18-page draft now passes full reviewed-copy and image mapping, registered lesson identity, generic browser geometry/font/line checks, and fresh read-only render verification at sync. Restored approved wording on slides 3 and 9; slide 11 punctuation matches v02. Removed five superseded CSS rules without changing approved inputs.

- Current report: `qa/rendered-layout.json`, schema v2; binds HTML, contract, assets, checker, page measurements and screenshot integrity.
- 43 Python tests passed; nine browser negative cases rejected; a different-deck route fixture also passed.
- Current 18 pages: zero reported issues/errors; minimum footer clearance 71.594px, required 64px.
- Actual unified homepage: all 18 pages and forward/back navigation passed; current source contact sheet and changed pages reviewed.
- Unified verification, synchronization and build passed. Existing large-bundle warning remains.
- Evidence: `.agent/runs/classroom-slide-controls-20261021/`; root-cause report: `docs/qa/classroom-slide-root-causes-2026-10-21.md`.
- Design draft only; no teacher rehearsal, classroom acceptance, approval promotion or release is claimed.

---

# Current visual correction — 2026-10-20 footer spacing and semantic line breaks

All 18 pages of the current HTML were rendered and checked, including the actual embedded workspace pages. Body/card clearance from footer is at least 72.56px (64px minimum). The prior structural-only pass did not cover this requirement; earlier records below describe superseded versions. Text remains identical to approved copy; only layout and line breaks changed.

- Current rendered report: `qa/rendered-layout.json` (HTML/checker SHA-bound).
- Full evidence: `.agent/runs/w06-footer-typography-20261020/evidence.md`; screenshots and actual workspace measurements in that run.
- All 18 pages: zero measured geometry/line issues; whole-deck contact sheet and focused full-size visual review completed.
- 22 static/workspace tests and both browser negative cases passed; sync/build passed.
- Complete day's production rules consolidated in `docs/classroom-html-standard-2026-10-07.md`.

---

# 第13—14课 OpenSlides 视觉与内容 QA

## 文件与状态

- 课件：18页设计草稿；源文件 SHA-256 见 `lesson-13-14-draft-manifest.json`。
- 文案输入：第1—12页沿用 `lesson-13-14-逐页文案审阅-v02.md`；第13—18页使用 `lesson-13-14-逐页文案审阅-v03.md`。
- 视觉参照：第9—10课封面与整体视觉；第11—12课路线图标卡和相同活动版式。
- 课程范围：`boya-elementary-i:lesson-13`、`boya-elementary-i:lesson-14`，offering `2026-fall`。
- 发布状态：设计草稿，未进入批准或发布目录。

## 本轮修订与根因

这次页序错误的直接原因是把“第13、14、15页分两页”理解成“HSK 1–3 与 HSK 4–6 各占一页”，没有按“题目页、双等级支持页”拆分。之后我又把这个错误写进检查器，要求每页只有一张 HSK 卡，并让测试验证了错误结构，所以检查通过也没能发现题目重复和两档被拆开。

现在第13、15、17页只呈现各自题目；第14、16、18页各自并列呈现 HSK 1–3 与 HSK 4–6 支持，不再重复题目。检查器和测试已改为核对这三组成对页面、两档同页及支持页不含题目。该规则只用于明确要求拆页的开放题；默认仍是一页完成。

## 检查结果

- 静态检查：`scripts/check_open_slide_visual_consistency.py` 通过；校验 18 页、四栏路线、题目／支持页配对、两档同页、支持页不重复题目、漫画单图、口语范例与核准文案。
- 字号：复述、讨论、活动要求和讨论范例正文最低 45px；拆分讨论范例 50px；参考回答标签 40px。页眉、活动标记、路线副标和页脚沿用第9—12课的字号角色。
- 回归测试：`python3 -B -m unittest tests.test_open_slide_visual_consistency -v`，14项通过；另运行 `python3 -B -m unittest tests.test_open_slide_workspace -v`，7项通过。负向样例覆盖题目复现、等级拆页、缺少任一等级、页面错序、正文缩小、照片选项及同步失败。
- OpenSlides workspace：已同步18页；`npm run build` 成功。构建输出仍有主 bundle 超过500 KB 的性能提示。
- 浏览器视觉检查：通过同步后的 OpenSlides 首页实际渲染第13—18页，六页均已逐页检查；题目页只呈现题目，支持页两档并列、无重复题目，文字与卡片无溢出或重叠。截图和总览保存在 `.agent/runs/w06-l13-l14-paired-prompt-support-20261020/screenshots/`。
- Blooket 不在学生课件中，教师另开网页复习。

## 草稿边界

本 QA 仅记录当前 HTML 草稿的静态、构建和第13—18页浏览器检查；没有替代 PowerPoint 实播、教师 rehearsal、课堂验收或正式发布。
