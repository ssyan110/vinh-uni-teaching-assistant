# Boya Lesson Production Reference

This reference preserves artifact-specific rules moved from the main skill during the Workflow V2 decomposition. Read the canonical workflow contract and requirements registry first. This document does not redefine lifecycle, identity, gate, authority, or release semantics.

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


### 專業交付語氣

- 所有可交付文件以正式教案、教材或簡報的標準撰寫，直接呈現讀者需要的內容。
- 移除 AI 自我說明、生成流程、工具／模型名稱、審核 gate 解釋與與讀者無關的 meta notes。
- 避免「這不是……」「本文件不是……」等模板式開場；使用課程資料、教學步驟、活動規格和評量欄位取代說明性前言。
- 版本、日期與審核狀態只保留在正式文件控制欄；來源、授權、QA 和 debug 資料放在獨立內部檔案。
- 交付前用自然中文編輯標準複查空泛轉折、誇張語氣、重複解釋、過度排比和不必要的破折號。
- 教師手冊採正式課本教師版的內容架構：每課列出教學目標、教學重點、暖身／預習回收、詞語與句式提示、分段教學範本、教材練習解答、文化補充與課後預習；PBI 任務與聽說證據要寫進相應課堂步驟。

