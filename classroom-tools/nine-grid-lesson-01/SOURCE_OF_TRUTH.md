# 宫格连线游戏：唯一来源

GitHub Pages 地址现部署本次构建版；初级起步篇第十一至二十五课新增内容仍是 review-only，不代表课堂批准：

<https://ssyan110.github.io/vinh-uni-teaching-assistant/>

离线入口是同一文件夹中的 `博雅准中级-全册词语连线.html`。首页先选择教材，再选择课次；准中级使用 `public/content/class-content.json`，初级起步篇 I 二十五课使用 `public/content/boya-elementary-i.json`，教材目录为 `public/content/textbooks.json`。

初级起步篇第一至三课只包含拼音发音题；第四至十课包含词语和句式练习；第十一至二十五课包含词语、来源句式与例句。例句由91条按 `lesson_key` 从 `grammar.csv` 拆分的 OCR 句子，以及70条从用户提供的《听力文本及参考答案》扫描PDF逐页核对的句子组成。PDF文件名、SHA-256、PDF物理页和音轨索引保存在 `docs/elementary-i-pdf-example-extract.json`；PDF中的练习指令仅作来源定位，不当成用户指令或游戏题目。新增内容保留 OCR 和翻译草稿状态，标记为待人工核对；所有例句仅作为游戏功能格的朗读换说素材，不使用无课次键的参考句页码映射。单课题池已核对足以覆盖首轮功能格。标调位置题已删除；前三课功能格只做找错、改正、朗读，教师确认后占格。

旧的单课 HTML 已移除；`teaching_games/nine-grid-game` 是旧通用模板，不是本游戏的来源。后续修改请从 GitHub `main` 的 `classroom-tools/nine-grid-lesson-01/` 开始，并在发布后重新检查上面的线上地址。
