# 雲端準備狀態

目前已建立 Supabase 專案並套用資料庫結構；兩個前端入口已部署，真實學生名單也已匯入雲端。

- Supabase 專案：`vinh-uni-teaching`
- Project ref：`hpbwipruqtmpfghialwv`
- Region：Singapore (`ap-southeast-1`)
- API URL：`https://hpbwipruqtmpfghialwv.supabase.co`
- 建立方案回報：US$0／月；仍受 Supabase 免費方案用量上限約束。

- 公開前端不再打包真實學生姓名；隨機點名與學生追蹤系統登入後從 Supabase 載入資料，真實名冊保留在受保護的初始化來源。
- learning_events 遷移含教材／課次、事件來源、四項原始表現分數、回答結果、回答情境、教師備註、owner RLS、同班課堂與修課外鍵；不授予匿名存取或前端刪除正式成績。
- 正式 repository 已接上 learning_events 查詢與寫入；遠端已套用 `classroom_raw_records` migration，新增課堂原始事件順序、事件來源、回答狀態、未回答原因、回答情境、評分、修正時間與 `counted_for_summary`。這些欄位只支援教師後續整理，不代表學校正式成績權重。
- 隨機點名使用自己的 `randomizer_sessions` 與 `randomizer_attempts` 資料表；每次抽到、回答、未回答、待評分、撤銷、自願發言、備註與 rubric 分數都會保存。未回答事件不產生 0 分，已評分回答另外同步到 `learning_events`。
- 隨機點名已加入教師登入、雲端名單讀取、口語評分同步與重試佇列；重複送出會更新同一筆事件，不重複建立紀錄。課堂中暫時離線時，資料會先保留在本機待同步，恢復連線後自動保存。
- 三班真實名單已匯入：LT_01 27 人、LT_02 30 人、LT_03 14 人，共 71 人。
- 新紀錄使用目前進行中課堂，沒有課堂時開啟今天的新課堂；不再寫到上一堂示範課。
- 成效頁使用 repository 的學生 ID，不把學號當成正式資料庫 UUID。
- Vercel root 設定為 classroom-tools/student-tracker，Node 24，啟用 SPA rewrites；登入設定已寫入 production build。
- 兩個網站已使用同一個對話框 logo，並加入 header 與瀏覽器分頁 favicon；隨機點名工具的操作按鈕已補上 icons，icon 與文字保留清楚間距並通過手機版面檢查。

## 正式教學前仍需完成

1. 以兩個測試帳號驗證跨 owner 存取被拒絕、同班外鍵和分數限制；目前只完成 schema、RLS policy 與 Supabase security advisor 檢查，尚未做登入後的雙帳號實測。
2. 確認 Supabase Auth 的公開註冊設定；教師帳號已建立，前端只使用 publishable key 與 URL，service role 不進前端。
3. 完成教師實際登入後的三班名單讀取與點名同步測試；名單已匯入正確 owner，但仍需在瀏覽器完成端到端操作驗證。
4. 完成隨機點名離線佇列、重送幂等和恢復測試；程式已接好，尚待實際登入與網路中斷測試。
5. 設定成績備份／還原並實測；學生追蹤系統已提升為 production，隨機點名入口已更新至最新版本。

目前狀態：部署、資料初始化與課堂原始紀錄 migration 已完成；正式教學前仍須完成登入後端到端、雙帳號 RLS、離線重送，以及備份還原測試。

## 使用入口

- 學生追蹤系統（production）：<https://student-tracker-iota.vercel.app>
- 隨機點名系統：<https://classroom-randomizer-opal.vercel.app>

學生追蹤系統現在先顯示應用程式自己的教師登入頁；請使用已建立的教師帳號登入。舊的 `student-tracker-24hr37p4w-ssyan110-gmailcoms-projects.vercel.app` 是舊 preview deployment，不再是使用入口。
