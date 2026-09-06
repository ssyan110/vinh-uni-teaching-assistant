#!/usr/bin/env python3
"""Deprecated entry point for lesson 09 image generation.

The former SVG/vector renderer was removed after visual review. Use
``scripts/generate_lesson09_raster_assets.py`` for the finalized Boya-style
watercolor/colored-pencil raster asset pipeline.
"""

from __future__ import annotations


def main() -> None:
    raise RuntimeError(
        "Lesson 09 vector generation is disabled. "
        "Use scripts/generate_lesson09_raster_assets.py instead."
    )


if __name__ == "__main__":
    main()
