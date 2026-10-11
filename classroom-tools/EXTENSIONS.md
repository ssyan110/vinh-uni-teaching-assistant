# 五項教學工具：使用入口

Adam 目前只使用學生管理系統與抽問系統。這份文件保存 2026-10-04 已開發功能的啟動方式和資料位置，不代表其他工具已採用。程式在本機驗證；聽力服務尚未部署到公開 HTTPS 網址，既有桌面 App 沒有重新打包。

| 功能 | 入口 | 資料與用途 |
|---|---|---|
| 每週教學回顧 | 學生管理系統 → 更多 → 每週教學回顧 | 選班級與日期，查看進度、有效回答、教師反思和待辦；下週調整草稿保存在此瀏覽器，可匯出 Markdown／CSV。 |
| 個別回饋 | 本機教師評分 → 考試設定 → 個人反饋 | 從實際分項與教師備註產生草稿，逐人修改、確認，再匯出可列印 HTML。成績或來源備註改動後須重新確認。 |
| 聽力練習 | 共享服務首頁 → 教師入口／學生入口 | 教師匯入已核對題組、發布指定班級練習；學生用個人進入碼提交，教師批閱與查看未交名單。 |
| 教學任務搜尋 | 本機 `http://127.0.0.1:8767` | 按教材、課次、已教階段、關鍵字和材料找既有任務，查看來源原文及草案狀態。 |
| 口語作品集 | 本機 `http://127.0.0.1:8766` | 保存同一學生、同一任務的第一次與重做錄音、教師證據和回饋，並排播放比較。 |

## 每週教學回顧

在目前這台 Mac 上使用已可執行的 Node 24：

```sh
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
cd /Users/ssyan110/Development/vinh-uni-teaching-assistant/classroom-tools/student-tracker
npm run dev
```

開啟 `http://127.0.0.1:4317`。正式登入會讀取原有教學資料；「使用範例資料」可先試操作。覆蓋率以目前有效修課名冊計算，不能冒充歷史週次的實際名冊。零回答與缺席分開顯示，沒有紀錄就保留未知。

詳細操作與驗證：[學生管理系統 README](student-tracker/README.md)、[每週回顧 QA](student-tracker/qa/weekly-review-2026-10-04.md)。

## 個別回饋

雙擊本專案內 `local-gradebook/启动教师评分.command`，或執行：

```sh
python3 /Users/ssyan110/Development/vinh-uni-teaching-assistant/classroom-tools/local-gradebook/launch.py
```

開啟 `http://127.0.0.1:8765`，先選班級與考試，再到「考试设置 → 个人反馈」。按「为当前名单生成草稿」，逐人核對實際表現，填寫具體的下次練習，確認後保存。匯出只包含完整、有效且已確認的回饋；缺席、未報告和待補評不會變成零分。

資料仍存在原有 `private/gradebook.sqlite3`，回饋與成績分開保存，完整備份包含回饋。若既有服務已啟動，先從原啟動入口正常關閉並重啟，才能載入新增的伺服器路由；不要結束其他用途的程序。

詳細操作與驗證：[本機教師評分 README](local-gradebook/README.md)、[個別回饋 QA](local-gradebook/qa/individual-feedback-2026-10-04.md)。

## 聽力練習

```sh
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
cd /Users/ssyan110/Development/vinh-uni-teaching-assistant/classroom-tools/listening-practice
npm run build
export PUBLIC_ORIGIN="http://localhost:4173"
```

另外設定自己的 `TEACHER_PASSWORD` 環境變數，至少 12 位，再執行 `npm start`。開啟與設定完全相同的 `http://localhost:4173`；請求來源不同時伺服器會拒絕提交。

教師登入後下載流程測試模板，核對並匯入自己的題組，再發布班級練習。題組包含完整教材／課次身份和固定版本；測試模板不屬於已批准教材。每位學生需有獨立的個人進入碼。開放題等待教師批閱，未批閱不記零分；收到成功回執前保留答題頁，網路重試不會重複計分。

新增資料存在 `listening-practice/data/formal-state.json`，舊 JSON 沒有自動遷移。跨網路使用需要有持久化磁碟的伺服器、HTTPS 網址與同源反向代理；設定範例和恢復方式見 [共享服務 README](listening-practice/README.md)。[聽力 QA](listening-practice/qa/listening-formal-2026-10-04.md) 記錄了本機教師／學生流程、權限與重試檢查。

## 教學任務搜尋

雙擊 `teaching-task-search/start.command`，或執行：

```sh
python3 /Users/ssyan110/Development/vinh-uni-teaching-assistant/classroom-tools/teaching-task-search/server.py
```

開啟 `http://127.0.0.1:8767`。選教材、目前已教課次及已完成階段，再查看任務指令和來源原文。查找範圍包含目前課次；沒有細分階段的設計草案，在選擇完成本課後才列出。

目前收錄 49 個來源項目，涵蓋準中級 L02／L03／L09 與中級衝刺 L01 的兩個口語包。初級教材可選，但目前沒有符合 adapter 格式的任務來源；空結果不代表教材沒有活動。頁碼顯示登記的整課範圍，精確任務頁碼請查看原文。搜尋器唯讀，不修改來源或創造教材批准。

詳細範圍與驗證：[任務搜尋 README](teaching-task-search/README.md)、[任務搜尋 QA](teaching-task-search/qa/QA.md)。

## 口語作品集

雙擊 `oral-portfolio/launch.command`，或執行：

```sh
python3 /Users/ssyan110/Development/vinh-uni-teaching-assistant/classroom-tools/oral-portfolio/server.py
```

開啟 `http://127.0.0.1:8766`。建立班級、預覽並匯入名冊，建立任務後選學生。可用麥克風錄音或匯入音訊；確認內容後保存第一次錄音，再將重做連結到同一學生、同一任務的第一次錄音。教師回饋記錄具體證據，不自動推定能力或評分。

音訊與紀錄存在 `oral-portfolio/private-data/portfolio.sqlite3`。請匯出含完整音訊的 ZIP 備份；還原會替換整份作品集，工具先保存還原前的快照。這是教師本機工具，沒有學生雲端上傳或跨裝置同步。

詳細操作、大小限制、備份與驗證：[口語作品集 README](oral-portfolio/README.md)、[口語作品集 QA](oral-portfolio/qa/verification-2026-10-04.md)。
