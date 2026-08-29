# 第二课 PPT 前置审核记录

课次身份：`boya-quasi-intermediate-i:lesson-02` ；课名：王红的一天。

## 审核范围

本记录只把现有来源、教学设计、配套材料、音频清单、图片清单和视觉需求草稿整理成候选页面区块；可用于生成可回滚的 `10-design/pptx-draft/`，不进入 `20-approved/` 或 `40-release/`。每一行候选区块对应 `lesson-02-source-refs.csv`，教材页码均使用印刷页码。

## 2026-08-29 制作决定

Adam 已确认第二课沿用第一课已核准的线上／实体课程骨架，开始制作两份 `10-design/pptx-draft/` 草稿。此决定只授权草稿生产，不改变来源批准、教师手册批准或 `20-approved/`／`40-release/` 状态；完整内容仍以本课 canonical source 为准。

已读取：

- `00-source/canonical-source.json`（主教材 P12-P21、答案页 P5-P7、2-1 至 2-7）
- `00-source/audio-manifest.json`（7 段音频；2-7 为用户恢复文件）
- `10-design/teaching-design/lesson-02-teaching-design.md` 与 `exercise-coverage.csv`
- `10-design/support-materials/` 内预习卡、活动材料索引、评量表、Exit Ticket 草案
- `10-design/assets/image-manifest.json` 与 `visual-brief-draft.md`

## 候选页面结构

| 区块 | 教材页 | 候选学生动作 | 图片状态 | 线上/实体候选 |
|---|---|---|---|---|
| L02-P01 | P12-P13 | 看词语、听 2-1、跟读 | 29 张词语候选图已有 | 线上预习；实体短修补 |
| L02-P02 | P13-P14 | 听 2-2、看图选择、跟读 | 复用词语图；映射待复核 | 线上初做＋实体核对 |
| L02-P03 | P14-P15 | 听 2-3、判断对错、记录关键词 | 不需要独立图 | 实体听力证据核对 |
| L02-P04 | P15 | 听 2-4、选择答案、同伴确认 | 不需要独立图 | 实体为主 |
| L02-P05 | P15-P16 | 听 2-5、回答并介绍王红上课情况 | `L02-CONTEXT-CLASSROOM` 已有 | 线上预习＋实体发表 |
| L02-P06 | P16-P17 | 理解学校生活常用表达 | 词语图可复用 | 线上预览＋实体任务 |
| L02-P07 | P17-P18 | 听 2-6、回答并完成生日午餐总结 | `L02-CONTEXT-BIRTHDAY-MEAL` 已有 | 线上预习＋实体小组 |
| L02-P08 | P18-P20 | 理解课外生活常用表达 | 词语图可复用 | 线上预览＋实体任务 |
| L02-P09 | P18-P19 | 听 2-7、回答并总结课外活动 | `L02-CONTEXT-MUSEUM-VOLUNTEER` 已有 | 线上预习＋实体证据 |
| L02-P10 | P20-P21 | 填表、三主题总结、个人迁移 | 三张情境图可复用 | 实体小组与个人发表 |

## 阻塞与不可推断事项

1. canonical source 仍为 `source_audit_in_progress`，不能把本记录或现有草案宣称为来源批准稿，也不能把 draft PPTX 升格为 authority。
2. 2-1 至 2-6 尚待教师逐段语义听核；2-7 已有 Adam 的语义／播放确认，但来源性质仍须在来源批准中保留为用户恢复音频。
3. 线上／实体 PPT 内容边界已按 2026-08-29 决定沿用第一课结构；正式实体课时与来源批准仍待确认，表中课时分配仅为候选，不是批准决定。
4. 配套材料与教师手册均为 `10-design` 草案；必须继续以 canonical source 的教材词语、题目、页码和开放答案政策为准。
5. 图片虽已生成并记录，但仍是候选素材；divider 沿用共用母版，不生成新 divider。不得把视觉草稿当成授权或 PPT 进入许可。
6. 不从《中级冲刺篇 I》、其他课次、archive 或旧 PPT 补内容，不新增教材题目、答案或课文。

下一步：继续核对来源、音频与材料，并对现有第二课线上／实体 PPTX draft 做 QA；只有完成批准 gate 后才可写入 `20-approved/`，草稿不得覆盖 `20-approved/` 或 `40-release/`。
