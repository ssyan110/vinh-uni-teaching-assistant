# 課跡

給任課教師個人使用的學生追蹤 Web App。核心流程是：開始課堂、記出席例外、留下任務觀察、收尾、把需要處理的事帶到下一堂。

## 目前可用功能

学习成效追踪、随机点名整合与未来去识别化分析的产品边界见 [学习成效追踪 V1 产品规格](docs/learning-outcomes-tracking-v1.md)。

- 教師電子郵件／密碼登入，沒有公開註冊入口。
- 今日首頁：一鍵開課、帶回上一堂共同卡點與下堂調整。
- 課堂工作台：點名、觀察、收尾三個模式。
- 出席採例外式紀錄；系統不會先把全班標成到課。
- 觀察只記本次任務結果：獨立完成、提示後完成、尚未完成。
- 學生搜尋與單頁歷程。
- 再觀察、提醒、補做三類待辦，可完成或恢復。
- CSV 名冊預覽與匯入。
- 學生名冊 CSV 與完整 JSON 備份匯出。
- 手機與桌面響應式介面。
- 正式登入後使用 Supabase 教學資料庫；未登入時仍可用範例資料了解介面流程。

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

Migration 位於 `supabase/migrations/20260823090017_initial_student_tracker.sql`，包含：

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
