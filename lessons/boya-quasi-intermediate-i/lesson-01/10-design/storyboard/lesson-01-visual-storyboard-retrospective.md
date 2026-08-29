# 第一课《丽丽是独生女》视觉 storyboard 回溯稿

- 课次身份：`boya-quasi-intermediate-i:lesson-01`
- 回溯依据：系主任批准的 `20-approved/pptx/lesson-01-在线预习.pptx` 与 `20-approved/pptx/lesson-01-实体课.pptx`。
- 状态：`retrospective_not_generation_input`。本文件只记录现有投影片的可见文字、学生动作、页码、音频、备注、图片关系与观察到的版式；不生成新内容，不改写已批准 PPTX。
- 来源范围：所有 `source_refs` 仅指向本课 `00-source/`（`source-extraction-draft.json` 与 `canonical-source.json` 的既有 section/audio_map）；不引用《中级冲刺篇 I》。

## 已核对的版面事实

| deck | 投影片数 | 画布 | speaker notes | 观察到的图片关系 | 观察到的音频关系 |
| --- | ---: | --- | ---: | ---: | ---: |
| 在线预习 | 72 | 16:9 | 61 | 44 | 0 |
| 实体课 | 51 | 16:9 | 51 | 48 | 8 |

## 观察到的 layout family

下表是从批准 PPTX 的现有页面外观与标题结构归类的观察标签，不是新的设计规范，也不作为生成输入。逐页记录在 `lesson-01-ppt-storyboard-retrospective.csv`。

| deck | 页面范围 | 观察到的版式／功能 |
| --- | --- | --- |
| 在线预习 | 1 | cover |
| 在线预习 | 2 | learning-route |
| 在线预习 | 3–33 | vocabulary-card |
| 在线预习 | 34–47 | text-reading-or-record |
| 在线预习 | 48–63 | expression-card |
| 在线预习 | 64–67 | comprehensive-record |
| 在线预习 | 68–71 | checklist / self-check |
| 在线预习 | 72 | closing prompt |
| 实体课 | 1 | cover |
| 实体课 | 2–4 | learning-route / goal / warm-up prompt |
| 实体课 | 5, 19, 20, 23, 30, 32, 39, 41, 46 | section-divider or transition |
| 实体课 | 6–9, 12, 18, 50–51 | listening-practice |
| 实体课 | 10–17, 21–22, 29, 31, 38, 40, 47–49 | oral-prompt / record |
| 实体课 | 24–28, 33–37, 42–45 | expression-card |

## 学生动作与来源回溯

- CSV 的 `student_action_observed` 只摘录投影片可见操作句或 speaker notes 中已经存在的动作句；未找到明确动作时留空。
- `textbook_printed_pages_observed` 只记录批准 PPT 上已经显示的教材页码。
- `source_refs` 只使用本课 `00-source` 中既有的 section 与 audio_map；封面、路线、目标与无直接教材页码的提示页不强行添加来源。
- 1-7、1-8 的音频页面在实体课第 50、51 页被观察到；内容级听核与出版社 QR 对应仍按来源审核状态处理。

## 视觉 QA 回溯结论

- 两份 PPTX 的投影片尺寸均为 16:9，且每页均有可见内容。
- 已批准实体课 PPTX 的音频关系对应 1-2、1-3、1-4、1-5、1-6、1-7、1-8；CSV 逐页记录。
- 图片、音频、页码和 notes 仅做静态关系记录，不代表已经完成 PowerPoint 实际播放或课堂 rehearsal。
- 本回溯稿不改变 `20-approved`，不建立 `40-release`，也不替代来源语义审核、教师手册批准或配套材料批准。

## 输出约束

`retrospective_not_generation_input=true` 是硬标记。任何后续生成器不得读取本目录作为课次内容母版；若需制作或修订材料，必须依照已批准 PPTX 与正式批准的教师手册流程执行。
