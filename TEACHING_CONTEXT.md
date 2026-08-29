# 榮市大學華語聽說課程教學上下文

> 更新日期：2026-08-28
> 当前状态：生产上下文与各课状态以 `course/lesson-registry.json` 及对应 `lesson_key` 的 manifest 为准。

## 当前课程与教材

- 课程：榮市大學華語聽說中級課程。
- 当前教材：《博雅汉语听说：准中级加速篇 I》，共 12 课。
- 《中级冲刺篇 I》不属于 2026-fall；完整保留并直接登记于 `2027-fall`，规划给三年级使用。已批准文件、QA 与 release 留在教材专属目录，不作为《准中级加速篇 I》的输入。
- 当前生产课次由 `project.config.json.active_context.lesson_key` 指定；不能根据裸的“第一课”或另一套教材的状态推定本课是否完成。
- 整学期时数须在完整理解全书教材后讨论，不从旧教材安排或课数直接换算。

## 权威入口

| 层级 | 路径 | 用途 |
|---|---|---|
| 课程 | `course/course-manifest.json` | 稳定课程身份与当前开课实例 |
| 开课实例 | `course/offerings/2026-fall/offering.json` | 本学期教材组合与状态 |
| 后续开课实例 | `course/offerings/2027-fall/offering.json` | 2027 秋季《中级冲刺篇 I》规划 |
| 教材登记 | `textbooks/registry.json` | 所有教材的稳定 ID 与 manifest |
| 课次登记 | `course/lesson-registry.json` | 所有教材的 `lesson_key`、课号、路径与状态 |
| 当前教材 | `textbooks/boya-quasi-intermediate-i/textbook.json` | PDF、QR、音频、来源索引与课次根目录 |
| 当前课次 | 由 `project.config.json.active_context.lesson_key` 对应的 `lessons/<textbook_id>/<lesson_id>/` | 当前生产课次 |
| 三年级规划教材 | `textbooks/boya-intermediate-i/`、`lessons/boya-intermediate-i/` | 《中级冲刺篇 I》的来源与逐课产物 |

## 不变的教学原则

- 课程重心是听与说；课前快速阅读、听音频并标记问题，课堂进行理解、互动、口语表现、反馈与重做。
- 以可观察的 Interpretive、Interpersonal、Presentational 表现证据组织教学。
- 学生端材料全部使用简体中文，不放越南文。
- 不逐字翻译或逐项讲完全部词语；直接讲解原则上不超过 5 分钟，并由任务中的高影响问题触发。
- 现行交付格式为原生、可编辑、静态 16:9 PPTX。后续课次在来源包与线上／实体边界确认后，可先制作可回退的 `10-design/pptx-draft`；完整 PPTX、authority 与 release 仍必须在教师手册、配套、Visual storyboard、prototype、QA 与 rehearsal gate 通过后确定。

《中级冲刺篇 I》由 `2027-fall` 开课实例承接；学期总览与教师手册待完整理解教材后建立。教材本身与逐课成果继续保留在标准教材结构中。
