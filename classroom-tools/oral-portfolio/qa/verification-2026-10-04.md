# 口語作品集驗證

實作範圍：獨立 `classroom-tools/oral-portfolio`。沒有修改 student-tracker、lesson authority、真實學生資料或部署環境。

## 已完成

- Python stdlib loopback server（127.0.0.1:8766）、SQLite metadata＋音訊 BLOB persistence。
- 班級獨立 student code、stable IDs、CSV 預覽／確認匯入；同班同學號保留 ID。
- 教師以教材名稱與課次標題選擇來源，唯讀查詢 `textbooks/registry.json`／`course/lesson-registry.json`；內部存完整 lesson_key，外部任務明確標記。教材標題保留原登記文字，沒有轉寫來源或新增批准。
- 第一次／重做音訊保存及同學生同任務的 explicit first_id 配對；實際 MediaRecorder 支援探測與音訊匯入 fallback。
- 先停止／播放確認／保存；取消丟棄本頁草稿，錯誤保留重試路徑。麥克風失敗保留匯入功能。
- 教師證據／回饋可修改；多筆歷程未保存文字用 per-take draft map 保留，保存一筆不會清掉另一筆。離開提示及還原前保存限制。
- SQLite restart 可讀回，BEGIN IMMEDIATE＋revision 阻擋過期視窗及其他資料連線覆蓋。
- 完整 ZIP metadata＋original audio bytes；raw ZIP restore 接明確 revision header，避免 JSON/base64 上限阻擋完整容量備份。先完整驗證，再先寫 pre-restore ZIP snapshot，transaction 取代資料。
- Host／Origin／Sec-Fetch-Site 防護；固定靜態頁白名單、no-store、CSP、nosniff；資料 root 預解析拒絕 symlink components、root/home/mount target。沒有 AI 評分。

## 技術驗證

- `python3 -m unittest -v`：9 tests 通過。
- identity／重做同學生同任務／同班同學號更新、跨班獨立學號；bare lesson id 被拒絕。
- backup original WAV bytes roundtrip、restore-before snapshot、restart；corrupt ZIP、traversal／absolute／unknown backup entries 被拒絕且原資料保持。
- MIME／signature mismatch、單段限額、總容量上限及無 partial audio insert；近音訊 quota 的完整備份可自行還原、metadata／collection 超限回滾新增 audio insert；重複 CSV 學號拒絕；同一 revision 並行寫入一成一拒絕；兩個 Store connections 過期 revision 被拒絕。
- HTTP Host／Origin／cross-site 拒絕；非 JSON object payload 拒絕；音訊 HTTP read-back bytes 相同；raw ZIP restore 在縮小一般 JSON body cap 的測試下通過，證明使用獨立 ZIP 上限路徑。
- `python3 -m py_compile server.py`：通過。
- 現有 Node v24.19.0 `node --check web/app.js`：通過。
- `qa/browser-check.mjs`：系統 Chrome headless，隔離合成班／學生／任務，fake-media microphone，desktop 1440px、mobile390px。完成名冊預覽匯入、教材／課次 selector、第一次及重做实际錄製、保存、reload 後兩筆 persistence、雙 audio 實際播放、完整 ZIP 下載及 UI 還原、兩筆 history draft 保存其中一筆另一筆仍保留、cancel、mic denied fallback；零 pageerror、手機無整頁橫向溢出。
- Screenshot：`qa/oral-portfolio-desktop.png`、`qa/oral-portfolio-mobile.png`。目視顯示選擇、錄音、對照、作品歷程與備份可操作；Chinese KaiTi／Latin Times New Roman。

## 證據邊界與限制

瀏覽器測試只使用假麥克風和合成資料。沒有真實學生錄音、實體麥克風、Safari 或各種來源 codec 的全面播放驗證；簽章檢查不是完整 codec 解碼。每段20MB、已保存音訊250MB、metadata2MB、各集合10000筆、完整ZIP254MB、單次錄音10分鐘。達容量需先完整備份並另指定新的資料目錄，不自動刪除聲音。未保存錄音／教師文字仍是本頁草稿；沒有雲端同步、加密或正式評分。作品集工具需留在本專案中才能讀教材 selector registry；已保存備份與音訊本身可攜。SQLite 防過期更新，但仍建議每個資料目錄只啟動一個 server process。

所有 browser test 資料位於已忽略的 `qa/test-data/`；預設 `private-data/` 沒有被測試建立。`.gitignore` 排除兩者；合成音訊沒有進入權威課程材料或 Git。

## 交付檔案

`server.py`、`test_server.py`、`web/index.html`、`web/app.js`、`web/style.css`、`launch.command`、`.gitignore`、`README.md`、`qa/browser-check.mjs`、本報告、兩張 screenshots。
