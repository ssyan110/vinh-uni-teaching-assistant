# 博雅汉语听说·初级起步篇 I–II 词汇语法参考数据库

生成日期：2026-08-29  
版本：1.0.0  
来源：用户提供的两本扫描版最新版 PDF；OCR 仅作提取中间层。

## 用法

- `csv/vocabulary_master.csv`：按“词语＋拼音”去重的词语索引，保留多音词，含拼音、教材印刷页、对应课次、英文原释义（若 OCR 捕获）和 `meaning_vi` 越南文释义栏。
- `csv/vocabulary_occurrences.csv`：各课词语页的出现记录，适合按课备课和核对词类。
- `csv/grammar.csv`：独立 PDF 语法审计产生的备课检索表；明确的「参考句式／参考句型」与由重点／常用句子归纳的候选分开标记，所有行目前都需教师逐页复核。
- `csv/grammar_source_patterns.csv`：直接从「参考句式／参考句型」页 OCR 提取的来源层；它与旧候选层保留原始证据，主备课请使用已整理的 `grammar.csv`。
- `csv/grammar_legacy_candidates.csv`：旧摘要中、最新版 PDF 尚未直接抽到的候选，只作待核查提示，不视为最新版教材定稿。
- `grammar-audit-evidence.json`：逐课保留语法审计的来源页、证据句和状态。
- `csv/expressions.csv`：第 1–3 课的日常用语。该三课是拼音与日常用语单元，没有独立的“词语”页。
- `csv/translations_vi.csv`：词汇、语法和日常用语的越南文翻译总表；翻译草稿标为 `translated_subagent_draft`，待教师确认的行标为 `missing_translation`。
- `translation-overrides.csv`：翻译覆盖层；重建来源数据时不会抹掉已完成的越南文。
- `博雅汉语听说-初级起步篇I-II-词汇语法参考数据库-v1.0.0.xlsx`：以上表格的可筛选版本。

## 证据与限制

教材 PDF 是扫描图像，未提供可直接读取的文字层；当前数据由 macOS Vision OCR 提取，再以词语总表／各课词语页配对。OCR 误读、词类和越南文释义必须在交付教学前复核。`manifest.json` 记录 PDF SHA-256、OCR 页数与每个导出文件 SHA-256。

## 翻译状态

`meaning_vi` 是越南文备课栏。当前由子代理完成的翻译标为 `translated_subagent_draft`，正式上课前请教师抽查并可改为 `reviewed_teacher`；不要删除英文原释义和来源状态。
