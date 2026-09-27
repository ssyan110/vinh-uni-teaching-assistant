# Boya Lesson Production Reference

This reference preserves artifact-specific rules moved from the main skill during the Workflow V2 decomposition. Read the canonical workflow contract and requirements registry first. This document does not redefine lifecycle, identity, gate, authority, or release semantics.

## 單一權威來源架構

本專案使用固定的課次目錄：`00-source/` 保存來源，`10-design/` 保存設計與 draft，`20-approved/` 保存唯一權威版本，`30-qa/current/` 保存只讀 QA，`30-qa/archive/` 保存舊 QA，`40-release/` 保存從 authority 複製出的不可變交付包。

- 每課只使用一份 `20-approved/lesson-manifest.json`；檔案連結、版本、SHA-256、QA 與 release 都以此為準。
- 生成器只能寫入 `10-design/` draft，不能覆蓋 `20-approved/`；PowerPoint 人工修訂須經 Adam 明確批准後才成為 authority。
- release builder 只能讀 `20-approved/`，不得在 `40-release/` 重新生成教案、活動卡或 PPTX；不使用 `share`、`share 2`、`share 3` 作為工作流程目錄。
- 活動卡只交付 DOCX；活動卡不生成 PDF，也不建立「可编辑原稿」中間層。
- dashboard 必須由 `course/lesson-registry.json` 與目前 `lesson_key` 對應的 lesson manifest 共同產生；歷史材料統一放在 `archive/`，不進入新的生產流程。
- 任何 generator 開始寫檔前都必須執行 `python3 scripts/production_gate.py`。教師手冊、配套、prototype、semester manual、authority PPTX 與 release 使用 authority gate；PPTX 草稿使用 `--purpose pptx --stage draft --lesson-key <textbook_id>:<lesson_id> --output-dir <draft-dir>`。草稿 gate 核對本課明確內容批准、身份、來源、邊界與輸出範圍，不授予 authority；完整 authority／release 仍有其他批准輸入及 rehearsal gate。

### 統一提交檔案命名（2026-08-29）

- 面向 Adam 的課次交付檔案（PPTX、DOCX、PDF、音檔、CSV、ZIP）一律使用 `lesson-<nn>-<用途>.<副檔名>`；`<nn>` 固定兩位數，使用半形 `-` 分隔，副檔名小寫。
- 兩份課堂 PPTX 的 canonical 名稱格式是 `lesson-<nn>-在线预习.pptx` 與 `lesson-<nn>-实体课.pptx`。教師手冊、預習卡、活動材料、預覽、音檔與教材包也沿用 `lesson-<nn>-<用途>` 前綴。
- 提交前不得保留 `第一課`／`第一课`、`online`／`face-to-face`、空格、底線、日期或重複 `final`；版本與 hash 由 manifest／QA／release 紀錄管理。內部 draft 可暫加 `-draft-vNN`，提交時要改回 canonical 名稱。
- schema 固定檔名、出版社／第三方來源檔名和歷史 archive 保留原名；既有 approved／release 不追溯改名，會改變 authority 路徑或 hash 時必須先取得 Adam 明確批准。

## 核心規則


## 固定 workflow

### Gate A：來源

1. 盤點 PDF、頁碼、音檔、QR、索引。
2. OCR 與人工核對。
3. 建立結構化 source package。
4. 確認詞語、課文、句式、練習、音檔與答案狀態。
5. 等待教師／Adam 明確批准。架構或開始流程的確認不等於本課內容批准。

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
9. 圖片 worker 派發、素材納入、prototype 及 PPTX 生產均先依 canonical contract 通過本課 `content-approval` 檢查。未有具體逐頁內容的明確批准，停在文案审阅，不因 draft 例外而生成。批准後使用通過 draft gate 的 generator 生成原生 PPTX，加入 speaker notes、音檔與必要提示；課次 generator 不得自帶色票、字體或整體版式。準中級第 2、3 課使用 `scripts/build_l23_pptx_drafts.js`，只寫明確 `lesson_key` 的 `10-design/pptx-draft/<mode>/`。
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


## 回報格式

每次工作完成後報告：

- 已完成的 artifact 與絕對路徑。
- 已驗證項目與實際數字。
- 尚未驗證／待教師決定的項目。
- 目前 gate 狀態。
- 下一個最小可驗證步驟。
