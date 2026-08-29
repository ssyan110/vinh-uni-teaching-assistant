# 第2课来源与素材审核汇总

审核日期：2026-08-29  
课次键：`boya-quasi-intermediate-i:lesson-02`  
课名：王红的一天  
审核范围：本课 `00-source/`、准中级加速篇主教材／答案 PDF、`source/audio/lesson-02/`、`10-design/assets/`，以及 Adam 提供的 `/Users/ssyan110/Downloads/2-7.wav`（只核对，不复制或修改原文件）。

## 结论

本课来源包已经建立，课次身份、教材页码、内容盘点、音频文件和图片素材均有可复查记录。Adam 已明确确认 L2 来源记录、L2 图片，以及 `2-7` 与教材 P18–P19 短文三《课外活动》的对应关系和播放结果。**本汇总不把第2课标记为整体来源批准**：2-1 至 2-6 的语义听核／教师实际播放，以及扫描页转录的逐项最终确认仍待完成。

## 已验证（verified）

### 1. 课次身份与教材范围

- `lesson_key`、`textbook_id`、课名一致：`boya-quasi-intermediate-i:lesson-02`／《王红的一天》。
- 主教材 PDF 文件页 25–34 对应教材印刷 P12–P21；答案 PDF 文件页 8–10 对应本课答案范围（答案印刷 P5–P7）。
- 主教材是扫描影像，未依赖空白文字层；逐页盘点记录在 [source-pages-12-21-audit-draft.md](source-pages-12-21-audit-draft.md)。
- 第2课不使用《中级冲刺篇 I》、其他课次或 archive 作为来源。

### 2. 来源内容盘点

`canonical-source.json` 已登记：

- 词语 29 项，保持教材顺序；「不知不觉」词性留为空白，未自行补写。
- 词语理解 3 组、11 项；听说句子 2-3 共 10 项判断题；听小对话 2-4 共 5 项。
- 短文 3 篇：短文一《王红喜欢上课》、短文二《生日午餐》、短文三《课外活动》。
- 常用词语和表达、综合练习与开放式口语任务均已盘点；开放题没有捏造唯一标准答案。
- `listening-exercise-contract.json` 登记 10 条题组记录，题目标题、教材印刷页码、音频标签和题数均可回指 canonical source。

### 3. 音频技术状态

`2-1.mp3` 至 `2-7.mp3` 均存在，均通过 ffprobe 解码；7/7 文件的 bytes、SHA-256、时长、编码、采样率和声道记录见 [audio-technical-2026-08-29.md](audio-technical-2026-08-29.md)。

- 2-1 至 2-6：出版社 QR 下载记录，技术检查通过。
- 2-7：项目中的 MP3 由用户提供的 `2-7.wav` 转换而来；原始 WAV 未被复制或修改。项目 MP3 时长 57.040 秒，单声道，44100 Hz，解码通过。
- 主教材 P18–P19 与答案 PDF 文件页 10 均将短文三标为 `2-7`；出版社 QR landing page／全书 inventory 仍只列 2-1 至 2-6，故 2-7 保留为用户来源恢复，不宣称为出版社 QR 原始下载。

### 4. 图片素材技术状态

- `10-design/assets/image-manifest.json` 登记 36 个本课图片资产：29 个词语图、4 个词语理解补充图、3 个情境图。
- 36/36 文件存在，均为 1672×941 PNG，实际 SHA-256 与 manifest 一致。
- divider 按项目规则复用共用母版，没有另行生成；没有把 divider 缺失当作问题。

## Adam 已确认（user-approved）

- L2 来源记录正确。
- L2 图片正确；本次确认不包含 divider。
- `/Users/ssyan110/Downloads/2-7.wav` 播放后，确认与教材 P18–P19 短文三《课外活动》对应；项目 `2-7.mp3` 的语义和播放通过。

原始用户确认记录：[adam-review-2026-08-29.md](adam-review-2026-08-29.md)。

## 待完成（pending）

1. 教师逐段完成 2-1 至 2-6 的语义听核，并测试在 PowerPoint 中实际播放；ffprobe 通过不等于语义核对通过。
2. Adam 对主教材 P12–P21 的扫描页转录、题组边界、答案 PDF 页码映射和全部练习做最终来源确认。
3. 对 2-7 的出版社 QR 缺号保留来源说明；除非找到出版社原始下载，不把它改写成 QR 来源。
4. 来源整体批准前，不进入本课 PBI 教学重组、教师手册、预习卡、补充活动材料或 PPTX 生成 gate。

## 结构建议（仅提出，未修改）

- `source-manifest.json`、`audio-technical-2026-08-29.md` 和 `canonical-source.json` 仍有部分旧文字写着“2-7 语义／播放待确认”。建议下一次来源状态更新时，只把这些状态统一为“2-7 user-approved；2-1 至 2-6 pending”，不要改写出版社 QR inventory。
- 全项目后续索引必须继续使用完整 `lesson_key`，不可用裸课号 `lesson-02`，也不可从《中级冲刺篇 I》补数据。
- 图片目前仍是 `10-design` 草稿资产；即使 Adam 已确认图片正确，也要等本课来源／教学设计 gate 完成后，才允许进入 `20-approved` 或 PPTX。

## 证据索引

- [canonical-source.json](../canonical-source.json)
- [source-manifest.json](../source-manifest.json)
- [audio-manifest.json](../audio-manifest.json)
- [listening-exercise-contract.json](../listening-exercise-contract.json)
- [source-pages-12-21-audit-draft.md](source-pages-12-21-audit-draft.md)
- [answer-pages-8-10-audit-draft.md](answer-pages-8-10-audit-draft.md)
- [audio-recovery-2026-08-29.md](audio-recovery-2026-08-29.md)
- [image-manifest.json](../../10-design/assets/image-manifest.json)

