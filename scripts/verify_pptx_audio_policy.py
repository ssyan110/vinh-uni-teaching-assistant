"""Read-only plain-audio-reference package check; never proves external playback."""
import argparse
import re
import zipfile
from xml.etree import ElementTree as ET


def verify(path):
    failures = []
    with zipfile.ZipFile(path) as package:
        for name in package.namelist():
            if re.search(r"\.(mp3|wav|m4a|aac|ogg|wma)$", name, re.I):
                failures.append(f"embedded audio: {name}")
            if not name.endswith((".xml", ".rels")):
                continue
            root = ET.fromstring(package.read(name))
            for element in root.iter():
                tag = element.tag.rsplit("}", 1)[-1]
                if tag in {"audio", "audioFile", "wavAudioFile", "snd", "sndAc"}:
                    failures.append(f"audio element {tag}: {name}")
                if tag == "Relationship" and (element.get("Type", "").endswith(("/audio", "/media")) or re.search(r"\.(mp3|wav|m4a|aac|ogg)(?:[?#]|$)", element.get("Target", ""), re.I)):
                    failures.append(f"playable audio relationship: {name}")
                if tag in {"hlinkClick", "hlinkMouseOver"} and "media" in element.get("action", "").lower():
                    failures.append(f"playable media action: {name}")
    return failures


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path")
    args = parser.parse_args()
    errors = verify(args.path)
    print("\n".join(errors) if errors else "plain audio package policy: passed; external playback not verified")
    raise SystemExit(bool(errors))
