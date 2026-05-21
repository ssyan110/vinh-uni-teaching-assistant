# AI 教材簡報製作系統：Requirements + Project Context

> Portable project spec. Combines Adam's original planning document with current implementation decisions.
> If this document conflicts with older conversations or files, the "Project implementation status" section takes precedence.

## Project implementation status

| Decision | Current rule |
|---|---|
| Slide engine | **Huashu Design** — local HTML-first deck engine. Gamma is no longer used. |
| Deck source | HTML source first, then export PDF/PPTX. No hand-building slides page by page. |
| Language default | Vietnamese for instructions/explanations, Simplified Chinese for Chinese content, pinyin for pronunciation. No Traditional Chinese unless requested. |
| Review gate | AI Agent may generate draft database/content. Final classroom/student/homework materials require teacher review first. |
| Pre-review automation | Steps 1-8 are safe to automate before teacher review. |
| Post-review scope | Steps 9-19 begin after teacher review. |
| Skills location | `.kiro/skills/` — readable by Kiro, Claude Code, Hermes, Codex, Cursor. |
| Agent entry point | `AGENTS.md` (also symlinked as `CLAUDE.md` and `CODEX.md`). |
| Portability | Skills, requirements, and project rules live inside this repo. No external symlinks or machine-specific paths. |

## Current implemented artifacts

| Artifact | Path |
|---|---|
| Project README | `README.md` |
| Agent instructions | `AGENTS.md` |
| Sample teacher deck | `output/sample-teacher-deck/` |
| Sample teacher deck PDF | `output/sample-teacher-deck/teacher-deck.pdf` |
| Sample editable PPTX | `output/sample-teacher-deck/teacher-deck-editable.pptx` |
| Pinyin Lesson 1 design prototype | `output/pinyin-l1-design-prototype/` |
| VP Pinyin Lesson 1 database | `output/vp-database/pinyin-l1/` |
| Google Sheets-ready main CSV | `output/vp-database/pinyin-l1/06_google_sheets_database.csv` |
| Machine-readable package | `output/vp-database/pinyin-l1/vp_pinyin_l1_database.json` |
| Project skills | `.kiro/skills/` |
| Project steering | `.kiro/steering/` |

## Canonical MVP steps 1-19

| Step | Stage | Tool/workflow | Output |
|---:|---|---|---|
| 1 | 教材輸入 | Google Drive / local PDF | 原始教材 |
| 2 | 課次切分 | AI Agent | lesson list |
| 3 | 內容抽取 | AI Agent | 原始拆解資料 |
| 4 | 頁碼標註 | AI Agent | page mapping |
| 5 | 教學重組 | AI Agent | lesson structure |
| 6 | 補充活動 | AI Agent | warm-up, drills, culture, discussion |
| 7 | 遊戲標記 | AI Agent | game_suggestion |
| 8 | 寫入資料庫 | AI Agent / Sheets CSV/API | 教材資料庫版 |
| 9 | 人工審閱 | Google Sheets | Approved Data |
| 10 | 生成老師備課版 | AI Agent | 老師備課版 |
| 11 | 生成 Huashu Brief | AI Agent | Huashu deck brief |
| 12 | 生成教師版簡報 | Huashu Design | HTML teacher deck |
| 13 | 匯出備份 | Huashu export scripts | PPTX / PDF |
| 14 | 生成學生版內容 | AI Agent | Student Version |
| 15 | 生成作業題庫 | AI Agent | homework/question bank |
| 16 | 題庫審閱 | Google Sheets | Approved Questions |
| 17 | 建立學生版與作業 | Formative or CSV/HTML fallback | 學生版 + 作業 |
| 18 | 課堂測試 | Teacher | class feedback |
| 19 | 回填修正 | Google Sheets | Improvement Log |

---

# AI 教材簡報製作系統完整規劃文件

> 文件用途：本文件提供給 AI Agent、教材製作團隊、教學負責人與簡報/作業製作者使用。
> 核心目標：讓 AI Agent 能依照固定規則拆解原始教材，輸出可審閱、可生成簡報、可製作學生版與課後作業的標準化教材資料。
> 主流程：**AI Agent 拆解教材 → Google Sheets 人工審閱 → Huashu Design 生成教師版簡報 → Formative 製作學生版與課後作業**

---

## 01｜專案目標

| 項目 | 說明 |
|---|---|
| 專案目標 | 將原始中文教材轉換成可上課、可複習、可追蹤作業的數位教材 |
| 製作方式 | 不由人工逐張設計 PPT，而是由 AI Agent 拆解教材後，交給 AI 簡報工具生成 |
| 教材來源 | 原始教材 PDF，例如《漢語教程》 |
| 核心流程 | AI Agent 拆解教材 → Google Sheets 人工審閱 → Huashu Design 生成教師版簡報 → Formative 製作學生版與課後作業 |
| 教材原則 | 不改變原教材主線與核心內容，但可補充暖身、練習、文化補充、課後作業 |
| 品質控制 | 所有內容先進入 Google Sheets，由老師審閱後才可進入 Huashu Design / Formative |
| 頁碼規則 | 每張 slide、每個練習、每道作業題都需標記原教材頁碼 |
| 製作策略 | 先完成最低可用版本 MVP，再逐步優化動畫、聲音、互動與自動化 |
| 學生版方向 | 使用 Formative 製作線上閱讀版、練習與課後作業 |
| 教師版方向 | 使用 Huashu Design 生成教師版簡報，必要時匯出 PPTX / PDF 備份 |

---

## 02｜最終輸出教材版本

| 教材版本 | 使用對象 | 工具 | 目的 | MVP 是否需要 |
|---|---|---|---|---|
| 教師版簡報 | 老師 | Huashu Design / PPTX / PDF | 課堂播放、教學引導、練習展示 | 必要 |
| 學生版教材 | 學生 | Formative | 學生課堂查看、課後複習 | 必要 |
| 課後作業版 | 學生 | Formative | 生詞、拼音、漢字、語法、課文相關作業 | 必要 |
| 老師備課版 | 老師 / 新老師 / 教學主管 | Google Sheets / PDF | 說明每頁怎麼教、怎麼提問、參考答案是什麼 | 必要 |
| 教材資料庫版 | AI Agent / 製作團隊 | Google Sheets / JSON | 儲存教材內容、頁碼、審閱狀態、版本紀錄 | 必要 |
| 素材庫 | 製作團隊 | Google Drive | 管理 PDF、圖片、音檔、簡報、作業 | 必要 |
| 優化紀錄版 | 老師 / 製作團隊 | Google Sheets | 記錄上課問題、學生反應與版本修改 | 建議 MVP 建立 |

---

## 03｜各版本用途說明

| 版本 | 一句話定義 | 主要用途 | 不包含 |
|---|---|---|---|
| 教師版簡報 | 給老師上課播放的簡報 | 課堂教學、重點講解、練習展示 | 不承擔完整備課說明 |
| 學生版教材 | 給學生看的線上教材 | 課堂跟讀、課後複習、查看重點 | 老師提示、內部審閱資訊、課中練習參考答案 |
| 課後作業版 | 給學生完成的線上作業 | 線上練習、答題提交、學習追蹤 | 課堂即時互動練習 |
| 老師備課版 | 給老師看的「怎麼教」 | 教學流程、老師提示、參考答案、常見錯誤 | 學生不需要看到的內部資訊 |
| 教材資料庫版 | 給系統看的「教材後台資料」 | AI Agent 生成簡報、學生版、作業題庫的資料來源 | 不直接給老師上課播放 |
| 素材庫 | 教材製作資源中心 | 集中管理圖片、音檔、PPT、PDF、版本檔案 | 不作為審閱主表 |
| 優化紀錄版 | 教材改版紀錄 | 記錄問題、修正方向、下一版優化內容 | 不放正式教材內容 |

### 老師備課版與教材資料庫版差異

| 項目 | 老師備課版 | 教材資料庫版 |
|---|---|---|
| 核心目的 | 幫老師知道怎麼教 | 幫 AI Agent 與團隊管理內容 |
| 使用者 | 老師、新老師、教學主管 | AI Agent、製作團隊、教學主管 |
| 內容重點 | 教學流程、老師提示、參考答案、活動操作 | 原教材內容、頁碼、AI 整理內容、審閱狀態、版本 |
| 是否給學生 | 否 | 否 |
| 是否可給 AI Agent 讀取 | 可以 | 必須 |
| 是否直接用於上課 | 不直接播放，但老師備課時必讀 | 不直接上課使用 |

---

## 04｜工具分工

| 階段 | 工具 | 用途 |
|---|---|---|
| 教材輸入 | Google Drive | 儲存原始教材 PDF、圖片、音檔、簡報 |
| 教材拆解 | AI Agent / Kiro / ChatGPT Agent | 抽取教材內容、標記頁碼、重組教學流程 |
| 人工審閱 | Google Sheets | 老師檢查內容、頁碼、答案、教學順序 |
| 教師版簡報 | Huashu Design | 根據審閱後內容生成教師版簡報 |
| 學生版教材 | Formative | 製作學生線上閱讀版 |
| 課後作業 | Formative | 製作課後練習與作業提交 |
| 課堂團體遊戲 | Kahoot / Quizizz / Blooket | 將拼音練習、生詞練習、語法練習做成班級競賽或即時互動遊戲 |
| 聲音製作 | ElevenLabs / Azure TTS / Google TTS | 後續製作生詞、課文、聽力、口說示範音檔 |
| 視覺素材 | Canva / AI Image Tool | 製作圖片、圖表、生詞圖卡、情境圖 |
| 版本管理 | Google Drive + Google Sheets | 管理 v0.1、v1.0、v2.0 等版本 |

### 工具使用原則

| 工具 | 使用原則 |
|---|---|
| AI Agent | 只負責拆解、整理、生成草稿，不直接發布成品 |
| Google Sheets | 作為人工審閱與資料中台 |
| Huashu Design | 用於教師版簡報生成（HTML-first，export PDF/PPTX） |
| Formative | 用於學生版教材與課後作業 |
| Kahoot / Quizizz / Blooket | 作為可選課堂遊戲工具，不取代課堂 slide |
| Google Drive | 作為素材與版本管理中心 |
| Canva / AI Image Tool | 作為圖片、圖表、視覺素材補充工具，不作為主要簡報生產線 |
| TTS 工具 | 第二階段後用於補充音檔，不是 MVP 必須項目 |

---

## 05｜整體工作流程

```text
原始教材 PDF
↓
AI Agent 拆解教材內容
↓
輸出到 Google Sheets 教材資料庫版
↓
老師人工審閱
↓
Approved 內容生成老師備課版
↓
Approved 內容生成 Huashu Brief
↓
Huashu Design 生成教師版簡報
↓
老師檢查與微調
↓
AI Agent 生成學生版內容
↓
AI Agent 生成課後作業題庫
↓
老師審閱題庫
↓
Formative 製作學生版與課後作業
↓
實際上課測試
↓
回填問題與優化紀錄
↓
進入下一版本
```

---

## 06｜每課教材標準架構

### 建議教學順序

**暖身活動 → 學習目標 → 拼音 → 拼音練習 → 生詞 → 生詞練習 → 語法 → 語法練習 → 課文預習 → 課文 → 文化補充 → 課程討論 → 課後作業說明**

### 每課教材標準架構表

| 順序 | 模組 | Slide 建議 | 教師版 | 學生版 | Formative | 備注 / 參考答案規則 |
|---:|---|---:|---|---|---|---|
| 1 | 暖身活動 | 1-2 | 是 | 是 | 否 | 備注需附參考答案；無需答案則寫 N/A |
| 2 | 學習目標 | 1 | 是 | 是 | 否 | 備注寫「本課目標用途 / 學生應達成能力」 |
| 3 | 拼音 | 3-5 | 是 | 是 | 否 | 若該課無拼音則跳過 |
| 4 | 拼音練習 | 2-4 | 是 | 是 | 否 | 備注附參考答案；可標記 Kahoot / Quizizz / Blooket |
| 5 | 生詞 | 8-12 | 是 | 是 | 否 | 依原教材順序 |
| 6 | 生詞練習 | 3-5 | 是 | 是 | 否 | 備注附參考答案；可標記 Kahoot / Quizizz / Blooket |
| 7 | 語法 | 5-8 | 是 | 是 | 否 | 建議放在課文前，幫助理解課文 |
| 8 | 語法練習 | 3-5 | 是 | 是 | 否 | 備注附參考答案；可標記 Kahoot / Quizizz / Blooket |
| 9 | 課文預習 | 1-2 | 是 | 是 | 否 | 備注需附參考答案；無需答案則寫 N/A |
| 10 | 課文 | 5-8 | 是 | 是 | 否 | 按原教材呈現，可加分句理解 |
| 11 | 文化補充 | 1-2 | 是 | 是 | 否 | 可根據主題補充，避免偏離課程 |
| 12 | 課程討論 | 1 | 是 | 是 | 否 | 備注選用 |
| 13 | 課後作業說明 | 1 | 是 | 是 | 是 | Formative 只用於課後作業 |

### 已確認的教材架構規則

| 規則 | 說明 |
|---|---|
| 暖身活動放在學習目標前 | 先帶入主題，再說明本課要學什麼 |
| 語法放在課文前 | 建議放在生詞後、課文預習前，幫助學生理解課文 |
| 課文理解刪除 | 不作為獨立模組，避免與課文預習重疊 |
| 任務活動刪除 | 除非原教材明確有類似活動，否則不列為標準模組 |
| 課堂總結改為課程討論 | 第 12 模組改名為「課程討論」 |
| Formative 不做課堂即時練習 | Formative 只用於學生版教材與課後作業 |
| 拼音 / 生詞 / 語法練習可做遊戲 | 可標記為 Kahoot / Quizizz / Blooket 團體遊戲建議 |
| 課中練習學生版不附參考答案 | 學生版的暖身、拼音練習、生詞練習、語法練習、課文預習不附參考答案 |

---

## 07｜教師版簡報結構

| 區塊 | 建議張數 | 內容 |
|---|---:|---|
| 暖身活動 | 1-2 | 圖片、問題、前課複習 |
| 學習目標 | 1 | 本課任務與學習成果 |
| 拼音 / 發音 | 3-5 | 規則、示範、練習 |
| 拼音練習 | 2-4 | 聲調辨識、拼讀、聽音選擇 |
| 生詞 | 8-12 | 詞義、拼音、越南語、例句、圖片 |
| 生詞練習 | 3-5 | 配對、選詞、造句 |
| 語法 | 5-8 | 結構、例句、越南語說明 |
| 語法練習 | 3-5 | 替換、改錯、造句、翻譯 |
| 課文預習 | 1-2 | 情境導入、關鍵詞預測 |
| 課文 | 5-8 | 課文呈現、分句理解、角色朗讀 |
| 文化補充 | 1-2 | 越中差異、生活文化 |
| 課程討論 | 1 | 課末討論、延伸思考、口語表達 |
| 作業說明 | 1 | Formative 作業說明 |

| 版本 | 建議總張數 |
|---|---:|
| MVP v0.1 | 25-35 張 |
| v1.0 | 30-40 張 |
| v2.0 之後 | 30-40 張，不建議無限制增加 |

---

## 08｜學生版教材結構

| 模組 | 是否放入學生版 | 說明 | 參考答案 |
|---|---|---|---|
| 暖身活動 | 是 | 可讓學生課前或課中思考 | 無附參考答案 |
| 學習目標 | 是 | 讓學生知道本課要學會什麼 | 不適用 |
| 拼音 | 是 | 保留規則與例子 | 不適用 |
| 拼音練習 | 是 | 放在學生版，不放 Formative | 無附參考答案 |
| 生詞 | 是 | 中文、拼音、越南語、例句 | 不適用 |
| 生詞練習 | 是 | 學生可在課堂跟著做 | 無附參考答案 |
| 語法 | 是 | 保留結構、例句、越南語說明 | 不適用 |
| 語法練習 | 是 | 學生可在課堂跟著做 | 無附參考答案 |
| 課文預習 | 是 | 課文前引導 | 無附參考答案 |
| 課文 | 是 | 原教材課文與必要解釋 | 不適用 |
| 文化補充 | 是 | 可作為課堂延伸與課後閱讀 | 不適用 |
| 課程討論 | 是 | 用於課末討論、延伸思考、口語表達 | 無附參考答案 |
| 課後作業說明 | 是 | 引導學生完成 Formative | 不適用 |
| 老師提示 | 否 | 只放老師備課版 | 不適用 |
| 內部審閱資訊 | 否 | 只放教材資料庫版 | 不適用 |

---

## 09｜Formative 使用規則

| 用途 | 是否使用 Formative | 說明 |
|---|---|---|
| 課堂暖身 | 否 | 放在教師版與學生版 |
| 拼音練習 | 否 | 放在教師版與學生版 |
| 生詞練習 | 否 | 放在教師版與學生版 |
| 語法練習 | 否 | 放在教師版與學生版 |
| 課文預習 | 否 | 放在教師版與學生版 |
| 學生閱讀版 | 是 | 放學生版內容 |
| 課後作業 | 是 | Formative 專門做課後作業、線上練習、學生提交 |

---

## 10｜課堂團體遊戲使用規則

| 使用位置 | 工具 | 用途 | 是否必要 |
|---|---|---|---|
| 拼音練習 | Kahoot / Quizizz / Blooket | 聲調辨識、拼音選擇、聽音選答 | 選用 |
| 生詞練習 | Kahoot / Quizizz / Blooket | 詞義配對、圖片選詞、中文選越南語 | 選用 |
| 語法練習 | Kahoot / Quizizz / Blooket | 選擇正確句子、錯句判斷、語序選擇 | 選用 |

| 原則 | 說明 |
|---|---|
| 不取代教師版 slide | 團體遊戲只是課堂互動補充 |
| 不放在 Formative | Formative 只做學生版與課後作業 |
| 備注欄標記 | 若適合做遊戲，在備注寫「可製作 Kahoot / Quizizz / Blooket」 |
| MVP 處理 | MVP 可先不做遊戲，但需要在資料表保留標記欄位 |

---

## 11｜課後作業架構

| 作業模組 | MVP 題數 | v3.0 題數 | 題型 | 目的 |
|---|---:|---:|---|---|
| 生詞辨識 | 5-8 | 8-10 | 選擇、配對 | 確認詞義 |
| 拼音 / 聽音 | 3-5 | 5-8 | 聲調、聽音選詞 | 訓練發音與聽辨 |
| 漢字練習 | 3-5 | 5-8 | 筆順觀看、部件辨識、描紅、看拼音選漢字、看越南語選漢字 | 訓練字形辨識與基礎書寫 |
| 語法理解 | 5 | 5-8 | 選擇、填空 | 檢查語法掌握 |
| 句子排序 | 3-5 | 5 | 排序 | 訓練中文語序 |
| 課文相關題 | 3-5 | 5-8 | 是非、選擇、簡答 | 檢查課文理解 |
| 翻譯 / 造句 | 2-3 | 3-5 | 簡答 | 檢查輸出 |
| 口說錄音 | 暫不做或 1 | 1-2 | 錄音回答 | 檢查口語 |

| 項目 | MVP 標準 |
|---|---|
| 每課題數 | 18-25 題 |
| 優先題型 | 選擇、配對、填空、排序、漢字辨識 |
| 漢字練習 MVP 做法 | 先做「看拼音選漢字」「看越南語選漢字」「部件辨識」 |
| 暫緩題型 | 大量口說錄音、複雜開放題、完整手寫批改 |
| 必備規則 | 每題標記原教材頁碼 |
| 審閱流程 | AI 出題 → Google Sheets 審閱 → Formative 建立作業 |

---

## 12｜Google Sheets 資料庫設計

### Lesson Content Sheet

| 欄位 | 用途 |
|---|---|
| lesson_id | 第幾課 |
| unit_title | 課名 |
| section | 暖身 / 學習目標 / 拼音 / 生詞 / 語法 / 課文 / 文化補充 / 課程討論 / 作業 |
| original_page | 原教材頁碼 |
| original_content | 原教材原文 |
| adapted_content | AI 整理後內容 |
| vietnamese_explanation | 越南語解釋 |
| slide_suggestion | 建議簡報內容 |
| activity_type | 講解 / 練習 / 問答 / 朗讀 / 聽力 / 討論 |
| student_version | 是否放入學生版 |
| homework | 是否做成作業 |
| reference_answer | 參考答案；無需答案則寫 N/A |
| game_suggestion | 是否適合做 Kahoot / Quizizz / Blooket |
| teacher_note | 老師提示 |
| review_status | Approved / Revise / Reject |
| reviewer_note | 老師修改意見 |
| version | 版本號 |

### Huashu Brief Sheet

| 欄位 | 用途 |
|---|---|
| slide_no | 投影片順序 |
| lesson_id | 課次 |
| section | 所屬模組 |
| slide_title | 投影片標題 |
| slide_goal | 此頁教學目的 |
| slide_content | 投影片內容 |
| visual_direction | 圖片、排版、視覺方向 |
| animation_direction | 動畫方向 |
| audio_needed | 是否需要音檔 |
| original_page | 對應原教材頁碼 |
| reference_answer | 參考答案；無需答案則寫 N/A |
| game_suggestion | 是否適合做 Kahoot / Quizizz / Blooket |
| teacher_note | 老師提示 |
| review_status | Approved / Revise / Reject |

### Formative Question Sheet

| 欄位 | 用途 |
|---|---|
| question_id | 題號 |
| lesson_id | 課次 |
| skill | 聽 / 說 / 讀 / 寫 / 生詞 / 拼音 / 漢字 / 語法 / 課文 |
| question_type | 選擇 / 配對 / 填空 / 排序 / 簡答 / 錄音 |
| prompt | 題目 |
| options | 選項 |
| answer | 標準答案 |
| explanation | 解釋 |
| original_page | 對應原教材頁碼 |
| difficulty | easy / medium / hard |
| review_status | Approved / Revise / Reject |
| reviewer_note | 老師修改意見 |
| version | 版本號 |

### Improvement Log Sheet

| 欄位 | 用途 |
|---|---|
| date | 修改日期 |
| lesson_id | 課次 |
| issue_type | 內容錯誤 / 教學不順 / 圖片不適合 / 題目太難 / 學生不懂 |
| issue_description | 問題描述 |
| source | 老師回饋 / 學生回饋 / 作業數據 |
| priority | 高 / 中 / 低 |
| action | 修改方式 |
| status | To do / Doing / Done |
| version_fixed | 修正在哪個版本 |

---

## 13｜設計規範

| 項目 | 要定案內容 |
|---|---|
| 整體風格 | 活潑、清楚、現代、適合越南初學者 |
| 色彩系統 | 主色、副色、提示色、錯誤色 |
| 字體規範 | 中文、拼音、越南語的字級與位置 |
| 圖片風格 | 真實照片 / 插畫 / AI 情境圖，需統一 |
| 生詞版型 | 中文、拼音、越南語、例句、圖片的排列 |
| 語法圖表 | 結構公式、例句、錯誤對比、越南語說明 |
| 練習頁版型 | 選擇題、配對題、排序題、漢字練習題、口說題 |
| 頁碼標註 | 固定位置標記「原教材 p.xx」 |
| 老師提示樣式 | 只出現在老師備課版 |
| 學生版樣式 | 去除老師提示，保留重點與練習 |

---

## 14｜版本升級路線

| 版本 | 目標 | 具體做到 | 暫時不做 / 備注 |
|---|---|---|---|
| MVP v0.1 | 跑通流程 | 第1課完整製作；有教師版、學生版、作業版、頁碼對應 | 不做複雜動畫、不做完整音檔、不做團體遊戲正式版 |
| v1.0 | 定案標準 | 固定風格、圖片、圖表、版型、Sheets 欄位、Huashu Brief 格式 | 不做大規模 API 自動化 |
| v2.0 | 動畫優化 | 加入逐步出現、轉場、重點標示、互動節奏 | 不做過度華麗動畫 |
| v3.0 | 聲音互動 | 生詞音檔、課文音檔、聽力題、口說錄音 | 不一次做全冊，先做單元 |
| v4.0 | 半自動化 | Agent 自動生成 Huashu Brief、Formative 題庫、老師備課版 | 視團隊技術能力與製作量決定 |
| v5.0 | 批量化 | 串接 Sheets API、Huashu API、Formative 匯入流程 | 視工具 API 成熟度與成本決定 |

---

## 15｜AI Agent 任務清單

| 任務 | 具體工作 |
|---|---|
| 教材拆解 | 從 PDF 抽出拼音、生詞、課文、語法、練習 |
| 頁碼標記 | 每個內容都標記原教材頁碼 |
| 教學重組 | 按標準教材架構重新排列 |
| 生成暖身 | 根據前課或本課主題生成 1-2 張暖身活動 |
| 生成拼音練習 | 產出聲調、拼讀、聽辨相關練習 |
| 生成生詞練習 | 產出配對、選詞、看圖說詞、造句 |
| 生成語法練習 | 產出替換、改錯、造句、翻譯 |
| 生成課文預習 | 產出情境問題、關鍵詞預測 |
| 生成文化補充 | 根據本課主題補充越中差異或文化說明 |
| 生成課程討論 | 根據本課主題產出課末討論問題 |
| 生成遊戲建議 | 判斷拼音、生詞、語法練習是否適合轉成 Kahoot / Quizizz / Blooket |
| 生成老師備課版 | 補充教學提示、參考答案、操作方式 |
| 生成 Huashu Brief | 將審閱後資料轉成 Huashu Design 可用簡報指令 |
| 生成學生版 | 去除老師內部提示、內部審閱資訊、課中練習答案，保留學生可讀內容 |
| 生成作業題庫 | 生成 Formative 課後作業題，包含漢字練習 |
| 記錄版本 | 寫入版本號、修改狀態與審閱結果 |

---

## 16｜品質控制規則

| 檢查項目 | 標準 |
|---|---|
| 原教材頁碼 | 每張 slide、每道題都要有 |
| 原教材內容 | 不可擅自改變核心內容 |
| 補充內容 | 必須服務本課教學目標 |
| 越南語解釋 | 必須清楚、自然、適合越南學生 |
| 生詞順序 | 優先保留原教材順序 |
| 語法順序 | 可放到課文前，但內容仍需對應原教材 |
| 題目答案 | 必須人工審閱 |
| 參考答案 | 暖身、拼音練習、生詞練習、語法練習、課文預習必填；無則 N/A |
| 學習目標備注 | 不寫 N/A，需寫本課目標用途或學生應達成能力 |
| 課程討論 | 學生版無附參考答案；老師備課版可附引導方向 |
| 團體遊戲建議 | 拼音練習、生詞練習、語法練習可標記是否適合做 Kahoot / Quizizz / Blooket |
| 圖片風格 | 必須符合 v1.0 定案規範 |
| 學生版 | 不放老師提示、內部審閱資訊、課中練習參考答案 |
| 老師備課版 | 必須說明怎麼教、怎麼問、參考答案是什麼 |

---

## 17｜正式量產流程

| 階段 | 製作範圍 | 目的 |
|---|---|---|
| 第1階段 | 只做第1課 | 驗證流程可行 |
| 第2階段 | 做3課 | 固定模板與問題清單 |
| 第3階段 | 做1個單元 | 測試批量產出 |
| 第4階段 | 做整冊 | 建立完整教材包 |
| 第5階段 | 擴展 HSK1-4 | 建立系列化課程產品 |

---

## 18｜MVP 驗收標準

| 驗收項目 | 通過標準 |
|---|---|
| 第1課已拆解 | 有完整 Lesson Content Sheet |
| 頁碼標註完整 | 每張 slide 與每道題都有原教材頁碼 |
| 老師已審閱 | 主要內容為 Approved |
| 教師版可上課 | Huashu Design 簡報可完成一堂課 |
| 學生版可閱讀 | Formative 中有學生可查看內容 |
| 課後作業可提交 | Formative 中有 18-25 題作業 |
| 老師備課版可用 | 老師能看懂每頁怎麼教 |
| 學生版無答案 | 課中練習不附參考答案 |
| 可回填問題 | Improvement Log 已建立 |
| 可複製到第2課 | 第1課流程可重複使用 |

---

## 19｜給 AI Agent 的執行規則摘要

### Agent 必須遵守的核心規則

| 規則 | 說明 |
|---|---|
| 不可直接產出成品 | 必須先輸出到 Google Sheets，經人工審閱後才可進入 Huashu Design / Formative |
| 不可亂改原教材 | 原教材核心內容與主線不可擅自更改 |
| 必須標記頁碼 | 所有 slide、練習、作業題都必須有原教材頁碼 |
| 必須區分版本 | 教師版、學生版、老師備課版、教材資料庫版、作業版不可混淆 |
| 學生版不可放答案 | 課中練習在學生版中不附參考答案 |
| 老師備課版必須放答案 | 老師備課版要保留參考答案、引導方向、老師提示 |
| Formative 只做學生版與課後作業 | 不用 Formative 做課堂即時練習 |
| 團體遊戲只作為選用 | Kahoot / Quizizz / Blooket 是補充工具，不是必做項 |
| v4.0 / v5.0 非必做 | 半自動化與 API 批量化只是可考慮方向 |

### Agent 每次處理一課時的最小輸出

| 輸出 | 說明 |
|---|---|
| Lesson Content Sheet 資料 | 原文、頁碼、整理內容、學生版標記、老師備註 |
| Huashu Brief Sheet 資料 | 投影片順序、標題、內容、視覺建議、頁碼 |
| Formative Question Sheet 資料 | 課後作業題、答案、解釋、頁碼 |
| 老師備課版內容 | 每個模組的教學提示、參考答案、活動操作 |
| 學生版內容 | 去除老師提示與答案後的學生可讀版本 |
| Improvement Log 初始欄位 | 預留課後回饋與優化紀錄 |

---

## 20｜建議 Google Drive 資料夾結構

```text
AI_教材簡報製作系統/
├── 00_原始教材/
│   ├── PDF/
│   └── 授權與來源記錄/
├── 01_Google_Sheets_資料庫/
│   ├── Lesson_Content/
│   ├── Huashu_Brief/
│   ├── Formative_Question/
│   └── Improvement_Log/
├── 02_教師版簡報/
│   ├── Huashu_HTML/
│   ├── PPTX_Backup/
│   └── PDF_Backup/
├── 03_學生版_Formative/
│   ├── 學生版教材/
│   └── 課後作業/
├── 04_老師備課版/
│   ├── PDF/
│   └── Google_Doc/
├── 05_素材庫/
│   ├── 圖片/
│   ├── 音檔/
│   ├── 圖表/
│   └── 遊戲素材/
├── 06_課堂團體遊戲/
│   ├── Kahoot/
│   ├── Quizizz/
│   └── Blooket/
└── 99_版本紀錄/
    ├── MVP_v0.1/
    ├── v1.0/
    ├── v2.0/
    └── v3.0/
```

---

## 21｜建議 Google Sheets 分頁結構

| 分頁名稱 | 用途 |
|---|---|
| 00_Config | 記錄版本、教材名稱、製作規則 |
| 01_Lesson_Content | 教材主資料庫 |
| 02_Huashu_Brief | 給 Huashu Design 的簡報生成資料 |
| 03_Formative_Question | 給 Formative 的課後作業題庫 |
| 04_Teacher_Guide | 老師備課版資料 |
| 05_Student_Version | 學生版教材資料 |
| 06_Game_Suggestion | Kahoot / Quizizz / Blooket 建議 |
| 07_Improvement_Log | 上課後問題與優化紀錄 |
| 08_Review_Status | 審閱進度總表 |

---

## 22｜審閱狀態定義

| 狀態 | 定義 | 下一步 |
|---|---|---|
| Draft | AI 初稿，尚未審閱 | 老師審閱 |
| Revise | 需要修改 | AI Agent 或製作人員修正 |
| Approved | 已通過審閱 | 可進入 Huashu Design / Formative |
| Rejected | 不採用 | 不進入後續流程 |
| Published | 已正式使用 | 進入上課與回饋流程 |
| Archived | 舊版本封存 | 不再使用，僅保留紀錄 |

---

## 23｜版本命名規則

| 類型 | 命名格式 | 範例 |
|---|---|---|
| 教師版簡報 | `TeacherSlides_L{課次}_v{版本}` | `TeacherSlides_L01_v0.1` |
| 學生版 | `StudentVersion_L{課次}_v{版本}` | `StudentVersion_L01_v0.1` |
| 課後作業 | `Homework_L{課次}_v{版本}` | `Homework_L01_v0.1` |
| 老師備課版 | `TeacherGuide_L{課次}_v{版本}` | `TeacherGuide_L01_v0.1` |
| Huashu Brief | `HuashuBrief_L{課次}_v{版本}` | `HuashuBrief_L01_v0.1` |
| 題庫 | `FormativeQuestions_L{課次}_v{版本}` | `FormativeQuestions_L01_v0.1` |

---

## 24｜建議執行順序

| 優先級 | 動作 | 原因 |
|---:|---|---|
| 1 | 建立 Google Drive 資料夾結構 | 先管理原始教材、簡報、作業、音檔 |
| 2 | 建立 Google Sheets 模板 | 這是整個系統的核心 |
| 3 | 先做第1課 MVP | 避免一開始整冊返工 |
| 4 | AI Agent 拆解第1課 | 測試教材抽取準確度 |
| 5 | 老師審閱第1課 | 確保內容不偏離教材 |
| 6 | 用 Huashu Design 生成教師版 | 測試簡報品質 |
| 7 | 用 Formative 建立學生版與作業 | 測試學生端流程 |
| 8 | 實際上一堂課 | 驗證是否真的可教 |
| 9 | 回填問題並修正 | 建立優化循環 |
| 10 | 固定 v1.0 標準後再批量製作 | 避免後面大規模返工 |

---

## 25｜最終決定總表

| 項目 | 最終決定 |
|---|---|
| 主流程 | AI Agent 拆解教材 → Google Sheets 人工審閱 → Huashu Design 生成教師版簡報 → Formative 製作學生版 |
| 教材開頭 | 暖身活動 → 學習目標 |
| 語法位置 | 生詞後、課文預習前 |
| Formative 用途 | 學生版教材 + 課後作業，不做課堂即時練習 |
| 團體遊戲工具 | Kahoot / Quizizz / Blooket，作為課堂練習選用工具 |
| 課後作業新增 | 漢字練習 |
| 暖身張數 | 1-2 張 slide |
| 課文理解 | 刪除，不作為獨立模組 |
| 任務活動 | 刪除，除非原教材明確有類似活動 |
| 課堂總結 | 已改為課程討論 |
| 教師版 | Huashu Design 生成，匯出 PPTX / PDF 備份 |
| 學生版 | Formative 製作閱讀版與課後作業 |
| 老師備課版 | 給老師看「怎麼教、怎麼問、答案是什麼」 |
| 教材資料庫版 | 給 AI Agent 和製作團隊管理內容 |
| v1.0 重點 | 定案風格、圖片、圖表、版型 |
| v2.0 重點 | 動畫優化 |
| v4.0 / v5.0 | 可考慮做，不列為必做階段 |
| 第一階段 | 只做第1課 MVP |
| 最重要控制點 | 每張 slide、每道題都標記原教材頁碼與審閱狀態 |

---

# End of Document
