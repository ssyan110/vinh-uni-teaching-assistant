# 每週教學回顧：實作與驗證

範圍：`classroom-tools/student-tracker`。新增 `/weekly-review`，由「更多 → 每週教學回顧」進入。保留既有未提交變更；沒有部署、資料庫 migration、遠端寫入或教材 authority 變更。

## 完成的行為

- 班級與含起迄日的日期範圍；預設越南時間的週一至週日。以已連結的課堂日期統計，不以延後登錄回答的日期取代課堂日期。
- 顯示已登記／已結束課堂數、實際進度、教師明確登記的共同問題、有效做法及原課堂調整。空白標示未記錄，沒有自動推測問題或學生能力。
- 沿用 `participationRecords` 有效回答、更正／撤銷排除、鏡像去重語義。回答學生分子採 distinct student；分母為目前可辨識的有效修課學生，去重 enrollment。另列不屬目前名冊的回答及缺少學生資料的修課數。
- 零回答和明確登記缺席分列；出席記錄覆蓋以目前名冊學生×所選場次為分母，不把空白當作出席。
- 全班目前全部未完成待辦，明確標示包含日期範圍外及未設日期者；可回到待辦、學生、來源課堂與場次回答紀錄。待辦 row hash target 新增定位及捲動。
- 下週調整為明確標示的裝置本機草稿，按模式、owner、班級、起迄日期隔離；明確按「儲存草稿」後保存。沒有修改課堂反思或產生待辦。儲存失敗顯示可匯出保留。
- Markdown／CSV 匯出包含摘要、反思、學生、待辦、草稿及來源 URL。URL 使用當前 app origin；CSV 延用公式注入防護。

## 驗證

使用現有 Node v24.19.0：`PATH=/opt/homebrew/opt/node@24/bin:$PATH`。

- `npm run typecheck`：通過。
- `npm run test`：11 個檔案、43 項測試通過，含 4 項新增每週回顧測試。
- `npm run build`：通過，176 modules。
- 新增測試：越南／UTC 日期跨日與跨年週界；無效與反向日期；確切班級／場次／日期範圍；已更正回答、legacy mirror 排除；有效修課分母去重與缺失名冊；未確認出席及零回答分離；教師反思保真；日期外 open followup；匯出來源 URL 及 CSV 公式防護。
- `node qa/weekly-review-browser-check.mjs`：隔離、未登入的 Chrome demo；更多入口、日期操作、草稿保存／重新載入、Markdown／CSV 下載、待辦 hash 定位、反向日期錯誤、390px 手機版無整頁橫向溢出、沒有 JS pageerror。未寫入真實教學資料。
- 目視檢查手機 screenshot：篩選器、分母說明、反思、學生表、待辦及草稿可見；表格可在自身容器橫向捲動以閱讀來源課堂。保持既有管理頁視覺與字體。
- 截圖：`qa/weekly-review-desktop.png`、`qa/weekly-review-mobile.png`。

## 限制

目前名冊沒有 enrollment 生效／退選日期，因此覆蓋率不能代表歷史週次的實際名冊。無登記課堂、缺失資料與未確認出席都保留為未知，不推定沒有上課或缺席。待辦沒有建立日期，因此此處列出「目前」全部 open 待辦，沒有宣稱為當週新增。草稿只保存在此裝置，不會跨裝置同步。匯出的來源 URL 需從同一 app 地址登入後開啟；本機／desktop origin 並非跨裝置分享網址。未執行真實 Supabase 帳號端到端測試或正式教師使用驗收。

環境紀錄：Node22 路徑存在，但啟動時缺 `libsimdjson.29.dylib`；改用現有可运行 Node24，沒有安裝或修改全域環境。Playwright bundled browser 不存在，使用已安裝的 Chrome channel。

## 檔案

新增：`src/pages/WeeklyReviewPage.tsx`、`src/utils/weeklyReview.ts`、`src/utils/weeklyReview.test.ts`、`qa/weekly-review-browser-check.mjs`、本報告及兩張 screenshot。

最小修改：`src/App.tsx`（route/import）、`src/pages/MorePage.tsx`（入口）、`src/pages/FollowupsPage.tsx`（hash target 與定位）、`src/styles.css`（回顧頁 scoped styles 及待辦 target）。
