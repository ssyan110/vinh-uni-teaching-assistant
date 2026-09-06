# 教材製作需求規格

Workflow V2 canonical contract: `docs/workflow/canonical-workflow-contract.md`
Workflow V2 optimization roadmap: `docs/workflow/WORKFLOW_V2_OPTIMIZATION_SPEC.md`

本文件保留課程、教材與驗收要求；生命週期、gate、artifact state、lesson identity 與 agent safety 以 canonical workflow contract 為準，重複的通用 workflow 條文在 migration 期間只作相容參考。

版本：2026-08-29

本規格是榮市大學華語聽說課程的生產基準。它把課堂需求、ACTFL Proficiency-Based Instruction、學校翻轉預習習慣與 PPTX 交付要求放在同一份可檢查的文件中。

## 1. 課程與交付範圍

### 1.1 課程基線

- 學生已完成《博雅漢語聽說：初級起步篇》第一、二冊。
- 本學期教材已切換為《博雅漢語聽說：準中級加速篇 I》十二課；《中級衝刺篇 I》完整保留，規劃於三年級使用。
- 課程核心技能是 listening + speaking。
- 每節 50 分鐘；每次上課 4 節；每次上課 200 分鐘。
- 每一課的實體課時不預設固定值，必須依各冊教材的實際課數、各課內容量與正式課表分配；可跨次上課或在同次安排多課。
- 線上學習由學生自行安排，屬課外額外學習；各課核准的實體課時照常完成，線上時間不折抵、不替代、不縮減實體節數。排課先按教材與正式課表計算實體節數，再另列線上自學內容。
- 當前第一個生產單位是 `boya-quasi-intermediate-i:lesson-01`（〈丽丽是独生女〉）；其完成與否只以該 `lesson_key` 的最新 manifest／交付紀錄及 Adam 最新明確決定為準，本規格不重複硬編碼狀態。
- 逐課 authority／release 依序完成；若各課各自具備 `lesson_key`、來源包與線上／實體邊界確認，`10-design` draft 可以並行。新教材第一課完整 authority／release gate 未完成前，不得把後續課次宣稱為已批准或已交付。

### 1.1A 課次身份與教材範圍

- `lesson-01`、`lesson-02` 等課號只在單一本教材內有效，不能作為全域唯一 ID。
- 跨檔案、dashboard、QA、生成器與交付紀錄一律使用 `lesson_key`：`<textbook_id>:<lesson_id>`，必要時再帶 `offering_id`。
- `boya-quasi-intermediate-i:lesson-01` 是《準中級加速篇 I》第一課〈丽丽是独生女〉；`boya-intermediate-i:lesson-01` 是《中級衝刺篇 I》第一課〈中国人的姓名〉。兩者都正確存在，不能互相覆蓋或互相解鎖。
- 唯一的跨教材課次索引是 `course/lesson-registry.json`。`project.config.json.active_context.lesson_key` 決定目前生產上下文；狀態不得從裸課號或舊聊天記錄推定。

### 1.2 《中級衝刺篇 I》第一課的既有批准狀態

- 本節只適用於 `boya-intermediate-i:lesson-01`（2027-fall 規劃教材），不適用於目前的 `boya-quasi-intermediate-i:lesson-01`。
- 來源：已審核通過。
- 教學重組：已審核通過。
- 教材區段：63。
- 詞語記錄：34。
- 句式記錄：7。
- 課文／對話：5。
- 教材練習：35，全部必須保留並有 coverage record。
- 音檔：11 段。
- 教學時間：僅適用於 `boya-intermediate-i:lesson-01` 歷史批准課表的 6 節／300 分鐘；準中級與後續課次必須依 canonical source、內容量與正式課表核定。
- 教師手冊：已於 2026-08-20 由 Adam 審核通過。
- 學生配套：預習卡、活動卡、評量表與 Exit Ticket 已完成並批准；活動材料按活動分資料夾，每張可獨立發放的卡保留可編輯 DOCX，活動卡不生成或交付 PDF。
- 舊整學期主手冊與總覽不作為 2026-fall 或新教材的現行輸入；《中級衝刺篇 I》的 2027-fall 課程安排待完整理解教材後建立。

### 1.3 当前新教材状态

- 教材来源：`textbooks/boya-quasi-intermediate-i/source/`。
- 第一课来源包：`boya-quasi-intermediate-i:lesson-01` 对应的 `lessons/boya-quasi-intermediate-i/lesson-01/00-source/`。
- 12 個課次的 QR／音檔索引已盤點；每課必須另外記錄出版社或使用者補回來源、技術解碼、語義核對與 PowerPoint 實播狀態，不能把全書總數當成單課可播放或來源批准證據。
- 准中级第一课的 authority／release 决定以 `boya-quasi-intermediate-i:lesson-01` 为准；若 checkout 尚未有对应的 `20-approved/` 与 `40-release/`，不得把后续课次升格为 authority 或 release。只要后续课次各自已有来源包与边界确认，`10-design` draft 仍可并行制作。正式学期时数仍须依全书理解、来源批准与学校课表确认后定稿。

## 2. 課堂設計要求

### 2.1 翻轉預習

學生在課前：

- 快速讀指定教材頁面。
- 各聽指定音檔至少一次。
- 標記不懂處，而不是抄寫每一個詞。
- 準備個人資料、問題、調查或微研究結果。

線上預習由學生自行安排，屬實體課外的額外學習；不折抵、不替代或縮減該課已核准的實體課時。

教師在課堂：

- 先檢查預習證據，再直接進入聽說活動。
- 不把預習內容重新逐字講一遍。
- 對未預習學生提供 3–5 分鐘 recovery route，之後回到同一任務。

### 2.1A 已採用的線上／實體課程分流基線（Adam 確認，2026-08-31）

- 線上預習承擔教材閱讀、音檔預聽、詞語理解、短文重點記錄，以及課前個人資料／問題準備。
- 實體課承擔聽力理解、同伴問答、資訊差活動、口語練習、個人發表、回饋與重做。
- 線上學習是學生自行安排的課外額外準備，不設固定分鐘數、不要求計時或追蹤，不折抵、替代或縮減各課核准的實體課時。
- 線上約三分之二、實體約三分之一只是內容配置估計；實際分流依該課教材內容量調整，不是學習時數、頁數或驗收比例。
- 每一個 `lesson_key` 都必須保存自己的線上／實體 boundary confirmation record。此記錄只確認內容分工，不等於來源、PBI、教師手冊、PPT、播放、rehearsal 或 authority/release 批准。
- 每個課次的確認記錄由該課 content contract 連結到自己的 `10-design/storyboard/<lesson_id>-boundary-confirmation-YYYY-MM-DD.md`；不修改已批准 PPTX。

### 2.2 課堂時間原則

- 課堂主體必須是學生聽、說、問、答、協商、報告、重做。
- 課時計算先按實體節數排定；線上自學時間另列，不能用來抵銷實體課節數。
- 每節直接講解原則上不超過 5 分鐘。
- 詞語與句式採 just-in-time repair：只有當錯誤阻礙理解或任務完成時才處理。
- 不以逐字翻譯、單字講解或句式講義作為主要流程。
- 開放活動要有明確角色、時間、語言產出與回饋方式。

### 2.3 PBI 目標

每課至少要有：

1. Interpretive listening：理解主旨、細節、立場與證據。
2. Interpersonal speaking：提問、回答、追問、澄清、確認、協商。
3. Presentational speaking：成段說明、報告、提案或反思。

每個目標必須對應可觀察證據，例如答案與音檔依據、訪談紀錄、短講、角色扮演、報告或 exit ticket。

### 2.4 後續課次新增教材原則（2026-08-27）

以下規則按各教材自己的 `lesson_key` 套用於第一課之後的新課；同號但不同教材的第一課不互相取代，已批准 authority、PPTX、教師手冊與活動材料不回改：

- PPT 開頭（封面後）先放學生可見的學習流程圖，讓學生知道先學什麼、再做什麼。流程圖依該課已批准的教師手冊與 storyboard 編排，不套用固定順序；可用「詞語 → 討論活動 → ABC → XYZ」作為示例，實際步驟須寫成學生能直接看懂的學習順序。
- 每課 PPT 的詞語教學覆蓋 canonical source 的全部生詞，以及該課另外核准的補充生詞（如有）。一頁只放一個詞語，不把多個生詞合併。詞語頁必須有「詞語、拼音、詞類、越南文意思、圖片」；每個新課 draft 的每個詞語（含專有名詞）必須先在 `course/boya-example-bank.json` 登記恰好兩條獨立、自然、可直接朗讀且不超過 24 個漢字的例句。使用場合、用法、擴展、詳細語法與常用短語仍由該課 content contract 按詞語決定，可留空，不得為了填滿版面而統一生成。意思欄不得使用英文、canonical `gloss` 或中文 fallback；不得從課文或長例句自動擷取。圖片須服務詞義、使用場合或記憶，來源與授權狀態記入內部素材清單。
- 後續課次 PPT 投影畫面可見文字的硬性下限為 `20 pt`，尤其是說明區、操作提示與活動說明；需要時再提高標題與正文大小。speaker notes、教師手冊與活動卡不在這項 PPT 字級限制內；投影畫面可見的教材頁碼標記也不得低於 `20 pt`。
- 聽力教學固定納入 Adam 的操作方式：先看題目、抓關鍵字，再聽並記重點，最後回答與核對。這是課堂教學方法，不另行指定或推定某一種考試。
- 每課另行規劃線上課程材料。線上約占三分之二、實體約占三分之一，這只是內容安排的規劃估計，不是學生學習時數比例；線上不設固定分鐘數、不要求計時或追蹤，也不折抵或替代各課核准的實體課時。教材長課文與對話仍以 canonical source／教材原頁為準，但學生 PPT 不直接貼上整段原文；線上以「打開教材 Pxx 閱讀／聽取」加短文重點記錄版式完成預習，實體以聽力、問答、比較和口語發表版式使用這些信息。完整原文保留在教材、canonical source、教師手冊或必要的學生閱讀材料中；線上內容必須先準備好實體課活動所需的語言。
- 實體課以口語實作為主。口語活動由每課另行指定，不自動推定為線上內容；較難的口語活動須在課前提供準備，讓學生帶著可用的語言進入課堂。
- 每課開始製作任何 PPT 前，必須先由 Adam 與 AI 共同討論並確認哪些內容放在線上課程 PPT、哪些內容放在實體課程 PPT；確認記錄完成前，不得建立該課 PPT storyboard 或開始 PPT 生產。

## 3. PPTX-only 生產要求

### 3.1 明確不使用

- HTML source deck
- HTML presenter
- HTML animation
- HTML 作為 PPTX 必經中間格式

過往已產生的學期計畫 HTML、來源審核 HTML 與教學重組 HTML 是 review／legacy artifacts，不是未來課堂教材生產規格。

### 3.1A 權威檔案架構

本專案採「單一權威來源 → 只讀 QA → 不可變交付包」：

```text
course/
├── course-manifest.json
└── offerings/<offering_id>/offering.json

textbooks/<textbook_id>/
├── textbook.json
└── source/
    ├── raw/
    ├── qr/captures/
    ├── qr/detection/
    ├── audio/lesson-XX/
    └── source-inventory.json

lessons/<textbook_id>/lesson-XX/
├── 00-source/source-manifest.json
├── 10-design/
│   ├── teaching-design/
│   ├── storyboard/
│   ├── visual-storyboard/
│   └── visual-prototype/
├── 20-approved/
│   ├── lesson-manifest.json
│   ├── teacher-manual/
│   ├── pptx/
│   └── activities/
├── 30-qa/
│   ├── current/
│   └── archive/
├── 40-release/
│   ├── <release-id>/
│   ├── <release-id>.zip
│   └── latest-release.json
└── 90-archive/                    # 本課歷史審核／版本證據

archive/
└── legacy-materials-2026-08-27/   # 整理前 output 的歷史快照，只讀
```

`20-approved/` 是唯一權威版本；`40-release/` 只能從它複製。每課只有一份 `lesson-manifest.json`，記錄權威檔案、版本、SHA-256、審核、QA 與交付位置。歷史材料統一保存在 `archive/`，不得再作為生成器輸入或手動交付來源。

根目錄 `archive/` 保存跨課程的舊輸出快照；各課的 `90-archive/` 保存該課歷史
審核與版本證據。兩者都不是 authority，也不作新的生成輸入。

舊《中級衝刺篇 I》第一課曾使用的完整教學資料來源是：
`archive/legacy-materials-2026-08-27/boya-intermediate/lesson-01/share/第一课-教学资料`。
這是 `boya-intermediate-i:lesson-01` 的歷史證據快照，只讀且已由該課 `20-approved/` 取代；遷移、生成與打包流程不得把它當作 `boya-quasi-intermediate-i` 的教材來源。

### 3.1A 課次索引與路徑驗證

- 建立或更新 dashboard 前，必須先執行 `python3 scripts/validate_lesson_identity.py`。
- 產生器必須先由 `lesson_key` 解析教材與課次，再組合 `lessons/<textbook_id>/<lesson_id>/`；不得以 `lesson_id` 單獨尋找資料夾。
- registry 允許不同教材擁有相同 `lesson_number`，但 `lesson_key`、教材來源、音檔根目錄、authority 與 release 路徑必須各自唯一。

### 3.1B 統一提交檔案命名規則（2026-08-29）

- 所有面向 Adam 的課次交付檔案（PPTX、DOCX、PDF、音檔、CSV、ZIP）統一採用 `lesson-<nn>-<用途>.<副檔名>`；課次號固定兩位數，分隔符只用半形 `-`，副檔名使用小寫。
- 每課兩份課堂 PPTX 固定命名為 `lesson-01-在线预习.pptx` 與 `lesson-01-实体课.pptx`；後續課次只替換 `lesson-<nn>`。
- 其他交付檔案也沿用同一前綴，例如 `lesson-01-教师手册.docx`、`lesson-01-预习卡.docx`、`lesson-01-活动01-姓名访谈-教师速用说明.docx`、`lesson-01-在线预习-预览.pdf`、`lesson-01-音频-1-1.mp3` 與 `lesson-01-教材包.zip`。
- 交付檔名不得使用 `第一課`／`第一课`、`online`／`face-to-face`、空格、底線、日期或重複的 `final`。版本、SHA-256 與審核狀態放在 manifest、QA 與 release 紀錄；內部 draft 如需區分版本可暫用 `-draft-vNN`，提交前改回 canonical 名稱。
- `lesson-manifest.json`、`latest-release.json` 等 schema 固定檔名、出版社原始檔名、第三方來源檔名與歷史 archive 檔名保留原名。既有 approved／release 不追溯改名；會改變 authority 路徑或 hash 的改名，必須先取得 Adam 明確批准。

### 3.2 PPTX 必須具備

- 原生可編輯文字、表格、形狀與版面。
- 16:9 投影比例。
- 靜態投影片；除非另有要求，不使用動畫。
- 全中文學生操作指示；目標內容原則上維持教材簡體字。
- 榮市大學硬性規則：課堂與學生端教材的結構、操作指示、目標、題目與回饋全部使用簡體中文；線上預習詞語頁的「意思」欄是已審核的越南文詞彙，這是唯一明確的學生端越南文內容例外。實體課 PPT、預習卡與補充活動卡不放越南文。任何學生端都不使用英文詞義 fallback。
- 簡體中文目標內容；必要時附拼音。
- 教師手冊與教師審閱文件統一使用簡體中文；線上詞語意思欄所需的越南文詞彙另依 content contract 管理，不把越南文擴散到其他學生端欄位。
- 教師手冊與活動速用說明明確記錄活動目標、分組方式、時間、步驟與產出；學生 PPT 只顯示當下動作、必要材料與期待產出，不顯示時間／分組 footer。
- 音檔嵌入或在交付前以實際 PowerPoint 測試過的可用連結。
- 教師提示放在 speaker notes；不要把備課資料塞進學生主畫面。

- 線上預習 draft 必須讀取 `course/boya-online-content-contract.json` 與 `course/boya-example-bank.json`。每個詞語的 `meaning_vi` 必須標記 `meaning_vi_status=reviewed`，且每個詞語必須有例句資料庫提供的恰好兩條短句；使用場合若提供，必須是逐詞核准內容，沒有內容時可以留空並省略標籤；`extension`、`grammar_detail`、`common_phrase` 仍只在明確提供且非空時輸出。缺任何必要內容時，生成器必須在寫檔前停止，不得以詞性推測、英文 gloss、中文解釋、通用例句或統一「擴展：」補位。L1–L6 finalized 不追溯修改。

《準中級加速篇 I》L1–L6 的兩種 finalized PPTX 是鎖定的唯讀參考：只複用經逐頁審核的版式、位置、字級、字體、共用素材與結構，不整份複製其中的內容錯誤。線上詞語頁的越南文意思是有意的定稿規則；英文詞義、重複詞、錯誤標點與歷史空白頁不得成為新課 fallback。新 draft 必須回到自己的 content contract。

### 3.2A 全課次教材頁碼標記

- 所有課次的學生端 PPTX，只要投影片使用、要求閱讀、聽取、完成或討論課本教材內容，就必須在右下角放置小型、低干擾的教材印刷頁碼標記，例如 `教材 P3`、`教材 P6–7`。適用範圍包括聽力練習、課文／對話、教材題目、詞語／句式練習、文化知識、拓展練習與由教材內容延伸的任務。
- 頁碼必須從該課 canonical source 的 `textbook_printed_page(s)` 與 current storyboard 的 `source_refs` 推導；使用教材印刷頁碼，不使用 PDF 內部頁碼；跨頁內容顯示連續頁碼範圍。
- 完全沒有使用課本內容的封面、section divider、純課堂流程頁或純回顧頁可以不標記；只要頁面含有任何課本內容，就必須標記。頁碼是學生查找教材的操作輔助，允許且要求在學生畫面可見，不屬於教師／製作 metadata。
- 每課 draft PPTX 完成後，先執行 `scripts/add_textbook_page_markers.py`，再執行 `scripts/verify_textbook_page_markers.py --pdf <preview.pdf>`。兩個工具的 `--storyboard` 必須是逐張投影片的 source-to-slide mapping（含 `slide_no`／`slide_number`／`slide` 與 `source_refs` 或 `source_ref`）；候選頁區塊的 source-refs CSV 不能直接當作 storyboard。QA 必須核對標記數量與文字、右下角 16:9 邊界、與既有內容無重疊，並在 PDF 預覽中確認可見。

### 3.2B 全專案輸出字體

- 所有文字輸出與交付物中，中文漢字統一使用標準通用 `KaiTi`（楷體）；越南文與其他拉丁字母文字統一使用 `Times New Roman`。範圍包括 draft、preview、QA、legacy mirror、20-approved、40-release、PDF、HTML、DOCX、PPTX 與其他文字輸出。
- DOCX 必須將中文 east Asia 字體設為 `KaiTi`，拉丁字母與越南文設為 `Times New Roman`；PPTX 必須將中文 East Asian/script 字體設為 `KaiTi`，拉丁字母與 `Viet` script 設為 `Times New Roman`。
- 只使用收件人電腦預設可用的系統字體；不使用自訂、只在製作者電腦存在或需要另行安裝的字體，也不依賴外部字體檔。交付前要在可用的 Office／PDF 預覽中檢查字體名稱、文字完整性與亂碼風險。
- 字體修訂只改字體設定，不得改動已批准的教材文字、題目、音檔、頁碼標記或版面內容；權威檔案變更後必須同步更新 release 與 manifest hash。
- `archive/` 中的歷史檔案即使可以重新產生，也不得視為最新 authority/release；新的輸出只能進入對應課次的 `10-design/` draft、`20-approved/` 或 `40-release/` 邊界。

### 3.3 PPT storyboard

Storyboard 是內部必要資料，不需要另外製作 HTML。完整 authority storyboard 必須以教師手冊與學生配套材料為內容來源，不能由投影片反推本課內容；但後續課次在來源包與線上／實體邊界已確認後，可以先建立並驗證 `10-design` draft storyboard，後續再補齊教師手冊、配套與 authority gate。每張投影片至少記錄：

- slide number
- 服務的節次與分鐘
- PBI mode
- 教材 exercise／section ID 與 `source_refs`
- 線上課程 PPT／實體課程 PPT 的內容邊界（須有 Adam 與 AI 的確認記錄）
- 音檔 track
- 學生指示
- 分組方式
- 學生產出
- 教師提示／speaker note
- 是否是核心、輪站、預習回收、評量或延伸

### 3.4 Visual storyboard 與簡報視覺標準

教師手冊先決定本課要教什麼、怎麼教、學生要完成什麼；PPT storyboard 依批准的教師手冊與學生配套材料安排投影片流程。Visual storyboard 是 PPTX 生產前的必要設計 gate。沒有完成教師手冊、配套材料與 Visual storyboard，不得大量製作完整 PPTX。Visual storyboard 通過後，必須先做 6 張視覺 prototype，完成方向審核後才展開完整 deck。

- 視覺方向：已批准的教育教材式插畫；投影片主畫布固定使用純白 `#FFFFFF`，搭配灰藍細線、低飽和粉彩、留白充足、版面有節奏。暖白只用於局部卡片、圖片框或插畫內容，不得作為整張投影片背景。專業感來自教材清晰度與版面品質，不另換成產品發表會／大型企業簡報風格。
- `docs/ppt-reference/finalized-l01-l06/finalized-ppt-reference-manifest.json` 所登記的 L1–L6 finalized PPTX 是共用視覺行為的唯讀參考；頁數由每課內容決定，不把任何一課的 slide count 固定套用到後續課次。
- 2026-09-02 定稿逐頁審核已覆蓋 L1–L6 的線上／實體共 12 份 PPTX、777 張投影片；封面固定沒有底部 subtitle。第 3 張學習目標固定使用「標題＋青綠標籤＋課次專屬 3–4 項編號目標」的外框；四個編號使用依序青綠、珊瑚、紫色、黃色填色的實心圓，圓內數字為白色，不使用白色方框。不能把另一課的目標或主角套入新課。學習流程圖、section 名稱與短文記錄欄位可按課次變體，但必須由課次內容契約明確指定。
- 定稿角色字級不是單一全域字號：頁眉／頁碼／教材頁碼／材料標籤／關鍵詞 20 pt，拼音 24 pt，一般正文基準 22 pt，普通頁標題 34 pt，divider 48 pt，封面主標題 44–50 pt，目標標題 36 pt、標籤 23 pt、編號 20 pt、目標正文 24 pt，詞語詞頭 42 pt、長詞 34 pt、詞類約 20–22 pt、越南文意思約 20–22 pt、使用場合 20 pt、詞語例句 22 pt、線上句式練習例句 35 pt。所有可見文字不得低於 20 pt；字放不下時縮短、調整版面或拆頁。
- 每張投影片只服務一個課堂動作；學生在 3 秒內看得出現在要做什麼。
- 每張投影片必須有主視覺：照片、原創插圖、字形構圖、聲波、流程圖、資料圖或角色卡，不要求每頁都使用新照片。
- 大標保持簡短；活動指示最多兩行；步驟最多三個短句。同一音檔、同一題型的連續題目在一頁仍清楚時合併；填空、判斷、聽後回答、討論、活動準備與發表等不同動作分頁。
- 聽力頁統一使用「聽力練習」，並直接寫「聽、寫關鍵詞、回答」或「完成問題1到3」；不用「說依據」「追問同伴」等抽象學生標籤。
- 需要音檔的每張投影片都要有清楚的音頻按鈕與教材編號；預習音頻不放入無關的課堂題目。
- 需要額外材料的投影片直接寫材料名稱；學生不需要猜卡片位置，活動卡本身承擔完整規則，投影片只保留當下動作與產出。
- 圖片與形狀全部留在 16:9 畫布內；以 PowerPoint PDF、完整 contact sheet、文字檢查與邊界檢查共同驗證。
- 教師時間、分組、答案政策、內部來源追蹤與修補提示只放 speaker notes 或教師手冊；符合 3.2A 的教材印刷頁碼標記是學生可見的查找輔助，必須保留在投影片右下角。
- finalized L1–L6 的 PPT 字級基線按文字角色執行：頁眉、投影片編號、教材頁碼、音頻按鈕文字、材料小標與關鍵詞 `20 pt`；緊湊正文 `21 pt`；一般正文與詞語例句以 `22 pt` 為基準，依欄寬可放大至 `25–28 pt`；線上句式練習例句固定 `35 pt`；副標／拼音 `24 pt`；一般頁標題 `34 pt`，標題過長時 `27 pt`；任務題目與主要操作提示 `28–34 pt`，預設 `34 pt`；section divider `48 pt`；封面主標題 `44–50 pt`；目標頁標題 `36 pt`、標籤 `23 pt`、目標正文 `24 pt`；詞語頁詞頭 `42 pt`，過長詞語可用 `34 pt`，詞類約 `20–22 pt`、越南文意思約 `20–22 pt`、使用場合 `20 pt`。這些是 finalized 的角色基線，不是把所有文字設成同一個大小。
- `fit`／`shrink`／`normAutofit` 可以使用，但 QA 必須檢查顯式與繼承的 `a:rPr`／`a:defRPr` 字號及 `fontScale`，確認縮放後的有效顯示字號仍不低於 `20 pt`。定稿中少量名義 18 pt 與 script 欄位異常只作唯讀審查記錄，不得複製到新 draft。
- 如文字在上述角色基線下放不下，必須先縮短文字、調整版面或拆頁；不得用 `fit/shrink` 把投影畫面文字壓到 `20 pt` 以下。
- 後續課次 PPT 投影畫面可見文字的硬性下限為 20 pt，說明區、操作提示、活動說明與其他學生可見文字不得小於此下限；speaker notes 不在此限制內。
- 圖片必須支援情境、理解、比較、證據或記憶；禁止未確認授權的網路圖片與無意義裝飾圖。
- canonical source／content contract 指定的圖片若缺失或待審核，不得以無關圖片、泛用圖示或其他課次素材替代；保留 `pending_assets`、指向教材原頁，並在 manifest／QA 留下 blocker。
- 素材清單必須記錄素材 ID、用途、來源／製作方式、授權狀態與使用投影片。
- 學生畫面只寫學生現在要做的事情；不得出現「能力目標」「聽力策略」「句式情境」「資訊站」「視覺樣稿」等教師／製作分類。
- 學生畫面用初級到中級常用詞，優先使用可直接執行的動作；抽象或較難詞語只有在它是本課學習目標時才保留。
- speaker notes 可以保留教師提示，但只能存在 PPTX 備註區或教師手冊，不能在投影畫面可見。

### 3.4A 全專案統一 PPTX 視覺母版（2026-08-24）

- 後續所有課次 PPTX、文化補充 PPTX 與其他課堂補充投影片，統一沿用第一課最終批准版的視覺母版；不得每課重新設計一套新的整體風格。
- 母版固定使用第一課最終版的純白 `#FFFFFF` 投影片背景、KaiTi 字體、頁眉與頁碼、紫色短線、低飽和薄荷／黃色／淡紫／珊瑚色區塊、細灰藍線稿與白色插畫卡框；暖白只保留給局部卡片或插畫內容。只更換該課的文字、課堂內容與圖片內容。
- 版面可以依學生動作使用母版中已有的分隔頁、圖片加文字、卡片、流程、閱讀與回顧版式；不得因此新增另一套色彩、字體、圖片框或卡片語言。若需要重大視覺變更，必須先取得 Adam 的明確批准。
- 共用母版元件與 token 位於 `scripts/lesson_pptx_master_template.js`；header 必須透過 lesson context 傳入，不得把任何一本教材或某一課的標題硬編碼成所有課次的 header。後續生成器應優先引用共用元件，不得在單課生成器內私自複製或改造整體視覺規則。
- 新生成圖片必須遵守第一課最終版的教材式插畫方向，圖片本身不放可讀文字；中文文字由 PPT 原生文字添加，圖片需內嵌到 PPTX 並在素材清單記錄生成方式與使用位置。

### 3.4A-1 第一課版式復用與短句規則（2026-08-29）

- 《準中級加速篇 I》第一課的兩份 approved PPTX 是後續課次的版式參考。後續課次直接沿用已核准的版式家族：封面、學習路線、單詞一頁、短文記錄、常用表達、句式練習、綜合表格、綜合問答、個人提綱與課末回顧；只替換本課文字、教材頁碼、音檔與課次圖片，不另起一套投影片風格。
- 可跨課次使用的 divider 與公共插畫直接複製第一課已批准素材，尤其是 `divider-comprehensive.png`、`symbolic-listening.png`、`symbolic-sentence-pattern.png`、`oral-practice-divider.png`、`divider-family.png`、`divider-work.png`、`divider-hobby.png` 與 `speaking-practice.png`；同一用途不重新生成另一張 divider。
- 線上預習 PPT 同樣保留 section divider，直接沿用第一課批准的 divider 版式與共用素材（詞語、短文、常用表達、綜合練習）；不得因為是線上版而省略或另創 divider。
- 新課 draft 詞語頁的「例句」必須先寫入 `course/boya-example-bank.json`，每個詞語（含專有名詞）恰好兩條；每條必須獨立、自然、可直接朗讀且不超過 24 個漢字。生成器不得從課文或長例句自動擷取整段，也不得用通用 filler；例句資料庫缺資料時先回到內容規格補齊，不能以長句或整段教材代替。L1–L6 finalized 不追溯修改。
- 短文、對話與文章類內容不在學生 PPT 中整段重排。線上用「打開教材、讀／聽、找出並記錄」的短文記錄版式；實體用同一記錄、聽力策略、比較和發表版式。完整原文保留在教材、canonical source、教師手冊或必要的學生閱讀材料中。
- 綜合練習直接套用第一課的綜合 divider 與公共版式：整理信息、根據課本回答、個人信息／口語提綱。生成器必須以共用版式元件輸出，不能因換課而把整段教材要求塞進單張投影片。

### 3.4B 學生端關鍵詞字號（2026-08-24）

- 學生投影片中以獨立短詞、關鍵詞列或彩色卡片呈現的教學關鍵詞，統一使用 `20 pt`；標題、一般正文、教材頁碼、材料標籤與活動名稱不套用此規則。
- 第一課目前核對的同類關鍵詞包括「健康、勇敢、平安、好寫、好記、意思好、意思、來歷、讀音、發音、頭等大事、別扭、糟、低調、操心、啼笑皆非、少見、尊稱、稱呼、交往」；後續課次遇到相同版式的關鍵詞，直接沿用 `20 pt`。
- 字號修訂只改變文字大小，不改動教材文字、位置、顏色、頁碼、圖片、音檔或其他版面內容；若關鍵詞過長，先調整卡片寬度或版面，仍以 `20 pt` 為準。
- 共享版式的關鍵詞元件與生成器預設值必須同步使用此規則；PowerPoint 人工修訂則另存至 `10-design/` draft，經明確批准後才更新 authority。

### 3.5 專業輸出標準

- 教師手冊、學生材料、PPTX 與交付說明均採正式、自然、可直接使用的文件語氣。
- 成品直接呈現課程內容、活動流程、學生指示、評量標準與必要的文件資訊，不加入 AI 自我說明、生成過程、工具名稱或 workflow 解釋。
- 不使用「這不是……」「本文件不是……」等模板式否定開場，也不把內部審核、製作或 QA 備註放入面向教師或學生的交付物。
- 版本、日期、作者、審核狀態可保留在標準文件資訊欄；來源、授權、QA 與未決事項另存於內部紀錄。

### 3.6 當前 PPT 版本控制

- 每課只保留一份 current outline、current visual storyboard，以及每種課堂模式各一份 current PPTX（online、face-to-face）；已被取代的版本不放在 `10-design` 的 current draft 區，避免未來生成時誤讀。
- 舊教材 `boya-intermediate-i:lesson-01` 的 current 檔案位於 `lessons/boya-intermediate-i/lesson-01/10-design/`、`20-approved/` 與 `30-qa/`；這些檔案不代表準中級第一課，也不能作為新教材輸入。
- 舊教材第一課的生產入口是 `scripts/build_lesson_01_pptx.js`，實作是 `scripts/build_lesson_01_pptx_native.js`。舊版 v2 生成器、舊 69 頁 storyboard 與舊 visual storyboard 已退休，不得重新啟用；任何新教材生成器必須先以 `lesson_key` 選定教材。
- current storyboard 必須讓教師先看到「教材內容」和「學生要做什麼」，核對編號只能放在最後欄；不能要求教師先解碼 E01-xxx。

### 3.7 教材製作 dashboard

- dashboard 是內部製作進度與 gate 控制頁，必須顯示目前 active lesson、每個 gate 的狀態、證據檔案、下一個動作與鎖定課次。
- dashboard 必須清楚區分「已完成」「待審核」「製作中」「尚未開始」與「鎖定」，不得把教師手冊完成誤寫成整課 PPT 已完成。
- 每一本教材的 authority／release 只在自己的 `textbook_id` 範圍內依序解鎖；若課次各自具備來源包與邊界確認，dashboard 必須另顯示 `draft_available`，不能把可開始 draft 的課次誤標為完全 locked。例如準中級第 2 課不因中級第 1 課完成而解鎖，也不因中級第 2 課存在而改用中級來源。
- dashboard 顯示的課次、權威檔案連結、QA 狀態和 release 位置必須由 `course/lesson-registry.json` 與 active `lesson_key` 對應的 manifest 產生，不得手動寫死另一教材的路徑。

### 3.8 生成器與交付規則

- 生成器只寫入 `10-design/` 的 draft 位置；不得覆蓋 `20-approved/`。
- 所有生成器在寫入前必須通過 `python3 scripts/production_gate.py`。後續課次 PPTX draft 使用 lesson-specific `--stage draft --lesson-key` gate，只檢查該課身份、來源包、邊界確認與輸出邊界，不授予 authority；完整 PPTX、authority 與 release 才檢查教師手冊、配套、Visual storyboard、prototype、音檔實播與 rehearsal。gate 失敗時不得建立任何 draft 檔案。
- storyboard、visual alignment 與 rehearsal 的狀態只能在實際人工審核／演練後，透過 `scripts/record_lesson_gate.py` 搭配完整 `--lesson-key`、同課次 evidence 和 `--confirm` 登記；不能為了讓生成器繼續而手動填寫批准狀態。
- PowerPoint 中的人工修訂不能被生成器或 package builder 自動覆蓋。新的人工修訂必須另存 draft，經 Adam 明確批准後才更新 authority。
- package builder 只讀 `20-approved/`，只把檔案複製到 `40-release/` 和 ZIP，不在 release 目錄重新生成教材文件。
- 活動卡只保留可編輯 DOCX，並按活動分資料夾；不把活動卡 PDF 交付或放入 release。`10-design` 可以產生內部列印／版面 QA preview PDF，不建立「可编辑原稿」中間層。
- `30-qa/current/` 只保存 QA 證據，不作為任何生成器的輸出位置；release gate 必須同時看到 current QA 通過、PowerPoint 音頻實測通過與該課核准實體課時的教師 rehearsal 通過。
- 文字完成後以自然中文編輯標準複查，刪除空泛結論、過度排比、誇張宣傳與重複解釋。
- 教師手冊的內容架構參考[《當代中文課程 1 教師手冊（二版）》](https://online.fliphtml5.com/ylaaj/nzhe/#p=48)：每課依序呈現教學目標、教學重點、暖身／預習回收、詞語與句式提示、課時教學範本、教材練習解答、文化補充與課後預習；本專案的 PBI 任務、聽說證據與該課 canonical source／content contract 登記的全部練習 coverage 必須整合在這個架構中。

### 3.8 PBI 句式與活動卡規格

- 句式不是獨立的講解單元，而是學生完成溝通目標時可選用的語言工具。教師手冊與教學設計每個句式仍要有「教材情境／要解決的問題／學生要完成的口語結果／聽者如何確認」四項內容。
- 線上學生句式練習頁不顯示情境，也不顯示頁眉下方的黑色句式標題；只保留紫色圓角句型框及其中的句式文字，並放兩條獨立短例句。例句固定 `35 pt`；教師手冊可以用一句話說明形式和語氣，但不把長篇定義、例句抄寫和替換操練作為主要課堂流程。
- `总不能……吧` 的可教學解釋是：「遇到一個不合理或不能接受的做法時，說出一個無論如何不能發生的結果。」其中「總」表示不管怎樣，「不能」表示底線，「吧」是在請對方同意這個底線。教材中的看牙、接孩子情境是核心示例。
- 其餘句式同樣以用途設計：`……才怪呢` 表達對結果的強烈判斷；`到时候` 提醒或說明將來某個時間；`话说回来` 先承認一面，再補充真正想說的另一面；`不然` 說明不採取做法的結果；`是……还是……` 清楚提出二選一；`怎么……怎么……` 表示不管怎麼做，結果都一樣。每個任務仍須回到教材情境和原題目。
- 活動卡不使用只有教師看得懂的名稱或欄位。每張卡要有簡短的使用方法、學生當下的動作和完成證據。活動卡直接提供要問的問題，不留開放的「我想问同伴」空格；預習卡若需要準備問題，改成「上课问同学（选一个）」並提供可直接使用的問題句。
- `姓氏信息站` 分成可獨立使用的目標：句式任務、文化比較、課文重點記錄、姓氏讀法互聽和對話總結。句式卡只練 E01-027；文化卡只練 E01-028；課文重點記錄卡只支援 E01-029；讀法卡只支援 E01-032；對話總結卡只支援 E01-033。E01-031 歷史人物介紹放在 `活动五《调查与研究》`，不得和讀法卡混在一起。
- 第 33 頁的姓名分類必須直接使用教材列出的 15 個姓名和三個分類名稱，學生把姓名填入課本表格；不得用自造調查表取代課本練習。第 57 頁的歷史人物活動保持獨立。
- 第 58 頁保留教材 section 名稱「读一读，说一说」，但把單純朗讀改為互聽任務：每個學生讀五個課本姓氏，同學寫下聽到的五個姓，再回答是否認識有這些姓的人。
- E01-027 的句式卡不能使用「同學說出聽到的結果或選擇」這種總稱；卡片要分別寫明：`不然` 回答「如果不這樣做，會怎麼樣？」；`是……還是……` 直接選一個；`怎麼……怎麼……` 說出「哪一種做法，結果都一樣」。
- E01-029 只使用一張「課文重點記錄卡」：學生兩人一組閱讀課本「文化知識」短文《中國人的姓名》（課本第 14–15 頁），先各自寫下一個重點，再輪流說給同伴聽，由同伴記錄「我聽到的重點」。
- 第 59 頁依第 26–27 頁的節奏安排：先兩人共同用五句話總結對話，再增加一頁讓小組報告；課末回顧順延，不把總結和報告塞在同一頁。
- 目前 PPTX 若已有教師在 PowerPoint 中手動修改，PPTX 是目前頁面內容的優先來源。生成器、outline、舊 QA 必須先與目前 PPTX 做差異核對，禁止直接整份重建覆蓋教師修訂。
- 句式頁紫色句型框在版面允許時保持一行，不為套用模板而人為斷行；若一行放不下，先調整框寬、版面或字級。
- 句式練習下方的學生指示由課次／項目內容契約提供直接動作；定稿常見形式是「用这个句式写出三句话」「用这个词写出三句话」或「用这个短语写出三句话」，不得把「完成教材中的练习。」硬套在所有項目上，也不得生成沒有來源的練習名稱。
- 若 Adam 已手動修訂 PPTX 並明確要求不要再改 PPT，該 PPTX 與系主任分享包內的 PPTX 都鎖定；不得執行會重建、覆蓋或重新複製 PPTX 的生成與打包動作，除非取得新的明確批准。

## 4. 完整教材包

### 4.1 教師手冊（先完成並批准）

教師手冊是本課的內容與教學流程母版，不是 PPT 完成後才補寫的附錄。至少包括：

- 課程／課次／節次目標。
- 本課主題、Can-Do、最終任務與學生最後要交出的證據。
- 每分鐘流程與轉場。
- 教材頁碼、PDF 頁碼與音檔。
- 該課 canonical source／content contract 的全部教材區段、練習與補充活動 coverage 對應；不得套用其他課次的固定總數。
- 課前預習要求與未預習 recovery route。
- 分組方式、角色與活動規則。
- 每個活動的教師準備、學生指示、時間、產出與成功條件。
- 教師要觀察的表現證據。
- 可能的理解問題與 just-in-time repair。
- 開放題的答案政策；不能把教師示例寫成教材標準答案。
- 回饋與重做步驟。
- 課堂評量與 exit ticket。
- 備課材料清單、音檔播放點、轉場話術與課堂備案。

完整學生材料與 authority PPT 必須依批准的教師手冊製作；PPT 不得反過來決定本課應教什麼。後續課次在來源包與線上／實體邊界確認後，可以先產生 `10-design` draft，教師手冊與配套仍是升級為 authority／release 的必要 gate。

### 4.2 學生預習卡

每課至少需要：

- 指定閱讀頁面。
- 指定音檔。
- 低負擔預習任務。
- 學生要帶到課堂的證據。
- 一個個人問題或可使用的語言。

預習卡數量依該課內容量、課堂分流與學生負擔決定；不得把第一課的卡片數量套用到其他課次。

### 4.3 補充活動材料

依課程需要製作可列印配套，包括：

- 訪談卡與資訊差卡。
- 角色卡與客戶需求卡。
- 小組任務卡與輪站卡。
- 調查表、研究卡與報告模板。
- 同儕回饋表、表現 rubric、exit ticket。

補充材料應放大學生使用語言的機會，不能只是增加講義或詞語翻譯。

可單獨發給學生使用的角色卡、客戶卡、資訊差卡與任務卡，必須一張卡獨占一頁；不得把多張可獨立使用的卡片放在同一頁，也不得依賴教師手動裁切。

活動材料採「一個活動一個資料夾」的交付結構。每個活動資料夾必須包含一份教師速用說明，以及每張可獨立使用的角色卡、客戶卡、資訊差卡、任務卡或表格的可編輯 DOCX；目前不生成或交付活動卡 PDF。不同活動不得合併成同一份課堂發放檔；課程根目錄另提供 Word 格式的活動材料索引，方便教師按節次找到資料。

活動材料依「學生實際使用的動作」拆分，而不是為每個小步驟都新增檔案。完成檢查、重做記錄或回饋欄位若與主要任務在同一流程中完成，應直接併入主要任務卡；只有在需要獨立發放、輪換、回收或由不同角色使用時，才建立獨立材料。

同一角色使用的問題、提示、记录表、客户卡或呈现表直接合并到该角色的 Word 文件。活动 Word 文件直接放在对应活动资料夹中，不建立「可编辑原稿」中间层。

### 4.4 核心課堂檔（依教師手冊後製作）

`lessons/<textbook_id>/lesson-<nn>/20-approved/pptx/<lesson>.pptx`

它是主要課堂媒體，必須能支援該課核准的完整實體課時，不是只做一節示範課；投影片內容、活動順序與教師提示都必須能回溯到已批准的教師手冊。

## 5. 來源資料與內容忠實度

### 5.1 当前第一课 canonical source

```text
lessons/boya-quasi-intermediate-i/lesson-01/00-source/canonical-source.json
textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf
textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I-听力文本及参考答案.pdf
textbooks/boya-quasi-intermediate-i/source/audio/lesson-01/
```

### 5.2 不可違反

- 不能以 OCR 草稿或舊 JSON 取代已核對的 structured source。
- 不能更換教材詞語順序而沒有教學設計理由與記錄。
- 不能漏掉教材活動。
- 不能為沒有答案的題目編造唯一答案。
- 學生投影片使用簡體字，不把教師審閱內容直接複製到學生 deck。
- 教師手冊、教師審閱文件、學生投影片與學生配套均使用簡體中文；越南文只在必要時單獨提供解釋。
- 所有音檔 track 都要可追溯到來源活動。

## 6. 生產 workflow 與 gate

### Phase 1：來源

1. PDF／音檔／QR／索引盤點。
2. OCR 與人工來源核對。
3. 形成結構化 source package。
4. 來源審核與批准。

### Phase 2：教學設計

5. 建立 Can-Do 與最終任務。
6. 依該冊教材的實際課數、各課內容量與正式課表分配實體課時；不預設每課固定 6 節。
7. 把該課 canonical source／content contract 登記的全部練習與所有活動放入 coverage matrix。
8. 加入課前預習、group activities、supplemental activities、回饋與重做。
9. 教學重組審核與批准。

### Phase 3：教師手冊、配套與 PPT

10. 先完成教師手冊內容母版：所有課堂內容、重點、時間、音檔、教材練習、活動、教師提示、修補、答案政策與評量都要寫清楚。
11. 教師手冊審核與批准；未批准不得把 PPT draft 升級為完整 authority。來源包與線上／實體邊界已確認的後續課次，可先依 draft gate 產生 `10-design` 草稿。
12. 依批准的教師手冊建立預習卡、活動卡、角色卡、調查表、rubric 與 exit ticket。
13. 每一課在開始製作任何 PPT 前，先由 Adam 與 AI 共同討論並確認線上課程 PPT 與實體課程 PPT 的內容邊界，保存該課 `lesson_key` 的確認記錄；未完成不得進入 PPT storyboard 或 PPT 生產。既有已批准 PPTX 不因補記錄而回改。
14. 依教師手冊、配套材料與已確認的線上／實體邊界建立內部 PPT storyboard。
15. 建立 Visual storyboard，確認學生畫面文字、圖片、版面、字體、色彩與素材授權。
16. 先製作 6 張 visual prototype，完成學生畫面方向與用詞審核。
17. 依批准的 prototype 與教師手冊建立 PPT master 與完整學生投影片。
18. 加入 speaker notes、音檔與活動提示。

### Phase 4：QA 與交付

19. 內容 QA：來源、全中文指示、簡體字、拼音、練習覆蓋與教材頁碼標記 coverage。
20. 技術 QA：PPTX 開啟、編輯、音檔、字體、版面與列印；後續課次另核對投影畫面可見文字不得低於 20 pt。
21. 課堂流程 QA：依該課核准的實體課時檢查預習回收、分組轉場、出口任務，以及線上／實體 PPT 邊界是否依確認記錄執行。
22. 教師 rehearsal 或實際課堂觀察。
23. 修訂、版本化與交付。

### 6.1 逐課生產控制

每一課的 authority／release 都必須走完 Phase 1–4 才能進入下一課的 authority／release。整學期課程表可以先規劃；後續課次只要各自有來源包與線上／實體邊界確認，`10-design` draft 可並行，不視為跳過 authority 順序：

`<textbook_id>:lesson-01 來源 → <textbook_id>:lesson-01 教學設計 → <textbook_id>:lesson-01 教師手冊 → <textbook_id>:lesson-01 配套 → <textbook_id>:lesson-01 PPT storyboard → <textbook_id>:lesson-01 Visual storyboard → <textbook_id>:lesson-01 prototype → <textbook_id>:lesson-01 完整 PPTX → <textbook_id>:lesson-01 QA／rehearsal → <textbook_id>:lesson-01 交付 → <textbook_id>:lesson-02 來源`

## 7. 驗收標準

一課只有同時滿足以下條件才算完成：

- 來源已批准。
- 教學重組已批准。
- 教師手冊已完成並批准；它能讓另一位教師依流程上課，且所有 PPT／學生材料都能回溯到它。
- PPTX 可編輯且可直接上課。
- 所有使用課本內容的投影片都有正確的教材印刷頁碼標記；不使用課本內容的投影片沒有多餘標記，且頁碼 coverage、邊界、重疊與 PDF 可見性驗證通過。
- 所有教材練習有 slide 或配套 coverage record。
- 教師手冊可以讓另一位教師依流程上課。
- 學生預習卡清楚、負擔合理且能產生課堂證據。
- 小組活動有角色、時間、產出與回饋。
- 音檔實際可用。
- 依該課核准實體課時完成流程時間檢查。
- 不存在未標記的猜測答案或來源不確定內容。

## 8. 版本與檔案建議

```text
lessons/<textbook_id>/lesson-<nn>/
├── 00-source/
├── 10-design/
├── 20-approved/
│   ├── lesson-manifest.json
│   ├── teacher-manual/
│   ├── pptx/
│   └── activities/
├── 30-qa/
└── 40-release/
```

預習卡、評量表或其他學生材料若在批准包中存在，放入 `20-approved/` 對應資料夾；活動卡 Word 必須留在各活動資料夾。若 Adam 明確要求只交付單一 PPTX，可只交付 release 中的 PPTX，但標準工作流仍先把配套材料獨立設計，避免課堂活動規則或列印版面被犧牲。
