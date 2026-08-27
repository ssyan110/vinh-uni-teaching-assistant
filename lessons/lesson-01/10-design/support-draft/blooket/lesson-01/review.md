# 第一课词语 Blooket 题库 draft

## 范围

- 课次：第一课《中国人的姓名》
- 来源：`work/boya-intermediate/extractions/structured-lesson-01.json`
- 词语数：34
- 题目数：102（每种题型 34 题）
- 题型：汉字选意思、汉字选拼音、拼音选汉字
- 合并 CSV：三种题型混合在同一个文件中，按每个词语依次排列。
- 每题时间：20 秒
- 状态：`draft_for_review`

## 内容政策

汉字和拼音来自第一课 canonical source。该来源没有 34 个词语的词义字段，因此汉字选意思题使用 CC-CEDICT 外部词典整理的最短越南文释义，全部标为 `external_draft_for_review`，不是教材标准答案。旧 VNFT 越南文题库没有作为本课答案来源。

## QA 结果

- CSV 字段：8 个，沿用 Blooket 模板的栏名和顺序。
- 题目覆盖：102 / 34 个词语。
- 每种题型覆盖：34 / 34 个词语。
- 每题选项：4 个，且没有重复；正确答案位置经过固定种子随机化。
- character_to_meaning：A 9、B 9、C 8、D 8。
- character_to_pinyin：A 9、B 9、C 8、D 8。
- pinyin_to_character：A 9、B 9、C 8、D 8。
- 来源 hash：`0e7c9ced06b7c6e80278b07f3721788de88494b495618705618f6f47f56ab84e`

## 待审项目

1. 逐条确认 34 个最短越南文释义是否符合本课教学用法。
2. 确认汉字选意思题的越南文用词是否需要按班级程度调整。
3. 教师批准后，才可把 meaning map 和题库状态从 draft 更新为 approved。
