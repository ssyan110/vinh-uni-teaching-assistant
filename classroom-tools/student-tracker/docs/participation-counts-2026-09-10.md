# 每堂課回答次數

入口：https://student-tracker-iota.vercel.app/participation

2026-09-10 新增「回答次數」頁：班級 → 日期 → 上課場次。每列顯示座號、學號、姓名、抽問回答、自願發言、總回答次數；保留零回答學生，提供 UTF-8 BOM CSV 匯出，無分數欄。

## 儲存與計算

- 抽問工具既有「記錄回答」動作把每個回答存進 randomizer_attempts，依 owner_id + client_attempt_id 重複同步時更新同一筆。抽到但尚未記錄回答仍是 pending，不計回答。
- 新表以 randomizer_attempts → randomizer_sessions.class_session_id → class_sessions 關聯選取整堂課；不依教材課號、抽選輪次或事件寫入日期猜測場次。
- answered 且非 voided 的抽問紀錄，每筆計一次；不要求評分，也不受表現摘要的 counted_for_summary 限制。pending、not_answered、undone 不計入。
- 保留既有 learning_events 回答；以 client_event_id 排除抽問的歷史鏡像，排除課堂觀察、未回答、未觀察、拒答和已撤銷事件。
- 表格的「自願發言 +1」沿用 learning_events，每次新增一笔 source=voluntary_answer、response_status=answered、四項評分為 null 的事件。課次沿用本堂已有資料；多課次或沒有資料時由教師選擇。保留既有 owner RLS 和課堂／學生外鍵。
- 第幾次上課依該班已建立的 class_sessions 日期、開始時間和 id 排序，並非自動推定的正式課表週次。

## 驗證

- Node 24.19.0：TypeScript／Vite build 通過；6 個測試檔、16 個測試通過。
- 新計數測試：跨輪重複回答、自願發言、重複同步、歷史鏡像、未回答、撤銷、同日不同場次、不同班級、零回答名冊。
- Chromium 範例資料操作：選班級／日期／場次，连续加記兩次，重新整理保留。第一位學生原抽問 1 次 + 新增自願 2 次 = 3 次；下載 CSV 27 列全部合計正確、沒有分數欄。
- 截圖與 CSV：.playwright-cli/page-2026-09-10T14-17-05-235Z.png（第一次加記後）、.playwright-cli/participation-demo.csv（第二次加記後）。
- git diff --check -- src 通過。
- Vercel production deployment dpl_By7DSvL6GCMpEZagS8DYxfCZgDRw READY；原入口 alias 已更新。公開頁面與部署 bundle 已確認新頁及精確場次 join。
- Supabase 唯讀核對：randomizer_attempts_session_fk 存在，連結 owner_id/course_id/randomizer_session_id。LT_02 2026-09-10 有 32 筆 answered 且未撤銷的抽問資料。

## 未驗證項目

線上教師登入後的完整操作尚未測試；瀏覽器驗證使用去識別範例資料，未在真實學生資料新增測試事件。內嵌瀏覽器 bridge 不可用，範例互動改用獨立 Chromium。既有課堂抽問的紀錄流程本次未改動。
