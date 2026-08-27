# 博雅汉语听说·中级冲刺篇 I 本學期參考資料集

版本：1.0.0  
建立日期：2026-08-25

## 內容

本資料集以專案目前的八份結構化教材來源為輸入，涵蓋第 1–8 課的詞語、句式、課文／對話、練習、音檔、教材段落、來源審核紀錄與跨課索引。

`xlsx` 是多工作表主檔；CSV 不支援多工作表，所以 `csv/` 內每個檔案對應一個工作表。

## 來源與狀態

輸入檔：

- `work/boya-intermediate/extractions/structured-lesson-01.json`
- `work/boya-intermediate/extractions/structured-lesson-02.json`
- `work/boya-intermediate/extractions/structured-lesson-03.json`
- `work/boya-intermediate/extractions/structured-lesson-04.json`
- `work/boya-intermediate/extractions/structured-lesson-05.json`
- `work/boya-intermediate/extractions/structured-lesson-06.json`
- `work/boya-intermediate/extractions/structured-lesson-07.json`
- `work/boya-intermediate/extractions/structured-lesson-08.json`

資料集保留每筆資料的 `review_status`、課次審核狀態與來源檔案。第 1 課來源 QA 已通過；第 2–8 課仍有來源逐字核對、教師批准或答案／音檔內容待確認項目。資料集不把這些待確認內容改寫成已批准資料。

翻譯、詞性、搭配、常見錯誤與學生掌握度欄位只在來源已有或教師審核後填入；目前沒有自行補寫越南文翻譯、唯一答案或音檔逐字稿。

## 工作表／CSV

- `README`：13 筆
- `Lessons`：8 筆
- `Vocabulary`：394 筆
- `Grammar`：52 筆
- `Texts`：33 筆
- `Exercises`：357 筆
- `Audio`：91 筆
- `Sections`：380 筆
- `Glossary`：35 筆
- `Source_QA`：211 筆
- `Vocabulary_Master`：394 筆
- `Grammar_Master`：52 筆
- `Proposed_Fields`：16 筆
- `Field_Guide`：226 筆

`Proposed_Fields` 列出下一階段最值得補充的欄位；`Field_Guide` 說明欄位用途與空白值政策。

## 最小下一步

先完成第 2–8 課來源批准，再依 `Proposed_Fields` 的 P0 順序補上詞性、中文釋義、教師審核的越南文釋義與課本例句連結。之後再建立音檔逐字稿與學生表現資料，不要把學生個資直接放進教材來源表。
