# Vinh University 專案規則清理結果

依2026-10-07 06:29 UTC明確要求，清理專案內與最新實體課需求衝突的有效指令。更新14個既有路徑；沒有永久刪除、清空垃圾桶、修改課次產物／QA／程式、commit或push。

## 移除或修正的衝突

2026-10-07 06:52 UTC補充確認：線上課PPT維持原狀，未來仍以PPT／PPTX優先；只有實體課以HTML slides優先。下表移除PPTX預設只指其強制套用於實體課的部分，沒有取消線上PPT優先、單詞一頁或已批准風格。

| 衝突 | 處理 |
|---|---|
| 全部新簡報預設native-pptx、HTML須另選 | 改為實體課HTML／OpenSlide優先；線上預習保留PPTX分流 |
| 每份簡報重問風格／交付格式 | 實體課採持續選擇，不重問；其他未指定範圍保留選擇流程 |
| 強制1920×1080 React | 移除固定实现要求，依已選HTML參考與投影可讀性 |
| 全課次沿用舊母版、紫色、固定頁序與pt字階 | 限於原線上／明確指定的歷史PPTX維護；實體HTML與備份採新標準 |
| 每種動作必須分頁、固定兩行指令／三步、每頁主視覺 | 刪除機械配額，改為可讀的連貫活動与必要完整指令 |
| 聽力只能固定標題，禁止說理由／追問 | 改為程度適切的具體指令與有意義交際任務 |
| 實體活動強套教材欄目與三種綜合練習頁 | 保留線上版式；實體依TBL結果組織 |
| 測驗skill仍列W04第9–10課舊卷並每卷加入口說 | 改為W04第1–10課30選擇＋20填空、無正式口說；僅本卷特例 |
| 課程規則殘留全班同類操練與W04時長協調 | 明列10月5日目標級免練／新輸入／重說，教師自行調整前三段時間 |
| 8月21日記憶仍有音頻按鈕、嵌入、PDF活動卡、舊鎖定狀態與固定生產要求 | 完整原文移至非自動載入備份；原路徑只保留非現行索引 |

未来TOCFL风格依学生程度及已教词汇／语法设计，实际出卷核对官方规格；不宣称官方真题，不把50题通用化。新一年级教材产出回到 `lessons/boya-elementary-i/`，不改变其他年级路径。

## 14個更新路徑（相對專案根）

- `AGENTS.md`
- `PROJECT_REQUIREMENTS.md`
- `README.md`
- `.agent/agent-workflow-index.md`
- `.agent/skills/README.md`
- `.agent/skills/boya-lesson-production/SKILL.md`
- `.agent/skills/boya-lesson-production/references/pptx-production.md`
- `.agent/skills/boya-lesson-production/references/workflow-and-evidence.md`
- `.agent/skills/boya-weekly-assessment/SKILL.md`
- `docs/course-rules/BOYA-LS-E1-Y1S1-2026F/README.md`
- `docs/ppt-design-reference-2026-10-05.md`
- `docs/workflow/requirements-registry.md`
- `memory/project-memory.md`
- `memory/ppt-revision-2026-08-21.md`

## 保留與驗證

沒有整個skill已失去用途，因此只刪除或改寫其中衝突指令。線上單詞一頁、教材來源、教師批准、發布邊界、10月5日獨立聽說證據與回饋後同內容重說均保留。原始TBL附件為歷史設計來源，入口已明定不能覆蓋現行規則；不改寫來源附件。未發現有效入口要求固定58張、逐點點擊動畫或每頁強調配額；搜尋到的教材第58頁不當作頁數限制刪除。無需改動全域skills或第三方工具。

- 14份原始快照SHA-256全部核對通過。
- 14份更新文件中的25個本地Markdown連結全部存在。
- 專案記憶測試2項通過：`python3 -B -m unittest discover -s tests -p test_project_memory_contract.py`。
- 指定規則／記憶文件的 `git diff --check` 通過。
- 已重新搜尋預設格式、強制拆頁、固定風格與W04舊卷指令；殘留舊母版文字都有線上／歷史適用範圍，來源與歷史證據不作新規則。

## 備份及恢復

備份位於本次工作區，專案及skill自動探索範圍之外：

`/Users/ssyan110/Documents/Codex/2026-10-07/task/obsolete-rules-backup-20261007/`

`manifest.json` 登記原始相對路徑、`.snapshot`位置、SHA-256及修改原因。恢復時先檢查後續修改，再將指定單一snapshot複製回manifest對應路徑；不要整批覆蓋正在工作的專案。快照不用 `AGENTS.md` 或 `SKILL.md` 原副檔名，避免誤作有效指令。

無剩餘阻塞。此驗證是規則清理驗證，不聲稱簡報或測驗已完成發布QA。
