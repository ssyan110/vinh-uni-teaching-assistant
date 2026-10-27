# W07 v5 本地准备核验

- 50题、100分、49个音频题组；七个替换题及对应官方答案键已写入版本化审阅副本，其余43项与v4一致。
- HSK图像选项依官方题本和答案键重排成A/B/C；TOCFL Novice Q01250800保留单张候车图，音频口述A/B/C选项。
- 7段候选原音已由本地Whisper与官方脚本定位，并由ffmpeg解码；`audio-manifest.json`保留源时间段、时长、SHA-256。H10901 Q16 ASR有他/它同音识别差异，须教师听核。
- Form题目/图片与评分答案尚未同步；v5 Form逐项读回仍待完成。七个v5替换音频已上传到owner-only Drive文件夹，并在共享音频库与组卷明细中更新。Q40–41使用W07专用音频ID，原共享教材音频ID未改。
- 现行Form上次读回为v4、Published且Accepting responses开启；这不是v5同步证据。v5本地播放器应只显示审阅音频，不提供学生作答入口。
- 内容/音频教师批准、教室音箱验收、正式发布均未完成。


## 2026-10-27 bounded audio trim review

- Six HSK clips (Q14, Q18, Q32, Q34, Q39, Q46) and the shared Boya Q40–41 clip were boundary-trimmed from original audio. Q22 was initially left unchanged; a later full-audio pass found and removed its 4.1-second digital-silence tail. The original MP3 sources, the six HSK/Boya pre-trim WAVs and the Q22 pre-trim WAV are preserved.
- Cached Whisper small post-trim transcripts retain each official dialogue/question required by the item; the Boya clip retains the complete dialogue and both spoken question prompts after removal of its answer-revealing opening. The Q32 start was placed after its 9.26-second leading silence and ambiguous number-like cue.
- v5 audio-manifest and audio-map record the updated source ranges, durations, and hashes. The 41 groups outside the eight edited audio groups remain byte-identical. Teacher listening and classroom speaker acceptance remain pending.
- The seven matching Drive assets were updated/read back under the existing owner-only folder; six original IDs were preserved and one W07-only Boya derivative was created. Sheet audio-library and Q40–41 assembly links were read back. Local v5 records now carry those Drive IDs; the v4 question bank and shared Boya asset remain unchanged.
- v5 audio playback remains a local review draft while Form/media readback is pending. Teacher full listening and classroom speaker acceptance remain open.
