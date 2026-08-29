# 第一课 PPTX QA 记录

课次键：`boya-quasi-intermediate-i:lesson-01`  
课题：丽丽是独生女  
检查日期：2026-08-29  
检查范围：系主任已批准的两份当前 PPTX

## 结果

| 项目 | 结果 |
|---|---|
| 在线预习 | 72 页，16:9，ZIP 完整，44 张内嵌图片可解码 |
| 实体课 | 51 页，16:9，ZIP 完整，48 张内嵌图片可解码 |
| 实体课音频 | 8 个内嵌关系，1-2 至 1-8 全部与来源文件 SHA-256 对上 |
| 实体课字级 | 最小 20 pt，静态检查通过 |
| 在线预习字级 | 批准稿页眉、页码和封面英文标签含 12–16 pt；记录为警告，未擅自改动 |
| PDF 预览 | 在线 72 页；实体课 51 页；均成功导出 |
| 空白投影片 | 0 |

## 已锁定文件

- `20-approved/pptx/lesson-01-在线预习.pptx`
- `20-approved/pptx/lesson-01-实体课.pptx`

两份文件均从现有 `10-design/pptx-draft/` 原样复制。批准登记见 `20-approved/lesson-01-pptx-approval-record.md`；没有修改投影片文字、图片、页码、speaker notes 或音频关系。

## 音频技术状态

本课本地 1-1 至 1-8 共 8 个 MP3 均存在，SHA-256 与 ffprobe 解码检查通过。1-1 至 1-6 是出版社 QR 来源；1-7、1-8 是教材 P7、P8 标示且已恢复到本地的音频，当前 QR 落地页仍只列 1-1 至 1-6。技术检查不等于教师逐段语义听核或 PowerPoint 实际播放通过。

## 尚未完成的完整课次 gate

1. 来源批准：完成 1-1 至 1-8 语义听核，并确认 1-7、1-8 的来源类型。
2. 教学重组：建立本课 Can-Do、PBI 流程、练习 coverage 和正式实体课时。
3. 教师手册：完成并批准可由另一位教师执行的课前、课堂、答案政策、评量和备案。
4. 学生配套：预习卡、活动卡、评量表和 Exit Ticket。
5. 设计证据：PPT storyboard、Visual storyboard、source_refs 与页码 coverage。
6. 人工验收：PowerPoint 音频播放、投影／列印检查、教师 rehearsal。
7. 交付：从完整 `20-approved` 建立不可变 `40-release` ZIP。

当前状态：**PPTX 批准稿已登记；完整课次尚未交付。**
