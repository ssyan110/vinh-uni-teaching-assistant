# 口語作品集

教師單人使用的本機工具。保留同一學生、同一任務的第一次與重做錄音，提供對照播放、作品歷程及教師證據／回饋；沒有自動評分、AI 分析、登入或雲端同步。與 student-tracker 分開保存。

## 啟動

需要現有 Python 3.10+ 及支援 MediaRecorder 的瀏覽器；無第三方 Python 套件。

雙擊 `launch.command`，或在此資料夾執行 `python3 server.py`。開啟 [http://127.0.0.1:8766](http://127.0.0.1:8766)。保留終端機視窗；結束時按 Control-C。服務只綁定 127.0.0.1，使用確切的此地址，不能改成 localhost 或公開部署。麥克風需要瀏覽器授權，localhost loopback 視為可使用麥克風的安全來源。

預設資料：`private-data/portfolio.sqlite3`，包含 metadata 和錄音 BLOB。不要只複製網頁或瀏覽器儲存空間；全部已保存資料都在 SQLite。`private-data/` 已由 .gitignore 排除，錄音不進 Git。`--data-dir /明確/資料目錄` 可指定另一個安全目錄；拒絕 root、home、mount point 與 symlink components。不要同時從多個服務程序操作同一資料庫。SQLite transaction 與 revision 防止過期視窗／連線覆蓋較新的資料。

## 使用

1. 建立班級，預覽 CSV 名冊後確認匯入。標題為 `學號,姓名` 或 `student_code,name`；同班同學號保留學生識別並更新姓名，不同班同學號獨立。這是作品集名冊，沒有自動同步外部名冊。
2. 選學生、建立任務。教材任務選擇教材名稱與課次標題，系統讀取專案 `textbooks/registry.json` 與 `course/lesson-registry.json`，內部保存完整 `textbook_id:lesson-XX`；教材外任務勾選明確標記。工具須保留在本專案中以讀取登記資料。任務識別不是教材 authority。
3. 第一次：開始錄音、停止、播放確認、填教師證據／回饋、保存。重做：選同一學生任務的第一次，再錄製與保存。
4. 對照區只能配對同一學生、同一任務，重做明確指向第一次。作品歷程保留該學生在此班所有錄音；可修改教師證據與回饋。錄音不自動轉檔或重新評分。
5. 定期下載完整 ZIP。要還原時選 ZIP、勾選取代確認，再還原。還原前會在目前資料目錄的 `backups/before-restore-<id>.zip` 保留完整快照；驗證失敗不改資料。

未保存錄音是頁面草稿；取消不碰已保存資料，儲存失敗會保留草稿以便重試。離開頁面前先保存。歷程中多筆教師文字草稿會在本頁重繪或切換學生時保留；重新整理／關閉前會提示，還原前須先保存。別的視窗更新後，過期保存會拒絕；先匯出／保留教師文字，取消未保存片段，再重新載入。不要把草稿或技術檢查當成正式評量。

## 音訊、容量與備份

支援匯入 WAV、MP3、WebM、OGG、M4A／MP4；伺服器檢查 MIME、容器簽章與大小，沒有完整 codec 解碼器。實際播放依瀏覽器及編碼：Chrome 的 WebM/Opus 已用合成麥克風驗證；Safari 通常採 MP4/AAC，但未在 Safari 實機驗證。音訊不能播放時保留錯誤提示，可改用來源軟體匯出 WAV／MP3。錄音格式由 `MediaRecorder.isTypeSupported` 選取；沒有麥克風或授權失敗可匯入音訊。最長一次錄音 10 分鐘。

每段 20 MB、已保存音訊總量 250 MB；文字／名冊 metadata 最多 2 MB，各集合最多 10000 筆。ZIP 含 metadata 和容器開銷，上限 254 MB；匯出與還原限額一致。達上限先下載備份，若需新資料庫，可另指定新的空資料目錄，不自動刪除舊錄音。CSV 最大 100 KB／1000 筆。ZIP 備份含 `portfolio.json` 和 `audio/<stable-id>.<ext>` 原始 bytes；目前版本 1。還原嚴格拒絕未知／重複路徑、path traversal、symlink entry、加密檔、超限解壓內容、缺音訊、身份或首次／重做配對錯誤。還原使用 raw ZIP 與明確 revision header，支援完整容量備份，不受一般 JSON upload 的 30 MB 上限影響。

資料只在本機，沒有應用層加密；電腦帳號／磁碟權限及備份位置由教師管理。匯出 ZIP 含學生姓名與聲音，請按學校資料政策保管。

## 驗證

`python3 -m unittest -v`；Python syntax：`python3 -m py_compile server.py`。瀏覽器 QA 只對隔離的合成班級／假麥克風執行，腳本在 `qa/browser-check.mjs`，需專案既有 Playwright 與已安裝 Chrome，無需新增套件。詳見 `qa/verification-2026-10-04.md`。沒有部署或真實學生錄音測試。
