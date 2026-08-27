# 逐课教材

逐课制作文件先按教材隔离，再进入每课的生产流程：

```text
lessons/<textbook_id>/lesson-XX/
├── 00-source/
├── 10-design/
├── 20-approved/
├── 30-qa/
├── 40-release/
└── 90-archive/
```

`textbook_id` 必须与 `textbooks/registry.json` 一致。即使不同教材都有“第一课”，也不会共用同一个 `lessons/boya-intermediate-i/lesson-01/`。

每次只开放一课。下一课必须等上一课完成批准、QA、rehearsal 和 release 后才解锁。
