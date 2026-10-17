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

- `boya-elementary-i`：《初级起步篇 I》，2026-fall 一年级使用；具体班级、已教范围与课表从 offering 的 class_scope 和班级记录读取。
- `boya-quasi-intermediate-i`：《准中级加速篇 I》，本学期使用；课次状态以 `boya-quasi-intermediate-i:<lesson_id>` 对应的 manifest 为准。
- `boya-intermediate-i`：《中级冲刺篇 I》，完整保留并直接登记于 `2027-fall`，规划给三年级使用；其第一课身份是独立的 `boya-intermediate-i:lesson-01`。

不同教材可以同时存在相同的课号。跨文件引用使用 `course/lesson-registry.json` 中的 `lesson_key`，不能只写 `lesson-01`。

## 路径规则

- 原始 PDF：`textbooks/<textbook_id>/source/raw/`
- QR 截图：`textbooks/<textbook_id>/source/qr/captures/`
- QR 识别记录：`textbooks/<textbook_id>/source/qr/detection/`，或同层扫描索引
- 音频：`textbooks/<textbook_id>/source/audio/lesson-XX/`
- 来源清单：`textbooks/<textbook_id>/source/source-inventory.json`
- 逐课生产：`lessons/<textbook_id>/lesson-XX/`

## 投影片製作方式

2026-10-07 06:52 UTC確認：線上課PPT維持原狀，未來仍以PPT／PPTX優先，保留單詞一頁及已批准風格；只有實體課以HTML slides優先，需要時另備PPTX。

未來實體課預設HTML／OpenSlide，沿用[2026-10-07實體課標準](docs/classroom-html-standard-2026-10-07.md)；線上預習未另指定時沿用native-pptx。Open Slide framework 以 Git submodule 放在 [`tools/open-slide/`](tools/open-slide/)，來源為 [open-slide/open-slide](https://github.com/open-slide/open-slide)。選用時，請在該課 `10-design/open-slide-draft/` 製作，實體課已有HTML交付偏好，額外匯出依需要選擇；在專用 QA／批准／release 流程建立前，它只算設計草稿。

初次 checkout 後執行 `git submodule update --init tools/open-slide` 取得 framework。每課選擇製作方式不改變教材來源、內容批准或既有 authority gate。

Adam 於 2026-10-03 確認：未來 PPT 的音頻只在相關頁右上角寫不可點擊純文字 `Audio n-n`（如 `Audio 7-1`），沿用實際來源編號，不按投影片重編。PPT 不嵌入音檔、不放播放按鈕或可播放音頻連結；標示不用紫色、色塊或按鈕外框。PPT 外來源音檔保留，播放方式另在教師材料或內部音頻紀錄登記。完整規則見 [`PROJECT_REQUIREMENTS.md` §3.2C](PROJECT_REQUIREMENTS.md)。此決定不自動改寫其他已批准成品或歷史紀錄。

新增教材时，先建立 `textbooks/<textbook_id>/textbook.json` 并登记到 `textbooks/registry.json`，再建立同名的 `lessons/<textbook_id>/`。同一学期使用多本教材时，只需在对应 `course/offerings/<offering_id>/offering.json` 的 `textbooks` 数组中登记，不复制课程根目录。

PDF、MP3 与大型衍生文件保留在本机，不提交 Git；QR、来源清单、下载来源、审核记录与生产 manifest 进入版本控制。
