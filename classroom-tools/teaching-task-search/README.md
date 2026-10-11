# 教學任務搜尋

教師在本機瀏覽專案現有任務。選教材、課次、已教範圍與目前課次已完成的階段，再用關鍵字或所需材料縮小結果。查看原始任務指令與教師來源原文後，再決定是否使用。

啟動：

```sh
python3 /Users/ssyan110/Development/vinh-uni-teaching-assistant/classroom-tools/teaching-task-search/server.py
```

開啟 <http://127.0.0.1:8767>，或雙擊此目錄的 `start.command`。只監聽 localhost，預設 port 8767；可用 `--port` 更換。Python 標準庫與專案現有 Node 24 即可執行（本機優先使用 `/opt/homebrew/opt/node@24/bin/node`，其他電腦回退至 PATH 的 `node`），不需安裝套件。停止時按 Ctrl+C。

## 來源與範圍

- 每次搜尋重讀 `course/lesson-registry.json`、`textbooks/registry.json` 與允許的來源，不需另外建立索引，也不寫入課次資料。
- 準中級加速篇 I：現有 `10-design/support-materials` 的活動索引列、活動／預習卡／課末檢查 Markdown，以及教學設計中明確標為「任务主线」的段落。皆標為設計草案；不因教材全冊完成而把個別設計文件升為批准。
- 中級衝刺篇 I：既有 speaking-challenge 的 `lesson-01-p1-p2.js` 與 `lesson-01-complete.js` 中全部任務。這是 2027 規劃教材，與準中級第一課分開。工具內容的教材批准尚未核實。
- 初級起步篇 I：教材身份可選；目前 adapter 沒有符合上述格式的任務來源，結果為空。先修詞語表只作唯讀參考，不冒充已批准活動。
- 未納入 PPTX、DOCX、教材原文、歷史 archive、私密文件或任意檔案。索引不是全專案教材盤點。

課次範圍包含目前課次；前面各課視為已完成。目前課次以階段過濾：早期 speaking pack 須完成聽說（一）口語句式，完整 pack 須完成聽說（二）。未細分階段的草案保守地等本課完成才列出。這是查找條件，不會登記學生進度或推定老師目前教到哪裡。

任務文字取自來源，保留簡繁用字。搜尋支援常見簡繁字對照（僅搜尋比較，不改顯示文字），未涵蓋的字請依來源用字搜尋；空白可分隔多個關鍵字，全部須匹配。材料條件比對來源列出的材料名稱，不推測所需設備。教材印刷頁僅顯示 registry 已登記的**整課範圍**，不把整課頁碼當任務精確頁碼；缺資料就明示未登記。查看來源中的任務頁碼與指令。

來源預覽使用索引內的固定雜湊 ID。請求不能指定檔案路徑；解析到專案外、archive／private 或任一 symlink 父目錄的來源會拒絕。來源缺失或 Node 讀取失敗時啟動會顯示錯誤；執行中的來源讀取失敗回傳 503，介面保留明確錯誤提示。顯示來源路徑和 SHA-256，便於核對；不允許透過 UI 修改來源。JS adapter 在有 timeout 的獨立 vm 讀取兩份固定可信來源；不執行來自搜尋輸入的程式。

## 驗證

```sh
cd /Users/ssyan110/Development/vinh-uni-teaching-assistant/classroom-tools/teaching-task-search
python3 -m unittest -v
/opt/homebrew/opt/node@24/bin/node browser-qa.cjs
```

瀏覽器驗證須先啟動伺服器，使用專案既有 Playwright 和已安裝 Chrome。證據在 `qa/`；技術驗證不代表教學批准或學生實測。
