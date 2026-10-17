# 專案規則、需求、Skills 與執行檢查審查
日期：2026-10-15
範圍：/Users/ssyan110/Development/vinh-uni-teaching-assistant
狀態：審查完成；修正尚未執行。既有規則、程式、教材、批准與發布記錄未修改。

## 結論

目前仍有會讓錯誤重演的規則衝突。問題集中在「新決定追加了，舊有效條文沒有退出」、「同一件事由多個文件重複管理」及「程式與檢查仍實作舊規則」。

本報告列出 25 組問題，分別說明證據、影響與處置。P1 表示可能直接產生錯誤教材、套錯測驗或阻斷正常流程；P2 表示範圍、入口或驗證缺口；P3 表示應整理的歷史與維護問題。優先級是本次審查判斷，不是既有專案 gate。

最先應處理的是：根 AGENTS 的強制拆頁條文、會嵌音的生成器、W04 舊測驗路由、OpenSlide 下層指令，以及仍強制分隔頁／兩檔框的需求表。只再補一句「以最新規則為準」不足以解決這些問題。

## 檢查範圍與證據界線

- 遞迴盤點 808 份 Markdown／規則類檔案，包含隱藏目錄、專案 skills、OpenSlide 工作區 skills、工具文件、課次資料與歷史文件。清單保留路徑、行數與 SHA-256。
- 排除 .git、node_modules、虛擬環境、編譯目錄與歷次 .agent/runs；不沿 symlink 探索。檔案數是盤點數，不代表已對 808 份逐字做完整教學語義審核。
- 語義核對重點為根入口、PROJECT_REQUIREMENTS、canonical contract、requirements registry、三個專案 skills 及其 references、實體課標準／活動流程、班級規則、專案記憶、OpenSlide 下層 AGENTS／skills、JSON contracts、測驗管理索引、相關生成器及既有檢查／測試。
- 既有工作區有大量未提交修改。本報告以當下檔案為準，不把 git HEAD 當作最新規則，也沒有還原使用者修改。
- 本次沒有生成 PPT、圖片或音檔，沒有執行同步／部署／發布，沒有登入 Google Form／Sheet 驗證線上狀態。測驗現況只據本地索引判讀。
- 本次沒有審核所有全域 skills 或重新研究外部方法網站。全域記憶只用來定位歷史問題；判斷以本次讀取的專案檔案為據。
- 42 筆本地 Markdown 連結候選無法解析，其中包含歷史備份及工具文件；不能把 42 筆全當作有效入口故障。明細保留供逐筆分類，不做自動刪除。
- 專案 agent_loop 的 init 強制 lesson-key，無法忠實表達全專案審查。本次以 scope.json、inventory、check-results 和報告記錄，不捏造課次、不宣稱通過 lesson production preflight。

證據目錄：.agent/runs/rules-audit-20261015/

## 逐項發現

### 01｜P1｜根 AGENTS 仍有「一動作一頁、最多兩行、最多三步」

證據：AGENTS.md:319–320 要求每頁一個課堂動作、必須主視覺、活動指示最多兩行、不同動作分頁。相同文件 :135、:379–385 與 docs/classroom-activity-workflow.md 的現行要求卻是一個連貫活動預設一頁、最多兩頁、完整指令，不強套欄位。

影響：同一份最高專案入口就會同時要求合併與拆頁，容易再次把活動拆碎，或為少字刪掉學生必需資訊。

處置：從有效通用條文刪除硬性行數、步驟數、每動作分頁與每頁必有主視覺的要求。線上有特定版式時，把限制放回對應版式，不能保留成全域規則。保留完整任務、可讀性與逐頁 QA。

### 02｜P1｜需求登記表仍要求活動 divider 與兩檔提示

證據：docs/workflow/requirements-registry.md:50 的 CLASSROOM-NAV-001 要求每活動 starts with a numbered, named divider；:98 的 CLASSROOM-014 要求「兩檔與成果可見」。現行活動流程明定入口與任務同頁、無額外純標題頁；統一任務與單人六格故事不強塞分級框。

影響：即使 agent 讀對最新活動流程，按 registry 做驗收仍可能把舊結構加回。divider 未必必然指獨立頁，但目前措辭與「不增純標題」不一致，必須消除歧義。

處置：NAV 改成「活動入口顯示同號同名，可與任務同頁」；014 改成「按已批准任務使用必要分層，單人故事與統一任務例外」。同步現行內容與驗收，不新增固定模板。

### 03｜P1｜仍被 skill 指定的生成器會嵌音檔、畫音頻色塊

證據：scripts/build_l23_pptx_drafts.js:645–655 的 addAudio 畫 coral 色塊，只寫 track，再呼叫 slide.addMedia；:1058 等處實際呼叫；:1750–1751 宣告 embedded policy。該入口仍由 .agent/skills/boya-lesson-production/references/pptx-production.md:62 指向。AGENTS.md:145–151 要求純文字 Audio n-n、不嵌音、不加按鈕。

影響：這不是單純舊註解。即使內容批准通過，該生產路徑仍會產生不符合新規則的 PPTX。

處置：改共用音頻輸出，修正 manifest 描述，建立 package 檢查：不得有音訊 media、audio relationship/action/timing；可見文字須是來源對應 Audio n-n。先做隔離 fixture，不重建 finalized。未執行生成器，因此本報告不宣稱既有成品都含音。

### 04｜P1｜W04 現行規則仍指向已被取代的卷

證據：.agent/skills/boya-weekly-assessment/SKILL.md 的「当前课表」與取材段、memory/project-memory.md:7–15、docs/course-rules/BOYA-LS-E1-Y1S1-2026F/EFL-REDESIGN-2026-10-05.md 開頭仍把 1–10 課／約 60 分鐘當現行。lessons/boya-elementary-i/assessment-management.json:19–40 已把該卷標 SUPERSEDED/HISTORICAL，:43–68 指向第 5–10 課、15 段對話、規劃 35.05 分鐘的新卷。

影響：下次備課或修改音檔可能回到錯卷、錯範圍和錯時長。舊新卷還共用同一 Form ID，單靠連結更不能辨別內容版本。

處置：skill 只保存「查 current exam_id、實際範圍與題庫 hash」的方法；把 10/6 決定移成明確歷史說明，現行入口直接讀管理索引。35.05 分鐘仍是規劃值，student_ready=false 且親聽／課堂播放／學生用時待驗，不能因 PUBLISHED 字樣宣布教學驗收。

### 05｜P1｜測驗音頻 gate 只支援舊 W04，沒有通用週測路由

證據：scripts/assessment_audio_gate.py:10–18 硬編碼舊 exam_id、directory 與四個 hash；:48 限定舊卷；:80 固定 33 段。現行索引是 15 段的新卷，另有 W05。

影響：文件把 assessment-audio 當可用工具時，使用者可能遇到不適用阻擋，或誤以為舊卷 gate 可驗新卷。

處置：保留原 gate 作歷史版本專用檢查，明確命名與標記；新增依 exam_id／manifest／批准輸入解析的現行路由。不得直接刪 hash 或放寬檢查來求通過。這是能力缺口，不是已證實的批准繞過。

### 06｜P1｜OpenSlide 下層指令沒有專案覆寫接點

證據：統一工作區 AGENTS.md 的技能入口要求 create-slide；工作區 .agents/skills/create-slide/SKILL.md:21–42 預設詢問風格、頁數等；:79 禁止另交 Markdown／text 講稿。slide-authoring/SKILL.md:37、:65 同樣強制 notes export，:25 支援 webfonts，並以 1920×1080 技術模型及自身樣式規則為起點。create-slide:92、:94 又同時寫啟動 dev 與未被要求不要啟動。

影響：進到實際 authoring 目錄後，容易重新問已選風格、誤用 webfont、把必要教師稿只留在 presenter，或不做首頁播放驗證。固定畫布本身可能是 runtime 限制，不能把它當成專案可任意刪除的技術規則。

處置：在使用者控制的工作區 AGENTS 建立明確 adapter：專案已選風格／內容批准／系統字體／教師配套優先，vendor skill 只管 runtime；區分 presenter notes 與必交教師朗讀稿。不要只改會被 sync:skills 覆蓋的 cache。保留相容 runtime 約束。

### 07｜P1｜仍有「必須兩份 PPTX 全部成功」的通用完成條件

證據：AGENTS.md:260 明定兩份 PPTX 全成功才能 complete；:308 的完整包仍要求 PPTX；teacher-guide-and-materials.md:10 同樣要求線上與實體 PPTX。現行實體課採 HTML、PPTX 是選配。

影響：HTML 單獨交付或只修一份已授權檔案，也可能被誤判為半成品，增加未要求的生成工作。

處置：改成「本次已聲明的交付物全部完成適用檢查」。線上 PPTX 與實體 HTML 分別列驗收，靜態 PPTX 備份只有被要求才納入。

### 08｜P2｜HTML 優先已落地，但正式 authority／release 路徑仍未定義

證據：PROJECT_REQUIREMENTS.md §3.1 與 .agent/skills/README.md 明定 OpenSlide 只能 draft；同文件 §4.4、§7 又把核心媒體及完成標準寫成 PPTX。production_gate.py:498 沒有 HTML purpose。sync_open_slide_workspace.py:101–145 是預覽同步，不是內容批准或 release checker。

影響：可以做出可上課 HTML，卻沒有對應正式發行規則；容易把首頁可見、技術通過誤當正式 release，或永遠停在 draft。

處置：定義 HTML 的 source manifest、批准輸入、離線資源、QA、authority 與不可變 release 路徑，再接工具。完成之前維持 draft 邊界，不能用更改狀態代替實作。同步預覽本身不應冒充批准 gate。

### 09｜P2｜舊實體課 JSON 合約仍強制第三頁學習目標與線性欄目

證據：course/boya-face-to-face-order-contract.json 的 base_sequence、first_unit_rule、short_text_unit_sequence；build_l23_pptx_drafts.js:78–98 驗證固定序列，:2072–2081 預設生成 online 及 face。現行實體課第三頁開始活動，不固定學習目標頁。

影響：文件已改 HTML，但資料契約與 QA 仍可能把新備份判錯，或默認多生成舊式實體課。

處置：將舊合約標為準中級歷史 PPTX 專用，消費端要求明確模式；新實體課讀自己的活動路線，不共用舊順序 checker。保留線上版有效規則。

### 10｜P2｜風格 registry 要求每份重新問，忽略持續選擇

證據：course/ppt-style-registry.json:3 的 selection_policy 只豁免 current request 已選；AGENTS.md:167–171 與實體課標準承認 standing choice。

處置：registry 同樣支援持續選擇，登記適用 artifact/cohort 與來源。刪除「只有本次 request 才算已選」的限制。不要每週再問一次。

### 11｜P2｜四步越南文流程圖仍被列為全冊有效要求

證據：PROJECT_REQUIREMENTS.md §9、requirements-registry.md:39 FLOW-001、memory/project-memory.md:64、班級 README 的 PPT 配套段，仍要求固定四步橫向與越南文。現行實體課是第二頁「今天我们会做什么」，按實際活動數安排。

處置：保留在線上／已明確指定的歷史 PPT 維護；移除對未來實體 HTML／備份的適用性。不能把固定四步套到 15 項活動。

### 12｜P2｜語言政策的「唯一越南文例外」與已批准例外不一致

證據：AGENTS.md:316–317、PROJECT_REQUIREMENTS.md:208 說只有線上詞義可用越南文；同一需求 §9 與班級規則又保留既有越南文流程圖。

處置：建立明確例外表：線上詞義、已批准流程圖、其他逐頁授權。新增學生內容仍按簡體中文，不能因例外擴大成任意雙語。這不是要求重寫歷史成品。

### 13｜P2｜23 pt／無紫色被寫成全專案，與線上基線衝突

證據：docs/ppt-design-reference-2026-10-05.md:26 寫「本项目」23 pt、無紫色；線上合約與 AGENTS 的有效線上角色字級含 20–22 pt、紫色句式框。requirements-registry.md:48 已正確區分本屆一年級 23 pt 與其他課程。

處置：設計參考改引用適用 scope 的 typography/palette，不自行設定全域 23 pt。實體無紫色保留；線上已批准紫色框不因清理而改掉。

### 14｜P2｜讀取範圍與課次身份要求互相打架

證據：canonical-workflow-contract.md 的 Task routing 要求只載一個 relevant skill，且 workflow／tool 工作不需 PPTX 規則；agent-workflow-index.md:10–19 卻列全面必讀。boya skill:24 寫 Every operation，operating contract 也要求每次 artifact 都有 lesson identity；canonical Identity 原意是 lesson-scoped。

處置：入口先分 project/tool/course/lesson/assessment 工作；只有 lesson scope 強制 lesson_key。保留必要安全與 authority 共同規則，不讓修工具或全專案審查硬套某課。

### 15｜P2｜所有非瑣碎任務須用 run packet，但 CLI 只接受課次

證據：canonical contract 的 Run packet；agent_loop.py:771–775 的 init 必填 lesson-key，purpose 列表也沒有 project-audit；production_gate.check 的 audit 路由會讀來源／authority。

處置：新增 project/tool/assessment scope 的純執行證據路由，保持與教材批准分離。沒有 lesson 時不可填假課次。這就是本次只能留下獨立審查證據、不能宣稱正常 lesson run complete 的原因。

### 16｜P2｜explicit LessonContext 與 active_context 都被稱為當前權威

證據：AGENTS.md:284、:291、PROJECT_REQUIREMENTS.md:32 仍指定 active_context；canonical contract Identity 要求明確傳入 registry/context；實跑 active-context audit 仍有 10 個 compatibility／legacy consumers。

處置：保留尚有依賴的 config 欄位，但把「決定所有當前工作」改成 legacy compatibility，要求新工作明確 identity。不能直接刪 config，先逐個遷移使用者。

### 17｜P2｜課程基線把二年級前提寫成全專案學生前提

證據：AGENTS.md:44 起、PROJECT_REQUIREMENTS.md:18–25、memory/project-memory.md 的 identity，都泛稱學生已讀完初級兩冊／本學期準中級；course/offerings/2026-fall/offering.json:22 起同時有 elementary 與 quasi-intermediate 的 class_scope，README 的目前教材也沒完整列出一年級。

影響：不明確指定班級時，可能錯估已學範圍與準備程度。

處置：共同規則只留聽說、課時、來源；教材、程度、已教內容改由 offering/textbook/class_scope 決定。不要把 HSK 標籤當已教證據。

### 18｜P2｜舊 draft 例外仍寫成來源＋分流即可開始

證據：AGENTS.md:207 的「只驗證」缺內容批准；PROJECT_REQUIREMENTS.md §1.3、§4.1、§6.1 及 workflow-and-evidence.md:50 仍有省略條件的說法。實際 production_gate.py:387 已呼叫 content approval。

處置：刪掉舊完整條件清單，統一引用 content-approval 定義；分清「可寫文案」與「可生成圖片／prototype／deck」。現有 gate 保留，不放寬。

### 19｜P2｜finalized intake 優先例外沒有傳遞到所有來源 references

證據：AGENTS.md:25–31 允許直接以 Adam finalized PPTX 建新 spec／snapshot，不被舊 repo gate 阻擋；source-and-pbi.md:71 卻寫 structured source 為唯一教材基準，workflow-and-evidence 仍一律排 source→PBI→guide。

處置：reference 在來源入口明確分 finalized-pptx read-only intake 與 repo 新作。來源忠實度保留；finalized 輸入優先不等於批准新修改或發布。

### 20｜P2｜活動卡 PDF「不生成」與內部 preview 允許衝突

證據：AGENTS.md:209、workflow-and-evidence.md:12 寫活動卡不生成 PDF；AGENTS 的格式段及 teacher-guide-and-materials.md:17 明確允許 10-design 內部 preview。

處置：統一成「交付／authority 活動卡為 DOCX；內部渲染 PDF 可用於 QA，不進 release」。教師朗讀 PDF 是不同 artifact，不應被活動卡規則一起禁止。

### 21｜P2｜教材練習只顯示編號的例外，缺少現行實體活動適用邊界

證據：AGENTS.md:314、PROJECT_REQUIREMENTS.md:201 允許第四課起只留练习n-n＋頁碼；現行活動流程又要求學生能看畫面開始與完成。

判斷：兩者可相容，但必須區分「課本原題已完整提供，學生已打開教材」與「自編投影活動」。目前例外容易被錯用成所有頁面只有標題。

處置：保留原題例外，寫明材料可取得的前提；自編／改寫任務仍保留對象、資料與結果。不自動回加歷史教材全文。

### 22｜P2｜現有檢查不足以防止語義衝突，且一項已失敗

證據：audit_requirements_coverage.py:14 只抓數字 top-level headings；日期追加的段落不在覆蓋模型。audit_lifecycle_wording.py 只找固定句子。test_project_memory_contract.py 只禁止少數固定字串。實跑 coverage/lifecycle/memory 都通過，仍有本報告衝突。requirements registry 測試則在 CLASSROOM-014 owner 缺 backticks 失敗；CLASSROOM-NAV-001 也不符合該測試只辨識單段大寫前綴的 regex。

處置：補規則 ID、scope、supersedes、owner 的結構驗證與真實回歸案例；修 owner 格式與多段 ID 解析。不能把幾個字串測試全綠當作規則一致。

### 23｜P2｜W05 新測驗位置與 skill 的輸出規則不同

證據：weekly-assessment skill 的「每卷交付」要求本學期新卷放 lessons/boya-elementary-i；assessment-management.json:111 的 W05 新卷仍在 course/.../weekly-assessment-review/w05。

處置：先確定這是延用既有審閱包的例外，還是需遷移的新卷；以索引為唯一使用入口，清楚記錄例外。不要只為符合文字而搬檔，避免破壞 Sheet／Form／音頻相對路徑。本次不判定使用者是否另有未記錄的授權。

### 24｜P3｜記憶、工具入口與歷史清理報告含有過時現況

證據：memory/project-memory.md:109 說不存現況，:139 又寫「当前核准」版本／21 頁／7 頁 PDF；:126 與 classroom-tools/README.md 說只用兩套工具，但新增音頻台與 local-gradebook 文件已有操作入口。10/7 rules-cleanup-report 宣稱已移除兩行／三步限制，根 AGENTS:320 卻仍存在。這不能用來斷定它當時未修，也可能是後續回流。

處置：記憶只留持續偏好與實際狀態來源；版本現況移到 current pointer／manifest。工具入口區分現行、可用、歷史與待確認，不自行認定每套都已實際使用。保留舊清理報告作當日證據，新增本次追蹤，不改寫歷史驗收。

### 25｜P3｜規則維護本身缺少退役程序，且 legacy 說明仍指定錯誤通用路徑

證據：agent-workflow-index.md:21 要求 workflow 決定自動更新 ad-hoc memory；但目前執行環境要求明確記憶更新授權。多份入口仍重複教學、字體、媒體、流程。scripts/legacy/README.md:9–10 把所有新 draft 指向 boya-intermediate-i/lesson-01；歷史 rebuild 也指向 archive，與 active generator 不寫 archive 的規則須明確區分。

處置：刪除自動寫全域 memory 的義務，保留「按明確授權同步」。legacy README 只管歷史重現，不能提供新教材通用路由。不要刪整個 legacy 目錄或實驗 skill：先確認 consumers，移除有效入口，再以非探索格式保存必要證據。

## 建議刪除、縮限與保留的項目

| 處置 | 具體內容 |
|---|---|
| 從有效條文刪除 | 一動作一頁、最多兩行／三步、每活動純標題 divider、所有活動強制兩檔、只有當次 request 才算已選風格、兩份 PPTX 才能完成 |
| 改成有範圍的規則 | 線上舊母版／紫色／20 pt；一年級 23 pt；越南文流程圖；課本原題只顯示題號；六張 prototype 的適用製作模式 |
| 轉為歷史方法或版本專用 | 舊 W04 1–10／33 段／約 60 分鐘；舊實體順序 JSON；舊 L01 builders／legacy rebuild 說明 |
| 保留且不能鬆綁 | 真實內容批准、hash、finalized 唯讀、教材與音軌來源、學生資料與答案隱私、外部播放／語義／實播分開、authority／release 分開、覆蓋與可讀性 |
| 不應整批刪除 | 三個專案 skill、舊來源／批准證據、finalized 教材、歷史問卷／答卷、第三方框架 skill、未完成的實驗方案 |

「舊」不等於應刪檔。應先刪除舊指令的有效性；歷史來源和證據仍要保留。使用者已批准的線上版式不能被新的實體課規則一併清掉。

## 防止重演的具體修正設計

建議每個要求只有一個主要擁有者，其餘入口只連結，不複製整段：

| 要求類型 | 建議主要來源 |
|---|---|
| 任務路由與 Adam 安全決定 | 根 AGENTS |
| 身份、批准、狀態、輸出與發布 | canonical-workflow-contract |
| 課程與教材驗收 | PROJECT_REQUIREMENTS，按 cohort/artifact 分範圍 |
| 實體視覺與播放 QA | classroom-html-standard |
| 實體活動與學生可操作性 | classroom-activity-workflow |
| 線上版式與內容資料 | online contracts＋對應 references |
| 測驗現行版本、入口與範圍 | assessment-management＋各卷 manifest |
| 執行方法 | 專案 skills；不重訂權威與完成條件 |
| 長期偏好／理由 | memory；不保存當前完成狀態 |

一條規則的最低登記內容應包含 ID、scope、owner、status、effective date、supersedes、驗證方式。條文改版時，同步查 consumer、模板、JSON、generator、checker、fixture、入口與記憶；沒有更新的列出 blocker。這是修正提案，本次未部署。

應增加的回歸案例：

1. 實體六格故事：一頁、單人、無分級框、無額外 divider。
2. 資料量可容納的活動：不因「三步」或兩行限制拆頁／刪條件。
3. 活動 15 項：路線用實際數量，不縮成四步或插固定第三頁目標。
4. 線上準中級：保留有效版式、雙例句與詞義，不被實體無紫色／23 pt 規則誤擋。
5. PPTX 音頻：XML/package 無音訊物件，Audio 標記與來源逐項對應。
6. W04：舊 exam_id 不能成為目前卷；新卷讀到 5–10 課／15 段；planned duration 不標成實測。
7. 未批准或 hash 已變：新圖片／deck 生產必須阻擋；已批准內容不再詢問風格。
8. HTML 首頁同步：只改預覽，不改來源／批准／release；跨課 workspace 輸出例外要有明確邊界。
9. 全專案規則審查／工具維護：不需要假 lesson-key；run 記錄仍可驗證。
10. 活動卡：DOCX 交付與內部 PDF preview 分開；教師稿 PDF 可正常生成。
11. finalized intake：可讀定稿建立 snapshot，不會因舊 repo source gate 被擋；也不能因此自動批准修改。
12. 技術通過但親聽／試教未完成：回報應清楚區分，不能報教材完成。

除機器檢查外，保留兩次人工式內容審讀：作者能否實際組織活動；沒看過聊天的學生能否開始與完成。這是 agent 模擬審讀，不冒稱學生實測。

## 已執行檢查

| 檢查 | 結果與限制 |
|---|---|
| requirements coverage audit | clear；只確認 9 個編號大段有映射 |
| lifecycle wording audit | clear；8 個必需字串、4 個禁止字串 |
| legacy config audit | clear；掃描 123 個程式檔；有歷史 allowlist |
| active-context consumer audit | review；10 個 legacy／compatibility consumers，不是全部已遷移 |
| lesson identity validator | 通過；28 個 scoped lessons |
| requirements registry tests | 4 項中 1 項失敗：CLASSROOM-014 owner 格式 |
| Boya skill ownership tests | 3 項通過；宣告與檔案存在檢查不等於語義一致 |
| project memory tests | 2 項通過；固定字串檢查未抓到現況混入 |
| 本地 Markdown link scan | 42 筆候選：23 筆歷史備份、13 筆瀏覽器文件快照、3 筆第三方文件、3 筆含行號的跨專案連結。後者可能是掃描器未剝離行號的假陽性；不作有效規則入口損壞的結論。詳見 broken-links.json |

盤點後再次核對 808 份文字檔 SHA-256，未發現變更。這項核對涵蓋盤點中的文字檔；不是所有二進位教材或整個 Git 工作區的逐位元比對。

沒有執行正式生產、發布與教師實播。本次檢查只能支持上述發現與範圍，不能承諾所有未知衝突已消失。

## 修正的完成條件

下一階段應是一輪有範圍的清理：處理上述 25 組問題，先退出衝突的有效條文，再修其 generator／checker／入口，最後跑回歸案例。完成時需交付逐項處置表、修改 diff、測試結果與未解項；不能用「已讀最新規則」作結案證據。

本次僅交付審查與證據，未刪改既有規則。沒有要求使用者批准抽象方案，也沒有替任何課次補批准或更新全域記憶。

