# 《博雅汉语听说·准中级加速篇 I》QR 截图审计

审计日期：2026-08-27
范围：主教材 PDF 的 12 个课次 QR；不包含书末附加二维码。
扫描记录：`textbooks/boya-quasi-intermediate-i/source/qr/scan.tsv`
截图目录：`textbooks/boya-quasi-intermediate-i/source/qr/captures/`

## 结论

- 12 个课次 QR 均已截取为独立 PNG，并且每张截图均为清楚、完整的二维码图像（约 315–323 × 343–361 px，RGB PNG）。
- 扫描记录均成功解码为 `qr31.cn` 短链接；OpenCV 扫描置信度记录约为 0.73–0.84，定位框约占页面宽度 8–10%，位置与教材每课开头的「听力录音」二维码一致。
- 12 个短链接均可通过 HTTPS 跳转页取得 HTTP 200；目标页面标题明确对应第 1–12 课。
- 每课目标页均列出 6 个音频（`n-1` 至 `n-6`），共 72 个音频条目。音频下载与文件校验属于后续步骤，本报告只核验 QR 与线上音频目录可见性。
- PDF 第 134 页（扫描文件 `page-133.jpg`）另有 2 个微信二维码，未计入课次音频 QR，避免误把书末二维码当成第 13 课。

## 课次 QR 清单

| 课次 | 主教材 PDF 页 | 截图 | QR 解码 URL | 目标页标题 | 音频条目 |
|---|---:|---|---|---|---|
| 01 | 14 | `lesson-01-pdf-page-014.png` | `http://qr31.cn/I3ilDX` | 博雅汉语听说准中级加速篇1第1课 | 1-1 … 1-6 |
| 02 | 25 | `lesson-02-pdf-page-025.png` | `http://qr31.cn/H1krER` | 博雅汉语听说准中级加速篇1第2课 | 2-1 … 2-6 |
| 03 | 35 | `lesson-03-pdf-page-035.png` | `http://qr31.cn/IeruLV` | 博雅汉语听说准中级加速篇1第3课 | 3-1 … 3-6 |
| 04 | 45 | `lesson-04-pdf-page-045.png` | `http://qr31.cn/I9bLMV` | 博雅汉语听说准中级加速篇1第4课 | 4-1 … 4-6 |
| 05 | 55 | `lesson-05-pdf-page-055.png` | `http://qr31.cn/I69bRX` | 博雅汉语听说准中级加速篇1第5课 | 5-1 … 5-6 |
| 06 | 64 | `lesson-06-pdf-page-064.png` | `http://qr31.cn/I4detK` | 博雅汉语听说准中级加速篇1第6课 | 6-1 … 6-6 |
| 07 | 72 | `lesson-07-pdf-page-072.png` | `http://qr31.cn/I7dyDT` | 博雅汉语听说准中级加速篇1第7课 | 7-1 … 7-6 |
| 08 | 81 | `lesson-08-pdf-page-081.png` | `http://qr31.cn/JjDVWY` | 博雅汉语听说准中级加速篇1第8课 | 8-1 … 8-6 |
| 09 | 90 | `lesson-09-pdf-page-090.png` | `http://qr31.cn/IloNOS` | 博雅汉语听说准中级加速篇1第9课 | 9-1 … 9-6 |
| 10 | 100 | `lesson-10-pdf-page-100.png` | `http://qr31.cn/HdituA` | 博雅汉语听说准中级加速篇1第10课 | 10-1 … 10-6 |
| 11 | 109 | `lesson-11-pdf-page-109.png` | `http://qr31.cn/H7bvDX` | 博雅汉语听说准中级加速篇1第11课 | 11-1 … 11-6 |
| 12 | 118 | `lesson-12-pdf-page-118.png` | `http://qr31.cn/IhjvBZ` | 博雅汉语听说准中级加速篇1第12课 | 12-1 … 12-6 |

## 验证边界

本阶段已验证：截图文件存在、可独立解码、QR 短链接可访问、目标页课次标题与 6 个音频标签。
后续下载与媒体验证结果见 `audio-retry-report.md` 和 `source-inventory.json`；音频内容与教材编号仍待逐项听辨。
