# Project Memory

最後更新：2026-08-20

這份檔案只記錄已確認、會影響未來工作的長期決策；不要把猜測或未批准的內容寫成事實。

## 課程與教材

- 學生已完成《博雅漢語聽說：初級起步篇》第一、二冊。
- 本學期使用《博雅漢語聽說：中級衝刺篇 I》八課。
- 每節 50 分鐘；每次上課 4 節、200 分鐘；每一課以 6 節、300 分鐘為教學生產單位。
- 第一課是〈中國人的姓名〉，來源審核與 PBI 教學重組均已通過。
- 第一課 canonical source：`work/boya-intermediate/extractions/structured-lesson-01.json`。
- 第一課已核對 63 個教材區段、34 個詞語、7 個句式、5 個課文／對話、35 項練習與 11 段音檔。
- 第一課教師手冊已於 2026-08-20 由 Adam 批准；預習卡、活動卡、評量表與 Exit Ticket 已依教師手冊完成，等待配套材料審核。
- 整學期教師手冊主檔已建立：`output/boya-intermediate/teacher-manual/boya-intermediate-i-semester-teacher-manual.md`，目前包含全學期課程總覽與第一課；第2–8課將在第一課完整交付後，以同一檔案逐課追加。
- 教材沒有提供的答案不得自行補寫唯一標準答案。

## 已確認的教學習慣

- 學校教師習慣學生先回去預習，課堂直接做練習與口語活動。
- 不在課堂上花大量時間逐字教詞語、句式或單字。
- 課堂以聽力證據、同儕互動、小組任務、報告、回饋與重做為主。
- 詞語與句式採 just-in-time repair，原則上每節直接講解不超過 5 分鐘。
- 教學設計使用 ACTFL Proficiency-Based Instruction 的 interpretive、interpersonal、presentational 三種模式；action-oriented tasks 用來提供真實角色與合作產出。

## PPTX-only 決策

- Adam 已明確批准：未來本課程不需要 HTML、HTML source deck、HTML presenter 或 HTML 動畫。
- 核心課堂媒體是原生可編輯、16:9、靜態的 PPTX。
- 音檔要嵌入或以實際 PowerPoint 測試過的方式提供。
- 學生端與教師端教材都使用簡體中文：PPT、預習卡、補充活動卡、教師手冊與審閱文件不使用繁體中文；越南文只在必要時用於解釋，放在明確的說明欄位。
- 學生畫面只寫學生現在要做的事情，不顯示「能力目標」「聽力策略」「句式情境」「資訊站」「視覺樣稿」等教師／製作分類；操作文字以初級到中級常用詞為準。
- speaker notes 可以保留教師提示，但不能在投影畫面可見。
- 「只需要 PPT」不代表刪除配套；完整教材仍要包含教師手冊、學生預習卡、補充活動卡、評量／exit ticket 與音檔資料。

## 專業交付語氣

- 未來所有教師手冊、預習卡、活動卡、PPTX 與其他 output 都要像正式出版或業界教學文件，直接呈現使用者需要的資訊。
- 不加入「這不是學生講義，也不是……」等 AI 式前言、內部 workflow 說明、工具說明或與讀者無關的 notes。
- 文件控制欄可保留版本、日期、作者與審核狀態；製作、QA、來源追蹤與 debug 資料放在獨立內部檔案。
- 教師手冊保留專業教學程序和教師操作資訊；學生材料與投影片只呈現課堂需要的內容。
- 教師手冊參考正式教師版的課次結構：教學目標、教學重點、暖身／預習回收、詞語與句式提示、分段教學範本、練習解答、文化補充與課後預習。

## 已批准的生產順序

1. 來源審核包與批准。
2. PBI 教學重組、6 節課流程與 35 項活動 coverage，並取得批准。
3. 先完成教師手冊內容母版：本課所有內容、重點、時間、音檔、教材練習、活動、教師提示、修補、答案政策、評量與備案。
4. 教師手冊審核與批准；教師手冊是本課內容的 source of truth。
5. 依批准的教師手冊製作預習卡、角色卡／資訊站卡／調查表／評量表等學生配套。
6. 依教師手冊與學生配套建立內部 PPT storyboard。
7. Visual storyboard 與設計系統審核：低文字密度、圖片功能、版面節奏、字體、色彩與素材授權。
8. 先製作 6 張視覺 prototype，確認學生畫面沒有教師／製作標籤，且用詞符合初級到中級程度。
9. 原生 PPTX、speaker notes 與音檔。
10. 內容、視覺、版面、音檔、列印與 300 分鐘流程 QA。
11. 教師 rehearsal、修訂與交付。

## Legacy context

- `output/semester-plan/index.html`、`output/boya-intermediate/lesson-01/source-review/index.html` 與 `output/boya-intermediate/lesson-01/teaching-design/index.html` 是已完成的 review artifacts，不是未來課堂教材格式。
- `scripts/build_lesson_01_source_review.js` 與 `scripts/build_lesson_01_teaching_design.js` 只用於已完成的 HTML 審閱頁重建；未來 PPTX 生產不得依賴 HTML。
- 不建立或維護 `.kiro/`；舊 Kiro 文件只作 legacy context。

## 下一個工作節點

第一課教師手冊已於 2026-08-20 由 Adam 批准；整學期主手冊目前已完成「課程總覽＋第一課」版本。第一課的 PPT 生產、音檔、speaker notes、QA、rehearsal 與交付尚未全部完成，當前唯一工作節點是完成第一課。第二課保持鎖定，不得跳著製作；第一課完整交付後才解除第二課來源審核。不要把教案文字直接塞進投影片，也不要跳過素材授權紀錄。
