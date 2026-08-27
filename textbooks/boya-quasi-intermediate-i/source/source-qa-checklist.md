# 来源审核与后续生产前置清单

当前状态：来源审核进行中。以下清单用于完成全书理解后再进入教师手册、配套材料和课程 PPT／DOCX。

## 已完成

- 主教材 PDF 与听力文本／参考答案 PDF 已登记。
- 12 课标题、主教材 PDF 页范围、教材印刷页范围已核对。
- 每课标题页 QR 已截取并独立解码；书末出版社二维码已排除。
- 每课 6 段、全书 72 段音频已下载到本地来源目录；72/72 可由 `ffprobe` 解码并已登记 SHA-256。
- 第一课来源包已建立，状态仍为 `source_audit_in_progress`。

## 待完成

- 逐课逐页提取词语、课文／对话、句式、练习与教材区段，并回指印刷页码。
- 逐段听核音频与教材编号／区段的对应关系；不得仅凭文件名推定内容。
- 对照参考答案 PDF；开放题保留“来源未提供唯一答案”状态。
- 完成全书内容理解后，再讨论学期时数；当前不建立学期安排。
- Adam 另行授权后，按 gate 顺序制作教师手册、学生配套、PPTX 与 DOCX。

## 证据位置

- 全书盘点：`textbooks/boya-quasi-intermediate-i/source/source-inventory.json`
- QR 截图：`textbooks/boya-quasi-intermediate-i/source/qr/captures/`
- QR 扫描记录：`textbooks/boya-quasi-intermediate-i/source/qr/scan.tsv`
- 本地音频：`textbooks/boya-quasi-intermediate-i/source/audio/`（MP3 不上传 Git）
- 下载、解码与全书结构审计：`textbooks/boya-quasi-intermediate-i/source/audit/`
