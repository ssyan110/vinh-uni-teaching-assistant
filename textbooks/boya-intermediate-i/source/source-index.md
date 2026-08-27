# 《博雅汉语听说·中级冲刺篇 I》教材资料索引

## 规范输入位置

| 资料 | 位置 | 状态 |
|---|---|---|
| 教材 PDF | `raw/博雅汉语听说-中级冲刺篇I.pdf` | 已有；扫描图像型 PDF，共148页 |
| 每课 QR code | `qr/captures/` | 已截取并按 `lesson-01` 至 `lesson-08` 命名；均已验证可读取 |
| QR 识别记录 | `qr/detection/` | 8 课识别记录已归档 |
| 听力音频根目录 | `audio/` | 8课已全部归档，共91个 MP3 |

## 教材课次与页面

| 课次 | 课名 | 教材印刷页 | PDF页 | 音频状态 |
|---|---|---:|---:|---|
| 第1课 | 中国人的姓名 | 1–16 | 12–27 | 已下载，11个 |
| 第2课 | 真正的朋友 | 17–31 | 28–42 | 已下载，12个 |
| 第3课 | 宜居之地 | 32–45 | 43–56 | 已下载，11个 |
| 第4课 | 地球人的担忧 | 46–62 | 57–73 | 已下载，12个 |
| 第5课 | 音乐的魅力 | 63–78 | 74–89 | 已下载，12个 |
| 第6课 | 挑战 | 79–95 | 90–106 | 已下载，12个 |
| 第7课 | 我的同事 | 96–110 | 107–121 | 已下载，10个 |
| 第8课 | 学汉语的苦恼 | 111–126 | 122–137 | 已下载，11个 |

## 音频归档

所有课次音频均由对应教材首页 QR code 下载，已按课次归档到：

`/Users/ssyan110/Development/vinh-uni-teaching-assistant/textbooks/boya-intermediate-i/source/audio/`

第1课的原始下载目录仍保留在：

`/Users/ssyan110/Desktop/Agent outputs/Hermes Output/Downloads/qr71_第01课_音频`

每课文件编号均按 QR 下载的原始名称保留。每个课次目录包含 `下载来源.md`；第1课另外保留原始下载说明和 JSON 清单。

| 课次 | 音频目录 | MP3数量 |
|---|---|---:|
| 第1课 | `audio/lesson-01/` | 11 |
| 第2课 | `audio/lesson-02/` | 12 |
| 第3课 | `audio/lesson-03/` | 11 |
| 第4课 | `audio/lesson-04/` | 12 |
| 第5课 | `audio/lesson-05/` | 12 |
| 第6课 | `audio/lesson-06/` | 12 |
| 第7课 | `audio/lesson-07/` | 10 |
| 第8课 | `audio/lesson-08/` | 11 |

## 每课 QR code

每课首页的听力 QR code 已集中整理到：

`/Users/ssyan110/Development/vinh-uni-teaching-assistant/textbooks/boya-intermediate-i/source/qr/captures/`

文件为 `lesson-01.png` 至 `lesson-08.png`，对应课名和 QR 读取网址见 `qr/README.md`。

## 后续归档规则

每一课使用独立目录，并保留 QR 下载时的文件名：

```text
audio/
├── lesson-01/
│   ├── 1-1.mp3
│   ├── 1-2.mp3
│   ├── ...
│   ├── 来源说明.txt
│   └── 下载清单.json
├── lesson-02/（12个 MP3＋下载来源.md）
├── lesson-03/（11个 MP3＋下载来源.md）
├── lesson-04/（12个 MP3＋下载来源.md）
├── lesson-05/（12个 MP3＋下载来源.md）
├── lesson-06/（12个 MP3＋下载来源.md）
├── lesson-07/（10个 MP3＋下载来源.md）
└── lesson-08/（11个 MP3＋下载来源.md）
```

正式建立课程数据库或教案时，同时记录：

- `source_page`：教材印刷页码。
- `source_pdf_page`：PDF页码。
- `audio_file`：对应音频目录内的文件名。
- `audio_status`：已确认、待下载或待人工核对。
