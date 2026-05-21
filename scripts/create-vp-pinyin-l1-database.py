#!/usr/bin/env python3
"""Create VP step 1-8 database outputs for Pinyin Lesson 1.

DEPRECATED: Use `scripts/run_pipeline.py --lesson-type pinyin` instead.
This script is kept as a reference for the hardcoded data structure.
The new pipeline reads from `work/design-ref-pinyin-l1/extract.json`.

This intentionally stops before teacher review (VP step 9). Outputs are Google
Sheets-ready CSV files plus a JSON package for future automation.
"""
from __future__ import annotations

import csv
import json
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PDF = Path('/Users/ssyan110/.hermes/cache/documents/doc_6df651b622fb_pinyin-l1.14102024210713.pdf')
EXTRACT = ROOT / 'work' / 'design-ref-pinyin-l1' / 'extract.txt'
OUT = ROOT / 'output' / 'vp-database' / 'pinyin-l1'

LESSON_ID = 'pinyin-l1'
LESSON_TITLE = 'Pinyin · Bài 1'

# Step 2: lesson split. The attached PDF is a standalone Pinyin Lesson 1 deck.
lesson_list = [
    {
        'lesson_id': LESSON_ID,
        'lesson_title': LESSON_TITLE,
        'source_pdf': str(PDF),
        'core_pages': '1-17',
        'support_pages': '18-20',
        'excluded_pages': '21 contact/brand page',
        'status': 'draft_for_teacher_review',
        'notes': 'Core lesson content is pages 1-17. Pages 18-19 are keyboard setup support; page 20 is notes; page 21 is contact/brand and should not be used in classroom materials.',
    }
]

# Step 3-4: extracted content + page mapping. Cleaned from PDF extraction and visual inspection.
content_items = [
    # concepts
    {'id':'C001','page':3,'section':'Mục lục','type':'outline','zh':'','pinyin':'','vi':'Khái niệm về pinyin; thanh mẫu; vận mẫu; thanh điệu; từ vựng; thử thách bản thân','pos':'','raw':'Hôm nay bạn sẽ học những gì? Nội dung...', 'seq':1},
    {'id':'C002','page':4,'section':'Khái niệm pinyin','type':'concept','zh':'拼音','pinyin':'pīnyīn','vi':'Phiên âm tiếng Trung; công cụ giúp đọc chữ Hán và luyện phát âm','pos':'danh từ','raw':'Vì sao chúng ta nên học pinyin? Phiên âm / Chữ Hán / hǎo / nǐ', 'seq':2},
    {'id':'C003','page':5,'section':'Khái niệm pinyin','type':'concept','zh':'声母','pinyin':'shēng mǔ','vi':'Thanh mẫu: phụ âm đầu trong âm tiết tiếng Trung','pos':'danh từ','raw':'Thanh mẫu là phụ âm trong tiếng Trung. Nó luôn đứng trước một phiên âm.', 'seq':3},
    {'id':'C004','page':5,'section':'Khái niệm pinyin','type':'concept','zh':'韵母','pinyin':'yùn mǔ','vi':'Vận mẫu: phần vần/nguyên âm, thành phần thiết yếu của âm tiết','pos':'danh từ','raw':'Vận mẫu là nguyên âm trong tiếng Trung, được xem là thành phần thiết yếu của một âm tiết.', 'seq':4},
    {'id':'C005','page':5,'section':'Khái niệm pinyin','type':'concept','zh':'声调','pinyin':'shēng diào','vi':'Thanh điệu: dấu giọng làm thay đổi nghĩa của từ','pos':'danh từ','raw':'Trong tiếng Trung có 4 thanh điệu chính, được biểu thị bằng dấu.', 'seq':5},
    # initials/finals
    {'id':'P001','page':6,'section':'Phát âm','type':'pinyin_table','zh':'发音','pinyin':'fāyīn','vi':'Ghép thanh mẫu b/p/m/f với vận mẫu a/o/e/i/u/ü; vận mẫu er không ghép với thanh mẫu','pos':'','raw':'Kết hợp đọc thanh mẫu và vận mẫu theo như bảng. er không ghép được với bất kỳ thanh mẫu nào.', 'seq':6},
    {'id':'P002','page':6,'section':'Thanh mẫu','type':'initials','zh':'','pinyin':'b p m f','vi':'Nhóm thanh mẫu đầu bài: b, p, m, f','pos':'','raw':'b ba bo bi bu; p pa po pi pu; m ma mo me mi mu; f fa fo fu', 'seq':7},
    {'id':'P003','page':6,'section':'Vận mẫu','type':'finals','zh':'','pinyin':'a o e i u ü er','vi':'Nhóm vận mẫu đầu bài: a, o, e, i, u, ü, er','pos':'','raw':'a o e i u ü; er special final', 'seq':8},
    {'id':'P004','page':7,'section':'Quy tắc viết pinyin','type':'spelling_rule','zh':'拼写规则','pinyin':'i → yi; u → wu; ü → yu','vi':'Khi i/u/ü đứng độc lập thành âm tiết: thêm y/w theo quy tắc và bỏ hai chấm của ü khi viết yu','pos':'','raw':'i → yi; u → wu; ü → yu', 'seq':9},
    # tones
    {'id':'T001','page':8,'section':'Thanh điệu','type':'tone','zh':'妈','pinyin':'mā','vi':'Thanh 1: cao và ngang (55)','pos':'ví dụ','raw':'妈 mā thanh 1 55', 'seq':10},
    {'id':'T002','page':8,'section':'Thanh điệu','type':'tone','zh':'麻','pinyin':'má','vi':'Thanh 2: đi lên (35)','pos':'ví dụ','raw':'麻 má thanh 2 35', 'seq':11},
    {'id':'T003','page':8,'section':'Thanh điệu','type':'tone','zh':'马','pinyin':'mǎ','vi':'Thanh 3: xuống rồi lên (214)','pos':'ví dụ','raw':'马 mǎ thanh 3 214', 'seq':12},
    {'id':'T004','page':8,'section':'Thanh điệu','type':'tone','zh':'骂','pinyin':'mà','vi':'Thanh 4: xuống mạnh (51)','pos':'ví dụ','raw':'骂 mà thanh 4 51', 'seq':13},
    {'id':'T005','page':8,'section':'Thanh điệu','type':'tone','zh':'吗','pinyin':'ma','vi':'Thanh nhẹ: không ghi dấu','pos':'ví dụ','raw':'吗 ma thanh nhẹ', 'seq':14},
    {'id':'E001','page':9,'section':'Luyện tập','type':'exercise','zh':'练习','pinyin':'','vi':'Nghe và chọn đáp án đúng cho mỗi câu','pos':'','raw':'Nghe và chọn đáp án đúng cho mỗi câu.', 'seq':15},
    # vocab pages 10 and 12
    {'id':'V001','page':10,'section':'Từ vựng','type':'vocabulary','zh':'不','pinyin':'bù','vi':'không; chẳng','pos':'phó từ','raw':'不 bù', 'seq':16},
    {'id':'V002','page':10,'section':'Từ vựng','type':'vocabulary','zh':'笔','pinyin':'bǐ','vi':'bút','pos':'danh từ','raw':'笔 bǐ', 'seq':17},
    {'id':'V003','page':10,'section':'Từ vựng','type':'vocabulary','zh':'雨','pinyin':'yǔ','vi':'mưa','pos':'danh từ','raw':'雨 yǔ', 'seq':18},
    {'id':'V004','page':10,'section':'Từ vựng','type':'vocabulary','zh':'鱼','pinyin':'yú','vi':'cá','pos':'danh từ','raw':'鱼 yú', 'seq':19},
    {'id':'V005','page':10,'section':'Từ vựng','type':'vocabulary','zh':'一','pinyin':'yī','vi':'một','pos':'số từ','raw':'一 yī', 'seq':20},
    {'id':'V006','page':10,'section':'Từ vựng','type':'vocabulary','zh':'二','pinyin':'èr','vi':'hai','pos':'số từ','raw':'二 èr', 'seq':21},
    {'id':'V007','page':10,'section':'Từ vựng','type':'vocabulary','zh':'饿','pinyin':'è','vi':'đói','pos':'tính từ / động từ trạng thái','raw':'饿 è', 'seq':22},
    {'id':'V008','page':10,'section':'Từ vựng','type':'vocabulary','zh':'鹅','pinyin':'é','vi':'ngỗng','pos':'danh từ','raw':'鹅 é', 'seq':23},
    {'id':'E002','page':11,'section':'Luyện tập','type':'exercise','zh':'练习','pinyin':'','vi':'Nghe và chọn đáp án đúng cho mỗi câu','pos':'','raw':'Nghe và chọn đáp án đúng cho mỗi câu.', 'seq':24},
    {'id':'V009','page':12,'section':'Từ vựng','type':'vocabulary','zh':'服务','pinyin':'fú wù','vi':'phục vụ; dịch vụ','pos':'động từ / danh từ','raw':'服务 fú wù', 'seq':25},
    {'id':'V010','page':12,'section':'Từ vựng','type':'vocabulary','zh':'衣服','pinyin':'yī fu','vi':'quần áo','pos':'danh từ','raw':'衣服 yī fu', 'seq':26},
    {'id':'V011','page':12,'section':'Từ vựng','type':'vocabulary','zh':'五','pinyin':'wǔ','vi':'năm','pos':'số từ','raw':'五 wǔ', 'seq':27},
    {'id':'V012','page':12,'section':'Từ vựng','type':'vocabulary','zh':'怕','pinyin':'pà','vi':'sợ','pos':'động từ / tính từ','raw':'怕 pà', 'seq':28},
    {'id':'V013','page':12,'section':'Từ vựng','type':'vocabulary','zh':'妈妈','pinyin':'mā ma','vi':'mẹ','pos':'danh từ','raw':'妈妈 mā ma', 'seq':29},
    {'id':'V014','page':12,'section':'Từ vựng','type':'vocabulary','zh':'父母','pinyin':'fù mǔ','vi':'bố mẹ; cha mẹ','pos':'danh từ','raw':'父母 fù mǔ', 'seq':30},
    {'id':'V015','page':12,'section':'Từ vựng','type':'vocabulary','zh':'婆婆','pinyin':'pó po','vi':'mẹ chồng; bà nội/bà ngoại theo ngữ cảnh','pos':'danh từ','raw':'婆婆 pó po', 'seq':31},
    {'id':'V016','page':12,'section':'Từ vựng','type':'vocabulary','zh':'爸爸','pinyin':'bà ba','vi':'bố; ba','pos':'danh từ','raw':'爸爸 bà ba', 'seq':32},
    {'id':'E003','page':13,'section':'Luyện tập','type':'exercise','zh':'练习','pinyin':'wǔ; fù mǔ; fú wù','vi':'Nối hình với phiên âm tương ứng','pos':'','raw':'Nối những hình sau với phiên âm tương ứng.', 'seq':33},
    {'id':'E004','page':15,'section':'Thử thách bản thân','type':'exercise','zh':'自我挑战','pinyin':'mā; má; mǎ; mà; ma','vi':'Nối phiên âm với thanh điệu tương ứng','pos':'','raw':'Nối những phiên âm sau với thanh điệu tương ứng.', 'seq':34},
    {'id':'E005','page':16,'section':'Thử thách bản thân','type':'exercise','zh':'自我挑战','pinyin':'','vi':'Nhìn hình và viết phiên âm đúng vào ô trống','pos':'','raw':'Nhìn hình và viết phiên âm đúng của mỗi từ vào ô trống.', 'seq':35},
    {'id':'A001','page':18,'section':'Phụ lục','type':'appendix','zh':'简体中文','pinyin':'','vi':'Cách cài bộ gõ tiếng Trung trên iOS','pos':'','raw':'Cách cài đặt bộ gõ tiếng Trung cho điện thoại — iOS', 'seq':36},
    {'id':'A002','page':19,'section':'Phụ lục','type':'appendix','zh':'简体中文','pinyin':'','vi':'Cách cài bộ gõ tiếng Trung trên Android','pos':'','raw':'Cách cài đặt bộ gõ tiếng Trung cho điện thoại — Android', 'seq':37},
]

# Step 5: restructure into new teaching sequence.
lesson_structure = [
    {'order':1,'module':'Khởi động','content_focus':'Tại sao cần học pinyin? Liên hệ chữ Hán và phiên âm','source_pages':'3-4','item_ids':'C001,C002','estimated_minutes':5},
    {'order':2,'module':'Khái niệm nền tảng','content_focus':'Thanh mẫu, vận mẫu, thanh điệu qua ví dụ hǎo','source_pages':'5','item_ids':'C003,C004,C005','estimated_minutes':8},
    {'order':3,'module':'Pinyin: thanh mẫu + vận mẫu','content_focus':'b/p/m/f + a/o/e/i/u/ü; er','source_pages':'6','item_ids':'P001,P002,P003','estimated_minutes':12},
    {'order':4,'module':'Quy tắc viết pinyin','content_focus':'i→yi, u→wu, ü→yu','source_pages':'7','item_ids':'P004','estimated_minutes':6},
    {'order':5,'module':'Thanh điệu','content_focus':'mā, má, mǎ, mà, ma và đường cao độ','source_pages':'8-9','item_ids':'T001,T002,T003,T004,T005,E001','estimated_minutes':12},
    {'order':6,'module':'Từ vựng 1','content_focus':'不、笔、雨、鱼、一、二、饿、鹅','source_pages':'10-11','item_ids':'V001,V002,V003,V004,V005,V006,V007,V008,E002','estimated_minutes':12},
    {'order':7,'module':'Từ vựng 2','content_focus':'服务、衣服、五、怕、妈妈、父母、婆婆、爸爸','source_pages':'12-13','item_ids':'V009,V010,V011,V012,V013,V014,V015,V016,E003','estimated_minutes':12},
    {'order':8,'module':'Kiểm tra cuối bài','content_focus':'Nối thanh điệu; nhìn hình viết pinyin','source_pages':'15-16','item_ids':'E004,E005','estimated_minutes':10},
    {'order':9,'module':'Phụ lục tùy chọn','content_focus':'Cài bộ gõ tiếng Trung giản thể trên điện thoại','source_pages':'18-19','item_ids':'A001,A002','estimated_minutes':5},
]

# Step 6: supplemental activities.
activities = [
    {'activity_id':'ACT001','module_order':1,'activity_type':'warmup','title':'Bạn đã thấy pinyin ở đâu?','description':'Sinh viên nhìn các ví dụ nǐ, hǎo, mā và đoán pinyin dùng để làm gì.','target_items':'C002','source_pages':'4','game_candidate':'no'},
    {'activity_id':'ACT002','module_order':2,'activity_type':'pinyin_drill','title':'Tách âm tiết hǎo','description':'Khoanh h = thanh mẫu, ao = vận mẫu, dấu ˇ = thanh điệu.','target_items':'C003,C004,C005','source_pages':'5','game_candidate':'yes'},
    {'activity_id':'ACT003','module_order':3,'activity_type':'pinyin_drill','title':'Bật hơi / không bật hơi','description':'Phân biệt b/p bằng các cặp ba-pa, bo-po, bi-pi, bu-pu.','target_items':'P001,P002','source_pages':'6','game_candidate':'yes'},
    {'activity_id':'ACT004','module_order':3,'activity_type':'pinyin_drill','title':'Ghép âm nhanh','description':'Giảng viên đưa thanh mẫu, sinh viên ghép với vận mẫu để đọc thành âm tiết.','target_items':'P001,P002,P003','source_pages':'6','game_candidate':'yes'},
    {'activity_id':'ACT005','module_order':4,'activity_type':'pinyin_drill','title':'Biến đổi i/u/ü','description':'Sinh viên đổi i→yi, u→wu, ü→yu và đọc lại.','target_items':'P004','source_pages':'7','game_candidate':'yes'},
    {'activity_id':'ACT006','module_order':5,'activity_type':'pinyin_drill','title':'Đường thanh điệu','description':'Đọc mā/má/mǎ/mà/ma theo đường cao độ 55/35/214/51/nhẹ.','target_items':'T001,T002,T003,T004,T005','source_pages':'8','game_candidate':'yes'},
    {'activity_id':'ACT007','module_order':6,'activity_type':'vocabulary_drill','title':'Cặp dễ nhầm','description':'So sánh 雨/鱼, 饿/鹅, 一/二 bằng pinyin và nghĩa tiếng Việt.','target_items':'V003,V004,V005,V006,V007,V008','source_pages':'10','game_candidate':'yes'},
    {'activity_id':'ACT008','module_order':7,'activity_type':'vocabulary_drill','title':'Gia đình và đồ dùng','description':'Nhóm từ theo chủ đề: gia đình, đồ dùng, hành động/trạng thái.','target_items':'V009,V010,V011,V012,V013,V014,V015,V016','source_pages':'12','game_candidate':'yes'},
    {'activity_id':'ACT009','module_order':8,'activity_type':'assessment','title':'Tự kiểm tra cuối bài','description':'Làm bài nối thanh điệu và bài nhìn hình viết pinyin từ giáo trình.','target_items':'E004,E005','source_pages':'15-16','game_candidate':'no'},
    {'activity_id':'ACT010','module_order':9,'activity_type':'culture_tech','title':'Cài bàn phím tiếng Trung giản thể','description':'Sinh viên cài 简体中文 / Pinyin-QWERTY để chuẩn bị nhập pinyin.','target_items':'A001,A002','source_pages':'18-19','game_candidate':'no'},
]

# Step 7: game suggestions.
game_suggestions = [
    {'game_id':'G001','activity_id':'ACT002','game_name':'Pinyin Detective','why_suitable':'Có đáp án ngắn, dễ thi theo nhóm: tìm thanh mẫu/vận mẫu/thanh điệu trong hǎo hoặc từ mới.', 'format':'nhóm nhỏ', 'risk':'Cần tránh dùng từ ngoài bài khi kiểm tra.'},
    {'game_id':'G002','activity_id':'ACT003','game_name':'Bật hơi relay','why_suitable':'b/p là cặp đối lập rõ, phù hợp thi đọc nhanh theo hàng.', 'format':'relay nhóm', 'risk':'Cần làm mẫu chuẩn trước khi thi.'},
    {'game_id':'G003','activity_id':'ACT004','game_name':'Ghép thẻ âm tiết','why_suitable':'Có thể tách thẻ thanh mẫu và vận mẫu, nhóm ghép rồi đọc.', 'format':'card game', 'risk':'Chỉ dùng tổ hợp đã học ở trang 6.'},
    {'game_id':'G004','activity_id':'ACT005','game_name':'Đổi chữ nhanh','why_suitable':'Quy tắc i/u/ü có thao tác biến đổi rõ ràng.', 'format':'bảng con / mini whiteboard', 'risk':'Nhấn mạnh yu mất dấu hai chấm khi viết.'},
    {'game_id':'G005','activity_id':'ACT006','game_name':'Tone Ladder','why_suitable':'Thanh điệu có cao độ, dễ làm trò chơi nghe-chọn hoặc đọc-theo-nấc.', 'format':'nghe chọn / đọc theo nhóm', 'risk':'Không chấm quá nặng thanh 3 với người mới.'},
    {'game_id':'G006','activity_id':'ACT007','game_name':'Minimal Pair Bingo','why_suitable':'雨/鱼, 饿/鹅 là các cặp dễ nhầm, phù hợp nghe chọn.', 'format':'bingo', 'risk':'Cần có audio/mẫu đọc chuẩn.'},
    {'game_id':'G007','activity_id':'ACT008','game_name':'Vocabulary Sorting','why_suitable':'Từ vựng có thể phân nhóm theo chủ đề hoặc loại từ.', 'format':'sắp thẻ theo nhóm', 'risk':'婆婆 cần giải thích nghĩa theo ngữ cảnh.'},
]

# Step 8: database rows for Google Sheets.
def database_rows():
    rows = []
    generated = datetime.now().isoformat(timespec='seconds')
    for item in content_items:
        rows.append({
            'lesson_id': LESSON_ID,
            'lesson_title': LESSON_TITLE,
            'record_id': item['id'],
            'record_type': item['type'],
            'section': item['section'],
            'source_pdf': str(PDF),
            'source_page': item['page'],
            'source_page_range': str(item['page']),
            'teaching_order': item['seq'],
            'chinese_simplified': item['zh'],
            'pinyin': item['pinyin'],
            'vietnamese': item['vi'],
            'word_type_vi': item['pos'],
            'raw_source_text': item['raw'],
            'classroom_visibility': 'student_visible' if item['type'] not in ['appendix'] else 'optional_student_visible',
            'teacher_review_status': 'pending_review',
            'approved': '',
            'notes_for_review': '',
            'generated_at': generated,
        })
    return rows


def write_csv(path: Path, rows: list[dict], fieldnames: list[str] | None = None):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not fieldnames:
        keys = []
        for r in rows:
            for k in r.keys():
                if k not in keys:
                    keys.append(k)
        fieldnames = keys
    with path.open('w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    metadata = {
        'vp_scope': 'Implement only steps 1-8 before teacher review',
        'steps_completed': [1,2,3,4,5,6,7,8],
        'steps_not_implemented': list(range(9,20)),
        'google_sheets_status': 'csv_ready; Google OAuth not authenticated on this machine',
        'source_pdf_exists': PDF.exists(),
        'source_pdf': str(PDF),
        'extract_file': str(EXTRACT),
        'generated_at': datetime.now().isoformat(timespec='seconds'),
    }
    db = database_rows()
    write_csv(OUT/'01_lesson_list.csv', lesson_list)
    write_csv(OUT/'02_content_items.csv', content_items)
    write_csv(OUT/'03_lesson_structure.csv', lesson_structure)
    write_csv(OUT/'04_supplemental_activities.csv', activities)
    write_csv(OUT/'05_game_suggestions.csv', game_suggestions)
    write_csv(OUT/'06_google_sheets_database.csv', db)
    package = {
        'metadata': metadata,
        'lesson_list': lesson_list,
        'content_items': content_items,
        'lesson_structure': lesson_structure,
        'supplemental_activities': activities,
        'game_suggestions': game_suggestions,
        'google_sheets_database': db,
    }
    (OUT/'vp_pinyin_l1_database.json').write_text(json.dumps(package, ensure_ascii=False, indent=2), encoding='utf-8')
    (OUT/'README.md').write_text(f'''# VP 教材資料庫 · Pinyin Bài 1\n\nScope: VP 製作流程 steps 1–8 only. This output stops before teacher review.\n\nSource PDF: `{PDF}`\n\nGenerated files:\n\n- `01_lesson_list.csv` — step 2 lesson list\n- `02_content_items.csv` — steps 3–4 extraction + page mapping\n- `03_lesson_structure.csv` — step 5 teaching restructure\n- `04_supplemental_activities.csv` — step 6 activities\n- `05_game_suggestions.csv` — step 7 game markers\n- `06_google_sheets_database.csv` — step 8 Google Sheets-ready database\n- `vp_pinyin_l1_database.json` — full machine-readable package\n\nGoogle Sheets note: this machine is not authenticated for Google Workspace, so the system produced CSV files ready to import/upload. After OAuth setup, `06_google_sheets_database.csv` can be appended to a Google Sheet.\n''', encoding='utf-8')
    print(json.dumps({'out': str(OUT), 'rows': len(db), 'activities': len(activities), 'games': len(game_suggestions)}, ensure_ascii=False))

if __name__ == '__main__':
    main()
