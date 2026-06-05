# VP 教材資料庫 · 第一课 · 你好 · Bài 1 · Xin chào

Scope: VP 製作流程 steps 1–9 (includes teacher review). Steps 10–18 pending.

Lesson type: `regular` (config version 1.0.0)
Source PDF: `work/pdf-pages/`
Generated: 2026-05-21T08:10:27+00:00
Last updated: 2026-05-27

## Generated files

- `02_content_items.csv` — steps 3–4 extraction + page mapping
- `03_lesson_structure.csv` — step 5 teaching restructure (canonical slide sequence with filenames)
- `04_supplemental_activities.csv` — step 6 activities
- `05_game_suggestions.csv` — step 7 game markers
- `06_google_sheets_database.csv` — step 8 Google Sheets-ready database
- `vp_lesson_01_database.json` — full machine-readable package

## Current slide structure (56 slides)

| Range | Module | Notes |
|-------|--------|-------|
| 01 | Trang bìa | Cover |
| 02 | Mục tiêu | Objectives |
| 03 | Khởi động | Warm-up |
| 04–25 | Từ vựng | 11 từ vựng + mẫu câu; `.page-indicator` uses printed textbook pages |
| 26 | Divider: Tập từ vựng | 词汇练习 |
| 27–28 | Mini quiz từ vựng | 01-06/11 and 07-11/11 |
| 29 | Divider: Luyện tập tổng hợp | 综合练习 |
| 30–36 | Luyện từ vựng | Flashcard + số + biến điệu 不 |
| 37–38 | Bài đọc | Divider + hội thoại 你好 |
| 39 | Divider: Tập viết | 写汉字 |
| 40–50 | Tập viết | 11 chữ Hán: 一八大不五口白女马你好 |
| 51–53 | Văn hóa bổ sung | Cách chào + cử chỉ số |
| 54–55 | Bài tập về nhà | Divider + danh sách bài tập |
| 56 | Kết thúc | Closing |

## Key decisions recorded

- **你好 removed as standalone vocab slide.** It appears only in vocab summary quiz (27-28) and dialogue (38). Vocab total = 11 (not 12).
- **Visible page indicators use printed textbook pages.** Slide `.page-indicator` shows printed textbook page/range from this database, such as `Trang 1` or `Trang 1-2`; it is not the slide number or PDF page. Slides with no textbook source omit `.page-indicator`. Do not add separate `.source` footers.
- **Lesson 01 PDF/page mapping:** `work/pdf-pages/page-019.jpg` is printed textbook page 1, so Lesson 01 uses `printed textbook page = PDF page - 18`. The database `source_page` / `source_page_range` values are printed textbook pages; PDF positions are only for locating source images.
- **Slide filenames are sequentially numbered** matching MANIFEST position (01–56, no gaps).
- **Divider naming:** `26-divider-practice-vocab` = TẬP TỪ VỰNG / 词汇练习; `29-divider-comprehensive` = LUYỆN TẬP TỔNG HỢP / 综合练习.

## Pipeline config

Teaching sequence (13 modules in current build):
  1. Trang bìa
  2. Mục tiêu học tập
  3. Khởi động
  4. Từ vựng (11 từ + mẫu câu)
  5. Divider: Tập từ vựng
  6. Ôn tập từ vựng (mini quiz)
  7. Divider: Luyện tập tổng hợp
  8. Luyện từ vựng (flashcard + số + biến điệu)
  9. Bài đọc
  10. Tập viết chữ Hán
  11. Văn hóa bổ sung
  12. Bài tập về nhà
  13. Kết thúc
