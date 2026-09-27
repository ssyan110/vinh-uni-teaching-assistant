# Project Memory

最後更新：2026-09-06

本文件只保存已確認、會影響未來工作的 durable decisions、scope boundaries 與 rationale。不要把 checkout 狀態、當前 QA 結果、批准狀態、release 狀態或未批准計畫寫入本文件；這些資訊必須從 registry、manifest、QA evidence、authority evidence 與 release inspection 讀取。

## Canonical ownership

- 課程、教材、內容與 artifact acceptance：`PROJECT_REQUIREMENTS.md`。
- Lifecycle、gate semantics、artifact states、lesson identity、output safety 與 run-packet boundary：`docs/workflow/canonical-workflow-contract.md`。
- Requirements indexing：`docs/workflow/requirements-registry.md`。
- Lesson identity 與 derived paths：`course/lesson-registry.json`、`scripts/lesson_context.py`。
- Agent-facing coordinator：`scripts/lessonctl.py`。
- `boya-lesson-production` 是 artifact-specific procedure skill，不取代 canonical workflow contract；其 ownership map 位於 `.agent/skills/boya-lesson-production/references/ownership-map.md`。

## 課程與教材 identity

- 課程核心技能是 listening + speaking；課堂工作以理解、互動、口語呈現、回饋與重做為中心。
- 學生已完成《博雅漢語聽說：初級起步篇》第一、二冊。
- 本學期教材範圍是《博雅漢語聽說：準中級加速篇 I》十二課；《中級衝刺篇 I》保留為獨立教材範圍，不能互相覆蓋或解鎖。
- `lesson-01` 只在單一教材內有效。跨檔案、dashboard、QA、generator、authority 與 release 一律使用 `<textbook_id>:<lesson_id>` 格式的 `lesson_key`，必要時帶 `offering_id`。
- `boya-quasi-intermediate-i:lesson-01` 與 `boya-intermediate-i:lesson-01` 是兩個不同 identity；任何來源、PPTX、教師手冊、QA、authority 或 release evidence 不得跨教材替代。
- 每課實體課時依該冊教材實際課數、內容量與正式課表分配；每節 50 分鐘、每次上課通常 4 節／200 分鐘。線上學習是課外額外準備，不折抵、替代或縮減核准實體課時。
- 不從裸課號、舊聊天記錄或另一教材 active context 推定 identity。

## 已確認的教學習慣

- 學生課前自行閱讀指定教材、聽指定音檔、標記卡點，並準備個人資料、問題或調查結果。
- 課堂先回收預習證據，再進入聽力理解、同伴問答、資訊差活動、口語練習、個人發表、回饋與重做。
- 不以逐字翻譯、逐詞講解或長篇句式講義取代聽說任務。
- 詞語與句式採 just-in-time repair；直接講解原則上每節不超過 5 分鐘。
- 未預習學生使用 3–5 分鐘 recovery route，之後回到同一任務。
- 教學設計使用 ACTFL Proficiency-Based Instruction 的 interpretive、interpersonal、presentational 三種模式；action-oriented task 必須有角色、條件、合作產出與可觀察個人證據。
- 線上／實體分流必須按每個 `lesson_key` 保存 boundary confirmation；該記錄只確認內容分工，不等於來源、PBI、教師手冊、PPTX、playback、rehearsal、authority 或 release 批准。

## PPTX-only 與 artifact rules

- 核心課堂媒體是原生可編輯、16:9、以簡體中文為主的靜態 PPTX；不使用 HTML source deck、HTML presenter、HTML animation，也不把 HTML 作為必要中間格式。
- 中文漢字使用 `KaiTi`；越南文與其他 Latin-script 文字使用 `Times New Roman`，只依賴收件人電腦可用的系統字體。
- 新課學生端投影畫面可見文字不得低於 20 pt；speaker notes、教師手冊與活動卡不受此 PPT 顯示限制。
- 使用課本內容的學生端投影片必須顯示由 canonical source 與 slide-level storyboard mapping 推導的教材印刷頁碼；沒有課本內容的頁面不加多餘標記。
- 圖片必須支援情境、理解、比較、證據或記憶；素材來源、製作方式、授權狀態與使用位置要記錄。缺失或待審核素材不得以無關、泛用或未批准素材替代。
- 活動卡只交付可編輯 DOCX，不把活動卡 PDF 放入 release；`10-design` 可產生內部 preview PDF 作 QA。
- 教師手冊是 instructional source of truth，必須先完成並批准，再升級完整 authority PPTX；PPTX 不得反過來決定本課應教內容。
- 已批准 artifact 是 immutable reference；人工修訂必須另存 draft，經明確批准後才可更新 authority。不要自動覆蓋人工修訂。
- Adam 於 2026-09-15 確認：本課程未來 PPT 的第 1 頁不使用通用文案「聽一聽 · 讀一讀 · 說一說」；單個聲母／韻母等獨立拼音文字頁只保留文字，不使用圓形背景。既有 approved PPTX 不自動回改。
- Adam 於 2026-09-18 確認：全套《初級起步篇 I》PPT 的學習流程圖沿用第一課同一種四步橫向版式、留白、箭頭、色塊、插畫比例與文字層級；後續課次只替換越南文步驟文字和對應插畫，不另起一套流程圖風格。
- Adam 於 2026-09-27 將其第4–6課定稿的視覺命名為「OpenAI Education」，要求作為全專案 PPT 可選風格。每次開始新 PPT 前，若本次要求未指定風格，先詢問採用哪個登記風格；登記見 `course/ppt-style-registry.json`。此全專案風格偏好不改變一年級第一學期其他新課的 23 pt 最低字級。

## Workflow 與 safety boundaries

- Adam 於 2026-09-19 明確糾正：架構／練習標題批准和「開始／繼續本課流程」都不是具體內容批准。先交逐頁內容审阅稿，取得該版本明確批准後，才生成圖片、prototype 或 PPTX（含 draft）。使用 canonical contract 的 hash-bound content approval；不得自行補寫人類批准。

- 所有新操作先解析 explicit `lesson_key` 與 `offering_id`，使用 `LessonContext` 取得 source、design、authority、QA 與 release paths。
- generator 只寫 `10-design/` 或 run-scoped staging；不得寫入 `20-approved/`、`30-qa/`、`40-release/` 或 archive。
- `20-approved/` 是唯一 authority source；release 只能從 authority 複製，不在 release 目錄重新生成教材。
- 技術驗證、human review、approval、authority、promotion、rehearsal 與 release 是不同狀態；任何 technical pass 都不能自動成為 approval 或 release readiness。
- `agent_loop`、run packet、external check 與 hash-pinned evidence 只記錄 execution evidence，不能批准內容、取代 authority 或發布 release。
- release 必須先有 scoped read-only plan、fresh ready status、explicit authorization、exact repeated release ID、transaction staging、hash／bytes／tree／CRC read-back 與 scoped verifier；不能宣稱普通 filesystem 提供全域 atomicity。
- `--inspect` 只診斷 transaction、pending、rollback 或 partial state，不自動 cleanup、repair 或 recovery；crash state 必須人工檢查與明確授權。
- symlink、path traversal、cross-lesson／cross-textbook identity、duplicate source、portable-name collision、malformed schema、missing human gate 與 protected output 都 fail closed。

## Legacy policy

- `project.config.json` 的 `legacy_compatibility` block 與 `scripts/legacy_active_config.py` 只服務 historical active-context builders、migration adapters 與舊 synthetic fixtures。
- `build_lesson_01_*` historical family、`scripts/legacy/` 與 retired coordinator 不得作為新 lesson production entry point。
- `scripts/run_lesson_production.py` 已退休；新工作使用 `scripts/lessonctl.py` 與 canonical contract。
- `archive/` 與舊 HTML／legacy outputs 只作 historical evidence，不是新的生成輸入或交付來源。
- 舊教材 `boya-intermediate-i:lesson-01` 的歷史 evidence 必須維持獨立 identity；不能被拿來批准或解鎖準中級課次。

## Status source of truth

本文件不保存任何 current checkout status、approval、QA pass、authority 或 release readiness claim。需要判斷狀態時，依序查閱：

1. `course/lesson-registry.json` 與 selected `LessonContext`。
2. 該課 `00-source/`、`10-design/`、`20-approved/`、`30-qa/`、`40-release/` 的實際 evidence。
3. `scripts/production_gate.py`、`scripts/verify_lesson_authority.py`、`scripts/build_release_package.py --plan` 或 `--inspect` 的 read-only 結果。
4. 明確 human approval、playback、rehearsal 與 release authorization records。

任何 summary、聊天記錄或 memory entry 都不能取代上述 source of truth。


## 2026-09-21：仅本届大一第一学期的课程路由

仅当年级=大一、学期=第一学期、日期=2026-09-21至2026-12-27、教材=`boya-elementary-i`同时匹配时，先读[本班课程规划与第四课起PPT制作规则](../docs/course-rules/BOYA-LS-E1-Y1S1-2026F/README.md)（`BOYA-LS-E1-Y1S1-2026F`）。按任务结果组织第四课起PPT，教材逐项覆盖；W02安排第4—6课，W12完成首轮覆盖、W13缓冲、W14评量规划。该局部规则取代本班旧课时预算与线性栏目顺序，不扩展到其他年级、学期或未来班级，不改共用offering顶层课表。现有教材与批准不回改；新版逐页内容仍须单独批准。新增双语说明仍待逐页决定，23 pt下限保持。
