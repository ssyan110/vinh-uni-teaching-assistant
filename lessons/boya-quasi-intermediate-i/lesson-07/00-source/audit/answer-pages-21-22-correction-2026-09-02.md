# 第7课答案来源定位与转录修正记录

修正日期：2026-09-02  
范围：第7课 `00-source/` 的答案 PDF 页码、7-3 题面／音频文本分栏，以及短文一听力文本定位。此记录补充并取代旧审核草稿中对应的定位结论；旧文件保留为历史证据，不作为当前生成输入。

## 当前来源定位

- 主教材：文件页 72–80，对应印刷 P59–P67。
- 答案 PDF：文件页 21–22。
- 答案 PDF 文件页 21：P59–P61 的闭合题答案、7-3 音频实际说法，以及短文一听力文本开头。
- 答案 PDF 文件页 22：短文一后半、短文二与短文三听力文本。

因此当前 canonical source 与 source manifest 的 `answer_pdf_pages`、答案 PDF review range、`review_evidence.answer_page_range` 统一使用 `[21, 22]`／`答案 PDF P21–P22`。

## 7-3 题面与音频文本

主教材 P61 上的 10 条句子是学生判断对错的题面；答案 PDF P21 上的句子是音频实际说法。两者必须分别保存在 `canonical-source.json` 的 `items` 与 `audio_text`，不能用音频文本覆盖学生题面。答案与音频绑定仍以 `answer_source` 指向答案 PDF 文件页 21。

## 短文一页码与文本

- 短文一范围为教材 P61–P62，音频为 7-4。
- 短文一第二遍题组位于教材 P62，`short_text_1.exercise_metadata.second_listen.textbook_printed_pages` 与 listening exercise contract 均使用 `[62]`。
- `short_text_1.text` 采用答案 PDF P21–P22 的完整听力文本；学生端 PPT 仍只使用教材阅读／听取提示和摘要记录版式，不重排整段原文。

## 状态

本记录只修正来源定位与结构化转录，未批准来源、音频语义或教师 PowerPoint 播放；`source_status=pending_review`、`approved=false` 与听力语义／教师播放 gate 继续保留。
