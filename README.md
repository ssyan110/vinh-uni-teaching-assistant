# 榮市大學華語教材專案

本仓库采用「课程实例 → 教材 → 课次」结构，可同时保留并生产多本教材：

```text
course/                         # 课程身份与各学期开课实例
textbooks/<textbook_id>/        # 每本教材的 PDF、QR、音频与来源清单
lessons/<textbook_id>/lesson-XX # 该教材每课的设计、authority、QA 与 release
classroom-tools/                # 可跨教材复用的课堂工具
archive/                        # 历史快照，不作为生产输入
```

## 当前教材状态

- `boya-quasi-intermediate-i`：《准中级加速篇 I》，本学期使用；当前只开放第一课来源审核。
- `boya-intermediate-i`：《中级冲刺篇 I》，完整保留并直接登记于 `2027-fall`，规划给三年级使用；第一课已有批准的 authority、QA 与 release。

## 路径规则

- 原始 PDF：`textbooks/<textbook_id>/source/raw/`
- QR 截图：`textbooks/<textbook_id>/source/qr/captures/`
- QR 识别记录：`textbooks/<textbook_id>/source/qr/detection/`，或同层扫描索引
- 音频：`textbooks/<textbook_id>/source/audio/lesson-XX/`
- 来源清单：`textbooks/<textbook_id>/source/source-inventory.json`
- 逐课生产：`lessons/<textbook_id>/lesson-XX/`

新增教材时，先建立 `textbooks/<textbook_id>/textbook.json` 并登记到 `textbooks/registry.json`，再建立同名的 `lessons/<textbook_id>/`。同一学期使用多本教材时，只需在对应 `course/offerings/<offering_id>/offering.json` 的 `textbooks` 数组中登记，不复制课程根目录。

PDF、MP3 与大型衍生文件保留在本机，不提交 Git；QR、来源清单、下载来源、审核记录与生产 manifest 进入版本控制。
