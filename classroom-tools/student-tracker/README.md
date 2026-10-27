# 學生管理系統

Adam 目前使用的學生管理 Web App，網頁名稱為「荣市大学_学生管理系统」。核心流程是：開始課堂、記出席例外、留下任務觀察、收尾、把需要處理的事帶到下一堂。

## 目前可用功能

学习成效追踪、随机点名整合与未来去识别化分析的产品边界见 [学习成效追踪 V1 产品规格](docs/learning-outcomes-tracking-v1.md)。

- 教師電子郵件／密碼登入，沒有公開註冊入口。
- 今日首頁：一鍵開課、帶回上一堂共同卡點與下堂調整。
- 每次下課後可在班級卡直接記錄上課狀況與本次進度，使用簡單文字即可。
- 課堂工作台：點名補登與收尾；正式出席仍使用另一位教師的 QR 系統。
- 點名例外／補登：只記需要補登的學生、所屬場次、教師觀察、選填到達／離開時間、原因、補登日期與官方人工核對日期，不要求全班重複點名。
- 入口：課堂的「點名補登」、學生完整紀錄，或「更多 → 點名例外／補登紀錄」。補登列表支援班級、日期、待補登／已補登／官方尚未核對篩選。
- 教師觀察、已手動補登與已人工確認官方更新分開保存；不連接或自動同步 Apps Script。舊出席紀錄保留為唯讀歷史。
- 觀察只記本次任務結果：獨立完成、提示後完成、尚未完成。
- 學生搜尋與單頁歷程。
- 再觀察、提醒、補做三類待辦，可完成或恢復。
- CSV 名冊預覽與匯入。
- 學生名冊 CSV 與完整 JSON 備份匯出。
- 手機與桌面響應式介面。
- 2026-09-22 核准的 Apple 風格介面：白灰底、藍色操作、系統無襯線字體；學生使用座號與姓名，不放照片或頭像。點選名單可先預覽近期課堂紀錄與備註，再進入完整紀錄及待辦。
- 正式登入後使用 Supabase 教學資料庫；未登入時仍可用範例資料了解介面流程。

## 下堂課跟進

班級總覽的「下堂课跟进」可切換班級。先顯示本班未完成的提醒、補做與再觀察待辦，再列出最近一堂課需要再觀察或尚無有效口語紀錄的學生；同一學生合併一列，預設八列，可展開全部。待辦可直接開啟原項目、標記完成或恢復；學生連結會保留班級範圍。待辦頁也可按班級篩選。

觀察建議依最近一堂課最後一筆有效口語證據產生，保留具體任務或教師備註。已更正、撤銷及重複鏡像不作證據。明確記錄缺席／請假的學生不因缺少紀錄而自動列入觀察建議，但既有未完成待辦仍顯示。沒有紀錄只標示未觀察，不推定零分、缺席或未交作業。舊的缺交作業備註沒有完成狀態，須由教師在學生頁核對並使用既有「帶入跟進待辦」，才作為未完成事項處理。

同課堂的再觀察待辦完成後，完成時間之前的觀察建議不再顯示；之後的新觀察仍可提出建議。取消但未記錄完成時間的待辦不會自動消除觀察證據。清單不寫入新任務、不修改成績，不需資料庫遷移。

本機驗證使用範例資料，包含班級切換、展開／收起、原待辦連結、完成後更新、桌面與手機畫面；證據見 `qa/next-class-browser-result.json`。尚未部署或進行正式帳號驗收。

## 技術基線

- Node.js 22 以上
- React 19、TypeScript、Vite
- Supabase Auth、Postgres、Row Level Security
- React Router、Zod

Supabase 已停止支援 Node.js 20，因此不要用 Node 20 安裝或建置本專案。

## 本機啟動

```bash
cd /Users/ssyan110/Development/vinh-uni-teaching-assistant/classroom-tools/student-tracker
nvm use
npm install
npm run dev
```

開啟 `http://127.0.0.1:4317`。沒有 `.env` 時，登入頁會提供「使用範例資料進入」。範例變更只保留在目前瀏覽器分頁。

### 啟用補登紀錄的資料表

範例模式可直接試用。正式登入模式需要先套用新增表；尚未套用時會顯示未啟用提示並停用補登操作，原有學生資料仍可載入。

The live database now includes attendance exceptions, applied on 2026-10-25 as [20261025163339_attendance_exceptions.sql](supabase/migrations/20261025163339_attendance_exceptions.sql), followed by its owner/student index. Owner isolation, enrollment checks, and separate makeup/official-verification states passed local and live rollback-only SQL tests. Real teacher login and browser save/reload acceptance remain untested. The standalone [attendance-exceptions.sql](supabase/attendance-exceptions.sql) is retained only for the disposable local test harness.

The shared Supabase schema audit and completed follow-up checks are recorded in [the latest audit report](../../docs/qa/supabase-audit-20261025/remaining/report.md). All 30 local migration versions now match production history. Authenticated roster, participation, correction and attendance saves were read back after browser reload. The historical LT_03 data repair is a documented no-op on fresh rebuilds; its original applied SQL remains in the audit evidence. Do not replay old migrations manually against production.

同一學生每個場次只有一筆例外紀錄；使用「編輯補登紀錄」更新。選擇「已手動補登」後仍保持「官方尚未核對」，直到教師查看官方系統，主動填寫核對日期。新表不提供刪除操作。

## 連接 Supabase

1. 建立 Supabase 專案。
2. 在 Authentication 的 Users 頁面建立唯一的教師帳號。
3. 關閉公開註冊。App 本身沒有註冊頁，正式專案設定也應停用 sign-up。
4. 套用 migration：

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

5. 建立 `.env.local`：

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

前端只能放 publishable key。不要把 secret key 或 service-role key 放進 `.env.local`、Git 或瀏覽器程式碼。

## 資料庫安全

Migration 位於 `supabase/migrations/20260905103254_initial_student_tracker.sql`，包含：

- 8 張核心表。
- 每張表的 `owner_id`。
- 跨表 owner 一致性的複合外鍵。
- authenticated 角色的明確 Data API grants。
- anon 角色撤銷權限。
- 每張表的 SELECT／INSERT／UPDATE／DELETE RLS policy。
- 查詢、外鍵與 RLS 使用欄位的索引。
- 同一課程只能有一堂進行中課堂的局部唯一索引。

MVP 沒有使用 Realtime、Storage 或 Edge Functions。

## 名冊 CSV

必要欄位：

```csv
學號,中文姓名
SV001,王小明
```

完整欄位：

```csv
學號,中文姓名,原名,常用名,座號
SV001,王小明,Nguyễn Minh,小明,1
```

相同學號再次匯入時會更新學生資料，並避免在同一門課重複建立修課紀錄。

## 驗證指令

```bash
npm run typecheck
npm test
npm run build
```

已完成的瀏覽器走查包含：範例登入、開課、出席例外、確認其餘到課、課堂觀察、收尾、學生搜尋、學生歷程、待辦完成／恢復、CSV 預覽與匯入，以及 390px 手機版面。

## 目前界線

- Adam 的 Supabase 專案已連接並部署；真實帳號登入、跨 owner RLS 與遠端寫入仍需在瀏覽器完成最後端到端走查。
- 本機沒有可用的 Docker daemon，migration 已完成靜態審查，但尚未在本機 Supabase 容器執行 `db reset`。
- 第一版只支援 CSV，不直接解析 XLSX。
- 沒有完整離線資料庫；範例模式與未送出的頁面狀態使用瀏覽器分頁暫存。

產品範圍與決策紀錄見 [PRODUCT_PROPOSAL.md](./PRODUCT_PROPOSAL.md)。
