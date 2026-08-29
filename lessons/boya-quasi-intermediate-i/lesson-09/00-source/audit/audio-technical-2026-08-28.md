# 第九课音频技术审核记录（草稿）

**状态：技术检查通过；`semantic_status` / `playback_status` = `pending_teacher_playback`；来源批准 `pending_review`。**

来源为第九课 QR（`http://qr31.cn/IloNOS`）及 source-inventory。以下仅核对本地文件完整性、bytes、SHA-256、ffprobe 时长和解码；不把技术通过当作音频语义、音频来源或课堂设备播放批准。

| 音频 | coding | 本地文件 | bytes | SHA-256 | 时长（秒） | 下载 | 解码 | 语义／播放 |
|---|---|---|---:|---|---:|---|---|---|
| 9-1 | JP1539815 | `textbooks/boya-quasi-intermediate-i/source/audio/lesson-09/9-1.mp3` | 819190 | `8322ba07d5f22db4c2a9f9b0f4cda6bda9e29db8b06871c77268e704b9a77320` | 50.887 | passed | passed | pending |
| 9-2 | AJ1783222 | `textbooks/boya-quasi-intermediate-i/source/audio/lesson-09/9-2.mp3` | 434250 | `39d304b722d8b382e41ff40467aa157c854f2a3b02d7cd781703f6259a02d292` | 26.828 | passed | passed | pending |
| 9-3 | GO1783223 | `textbooks/boya-quasi-intermediate-i/source/audio/lesson-09/9-3.mp3` | 1074145 | `68a1dc11366ed1c6d4949de1f76edf01e8f361408c0350eebdf6a9448b698fc2` | 66.821 | passed | passed | pending |
| 9-4 | QU1783224 | `textbooks/boya-quasi-intermediate-i/source/audio/lesson-09/9-4.mp3` | 1106746 | `9e5fbe68debdfe0fbaec36fd4264b14b6ed2bd9b930805a19d339d66961c234c` | 68.859 | passed | passed | pending |
| 9-5 | AE1783225 | `textbooks/boya-quasi-intermediate-i/source/audio/lesson-09/9-5.mp3` | 1013959 | `4cda86d58af50ca4ecd5dca46ec712537ae0c0d6545c41d3bc14355a97f46213` | 63.060 | passed | passed | pending |
| 9-6 | AG1783227 | `textbooks/boya-quasi-intermediate-i/source/audio/lesson-09/9-6.mp3` | 874779 | `e30f25b5a404d9f19e0c482181ed56a0fe62e49a144ea6bd86cf222f7c989ee7` | 54.361 | passed | passed | pending |

## 待完成

1. 教师逐段播放 9-1 至 9-6，核对语义、题目对应、音量和播放顺序。
2. 将 9-4、9-5、9-6 语义听写与答案页文本逐句比对；重点确认 9-6 扫描中的 `逛（guì）` 及「后海」前动词。
3. 在 PowerPoint／PDF 预览中实测音频按钮可播放后，才可更新 playback 状态并进入后续来源批准。

