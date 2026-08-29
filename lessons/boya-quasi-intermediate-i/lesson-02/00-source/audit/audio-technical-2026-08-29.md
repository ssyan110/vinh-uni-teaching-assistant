# 第2课音频技术审核

审核日期：2026-08-29  
课次键：`boya-quasi-intermediate-i:lesson-02`  
来源：出版社 QR `http://qr31.cn/H1krER`；本地目录 `textbooks/boya-quasi-intermediate-i/source/audio/lesson-02/`。

## 实际文件

| 音频 | 本地文件 | bytes | SHA-256 | 时长（秒） | 编码 | 采样率 | 声道 | 解码 | 语义／播放 |
|---|---|---:|---|---:|---|---:|---:|---|---|
| 2-1 | `2-1.mp3` | 861404 | `9425046c170d85f1a8dd25fa9d7afce508811dafebcdc8b0b806938aca3d8a56` | 53.524898 | mp3 | 44100 | 1 | passed | pending_teacher_playback |
| 2-2 | `2-2.mp3` | 683353 | `5ad1a76dea86112f9a967a5d49ae124a7afbf01be77b0989bf8369dec2eed6fc` | 42.396735 | mp3 | 44100 | 1 | passed | pending_teacher_playback |
| 2-3 | `2-3.mp3` | 1869103 | `97b01a753c80a4b2ec850b0d0f60514c58e2455901dafc988958512de112a1db` | 116.506122 | mp3 | 44100 | 1 | passed | pending_teacher_playback |
| 2-4 | `2-4.mp3` | 1350834 | `7dcd2b8934ab85277744aad0e39c9aa039af7803adcceb33269469c096a80fa3` | 84.114286 | mp3 | 44100 | 1 | passed | pending_teacher_playback |
| 2-5 | `2-5.mp3` | 805815 | `44dbd41d3631363b7c998e91730a412e12b537a65a8f88ed09884a3483e2e957` | 50.050612 | mp3 | 44100 | 1 | passed | pending_teacher_playback |
| 2-6 | `2-6.mp3` | 1041962 | `b59eb5af70b6928d11da243665eb8dd4e70d2dbef616f1a249816be6f1ab9265` | 64.809796 | mp3 | 44100 | 1 | passed | pending_teacher_playback |

## 2-7 恢复记录

教材 P18–P19、答案 PDF 文件页10均显示短文三《课外活动》使用 `2-7`。2026-08-29 Adam 提供了用户来源的 `2-7.wav`，并将其转换为项目来源目录中的 `2-7.mp3`。出版社 QR landing page 和全书 source inventory 仍只登记 `2-1` 至 `2-6`，因此本条保留为“用户提供的来源恢复”，不改写出版社 inventory。

| 项目 | 原始 WAV | 项目 MP3 |
|---|---:|---:|
| 文件 | `2-7.wav` | `textbooks/boya-quasi-intermediate-i/source/audio/lesson-02/2-7.mp3` |
| bytes | 2737964 | 913702 |
| SHA-256 | `b4830c93f602533f75737d9bc2b34f835a42fc0e2df26cb031131253f930cb70` | `13e4a8068ce1b50a52243ed98b956484406b2678373e59f8cc66096652b735fd` |
| 格式 | WAV PCM 16-bit、24000 Hz、单声道 | MP3、128 kbps、44100 Hz、单声道 |
| 时长 | 57.040 秒 | 57.040 秒 |
| 解码 | passed | passed |

转换只改变封装和采样率，未把这段音频标记为出版社 QR 原始下载。语义内容、教材编号对应关系和 PowerPoint 实际播放仍需教师逐段确认。

## 结论

- 7/7 个本地 MP3 文件实际存在，ffprobe 可解码；2-1 至 2-6 与 source inventory 一致，2-7 的用户恢复证据已单独登记。
- 本课整体音频技术状态为 `technical_pass_for_7_of_7; semantic_playback_pending`。
- 7 段音频尚未完成教师语义听核或 PowerPoint 实际播放测试。
