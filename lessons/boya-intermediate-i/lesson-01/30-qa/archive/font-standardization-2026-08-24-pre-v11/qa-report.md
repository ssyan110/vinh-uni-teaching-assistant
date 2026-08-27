# 第一课主任审核包字體标准化 QA

日期：2026-08-24  
范围：`lessons/lesson-01/20-approved/` 现行权威文件，以及由该目录复制产生的最新主任审核包。

## 采用规则

- 中文汉字统一使用标准通用 `KaiTi`（楷体）。
- 越南文及其他拉丁字母文字统一使用 `Times New Roman`。
- 不依赖主任电脑上另行安装的自定义字体；文件内的字体声明已统一写入可识别的标准字体名称。

## 已验证项目

- 权威 Office 文件共 24 个：1 个 PPTX、23 个 DOCX；教材内容、音频、speaker notes 与课堂流程未因本次字体修订改变。
- PPTX 共 62 张投影片；PowerPoint 实际只读开启测试成功，并返回 62 张投影片，没有字体错误提示。
- PPTX 的中文字体声明为 `KaiTi`，拉丁字母、越南文及其他非中文 script 字体声明为 `Times New Roman`；旧的 `Heiti SC`、`Hiragino Sans GB`、`Microsoft YaHei` 等字体声明已清除。
- PPTX 预览 PDF 已重新生成，共 62 页，页面尺寸为 16:9（960.009 × 540 pt），嵌入字体包含 `KaiTi` 与 `Times New Roman`。
- 教材页码标记检查通过：预期 45 个、实际 45 个，PDF 可见性检查通过。
- 23 个 DOCX 的 OOXML 字体声明检查通过：`w:eastAsia=KaiTi`；`w:ascii`、`w:hAnsi`、`w:cs=Times New Roman`。
- 所有权威 Office 文件通过 ZIP 完整性检查；PPTX 与 DOCX 渲染文字可读，未发现替换字符或乱码字符。

## 交付证据

- PowerPoint 开启测试：实际 Microsoft PowerPoint，返回 slide count `62`。
- PDF 预览：本机 Office 文档渲染环境生成，用于页面、字体嵌入、文字与教材页码可见性 smoke QA；PowerPoint 原生开启另行验证通过。
- 最新不可变交付包：`lessons/lesson-01/40-release/2026-08-24-font-standardized/`。
- 交付包 tree SHA-256：`a5beaf87f0bfea8ca7e031d13082cb97cf1d7734eca94a9e99cc328e3a615d94`。
- 交付包 ZIP SHA-256：`6bd1ba2007e2f9911dc32df57b12c590cec4b77bc708a6197897cb8365e514e7`。

## 结论

字体标准化通过，可以将最新交付包提供给主任。后续生成器默认沿用同一规则：中文 `KaiTi`，越南文及其他拉丁字母文字 `Times New Roman`。
