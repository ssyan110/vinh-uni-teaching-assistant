# 第1–10課聽力測驗：獨立學生角色 audit（未發布）

本報告由 AI 模擬越南初級華語學習者；沒有真人受試者、沒有音質驗收、沒有正式作答或外部提交。先讀學生卷與播放頁，形成困惑後才交叉看教師稿、評分規則與合成清單。只新增本目錄報告，不改題目、音檔、表單或 authority。

使用 `.agent/skills/boya-lesson-production/SKILL.md`、`.agent/skills/boya-weekly-assessment/SKILL.md` 與 harness 指引。身份為 2026-fall / boya-elementary-i 第01–10課（完整lesson_keys見findings.json），assessment W04-L01L10-20261006。先前 agent_loop 第9課初始化不適用累計卷，保留診斷但不視為測驗 blocker。已改用 `production_gate.py --purpose assessment-audio --exam-id W04-L01L10-20261006 --output-dir .../audio-repair-qwen-serena-v01` 唯讀核對，結果 ready、human_audio_acceptance=false。這只證明測驗路由／來源可用，不批准已否決音源，不產生音檔。audit目錄不適用audio-repair輸出gate。

## 最重要五項

1. S01：主頁仍用使用者否決的 Qwen v01，不能據此施測。
2. S02：去角色標籤後，15/18/20/21/23/30 的姓名與「我」缺乏對應；現 v01 有讀出人名，缺口適用去標籤版本。
3. S03：每輪三音節只有兩空，學生缺少「第三音節不用填」說明。
4. S05：漏聽、全班音訊故障、提交失敗與成功確認缺少學生操作規則。
5. S04：手機拼音替代格式與31–36／37–50声調要求不夠完整。

## 方法與證據

學生端：student.md與dashboard.html。教師／答案交叉查核：teacher.md、grading-guide.md、items.json；修訂語音清單只用於檔案推論，不充當親聽。
初次規則中已明確：30選擇＋20填空、每題2分、無口說、可留空、總播放規則與ma3格式。這些不是缺漏。37–50人工核分已允許合理變體；不能把尚待審阅的規則當成已批准。
初次Playwright／沙箱Chrome啟動失敗已由後續獨立CDP測試解決，不再列瀏覽器阻塞。未使用共享Mac互動瀏覽器。
runtime-evidence.json：Node VM合成DOM／audio事件，確認一遍後可切段、錯誤提示、拼音教師提示及33條檔案存在。這不等於真瀏覽器播放或親聽。

## 逐項重現與最小改善

### S01 · blocker · 主頁仍指向使用者否決的 Qwen v01

證據：file_inspection；題號：全卷／控制頁。
重現：開啟 dashboard.html，檢查 track-data 的 file。
預期：只使用明確可施測版本；未批准版本應先停止施測。
實際：33段全部引用 audio-repair-qwen-serena-v01；使用者本次已明確否決。
模擬學生原文：『這是老師決定使用的正式聲音嗎？』
最小改善：先由教師決定音源版本，再檢查頁面映射；不能以 Kokoro 樣本自動替換。

### S02 · high · 去除角色標籤後姓名不可識別

證據：student_reasoning_then_teacher_crosscheck；題號：15,18,20,21,23,30。
重現：只看學生題幹15/18/20/21/23/30；把朗讀稿中的角色標籤視為不朗讀，核對剩餘內容。
預期：聽得出題目指定的小王／小林與說話輪次的對應。
實際：剩餘內容沒有小王／小林自我介紹。15有3人，18/20/21/23靠我的或我，30靠我要；知道教師答案不能補足聽者身份線索。現主頁v01仍讀出逗號人名，本項是去標籤版本的條件性缺口，不冒稱現音檔已去標籤。
模擬學生原文：『我聽到「我」；可是誰是小王？聲音不同也不能告訴我名字。』
最小改善：不改題目；在播放前提供非答案性的角色與聲音對應，並在可用音源中核對輪次；三人對話不能只靠兩種聲音。

### S03 · high · 學生不知道拼音錄音第三音節不用填

證據：file_inspection；題號：31,32,33,34,35,36。
重現：讀 student.md 第31–36題和總說明，再核對 E01/E02/E03-C01 合成清單。
預期：知道每轮三音節，只回答第1和第2；第三是非作答項。
實際：學生卷只說第一／第二音節，沒有第三音節不設題；教師面板才說明。合成清單每輪3項、整組2輪。 Chrome第24段實測可見這句教師提示，學生卷仍缺。
模擬學生原文：『有第三個聲音，可是沒有第三個空；我是不是跳過了一題？』
最小改善：在學生總說明補「每轮听三个音节，只填写前两个，第三个不用写」。不要把實際答案當示例。

### S04 · medium · 拼音輸入與容錯規則學生端不完整

證據：file_inspection；題號：31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50。
重現：閱讀學生總說明與31–36題，再交叉看 grading-guide.md。
預期：手機使用者知道鍵盤替代格式，以及哪些題必須聲調。
實際：學生知道可用ma3；但不知道ü/u:/v等價、空白／大小寫可忽略、37–50拼音可以不標聲調。35–36題幹未明說有聲調，僅總說明要求。人工容錯尚待教師審閱。
模擬學生原文：『鍵盤沒有ü，可以打v嗎？後面的名字也要標每個聲調嗎？』
最小改善：教師確認後向學生補一行非答案例子及分區聲調要求。

### S05 · high · 缺少學生漏聽與提交失敗的恢復規則

證據：file_inspection；題號：全卷／控制頁。
重現：從student.md初次進入，查找漏聽、舉手、網路、送出確認與失敗。
預期：知道如何求助，何時可重播，如何確認提交成功並保留答案。
實際：只寫不會可留空和檢查姓名學號再提交；沒有個人漏聽與全班音訊故障的區別，也没有成功畫面或失敗後重試方法。未開真Form，故不判定其實際保存能力。
模擬學生原文：『剛才沒聲音，我要留空嗎？按提交後沒有成功訊息，我要再按嗎？』
最小改善：施測前公布求助、重播公平規則；補網路失敗時保留本頁、通知教師與成功確認方法。

### S06 · medium · 音訊失敗提示資料夾錯誤

證據：synthetic_runtime；題號：全卷／控制頁。
重現：在隔離Node VM觸發audio:error，核對主頁file路徑。
預期：錯誤指示指向實際引用資料夾。
實際：顯示把dashboard與audio文件夾放同目錄；目前file引用audio-repair-qwen-serena-v01。
模擬學生原文：『老師照提示帶audio資料夾，還是不能播怎麼辦？』
最小改善：錯誤提示列出目前失敗的相對檔案路徑及核對步驟。

### S07 · medium · 播完次數和計時只能靠教師維持

證據：actual_local_browser_and_file_inspection；題號：全卷／控制頁。
重現：獨立Chrome手機viewport：首段play、等1200ms、確認1/2、next；reload；選第24段後about:blank再back。
預期：播放不足可被提示；看題／兩遍間／答題時間有一致操作。
實際：Chrome實際1/2遍可切第2段；reload回第1段0/2，選第24段離頁返回也回第1段0/2。只實作看題計時，其他時間為參考。
模擬學生原文：『還沒聽第二遍就換題了，我能請老師回去嗎？』
最小改善：給教師簡短操作檢查與學生重播求助規則；切段前提示未達計畫次數，保留人工決策。

### S08 · medium · 投影學生可讀性未證，頁面屬教師控制

證據：actual_local_browser_viewport_and_screenshot；題號：全卷／控制頁。
重現：獨立Chrome以390×844開啟dashboard，截圖並取DOM尺寸／input／link計數；1366×768檢查字級。
預期：投影有可辨題號及簡短學生提示；手機答題入口明確。
實際：手機innerWidth390、scrollWidth375，無橫向溢出。首屏大量教師說明，播放器控制需往下捲；整頁input/textarea/form=0、a=0，沒有學生题目與入口。桌面body16px、timing17px。第24段「Nhóm 24 · 31–32 ·24/33」可見，但未標明題與段，並混合中越語。這是教師頁，非已交付學生答題頁。實際投影／手机键盘仍未測。
模擬學生原文：『投影顯示Nhóm 17和17/33，我現在要做第17題嗎？』
最小改善：施測前確認學生Form入口，投影顯著區分「題20–21」和「段17/33」，按實際教室距離驗證大小。

### S09 · medium · 預計時長與實際施測位置仍需教師說清

證據：file_inspection；題號：全卷／控制頁。
重現：比對dashboard、timing.md、scope.md。
預期：學生知道何時開始、結束、預留檢查提交。
實際：按目前主頁33段資料重算約61.78分鐘（3706.9256秒），timing.md仍59.46分鐘，主頁仍55–60分鐘。最新決定是教師自行調整前三節、第四節只測驗，但學生未見具體起訖。不能自行縮題或縮等待。
模擬學生原文：『下課到了，但我還有填空；會關表單嗎？』
最小改善：綁定最終批准音源重算時間；教師施測前宣布本班具體起訖及收卷政策，保留題數。

## 未測範圍

- Actual audible sound, pronunciation and role voice recognizability
- Real Google Form rendering, validation, save/resume, submission and confirmation
- Physical mobile keyboard/touch and projector/back-row visibility
- Real learner completion time or learner performance

音源Qwen v01被否決，Kokoro僅樣本未批准；沒有選定替代音源或假稱任何模型聲音合格。角色標籤問題應在下一個具體音源版本由教師親聽重新核對。

agent-browser 0.33.2 已在使用者提供的絕對路徑驗證，並讀 `/Users/ssyan110/.codex/skills/agent-browser/SKILL.md`；該技能要求先 connect 既有CDP。沒有接管教師端共享CDP或改動其頁面。

## 獨立本地瀏覽器補測（取代先前瀏覽器未測限制）

已按agent-browser技能：啟動專用隔離headless Chrome、/tmp專用profile、CDP9237，使用student-w04-audit先connect再open。沒有變更Chrome安全設定、沒有外部Form作答或提交；測試結束已關閉瀏覽器。browser-log.json保存全套操作與輸出，所有命令exit 0。

- 390×844：01-mobile-entry.png顯示教師頁，無橫向溢出（innerWidth390、scrollWidth375）。第一屏主要是教師內部說明，往下才看控制；無學生題目或答題入口。DOM確認input/textarea/form與a均0。這不代表未發布Form自身有缺陷。
- 第1段實际按play後，完整播放由0變1；next仍可切第2段。reload回第1段0/2。第24段離頁about:blank、back也回第1段0/2。03-desktop-return.png與browser-log.json重現，S07已改為真瀏覽器實測。
- 第24段手機截圖02-mobile-pinyin.png可見題31–32、段24/33與「第三音節不設題」。這證明教師頁有資訊；學生卷仍沒有，S03維持。
- 1366×768：body16px、timing17px；未做實際教室投影。S08已改為viewport／截圖實測，實體手機鍵盤仍未測。
- 直接用瀏覽器開student.md呈現原始Markdown純文字（04-student-md-native.png），非可互動作答頁。這是本地直接開啟行為，不能推論正式Form外觀；學生需明確的交付入口。
- 自行重算現主頁資料為61.7821分鐘，timing.md59.46與頁首55–60有版本漂移；S09在JSON更新，正式時間仍須依批准音源與教師決定。

最重要五項不變。未測範圍收斂為：實際發音／聲調／音箱／人物聲線、正式Google Form及提交／保存／鍵盤、實體手機與投影距離、真人完成時間。技術播放結束與畫面可見不等於音質、人類批准或學生理解驗收。
