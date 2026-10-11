# Project Memory

最後更新：2026-10-07

本文件只保存已確認、會影響未來工作的 durable decisions、scope boundaries 與 rationale。不要把 checkout 狀態、當前 QA 結果、批准狀態、release 狀態或未批准計畫寫入本文件；這些資訊必須從 registry、manifest、QA evidence、authority evidence 與 release inspection 讀取。

## 2026-10-06：仅W04第9–10课课堂与第1–10课综合听力测验

- 用户05:16 UTC取消正式口试，05:20 UTC改为第1–10课综合听力、无口说题，并要求题目、Google Form、Google Sheet database与音频dashboard。随后明确“第四节就做测验就好”，05:42 UTC又决定“沒差 就照原本內容安排 我自己調整前面三節課的時間”。最终为前三段TBL、第四段只测验。仅适用本届一年级2026秋季第一学期W04（10/12–10/18）。
- 本次最新决定优先于10月5日原详案与旧38页方案中的“完整16题9–10听力＋两项正式口语”“口试77分钟”“第3–4节排口试”。旧源文件、Form、Sheet、音频与审核稿保留，不能据旧稿恢复已取消安排，也不能把旧9–10卷冒充新1–10综合卷。
- 取消正式口试不取消课堂听说任务或个人口说证据。仍按独立听力＋独立口头回应动态分层、只免已掌握目标；E／E＋须有新输入与交际目标；反馈后同内容重说，再做新情境／新受众迁移。28人容量，口说观察在前三段覆盖，第4段不安排口语观察；缺证据记NE，不按HSK固定分组。
- 第1–10课综合听力保持30选择＋20填空共50题、无口说。负责人原协议预计59.46分钟（约60），不是实做验证；用户保留原内容并自行调整前三段时间，不再要求时长审批，不擅自压缩题量、改变播放或固定借第3节最后15分钟。原前三段150分钟参考内容＋测验约60共约210；若仍为200分钟，前三段合计调至约140。课堂review与题库／Form／Sheet／dashboard分负责人，不并发修改测验资产，不能声称测验与TBL并行。
- 旧Form只读确认标题《一年级W04｜第9、10课综合听说测验｜审阅稿》，ID `1mtZi715lfJj_yPe0PvHp9IyYXSmcjFFX3g6wy7bi-EU`，仅旧9–10卷线索；不能发给学生冒充新卷。新卷Form同步与学生收件权限由专责核实，不捏造入口或验收。
- 用户05:40 UTC要求信息图明确资料与动作：有A／B／C／D卡就明确写卡名、角色、数据、问答与最终结果，不混用甲乙；公开资料不制造无必要的信息差。简单学习者语言，具体视觉数据与短例句，教师逻辑留在教师说明。
- 当前逐页内容仍需用户明确审核，之后才可按用户要求浏览器生成信息图并组装PPT。不把本次教法／范围决定当作逐页文案、音频听感、发布或成品批准。

## Canonical ownership

- 2026-10-07 06:52 UTC用户明确：线上课PPT维持原状，未来仍以PPT／PPTX优先，保留单词一页与已批准风格；只有实体课因需要灵活调整，才以HTML slides／OpenSlide优先，必要时另备可编辑PPTX。清理旧规则中的“移除PPTX优先”仅指实体课，不适用于线上课。

- 未来实体课HTML优先、视觉／动画／TBL活动与TOCFL风格测验：[`docs/classroom-html-standard-2026-10-07.md`](../docs/classroom-html-standard-2026-10-07.md)，由AGENTS与PROJECT_REQUIREMENTS引用；2026-10-07 06:24 UTC用户明确要求保存。以第9–10课46页HTML为方法参考，取消版不作模板。此持续选择取代实体课旧PPTX默认与重复选风格要求；需要时另备可编辑静态PPTX。线上预习、已完成课次与各自批准保持独立。
- 同一标准保存：白／海军蓝／青绿、无紫色、简体中文；先来源与逐页计划、对象清单和素材contact sheet，再布局；离线资源、清楚指令、具体数据、连贯活动；入页短动画一次、一次按键一页、仅强调有意义变化。保留10月5日独立听说证据、动态路径及反馈后同内容重说。未来TOCFL风格依程度与课程出题，实际出卷核官方规格，不冒称官方题；W04第1–10课30选择＋20填空且无口说仅为本卷特例。本学期一年级产出在 `lessons/boya-elementary-i/`，其他年级沿用自己的教材路径。

- 本届一年级第一学期第9–25课的2026-10-05新教学方法：`docs/course-rules/BOYA-LS-E1-Y1S1-2026F/EFL-REDESIGN-2026-10-05.md`；课程与教材要求仍由 `PROJECT_REQUIREMENTS.md` 管理。

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

## 投影片與 artifact rules

- 未來實體課依2026-10-07標準以HTML／OpenSlide優先，需要時另備原生可編輯、16:9、簡體中文靜態PPTX。其他未另指定的範圍仍沿用原有PPTX流程；舊禁止HTML條文不再適用未來實體課。
- 中文漢字使用 `KaiTi`；越南文與其他 Latin-script 文字使用 `Times New Roman`，只依賴收件人電腦可用的系統字體。
- PPTX遵守適用課程的字級下限（本屆一年級新課23 pt）；HTML依2026-10-07標準按畫布與投影可讀性驗證，不直接套pt字階。
- 使用課本內容的學生端投影片必須顯示由 canonical source 與 slide-level storyboard mapping 推導的教材印刷頁碼；沒有課本內容的頁面不加多餘標記。
- 圖片必須支援情境、理解、比較、證據或記憶；素材來源、製作方式、授權狀態與使用位置要記錄。缺失或待審核素材不得以無關、泛用或未批准素材替代。
- 活動卡只交付可編輯 DOCX，不把活動卡 PDF 放入 release；`10-design` 可產生內部 preview PDF 作 QA。
- 教師手冊是 instructional source of truth，必須先完成並批准，再升級完整 authority PPTX；PPTX 不得反過來決定本課應教內容。
- 已批准 artifact 是 immutable reference；人工修訂必須另存 draft，經明確批准後才可更新 authority。不要自動覆蓋人工修訂。
- Adam 於 2026-09-15 確認：本課程未來 PPT 的第 1 頁不使用通用文案「聽一聽 · 讀一讀 · 說一說」；單個聲母／韻母等獨立拼音文字頁只保留文字，不使用圓形背景。既有 approved PPTX 不自動回改。
- Adam 於 2026-09-18 確認：全套《初級起步篇 I》PPT 的學習流程圖沿用第一課同一種四步橫向版式、留白、箭頭、色塊、插畫比例與文字層級；後續課次只替換越南文步驟文字和對應插畫，不另起一套流程圖風格。
- Adam 於 2026-09-27 將其第4–6課定稿的視覺命名為「OpenAI Education」，要求作為全專案 PPT 可選風格；登記見 `course/ppt-style-registry.json`。2026-10-07起未來實體課已有持續HTML風格選擇，不再重問；其他未指定範圍仍先選登記風格。PPTX繼續遵守適用字級下限，HTML按新標準的畫布與投影可讀性處理。
- Adam 於 2026-10-03 明確要求：「就是直接寫 Audio n-n 之類的。」未來本專案 PPT 的相關頁右上角只放不可點擊純文字 `Audio n-n`，沿用正確來源音軌，不按投影片重編；不嵌入音檔、不放播放按鈕／喇叭圖示或可播放音頻連結，標示不使用紫色、色塊或按鈕外框。PPT 外來源音檔與使用者檔案保留，播放與語義驗證另行記錄。現行規則由 `AGENTS.md` 與 `PROJECT_REQUIREMENTS.md` §3.2C 管理；歷史成品與批准不因這項未來偏好自動回改。

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

## 2026-10-05：本届一年级第9–25课的新教学方法

- Adam明确要求将 `course/offerings/2026-fall/博雅汉语听说初级起步篇一/Boya_Y1_EFL_Redesign_20261005/` 的新方法加入项目记忆。仅用于2026秋季一年级第一学期、`boya-elementary-i`、第9–25课；其他班级、教材和既有成品不自动回改。后续生产先读上述本班专用规则及当课源文。
- 保留博雅词语、句式、听力和练习覆盖；按具体目标的独立听懂与口头回应证据免除已掌握的重复练习。总分、HSK自报或较早做完均不能直接免整课；口说未核实者先暂定路径并补查。
- 核心＋支持、延伸E、E＋是当堂学习路径，按证据调整，不是固定HSK分组。共同主题与必要结果允许不同输入、任务和语言目标；已证实掌握者不被强迫回做免除的操练。此项取代本班旧规则中“全班同类核心任务”被解释为人人同输入、同重复练习的要求。
- 延伸必须提供新输入与新的交际学习：澄清、观点对读、证据核证、消费评论、叙事或受众适配等；增加预算计算、路线、限制或工作量不足以构成高级挑战。熟练者须有个人学习证据，不长期担任低程度学生助手。
- 每周四节各50分钟：两节单课P（首检、按需输入、互动、反馈、同内容重说、退出），一节跨课深化D，一节反馈改进与迁移T。另备约30分钟可替换活动，按真实进度择用，不能叠为230分钟或计入课外视频。
- 先说→听者复述理解与一条具体反馈→同内容换听者重说→新情境／新受众迁移。不能用单纯改变条件代替反馈后的同内容改进。说话时长按当前能力选择，不把越快越好当普遍目标。
- 每节每人留下独立信息答案和可核验口语证据；教师轮换重点观察约6–7人，其他学生的同伴记录／录音／后续抽查不能被记成教师已观察。27人可用9组三人轮换，实际人数重新计算；无证据记NE，真实施测但未完成与缺失分开。
- E仍过易时，选新的E＋输入或15–25分钟阅读／听力契约；教师至少隔周一次2–3分钟面谈。自主广泛阅读可用约15分钟并轻记录，不把每篇变为摘要与词汇作业；契约占用已有时段。
- 对读材料属于阅读，不能冒称听力；先听大意再听必要细节，按目标决定重听与免练，不全班机械两遍。私有角色卡与A/B读本分开提供，不公开整份隐藏信息或听力逐字稿。当前无打印要求优先，照片分发须只取本人资料。
- 常规周测验仅测当周实际教过及确已学基础语言，轻量6–8选择＋2短答约10–15分钟并轮换口语观察。W04现按上方2026-10-06最新决定为第1–10课综合听力，不含正式口说题；旧“16题9–10听力＋2个人口语”是历史源案，已取消。新迁移须未公开平行语料；原始分不换算HSK／TOCFL、不改学校成绩比例。
- 源案是教学方法与本班原创材料的组合；新方法记忆不等于逐页文案、音频听感、课堂试行、考试日程或发布批准。外部选读为候选，未核全文、付费与录音者不宣称已验证。W04依上方最新用户决定保留约60分钟原测验，教师自行调整前三段；不把150＋60写成200。

## 2026-10-05：今后PPT设计参考

- Adam提供beautiful-ppt与Awesome-PPT-Design-Skills，授权择优。今后本教学项目PPT优先采用后者兼容的声明式版式／QA，前者补充数字事实保真和几何检查；范围与优先级见 `docs/ppt-design-reference-2026-10-05.md`。保留现有色板、字体、字级、纯文字Audio与教法，不自动安装、执行、部署或上传。Adam随后明确授权将兼容声明式规则追加到Mac Codex用户级指令；已备份并完成，不改变PowerPoint设置或旧成品。

## Status source of truth

本文件不保存任何 current checkout status、approval、QA pass、authority 或 release readiness claim。需要判斷狀態時，依序查閱：

1. `course/lesson-registry.json` 與 selected `LessonContext`。
2. 該課 `00-source/`、`10-design/`、`20-approved/`、`30-qa/`、`40-release/` 的實際 evidence。
3. `scripts/production_gate.py`、`scripts/verify_lesson_authority.py`、`scripts/build_release_package.py --plan` 或 `--inspect` 的 read-only 結果。
4. 明確 human approval、playback、rehearsal 與 release authorization records。

任何 summary、聊天記錄或 memory entry 都不能取代上述 source of truth。


## 2026-09-21：仅本届大一第一学期的课程路由

仅当年级=大一、学期=第一学期、日期=2026-09-21至2026-12-27、教材=`boya-elementary-i`同时匹配时，先读[本班课程规划与第四课起PPT制作规则](../docs/course-rules/BOYA-LS-E1-Y1S1-2026F/README.md)（`BOYA-LS-E1-Y1S1-2026F`）。按任务结果组织第四课起PPT，教材逐项覆盖；W02安排第4—6课，W12完成首轮覆盖、W13缓冲、W14评量规划。该局部规则取代本班旧课时预算与线性栏目顺序，不扩展到其他年级、学期或未来班级，不改共用offering顶层课表。现有教材与批准不回改；新版逐页内容仍须单独批准。新增双语说明仍待逐页决定，23 pt下限保持。


## 2026-10-04：目前使用的教學系統

- Adam 明確表示已停用舊「課跡」名稱／桌面工具，目前只使用學生管理系統與抽問系統。未來建議與開發以這兩套系統為準，不再把舊名稱列為使用中的獨立產品。
- 現行學生管理系統的原始碼仍位於 `classroom-tools/student-tracker/`，網頁名稱為「荣市大学_学生管理系统」；抽問系統位於 `classroom-tools/classroom-randomizer/`。移除舊桌面包裝不得刪除共用原始碼、教學紀錄或抽問同步資料。

## 2026/10/12起上课作息

2026/10/12起（Adam于2026/10/10确认）：上午上课及下课延后30分钟，下午提前30分钟；每节50分钟，课间5分钟，每次4节净教学200分钟。NNTQ1周一、LT_03周五07:55–11:30；LT_01周三、LT_02周四13:00–16:35。教室与节次不变；先前日期保留旧作息，二年级军训停课2026/10/05–11/01保持。
