# 第四课《地球人的担忧》来源审核包

## 2026-08-22 来源审阅进度

已建立结构化来源快照：
`textbooks/boya-intermediate-i/source/derived/extractions/structured-lesson-04.json`

本快照登记了印刷页46–62（PDF页57–73）的页面边界、16个教材区段、71个词语、6个口语句式、37项教材练习、4笔内容／阅读记录，以及1-1至2-6共12段音频的页码和文件关系。

PDF 148页；本课17页页面图像和17页OCR均已保存。12个MP3文件均存在并可由ffmpeg解码，总时长1323.520065秒。Adam已确认12段音档正确；代理未进行语义听核，本包不生成对话转写，填空答案仍不补写。

页面图像优先于OCR。词语、拼音、标点、填空线和阅读文字保留待审核状态。教材没有提供完整答案的题目不生成唯一标准答案。

已根据当前 PDF／页面图修正：17个 `page_image_file` 路径改为实际的 `page-057.png` 至 `page-073.png`；12个音频 `file` 路径补齐项目目录前缀；T04-003 的内容提示改为印刷文字“了解修建核电站的利弊”；T04-004 补回页面中的“的”。第4课练习记录的摘要题干统一保留 `pending_text_fidelity_review`，不再把摘要当作逐字确认。

来源批准前，翻译、PBI教学重组、教师手册、学生配套、storyboard、prototype和PPTX保持锁定。

## 页面与教材区段

| 印刷页 | PDF页 | 主要内容 |
| ---: | ---: | --- |
| 46–47 | 57–58 | 听说（一）课前准备、词语 |
| 48–49 | 59–60 | 词语理解、听对话、三至五句话回答 |
| 49–50 | 60–61 | 语句理解、填空、听记和复述 |
| 50–51 | 61–62 | 语段理解、小辩论听力 |
| 51–52 | 62–63 | 口语句式和句式练习 |
| 52–54 | 63–65 | 文化知识、汽车阅读、拓展练习 |
| 54–56 | 65–67 | 听说（二）课前准备、词语、查资料、小调查 |
| 57–58 | 68–69 | 词语理解、听对话、三至五句话回答 |
| 58–60 | 69–71 | 语句理解、核电站语段理解和句式 |
| 61–62 | 72–73 | 疯牛病阅读、采访、拓展练习 |

## 当前状态

| 项目 | 状态 |
| --- | --- |
| 来源阶段 | 待审核 |
| OCR与页面图像 | 17/17页存在 |
| 音频文件 | 12段存在，12/12可解码；内容由Adam确认，代理未语义听核 |
| 阅读／内容记录 | 4笔已登记；2篇阅读逐字忠实度待复核 |
| 翻译与教学重组 | 未开始 |
| 后续教材生产 | 来源批准前锁定 |

## 来源文件

- 教材 PDF：`textbooks/boya-intermediate-i/source/raw/博雅汉语听说-中级冲刺篇I.pdf`
- 结构化来源快照：`textbooks/boya-intermediate-i/source/derived/extractions/structured-lesson-04.json`
- OCR 页面：`textbooks/boya-intermediate-i/source/derived/extractions/ocr-lesson-04/`
- 页面图像：`textbooks/boya-intermediate-i/source/derived/extractions/pages-preview/lesson-04/`
- 音频目录：`textbooks/boya-intermediate-i/source/audio/lesson-04/`
- 来源清单：`textbooks/boya-intermediate-i/source/source-index.md`

## 待核对与批准事项

1. 以页面图像逐项核对词语、拼音、标点、阅读短文和练习题干；当前练习摘要仍待人工逐字确认。
2. 音档文件、哈希、时长和解码已核对，内容由Adam确认；本包不生成对话全文或听力答案。
3. 保留教材未提供答案的开放题状态。
4. Adam确认来源内容无误后，才能进入PBI教学重组阶段。
