# 第5课《音乐的魅力》来源审阅快照

## 来源范围与状态

| 项目 | 记录 |
|---|---|
| 课程 | 博雅汉语听说：中级冲刺篇 I |
| 课次 | 第5课《音乐的魅力》 |
| 教材印刷页 | 63–78，共16页 |
| PDF页 | 74–89，共16页 |
| PDF | `textbooks/boya-intermediate-i/source/raw/博雅汉语听说-中级冲刺篇I.pdf` |
| PDF SHA-256 | `c7aa70b16496aecc7d9979bc2744dbe22701650511e48e2433ed19d439d70ad9` |
| 音频 | 第05课目录，12段 |
| 当前状态 | `source_review_materialized` / `pending_review` / `pending QA` |

本包是来源审阅阶段的结构化快照。已经把当前 PDF 对应的16页 OCR 与 page images 放入当前项目目录，并记录教材页面结构、词语、练习、句式、课文／内容提示及音频标签映射。Adam已确认12段音档正确；代理未进行语义听核，不生成逐字转写。未核对的逐字文字和答案仍保留为 `pending_review`，不以推测填补。

## 已写入文件

- `textbooks/boya-intermediate-i/source/derived/extractions/structured-lesson-05.json`
- `textbooks/boya-intermediate-i/source/derived/extractions/ocr-lesson-05/manifest.json`
- `textbooks/boya-intermediate-i/source/derived/extractions/ocr-lesson-05/page-074.txt` 至 `page-089.txt`
- `textbooks/boya-intermediate-i/source/derived/extractions/pages-preview/lesson-05/page-074.png` 至 `page-089.png`
- `lessons/boya-intermediate-i/lesson-05/00-source/source-manifest.json`
- 本文件

旧的 `textbooks/boya-intermediate-i/source/derived/extractions/lesson-05.json` 只作为已核对的 legacy 参考；本课 canonical source 是新写入的 `structured-lesson-05.json`。

## 核验摘要

| 核验项 | 结果 |
|---|---|
| PDF 页范围 | 74–89 全部覆盖 |
| OCR 文件 | 16/16 存在且非空；逐字准确性待人工复核 |
| Page images | 16/16 存在；与当前 PDF 以144 dpi重新渲染的对应页逐页字节一致 |
| 页面视觉检查 | 16/16 已检查版面、区段边界和教材活动位置 |
| 音频文件 | 12/12 存在 |
| 音频时长 | 已记录，总计1108.976254秒 |
| 音频 SHA-256 | 12/12 已记录并核对 |
| ffmpeg decode | 12/12 通过 |
| 音频语义 | Adam已确认音档正确；代理未实际听取，不生成转写 |
| 教材答案 | 未编造，`pending_review` |

## 逐页盘点

| 教材页 | PDF页 | 页面内容与音频标签 |
|---:|---:|---|
| 63 | 74 | 第5课《音乐的魅力》；听说（一）；主题“天籁之音”；课前准备；词语1–12；音频1-1 |
| 64 | 75 | 词语13–28；音乐欣赏；课外实践 |
| 65 | 76 | 小调查5题；音频1-2听对话并回答问题1–6；音频1-3选择题1–3 |
| 66 | 77 | 音频1-3选择题4–5；三至五句话回答5题；音频1-4跟读／评论4句；音频1-5听记句子并复述 |
| 67 | 78 | 音频1-6语段内容提示；填空5题；判断3题；听后回答开放题 |
| 68 | 79 | 口语句式3项；句式练习第1题及第2题起始 |
| 69 | 80 | 句式练习第2题续、第3题；文化知识讨论；《室内乐》短文起始 |
| 70 | 81 | 《室内乐》短文读后回答第2题；拓展练习4项 |
| 71 | 82 | 听说（二）；主题“音乐迷”；词语1–16；音频2-1 |
| 72 | 83 | 词语17–21；课外实践；音频2-2问题1–8；音频2-3选择题1 |
| 73 | 84 | 音频2-3选择题2–5；三至五句话回答5题；音频2-4跟读／替换画线词语4句 |
| 74 | 85 | 音频2-5听记并复述短文；音频2-6语段内容提示及填空 |
| 75 | 86 | 音频2-6判断题5题及听后开放题；口语句式3项 |
| 76 | 87 | 句式练习第3题；文化知识2题；《贝多芬》短文起始 |
| 77 | 88 | 《贝多芬》短文续；读后回答第2题；拓展“音乐欣赏”；“读一读，说一说”起始 |
| 78 | 89 | “读一读，说一说”剩余4项；认识音乐名人：贝多芬、莫扎特、门德尔松、肖邦 |

## 结构化盘点数量

以下数量与 `structured-lesson-05.json` 的数组长度一致：

| 类型 | 数量 | 说明 |
|---|---:|---|
| sections | 61 | 两部分听说、词语理解、语句理解、语段理解、口语句式、文化知识与拓展练习等教材区段 |
| vocabulary | 49 | 听说（一）28项；听说（二）21项 |
| grammar_patterns | 6 | 两部分各3项口语句式 |
| exercises | 37 | 小调查、听力题、句式练习、文化知识、读后回答与拓展练习等题目／活动记录 |
| texts_dialogues | 4 | 两个语段内容提示，以及《室内乐》《贝多芬》两篇印刷阅读文本 |
| audio | 12 | 1-1至1-6、2-1至2-6 |
| review_pages | 16 | 教材页63–78／PDF页74–89 |

### 词语与句式范围

- 听说（一）：教材页63–64，音频1-1，词语1–28。
- 听说（二）：教材页71–72，音频2-1，词语1–21。
- 听说（一）口语句式：教材页68–69，共3项；听说（二）口语句式：教材页75–76，共3项。
- 结构化记录保留教材原有顺序和页码，拼音、声调、词语边界仍待 OCR 与页面逐项复核。

## 音频标签与页码映射

| 标签 | 印刷页 | 时长（秒） | SHA-256前12位 | 文件／解码 | 语义状态 |
|---|---:|---:|---|---|---|
| 1-1 | 63–64 | 69.172250 | `9476a4092d51` | `audio/lesson-05/1-1.mp3`；pass | confirmed_by_user |
| 1-2 | 65 | 117.002438 | `6faa5516083b` | `audio/lesson-05/1-2.mp3`；pass | confirmed_by_user |
| 1-3 | 65–66 | 59.480813 | `1d7e849f0a61` | `audio/lesson-05/1-3.mp3`；pass | confirmed_by_user |
| 1-4 | 66 | 56.006500 | `ba587eaa5dd4` | `audio/lesson-05/1-4.mp3`；pass | confirmed_by_user |
| 1-5 | 66 | 42.631813 | `35af2d0d0b17` | `audio/lesson-05/1-5.mp3`；pass | confirmed_by_user |
| 1-6 | 67 | 207.647375 | `06b401040e8d` | `audio/lesson-05/1-6.mp3`；pass | confirmed_by_user |
| 2-1 | 71–72 | 48.248188 | `7b877d6ed81d` | `audio/lesson-05/2-1.mp3`；pass | confirmed_by_user |
| 2-2 | 72 | 147.983688 | `26db738b024f` | `audio/lesson-05/2-2.mp3`；pass | confirmed_by_user |
| 2-3 | 72–73 | 54.125688 | `5eb1a3df4ab7` | `audio/lesson-05/2-3.mp3`；pass | confirmed_by_user |
| 2-4 | 73 | 47.177125 | `731ffaddcf5b` | `audio/lesson-05/2-4.mp3`；pass | confirmed_by_user |
| 2-5 | 74 | 44.094688 | `911ca864e984` | `audio/lesson-05/2-5.mp3`；pass | confirmed_by_user |
| 2-6 | 74–75 | 215.405688 | `5cbc60042f81` | `audio/lesson-05/2-6.mp3`；pass | confirmed_by_user |

音频来源目录为 `textbooks/boya-intermediate-i/source/audio/lesson-05/`，来源说明为该目录内的 `下载来源.md`。本次完成了存在性、时长、SHA-256 和 ffmpeg 解码核验；Adam已确认音档正确，代理没有实际听取内容，不生成语义转写或答案。

## 待复核与边界

1. 逐页复核 OCR 与教材图像，尤其是汉字、拼音声调、词语分隔、填空线、题号和画线词语。
2. 逐项确认 61 个 sections、49 个 vocabulary、37 个 exercises、4 个 texts/dialogues 的文字忠实度和题目边界。
3. 音档文件、哈希、时长、解码和印刷标签已核对，内容由Adam确认；本包不生成转写或答案。
4. 不补写教材未提供的选择题、判断题或开放题答案；答案字段保持 `pending_review` 或未填写。
5. 等待来源 QA 与 Adam 明确批准。批准前不开始翻译、PBI教学重组、教师手册、学生配套、设计或 PPTX。

## 下一阶段门槛

当前可交付状态为：`source_review_materialized`，来源内容为 `pending_review`，来源 QA 为 `pending QA`。完成文字复核、答案政策确认并取得来源批准后，才进入下一道生产 gate。
