# 教材制作控制台

`dashboard/index.html` 的课次、文件和交付链接来自：

`lessons/lesson-01/20-approved/lesson-manifest.json`

更新权威 manifest 后运行：

```bash
python3 scripts/build_dashboard.py
```

`manifest.js` 是为直接用浏览器打开 `file://` 页面而生成的只读缓存，不是第二份内容来源。
