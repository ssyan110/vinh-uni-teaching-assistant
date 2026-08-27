# 配置与第一课来源包审计

审计日期：2026-08-27
范围：`project.config.json`、`textbooks/boya-quasi-intermediate-i/source/source-inventory.json`、`lessons/boya-quasi-intermediate-i/lesson-01/00-source/`，以及对应的本地 QR／音频目录。
本报告记录来源审计及架构迁移后的复核结果；没有制作 PPT/DOCX。

## 已确认

- `project.config.json` 保留稳定课程 ID，并以 `active_context.textbook_id` 指向 `boya-quasi-intermediate-i`；当前教材为 12 课。
- 两本教材命名空间已分开：当前 `2026-fall` 使用 `lessons/boya-quasi-intermediate-i/`；《中级冲刺篇 I》直接登记于 `2027-fall`，使用 `lessons/boya-intermediate-i/`，并登记在 `textbooks/registry.json`。
- 新教材主 PDF、听力文本及参考答案 PDF 位于 `textbooks/boya-quasi-intermediate-i/source/raw/`；配置中的 active textbook、active lesson、font policy、draft/authority/QA/release 根路径均为新教材课次路径。
- 来源盘点识别出 12 个课次 QR 页：PDF 页 14、25、35、45、55、64、72、81、90、100、109、118；每个 QR 截图均为可读取的 PNG（约 315–323 × 343–361 px）。
- 盘点列出 72 个音频（每课 6 个），并且当前 `textbooks/boya-quasi-intermediate-i/source/audio/` 中 72 个文件都存在；逐文件检查时文件大小与 inventory 中 SHA-256 一致。
- 第一课 `canonical-source.json` 的 SHA-256 与 `source-manifest.json` 登记值一致，且明确标记为 `source_audit_in_progress`，没有假装已批准。
- 已建立课程层级学期规划草案；正式学期时数仍待全书来源理解、来源批准及学校课表确认，未把草案当作定稿。

## 架构迁移时发现并已解决

### 已解决：第一课音频清单

第一课 canonical source 与全书 inventory 均登记 `1-1` 至 `1-6`，与教材 QR 落地页的 6 个音频一致。来源包仍维持 `source_audit_in_progress`，未越过来源批准 gate。

### 已解决：音频下载与解码状态

`source-inventory.json` 已记录 `72/72` 下载完成与 `72/72` 解码通过；逐文件大小及 SHA-256 与 inventory 相符。

### 已解决：QR 与音频路径

QR 截图统一位于 `textbooks/boya-quasi-intermediate-i/source/qr/captures/`，音频统一位于 `textbooks/boya-quasi-intermediate-i/source/audio/lesson-XX/`；inventory 使用仓库相对完整路径。

### 已解决：QR 扫描证据

QR 扫描索引已固定为 `textbooks/boya-quasi-intermediate-i/source/qr/scan.tsv`，不再依赖临时目录。

### 已解决：三年级教材 authority 保护

`project.config.json.protected_roots` 已登记《中级冲刺篇 I》第一课的 authority、QA 与 release。该教材完整保留并直接规划于 `2027-fall` 三年级使用，不视为废弃教材。

## 下一轮来源 QA 仍需处理

### P1：第一课 source-manifest 只有 6 音频的间接证据

`source-manifest.json` 只登记 canonical source 的 hash 与根目录，没有登记全书 inventory 的 hash，也没有登记 12 个 QR 截图的 hash／解码 URL。source approval 前应生成一份可复查的证据索引（QR 图 hash、解码 URL、落地页 URL、音频 URL、文件 hash、HTTP/解码结果）。

### P2：逐项教材文字仍待核对

12 课页码范围与 QR 第一轮核对已完成；词语、题目、听力文本及答案仍需逐课进行来源忠实度审查。在 Adam 批准前，不得进入教师手册或 PPT gate。

## 审计结论

多教材架构、来源路径、QR 扫描证据与音频状态已完成，旧 authority 仍受保护。当前来源包仍处于来源审核阶段；学期规划仅有候选草案，下一步仍只进行第一课逐项来源核对，不制作课程 PPT/DOCX。
