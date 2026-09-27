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

若 registry 已登记当前教材的 completion record，以下 review manifest 生成器会把该记录作为 dashboard 的完成状态 override；旧的 source QA、audio playback、browser/device 与 release 字段仍原样保留，不能用来否定已记录的当前完成确认：

```bash
node scripts/build-review-manifest.mjs --source-root /Users/ssyan110/Development/vinh-uni-teaching-assistant --output /Users/ssyan110/Development/vinh-uni-teaching-assistant/dashboard/manifest.js
```

教材 review manifest 可由 registry 与各课 `00-source` 自动重建：

```bash
node scripts/build-review-manifest.mjs --source-root /path/to/vinh-uni-teaching-assistant --output dashboard/manifest.js
```

生成器会保留既有 dashboard manifest 的 `lesson_details`、生产 Gate、文件与 QA 字段；再从 registry 逐课寻找 canonical source、source manifest 与 audio manifest。没有 canonical source 的课次会保留 registry 状态并显示 unavailable，不会填入示例内容。

## 教材 review 工作区

当前入口还提供嵌入式教材审核：教材选择器由 registry 的 `lesson_count` 驱动；课次工作区可分别进入词语、短文、语法／常用表达、练习和既有生产 Gate。已嵌入来源的项目来自该课 `00-source/canonical-source.json` 与 `audio-manifest.json`，不会用演示数组补齐缺失内容。当前教材若有 completion record，课程总览显示完成确认 12/12；空的 canonical sections 只显示为技术结构说明，不产生待审核计数。

教师可对每一项执行确认、修改／留言和“标记补充研究”。记录保存在浏览器本机 `localStorage` 的 `vinh-textbook-review-v1` 中，并按完整 `lesson_key` 与项目签名隔离：来源签名变化时只重新打开受影响项目，未变化且已确认的项目保留原记录。

这些记录不是历史 source QA 或 release gate 的替代品，也不会写回 canonical source、authority manifest 或 finalized PPTX。当前教材的直接完成确认保存在 `course/textbook-completion-confirmation-2026-09-08.md`；新的 review/research workflow 仍应作为下一本教材的准备流程，独立回到来源审核、教师采用、活动／手册与 PPT 流程。

生成 dashboard 前会运行 `scripts/validate_lesson_identity.py`；如果教材范围、课号或路径不一致，dashboard 不会更新。

旧的 dashboard 快照已移至 `archive/legacy-materials-2026-08-27/material-production-dashboard/`；不要把它当作 dashboard 数据来源。
