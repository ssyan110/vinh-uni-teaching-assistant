# 2026-08-29 夜间预检记录

## 范围

- 当前开课：`boya-quasi-intermediate-i`，检查课次为 `lesson-02` 至 `lesson-12`。
- 检查方式：只读检查；没有修改 `20-approved/`、`30-qa/` 或 `40-release/`，也没有把草稿标记为批准。
- 章节 divider 继续使用共享素材，本轮没有新增 divider。

## 已完成的夜间预检

### 图片素材

- `lesson-02` 至 `lesson-07`：146 张 PNG，路径、解码、尺寸和 SHA-256 全部通过。
- `lesson-08` 至 `lesson-12`：82 张 PNG，路径、解码、尺寸和 SHA-256 全部通过。
- 合计：228 张 draft 图片。全部仍在各课 `10-design/assets/`，尚未进入 PPTX 或正式交付包。
- `image-manifest.json` 的课次身份均使用 compound key；没有发现新增 divider。

### 音频素材

- `lesson-02` 至 `lesson-12` 现有音频均已做格式、可解码、路径和 manifest 对照检查。
- L3–L12 每课现有 6 个出版社 QR 音频；L2 现有 `2-1` 至 `2-6`，并已加入 Adam 提供并转换的 `2-7.mp3`。
- L2 `2-7` 输入 WAV 的原始 SHA-256、转换后 MP3 的 SHA-256、时长与解码结果已写入课次音频 manifest 和 recovery audit；出版社 QR/source inventory 仍保持原始的 `2-1` 至 `2-6` 记录。
- 音频的语义核听和 PowerPoint 内实际播放仍需教师确认，L2 不再有“本地音频缺失”阻塞。

### 课次身份与来源

- `python3 scripts/validate_lesson_identity.py`：20 个 scoped lessons 通过。
- L2–L12 的来源 PDF、现有音频和已登记 hash/解码检查通过；教材印刷页码范围已盘点。
- L4–L12 的部分 `canonical-source.json`、`audio-manifest.json`、`listening-exercise-contract.json` 尚缺 `lesson_key` 字段。生成前要先补齐或通过 scope gate，不能依赖裸课号。

## 明天审查时的阻塞顺序

| 优先级 | 课次 | 需要先决定的事项 |
|---|---|---|
| 1 | `boya-quasi-intermediate-i:lesson-02` | Adam 已确认恢复的 `2-7`、短文三来源记录与图片；其余音频 QA 仍按独立状态推进。 |
| 2 | `boya-quasi-intermediate-i:lesson-03` | Adam 已确认来源、图片与“越来越”用字；六段音频语义／播放 QA 仍按独立状态推进。 |
| 3 | `boya-quasi-intermediate-i:lesson-06` | 已确认使用“大岛”；后续只需核听六段音频。 |
| 4 | `boya-quasi-intermediate-i:lesson-04`、`lesson-05` | 确认答案 PDF 与 inventory 的印刷页码口径；补强图片 manifest metadata。 |
| 5 | `boya-quasi-intermediate-i:lesson-08` 至 `lesson-12` | 逐课确认来源、页码、答案范围、音频语义和视觉重用；L8 的“处死”图只保留中性历史符号，不画死亡场面。 |
| 6 | `boya-quasi-intermediate-i:lesson-01` | 对回用户已交付版本的 authority/release 证据；当前 checkout 仍显示 source audit in progress，不能用旧《中级冲刺篇 I》第一课补齐。 |

## 9 月 6 日交付的关键路径

以 8 月 29 日为基准，9 月 5 日必须完成内容和全课 QA，9 月 6 日只保留打包、最终检查和提交：

- 8/30：完成 L2、L3 已确认范围的记录同步；音频 QA 完成后进入教师手册与配套材料。
- 8/31：完成 L4、L5 来源决定和 L2、L3 的手册／材料／PPT 草稿。
- 9/1：完成 L6、L7 来源决定；关闭 L4、L5 草稿。
- 9/2：完成 L8、L9 来源决定；关闭 L6、L7 草稿。
- 9/3：完成 L10、L11 来源决定；关闭 L8、L9 草稿。
- 9/4：完成 L12 来源决定，并补齐 L1 交付证据；关闭 L10、L11 草稿。
- 9/5：全 12 课做来源忠实度、教材页码、音频、字级、边界、PPTX 可编辑性和交付包 QA。
- 9/6：提交全部交付包。

每天仍须按“来源批准 → PBI／教师手册 → 配套材料 → 线上／实体边界 → storyboard → PPTX → QA”顺序推进；目前不能跳过来源和边界批准直接生产完整 PPTX。
