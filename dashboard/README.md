# 教材制作控制台

`dashboard/index.html` 是课程总览入口。它使用三层视图：

1. 课程总览：八课摘要、当前下一步与锁定状态。
2. 单课工作区：只展开一课的概览、Gate、文件与 QA。
3. Gate 详情：查看单个 Gate 的证据文件。

课次、文件和交付链接来自各课的：

`lessons/lesson-XX/20-approved/lesson-manifest.json`

尚未建立 authority manifest 的课次，其名称、教材页码与音频数量来自：

`Giáo trình/博雅汉语听说-中级冲刺篇/教材资料索引.md`

更新权威 manifest 后运行：

```bash
python3 scripts/build_dashboard.py
```

`manifest.js` 是为直接用浏览器打开 `file://` 页面而生成的只读汇总缓存，不是第二份内容来源。

旧的 dashboard 快照已移至 `archive/legacy-materials-2026-08-27/material-production-dashboard/`；不要把它当作 dashboard 数据来源。
