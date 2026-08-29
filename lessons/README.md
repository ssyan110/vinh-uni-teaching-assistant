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

## 课次身份

课号只在单一本教材内有效。跨教材的稳定身份统一写成：

```text
<textbook_id>:<lesson_id>
```

例如：

- `boya-quasi-intermediate-i:lesson-01` = 《准中级加速篇 I》第一课「丽丽是独生女」
- `boya-intermediate-i:lesson-01` = 《中级冲刺篇 I》第一课「中国人的姓名」

完整登记见 `course/lesson-registry.json`。dashboard、来源审核、QA 和生成器在需要跨课次引用时，必须使用 `lesson_key`，不能只写 `lesson-01` 或 `lesson-02`。

每次只开放一课。下一课必须等上一课完成批准、QA、rehearsal 和 release 后才解锁。
