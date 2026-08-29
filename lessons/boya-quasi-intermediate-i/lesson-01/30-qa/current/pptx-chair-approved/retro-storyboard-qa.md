# 第一课回溯 storyboard QA

- 课次身份：`boya-quasi-intermediate-i:lesson-01`
- 状态：`retrospective_not_generation_input`
- 依据：`20-approved/pptx/lesson-01-在线预习.pptx`、`20-approved/pptx/lesson-01-实体课.pptx` 与 `20-approved/lesson-01-pptx-approval-record.md`。

## 结果

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| 在线预习投影片抽取 | PASS | 72 页；CSV 行数与 PPT 页数一致 |
| 实体课投影片抽取 | PASS | 51 页；CSV 行数与 PPT 页数一致 |
| 课次身份 | PASS | `boya-quasi-intermediate-i:lesson-01`；未引用中级冲刺篇 |
| 来源范围 | PASS | `source_refs` 仅指向当前课 `00-source` |
| 页面文字／学生动作 | PASS | 只抽取批准 PPTX 可见文字与既有 notes |
| 教材页码 | PASS | 仅记录 PPTX 已显示的教材页码 |
| 图片／音频关系 | PASS | 逐页记录 image/audio relationship count |
| approved PPTX 是否修改 | PASS | 本任务未写入 `20-approved/pptx/` |

## 未宣称完成

本 QA 不等于来源语义批准、教师手册批准、预习卡／活动材料批准、PowerPoint 手动播放、课堂 rehearsal 或 `40-release` 交付。1-7、1-8 的内容级听核与出版社 QR 对应仍待人工完成。

## 文件

- `10-design/storyboard/lesson-01-ppt-storyboard-retrospective.csv`
- `10-design/storyboard/lesson-01-visual-storyboard-retrospective.md`
- `10-design/storyboard/manifest.json`
