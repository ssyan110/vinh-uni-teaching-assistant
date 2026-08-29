# 第6课音频技术审计

审计日期：2026-08-28。检查范围：`textbooks/boya-quasi-intermediate-i/source/audio/lesson-06/6-1.mp3` 至 `6-6.mp3`。

| 音频 | bytes | 时长(s) | 采样率/声道 | SHA-256前缀 | 解码 | 语义/PowerPoint播放 |
|---|---:|---:|---|---|---|---|
| 6-1 | 835908 | 51.931429 | 44100/1 | e6a10655 | passed | pending |
| 6-2 | 417531 | 25.782857 | 44100/1 | 4fd7127f | passed | pending |
| 6-3 | 1029841 | 64.052245 | 44100/1 | c12e3a94 | passed | pending |
| 6-4 | 921590 | 57.286531 | 44100/1 | fb40784e | passed | pending |
| 6-5 | 949175 | 59.010612 | 44100/1 | 03b57cdd | passed | pending |
| 6-6 | 773214 | 48.013061 | 44100/1 | 61198dc3 | passed | pending |

技术检查依据本地文件大小、SHA-256 与 `ffprobe` 解码信息。尚未把“文件可解码”升级为“内容已由教师逐段听核”或“PowerPoint 内嵌播放已实测”。
