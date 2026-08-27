# 課堂學習表現回饋工具 draft

本目錄是依 `/Users/ssyan110/Desktop/PBI_Rubric_Complete_Research_and_Codex_Spec.md` 的 descriptor、來源追蹤與資料欄位建立的課堂回饋工具 draft。依使用者最新說明，本工具只用來回饋學生的學習狀況，不作學校正式評分。版本狀態為：

> 課程適配版（课堂学习反馈用，不用于学校成绩）

## 本階段已建立

- `data/`：rubric、來源地圖、課程評量地圖、任務卡資料與 JSON Schema。
- `templates/`：通用口語聽說回饋表、教師完整回饋表、學生精簡版、任務目標卡、任務完成、重做、診斷與自評表。
- `app/`：回饋紀錄驗證的最小純函式邏輯，不計算總分。
- `tests/`：內容、功能、語言政策與來源追蹤測試。
- `docs/`：需求邊界、教師使用說明、計分政策、效度規則與來源歸屬。

## 固定邊界

- 0、1、2、3 只描述學生在本次任務中的學習表現，不能換算為 ACTFL Novice、Intermediate、Advanced 或 Low／Mid／High。
- `task_completion_score` 只作回饋紀錄，不加入任何總分。
- `NR` 不等於 0；沒有設計該觀察面向時可以使用 `N/A`，但要留下原因。
- A1 與 A2 分開保存；retry 不自動取最高分。
- Presentational 不放追問、聽者澄清或協商；Interpersonal 才記錄這些行為。
- 學生端文字使用簡體中文；研究與來源說明使用繁體中文。

## 目前未做的工作

本階段沒有建立學校成績、加權總分、UI、PDF／CSV 成績匯出介面或評分者校準樣本，也沒有把任何檔案升格到 `20-approved/`。若之後需要正式校務評分，必須另立需求，不能從本回饋工具直接推導。

## 執行測試

```bash
python3 -m unittest discover -s lessons/boya-intermediate-i/lesson-01/10-design/support-draft/rubric-project/tests -p 'test_*.py'
```
