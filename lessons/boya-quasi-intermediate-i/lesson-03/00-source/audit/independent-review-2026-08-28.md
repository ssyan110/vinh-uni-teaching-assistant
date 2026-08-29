# 第3课《我对学中文越来越有兴趣》独立来源审核

## 审核结论

- 审核日期：2026-08-28
- 目标教材：`boya-quasi-intermediate-i`（《博雅汉语听说：准中级加速篇 I》）
- 当前状态：**BLOCKED — 目标课次 `00-source` 来源包缺失**
- 本文件仅记录阻塞证据；未批准来源、未生成 PPT、未修改任何 authority。

## 目标路径存在性

在本次审核开始时，目标目录
`lessons/boya-quasi-intermediate-i/lesson-03/00-source/` 不存在，因而下列四项来源包必需文件均缺失：

| 必需文件 | 状态 |
| --- | --- |
| `canonical-source.json` | 缺失 |
| `listening-exercise-contract.json` | 缺失 |
| `audio-manifest.json` | 缺失 |
| `source-manifest.json` | 缺失 |

本次只建立 `00-source/audit/` 与本审核文件，用于保存阻塞证据；没有用旧课次或 archive 内容补建上述文件。

## 可用但不足以解除阻塞的来源证据

全书来源盘点中有第3课条目：
`textbooks/boya-quasi-intermediate-i/source/source-inventory.json`。

该条目记录：

- 课名：`我对学中文越来越有兴趣`
- 起始 PDF 页：35；印刷页范围：P22–P31（盘点标记为 `printed_page_range_verified: true`）
- 答案 PDF 页：11、13
- QR 截图：`textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-03-pdf-page-035.png`
- 预期音频：3-1 至 3-6

原始来源文件均存在：

- `textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf`
- `textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I-听力文本及参考答案.pdf`
- 上述 QR 截图

六段本地音频也都存在，且本次快速完整性核对通过：

| 音频 | bytes 与盘点 | SHA-256 与盘点 | ffprobe 解码 |
| --- | --- | --- | --- |
| 3-1 | 991389 = | 一致 | 通过 |
| 3-2 | 645737 = | 一致 | 通过 |
| 3-3 | 1297741 = | 一致 | 通过 |
| 3-4 | 1107164 = | 一致 | 通过 |
| 3-5 | 1176127 = | 一致 | 通过 |
| 3-6 | 1136839 = | 一致 | 通过 |

这些证据只能说明全书盘点与原始媒体可用，不能替代课次 canonical source、题组契约、答案逐页证据或 source manifest。

## 防止误接旧教材

另有一份同名课次位于：
`lessons/boya-intermediate-i/lesson-03/00-source/`。

该目录属于《中级冲刺篇 I》（`boya-intermediate-i`），课名为《宜居之地》，教材页为 P32–P45，且使用 11 段音频。它与本学期目标教材及第3课（P22–P31、6段音频）不是同一来源，不能作为本课 package、canonical 或答案证据。

## 解除阻塞所需最小动作

1. 在 `lessons/boya-quasi-intermediate-i/lesson-03/00-source/` 建立本课独立的 canonical source、听力题组契约、音频 manifest 与 source manifest。
2. 依据主教材 PDF P22–P31（PDF 35–44）逐页记录词语、课文、句式、题组标题、题数和教材页码。
3. 依据答案 PDF 第11、13页逐页保留答案／听力文本证据；开放题维持无唯一答案状态。
4. 让新 manifest 引用第3课 3-1 至 3-6 的实际路径、bytes、SHA-256 与解码证据，并保持 `pending_review`／`draft`，等待 Adam 审核。

## Gate 状态

- 来源包结构：阻塞（缺失）
- 来源批准：未开始
- 教学重组、教师手册、配套材料、PPT storyboard、PPTX：保持锁定

