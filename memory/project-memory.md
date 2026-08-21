# Project Memory

最後更新：2026-08-21

這份檔案只記錄已確認、會影響未來工作的長期決策；不要把猜測或未批准的內容寫成事實。

## 課程與教材

- 學生已完成《博雅漢語聽說：初級起步篇》第一、二冊。
- 本學期使用《博雅漢語聽說：中級衝刺篇 I》八課。
- 每節 50 分鐘；每次上課 4 節、200 分鐘；每一課以 6 節、300 分鐘為教學生產單位。
- 第一課是〈中國人的姓名〉，來源審核與 PBI 教學重組均已通過。
- 第一課 canonical source：`work/boya-intermediate/extractions/structured-lesson-01.json`。
- 第一課已核對 63 個教材區段、34 個詞語、7 個句式、5 個課文／對話、35 項練習與 11 段音檔。
- 第一課教師手冊已於 2026-08-20 由 Adam 批准；預習卡、活動卡、評量表與 Exit Ticket 已完成並批准。
- 整學期教師手冊組裝稿已迁移到：`course/teacher-manual.md`；学期总览使用 `course/semester-overview.md`，各课 authority 以对应 `lessons/lesson-XX/20-approved/` 为准。
- 2026-08-21 建立新的權威架構：`course/` 保存課程層級來源，`lessons/lesson-01/00-source` 保存來源 manifest，`10-design` 保存設計與 draft，`20-approved` 是唯一 authority，`30-qa` 保存只讀 QA，`40-release` 保存不可變交付包。舊 `output/` 與 `share/` 只作 legacy 證據。
- 第一課最終確認完整教學資料的只讀輸入是 `output/boya-intermediate/lesson-01/share/第一課-教学资料`；已原樣登記到 `lessons/lesson-01/20-approved/lesson-manifest.json`，並建立 `2026-08-21-final-teaching-materials` release。
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
- 學生端圖片必須完整內嵌在 PPTX 的 `ppt/media/` 中，不得依賴本機路徑或外部連結；交付前要檢查 PPTX ZIP、圖片解碼與 PowerPoint／PDF 顯示。
- 活動卡目前只交付 DOCX；旧活动卡 PDF 渲染器和旧 PDF 只作 legacy 证据，不得作为新 release 内容。
- 學生端與教師端教材都使用簡體中文：PPT、預習卡、補充活動卡、教師手冊與審閱文件不使用繁體中文；越南文只在必要時用於解釋，放在明確的說明欄位。
- 學生畫面只寫學生現在要做的事情，不顯示「能力目標」「聽力策略」「句式情境」「資訊站」「視覺樣稿」等教師／製作分類；操作文字以初級到中級常用詞為準。
- speaker notes 可以保留教師提示，但不能在投影畫面可見。
- 「只需要 PPT」不代表刪除配套；完整教材仍要包含教師手冊、學生預習卡、補充活動卡、評量／exit ticket 與音檔資料。

## 2026-08-21 PPT 修訂後的固定規則

- 學生 PPT 延續已批准的教育教材式插畫，不使用新的企業簡報／產品發布會風格；圖片採灰藍細線、低飽和粉彩、淺色背景和清楚留白。
- Section divider 直接使用教材 section 名稱，並保持簡單。不要在學生畫面加入「能力目標」「聽力策略」「句式情境」「資訊站」「視覺樣稿」或其他教師／製作分類。
- 同一音檔、同一題型的連續題目在一頁可讀時合併；填空、判斷、聽後回答、討論、活動準備和發表等不同課堂動作分開。頁數以清楚完成任務為準，不追求固定張數。
- 聽力頁統一用「聽力練習」，直接寫「聽、寫關鍵詞、回答」或「完成問題1到3」。音頻頁都要有清楚按鈕；1-1、2-1 若只作預習，不放入無關的課堂題目。
- 每張需要額外材料的投影片直接標出材料名稱；活動卡承擔完整規則，投影片只呈現學生現在要做的事和期待產出。
- PPT 大綱先寫白話的教材內容與學生操作，E01-xxx 只放最後的核對欄。所有 student-facing output 使用簡體中文，不塞教師時間、分組 footer、來源頁碼或奇怪 notes。
- 版面依內容變化：divider、聽力題、對話重建、句式範例、活動卡提示、報告、同伴記錄和課末回顧不能全部套同一張模板。圖片必須支援情境、比較、證據或記憶。
- 圖片、形狀和文字都要留在 16:9 畫布內；交付前用 PowerPoint PDF、完整 contact sheet、文字掃描、音頻／notes 檢查和未旋轉邊界檢查。
- 2026-08-21 新增 PBI 句式規則：句式必須服務一個可觀察的溝通目標，先用教材情境讓學生解決問題，再用句式完成口語產出；不以傳統「定義、例句、機械練習」作為學生頁主軸。`总不能……吧` 的核心目標是說出一個無論如何不能接受的結果，教材看牙、接孩子情境必須保留。
- 2026-08-21 新增內容保護規則：PowerPoint 中的手動修訂優先於舊生成器和舊 storyboard；教師改過的「使用畫線詞語」內容不得由舊 topics 回填。生成前要先抽取現行 PPTX，不能整份覆蓋。
- 2026-08-21 新增姓氏材料分工：第 33 頁姓名分類只用教材 15 個姓名和三類名稱；第 57 頁歷史人物報告獨立；第 58 頁把課本姓氏朗讀改成互聽記錄；姓氏信息站四張卡分別服務 E01-027、E01-028、E01-029、E01-032。
- 2026-08-21 新增卡片用語規則：活動卡不留「我想问同伴」空格，直接提供要問的問題；預習卡使用「上课问同学（选一个）」並提供問題句，學生不需要自行猜要寫什麼。
- 2026-08-21 補充姓氏活動規則：第 58 頁和 E01-032 姓氏讀法卡每人讀五個課本姓氏；E01-027 的聽者行動要分別寫成回答結果、選一個或說出共同結果；E01-029 A–D 卡片是課本第 14–15 頁《中國人的姓名》同一篇閱讀短文的四個重點。

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
- 舊版 v2–v4 PPT 大綱、舊 69 頁 storyboard、舊 visual storyboard 與 v2 PPTX 生成器已刪除；未來不得從舊輸出恢復它們。

## Current 第一課 evidence

- 唯一 authority PPTX：`lessons/lesson-01/20-approved/pptx/第一课-中国人的姓名.pptx`；最终确认包中的 PPTX 原样迁移，62 页、35/35 练习、图片与音频保留。
- 唯一 authority 简易教案：`lessons/lesson-01/20-approved/teacher-manual/第一课简易教案.docx`。
- 唯一 authority 活动卡：`lessons/lesson-01/20-approved/activities/`；5 个活动资料夹、22 份 DOCX，不交付活动卡 PDF。
- Current QA：`lessons/lesson-01/30-qa/current/pptx-v15/`；旧版本在 `30-qa/archive/`，旧 `output/` 只作 legacy 证据。
- Current 设计输入：`lessons/lesson-01/10-design/`；生成器默认只写其中的 draft 目录。
- 唯一 authority manifest：`lessons/lesson-01/20-approved/lesson-manifest.json`；当前 release：`lessons/lesson-01/40-release/2026-08-21-final-teaching-materials.zip`。
- Current 生產入口：`scripts/build_lesson_01_pptx.js` → `scripts/build_lesson_01_pptx_native.js`；prototype 入口：`scripts/build_lesson_01_prototype.js`。所有生成器默认输出 draft，不覆盖 authority。

## Authority 與 release 工作流

後續每課固定順序：來源審核 → PBI 教學設計 → 教師手冊 → 活動卡與預習材料 → PPT draft → PowerPoint 人工審閱 → 明確批准 authority → 只讀 QA → release package。生成器不能覆蓋 `20-approved`；dashboard 只從 `lesson-manifest.json` 產生連結。

## 下一個工作節點

第一課教師手冊已於 2026-08-20 由 Adam 批准；整學期主手冊目前已完成「課程總覽＋第一課」版本。第一課目前已完成 current PPTX、音頻嵌入、speaker notes 與 QA 第一輪；PowerPoint 實際播放、教師 rehearsal、修訂與交付仍未完成，第二課保持鎖定。不要把教案文字直接塞進投影片，也不要跳過素材授權紀錄。
