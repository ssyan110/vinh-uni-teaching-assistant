# Conversation-video reference study

Scope: four public Instagram videos supplied 2026-10-30, downloaded locally and inspected as contact sheets sampled every 2 seconds. Durations and frame rates from ffprobe. This is a visual sampling, not continuous playback, frame-by-frame transition analysis or a listening review. Thus exact cut points, motion, lip sync, audio, easing and transition mechanisms remain unverified. Text examples below describe visible frames, not full transcripts.

## Production-method reference: Lemo-Opuscar

[Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) pairs a library of film-style prompts with code-built demo films. Its directing guide plans a treatment, benchmarks, shot list, beat and sound cues, then reviews rendered frames and the full film; its technique guide builds picture, voice, music, foley and subtitles from a timeline. The repository describes the styles as tuned for Claude Opus 5.5 and supplies its own Node, Python, browser-rendering and FFmpeg pipeline. These are upstream claims and workflow descriptions, not a local setup or render verification.

For this project, reuse the transferable planning ideas: decide the story and audience action before choosing effects; give each shot a reason; map picture, voice, captions and sound to the same timeline; and review the final export against the treatment. Treat style prompts and demo films as references for visual grammar only. Do not copy their artwork, characters, logos, melodies, typography, or shot designs. The library's fixed film conventions (for example, mandatory hooks, several camera moves, and sound on every visible action) are not requirements for classroom videos. Learning clarity, faithful dialogue, and readable response time govern those edits. See [the project workflow](../../../docs/workflow/video-editing-workflow.md).

| Reel | Technical | Sampled visual observations |
|---|---|---|
| [DUYJaWOkr3Z](https://www.instagram.com/reel/DUYJaWOkr3Z/) | 21.18 s, 30 fps, 1080×1920 | Illustrated street; same two characters in a mostly stable full-body two-shot, with changing mouth, expression and gestures. Short dialogue captions sit in a black rounded box low in frame, mostly green with selective yellow; small emoji appear above it. No large framing change visible at sampled intervals. |
| [DZXTTEwMtJz](https://www.instagram.com/reel/DZXTTEwMtJz/) | 20.10 s, 30 fps, 1072×1920 | Airport check-in: alternates counter two-shot, passenger and staff medium/close views. Compact centered white outlined subtitles change with dialogue; a promotional graphic appears, followed by a colorful question end card. Scene and character continuity link the angles. |
| [DcAXM2szWh8](https://www.instagram.com/reel/DcAXM2szWh8/) | 11.17 s, 30 fps, 1076×1914 | Airport transfer: medium two-shots alternate with a close-up of the passenger. White bold outlined dialogue subtitles are centered low; yellow highlights mark selected words. A small logo occupies the lower right. |
| [DcOgg3VBGIV](https://www.instagram.com/reel/DcOgg3VBGIV/) | 13.67 s, 24 fps, 1088×1936 | Café counter, stable wide two-shot throughout sampled frames; short white outlined captions change across dialogue. Character poses and expressions vary. No obvious shot change at sampling rate. |

## Practical interpretation

The visible pacing follows short conversational turns, not a constant zoom or heavy effects. Wide shots establish social context; closer views can identify the current speaker. The stable-frame examples support an inexpensive alternative when character continuity is more valuable than variety. Subtitles are short and high-contrast; word coloring and emoji are optional emphasis, not substitutes for the sentence. Their visual changes may be cuts or animation; sampling does not establish which. Do not impose unverified zooms, wipe transitions, music or sound effects as reference facts.

For Chinese instruction, preserve accurate speech and readable target text, source-appropriate simplified or traditional characters, pinyin and Vietnamese only when required by the actual class brief. Allocate time for comprehension or oral response where the lesson needs it; those are teaching adaptations, not observed reference timings. Reuse the grammar of the reference, not its characters, art, logos or audio.

The Lemo-Opuscar directing approach can add stronger preproduction and visual review to either short or long classroom edits. It does not change the observed Instagram reference findings above, validate long-form dialogue structure, or require a code-rendered film. Use the project's existing editor/render path unless a code-built visual treatment clearly serves the brief and its runtime and handoff have been checked.

## Tools and setup assessment

- Installed locally: FFmpeg 8.1, ffprobe, yt-dlp, HyperFrames CLI 0.8.219; `hyperframes --help` runs. Node 20.15.1 is below the upstream HyperFrames README's Node 22+ requirement: CLI startup alone does not verify a render. Use the existing local HyperFrames skill and check the actual project runtime before rendering. No new tool or dependency was installed.
- [HyperFrames](https://github.com/heygen-com/hyperframes): suitable for editable timed captions, composition and rendering; it does not itself establish character generation or lip-sync quality. Use the existing bundled HyperFrames skills when implementing.
- [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar): optional directing and code-built film reference; its style library, plugin, dependencies and rendering pipeline have not been installed or tested in this project.
- The project-local [Lemo-Opuscar skill](../lemo-opuscar/SKILL.md) was installed as a workflow adaptation. It does not include the upstream setup script, library, plugin, or dependencies.
- [MotionClone](https://github.com/blixvip/MotionClone): useful conceptually for reference comparison and editable reconstruction, but its documented local launcher is Windows-oriented and requires Node 22+ and connected account; no Mac setup or render verified. No installation or account connection performed.
- [threejs-skills](https://github.com/cloudai-x/threejs-skills): optional for a genuinely necessary 3D scene; these references do not establish a need for a 3D pipeline. No installation.
- [awesome-claude-video-skills](https://github.com/zhuyansen/awesome-claude-video-skills): discovery catalog, not executable authority or independent safety audit. No installation.
- [fogleman/In](https://github.com/fogleman/In): supplied URL returned 404; no functionality inferred.
