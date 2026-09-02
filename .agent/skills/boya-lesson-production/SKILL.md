---
name: boya-lesson-production
description: PPTX-only production workflow for the Vinh University Boya Chinese listening and speaking course.
---

# Boya Lesson Production

本 skill 適用於本專案所有華語教材、教案、預習材料、活動卡、教師手冊、音檔與 PPTX 任務。

## 必讀順序

開始工作前先讀：

1. `AGENTS.md`
2. `PROJECT_REQUIREMENTS.md`
3. `memory/project-memory.md`
4. `project.config.json` 的 `active_context`，並用 `course/lesson-registry.json` 核對目前的 `lesson_key`
5. `project.config.json` 的 `canonical_source`，或目前課次 `lessons/<textbook_id>/lesson-XX/00-source/` 中的 canonical source
6. 相關 PDF、音檔與教材索引

所有工作上下文必須同時帶有 `offering_id`、`textbook_id` 與 `<textbook_id>:<lesson_id>` 格式的 `lesson_key`。生成器、QA、dashboard、manifest 與交付記錄不得使用裸 `lesson-01` 推定教材身份。

如果要製作第一課，必須確認來源 gate 與教學重組 gate 的批准狀態；兩者未批准，不得直接大量製作完整 authority PPTX。後續課次若已有來源包與 Adam／AI 確認的線上／實體邊界，可先使用 lesson-specific draft gate 產生可回退的 `10-design/pptx-draft`；這不授予 authority，也不取代教師手冊、配套、Visual storyboard、prototype、QA、rehearsal 或 release gate。

## 單一權威來源架構

本專案使用固定的課次目錄：`00-source/` 保存來源，`10-design/` 保存設計與 draft，`20-approved/` 保存唯一權威版本，`30-qa/current/` 保存只讀 QA，`30-qa/archive/` 保存舊 QA，`40-release/` 保存從 authority 複製出的不可變交付包。

- 每課只使用一份 `20-approved/lesson-manifest.json`；檔案連結、版本、SHA-256、QA 與 release 都以此為準。
- 生成器只能寫入 `10-design/` draft，不能覆蓋 `20-approved/`；PowerPoint 人工修訂須經 Adam 明確批准後才成為 authority。
- release builder 只能讀 `20-approved/`，不得在 `40-release/` 重新生成教案、活動卡或 PPTX；不使用 `share`、`share 2`、`share 3` 作為工作流程目錄。
- 本次第一課的主任審核包已登記到 `20-approved/`；原始輸入快照只保存在 `archive/legacy-materials-2026-08-27/`，是歷史證據，不是新的生產來源。
- 活動卡只交付 DOCX；活動卡不生成 PDF，也不建立「可编辑原稿」中間層。
- dashboard 必須由 `course/lesson-registry.json` 與目前 `lesson_key` 對應的 lesson manifest 共同產生；歷史材料統一放在 `archive/`，不進入新的生產流程。
- 任何 generator 開始寫檔前都必須執行 `python3 scripts/production_gate.py`。教師手冊、配套、prototype、semester manual、authority PPTX 與 release 使用 authority gate；PPTX 草稿使用 `--purpose pptx --stage draft --lesson-key <textbook_id>:<lesson_id> --output-dir <draft-dir>`。草稿 gate 只驗證身份與輸出邊界，不授予 authority；authority／release gate 才檢查批准輸入與 rehearsal。

### 統一提交檔案命名（2026-08-29）

- 面向 Adam 的課次交付檔案（PPTX、DOCX、PDF、音檔、CSV、ZIP）一律使用 `lesson-<nn>-<用途>.<副檔名>`；`<nn>` 固定兩位數，使用半形 `-` 分隔，副檔名小寫。
- 兩份課堂 PPTX 的 canonical 名稱格式是 `lesson-<nn>-在线预习.pptx` 與 `lesson-<nn>-实体课.pptx`。教師手冊、預習卡、活動材料、預覽、音檔與教材包也沿用 `lesson-<nn>-<用途>` 前綴。
- 提交前不得保留 `第一課`／`第一课`、`online`／`face-to-face`、空格、底線、日期或重複 `final`；版本與 hash 由 manifest／QA／release 紀錄管理。內部 draft 可暫加 `-draft-vNN`，提交時要改回 canonical 名稱。
- schema 固定檔名、出版社／第三方來源檔名和歷史 archive 保留原名；既有 approved／release 不追溯改名，會改變 authority 路徑或 hash 時必須先取得 Adam 明確批准。

## 核心規則

### 0. 已批准的《準中級加速篇 I》視覺模板

- 共用視覺與字體 token 登記在 `scripts/boya_design_system.json`（`system_id: boya-classroom-materials`），實作位於 `scripts/lesson_pptx_master_template.js`。
- 線上課程的共用版式 contract 登記在 `course/boya-online-layout-contract.json`（`contract_id: boya-quasi-intermediate-i-online-v2`）；每課內容另由 `course/boya-online-content-contract.json` 提供。
- 《準中級加速篇 I》L1–L6 `20-approved/pptx/` 中的線上與實體課 PPTX 是唯讀 finalized reference decks；不得修改、重建或覆蓋。
- 所有課次只替換標題、文字、圖片、教材頁碼、音頻與課次需要的頁數。不得在單課生成器內另寫色票、字體、divider 或整體 layout。
- Finalized L1–L6 的投影片主畫布固定為純白 `#FFFFFF`；暖白只可用於局部卡片、圖片框或插畫內容，不得把暖紙色作為整張投影片背景。生成器必須讀取共享 `slideBackground` token，不得自帶另一個背景色。
- `docs/ppt-reference/finalized-l01-l06/finalized-ppt-reference-manifest.json` 登記的 finalized L1–L6 PPTX 是唯讀視覺參考；slide count 依課次內容而定，不得把單一課次頁數寫成後續生成器的固定限制。
- Finalized 字級矩陣按文字角色執行：頁眉／編號／教材頁碼／音頻／材料小標／關鍵詞 `20 pt`；緊湊正文 `21 pt`；一般正文 `22 pt`；拼音 `24 pt`；一般標題 `34 pt`；過長標題 `27 pt`；任務提示 `28–34 pt`，預設 `34 pt`；divider `48 pt`；封面主標題依課次為 `44–50 pt`；學習目標標題 `36 pt`、標籤 `23 pt`、編號 `20 pt`、目標正文 `24 pt`；詞語詞頭 `42 pt`、長詞 `34 pt`、詞類約 `20–22 pt`、越南文意思約 `20–22 pt`、使用場合 `20 pt`、詞語例句 `22 pt`；線上句式練習例句 `35 pt`。可見文字不得低於 `20 pt`；fit/shrink 不得用來繞過下限，放不下時縮短、調整版面或拆頁。
- `fit`／`shrink`／`normAutofit` 可以使用，但 QA 必須同時檢查顯式與繼承的 `a:rPr`／`a:defRPr` 字號及 `fontScale`；縮放後的有效顯示字號仍不得低於 `20 pt`。定稿中的名義 18 pt 與少量 script 欄位異常只作唯讀記錄，不得複製到新 draft。
- approved 必須綁定檔案路徑、頁數、bytes 與 SHA-256；任何檔案變更都使舊批准失效。
- 2026-09-02 逐頁 audit 已覆蓋 L1–L6 的線上／實體 12 份 finalized PPTX、777 張投影片。投影片主畫布為純白 `#FFFFFF`；暖白只在局部卡片、圖片框或插畫內容出現。封面沒有底部 subtitle；第 3 張目標頁是「標題＋青綠標籤＋課次專屬 3–4 項編號目標」，編號使用青綠、珊瑚、紫色、黃色的實心圓與白色數字。固定 header、頁碼、底線與主要內容槽位的 EMU 位置記在 `course/boya-online-layout-contract.json` 和 audit 報告中。

### 1. PPTX-only

- 課堂教材輸出是原生可編輯 PPTX。
- 不製作 HTML source deck、HTML presenter 或 HTML 動畫。
- 不把 HTML 當作 PPTX 的必要中間格式。
- PPTX 使用靜態投影片，除非使用者另行要求動畫。
- 必須建立內部 JSON／CSV storyboard；它是內容與頁面生產的必要資料，但通常不需要交付給使用者，除非使用者要求。

### 2. 翻轉預習、課堂實作

- 課前安排快速閱讀、音檔接觸、標記卡點、個人準備或微研究。
- 本專案已採用的內容分流是：線上預習承擔教材閱讀、音檔預聽、詞語理解、短文重點記錄與課前個人資料／問題準備；實體課承擔聽力理解、同伴問答、資訊差活動、口語練習、個人發表、回饋與重做。
- 線上學習由學生自行安排，屬實體課外的額外準備；各課核准的實體課時照常上滿，線上不折抵、不替代或縮減實體節數。各課實體課時須依該冊教材實際課數、內容量與正式課表分配，可跨次上課或在同次安排多課，不預設每課固定 6 節。
- 線上約三分之二、實體約三分之一只是內容配置估計，不是學習時數、頁數或驗收比例；每個 `lesson_key` 必須保存自己的 boundary confirmation record。
- 課堂先讓學生做聽說任務，再依實際表現做即時修補。
- 詞語／句式講解原則上每節不超過 5 分鐘。
- 不逐字翻譯，不逐個字教學，不讓文法講義取代口語任務。
- 未預習學生使用 3–5 分鐘 recovery route，不能讓整節課退回講解模式。

### 3. PBI task spine

每課要有可觀察 Can-Do 與證據，整合：

- Interpretive：主旨、細節、立場、聽力證據。
- Interpersonal：提問、回答、追問、澄清、確認、協商。
- Presentational：成段口語、報告、提案、反思。

Action-oriented activities 應有角色、資訊差、合作產出、聽眾與任務結果；不能只把傳統填空題換成小組名稱。

### 3.4 後續課次教材生產原則（2026-08-27）

以下規則僅適用於各教材自己的 `lesson_key` 的第一課之後的新課。各教材第一課的已批准 artifact 保持鎖定；本節只補齊後續課次流程記錄與共用模板，不回改已批准第一課 PPTX：

- PPT 開頭（封面後）先放學生可見的學習流程圖，依該課已批准的教師手冊與 storyboard 呈現實際順序，例如「詞語 → 討論活動 → ABC → XYZ」，不套用固定流程。
- 每課 PPT 的詞語教學覆蓋 canonical source 的全部生詞與核准的補充生詞（如有）。一頁一個詞語，每頁固定包含「詞語、拼音、詞類、越南文意思、圖片」；新課 draft 的每個詞語（含專有名詞）必須先在 `course/boya-example-bank.json` 登記恰好兩條短例句，使用場合、用法、擴展、詳細語法與常用短語仍可按詞語內容留空並省略空標籤。越南文意思必須來自該課 content contract 且標記已審核；不得使用英文、canonical `gloss`、中文 fallback 或通用補位。圖片須服務詞義、使用場合或記憶，素材來源與授權狀態記入內部清單。
- 後續課次遵守所有學生端 PPT 的字級規則：投影畫面可見文字最低 20 pt，說明區、操作提示與活動說明不得更小；speaker notes、教師手冊與活動卡不在此 PPT 字級限制內，投影畫面可見的教材頁碼標記也不得低於 20 pt。
- 聽力教學使用 Adam 的固定操作：先看題目、抓關鍵字，再聽並記重點，最後回答與核對；這是教學方法，不另行指定考試類型。
- 每課另做線上課程材料。線上約三分之二、實體約三分之一，這只是內容安排的規劃估計，不是學生學習時數比例；線上不設固定分鐘數、不要求計時或追蹤，也不折抵或替代各課核准的實體課時。教材長課文與對話仍以 canonical source／教材原頁為準，但學生 PPT 不直接貼上整段原文；線上使用「打開教材 Pxx 閱讀／聽取」加短文重點記錄版式，實體使用聽力、問答、比較與口語發表版式。完整原文保留在教材、canonical source、教師手冊或必要的學生閱讀材料中；線上內容必須準備好實體課活動所需的語言。
- 實體課以口語實作為主。口語活動由每課另行指定，不自動推定為線上內容；較難的口語活動須在課前提供準備。
- 每本教材第一課之後的新課開始製作任何 PPT 前，必須先由 Adam 與 AI 共同討論並確認哪些內容放在線上課程 PPT、哪些內容放在實體課程 PPT；確認記錄完成前，不得建立該課 PPT storyboard 或開始 PPT 生產。

#### 3.4.1 句式任務設計

- 每個句式先回答「學生用它要完成什麼」，再決定投影片和活動卡。句式不是要學生背出的定義，而是完成目標時的一個語言選擇。
- 任務規格固定包含：教材情境、溝通問題、學生口語產出、聽者回應或確認、一次重做。教材情境保留在教師手冊與教學設計；線上學生句式練習頁不顯示情境或頁眉下方的黑色句式標題，只保留紫色句型框、兩條短例句與最短動作句；一句話的用法說明放教師手冊。

#### 3.4.2 《中級衝刺篇 I》第一課句式規則（`lesson_key: boya-intermediate-i:lesson-01`）

- `总不能……吧` 的教學目標是「遇到不合理的做法時，說出一個無論如何不能接受的結果」。用教材的看牙、接孩子情境引出，不用無關的自造例句取代教材。
- `……才怪呢`、`到时候`、`话说回来`、`不然`、`是……还是……`、`怎么……怎么……` 都要依其溝通用途設計任務，並保留教材原有練習題。可增加資訊差、同伴確認或小組報告，但不能把原題改成另一題。

#### 3.4.3 手動修訂與教材文字保護

- 目前 PPTX 的手動修訂優先於舊 generator、outline 和 QA。整份重建前必須抽取目前 PPTX 文字並核對；不能讓舊規格覆蓋教師已改好的內容。
- 線上句式練習頁只保留紫色圓角句型框及其中的句式文字；每頁固定兩條例句，例句使用 `35 pt`，不顯示黑色句式標題或可見情境。紫色句型框在版面允許時保持一行；不得為了套用版式而人為斷行。若一行放不下，先調整框寬、版面或字級。
- 句式練習下方的學生指示由課次／項目內容契約提供直接動作；可用「用这个句式写出三句话」「用这个词写出三句话」或「用这个短语写出三句话」，不得把「完成教材中的练习。」硬套在所有項目上，也不得生成沒有來源的練習名稱。
- 若 Adam 已在 PowerPoint 中手動修訂並明確表示不要再改 PPT，該 PPTX 與分享包中的 PPTX 進入鎖定狀態；停止 PPTX 生成、覆蓋與重新打包，直到 Adam 另行明確批准。
- 活動卡不留開放的 `我想问同伴` 空格，直接提供學生要問的問題；預習卡若需要準備問題，使用 `上课问同学（选一个）`，並提供可直接使用的問題句，不要求學生自行猜要寫什麼。

#### 3.4.4 《中級衝刺篇 I》第一課教材文字修訂規則（`lesson_key: boya-intermediate-i:lesson-01`）

- 「用三到五句話回答問題，並使用畫線詞語」的詞語、題目和順序以教師目前修訂版本為準。生成器規格必須先同步，並在生成後做差異檢查。

#### 3.4.5 《中級衝刺篇 I》第一課姓氏材料分工（`lesson_key: boya-intermediate-i:lesson-01`）

- 姓名分類直接使用課本列出的姓名和三類名稱；不以自造調查表取代教材題目。
- 姓氏材料分為四個獨立目標：E01-027 句式任務、E01-028 文化比較、E01-029 閱讀資料互教、E01-032 姓氏讀法互聽。E01-031 歷史人物報告使用活動五，不能和 E01-032 混在一張卡。
- E01-032 可以從「讀課本」改成互聽：每個學生讀五個課本姓氏給同學聽，同學記下五個姓氏並回答是否認識相關的人；這樣保留教材內容，同時增加聽說證據。
- E01-027 的聽者行動要分開寫：`不然` 回答不這樣做的結果；`是……還是……` 選一個；`怎麼……怎麼……` 說出共同結果。禁止使用「說出聽到的結果或選擇」這種無法直接操作的總稱。
- E01-029 只使用一張「課文重點記錄卡」，內容來自課文《中國人的姓名》（課本第 14–15 頁）；學生兩人一組先閱讀短文、各自寫下一個重點，再輪流說給同伴聽，由同伴記錄「我聽到的重點」。

### 4. 現行學生 PPTX 規則（2026-08-21；通用規則）

以下學生可讀性、頁碼、材料與 QA 原則適用於所有課次的新生成或經批准的修訂；第一課已批准 PPTX 的具體教材內容和人工修訂不因本節回改。涉及特定教材的句式、E 編號、姓氏或課本文字，必須回到對應 `lesson_key` 的專屬規則：

- 所有學生端 PPT（包括線上預習與實體課、第一課與後續課次）的投影畫面可見文字最低 20 pt；說明區、操作提示、活動說明與教材頁碼標記不得更小。speaker notes、教師手冊與活動卡不受此 PPT 字級限制。
- 使用已批准的教育教材式插畫 contact sheet：純白投影片畫布 `#FFFFFF`、灰藍細線、低飽和粉彩、清楚留白。暖白只可出現在局部卡片、圖片框或插畫內容中。不要換成企業發布會、產品宣傳或抽象難懂的視覺。
- section divider 直接使用教材原名；divider 只顯示 section 名稱和簡單主視覺。
- 一頁只服務一個學生動作。同一音檔、同一題型的連續題目可合併，只要投影後仍清楚；填空、判斷、聽後回答、討論、活動準備和發表要分開。
- 聽力頁統一標題「聽力練習」，正文使用「聽、寫關鍵詞、回答」或「完成問題1到3」等可直接執行的說法。不要使用「說依據」「追問同伴」或製作人分類。
- 每張需要播放音檔的投影片都要有清楚的音頻按鈕；預習音頻不放進無關課堂題目。每張需要活動材料的投影片直接寫出材料名稱。
- 學生畫面全用簡體中文，並且只保留學生當下需要的內容。教師時間、分組腳註、內部來源追蹤、E 編號、AI 說明和多餘 notes 只放教師手冊、speaker notes 或內部 QA；使用課本內容的投影片必須保留右下角教材印刷頁碼標記。
- 大綱先寫白話的教材內容和學生操作，核對編號放在最後欄。不要讓教師先解碼 E01-xxx 才知道這頁要做什麼。
- divider、聽力題、對話重建、句式範例、活動卡提示、報告、同伴記錄和課末回顧使用適合內容的不同版式；保持同一設計系統，不重複同一頁模板。
- 圖片必須服務情境、理解、比較、證據或記憶；圖片、形狀和文字全部留在 16:9 畫布內。交付前用 PowerPoint PDF、contact sheet、文字掃描和邊界掃描檢查。
- canonical source／content contract 指定的圖片若缺失或待審核，不得用無關圖片、泛用圖示或其他課次素材替代；保留 `pending_assets`、指向教材原頁，並在 manifest／QA 記錄 blocker。

### 4.1 全課次教材頁碼標記

- 所有課次的學生端 PPTX，只要投影片直接使用、要求閱讀、聽取、完成或討論課本教材內容（聽力練習、課文／對話、教材題目、詞語／句式練習、文化知識、拓展練習或教材延伸任務），右下角都要顯示小型教材印刷頁碼，例如 `教材 P3` 或 `教材 P6–7`。
- 頁碼從目前課次 canonical source 的 `textbook_printed_page(s)` 和 current storyboard 的 `source_refs` 推導；使用印刷頁碼，不使用 PDF 內部頁碼；跨頁內容顯示頁碼範圍。沒有課本內容的封面、section divider、純流程頁或純回顧頁可以不標記。
- `source_refs` 是頁碼 mapping 的必要追蹤欄位；每個含課本內容的 slide 都必須能回溯到至少一個 canonical source record。每課 draft 產出後使用支援該課 schema 的 `add_textbook_page_markers.py`／`verify_textbook_page_markers.py`；工具必須能讀取 `sections`、`source_ref` 與課次專屬 source refs。傳給工具的 storyboard 必須是逐張投影片的 mapping，候選頁區塊 inventory（例如 `lesson-02-source-refs.csv`）不能直接當 storyboard。若工具不支援目前 schema，先修正工具或建立 lesson adapter，不得改寫 canonical source 來迎合工具。
- 這是全課次規則，不只適用第一課；工具和 QA 參數必須使用目前課次的 source、storyboard 和 PPTX 路徑，不得把 Lesson 1 的頁碼或 slide 數字寫死。

### 4.2 第一課版式復用與短句規則（2026-08-29）

- 《準中級加速篇 I》第一課的兩份 approved PPTX 是後續課次的版式參考。普通課次直接沿用封面、學習路線、單詞一頁、短文記錄、常用表達、句式練習、綜合表格、綜合問答、個人提綱和課末回顧等 layout family，只替換本課文字、頁碼、音檔和圖片。
- 第一課共用 divider 與公共插畫素材已批准；它們即使物理上保留在 `lessons/boya-quasi-intermediate-i/lesson-01/10-design/image-assets-draft/`，也按第一課批准素材使用。複製時須保留 asset manifest、來源、授權與 hash 記錄；不得因目錄名稱含 `draft` 而重新生成同用途 divider。
- 線上預習 PPT 同樣保留 section divider，直接沿用第一課批准的 divider 版式與共用素材（詞語、短文、常用表達、綜合練習）；不得因為是線上版而省略或另創 divider。
- 新課 draft 的詞語與常用表達例句必須先寫入 `course/boya-example-bank.json`；每個詞語與每個線上句式固定恰好兩條獨立、自然、可直接朗讀且不超過 24 個漢字的明確核准短句。不得從課文或長例句自動擷取，也不得用通用例句填空；資料庫缺例句時生成器停止。L1–L6 finalized 是唯讀參考，不追溯補例句。
- 短文、對話與文章類內容不在學生 PPT 中整段重排。線上使用「打開教材、讀／聽、找出並記錄」的短文記錄版式，實體使用聽力策略、問答、比較和口語發表版式；完整原文留在教材、canonical source、教師手冊或必要的學生閱讀材料。
- 綜合練習直接套用第一課的綜合 divider 及「整理信息 → 根據課本回答 → 個人信息／口語提綱」公共版式；生成器以共用版式元件輸出，不能把整段教材要求塞進單張投影片。

`scripts/build_lesson_01_pptx.js` 與 `scripts/build_lesson_01_pptx_native.js` 只屬於《中級衝刺篇 I》第一課的歷史生產流程，不是《準中級加速篇 I》的模板來源。《準中級加速篇 I》後續課次目前以 `scripts/build_l23_pptx_drafts.js` 產生 L2／L3 的 draft；該入口只能寫入對應課次的 `10-design/pptx-draft/`，並必須沿用第一課 approved layout family、共用 token 與共用素材，不得覆蓋 `20-approved/`。後續擴展生成器時，先抽出同一套共用元件，再接入各課 content contract 與 current storyboard。

## 固定 workflow

### Gate A：來源

1. 盤點 PDF、頁碼、音檔、QR、索引。
2. OCR 與人工核對。
3. 建立結構化 source package。
4. 確認詞語、課文、句式、練習、音檔與答案狀態。
5. 等待教師／Adam 明確批准。

### Gate B：教學重組

1. 寫 Can-Do 與最終任務。
2. 依該冊教材的實際課數、各課內容量與正式課表分配實體課時；不預設每課固定 6 節／300 分鐘。
3. 將所有教材練習建立 coverage record。
4. 加入課前預習、group activities、supplemental activities、回饋與重做。
5. 等待教師／Adam 明確批准。

### Gate C：內容契約、教師手冊、配套與 PPT

1. 建立本課 content contract：把 canonical source 的每個詞語、句式、課文、音檔、練習與綜合任務建立穩定 `content_id`，記錄初步線上／實體分流；練習數量依本課 source package，不套用其他課次的固定總數。
2. 先由 Adam 與 AI 確認初步線上／實體分流，再完成教師手冊內容母版：課堂目標、最終任務、該課核准實體課時流程、教材區段、練習 coverage、音檔、分組活動、學生產出、教師提示、即時修補、答案政策、評量與備案。各教材第一課之後的新課必須保存這項邊界確認；已鎖定第一課不因本流程回改。
3. 教師手冊審核與批准；教師手冊是本課內容的 source of truth，不能在 PPT 完成後才補寫。
4. 依批准的教師手冊規格化預習卡、角色卡、資訊站卡、調查表、rubric、exit ticket 與其他補充活動材料；材料不能偷偷增加新教學決定。
5. 教師手冊與配套確認後，完成逐項線上／實體 routing record，保存含日期、版本、雙方確認、handoff evidence 的記錄；後續課次的 draft 可在來源包與邊界確認後先建立，但完整逐頁 authority 規格仍以教師手冊與配套為準。
6. 依 `scripts/lesson_pptx_master_template.js` 與 `scripts/boya_design_system.json` 的共用 token 建立半固定課次骨架，再依教師手冊、學生配套與已批准邊界建立完整逐頁生產規格。每頁必填唯一 slide ID、deck、module ID、module instance、step、順序、section、學習目的、學生唯一動作、來源與原文、學生可見文字、教材頁碼、音檔、材料、學生產出、互動方式、speaker notes、`layout_id`、文字容量、圖片功能與授權、前後頁關係和驗收狀態。普通課次沿用共用 engine 與第一課 layout family，只按教材增減重複頁；字段未完成或學生文字未定稿，不得生成完整 PPTX。線上／實體分流必須先有該課 boundary confirmation record；補記錄不回改已批准 PPTX。
7. 建立 Visual storyboard／版式映射。普通課次把每張 slide 映射到共用 design system 與已批准的第一課 layout family，並記錄文字上限、圖片功能、素材來源與授權。
8. 所有完整 PPTX（包括普通課次）都必須先製作並審核 6 張視覺 prototype。草稿階段可以先審最長文字、含音頻頁、divider 與其他高風險映射，但不能用草稿審查取代 6 張 prototype gate。
9. 使用目前課次已通過 draft gate 的 generator 生成原生 PPTX，加入 speaker notes、音檔與必要的學生提示；課次 generator 不得自帶色票、字體或整體版式。準中級第 2、3 課目前使用 `scripts/build_l23_pptx_drafts.js`，只能依明確 `lesson_key` 寫入對應課次的 `10-design/pptx-draft/<mode>/`，不得因腳本預設值生成未指定課次。
10. 保持學生主畫面不含內部備課資訊；所有投影片與學生材料必須能回溯到已批准的教師手冊。Draft PPTX 完成後，依 current storyboard 的 `source_refs` 與 canonical source 加入教材頁碼標記；不要在未記錄 `source_refs` 時猜測頁碼。

### Gate D：QA

1. 來源忠實度與簡體字核對。
2. 該課 canonical source 全部練習與所有活動 coverage 核對。
3. 音檔逐一播放。
4. PPTX 開啟、編輯、投影與列印測試。
5. 檢查文字溢出、低文字密度、字體大小、對比、圖片主體、素材授權、拼音與全中文指示。
6. 檢查該課核准實體課時的時間與轉場。
7. 教師 rehearsal 或課堂測試後記錄修訂。

### Gate D 的 PPTX 專項檢查

- 以原生 PowerPoint 匯出 PDF，檢查完整頁數與整份 contact sheet；不能只抽查一張。
- 掃描投影文字，確認沒有「白話說明」、教師分類、時間／分組 footer、內部 E 編號或其他不屬於學生的說明。
- 檢查圖片和形狀的未旋轉邊界，禁止任何內容刻意超出 13.333 × 7.5 英寸畫布。
- 連續題組合併後重新核對所有教材練習、音頻按鈕、speaker notes 和 activity materials；不能用減少頁數換取漏題。
- 執行 `python3 scripts/verify_textbook_page_markers.py --pptx <marked.pptx> --source <canonical-source.json> --storyboard <current-storyboard.csv> --pdf <preview.pdf>`，確認所有含課本內容的投影片都有正確標記，沒有課本內容的投影片沒有多餘標記，標記位於右下角畫布內且在 PDF 預覽可見。

## 配套材料要求

完整教材包至少包含（生產順序以教師手冊為起點）：

- 教師手冊：流程、頁碼、音檔、canonical source 全部練習 coverage、分組、提示、修補、評量、答案政策與備案；必須先完成並批准。
- 目前課次的線上與實體課 PPTX；必須依批准的教師手冊與內容邊界製作。
- Visual storyboard：依教師手冊決定的內容製作，記錄版面、圖片、文字上限、設計 token 與素材授權規格。
- 預習卡：指定閱讀／聽力、準備任務與帶課堂證據。
- 活動材料：訪談卡、角色卡、資訊差卡、輪站卡、調查／研究表。
- 同儕回饋、rubric、exit ticket。
- 音檔與版本 manifest。

活動卡目前只交付可編輯 DOCX，不把活動卡 PDF 放入 release；`10-design` 可產生內部 preview PDF 供列印與版面 QA。預習卡、評量表與教師手冊是否另附 PDF 依各自規格決定。不能用 HTML 取代這些材料。

活動材料依學生實際使用的動作拆分；完成檢查、重做記錄或回饋若與主要任務在同一流程中完成，直接併入主要任務卡，不另建檔案。只有需要獨立發放、輪換、回收或由不同角色使用時，才建立獨立材料。

同一角色使用的問題、提示、記錄表、客戶卡或呈現表直接合併到該角色的 Word 文件。活動 Word 文件直接放在對應活動資料夾，不建立「可編輯原稿」中間層。

### Current draft 清理規則

- 每課 `10-design` current draft 只保留一份現行 outline、visual storyboard、asset plan，以及 online 與 face-to-face 各一份 PPTX 和其最新 QA；被取代的 outline／storyboard／生成器要在依賴移除後刪除或移到明確的 `90-archive/`，不留在未標記的同一資料夾。
- 舊 HTML review artifact 可以留作來源審閱證據，但不得再被生產器或 dashboard 當成課堂 deck 來源。
- 新課次不得再把多份 PPT、活動卡或教師手冊互相複製成平行 authority；每次交付只從 `20-approved/` 建立一份 release。

## 來源與答案政策

- 以 canonical structured source 為唯一教材資料基準。
- 舊 OCR、舊 JSON、舊 HTML 只能作參考，不能覆寫已核對來源。
- 教材沒有答案的開放題不得自行製造唯一答案。
- 教師示例要標示為示例；評量要評估語言表現與任務完成，不把示例冒充來源答案。
- 榮市大學硬性規則：課堂與學生端教材的結構、操作指示、目標、題目與回饋使用簡體中文；線上預習詞語頁的「意思」欄使用已審核的越南文詞彙，是唯一明確的學生端越南文例外。
- 實體課 deck、預習卡與活動卡不放越南文；線上預習除詞語「意思」欄外不放越南文。任何學生端不使用英文詞義 fallback；中文使用 `KaiTi`，拼音、越南文與其他拉丁字母使用 `Times New Roman`，並按 run-level script 設定。
- 學生畫面只呈現學生現在要做的事情；不顯示「能力目標」「聽力策略」「句式情境」「資訊站」「視覺樣稿」等教師／製作標籤。
- 學生端操作文字以初級到中級常用詞為準，優先寫「聽、問、說、找、回答、一起做」等動作；較難詞語只能在它是本課的學習目標時出現。
- 普通教材練習頁只放一個最短動作句，例如「完成問題1到5。」「完成填空。」「判斷正誤。」不重複播放輪次、同學討論、理由說明或教師操作順序；必要的題目直接顯示在頁面上。
- speaker notes 只放教師提示，不得把備註文字或製作分類放到投影畫面。

### 專業交付語氣

- 所有可交付文件以正式教案、教材或簡報的標準撰寫，直接呈現讀者需要的內容。
- 移除 AI 自我說明、生成流程、工具／模型名稱、審核 gate 解釋與與讀者無關的 meta notes。
- 避免「這不是……」「本文件不是……」等模板式開場；使用課程資料、教學步驟、活動規格和評量欄位取代說明性前言。
- 版本、日期與審核狀態只保留在正式文件控制欄；來源、授權、QA 和 debug 資料放在獨立內部檔案。
- 交付前用自然中文編輯標準複查空泛轉折、誇張語氣、重複解釋、過度排比和不必要的破折號。
- 教師手冊採正式課本教師版的內容架構：每課列出教學目標、教學重點、暖身／預習回收、詞語與句式提示、分段教學範本、教材練習解答、文化補充與課後預習；PBI 任務與聽說證據要寫進相應課堂步驟。

## 回報格式

每次工作完成後報告：

- 已完成的 artifact 與絕對路徑。
- 已驗證項目與實際數字。
- 尚未驗證／待教師決定的項目。
- 目前 gate 狀態。
- 下一個最小可驗證步驟。
