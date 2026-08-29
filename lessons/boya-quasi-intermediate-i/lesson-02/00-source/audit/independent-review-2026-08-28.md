# 第2课来源包独立审核（2026-08-28）

## 审核范围

- 课程：`boya-quasi-intermediate-i`，第2课《王红的一天》
- 审核对象：`lessons/boya-quasi-intermediate-i/lesson-02/00-source/`
- 审核类型：只读独立审核；不批准来源、不生成 PPTX、不修改 authority 文件。

## 结论

**BLOCKER：审核开始时第2课 `00-source/` 目录及四个来源包文件均不存在。** 因此无法对本课 canonical source、听力题组契约、音频 manifest 或 source manifest 做课次级一致性审查，也不能把其他教材、旧 `work/` 文件或 archive 当作替代 authority。

本文件所在的 `00-source/audit/` 目录仅为保存本次 blocker 记录而建立；这不表示第2课来源包已建立或获批准。

## 逐项检查结果

| 检查项 | 结果 | 证据／说明 |
|---|---|---|
| `canonical-source.json` | **缺失（BLOCKER）** | 目标路径不存在；无法核对词语、课文、句式、练习与来源页码。 |
| `listening-exercise-contract.json` | **缺失（BLOCKER）** | 无法核对题组原文标题、题数、教材印刷页码、`content_id` 与音频映射。 |
| `audio-manifest.json` | **缺失（BLOCKER）** | 无课次级 manifest 可用于比对 bytes、SHA-256、时长与状态。 |
| `source-manifest.json` | **缺失（BLOCKER）** | 无法核对 canonical／contract 路径、hash、审核状态与来源指纹。 |
| 课次 review／approved 状态 | **未建立** | 目标课次没有 manifest；不得推定为 review 或 approved。 |
| 答案证据 | **课次证据缺失** | 原始答案 PDF 存在，但没有第2课专属 answer audit 或 manifest 引用可供审阅。 |

## 可独立核实的底层来源（不等同于来源包）

以下只证明全书原始资产存在，不能替代缺失的第2课 `00-source` authority：

- 主教材：`textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf`，134 页，SHA-256 `39899d0f400e187f57c16db821f8f4c207f936eae0e4fbfe3cab52c02bfea806`。
- 听力文本及参考答案：`textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I-听力文本及参考答案.pdf`，33 页，SHA-256 `3c21e1574b0187259769799d183eca78a60a515b5b7fce202eda9e9ade2c20b8`。
- 全书来源盘点：`textbooks/boya-quasi-intermediate-i/source/source-inventory.json` 将第2课记录为《王红的一天》、主教材 PDF 第25页、印刷页 P12–P21、QR `http://qr31.cn/H1krER`，答案 PDF 页 [8, 10]；该全书 inventory 不是本课 canonical source。
- QR 裁剪证据：`textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-02-pdf-page-025.png` 存在；只证明入口截图存在。

## 音频底层文件检查（仅作阻塞期间的独立证据）

6 个原始 MP3 均存在，且实际 bytes／SHA-256 与全书 inventory 记录一致；`ffprobe` 解码可读。由于 `audio-manifest.json` 缺失，以下不能被标为课次来源包已通过，只能标为 raw asset check：

| 标签 | 实际 bytes | 实际 SHA-256 | `ffprobe` 时长（秒） | 结果 |
|---|---:|---|---:|---|
| 2-1 | 861404 | `9425046c170d85f1a8dd25fa9d7afce508811dafebcdc8b0b806938aca3d8a56` | 53.524898 | raw 存在／可解码 |
| 2-2 | 683353 | `5ad1a76dea86112f9a967a5d49ae124a7afbf01be77b0989bf8369dec2eed6fc` | 42.396735 | raw 存在／可解码 |
| 2-3 | 1869103 | `97b01a753c80a4b2ec850b0d0f60514c58e2455901dafc988958512de112a1db` | 116.506122 | raw 存在／可解码 |
| 2-4 | 1350834 | `7dcd2b8934ab85277744aad0e39c9aa039af7803adcceb33269469c096a80fa3` | 84.114286 | raw 存在／可解码 |
| 2-5 | 805815 | `44dbd41d3631363b7c998e91730a412e12b537a65a8f88ed09884a3483e2e957` | 50.050612 | raw 存在／可解码 |
| 2-6 | 1041962 | `b59eb5af70b6928d11da243665eb8dd4e70d2dbef616f1a249816be6f1ab9265` | 64.809796 | raw 存在／可解码 |

## 可直接修正项

1. 在 `lessons/boya-quasi-intermediate-i/lesson-02/00-source/` 建立本课来源包四个文件，并从准中级加速篇主教材、答案 PDF、QR 与 `source/audio/lesson-02/` 逐项核对。
2. 建立课次级答案证据，明确答案 PDF 的实际页码范围与题组对应；不能只引用全书 inventory 的 `[8, 10]`。
3. 生成后再运行本课听力题组契约、JSON schema、音频 hash／解码与 manifest 一致性检查。

## 必须由 Adam 确认的项目

- 第2课来源包逐项内容（词语、课文、句式、所有教材练习、题组标题和题数）是否完整且忠实于扫描页。
- 答案 PDF 页码与第2课题组的最终映射，尤其 inventory 的 `[8, 10]` 表示法是否应记录为连续范围 P8–P10。
- 原始音频的语义播放核对（仅 `ffprobe` 不能证明音频内容与教材题号对应）。

## Gate 状态与下一步

- Gate A 来源审核：**阻塞**，缺少课次 `00-source` 四件套。
- 来源批准：**未开始／不可批准**。
- 后续教学重组、教师手册、配套材料、storyboard 与 PPTX：**不得开始**。
- 下一最小可验证步骤：先补齐第2课四个来源包文件，再由独立审核重新执行本文件的逐项检查；补齐前不得把第2课标记为 ready 或 approved。

