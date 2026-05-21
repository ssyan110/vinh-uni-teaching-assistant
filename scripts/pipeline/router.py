"""Lesson-type router for the AI teaching material pipeline.

Routes lesson content to the appropriate pipeline configuration based on
lesson type identifier or auto-detection from content structure.
"""

from __future__ import annotations

import logging
from pathlib import Path

from .detector import DetectionResult, detect_lesson_type
from .validator import ConfigValidationError, PipelineConfig, validate_all_configs, validate_config

logger = logging.getLogger(__name__)


class InvalidLessonType(Exception):
    """Raised when a lesson type identifier is not recognized."""

    def __init__(self, message: str, valid_types: list[str]) -> None:
        super().__init__(message)
        self.message = message
        self.valid_types = valid_types


class ConfigNotFound(Exception):
    """Raised when a pipeline config file cannot be located."""


class Router:
    """Lesson-type router that resolves content to a pipeline configuration.

    Scans a config directory for valid pipeline JSON configs and provides
    lookup by lesson type identifier or auto-detection from content.
    """

    def __init__(self, config_dir: Path) -> None:
        """Initialize the router by scanning and validating config files.

        Args:
            config_dir: Directory containing pipeline config JSON files.
                        Files matching *_schema.json are skipped.
        """
        self._configs: dict[str, PipelineConfig] = {}

        if not config_dir.is_dir():
            logger.warning("Config directory does not exist: %s", config_dir)
            return

        config_files = [
            f for f in config_dir.glob("*.json") if not f.name.endswith("_schema.json")
        ]

        for config_file in config_files:
            try:
                config = validate_config(config_file)
                self._configs[config.lesson_type] = config
                logger.debug("Loaded config: %s from %s", config.lesson_type, config_file.name)
            except ConfigValidationError as exc:
                logger.warning(
                    "Skipping invalid config %s: %s", config_file.name, exc
                )

    def available_types(self) -> list[str]:
        """Return sorted list of valid lesson type identifiers.

        Returns:
            Sorted list of lesson type strings that have valid configs.
        """
        return sorted(self._configs.keys())

    def resolve(
        self, lesson_type: str, content: list[dict] | None = None
    ) -> PipelineConfig:
        """Resolve a lesson type identifier to its pipeline configuration.

        Args:
            lesson_type: Lesson type identifier. Use "auto" to detect from
                         content. None or empty string defaults to "regular".
            content: Optional list of content records used for auto-detection.

        Returns:
            The matching PipelineConfig for the resolved lesson type.

        Raises:
            InvalidLessonType: If the lesson type is not recognized.
            ValueError: If lesson_type is "auto" but content is None.
        """
        # Default to "regular" if None or empty
        if not lesson_type:
            lesson_type = "regular"

        # Case-insensitive comparison
        lesson_type = lesson_type.lower()

        # Auto-detection mode
        if lesson_type == "auto":
            if content is None:
                raise ValueError("Content required for auto-detection")
            result: DetectionResult = detect_lesson_type(content)
            lesson_type = result.suggested_type

        # Lookup config
        if lesson_type not in self._configs:
            available = self.available_types()
            raise InvalidLessonType(
                f"Unknown lesson type '{lesson_type}'. "
                f"Available types: {', '.join(available)}",
                valid_types=available,
            )

        return self._configs[lesson_type]
