#!/usr/bin/env python3
"""Render all Lesson 1 activity DOCX files as PDFs with embedded CJK fonts."""

from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ACTIVITY_ROOT = PROJECT_ROOT / "output/boya-intermediate/lesson-01/activities"
FONTCONFIG = PROJECT_ROOT / "scripts/lesson-01-fontconfig.conf"
LIBREOFFICE = (
    Path("/Users/ssyan110/.cache/codex-runtimes/codex-primary-runtime/dependencies")
    / "native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/MacOS/soffice"
)


def pdf_target(docx_path: Path) -> Path:
    return docx_path.with_suffix(".pdf")


def render_one(docx_path: Path) -> Path:
    target = pdf_target(docx_path)
    with tempfile.TemporaryDirectory(prefix="boya-lesson-01-pdf-") as temp_dir:
        temp_root = Path(temp_dir)
        output_dir = temp_root / "output"
        profile_dir = temp_root / "lo-profile"
        output_dir.mkdir()
        profile_dir.mkdir()
        env = os.environ.copy()
        env["FONTCONFIG_FILE"] = str(FONTCONFIG)
        command = [
            str(LIBREOFFICE),
            f"-env:UserInstallation={profile_dir.as_uri()}",
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            str(output_dir),
            str(docx_path),
        ]
        subprocess.run(command, check=True, env=env, capture_output=True, text=True)
        rendered = output_dir / f"{docx_path.stem}.pdf"
        if not rendered.exists():
            raise FileNotFoundError(f"LibreOffice did not create {rendered}")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(rendered.read_bytes())
    return target


def render_all() -> list[Path]:
    raise RuntimeError(
        "Activity-card PDF rendering is retired. Activity cards are delivered as editable DOCX only."
    )


def main() -> None:
    raise SystemExit(
        "Activity-card PDF rendering is retired. Activity cards are delivered as editable DOCX only."
    )


if __name__ == "__main__":
    main()
