# Boya Lesson Production Reference

This reference preserves artifact-specific rules moved from the main skill during the Workflow V2 decomposition. Read the canonical workflow contract and requirements registry first. This document does not redefine lifecycle, identity, gate, authority, or release semantics.

### 0. 已批准的《準中級加速篇 I》視覺模板

本節舊母版、固定頁序、紫色與pt字階只用於仍選用該母版的線上預習／明確指定的歷史PPTX維護；不適用未來實體課HTML或其PPTX備份。實體課依2026-10-07標準；PPTX匯出仍遵守適用課程的字級下限。


- 共用視覺與字體 token 登記在 `scripts/boya_design_system.json`（`system_id: boya-classroom-materials`），實作位於 `scripts/lesson_pptx_master_template.js`。
- 線上課程的共用版式 contract 登記在 `course/boya-online-layout-contract.json`（`contract_id: boya-quasi-intermediate-i-online-v2`）；每課內容另由 `course/boya-online-content-contract.json` 提供。
- 《準中級加速篇 I》L1–L6 `20-approved/pptx/` 中的線上與實體課 PPTX 是唯讀 finalized reference decks；不得修改、重建或覆蓋。
- 沿用本舊母版的線上課次只替換標題、文字、圖片、教材頁碼、音頻與課次需要的頁數。不得在單課生成器內另寫色票、字體、divider 或整體 layout。
- Finalized L1–L6 的投影片主畫布固定為純白 `#FFFFFF`；暖白只可用於局部卡片、圖片框或插畫內容，不得把暖紙色作為整張投影片背景。生成器必須讀取共享 `slideBackground` token，不得自帶另一個背景色。
- `docs/ppt-reference/finalized-l01-l06/finalized-ppt-reference-manifest.json` 登記的 finalized L1–L6 PPTX 是唯讀視覺參考；slide count 依課次內容而定，不得把單一課次頁數寫成後續生成器的固定限制。
- Finalized 字級矩陣按文字角色執行：頁眉／編號／教材頁碼／音頻／材料小標／關鍵詞 `20 pt`；緊湊正文 `21 pt`；一般正文 `22 pt`；拼音 `24 pt`；一般標題 `34 pt`；過長標題 `27 pt`；任務提示 `28–34 pt`，預設 `34 pt`；divider `48 pt`；封面主標題依課次為 `44–50 pt`；學習目標標題 `36 pt`、標籤 `23 pt`、編號 `20 pt`、目標正文 `24 pt`；詞語詞頭 `42 pt`、長詞 `34 pt`、詞類約 `20–22 pt`、越南文意思約 `20–22 pt`、使用場合 `20 pt`、詞語例句 `22 pt`；線上句式練習例句 `35 pt`。可見文字不得低於 `20 pt`；fit/shrink 不得用來繞過下限，放不下時縮短、調整版面或拆頁。
- `fit`／`shrink`／`normAutofit` 可以使用，但 QA 必須同時檢查顯式與繼承的 `a:rPr`／`a:defRPr` 字號及 `fontScale`；縮放後的有效顯示字號仍不得低於 `20 pt`。定稿中的名義 18 pt 與少量 script 欄位異常只作唯讀記錄，不得複製到新 draft。
- approved 必須綁定檔案路徑、頁數、bytes 與 SHA-256；任何檔案變更都使舊批准失效。
- 2026-09-02 逐頁 audit 已覆蓋 L1–L6 的線上／實體 12 份 finalized PPTX、777 張投影片。投影片主畫布為純白 `#FFFFFF`；暖白只在局部卡片、圖片框或插畫內容出現。封面沒有底部 subtitle；第 3 張目標頁是「標題＋青綠標籤＋課次專屬 3–4 項編號目標」，編號使用青綠、珊瑚、紫色、黃色的實心圓與白色數字。固定 header、頁碼、底線與主要內容槽位的 EMU 位置記在 `course/boya-online-layout-contract.json` 和 audit 報告中。

### 1. 投影片製作方式

- 線上課（含預習）維持原狀，今後仍以PPT／PPTX優先。只有實體課以HTML／OpenSlide優先，依 `docs/classroom-html-standard-2026-10-07.md`，需要時提供可編輯靜態PPTX備份。
- `native-pptx` 依本參考文件其餘規則製作與驗證。
- `open-slide` framework 位於 `tools/open-slide/`。將其輸出保存在該課 `10-design/open-slide-draft/`，實體課以HTML為預設，額外匯出依需要選擇。
- Open Slide 尚未接入本課 authority／QA／release 流程；其輸出只能是設計草稿。匯出的 PPTX 還須執行本參考文件的 PPTX 檢查，且不會因此取得批准。
- `native-pptx` 必須建立內部 JSON／CSV storyboard；它是內容與頁面生產的必要資料，但通常不需要交付給使用者，除非使用者要求。


### 4. 現行學生 PPTX 規則（2026-08-21；通用規則）

以下學生可讀性、頁碼、材料與 QA 原則適用於所有課次的新生成或經批准的修訂；第一課已批准 PPTX 的具體教材內容和人工修訂不因本節回改。涉及特定教材的句式、E 編號、姓氏或課本文字，必須回到對應 `lesson_key` 的專屬規則：

- 所有學生端 PPT（包括線上預習與實體課、第一課與後續課次）的投影畫面可見文字最低 20 pt；說明區、操作提示、活動說明與教材頁碼標記不得更小。speaker notes、教師手冊與活動卡不受此 PPT 字級限制。
- 使用已批准的教育教材式插畫 contact sheet：純白投影片畫布 `#FFFFFF`、灰藍細線、低飽和粉彩、清楚留白。暖白只可出現在局部卡片、圖片框或插畫內容中。不要換成企業發布會、產品宣傳或抽象難懂的視覺。
- 線上教材section divider沿用教材原名；實體課使用有意義的活動／段落標題，不強套教材線性欄目。
- 一頁承載一個連貫活動；保留清楚標題、必要指令和結果。同一活動的問題、準備、討論與發表可在可讀時合併，不按動作或題型強制拆頁。
- 聽力頁標題與指令應具體易懂，可使用「聽力練習」或情境任務標題；用符合程度的語言說明回答、理由與同伴追問，不禁止有意義的交際任務。
- 每張需要音檔的投影片在右上角只放不可點擊純文字 `Audio n-n`（例如 `Audio 7-1`）；沿用來源原有音軌對應，不按頁序重編或從練習標號猜測。PPT 不嵌入音檔、不放播放按鈕／喇叭圖示、不保留可播放音頻連結、媒體 action 或音頻 timing；標示不用紫色、色塊或按鈕外框。拉丁字母使用 Times New Roman，遵守該課有效字級下限並避開既有內容。PPT 外來源音檔保留，播放方式另在教師材料或內部音頻紀錄核實。預習音頻不放進無關課堂題目。每張需要活動材料的投影片直接寫出材料名稱。此規則依 Adam 2026-10-03 最新決定取代舊按鈕要求，歷史審閱紀錄不回改。
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

- 以下版式復用僅適用線上預習或明確指定的歷史PPTX維護；實體課依2026-10-07標準。《準中級加速篇 I》第一課的兩份 approved PPTX 是後續課次的版式參考。普通課次直接沿用封面、學習路線、單詞一頁、短文記錄、常用表達、句式練習、綜合表格、綜合問答、個人提綱和課末回顧等 layout family，只替換本課文字、頁碼、音檔和圖片。
- 第一課共用 divider 與公共插畫素材已批准；它們即使物理上保留在 `lessons/boya-quasi-intermediate-i/lesson-01/10-design/image-assets-draft/`，也按第一課批准素材使用。複製時須保留 asset manifest、來源、授權與 hash 記錄；不得因目錄名稱含 `draft` 而重新生成同用途 divider。
- 線上預習 PPT 同樣保留 section divider，直接沿用第一課批准的 divider 版式與共用素材（詞語、短文、常用表達、綜合練習）；不得因為是線上版而省略或另創 divider。
- 新課 draft 的詞語與常用表達例句必須先寫入 `course/boya-example-bank.json`；每個詞語與每個線上句式固定恰好兩條獨立、自然、可直接朗讀且不超過 24 個漢字的明確核准短句。不得從課文或長例句自動擷取，也不得用通用例句填空；資料庫缺例句時生成器停止。L1–L6 finalized 是唯讀參考，不追溯補例句。
- 短文、對話與文章類內容不在學生 PPT 中整段重排。線上使用「打開教材、讀／聽、找出並記錄」的短文記錄版式，實體使用聽力策略、問答、比較和口語發表版式；完整原文留在教材、canonical source、教師手冊或必要的學生閱讀材料。
- 線上綜合練習沿用第一課公共版式；實體課依當課TBL結果組織，保留必要指令，不強套固定三步或拆頁。

`scripts/build_lesson_01_pptx.js` 與 `scripts/build_lesson_01_pptx_native.js` 只屬於《中級衝刺篇 I》第一課的歷史生產流程，不是《準中級加速篇 I》的模板來源。《準中級加速篇 I》後續課次目前以 `scripts/build_l23_pptx_drafts.js` 產生 L2／L3 的 draft；該入口只能寫入對應課次的 `10-design/pptx-draft/`，並必須沿用第一課 approved layout family、共用 token 與共用素材，不得覆蓋 `20-approved/`。後續擴展生成器時，先抽出同一套共用元件，再接入各課 content contract 與 current storyboard。
