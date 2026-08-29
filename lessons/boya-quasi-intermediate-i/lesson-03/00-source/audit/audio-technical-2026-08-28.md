# 第3课音频技术审核

审核日期：2026-08-28  
来源 QR：`http://qr31.cn/IeruLV`  
QR 落地页：`https://biz.cli.im/site/IeruLV?qrurl=http://qr31.cn/IeruLV&gtype=2&key=82ff4173cf8bafe74878285867a6fa3f53d5dc1924`  
本地目录：`textbooks/boya-quasi-intermediate-i/source/audio/lesson-03/`

## 技术核对

六段文件均存在；文件大小、SHA-256 与全书来源盘点一致。使用 `ffprobe` 读取音频流，六段均为 MP3、44.1 kHz、单声道并成功解码。技术通过不等于教师已完成语义听核或 PowerPoint 实际播放测试。

| 音频 | 文件 | bytes | SHA-256 | ffprobe 时长（秒） | 编码／声道 | 解码 | 语义／PowerPoint 播放 |
|---|---|---:|---|---:|---|---|---|
| 3-1 | `3-1.mp3` | 991389 | `244ca28316b97f2ba6a3d71f24af09e49247f934d6b32665f25891f9818d0878` | 61.648980 | MP3／44100 Hz／1 ch | passed | pending_teacher_playback |
| 3-2 | `3-2.mp3` | 645737 | `f152ee86a7432f5fc8f115b23ecfa575a8f0084a37ea50f6565e63a7a0417c6d` | 40.045714 | MP3／44100 Hz／1 ch | passed | pending_teacher_playback |
| 3-3 | `3-3.mp3` | 1297741 | `983613344869f0f5eb969c730f52f772f083c4d2320c993a45261c4a5654c276` | 80.796735 | MP3／44100 Hz／1 ch | passed | pending_teacher_playback |
| 3-4 | `3-4.mp3` | 1107164 | `e0cee2a4a5be21321c2cc69897366d8b07f6bb1cda340a921640d55fc8ce250a` | 68.884898 | MP3／44100 Hz／1 ch | passed | pending_teacher_playback |
| 3-5 | `3-5.mp3` | 1176127 | `7fbb009795228f6cf7131d12627cb3c6418e2e9b4efde9ad7cae3589d0b3047d` | 73.195102 | MP3／44100 Hz／1 ch | passed | pending_teacher_playback |
| 3-6 | `3-6.mp3` | 1136839 | `6ec0ccb21950db29dcaf971fbe7e097b5cc14d65ea2e3a5b3a9cccdd755c3e96` | 70.739592 | MP3／44100 Hz／1 ch | passed | pending_teacher_playback |

## 题组对应关系

| 音频 | canonical source 板块 | 教材印刷页 |
|---|---|---:|
| 3-1 | 词语 | P22–P23 |
| 3-2 | 词语理解 | P23–P24 |
| 3-3 | 听说句子：判断对错 | P24–P25 |
| 3-4 | 短文一《开始接触汉语并产生一定的兴趣》 | P25–P26 |
| 3-5 | 短文二《为什么选修中文》 | P26–P28 |
| 3-6 | 短文三《中文课》 | P28–P29 |

## 结论与阻塞

- 技术结论：`technical_pass`，六段均已映射到本课来源板块。
- 语义结论：`pending_teacher_playback`；尚未逐段核对音频与题号／听力文本，也尚未做 PowerPoint 播放测试。
- 来源内容、图片与“越来越”用字已由 Adam 于 2026-08-29 确认；六段音频的教师语义听核与 PowerPoint 实际播放仍待完成。
