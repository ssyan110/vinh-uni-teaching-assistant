# 明天审查卡（人类版）

这张卡是给教师阅读的入口。先看这张卡，不需要逐行阅读 `source-manifest.json`、SHA-256、文件大小或内部字段。

## 审核结果

### A. L2：已完成指定审核

- [L2 2-7 音频](</Users/ssyan110/Development/vinh-uni-teaching-assistant/textbooks/boya-quasi-intermediate-i/source/audio/lesson-02/2-7.mp3>)：已播放并确认与教材 P18–P19《课外活动》相符。
- [L2 短文三来源记录](</Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-02/00-source/audit/source-pages-12-21-audit-draft.md:31>)：正确。
- [L2 图片文件夹](</Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-02/10-design/assets/>)：正确；divider 不在审核范围。
- [L2 Adam 审核记录](</Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-02/00-source/audit/adam-review-2026-08-29.md>)：已写入项目。

2-1 至 2-6 的语义听核和实际播放仍是内部待办，不需要重新检查已经确认的 2-7、短文三来源记录或图片。

### B. L3：已完成指定审核

- [L3 页面来源审查](</Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-03/00-source/audit/source-pages-22-31-audit-draft.md>)：来源、页码、词语、题目和音频编号已确认。
- [L3 图片文件夹](</Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-03/10-design/assets/>)：图片与词语／课堂情境已确认。
- [L3 Adam 审核记录](</Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-03/00-source/audit/adam-review-2026-08-29.md>)：已写入项目。

最终用字已锁定为 **“越来越”**，不是“越来越越”；canonical source、来源审查和 contract 已同步。

### C. 其他项目不用你明天检查

- **L6：**你已经确认用“**大岛**”（繁体：大島），不是“大圣”。旧索引的差异由我统一处理。
- **L4–L12 `lesson_key`：**这是内部资料结构修复，不是教材审查。它只是确保“准中级第4课”和“中级第4课”不会混在一起，由我补字段和重算索引。
- **准中级 L1：**PPT 已经存在。你不用再检查“有没有 PPT”；我只核对它是否登记到准中级 L1 的正式交付路径，不会拿中级冲刺篇 L1 来补。

## 明天的最短路线

你指定的 L2、L3 来源／图片／用字检查已经完成，明天不需要重复听 2-7 或重新检查图片。如果要查看证据，直接打开上面两份 Adam 审核记录。其余音频语义与播放检查属于内部生产 QA。

剩余工作是内部生产：音频 QA、教师手册、配套材料、线上／实体边界、storyboard、PPTX 和交付 QA。

## 技术文件放在哪里

这些文件是给程序和 QA 用的，只有在发现问题时才打开：

- [L2 source manifest（技术记录）](</Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-02/00-source/source-manifest.json>)
- [L2 audio manifest（技术记录）](</Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-02/00-source/audio-manifest.json>)
- [L3 source manifest（技术记录）](</Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-03/00-source/source-manifest.json>)
