#!/usr/bin/env python3
"""Build a lesson-01 listening motion-comic draft from the source audio.

The video is deliberately scoped as a reversible draft under 10-design. It
uses the lesson's existing illustration assets, motion camera moves, and the
publisher/recovered MP3s. It does not write to 20-approved, 30-qa, or
40-release.
"""

from __future__ import annotations

import hashlib
import json
import math
import shutil
import subprocess
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).resolve().parent
CARDS = OUT / "cards"
SEGMENTS = OUT / "segments"
TRACKS = OUT / "tracks"
TMP = OUT / "tmp"
VIDEO = OUT / "lesson-01-听力动画影片-draft-v01.mp4"
MANIFEST = OUT / "lesson-01-听力动画影片-draft-v01.json"

ASSET_ROOT = ROOT / "lessons/boya-quasi-intermediate-i/lesson-01/10-design/image-assets-draft"
VOCAB_ROOT = ASSET_ROOT / "vocab-images"
AUDIO_ROOT = ROOT / "textbooks/boya-quasi-intermediate-i/source/audio/lesson-01"
SOURCE_JSON = ROOT / "lessons/boya-quasi-intermediate-i/lesson-01/00-source/source-extraction-draft.json"
CANONICAL_JSON = ROOT / "lessons/boya-quasi-intermediate-i/lesson-01/00-source/canonical-source.json"

WIDTH = 1280
HEIGHT = 720
FPS = 24
BG = "#F7F4ED"
NAVY = "#243B53"
SLATE = "#486581"
TEAL = "#4B9B9B"
CORAL = "#ED8B76"
PURPLE = "#8B7AAE"
YELLOW = "#E8B949"
FONT_PATH = "/Library/Fonts/Microsoft/Kaiti.ttf"


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True)


def ffprobe_duration(path: Path) -> float:
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


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_PATH, size=size)


def text_width(draw: ImageDraw.ImageDraw, value: str, fnt: ImageFont.FreeTypeFont) -> float:
    return draw.textlength(value, font=fnt)


def wrap_zh(draw: ImageDraw.ImageDraw, value: str, fnt: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines: list[str] = []
    current = ""
    for char in value:
        if char == "\n":
            lines.append(current)
            current = ""
            continue
        candidate = current + char
        if current and text_width(draw, candidate, fnt) > max_width:
            lines.append(current)
            current = char
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines or [""]


def paste_shadow(canvas: Image.Image, image: Image.Image, xy: tuple[int, int], radius: int = 24) -> None:
    x, y = xy
    shadow = Image.new("RGBA", image.size, (36, 59, 83, 0))
    alpha = Image.new("L", image.size, 0)
    ImageDraw.Draw(alpha).rounded_rectangle((0, 0, image.width, image.height), radius=radius, fill=90)
    shadow.putalpha(alpha.filter(ImageFilter.GaussianBlur(12)))
    canvas.alpha_composite(shadow, (x + 9, y + 11))
    canvas.alpha_composite(image, (x, y))


def fit_contain(source: Image.Image, max_size: tuple[int, int]) -> Image.Image:
    result = source.convert("RGBA")
    result.thumbnail(max_size, Image.Resampling.LANCZOS)
    return result


def fit_cover(source: Image.Image, size: tuple[int, int]) -> Image.Image:
    return ImageOps.fit(source.convert("RGB"), size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5)).convert("RGBA")


def load_asset(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def draw_header(draw: ImageDraw.ImageDraw, label: str, color: str = TEAL, right: str | None = None) -> None:
    fnt = font(27)
    x, y = 42, 34
    width = int(text_width(draw, label, fnt)) + 34
    draw.rounded_rectangle((x, y, x + width, y + 48), radius=18, fill=color)
    draw.text((x + 17, y + 8), label, fill="white", font=fnt)
    if right:
        rf = font(25)
        rw = int(text_width(draw, right, rf))
        draw.text((WIDTH - rw - 44, y + 10), right, fill=SLATE, font=rf)


def draw_footer(draw: ImageDraw.ImageDraw, text: str, color: str = NAVY, max_lines: int = 3) -> None:
    fnt = font(31)
    lines = wrap_zh(draw, text, fnt, 1120)
    lines = lines[:max_lines]
    line_height = 43
    box_h = 30 + line_height * len(lines)
    x, y = 48, HEIGHT - box_h - 34
    box = Image.new("RGBA", (WIDTH - 96, box_h), (255, 255, 255, 226))
    ImageDraw.Draw(box).rounded_rectangle((0, 0, box.width - 1, box.height - 1), radius=22, outline=(72, 101, 129, 135), width=2)
    draw._image.alpha_composite(box, (x, y))
    for index, line in enumerate(lines):
        draw.text((x + 28, y + 14 + index * line_height), line, fill=color, font=fnt)


def draw_center_title(draw: ImageDraw.ImageDraw, title: str, subtitle: str | None = None) -> None:
    title_font = font(58 if len(title) <= 14 else 48)
    lines = wrap_zh(draw, title, title_font, 940)
    start_y = 205 - (len(lines) - 1) * 32
    for index, line in enumerate(lines):
        width = text_width(draw, line, title_font)
        draw.text(((WIDTH - width) / 2, start_y + index * 70), line, fill=NAVY, font=title_font)
    if subtitle:
        sf = font(30)
        sw = text_width(draw, subtitle, sf)
        draw.text(((WIDTH - sw) / 2, start_y + len(lines) * 70 + 12), subtitle, fill=SLATE, font=sf)


def new_canvas() -> Image.Image:
    return Image.new("RGBA", (WIDTH, HEIGHT), BG)


def save_card(image: Image.Image, name: str) -> Path:
    path = CARDS / f"{name}.png"
    image.convert("RGB").save(path, format="PNG", optimize=True)
    return path


def make_title_card(title: str, subtitle: str, image_path: Path, accent: str = TEAL, name: str = "title") -> Path:
    bg = fit_cover(load_asset(image_path), (WIDTH, HEIGHT))
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (247, 244, 237, 195))
    bg = Image.alpha_composite(bg, overlay)
    draw = ImageDraw.Draw(bg)
    draw_header(draw, "第一课 · 丽丽是独生女", accent)
    draw_center_title(draw, title, subtitle)
    draw.line((350, 550, 930, 550), fill=accent, width=3)
    return save_card(bg, name)


def make_image_card(image_path: Path, label: str, index: str | None = None, contain: bool = True, name: str = "image") -> Path:
    canvas = new_canvas()
    if contain:
        image = fit_contain(load_asset(image_path), (WIDTH - 180, HEIGHT - 150))
        frame = Image.new("RGBA", (image.width + 30, image.height + 30), (255, 255, 255, 235))
        ImageDraw.Draw(frame).rounded_rectangle((0, 0, frame.width - 1, frame.height - 1), radius=24, outline=(148, 163, 184, 155), width=2)
        frame.alpha_composite(image, (15, 15))
        paste_shadow(canvas, frame, ((WIDTH - frame.width) // 2, 92))
    else:
        canvas.alpha_composite(fit_cover(load_asset(image_path), (WIDTH, HEIGHT)))
    draw = ImageDraw.Draw(canvas)
    draw_header(draw, label, TEAL, index)
    return save_card(canvas, name)


def make_vocab_card(word: str, pinyin: str, image_path: Path, index: str, name: str) -> Path:
    canvas = new_canvas()
    image = fit_contain(load_asset(image_path), (420, 505))
    frame = Image.new("RGBA", (image.width + 24, image.height + 24), (255, 255, 255, 238))
    frame.alpha_composite(image, (12, 12))
    paste_shadow(canvas, frame, (92, 120))
    draw = ImageDraw.Draw(canvas)
    draw_header(draw, "听词语", TEAL, index)
    word_font = font(58 if len(word) <= 4 else 46)
    draw.text((625, 250), word, fill=NAVY, font=word_font)
    draw.text((628, 330), pinyin, fill=SLATE, font=font(31))
    draw.line((626, 390, 1110, 390), fill=CORAL, width=3)
    draw.text((628, 425), "看图，听一听", fill=SLATE, font=font(30))
    return save_card(canvas, name)


def make_category_card(title: str, words: list[str], image_paths: list[Path], index: str, name: str) -> Path:
    canvas = new_canvas()
    draw = ImageDraw.Draw(canvas)
    draw_header(draw, "词语理解", PURPLE, index)
    draw.text((60, 102), title, fill=NAVY, font=font(42))
    cols = 3
    cell_w, cell_h = 350, 240
    start_x, start_y = 70, 190
    for i, (word, image_path) in enumerate(zip(words, image_paths)):
        row, col = divmod(i, cols)
        x, y = start_x + col * 390, start_y + row * 250
        tile = Image.new("RGBA", (cell_w, cell_h), (255, 255, 255, 220))
        tile_draw = ImageDraw.Draw(tile)
        tile_draw.rounded_rectangle((0, 0, cell_w - 1, cell_h - 1), radius=20, outline=(148, 163, 184, 130), width=2)
        thumb = fit_contain(load_asset(image_path), (130, 195))
        tile.alpha_composite(thumb, (20, 20))
        tile_draw.text((170, 88), word, fill=NAVY, font=font(29))
        canvas.alpha_composite(tile, (x, y))
    return save_card(canvas, name)


def make_dialogue_card(image_path: Path, lines: list[str], index: str, name: str) -> Path:
    canvas = new_canvas()
    canvas.alpha_composite(fit_cover(load_asset(image_path), (WIDTH, HEIGHT)))
    veil = Image.new("RGBA", (WIDTH, HEIGHT), (247, 244, 237, 70))
    canvas.alpha_composite(veil)
    draw = ImageDraw.Draw(canvas)
    draw_header(draw, "两人对话", CORAL, index)
    fnt = font(31)
    line_height = 49
    box_h = 30 + line_height * len(lines)
    x, y = 54, HEIGHT - box_h - 38
    box = Image.new("RGBA", (WIDTH - 108, box_h), (255, 255, 255, 237))
    ImageDraw.Draw(box).rounded_rectangle((0, 0, box.width - 1, box.height - 1), radius=24, outline=(237, 139, 118, 170), width=2)
    canvas.alpha_composite(box, (x, y))
    draw = ImageDraw.Draw(canvas)
    for i, line in enumerate(lines):
        draw.text((x + 30, y + 14 + i * line_height), line, fill=NAVY if i % 2 == 0 else SLATE, font=fnt)
    return save_card(canvas, name)


def make_qa_card(image_path: Path, statement: str, question: str, index: str, name: str) -> Path:
    canvas = new_canvas()
    image = fit_contain(load_asset(image_path), (450, 525))
    frame = Image.new("RGBA", (image.width + 24, image.height + 24), (255, 255, 255, 236))
    frame.alpha_composite(image, (12, 12))
    paste_shadow(canvas, frame, (70, 96))
    draw = ImageDraw.Draw(canvas)
    draw_header(draw, "听句子 · 回答问题", PURPLE, index)
    fnt = font(29)
    y = 180
    for label, text, color in (("听到", statement, NAVY), ("回答", question, SLATE)):
        draw.text((590, y), f"{label}：", fill=CORAL if label == "回答" else TEAL, font=font(32))
        lines = wrap_zh(draw, text, fnt, 560)
        for line in lines:
            draw.text((720, y), line, fill=color, font=fnt)
            y += 42
        y += 24
    return save_card(canvas, name)


def make_narration_card(image_path: Path, text: str, index: str, name: str) -> Path:
    canvas = new_canvas()
    canvas.alpha_composite(fit_cover(load_asset(image_path), (WIDTH, HEIGHT)))
    veil = Image.new("RGBA", (WIDTH, HEIGHT), (247, 244, 237, 62))
    canvas.alpha_composite(veil)
    draw = ImageDraw.Draw(canvas)
    draw_header(draw, "丽丽 · 旁白", TEAL, index)
    draw_footer(draw, text, NAVY, max_lines=3)
    return save_card(canvas, name)


def make_cover_intro() -> Path:
    return make_title_card(
        "听力动画",
        "词语、对话、短文，跟着丽丽听一遍",
        ASSET_ROOT / "lesson-01-cover-family-work-hobby.png",
        accent=TEAL,
        name="00-intro",
    )


def vocab_asset(word: str) -> Path:
    candidates = [VOCAB_ROOT / f"{word}.png"]
    if word == "拍照片":
        candidates.insert(0, VOCAB_ROOT / "照片.png")
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return ASSET_ROOT / "lesson-01-cover-family-work-hobby.png"


def render_motion(card_path: Path, duration: float, out_path: Path, fade: bool = True) -> None:
    zoom = (
        f"zoompan=z='min(1+on*0.00028,1.05)':"
        f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={WIDTH}x{HEIGHT}:fps={FPS}"
    )
    if fade:
        fade_out = max(0.2, duration - 0.28)
        vf = f"{zoom},fade=t=in:st=0:d=0.18,fade=t=out:st={fade_out:.3f}:d=0.18,format=yuv420p"
    else:
        # Exercise cards cut at an audio boundary. Avoid a black frame at each
        # boundary so the visual change occurs exactly at the pause/start.
        vf = f"{zoom},format=yuv420p"
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
            str(FPS),
            "-i",
            str(card_path),
            "-vf",
            vf,
            "-t",
            f"{duration:.3f}",
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


def mux_silence(video_path: Path, duration: float, out_path: Path) -> None:
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
            "anullsrc=r=48000:cl=stereo",
            "-i",
            str(video_path),
            "-map",
            "1:v:0",
            "-map",
            "0:a:0",
            "-t",
            f"{duration:.3f}",
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
            str(out_path),
        ]
    )


def concat_video_only(parts: list[Path], out_path: Path) -> None:
    list_path = TMP / f"{out_path.stem}.txt"
    list_path.write_text("\n".join(f"file '{part.as_posix()}'" for part in parts) + "\n", encoding="utf-8")
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(list_path), "-c", "copy", str(out_path)])


def concat_muxed(parts: list[Path], out_path: Path) -> None:
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
            str(out_path),
        ]
    )


def proportional_durations(total: float, texts: list[str]) -> list[float]:
    weights = [max(1, len(text.replace(" ", ""))) for text in texts]
    total_weight = sum(weights)
    values = [total * weight / total_weight for weight in weights]
    values[-1] += total - sum(values)
    return values


def build_track(track: str, cards: list[Path], audio_path: Path, durations: list[float]) -> tuple[Path, list[dict[str, object]]]:
    if len(cards) != len(durations):
        raise ValueError(f"card/duration mismatch for {track}")
    segment_paths: list[Path] = []
    evidence: list[dict[str, object]] = []
    for index, (card, duration) in enumerate(zip(cards, durations), start=1):
        segment_path = SEGMENTS / f"{track}-{index:02d}.mp4"
        render_motion(card, duration, segment_path)
        segment_paths.append(segment_path)
        evidence.append({"card": str(card.relative_to(OUT)), "duration_seconds": round(duration, 3)})
    video_only = TRACKS / f"{track}-visual.mp4"
    concat_video_only(segment_paths, video_only)
    muxed = TRACKS / f"{track}.mp4"
    run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(video_only),
            "-i",
            str(audio_path),
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
            str(muxed),
        ]
    )
    return muxed, evidence


def build_title(title: str, subtitle: str, image: Path, accent: str, slug: str, duration: float = 2.4) -> Path:
    card = make_title_card(title, subtitle, image, accent=accent, name=slug)
    visual = SEGMENTS / f"{slug}-visual.mp4"
    render_motion(card, duration, visual)
    muxed = TRACKS / f"{slug}.mp4"
    mux_silence(visual, duration, muxed)
    return muxed


def main() -> None:
    for directory in (CARDS, SEGMENTS, TRACKS, TMP):
        directory.mkdir(parents=True, exist_ok=True)
    # All generated files are draft outputs. Remove only this run's own stale
    # intermediate files, leaving source and authority trees untouched.
    for directory in (CARDS, SEGMENTS, TRACKS, TMP):
        for path in directory.iterdir():
            if path.is_file():
                path.unlink()

    source = json.loads(SOURCE_JSON.read_text(encoding="utf-8"))
    canonical = json.loads(CANONICAL_JSON.read_text(encoding="utf-8"))
    audio_durations = {item["track_label"]: float(item["duration_seconds"]) for item in canonical["audio_map"]}

    intro = make_cover_intro()
    sequence_parts: list[Path] = [build_title("丽丽是独生女", "第一课听力动画", ASSET_ROOT / "lesson-01-cover-family-work-hobby.png", TEAL, "00-intro", 3.0)]
    tracks: list[dict[str, object]] = []

    # 1-1: all vocabulary entries in the source inventory, including the two proper nouns.
    vocab_entries = source["sections"][0]["entries"]
    vocab_entries = vocab_entries + source["sections"][0]["proper_nouns"]
    vocab_cards: list[Path] = []
    for i, entry in enumerate(vocab_entries, start=1):
        vocab_cards.append(
            make_vocab_card(
                entry["word"],
                entry["pinyin"],
                vocab_asset(entry["word"]),
                f"{i}/{len(vocab_entries)}",
                f"01-vocab-{i:02d}",
            )
        )
    section = build_title("听词语", "听一听，看一看", ASSET_ROOT / "symbolic-vocabulary.png", TEAL, "01-title")
    track_path, evidence = build_track("1-1", vocab_cards, AUDIO_ROOT / "1-1.mp3", [audio_durations["1-1"] / len(vocab_cards)] * len(vocab_cards))
    sequence_parts.extend([section, track_path])
    tracks.append({"track": "1-1", "kind": "vocabulary", "audio": str((AUDIO_ROOT / "1-1.mp3").relative_to(ROOT)), "visual_mode": "word_image_cards", "segments": evidence, "output": str(track_path.relative_to(ROOT))})
    section = build_title("词语理解", "按家庭、工作、爱好看图片", ASSET_ROOT / "symbolic-vocabulary.png", PURPLE, "02-title")
    categories = [
        ("关于家庭生活的词语", ["出生", "照顾", "春节", "离开", "独生女"]),
        ("关于工作的词语", ["广告", "满意", "努力", "压力", "开夜车", "受欢迎"]),
        ("关于爱好的词语", ["帮助", "放假", "拍照片"]),
    ]
    category_cards = [
        make_category_card(title, words, [vocab_asset(word) for word in words], f"{i}/3", f"02-category-{i:02d}")
        for i, (title, words) in enumerate(categories, start=1)
    ]
    track_path, evidence = build_track("1-2", category_cards, AUDIO_ROOT / "1-2.mp3", [audio_durations["1-2"] / 3] * 3)
    sequence_parts.extend([section, track_path])
    tracks.append({"track": "1-2", "kind": "vocabulary_comprehension", "audio": str((AUDIO_ROOT / "1-2.mp3").relative_to(ROOT)), "visual_mode": "category_image_cards", "segments": evidence, "output": str(track_path.relative_to(ROOT))})

    # 1-3: the user asked for the related image only, without putting the sentence on screen.
    tf_words = ["独生女", "出生", "离开", "照顾", "担心", "压力", "努力", "要求", "卫生"]
    tf_cards = [
        make_image_card(vocab_asset(word), "只看图片，听录音", f"{i}/{len(tf_words)}", contain=True, name=f"03-tf-{i:02d}")
        for i, word in enumerate(tf_words, start=1)
    ]
    section = build_title("听句子，判断对错", "这一段只显示相关图片", ASSET_ROOT / "symbolic-listening.png", TEAL, "03-title")
    track_path, evidence = build_track("1-3", tf_cards, AUDIO_ROOT / "1-3.mp3", [audio_durations["1-3"] / len(tf_cards)] * len(tf_cards))
    sequence_parts.extend([section, track_path])
    tracks.append({"track": "1-3", "kind": "true_false_sentences", "audio": str((AUDIO_ROOT / "1-3.mp3").relative_to(ROOT)), "visual_mode": "related_image_only", "segments": evidence, "output": str(track_path.relative_to(ROOT))})

    # 1-4: exact short dialogues transcribed from the supplied answer PDF.
    dialogues = [
        ["A：小王，你喜欢自己的工作吗？", "B：我对自己的工作很满意。"],
        ["A：丽丽，你一个人在北京，你爸爸妈妈觉得怎么样？", "B：他们还在为我担心。"],
        ["A：阿里，你看起来很累。", "B：因为工作没做完，我昨天开夜车了。"],
        ["A：老板，丽丽设计的广告怎么样？", "B：挺受客户欢迎，我也很满意。"],
        ["A：小王下个星期放假。", "B：是，他说他想在家里待着。"],
    ]
    dialogue_images = [ASSET_ROOT / "divider-family.png"] * len(dialogues)
    dialogue_cards = [
        make_dialogue_card(image, lines, f"{i}/{len(dialogues)}", f"04-dialogue-{i:02d}")
        for i, (image, lines) in enumerate(zip(dialogue_images, dialogues), start=1)
    ]
    section = build_title("听小对话", "两个人轮流说话", ASSET_ROOT / "divider-family.png", CORAL, "04-title")
    track_path, evidence = build_track("1-4", dialogue_cards, AUDIO_ROOT / "1-4.mp3", [audio_durations["1-4"] / len(dialogue_cards)] * len(dialogue_cards))
    sequence_parts.extend([section, track_path])
    tracks.append({"track": "1-4", "kind": "dialogues", "audio": str((AUDIO_ROOT / "1-4.mp3").relative_to(ROOT)), "visual_mode": "two_speaker_caption", "segments": evidence, "output": str(track_path.relative_to(ROOT))})

    # 1-5: statement + question cards; answers stay off-screen so the listening task remains usable.
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
        make_qa_card(vocab_asset(image_word), statement, question, f"{i}/{len(qas)}", f"05-qa-{i:02d}")
        for i, (statement, question, image_word) in enumerate(qas, start=1)
    ]
    section = build_title("听句子，回答问题", "先听，再回答", ASSET_ROOT / "symbolic-listening.png", PURPLE, "05-title")
    track_path, evidence = build_track("1-5", qa_cards, AUDIO_ROOT / "1-5.mp3", [audio_durations["1-5"] / len(qa_cards)] * len(qa_cards))
    sequence_parts.extend([section, track_path])
    tracks.append({"track": "1-5", "kind": "sentence_question_answer", "audio": str((AUDIO_ROOT / "1-5.mp3").relative_to(ROOT)), "visual_mode": "statement_question_card", "segments": evidence, "output": str(track_path.relative_to(ROOT))})

    short_texts = [
        {
            "track": "1-6",
            "title": "丽丽在北京找到了工作",
            "images": [
                "lesson-01-cover-family-work-hobby.png",
                "vocab-images/离开.png",
                "divider-family.png",
                "divider-work.png",
                "vocab-images/担心.png",
                "lesson-01-cover-family-work-hobby.png",
                "vocab-images/照顾.png",
            ],
            "text": "王丽丽是家里的独生女，今年7月大学毕业，在北京找到了工作。8月，她就要离开父母，去北京生活。丽丽出生在广州，她爸爸是一家公司的老板，妈妈是小学音乐老师。丽丽从出生到大学毕业一直和父母住在一起，还没有一个人生活过。爸爸说：“广州也有不少好公司，爸爸的公司就不错，为什么一定要去北京？北京的冬天那么冷，你不一定能适应。”妈妈说：“孩子，你爸爸说得对。你一个人住，什么事都得自己做。你能行吗？”丽丽对他们说：“爸、妈，我对这份工作很满意。你们别为我担心，我已经23岁了，能自己照顾自己。如果有空儿，我就给你们打电话。”",
            "chunks": [
                "王丽丽是家里的独生女，今年7月大学毕业，在北京找到了工作。",
                "8月，她就要离开父母，去北京生活。",
                "丽丽出生在广州，她爸爸是一家公司的老板，妈妈是小学音乐老师。",
                "丽丽从出生到大学毕业一直和父母住在一起，还没有一个人生活过。",
                "爸爸说：“广州也有不少好公司，爸爸的公司就不错，为什么一定要去北京？北京的冬天那么冷，你不一定能适应。”",
                "妈妈说：“孩子，你爸爸说得对。你一个人住，什么事都得自己做。你能行吗？”",
                "丽丽对他们说：“爸、妈，我对这份工作很满意。你们别为我担心，我已经23岁了，能自己照顾自己。如果有空儿，我就给你们打电话。”",
            ],
        },
        {
            "track": "1-7",
            "title": "丽丽工作很努力",
            "images": ["divider-work.png", "vocab-images/压力.png", "divider-work.png", "vocab-images/开夜车.png", "divider-work.png"],
            "text": "丽丽在广州美术学院学的是设计，现在是广告公司的设计师。这是一家很有名的大公司，工作要求高，丽丽觉得压力很大。广告公司的工作很忙，从星期一到星期五，每天早上9点上班，下午6点下班。为了设计出让客户满意的广告，有时候还需要开夜车，很晚才能睡觉。但是丽丽很爱自己的工作，工作特别努力，她的设计越来越受客户欢迎，老板对她的工作也很满意。",
            "chunks": [
                "丽丽在广州美术学院学的是设计，现在是广告公司的设计师。",
                "这是一家很有名的大公司，工作要求高，丽丽觉得压力很大。",
                "广告公司的工作很忙，从星期一到星期五，每天早上9点上班，下午6点下班。",
                "为了设计出让客户满意的广告，有时候还需要开夜车，很晚才能睡觉。",
                "但是丽丽很爱自己的工作，工作特别努力，她的设计越来越受客户欢迎，老板对她的工作也很满意。",
            ],
        },
        {
            "track": "1-8",
            "title": "丽丽的爱好很多",
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
            "text": "有空儿的时候，丽丽喜欢自己做饭。她租的房子不大，可是厨房很好。她说，自己做饭不仅好吃，而且卫生，对身体更好。刚来北京的时候，她真的有点儿不适应，常常想家。现在，她来北京已经半年多了，生活和工作都慢慢适应了，也交上了新朋友。她最好的朋友是小明、小兰。放假的时候，他们常常一起做饭。丽丽做的饭越来越好吃，朋友们最爱吃她做的烧茄子和糖醋鱼。春节的时候丽丽上班的公司放7天假，她打算回广州，要给爸爸妈妈做几个好吃的菜。除了做饭，丽丽还喜欢拍照片。因为她是学设计的，所以她拍的照片很漂亮。她说，拍照片对她的设计工作有帮助。",
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
        },
    ]
    title_images = [ASSET_ROOT / "divider-family.png", ASSET_ROOT / "divider-work.png", ASSET_ROOT / "divider-hobby.png"]
    title_accents = [TEAL, CORAL, PURPLE]
    for idx, (entry, title_image, accent) in enumerate(zip(short_texts, title_images, title_accents), start=1):
        track = str(entry["track"])
        section = build_title(f"听说短文（{idx}）", str(entry["title"]), title_image, accent, f"{track}-title")
        chunks = list(entry["chunks"])
        image_specs = list(entry["images"])
        if len(chunks) != len(image_specs):
            raise ValueError(f"short text visual count mismatch for {track}")
        cards: list[Path] = []
        for i, (chunk, image_spec) in enumerate(zip(chunks, image_specs), start=1):
            image_path = ASSET_ROOT / image_spec if "/" in image_spec else ASSET_ROOT / image_spec
            cards.append(make_narration_card(image_path, chunk, f"{i}/{len(chunks)}", f"{track}-narration-{i:02d}"))
        durations = proportional_durations(audio_durations[track], chunks)
        track_path, evidence = build_track(track, cards, AUDIO_ROOT / f"{track}.mp3", durations)
        sequence_parts.extend([section, track_path])
        tracks.append({"track": track, "kind": "short_text", "title": entry["title"], "audio": str((AUDIO_ROOT / f"{track}.mp3").relative_to(ROOT)), "visual_mode": "single_narrator_caption", "segments": evidence, "output": str(track_path.relative_to(ROOT))})

    end = build_title("第一课听力结束", "丽丽的家庭、工作和爱好", ASSET_ROOT / "lesson-01-cover-family-work-hobby.png", TEAL, "99-end", 3.0)
    all_parts = sequence_parts + [end]
    concat_muxed(all_parts, VIDEO)

    duration = ffprobe_duration(VIDEO)
    manifest = {
        "schema_version": "lesson-listening-video-draft-v1",
        "lesson_key": "boya-quasi-intermediate-i:lesson-01",
        "offering_id": "2026-fall",
        "title": "第一课听力动画",
        "status": "draft_not_approved",
        "output": str(VIDEO.relative_to(ROOT)),
        "duration_seconds": round(duration, 3),
        "resolution": f"{WIDTH}x{HEIGHT}",
        "frame_rate": FPS,
        "audio_policy": "使用当前项目中的1-1至1-8 MP3；未重新配音。",
        "visual_policy": {
            "true_false": "只显示相关图片，不显示句子文字。",
            "dialogues": "画面显示两人对话字幕。",
            "sentence_qa": "显示听到的句子和问题，不显示答案。",
            "short_texts": "使用同一视觉风格的单人旁白卡片与字幕。",
        },
        "source_files": {
            "source_extraction": str(SOURCE_JSON.relative_to(ROOT)),
            "canonical_source": str(CANONICAL_JSON.relative_to(ROOT)),
            "audio_root": str(AUDIO_ROOT.relative_to(ROOT)),
        },
        "tracks": tracks,
        "checks": {
            "file_exists": VIDEO.is_file(),
            "sha256": sha256(VIDEO),
            "audio_semantic_review": "pending_teacher_listening",
            "publisher_mapping_1_7_1_8": "pending",
            "powerpoint_rehearsal": "not_applicable",
        },
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"video": str(VIDEO), "manifest": str(MANIFEST), "duration_seconds": round(duration, 3), "sha256": manifest["checks"]["sha256"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
