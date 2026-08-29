# 第3课来源包独立 QA（最小验证）

验证日期：2026-08-29  
目标范围：`boya-quasi-intermediate-i:lesson-03`  
验证目录：`lessons/boya-quasi-intermediate-i/lesson-03/00-source/`

## JSON 与身份

| 文件 | JSON 解析 | lesson_key | 状态 |
|---|---|---|---|
| `canonical-source.json` | passed | `boya-quasi-intermediate-i:lesson-03` | `source_and_images_approved_by_adam`；approved=true（范围：来源、图片、越来越） |
| `listening-exercise-contract.json` | passed | `boya-quasi-intermediate-i:lesson-03` | `source_content_approved_audio_semantic_pending`；approved_by=[Adam] |
| `audio-manifest.json` | passed | `boya-quasi-intermediate-i:lesson-03` | `technical_pass_semantic_pending` |
| `source-manifest.json` | passed | `boya-quasi-intermediate-i:lesson-03` | `approved_by_adam_source_and_images`；音频语义／播放仍待 |

项目级 `python3 scripts/validate_lesson_identity.py` 结果：`lesson identity OK: 20 scoped lessons`。

## SHA-256 交叉核对

| 关系 | 实际 SHA-256 | manifest／contract 记录 | 结果 |
|---|---|---|---|
| canonical source | `821f8009e7ec2b53d9f38b7adcb2421f0012c4730b61cc8db6a08bf2c59c5aa1` | source manifest + listening contract | passed |
| listening exercise contract | `a40cf98a075eb3d515208b980548fd5817da1968c8dcf5cfdf37093f3dc07c3c` | source manifest | passed |
| audio manifest | `a1ed9e45e39cc0707864ce4e731fe32787e4bc04856089886a383e52fa7f06f8` | source manifest | passed |
| 逐页 audit | `9639f805695e50740b985fbf991309fa8f535b80d3300b3b0950deb447875d64` | source manifest | passed |
| 答案 audit | `4e7377385b33278d341d80ee9af11db6eaca13269b3117ff84d83852dafe4efe` | source manifest | passed |

## 音频文件存在性、bytes 与 SHA-256

六段本地音频（3-1 至 3-6）均存在；每段 bytes 与 `audio-manifest.json` 相同，SHA-256 与 `audio-manifest.json` 及全书 `source-inventory.json` 相同；技术审核记录中的 ffprobe 解码均为 `passed`。

| 标签 | 文件 | bytes／hash |
|---|---|---|
| 3-1 | `textbooks/boya-quasi-intermediate-i/source/audio/lesson-03/3-1.mp3` | 991389；`244ca28316b97f2ba6a3d71f24af09e49247f934d6b32665f25891f9818d0878` |
| 3-2 | `textbooks/boya-quasi-intermediate-i/source/audio/lesson-03/3-2.mp3` | 645737；`f152ee86a7432f5fc8f115b23ecfa575a8f0084a37ea50f6565e63a7a0417c6d` |
| 3-3 | `textbooks/boya-quasi-intermediate-i/source/audio/lesson-03/3-3.mp3` | 1297741；`983613344869f0f5eb969c730f52f772f083c4d2320c993a45261c4a5654c276` |
| 3-4 | `textbooks/boya-quasi-intermediate-i/source/audio/lesson-03/3-4.mp3` | 1107164；`e0cee2a4a5be21321c2cc69897366d8b07f6bb1cda340a921640d55fc8ce250a` |
| 3-5 | `textbooks/boya-quasi-intermediate-i/source/audio/lesson-03/3-5.mp3` | 1176127；`7fbb009795228f6cf7131d12627cb3c6418e2e9b4efde9ad7cae3589d0b3047d` |
| 3-6 | `textbooks/boya-quasi-intermediate-i/source/audio/lesson-03/3-6.mp3` | 1136839；`6ec0ccb21950db29dcaf971fbe7e097b5cc14d65ea2e3a5b3a9cccdd755c3e96` |

## 当前状态与未决事项

- 来源内容、图片与“越来越”用字已由 Adam 于 2026-08-29 确认；没有写入 `20-approved/`，没有生成 PPTX 或教师手册。
- 六段音频仅完成技术核对；教师逐段语义听核和 PowerPoint 播放仍待完成。
- 扫描 PDF 的视觉转录、教材页码与答案逐页对应关系已由 Adam 确认。
- 短文三第二遍第3题统一使用“越来越、收获”；先前视觉草稿中的“越来越越”不再作为 blocker。
