# Hệ thống học liệu AI · Huashu Design

Mục tiêu: tạo học liệu sẵn sàng cho giảng viên bằng repo `huashu-design` cục bộ làm quy trình thiết kế, tạo slide HTML và xuất PDF backup.

## Bắt đầu với bản classic

Nhánh `main` là bản **classic** ổn định để tạo slide HTML. Có thể tải bằng **Code → Download ZIP** trên GitHub, hoặc clone và chạy:

```bash
git clone https://github.com/ssyan110/ai-teaching-material-system.git
cd ai-teaching-material-system
npm ci
cp examples/sample-lesson.json examples/my-lesson.json
# Chỉnh examples/my-lesson.json, sau đó tạo slide:
npm run create:deck -- examples/my-lesson.json
npm run validate
```

Mở `output/sample-teacher-deck/index.html` để trình chiếu. Mã nguồn từng slide nằm trong `output/sample-teacher-deck/slides/` và có thể chỉnh trực tiếp.

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

Steps 9–18 are not automated as final materials until teacher review/approval. For the Pinyin Lesson 1 PDF, the current database output is:

`output/vp-database/pinyin-l1/06_google_sheets_database.csv`

Google Workspace is not authenticated on this machine yet, so the system exports CSV/JSON files ready for Sheets import.

## Quy tắc thiết kế

For Pinyin materials, use reference PDFs only as **copyright-safe design references**. The style direction is documented in:

- `design/pinyin-reference-inspired-style.md`
- `design/pinyin-reference-inspired-style.tokens.json`

Do not copy exact artwork, title lettering, composition, colors, copyright text, or brand/contact information from source PDFs.

Chỉ báo trang trên slide (`.page-indicator`) phải là trang giáo trình, ví dụ `Trang 1` hoặc `Trang 1-2`; không dùng số thứ tự slide hoặc trang PDF. Slide tự thiết kế không có trang nguồn thì bỏ chỉ báo này. Các phần hoạt động tạo thêm trên lớp không xuất hiện trực tiếp trong sách, nhất là `Luyện tập tổng hợp` và `Văn hóa bổ sung`, cũng không hiển thị chỉ báo trang. Không dùng thêm `.source` footer.

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
- File PDF backup
- Hướng dẫn giảng viên / kịch bản dạy
- Google Sheets-ready CSV/JSON database output for VP lesson planning

## Vì sao dùng Huashu Design

Huashu Design phù hợp cho pipeline học liệu vì:

- Nguồn HTML dễ chỉnh sửa và quản lý phiên bản.
- PDF backup được xuất từ cùng một nguồn, không cần dựng tay lại.
- Ghi chú giảng viên, tiến trình lớp học, hoạt động và hỗ trợ song ngữ có thể mã hóa vào template.
- Có thể kiểm tra bằng Playwright trước khi giao tài liệu.

## Cấu trúc thư mục

- `huashu-design/` — repo thiết kế và script xuất file
- `examples/sample-lesson.json` — dữ liệu bài học mẫu, tiếng Việt + Trung giản thể
- `scripts/create-teacher-deck.mjs` — tạo bộ slide giảng viên từ JSON
- `scripts/create-vp-pinyin-l1-database.py` — tạo database VP Pinyin Lesson 1
- `scripts/validate-system.mjs` — kiểm tra thiết lập và đầu ra
- `scripts/build-lesson-asset-manifest.mjs` — tạo `slides/assets/asset-manifest.json`
- `scripts/qa-lesson-assets.mjs` — kiểm tra asset/image workflow của một lesson
- `scripts/replace-lesson-image.mjs` — thay một ảnh lesson mà không sửa HTML thủ công
- `docs/lesson-slide-template-guide.md` — quy tắc tái sử dụng template Lesson 01 cho bài mới
- `docs/portable-slide-template-guide.md` — fast path to reuse the same slide family in another content-ready project
- `docs/image-asset-workflow.md` — quy trình ảnh: database metadata → manifest → QA
- `output/sample-teacher-deck/` — bộ slide mẫu
- `output/pinyin-l1-design-prototype/` — design prototype for Pinyin Lesson 1
- `output/vp-database/pinyin-l1/` — VP database CSV/JSON output

## Lệnh chạy

```bash
cd ai-teaching-material-system
npm run vp:pinyin:l1
npm run validate
```

Các lệnh thường dùng:

```bash
npm run validate
npm run assets:manifest -- output/book-1/lesson-01
npm run assets:qa -- output/book-1/lesson-01
npm run lesson:presenter -- output/book-1/lesson-01
npm run lesson:shells
```

## Quy trình cho bài học mới

1. Sao chép `examples/sample-lesson.json`.
2. Thay tiêu đề bài, mục tiêu, từ vựng, tiến trình, kiểm tra và bài tập.
3. Đảm bảo nội dung giảng viên bằng tiếng Việt, ngữ liệu tiếng Trung bằng giản thể.
4. Chạy generator.
5. Với bài regular có từ vựng: database phải có image metadata (`image_role`, `image_prompt`, `image_file`, `image_reuse_from`, `image_status`, `image_semantic_check`).
6. Khi tạo slide ban đầu, dùng ảnh placeholder trống đúng kích thước. Không tạo ảnh AI trong bước tạo slide.
7. Khi Adam yêu cầu ảnh thật, tạo ảnh bằng Chrome/ChatGPT hoặc nguồn được duyệt, rồi chèn bằng `assets:replace` hoặc `assets:crop-contact-sheet`.
8. Chạy `npm run assets:manifest -- output/book-1/lesson-XX` và `npm run assets:qa -- output/book-1/lesson-XX` cho bài mới/regenerated hoặc khi có sửa ảnh.
9. Xem `output/book-1/lesson-XX/index.html` trên trình duyệt.
10. Chạy kiểm tra trước khi gửi cho giảng viên/sinh viên.
11. Chỉ xuất PDF backup sau khi Adam xác nhận nội dung và thiết kế đã final.

## Quy tắc sản xuất

- Dùng Huashu Design làm ngữ pháp thiết kế và toolchain xuất file.
- Tài liệu mặc định cho đại học Việt Nam: tiếng Việt + tiếng Trung giản thể.
- Pinyin lessons dùng `output/pinyin/pinyin-01` làm template baseline. Không dựng lại từ đầu cho từng bài; giữ cùng cover/objectives/divider/concept/tone/vocab/flashcard/practice/input-setup/closing style, cùng phong cách ảnh soft textbook/course, rồi thay text, âm học, luật, từ vựng, bài tập và ảnh theo từng bài.
- Trong pinyin lessons, dùng đúng `thanh điệu`, không dùng `thanh điều`. Không tạo slide `Mục lục` hoặc `Quy ước`; pinyin classroom slides không hiện nhãn `Trang ...` ở góc dưới.
- Slide pinyin `Từ vựng 1`, `Từ vựng 2`, v.v. chỉ giữ top bar label và grid từ vựng. Không thêm dòng mô tả như `Tập trung đọc...`.
- Slide từ vựng dùng template Lesson 01: khung ảnh chữ nhật 16:9, không dùng crop tròn/icon. Bố cục: ảnh → pinyin → chữ Hán giản thể → nghĩa tiếng Việt → hán việt + loại từ.
- Slide mẫu câu (`MẪU CÂU`, file `sample-*`) dùng card câu ở giữa và một ảnh hỗ trợ trong khung tròn nhỏ dưới bên trái: `.sample-spot{left:52px;bottom:28px;width:116px;height:116px}`. Khung phải nằm giữa vòng tròn nền nhạt và ảnh phải khớp với cả mẫu câu.
- Ảnh từ vựng dùng phong cách textbook line-art mềm: viền mảnh xám xanh, màu pastel nhẹ, nền trắng/xám rất nhạt, không có chữ/số/ký tự trong ảnh. Slide mới dùng placeholder trống trước; sau khi chèn ảnh thật, render slide bị ảnh hưởng và kiểm tra ảnh có khớp từ hay không.
- Ảnh không được xử lý như việc sửa tay sau khi tạo slide. Mỗi complete lesson phải có `slides/assets/asset-manifest.json` và `exports/qa/asset-qa-report.json`.
- Khi thay một ảnh từ vựng, dùng `npm run assets:replace -- --lesson output/book-1/lesson-XX --record V001 --image /path/to/new.png`.
- Xem `docs/lesson-slide-template-guide.md` trước khi tạo hoặc chỉnh lesson deck mới.
- Xem `docs/image-asset-workflow.md` trước khi tạo, thay, hoặc QA ảnh.
- Slide phải viết bằng HTML rõ ràng, dễ render và dễ export PDF:
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

Pinyin Lesson 1 design prototype:

- `output/pinyin-l1-design-prototype/index.html`
- `output/pinyin-l1-design-prototype/pinyin-l1-design-prototype.pdf`
- `output/pinyin-l1-design-prototype/pinyin-l1-design-prototype-editable.pptx`

VP database:

- `output/vp-database/pinyin-l1/06_google_sheets_database.csv`
- `output/vp-database/pinyin-l1/vp_pinyin_l1_database.json`
