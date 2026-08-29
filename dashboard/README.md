# 教材制作控制台

`dashboard/index.html` 是课程总览入口。它使用三层视图：

1. 课程总览：当前教材的课次摘要、当前下一步与锁定状态。
2. 单课工作区：只展开一课的概览、Gate、文件与 QA。
3. Gate 详情：查看单个 Gate 的证据文件。

课次根目录、课数与来源清单由 `project.config.json` 的 active context 决定。跨教材的课次身份由 `course/lesson-registry.json` 管理，格式是 `<textbook_id>:<lesson_id>`；例如两本书的第一课分别是 `boya-quasi-intermediate-i:lesson-01` 与 `boya-intermediate-i:lesson-01`，不能只用 `lesson-01` 判断。

课次、文件和交付链接来自：

`lessons/<textbook_id>/lesson-XX/20-approved/lesson-manifest.json`

尚未建立 authority manifest 的课次，其名称、教材页码与音频数量来自：

`textbooks/<textbook_id>/source/source-inventory.json`

更新权威 manifest 后运行：

```bash
python3 scripts/build_dashboard.py
```

`manifest.js` 是为直接用浏览器打开 `file://` 页面而生成的只读汇总缓存，不是第二份内容来源。

生成 dashboard 前会运行 `scripts/validate_lesson_identity.py`；如果教材范围、课号或路径不一致，dashboard 不会更新。

旧的 dashboard 快照已移至 `archive/legacy-materials-2026-08-27/material-production-dashboard/`；不要把它当作 dashboard 数据来源。
