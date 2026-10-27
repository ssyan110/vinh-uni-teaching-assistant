# Boya Lesson Production Reference

This reference preserves artifact-specific rules moved from the main skill during the Workflow V2 decomposition. Read the canonical workflow contract and requirements registry first. This document does not redefine lifecycle, identity, gate, authority, or release semantics.

## 來源入口

finalized-pptx 唯讀 intake 依 AGENTS 的優先例外直接抽取 package 與 SHA-256，不被 repo source／PBI gate 阻擋，不授予新修改批准。下方新作流程適用 repo 內容生產；HTML lifecycle 見 `docs/workflow/classroom-html-lifecycle.md`。

## 單一權威來源架構

本專案使用固定的課次目錄：`00-source/` 保存來源，`10-design/` 保存設計與 draft，`20-approved/` 保存唯一權威版本，`30-qa/current/` 保存只讀 QA，`30-qa/archive/` 保存舊 QA，`40-release/` 保存從 authority 複製出的不可變交付包。

- 每課只使用一份 `20-approved/lesson-manifest.json`；檔案連結、版本、SHA-256、QA 與 release 都以此為準。
- 生成器只能寫入 `10-design/` draft，不能覆蓋 `20-approved/`；PowerPoint 人工修訂須經 Adam 明確批准後才成為 authority。
- release builder 只能讀 `20-approved/`，不得在 `40-release/` 重新生成教案、活動卡或 PPTX；不使用 `share`、`share 2`、`share 3` 作為工作流程目錄。
- 活動卡只交付 DOCX；可在 10-design 渲染內部 QA preview PDF，但不交付或放入 release，也不建立「可编辑原稿」中間層。
- dashboard 必須由 `course/lesson-registry.json` 與目前 `lesson_key` 對應的 lesson manifest 共同產生；歷史材料統一放在 `archive/`，不進入新的生產流程。
- 任何 generator 開始寫檔前都必須執行 `python3 scripts/production_gate.py`。教師手冊、配套、prototype、semester manual、authority PPTX 與 release 使用 authority gate；PPTX 草稿使用 `--purpose pptx --stage draft --lesson-key <textbook_id>:<lesson_id> --output-dir <draft-dir>`。草稿 gate 核對本版本明確內容批准、身份、來源與輸出範圍，不授予 authority；正式批准與發布依各版本適用要求記錄；未要求的實體試教不視為通過。

### 統一提交檔案命名（2026-08-29）

- 面向 Adam 的課次交付檔案（PPTX、DOCX、PDF、音檔、CSV、ZIP）一律使用 `lesson-<nn>-<用途>.<副檔名>`；`<nn>` 固定兩位數，使用半形 `-` 分隔，副檔名小寫。
- 線上預習 PPTX 的名稱是 `lesson-<nn>-在线预习.pptx`；實體課使用 OpenSlide。歷史實體 PPTX 僅用於明確授權的既有檔案維護。教師手冊、預習卡、活動材料、預覽、音檔與教材包也沿用 `lesson-<nn>-<用途>` 前綴。
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

### Gate C：各版本內容、材料與製作

1. 依教材與課表核對本次使用的來源、頁碼和音軌並記錄；線上預習可在學期前批次準備，實體活動依實際進度於上課前約一個月至一週設計。
2. 編寫該學期、班級及版本的逐頁審閱稿和必要教師材料；生成圖片、prototype、PPTX 或 OpenSlide 前，依 canonical contract 綁定來源核對報告、審閱稿及 Adam 的真實明確批准。跨課內容按每課分別綁定。
3. 依用途製作線上原生 PPTX 或實體 OpenSlide；線上保留來源對應的右上角純文字 `Audio n-n`，不嵌入音檔或播放控制。學生畫面保留完整任務指令，教師材料能執行相應活動。
4. 依各版本完成來源、學生可讀性、頁面、素材、技術和所需使用方式 QA，再取得成品批准及發布授權。其他課的正式發布不是前置條件。舊 L2–L3 生成器不支持新的版本專屬線上批准，不得用來生成新版本。

### Gate D：QA

依格式核對來源、教材頁碼、音軌、可讀性、內容及素材；實體課逐頁渲染並從 OpenSlide 首頁驗證。教師試教與音響測試未要求時記為未要求；若實際執行，保留真實結果。線上來源音檔依其交付要求核對。技術通過不是人工批准。

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
