# 「課跡」任課教師學生追蹤 Web App 產品提案

版本：0.2  
日期：2026-08-23  
使用對象：Adam 個人使用  
學生規模：約 100 名大二學生、數個華語聽說班級

## 0. 本次修訂

本版依三組獨立研究修訂：大班任課教師需求、課堂手機 UX、Supabase 單人 App 維護與安全。

v0.1 的方向正確，但仍接近小型校務系統。v0.2 將產品收斂為：

> 上課不中斷、課後不遺忘、下一堂知道要做什麼。

主要改動：

- 主導覽由七項減為四項。
- 取消獨立「新增課堂」長表單，從今日首頁一鍵開課。
- 出席不再預設全班到課，改為教師確認其餘到課。
- 單次觀察只記本次任務結果，不判定學生整體能力。
- 普通觀察只需「點學生＋點結果」，文字全部選填。
- 新增「全班共同卡點」與「下次調整」，直接支援下一堂教學。
- 跟進類別及狀態大幅縮減。
- 13 個頁面收斂為 5 個主要畫面與必要的子頁。
- Supabase 核心表由 11 張減為 8 張。
- 移除多人角色、Realtime、Storage、Edge Functions、複雜統計、AI 評分與公開註冊。

## 1. 研究結論

### 1.1 老師真正會持續使用的功能

教師研究與教師社群反覆出現同一個判準：工具必須比紙本或 Excel 更快，而且不打斷上課。

需求優先順序：

1. 一鍵進入正在上的班，不先填表。
2. 出席採例外式紀錄，必要時才逐一確認。
3. 一筆普通課堂觀察在兩次點擊內完成。
4. 快速查到學生上次發生什麼、自己答應下一步做什麼。
5. 課後立刻記住全班卡點與下一堂調整。
6. 明確顯示已儲存、待同步或失敗，不讓教師猜測資料是否保存。

教師仍使用紙本或 Excel，常見原因不是不知道有 App，而是紙本更快、不需要載入、不必切換投影畫面，也不用學習另一套工作流程。[教師出席工具討論](https://www.reddit.com/r/Professors/comments/1l46iq2/best_way_to_track_attendance_and_why/)

### 1.2 形成性評量的正確用法

- 出席和參與不等同學習能力。
- 內向、語言焦慮或需要較長思考時間的學生，不能因公開發言少而被永久標記為低參與。[Cornell：Assessing Class Attendance and Participation](https://teaching.cornell.edu/teaching-resources/assessing-student-learning/assessing-class-attendance-and-participation)
- ACTFL Can-Do 需要不同情境、不同日期的多次證據；一次任務不能直接變成「穩定具備某能力」。[NCSSFL-ACTFL Can-Do Statements](https://www.actfl.org/educator-resources/ncssfl-actfl-can-do-statements)
- 大班、時間不足及工作量是教師使用形成性評量的主要障礙，因此系統應減少資料點，只保存會改變下一步的證據。[UNSW：Assessing Large Classes](https://www.teaching.unsw.edu.au/assessing-large-classes)

### 1.3 個人教學反思是核心需求

教師常在下課後記下哪個活動有效、學生卡在哪裡、下次應如何調整。這些內容比學生紀錄總數或圓餅圖更能改善下一堂課。Cornell 與 Yale 都建議在課後記憶仍清楚時立即留下短紀錄。[Cornell：Keeping Notes on Your Teaching](https://teaching.cornell.edu/teaching-resources/resources-new-faculty/keeping-notes-your-teaching)、[Yale：Reflective Teaching](https://poorvucenter.yale.edu/teaching/teaching-resource-library/reflective-teaching)

## 2. 產品定位

### 2.1 產品要回答的問題

1. 今天誰缺席、遲到或未完成必要任務？
2. 哪些學生需要下次再看一次？
3. 我對哪些學生還有未完成的提醒或補做？
4. 今天全班共同卡在哪裡？
5. 下一堂我要保留、修補或調整什麼？

### 2.2 產品不處理

- 家長聯絡、家庭資料或導師班務。
- 心理、醫療、操行或風險診斷。
- 學生登入、作業繳交或完整 LMS。
- AI 自動評分、AI 摘要或黑箱學生風險分數。
- 公開參與排行榜或學生互相比較。
- 多教師、助教、唯讀角色與課程分享。
- 郵件通知、行事曆整合或自動轉介。
- 照片、錄音或附件。

### 2.3 MVP 成功條件

- 開啟當堂課：10 秒內。
- 出席例外：60–90 秒內。
- 一筆快速觀察：5–10 秒、無需打字。
- 一筆含文字的特殊紀錄：20 秒內。
- 課後收尾：2 分鐘內。
- 找到一名學生最近紀錄：10 秒內。
- 每週整理：10 分鐘內。

這些數字是產品試行指標，不宣稱為所有教師通用標準。若兩週試行後超過 20% 的課堂沒有完成收尾，優先刪除步驟，不增加提醒。

## 3. 使用者與資料範圍

### 3.1 唯一使用者

MVP 只有 Adam 一個帳號：

- 建立學期與課程。
- 匯入自己的學生名冊。
- 登記出席、課堂證據與待辦。
- 查看及匯出自己的資料。

系統不開放註冊。協同教師、助教及學生帳號不列入目前產品路線。

### 3.2 最小學生資料

MVP 只保存：

- 學號。
- 中文姓名。
- 越南文姓名或原名，可選。
- 常用名，可選。
- 課程、班級與座號。
- 在籍、停修或封存狀態。

第一版不保存學生電子郵件、家長資料、一般自由備註、照片、醫療資料或心理資料。

## 4. 資訊架構

### 4.1 四個主入口

手機底部導覽與桌面側欄都只保留：

1. 今日
2. 學生
3. 待辦
4. 更多

「課程、名冊、資料匯入、資料匯出、帳號」放在「更多」。班級摘要放在對應課程內，不設獨立統計主入口。

### 4.2 主要畫面

1. 登入
2. 今日
3. 課堂工作台
4. 學生搜尋與單頁歷程
5. 待辦

「更多」只包含低頻管理頁，不參與每天的核心流程。

## 5. 完整畫面內容

### 5.1 登入 `/login`

內容：

- App 名稱：「課跡」。
- 說明：「快速記錄每堂課，下一堂知道要關注什麼。」
- 電子郵件。
- 密碼。
- 登入。
- 忘記密碼，只有設定正式 SMTP 後才顯示。

個人裝置登入成功後保持工作階段，不要求每堂課重新登入。未登入使用者看不到任何名冊或課堂資料。

### 5.2 今日 `/today`

今日不是統計儀表板，而是「下一個教師動作頁」。

依序顯示：

1. 下一堂課。
2. 「開始」或「繼續課堂」按鈕。
3. 上一堂留下的全班共同卡點。
4. 下一堂要調整的 1–3 件事。
5. 今天到期的待辦，最多先顯示 5 件。
6. 本堂建議觀察名單與建議原因。
7. 尚未同步或儲存失敗的草稿。

首頁不顯示：

- 總紀錄數。
- 圓餅圖。
- 班級平均。
- 學生排名。
- 無法直接採取行動的趨勢圖。

沒有排定課程時顯示：

> 今天沒有排定課程。你可以開啟其他班級或處理待辦。

### 5.3 一鍵開始課堂

取消獨立 `/sessions/new` 長表單。

教師在今日首頁點班級後立即建立草稿：

- 課程與日期自動帶入。
- 上課時間依課表帶入，可修改。
- 教材課次、任務及 Can-Do 皆為選填。
- 可沿用上次使用的任務，或完全不填先開始。
- 一堂課最多選一個主要觀察目標。

建立草稿時不產生任何「到課」資料，也不把學生預設為到課。

### 5.4 課堂工作台 `/sessions/:sessionId`

課堂工作台有三個模式：

1. 點名
2. 觀察
3. 收尾

畫面頂部固定顯示課程、日期、同步狀態與「隱私模式」。隱私模式只顯示姓名及本堂操作，不顯示完整學生歷程或過去文字紀錄。

#### A. 點名模式

每門課可設定：

- 不追蹤出席。
- 只記例外。
- 每堂確認。

狀態：

- 未確認。
- 到課。
- 遲到。
- 缺席。
- 請假。

最短操作：

1. 點選缺席、遲到或請假的學生。
2. 按「確認其餘到課」。

其他功能：

- 名冊／座位表切換。
- 依座號或姓名搜尋。
- 只看例外。
- 復原上一步。
- 每個例外最多兩次點擊完成。

座位表只保存座號與位置，不使用照片。座位表為選用功能，沒有設定時自動回到名冊。

#### B. 觀察模式

一堂課只有一個主要任務，例如：

> 兩人訪談後，能追問一個相關問題。

系統預設建議 6 名學生，可調整為 0–12 名。建議依據：

- 很久沒有留下任務證據。
- 上次標記為下次再觀察。
- 缺少本堂溝通模式的證據。
- 今天實際到課。

建議名單可以跳過，不是強制配額，也不阻止結束課堂。

普通觀察流程：

1. 點學生。
2. 點本次任務結果。

結果只有三個：

- 獨立完成。
- 提示後完成。
- 尚未完成。

「未觀察」不建立資料。單次結果只代表當次任務，不顯示為學生永久能力層級。

選填內容：

- 一句具體證據。
- 下一次動作。
- 加入待辦。

自由文字支援裝置原生語音輸入，但 App 不錄音、不上傳音訊，也不使用 AI 分析。

#### C. 收尾模式

收尾只提供三個短欄位：

- 今天哪裡有效？
- 全班共同卡在哪裡？
- 下次要調整什麼？

全部選填。系統只在出席仍有「未確認」時顯示警告；不因未完成觀察或反思阻止結束課堂。

結束後，今日首頁自動顯示「全班共同卡點」與「下次調整」，形成下一堂課的起點。

### 5.5 學生 `/students`

頁首只有搜尋框與課程篩選。

列表顯示：

- 學號。
- 姓名。
- 課程／班級。
- 最近出席。
- 最近任務證據日期。
- 未完成待辦數。

預設不顯示總分、能力等級或排名。

### 5.6 學生單頁歷程 `/students/:studentId`

不使用五個分頁。第一屏直接回答：

- 最近缺席或未完成什麼？
- 上次教師答應做什麼？
- 最近三筆任務證據是什麼？
- 下一次建議觀察什麼？

下方是一條時間軸，以篩選按鈕切換：

- 全部。
- 出席。
- 任務證據。
- 待辦。

任務證據依日期、任務與情境呈現。只有在不同日期、不同情境出現多筆一致證據時，摘要才可寫「多次獨立完成」；不得由一筆紀錄推論 ACTFL 整體能力。

### 5.7 待辦 `/followups`

待辦只保存 Adam 能親自完成的動作。

類別：

- 下次再觀察。
- 提醒學生。
- 補做課堂任務。

狀態：

- 待處理。
- 已完成。
- 已取消。

期限預設為該課程下一次上課日期，可修改。完成結果為選填。

系統可以提出待辦建議，但不能自動建立。缺席不會被自動解讀為風險，也不要求 Adam 追查非任課教師職責內的私人原因。

### 5.8 更多 `/more`

#### 課程

- 建立、編輯及封存學期與課程。
- 設定上課時間。
- 設定出席模式。
- 查看名冊與過往課堂。
- 查看哪些學生很久沒有任務證據。
- 查看哪些課堂尚未完成收尾。

不提供層級分布圖、圓餅圖或班級平均。

#### 名冊與座位

- CSV 匯入。
- 欄位對應。
- 新增／更新／略過預覽。
- 重複學號與格式錯誤檢查。
- 編輯座號與可選座位位置。

必要欄位只有學號、姓名與課程。原始檔在瀏覽器解析，完成後不保存到 Supabase Storage。

#### 匯出與備份

- 名冊 CSV。
- 指定日期出席 CSV。
- 任務證據 CSV。
- 待辦 CSV。
- 單一學生摘要。
- 學期資料封存 JSON／CSV。

XLSX 美化報表延後；匯出檔不是資料庫備份。

#### 帳號與資料

- 時區。
- 修改密碼。
- MFA 狀態。
- 手動備份提醒。
- 封存課程。
- 登出並清除本機暫存。

使用者畫面不顯示 Supabase、RLS、migration、部署或測試等技術詞彙。

## 6. 核心工作流程

### 6.1 新學期

```text
建立學期 → 建立課程 → 匯入 CSV
→ 預覽新增／更新／錯誤 → 確認名冊 → 可選設定座位
```

### 6.2 每堂課

```text
今日 → 點班級開始
→ 標記出席例外 → 確認其餘到課
→ 點觀察學生 → 點任務結果
→ 寫共同卡點／下次調整 → 結束
```

### 6.3 下一堂接續

```text
今日 → 看上堂共同卡點
→ 看下次調整 → 看待辦與再觀察名單
→ 一鍵開始
```

### 6.4 每週整理

```text
查看待辦 → 查看久未觀察學生
→ 補完未收尾課堂 → 匯出必要紀錄
```

## 7. 可解釋規則

所有規則只產生建議，且畫面直接寫出原因。

| 條件 | 顯示建議 |
|---|---|
| 最近三次到課都沒有任務證據 | 建議加入本堂觀察 |
| 上次結果為「尚未完成」 | 建議下次再觀察 |
| 已建立待辦且今天到期 | 顯示於今日 |
| 跟進超過期限 | 顯示「已逾期」 |
| 課堂結束但沒有收尾 | 顯示「補寫課堂收尾」 |

不使用「高風險學生」「低參與學生」或其他人格化標籤。

## 8. Supabase 資料模型

### 8.1 八張核心表

| 資料表 | 用途 | 重要欄位 |
|---|---|---|
| `academic_terms` | 學期 | `id`, `owner_id`, `name`, `start_date`, `end_date`, `archived_at` |
| `courses` | 課程／班級 | `id`, `owner_id`, `term_id`, `code`, `name`, `schedule`, `attendance_mode`, `archived_at` |
| `students` | 學生主檔 | `id`, `owner_id`, `student_no`, `name_zh`, `name_local`, `preferred_name`, `archived_at` |
| `enrollments` | 選課與座位 | `id`, `owner_id`, `course_id`, `student_id`, `seat_no`, `seat_position`, `status` |
| `class_sessions` | 每堂課與課後反思 | `id`, `owner_id`, `course_id`, `session_date`, `task_target`, `can_do_target`, `class_success_note`, `common_difficulty`, `next_lesson_adjustment`, `status` |
| `attendance_records` | 出席例外或確認結果 | `id`, `owner_id`, `session_id`, `student_id`, `status`, `note` |
| `observation_records` | 單次任務證據 | `id`, `owner_id`, `session_id`, `student_id`, `mode`, `outcome`, `evidence_text`, `next_action` |
| `followups` | 教師待辦 | `id`, `owner_id`, `course_id`, `student_id`, `source_session_id`, `category`, `due_date`, `status`, `result` |

不建立：

- `profiles`：單一帳號暫時不需要獨立教師資料表。
- `import_jobs`：匯入結果直接回傳，原始檔不保存。
- `audit_events`：私人教學輔助先用 `created_at`、`updated_at` 與軟刪除；需要正式爭議證據時再增加版本紀錄。

### 8.2 固定值

`attendance_mode`：

- `off`
- `exceptions`
- `confirm_all`

`attendance_records.status`：

- `present`
- `late`
- `absent`
- `excused`

`observation_records.outcome`：

- `independent`
- `with_prompt`
- `not_yet`

`followups.category`：

- `reobserve`
- `remind`
- `makeup`

`followups.status`：

- `open`
- `completed`
- `cancelled`

### 8.3 一致性約束

- `unique(owner_id, student_no)`。
- `unique(course_id, student_id)`。
- `unique(session_id, student_id)` 用於出席。
- 父表使用 `unique(id, owner_id)`。
- 子表以 `(parent_id, owner_id)` 建立複合外鍵，避免 child 的 `owner_id` 與課程、課堂或學生擁有者不一致。
- `owner_id` 為 `not null`，建立時預設目前登入使用者。

### 8.4 初始索引

- unique constraints 產生的索引。
- `courses(owner_id, archived_at)`。
- `class_sessions(course_id, session_date desc)`。
- `observation_records(student_id, created_at desc)`。
- `followups(owner_id, status, due_date)`。

100 名學生不需要先建立大量索引；以實際慢查詢及 query plan 再增加。

## 9. Supabase 安全與維護

### 9.1 MVP 使用的能力

- Supabase Auth。
- Postgres Database。
- Data API。

MVP 不啟用：

- Storage。
- Realtime。
- Edge Functions。
- Vector、AI 或排程通知。

### 9.2 帳號設定

- 由 Supabase Dashboard 手動建立唯一帳號。
- 關閉公開註冊。
- 關閉 anonymous sign-in。
- MVP 使用 email＋password。
- 未設定 custom SMTP 前，不依賴 magic link 作為日常登入。
- 假資料試行可先使用一般登入；匯入真實名冊前完成 App 端 TOTP MFA。
- Supabase Dashboard 管理帳號另行啟用 MFA，不能把兩者視為同一件事。

### 9.3 Data API 與 RLS

每張暴露給 Data API 的表都必須：

1. 明確 `enable row level security`。
2. 明確撤銷 `anon` 權限。
3. 只授予 `authenticated` 實際需要的操作。
4. 分開建立 SELECT、INSERT、UPDATE、DELETE policy。
5. UPDATE 同時設定 `USING` 與 `WITH CHECK`。
6. policy 使用 `(select auth.uid()) = owner_id`。
7. 不以可由使用者修改的 `user_metadata` 作為授權依據。

前端只使用 publishable key。`service_role` 或 secret key 不得出現在前端、Git 或公開環境變數。

統計 view 必須使用 `security_invoker = true`。不能為解決權限錯誤而直接增加 `security definer`。

### 9.4 RLS 驗收

至少使用兩個測試帳號驗證：

- 未登入查詢得到 0 筆。
- Owner 可正常 CRUD 自己的資料。
- 第二帳號查不到 Adam 的任何資料。
- 第二帳號無法更新或刪除 Adam 的資料。
- 不能把 `owner_id` 改成另一帳號。
- 統計 view 不會洩漏其他帳號資料。
- RLS 更新失敗不會在 UI 顯示為成功。

### 9.5 備份與方案限制

- App CSV／JSON 匯出是教學資料封存，不是可直接還原資料庫的備份。
- 使用 Supabase CLI 建立 schema migration 與 data-only dump，並加密保存在 Supabase 以外的位置。
- 建議每週及大量匯入前備份一次，學期末再做完整封存。
- 依現行方案說明，Free project 不提供可下載的每日備份，且低活動專案可能暫停。免費方案可用於假資料試行；若正式上課要求隨時可開啟，應在真實學期開始前評估付費方案。

## 10. 前端架構

### 10.1 建議技術

- React。
- TypeScript。
- Vite。
- React Router。
- `@supabase/supabase-js`。
- Zod，只用於名冊匯入與表單邊界驗證。
- Playwright，驗證核心教師流程與資料隔離。

第一版不必先加入 TanStack Query、Tailwind 或大型元件庫。若專案已有現成依賴才重用；否則使用小型 query hooks、CSS variables 與原生表單元件。

使用 Node.js 22 或更新的受支援版本，並提交 lockfile。

### 10.2 儲存策略

- 每次點擊先更新畫面中的課堂草稿。
- 出席與觀察以批次 upsert 寫入 Supabase。
- `unique(session_id, student_id)` 讓失敗重試不產生重複出席。
- 顯示「已儲存／待同步／儲存失敗」。
- 儲存失敗保留本頁草稿並提供重試。
- 離開有未儲存內容的頁面前顯示警告。

MVP 不把完整名冊與自由文字長期保存到 `localStorage`。可使用當前分頁的 `sessionStorage` 保護重新整理；登出時清除。完整離線 IndexedDB 佇列需先由兩週試行證明教室網路確實造成問題，再以最小 ID／狀態資料實作，同步後立即刪除。

## 11. 介面方向

### 11.1 視覺

- 背景：`#F6F8FC`。
- 主要文字：`#17324D`。
- 主色：`#4353D9`。
- 完成：`#168A78`。
- 提醒：`#D58A00`。
- 錯誤：`#C43B4D`。
- 白色卡片、清楚邊界、低陰影。

不使用霓虹科技風。顏色不單獨承擔狀態意義，每個狀態都顯示文字。

### 11.2 手機優先規則

- 一手可操作主要流程。
- 觸控目標至少 44×44 px。
- 點名與觀察分開，不在同一畫面塞入所有控制。
- 底部固定顯示同步狀態及主要動作。
- 課中不打開學生完整歷程。
- 普通觀察不出現鍵盤。
- 支援復原上一個操作。

### 11.3 空白與錯誤狀態

必須處理：

- 尚未建立課程。
- 課程沒有名冊。
- 今天沒有課。
- 沒有待辦。
- 匯入檔案有錯誤。
- 出席仍未確認。
- 儲存失敗。
- 工作階段過期。
- 免費 Supabase 專案暫停或服務無法連線。

錯誤畫面必須保存已輸入內容，提供重試或下載未同步草稿，不得只顯示「發生錯誤」。

## 12. 開發階段

### Phase 1：兩週可試行 MVP

- 唯一帳號登入。
- 學期與課程。
- CSV 名冊匯入。
- 今日首頁。
- 一鍵開課。
- 點名模式。
- 快速觀察。
- 全班共同卡點與下次調整。
- 三類待辦。
- 學生單頁歷程。
- CSV／JSON 匯出。
- 同步狀態、失敗重試及當前分頁草稿。
- RLS、第二帳號隔離及 MFA 驗收。

### Phase 2：只有試行證明需要才做

- 完整離線 IndexedDB 佇列。
- 座位拖曳配置。
- XLSX 報表。
- 學期資料庫復原演練。
- 教學摘要的輕量 view。
- 正式修改版本紀錄。

### 不列入目前路線

- 多教師與助教。
- 學生登入。
- Storage 附件。
- Realtime。
- 郵件或推播提醒。
- AI 自動摘要與評分。
- 複雜分析 dashboard。
- 學生排名。

## 13. 驗收標準

### 13.1 教師流程

- 從首頁開始課堂不超過 10 秒。
- 確認出席例外不超過 90 秒。
- 一筆普通觀察兩次點擊完成，不需輸入文字。
- 課堂收尾平均不超過 2 分鐘。
- 可以在 10 秒內找到任一學生最近三筆證據與待辦。
- 下一堂首頁會顯示上一堂的共同卡點及調整。
- 沒有任何圖表要求教師自行解讀後才知道下一步。

### 13.2 資料正確性

- 建立課堂不會自動產生全班到課假紀錄。
- 重試批次儲存不會產生重複出席。
- 同一學生在同一課程不會重複 enrollment。
- 單次觀察不會變成永久能力等級。
- 建議待辦不會在教師確認前寫入。
- CSV 匯入會先顯示新增、更新、略過及錯誤數量。

### 13.3 安全

- 關閉公開與匿名註冊。
- 真實名冊上線前啟用 TOTP MFA。
- 未登入使用者不能讀取資料。
- 第二帳號不能讀取或修改 Adam 的資料。
- 前端 bundle 不含 secret 或 service role key。
- 每張 Data API 業務表都有 RLS 與明確 grants。
- 登出會清除本機課堂草稿。
- 備份檔加密並離站保存。

### 13.4 兩週停損條件

出現以下任一情況，先簡化而非增加功能：

- 超過 20% 的課堂沒有完成收尾。
- 普通觀察經常需要打字。
- 同一資訊仍需在 App 與其他表格重複輸入。
- 教師改回紙本，因為 App 載入或切換較慢。
- 首頁資訊看完後無法立即採取行動。

## 14. 研究採用決策

| 研究發現 | 採用方式 |
|---|---|
| 紙本與 Excel 因速度快而被保留 | 一鍵開課、例外點名、普通觀察兩次點擊 |
| 大班形成性評量受時間與工作量限制 | 預設只建議 6 名、文字選填、不要求完成配額 |
| 出席不等同參與或學習 | 出席、任務證據、待辦分開 |
| 公開發言次數有公平性問題 | 不追蹤「主動參與」次數，不做排行榜 |
| Can-Do 必須跨時間與情境觀察 | 單筆只保存任務結果，多筆才顯示重複證據 |
| 教師需要課後反思支持下一堂 | 新增共同卡點與下次調整，首頁直接帶入 |
| 單人 App 不需要即時多人架構 | 不啟用 Realtime、Storage 或多人角色 |
| 真實學生資料需要資料庫層隔離 | 每表 RLS、明確 grants、跨 owner 外鍵與雙帳號測試 |
| 完整離線會增加個資與同步風險 | MVP 先做分頁草稿與重試，試行後再決定 IndexedDB |

## 15. 參考資料

教師需求與評量：

- [Cornell：Assessing Class Attendance and Participation](https://teaching.cornell.edu/teaching-resources/assessing-student-learning/assessing-class-attendance-and-participation)
- [Cornell：Keeping Notes on Your Teaching](https://teaching.cornell.edu/teaching-resources/resources-new-faculty/keeping-notes-your-teaching)
- [Yale：Reflective Teaching](https://poorvucenter.yale.edu/teaching/teaching-resource-library/reflective-teaching)
- [NCSSFL-ACTFL Can-Do Statements](https://www.actfl.org/educator-resources/ncssfl-actfl-can-do-statements)
- [UNSW：Assessing Large Classes](https://www.teaching.unsw.edu.au/assessing-large-classes)
- [UK Department for Education：Making Data Work](https://assets.publishing.service.gov.uk/media/5be1ccca40f0b667c116be10/Workload_Advisory_Group-report.pdf)
- [教師社群：Best way to track attendance and why](https://www.reddit.com/r/Professors/comments/1l46iq2/best_way_to_track_attendance_and_why/)

Supabase：

- [Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Auth General Configuration](https://supabase.com/docs/guides/auth/general-configuration)
- [Password-based Auth and SMTP](https://supabase.com/docs/guides/auth/passwords)
- [Multi-Factor Authentication](https://supabase.com/docs/guides/auth/auth-mfa)
- [Database Backups](https://supabase.com/docs/guides/platform/backups)
- [Free Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Node.js 20 Support Ended](https://supabase.com/changelog/45715-deprecation-notice-dropping-support-for-node-js-20)
