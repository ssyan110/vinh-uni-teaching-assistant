# Hệ thống học liệu AI · Huashu Design

Mục tiêu: tạo học liệu sẵn sàng cho giảng viên bằng repo `huashu-design` cục bộ làm quy trình thiết kế, tạo slide và xuất PDF/PPTX.

## VP 製作流程 scope

This system treats the VP teaching-material flow as **steps 1–8 only before teacher review**:

1. input PDF
2. lesson split
3. content extraction
4. page mapping
5. teaching restructure
6. supplemental activities
7. game suggestions
8. Google Sheets-ready database output

Steps 9–19 are not automated as final materials until teacher review/approval. For the Pinyin Lesson 1 PDF, the current database output is:

`output/vp-database/pinyin-l1/06_google_sheets_database.csv`

Google Workspace is not authenticated on this machine yet, so the system exports CSV/JSON files ready for Sheets import.

## Quy tắc thiết kế

For Pinyin materials, use reference PDFs only as **copyright-safe design references**. The style direction is documented in:

- `design/pinyin-reference-inspired-style.md`
- `design/pinyin-reference-inspired-style.tokens.json`

Do not copy exact artwork, title lettering, composition, colors, copyright text, or brand/contact information from source PDFs.

## Quy tắc ngôn ngữ mặc định

Tất cả học liệu trong dự án này dùng cho **đại học Việt Nam**, nên mặc định là:

- **Tiếng Việt**: hướng dẫn giảng viên, nhãn slide, ghi chú lớp học, hoạt động, kiểm tra, bài tập.
- **Tiếng Trung giản thể**: ví dụ tiếng Trung, hội thoại, từ vựng, tiêu đề tiếng Trung khi cần.
- **Pinyin**: dùng để hỗ trợ phát âm.
- Không dùng tiếng Trung phồn thể trong courseware trừ khi Adam yêu cầu riêng.

## Hệ thống tạo ra gì

- Bộ slide HTML dành cho giảng viên
- Slide nguồn có thể chỉnh sửa (`slides/*.html`)
- Bản trình chiếu trên trình duyệt (`index.html`)
- File PDF vector
- File PPTX có thể chỉnh sửa
- Hướng dẫn giảng viên / kịch bản dạy
- Google Sheets-ready CSV/JSON database output for VP lesson planning

## Vì sao dùng Huashu Design

Huashu Design phù hợp cho pipeline học liệu vì:

- Nguồn HTML dễ chỉnh sửa và quản lý phiên bản.
- PDF/PPTX được xuất từ cùng một nguồn, không cần dựng tay lại.
- Ghi chú giảng viên, tiến trình lớp học, hoạt động và hỗ trợ song ngữ có thể mã hóa vào template.
- Có thể kiểm tra bằng Playwright trước khi giao tài liệu.

## Cấu trúc thư mục

- `huashu-design/` — repo thiết kế và script xuất file
- `examples/sample-lesson.json` — dữ liệu bài học mẫu, tiếng Việt + Trung giản thể
- `scripts/create-teacher-deck.mjs` — tạo bộ slide giảng viên từ JSON
- `scripts/create-vp-pinyin-l1-database.py` — tạo database VP Pinyin Lesson 1
- `scripts/validate-system.mjs` — kiểm tra thiết lập và đầu ra
- `output/sample-teacher-deck/` — bộ slide mẫu
- `output/pinyin-l1-design-prototype/` — design prototype for Pinyin Lesson 1
- `output/vp-database/pinyin-l1/` — VP database CSV/JSON output

## Lệnh chạy

```bash
cd ~/Development/ai-teaching-material-system
npm run build:sample
npm run vp:pinyin:l1
```

Các bước riêng:

```bash
npm run create:sample
npm run verify:html
npm run export:pdf
npm run export:pptx
npm run validate
```

## Quy trình cho bài học mới

1. Sao chép `examples/sample-lesson.json`.
2. Thay tiêu đề bài, mục tiêu, từ vựng, tiến trình, kiểm tra và bài tập.
3. Đảm bảo nội dung giảng viên bằng tiếng Việt, ngữ liệu tiếng Trung bằng giản thể.
4. Chạy generator.
5. Xem `output/<deck>/index.html` trên trình duyệt.
6. Xuất PDF/PPTX.
7. Chạy kiểm tra trước khi gửi cho giảng viên/sinh viên.

## Quy tắc sản xuất

- Dùng Huashu Design làm ngữ pháp thiết kế và toolchain xuất file.
- Tài liệu mặc định cho đại học Việt Nam: tiếng Việt + tiếng Trung giản thể.
- Nếu cần PPTX chỉnh sửa được, slide phải viết theo HTML an toàn cho PPTX ngay từ đầu:
  - `body` = `960pt × 540pt`
  - text nằm trong `<p>` / `<h1>`-`<h6>`
  - không dùng CSS gradient
  - không đặt background/border/shadow trực tiếp trên text tag
  - dùng `<img>`, không dùng `background-image`
- Kiểm tra mọi deck bằng Playwright trước khi giao.

## Đầu ra hiện tại

Bộ mẫu hệ thống:

- `output/sample-teacher-deck/index.html`
- `output/sample-teacher-deck/teacher-deck.pdf`
- `output/sample-teacher-deck/teacher-deck-editable.pptx`

Pinyin Lesson 1 design prototype:

- `output/pinyin-l1-design-prototype/index.html`
- `output/pinyin-l1-design-prototype/pinyin-l1-design-prototype.pdf`
- `output/pinyin-l1-design-prototype/pinyin-l1-design-prototype-editable.pptx`

VP database:

- `output/vp-database/pinyin-l1/06_google_sheets_database.csv`
- `output/vp-database/pinyin-l1/vp_pinyin_l1_database.json`
