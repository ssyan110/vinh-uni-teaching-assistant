# 第一至第三课 DOCX／PDF 可见性核验

检查日期：2026-08-29  
范围：`boya-quasi-intermediate-i:lesson-01`、`boya-quasi-intermediate-i:lesson-02`、`boya-quasi-intermediate-i:lesson-03`

## 结果

- 当前 `10-design` 共 21 份 DOCX（不含第一课已归档的旧英文文件）全部通过 ZIP 完整性与 `word/document.xml` 解析。
- 21 份 DOCX 的文字运行均声明中文 `KaiTi`、拉丁字母 `Times New Roman`，并标记 `zh-CN`。
- 21 份 DOCX 全部成功导出 PDF；`pdffonts` 可见嵌入式 `KaiTi`，`pdftotext` 可抽取中文，未出现替换字符。
- 教师手册预览：第一课 18 页、第二课 8 页、第三课 9 页。
- 配套材料预览：第一课 4 份、第二课 8 份、第三课 6 份。

## 核验方式

使用系统字体配置运行项目内置 LibreOffice：

```text
FONTCONFIG_FILE=/opt/homebrew/etc/fonts/fonts.conf
FONTCONFIG_PATH=/etc/fonts
```

核验项目包括 DOCX ZIP、Word XML、字体声明、PDF 转换、嵌入字体、中文文本抽取和替换字符扫描。该检查只验证文件结构与渲染可见性，不代替教师对教材语义、音频内容、PPT 播放或课堂 rehearsal 的批准。

## 当前限制

第一课的教师手册和配套材料仍是 `10-design` 草案，内容只依据系主任批准的两份 PPTX；第二、三课尚未建立 PPTX authority。三课均尚未进入 `20-approved/` 或 `40-release/`。
