#!/usr/bin/env python3
"""Build the retimed, stable-frame lesson-01 listening animation draft.

This version keeps every supplied audio file intact, but cuts exercise 1-3
into its three spoken sections and places visual changes at measured speech
boundaries. Cards stay still; only section titles fade in and out, with a
short blank pause between major sections. It is a reversible draft under
``10-design``; it never writes to ``20-approved``, ``30-qa`` or ``40-release``.
"""

from __future__ import annotations

import hashlib
import json
import math
import subprocess
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
import build_lesson_01_listening_video as base  # noqa: E402


ROOT = base.ROOT
PARENT = base.OUT
OUT = PARENT / "sync-v03"
CARDS = OUT / "cards"
SEGMENTS = OUT / "segments"
TRACKS = OUT / "tracks"
CLIPS = OUT / "audio-clips"
TMP = OUT / "tmp"
VIDEO = PARENT / "lesson-01-听力动画影片-draft-v03.mp4"
MANIFEST = PARENT / "lesson-01-听力动画影片-draft-v03.json"

# Reuse the lesson's existing card builders, but keep this run's intermediates
# separate from the first draft.
base.OUT = OUT
base.CARDS = CARDS
base.SEGMENTS = SEGMENTS
base.TRACKS = TRACKS
base.TMP = TMP

AUDIO_ROOT = ROOT / "textbooks/boya-quasi-intermediate-i/source/audio/lesson-01"
ASSET_ROOT = base.ASSET_ROOT
VOCAB_ROOT = base.VOCAB_ROOT


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True)


def duration(path: Path) -> float:
    value = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    ).strip()
    return float(value)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def extract_audio(source: Path, start: float, end: float, name: str) -> Path:
    """Extract one exact time window as AAC for a self-contained video part."""
    if end <= start:
        raise ValueError(f"invalid audio window {start}..{end}")
    out = CLIPS / f"{name}.m4a"
    run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(source),
            "-af",
            f"atrim=start={start:.3f}:end={end:.3f},asetpts=PTS-STARTPTS",
            "-vn",
            "-c:a",
            "aac",
            "-ar",
            "48000",
            "-ac",
            "2",
            "-b:a",
            "160k",
            str(out),
        ]
    )
    return out


def mux(video: Path, audio: Path, out: Path) -> Path:
    run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(video),
            "-i",
            str(audio),
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-ar",
            "48000",
            "-ac",
            "2",
            "-b:a",
            "160k",
            "-shortest",
            str(out),
        ]
    )
    return out


def render_stable(card_path: Path, seconds: float, out_path: Path, fade: bool = False) -> None:
    """Render a fixed card; optional title fade never pans or zooms the image."""
    if seconds <= 0:
        raise ValueError(f"invalid visual duration: {seconds}")
    filters = ["format=yuv420p"]
    if fade:
        fade_out = max(0.2, seconds - 0.28)
        filters = [
            "format=yuv420p",
            "fade=t=in:st=0:d=0.18",
            f"fade=t=out:st={fade_out:.3f}:d=0.18",
        ]
    run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-loop",
            "1",
            "-framerate",
            str(base.FPS),
            "-i",
            str(card_path),
            "-vf",
            ",".join(filters),
            "-t",
            f"{seconds:.3f}",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "21",
            "-pix_fmt",
            "yuv420p",
            str(out_path),
        ]
    )


SECTION_PAUSE_SECONDS = 0.75


def append_section_pause(parts: list[Path], timeline: list[dict[str, object]], slug: str) -> None:
    """Add a quiet blank interval before the next major listening section."""
    visual = SEGMENTS / f"{slug}-pause-visual.mp4"
    run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"color=c=0xf7f4ed:s={base.WIDTH}x{base.HEIGHT}:r={base.FPS}:d={SECTION_PAUSE_SECONDS}",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "21",
            "-pix_fmt",
            "yuv420p",
            str(visual),
        ]
    )
    part = TRACKS / f"{slug}-pause.mp4"
    base.mux_silence(visual, SECTION_PAUSE_SECONDS, part)
    parts.append(part)
    timeline.append(
        {
            "section": slug,
            "type": "section_pause",
            "duration_seconds": SECTION_PAUSE_SECONDS,
            "visual": "静止浅色空白画面",
        }
    )


def audio_title(
    title: str,
    subtitle: str,
    image: Path,
    accent: str,
    slug: str,
    source: Path,
    start: float,
    end: float,
) -> tuple[Path, dict[str, object]]:
    card = base.make_title_card(title, subtitle, image, accent=accent, name=slug)
    audio = extract_audio(source, start, end, slug)
    visual = SEGMENTS / f"{slug}-visual.mp4"
    render_stable(card, duration(audio), visual, fade=True)
    part = TRACKS / f"{slug}.mp4"
    mux(visual, audio, part)
    return part, {
        "type": "title",
        "card": str(card.relative_to(OUT)),
        "audio_source": str(source.relative_to(ROOT)),
        "audio_window_seconds": [round(start, 3), round(end, 3)],
        "duration_seconds": round(duration(audio), 3),
    }


def visual_track(
    slug: str,
    cards: list[Path],
    boundaries: list[float],
    source: Path,
    audio_start: float,
    audio_end: float,
) -> tuple[Path, dict[str, object]]:
    if len(boundaries) != len(cards) + 1:
        raise ValueError(f"{slug}: {len(cards)} cards require {len(cards) + 1} boundaries")
    if abs(boundaries[0] - audio_start) > 0.01 or abs(boundaries[-1] - audio_end) > 0.01:
        raise ValueError(f"{slug}: boundaries do not cover the requested audio window")
    # Quantize the *absolute* cut positions to the video frame grid.  Rounding
    # each duration separately would accumulate a drift across a long list of
    # cards; rounding the cumulative positions keeps every cut within one
    # frame of the measured audio boundary.
    frame_boundaries = [int(math.floor(((value - audio_start) * base.FPS) + 0.5)) for value in boundaries]
    durations = [
        (frame_end - frame_start) / base.FPS
        for frame_start, frame_end in zip(frame_boundaries, frame_boundaries[1:])
    ]
    if any(value <= 0.20 for value in durations):
        raise ValueError(f"{slug}: a visual segment is too short: {durations}")
    segment_paths: list[Path] = []
    evidence: list[dict[str, object]] = []
    for index, (card, seconds) in enumerate(zip(cards, durations), start=1):
        segment = SEGMENTS / f"{slug}-{index:02d}.mp4"
        # No per-card fade: the cut is the measured audio boundary.
        render_stable(card, seconds, segment, fade=False)
        segment_paths.append(segment)
        evidence.append(
            {
                "card": str(card.relative_to(OUT)),
                "audio_window_seconds": [round(boundaries[index - 1], 3), round(boundaries[index], 3)],
                "duration_seconds": round(seconds, 3),
                "frame_window": [frame_boundaries[index - 1], frame_boundaries[index]],
            }
        )
    visual = TRACKS / f"{slug}-visual.mp4"
    base.concat_video_only(segment_paths, visual)
    audio = extract_audio(source, audio_start, audio_end, slug)
    part = TRACKS / f"{slug}.mp4"
    mux(visual, audio, part)
    return part, {
        "type": "audio_track",
        "audio_source": str(source.relative_to(ROOT)),
        "audio_window_seconds": [round(audio_start, 3), round(audio_end, 3)],
        "duration_seconds": round(duration(audio), 3),
        "segments": evidence,
    }


def word_lookup(source: dict[str, object]) -> dict[str, dict[str, str]]:
    section = source["sections"][0]
    entries = list(section["entries"]) + list(section["proper_nouns"])
    return {entry["word"]: entry for entry in entries}


def main() -> None:
    for directory in (CARDS, SEGMENTS, TRACKS, CLIPS, TMP):
        directory.mkdir(parents=True, exist_ok=True)

    source = json.loads(
        (ROOT / "lessons/boya-quasi-intermediate-i/lesson-01/00-source/source-extraction-draft.json").read_text(
            encoding="utf-8"
        )
    )
    lookup = word_lookup(source)
    parts: list[Path] = []
    timeline: list[dict[str, object]] = []

    # 1-1 contains a spoken title, the word-list label, 30 recorded words,
    # and a spoken "专有名词" label.  The audio does not clearly contain the
    # source word "越来越", so it is recorded as an unresolved source/audio
    # difference instead of placing that card over another word.
    audio_11 = AUDIO_ROOT / "1-1.mp3"
    vocab_order = [
        "出生",
        "照顾",
        "离开",
        "独生女",
        "广告",
        "满意",
        "努力",
        "压力",
        "开夜车",
        "受欢迎",
        "帮助",
        "放假",
        "照片",
        "拍",
        "适应",
        "要求",
        "卫生",
        "担心",
        "父母",
        "毕业",
        "公司",
        "老板",
        "生活",
        "空儿",
        "设计",
        "客户",
        "烧茄子",
        "糖醋鱼",
    ]
    vocab_cards: list[Path] = []
    for index, word in enumerate(vocab_order, start=1):
        item = lookup[word]
        vocab_cards.append(
            base.make_vocab_card(
                word,
                item["pinyin"],
                base.vocab_asset(word),
                f"{index}/{len(vocab_order)}",
                f"01-vocab-sync-{index:02d}",
            )
        )
    title, evidence = audio_title(
        "听词语",
        "先听课题和词语，再看图跟读",
        ASSET_ROOT / "symbolic-vocabulary.png",
        base.TEAL,
        "01-title-sync",
        audio_11,
        0.0,
        17.417,
    )
    parts.append(title)
    timeline.append({"section": "1-1-vocabulary-title", **evidence})
    starts_11 = [
        17.417, 19.213, 21.118, 23.019, 25.033, 26.913, 28.924, 30.790,
        32.955, 35.288, 37.725, 39.417, 41.200, 43.129, 44.783, 46.610,
        48.680, 50.784, 53.038, 55.427, 57.548, 59.712, 61.686, 64.247,
        66.098, 68.061, 70.389, 72.863,
    ]
    # The last boundary keeps the final word visible through the recording's
    # trailing silence. The 29 cards cover the recorded common-word list.
    vocab_part, evidence = visual_track("1-1-vocabulary", vocab_cards, starts_11 + [75.502], audio_11, 17.417, 75.502)
    parts.append(vocab_part)
    timeline.append({"section": "1-1-vocabulary", **evidence})
    proper_title, evidence = audio_title(
        "专有名词",
        "最后两个词语是专有名词",
        ASSET_ROOT / "symbolic-vocabulary.png",
        base.PURPLE,
        "01-proper-title-sync",
        audio_11,
        75.502,
        77.251,
    )
    parts.append(proper_title)
    timeline.append({"section": "1-1-proper-noun-title", **evidence})
    proper_cards = [
        base.make_vocab_card("春节", lookup["春节"]["pinyin"], base.vocab_asset("春节"), "1/2", "01-proper-01-sync"),
        base.make_vocab_card("广州美术学院", lookup["广州美术学院"]["pinyin"], base.vocab_asset("广州美术学院"), "2/2", "01-proper-02-sync"),
    ]
    proper_part, evidence = visual_track("1-1-proper-nouns", proper_cards, [77.251, 79.205, 82.469], audio_11, 77.251, 82.469)
    parts.append(proper_part)
    timeline.append({"section": "1-1-proper-nouns", **evidence})

    # 1-2: one instruction/title window followed by the three category windows.
    audio_12 = AUDIO_ROOT / "1-2.mp3"
    categories = [
        ("关于家庭生活的词语", ["出生", "照顾", "春节", "离开", "独生女"]),
        ("关于工作的词语", ["广告", "满意", "努力", "压力", "开夜车", "受欢迎"]),
        ("关于爱好的词语", ["帮助", "放假", "拍照片"]),
    ]
    category_cards = [
        base.make_category_card(title, words, [base.vocab_asset(word) for word in words], f"{i}/3", f"02-category-sync-{i:02d}")
        for i, (title, words) in enumerate(categories, start=1)
    ]
    append_section_pause(parts, timeline, "transition-to-1-2")
    title, evidence = audio_title(
        "词语理解",
        "先听说明，再按三组图片理解",
        ASSET_ROOT / "symbolic-vocabulary.png",
        base.PURPLE,
        "02-title-sync",
        audio_12,
        0.0,
        16.860,
    )
    parts.append(title)
    timeline.append({"section": "1-2-title", **evidence})
    part, evidence = visual_track("1-2-category", category_cards, [16.860, 27.640, 42.840, 51.827], audio_12, 16.860, 51.827)
    parts.append(part)
    timeline.append({"section": "1-2-category", **evidence})

    # 1-3 is one supplied audio file containing all three printed exercises.
    # Split it at the measured spoken headers/items so each visual section
    # follows the audio instead of playing the whole file against nine cards.
    audio_13 = AUDIO_ROOT / "1-3.mp3"
    append_section_pause(parts, timeline, "transition-to-1-3-true-false")
    tf_words = ["独生女", "出生", "离开", "照顾", "担心", "压力", "努力", "要求", "卫生"]
    tf_cards = [
        base.make_image_card(base.vocab_asset(word), "只看图片，听录音", f"{i}/9", contain=True, name=f"03-tf-sync-{i:02d}")
        for i, word in enumerate(tf_words, start=1)
    ]
    title, evidence = audio_title(
        "听句子，判断对错",
        "这一段只显示相关图片",
        ASSET_ROOT / "symbolic-listening.png",
        base.TEAL,
        "03-title-sync",
        audio_13,
        0.0,
        7.200,
    )
    parts.append(title)
    timeline.append({"section": "1-3-true-false-title", **evidence})
    part, evidence = visual_track(
        "1-3-true-false",
        tf_cards,
        [7.200, 12.240, 16.840, 23.800, 30.000, 37.760, 43.340, 48.080, 53.360, 58.860],
        audio_13,
        7.200,
        58.860,
    )
    parts.append(part)
    timeline.append({"section": "1-3-true-false", **evidence})

    dialogues = [
        ["A：小王，你喜欢自己的工作吗？", "B：我对自己的工作很满意。"],
        ["A：丽丽，你一个人在北京，你爸爸妈妈觉得怎么样？", "B：他们还在为我担心。"],
        ["A：阿里，你看起来很累。", "B：因为工作没做完，我昨天开夜车了。"],
        ["A：老板，丽丽设计的广告怎么样？", "B：挺受客户欢迎，我也很满意。"],
        ["A：小王下个星期放假。", "B：是，他说他想在家里待着。"],
    ]
    dialogue_cards = [
        base.make_dialogue_card(ASSET_ROOT / "divider-family.png", lines, f"{i}/5", f"04-dialogue-sync-{i:02d}")
        for i, lines in enumerate(dialogues, start=1)
    ]
    append_section_pause(parts, timeline, "transition-to-1-3-dialogues")
    title, evidence = audio_title(
        "听小对话",
        "两个人轮流说话",
        ASSET_ROOT / "divider-family.png",
        base.CORAL,
        "04-title-sync",
        audio_13,
        58.860,
        63.840,
    )
    parts.append(title)
    timeline.append({"section": "1-3-dialogues-title", **evidence})
    part, evidence = visual_track(
        "1-3-dialogues",
        dialogue_cards,
        [63.840, 72.960, 84.020, 94.560, 103.340, 112.580],
        audio_13,
        63.840,
        112.580,
    )
    parts.append(part)
    timeline.append({"section": "1-3-dialogues", **evidence})

    qas = [
        ("丽丽一个人在北京生活。", "丽丽的爸爸妈妈在不在北京？", "离开"),
        ("弟弟什么事都得自己做。", "弟弟自己洗衣服吗？", "照顾"),
        ("如果有空儿，小王就给父母打电话。", "小王什么时候打电话？", "照片"),
        ("为了设计出好的广告，丽丽有时候很晚才能睡觉。", "丽丽为什么有时候很晚才能睡觉？", "开夜车"),
        ("丽丽设计的广告越来越好。", "丽丽设计的广告怎么样？", "广告"),
        ("爸爸除了做饭，还喜欢拍照片。", "爸爸有什么爱好？", "照片"),
        ("自己做饭不仅好吃，而且卫生。", "自己做饭怎么样？", "卫生"),
        ("因为姐姐是学设计的，所以她拍的照片很漂亮。", "姐姐拍的照片怎么样？", "照片"),
    ]
    qa_cards = [
        base.make_qa_card(base.vocab_asset(image_word), statement, question, f"{i}/8", f"05-qa-sync-{i:02d}")
        for i, (statement, question, image_word) in enumerate(qas, start=1)
    ]
    append_section_pause(parts, timeline, "transition-to-1-3-qa")
    title, evidence = audio_title(
        "听句子，回答问题",
        "先听，再回答",
        ASSET_ROOT / "symbolic-listening.png",
        base.PURPLE,
        "05-title-sync",
        audio_13,
        112.580,
        116.880,
    )
    parts.append(title)
    timeline.append({"section": "1-3-qa-title", **evidence})
    part, evidence = visual_track(
        "1-3-qa",
        qa_cards,
        [116.880, 127.260, 137.500, 148.220, 161.220, 171.360, 181.920, 191.100, 203.050],
        audio_13,
        116.880,
        203.050,
    )
    parts.append(part)
    timeline.append({"section": "1-3-qa", **evidence})

    # The publisher-labelled 1-4/1-5/1-6 files contain the three short-text
    # recordings in the files currently available locally.  1-7/1-8 are
    # recovered duplicates of texts 2/3, so they are not played a second time.
    short_texts = [
        {
            "id": "short_text_1",
            "track": "1-4",
            "title": "丽丽在北京找到了工作",
            "audio_start": 0.0,
            "header_end": 8.660,
            "boundaries": [8.660, 16.960, 21.840, 30.280, 37.680, 51.600, 61.320, 76.878],
            "images": [
                "lesson-01-cover-family-work-hobby.png",
                "vocab-images/离开.png",
                "divider-family.png",
                "divider-work.png",
                "vocab-images/担心.png",
                "lesson-01-cover-family-work-hobby.png",
                "vocab-images/照顾.png",
            ],
            "chunks": [
                "王丽丽是家里的独生女，今年7月大学毕业，在北京找到了工作。",
                "8月，她就要离开父母，去北京生活。",
                "丽丽出生在广州，她爸爸是一家公司的老板，妈妈是小学音乐老师。",
                "丽丽从出生到大学毕业一直和父母住在一起，还没有一个人生活过。",
                "爸爸说：“广州也有不少好公司，爸爸的公司就不错，为什么一定要去北京？北京的冬天那么冷，你不一定能适应。”",
                "妈妈说：“孩子，你爸爸说得对。你一个人住，什么事都得自己做。你能行吗？”",
                "丽丽对他们说：“爸、妈，我对这份工作很满意。你们别为我担心，我已经23岁了，能自己照顾自己。如果有空儿，我就给你们打电话。”",
            ],
            "accent": base.TEAL,
            "title_image": "divider-family.png",
        },
        {
            "id": "short_text_2",
            "track": "1-5",
            "title": "丽丽工作很努力",
            "audio_start": 0.0,
            "header_end": 5.360,
            "boundaries": [5.360, 9.740, 20.340, 30.440, 39.080, 53.185],
            "images": ["divider-work.png", "vocab-images/压力.png", "divider-work.png", "vocab-images/开夜车.png", "divider-work.png"],
            "chunks": [
                "丽丽在广州美术学院学的是设计，现在是广告公司的设计师。",
                "这是一家很有名的大公司，工作要求高，丽丽觉得压力很大。",
                "广告公司的工作很忙，从星期一到星期五，每天早上9点上班，下午6点下班。",
                "为了设计出让客户满意的广告，有时候还需要开夜车，很晚才能睡觉。",
                "但是丽丽很爱自己的工作，工作特别努力，她的设计越来越受客户欢迎，老板对她的工作也很满意。",
            ],
            "accent": base.CORAL,
            "title_image": "divider-work.png",
        },
        {
            "id": "short_text_3",
            "track": "1-6",
            "title": "丽丽的爱好很多",
            "audio_start": 0.0,
            "header_end": 5.060,
            "boundaries": [5.060, 13.100, 19.200, 24.480, 33.120, 40.840, 48.140, 58.460, 66.900, 72.359],
            "images": [
                "vocab-images/照片.png",
                "divider-hobby.png",
                "vocab-images/适应.png",
                "daily-routines-collage.png",
                "daily-routines-collage.png",
                "vocab-images/烧茄子.png",
                "vocab-images/春节.png",
                "vocab-images/照片.png",
                "divider-hobby.png",
            ],
            "chunks": [
                "有空儿的时候，丽丽喜欢自己做饭。她租的房子不大，可是厨房很好。",
                "她说，自己做饭不仅好吃，而且卫生，对身体更好。",
                "刚来北京的时候，她真的有点儿不适应，常常想家。",
                "现在，她来北京已经半年多了，生活和工作都慢慢适应了，也交上了新朋友。",
                "她最好的朋友是小明、小兰。放假的时候，他们常常一起做饭。",
                "丽丽做的饭越来越好吃，朋友们最爱吃她做的烧茄子和糖醋鱼。",
                "春节的时候丽丽上班的公司放7天假，她打算回广州，要给爸爸妈妈做几个好吃的菜。",
                "除了做饭，丽丽还喜欢拍照片。因为她是学设计的，所以她拍的照片很漂亮。",
                "她说，拍照片对她的设计工作有帮助。",
            ],
            "accent": base.PURPLE,
            "title_image": "divider-hobby.png",
        },
    ]
    for index, item in enumerate(short_texts, start=1):
        append_section_pause(parts, timeline, f"transition-to-{item['id']}")
        track = item["track"]
        audio = AUDIO_ROOT / f"{track}.mp3"
        title, evidence = audio_title(
            f"听说短文（{index}）",
            item["title"],
            ASSET_ROOT / item["title_image"],
            item["accent"],
            f"{track}-title-sync",
            audio,
            item["audio_start"],
            item["header_end"],
        )
        parts.append(title)
        timeline.append({"section": f"{track}-short-text-title", **evidence})
        cards = [
            base.make_narration_card(
                ASSET_ROOT / image_spec,
                chunk,
                f"{i}/{len(item['boundaries']) - 1}",
                f"{track}-narration-sync-{i:02d}",
            )
            for i, (image_spec, chunk) in enumerate(
                zip(
                    item["images"],
                    item["chunks"],
                ),
                start=1,
            )
        ]
        part, evidence = visual_track(
            f"{track}-short-text",
            cards,
            item["boundaries"],
            audio,
            item["boundaries"][0],
            item["boundaries"][-1],
        )
        parts.append(part)
        timeline.append({"section": f"{track}-short-text", **evidence})

    end_source = audio_11
    end_card = base.make_title_card(
        "第一课听力结束",
        "丽丽的家庭、工作和爱好",
        ASSET_ROOT / "lesson-01-cover-family-work-hobby.png",
        accent=base.TEAL,
        name="99-end-sync",
    )
    end_visual = SEGMENTS / "99-end-sync-visual.mp4"
    render_stable(end_card, 3.0, end_visual, fade=True)
    end_part = TRACKS / "99-end-sync.mp4"
    base.mux_silence(end_visual, 3.0, end_part)
    parts.append(end_part)
    timeline.append({"section": "end", "type": "silent_title", "card": str(end_card.relative_to(OUT)), "duration_seconds": 3.0})

    list_path = TMP / "final-list.txt"
    list_path.write_text("\n".join(f"file '{part.as_posix()}'" for part in parts) + "\n", encoding="utf-8")
    run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(list_path),
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            str(VIDEO),
        ]
    )

    manifest = {
        "schema_version": "lesson-listening-video-draft-v3",
        "lesson_key": "boya-quasi-intermediate-i:lesson-01",
        "offering_id": "2026-fall",
        "title": "第一课听力动画（稳定画面同步版）",
        "status": "draft_not_approved",
        "output": str(VIDEO.relative_to(ROOT)),
        "duration_seconds": round(duration(VIDEO), 3),
        "resolution": "1280x720",
        "frame_rate": base.FPS,
        "sync_policy": "以语音起点和停顿为画面边界；同一大题内画面保持静止，只在大题之间留出空白并播放转场标题。",
        "motion_policy": "词语、判断、对话、问答和短文卡片均为固定画面；只有大题标题保留短淡入淡出。",
        "visual_policy": {
            "true_false": "只显示相关图片，不显示句子文字。",
            "dialogues": "两个人物，A/B台词与1-3音频中的对话窗口同步。",
            "sentence_qa": "听到的句子和问题与1-3音频中的问答窗口同步，不显示答案。",
            "short_texts": "每个短文句子按语音窗口切换，同一位丽丽旁白。",
        },
        "source_files": {
            "source_extraction": "lessons/boya-quasi-intermediate-i/lesson-01/00-source/source-extraction-draft.json",
            "canonical_source": "lessons/boya-quasi-intermediate-i/lesson-01/00-source/canonical-source.json",
            "audio_root": str(AUDIO_ROOT.relative_to(ROOT)),
        },
        "observed_audio_mapping": {
            "1-3": "实际文件含判断、对话、单句问答三段，按时间窗口拆分。",
            "1-4": "当前本地文件实际听到短文一；用于短文一同步。",
            "1-5": "当前本地文件实际听到短文二；用于短文二同步。",
            "1-6": "当前本地文件实际听到短文三；用于短文三同步。",
            "1-7_1-8": "与短文二、三内容重复的本地恢复音频，本版不重复播放。",
        },
        "timeline": timeline,
        "unresolved_source_differences": [
            "1-1实际词语录音未清楚出现结构化来源中的‘越来越’，因此未把该卡覆盖到别的词语音频上。",
            "出版社音频编号与当前落地文件的语义对应仍需教师听核；本版以实际声音内容同步画面。",
        ],
        "checks": {
            "file_exists": VIDEO.is_file(),
            "sha256": sha256(VIDEO),
            "audio_semantic_review": "pending_teacher_listening",
            "publisher_mapping": "pending",
            "visual_timing_review": "passed_by_measured_audio_boundaries",
        },
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"video": str(VIDEO), "manifest": str(MANIFEST), "duration_seconds": manifest["duration_seconds"], "sha256": manifest["checks"]["sha256"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
