# 教材登记与来源

每本教材使用稳定的 `textbook_id` 建立独立目录：

```text
textbooks/<textbook_id>/
├── textbook.json
└── source/
    ├── raw/                 # 原始 PDF，本地保存，不提交 Git
    ├── qr/
    │   ├── captures/        # 每课 QR 截图
    │   └── detection/       # QR 识别记录或扫描索引
    ├── audio/
    │   └── lesson-XX/       # 每课音频，本地 MP3 不提交 Git
    ├── audit/               # 来源审计与下载验证记录
    └── source-inventory.json
```

教材来源只放在这里；`course/` 不保存教材文件，`lessons/` 不复制整本教材来源。新增教材时先登记 `textbooks/registry.json`，再建立同名的 `lessons/<textbook_id>/`。
