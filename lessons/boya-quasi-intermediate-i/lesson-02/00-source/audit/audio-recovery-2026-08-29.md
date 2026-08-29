# 第2课 2-7 音频恢复记录

恢复日期：2026-08-29  
课次键：`boya-quasi-intermediate-i:lesson-02`  
用途：记录 Adam 提供的短文三《课外活动》音频，并与项目来源目录对照。

## 输入与转换

| 项目 | 结果 |
|---|---|
| 用户提供文件 | `2-7.wav` |
| 原始格式 | WAV PCM 16-bit、24000 Hz、单声道 |
| 原始 bytes | 2737964 |
| 原始 SHA-256 | `b4830c93f602533f75737d9bc2b34f835a42fc0e2df26cb031131253f930cb70` |
| 原始时长 | 57.040 秒 |
| 项目文件 | `textbooks/boya-quasi-intermediate-i/source/audio/lesson-02/2-7.mp3` |
| 转换格式 | MP3、128 kbps CBR、44100 Hz、单声道 |
| 项目文件 bytes | 913702 |
| 项目文件 SHA-256 | `13e4a8068ce1b50a52243ed98b956484406b2678373e59f8cc66096652b735fd` |
| 项目文件时长 | 57.040 秒 |
| ffprobe 解码 | passed |

转换命令只改变封装、采样率和编码格式，没有把该文件登记为出版社 QR 原始下载。出版社 QR landing page 和全书 `source-inventory.json` 仍保留原先只列 `2-1` 至 `2-6` 的记录。

## 当前状态

- `audio-manifest.json` 已登记 `2-7` 的项目路径、原始 WAV hash、转换后 MP3 hash、时长和解码状态。
- `canonical-source.json` 已将短文三的音频状态从缺失改为用户来源恢复。
- `listening-exercise-contract.json` 已将短文三两组题目的音频状态改为本地文件存在。
- 来源状态仍为 `pending_review`；语义听核、题号对应和 PowerPoint 实际播放仍待教师确认。
