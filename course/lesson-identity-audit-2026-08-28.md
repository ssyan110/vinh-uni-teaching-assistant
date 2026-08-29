# 課次身份與教材範圍稽核

稽核日期：2026-08-28

## 結論

《博雅漢語聽說：準中級加速篇 I》和《博雅漢語聽說：中級衝刺篇 I》是同一門課程的兩本不同教材。兩本教材都可以有第一課、第二課；課號只在各自教材內有效。跨檔案、dashboard、QA、生成器與交付紀錄必須使用：

```text
<textbook_id>:<lesson_id>
```

因此目前兩個第一課分別是：

| 課次身份 | 教材 | 課名 | 開課實例 |
|---|---|---|---|
| `boya-quasi-intermediate-i:lesson-01` | 《準中級加速篇 I》 | 麗麗是獨生女 | `2026-fall` |
| `boya-intermediate-i:lesson-01` | 《中級衝刺篇 I》 | 中國人的姓名 | `2027-fall` |

## 問題成因

1. 2026-08-27 將課程來源切換到準中級教材後，舊的中級教材來源、已批准第一課與生成器仍然保留；保留本身是正確的，但沒有一個跨教材的唯一課次身份。
2. 後續依教材整理目錄時，資料夾已分成 `lessons/<textbook_id>/lesson-XX/`，但 `project.config.json` 仍只有裸的 `lesson_id`，dashboard 也以 `lesson-XX` 作為摘要 ID 和 detail key。
3. dashboard 的舊 fallback 曾直接指向《中級衝刺篇 I》的來源索引；當前 active textbook 是準中級時，這會讓舊教材看起來像當前教材。
4. 舊《中級衝刺篇 I》來源 manifest 的 `course_id`、`lesson_id` 格式並不一致，有些使用 `boya-intermediate-i-lesson-XX`，有些只使用 `lesson-XX`；這增加了依課號或字串猜教材的風險。
5. 早期記憶與歷史 QA 仍保存裸路徑，例如 `lessons/lesson-01` 和 `work/boya-intermediate`。它們是舊《中級衝刺篇 I》脈絡，不是準中級教材遺失或被取代。

## 已完成的修正

- 建立 `course/lesson-registry.json`，登記兩本教材共 20 個課次；同號課次以不同 `lesson_key` 共存。
- 在 `project.config.json`、course manifest、textbook registry、兩個 offering manifest 與各課 source manifest 登記教材範圍。
- 將 active context 鎖定為 `boya-quasi-intermediate-i:lesson-01`。
- dashboard 改為只從 active textbook 的 registry scope 讀取，摘要與 detail 使用 compound key，不再以裸課號互相覆蓋。
- 建立 `scripts/validate_lesson_identity.py`，並接入 dashboard build 與 production gate；它會檢查 key、路徑、manifest 身份與 active context 是否一致。
- 將舊中級教材的來源 manifest 統一補上 `course_id`、`textbook_id`、本教材內的 `lesson_id` 與 `lesson_key`；不修改其已批准 authority/release 內容。
- 在記憶庫加入 scope guard：舊中級條目必須先核對教材範圍，不能覆蓋目前 active context。

## 目前證據邊界

本次結構修正已確認準中級第一課的來源路徑是：

```text
lessons/boya-quasi-intermediate-i/lesson-01/00-source/
```

但目前 checkout 內沒有找到該課對應的 `20-approved/` 與 `40-release/` 檔案；其現有 source manifest 仍標為 `source_audit_in_progress`。使用者所說的「第一課已完成交付」需要把正確的準中級 authority/release 檔案重新對回這個 `lesson_key`，不能用中級教材第一課的 authority/release 代替。

## 驗證

```text
python3 scripts/validate_lesson_identity.py
python3 scripts/build_lesson_registry.py
python3 scripts/build_dashboard.py
python3 -m unittest discover -s tests -p 'test*.py'
node --check dashboard/app.js
```

結果：20 個教材範圍課次通過身份驗證；測試 14/14 通過；dashboard 產生的課次 ID 不再是裸的 `lesson-01`。
