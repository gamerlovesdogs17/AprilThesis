"""Shared deterministic paths and GIS helpers for the Phase Six map build."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
MAP_DATA = ROOT / "packages" / "content" / "map-data"
SOURCE_CACHE = MAP_DATA / "source-cache"
IISH_CACHE = SOURCE_CACHE / "iish"
NATURAL_EARTH_CACHE = SOURCE_CACHE / "natural-earth"
OPENSTREETMAP_CACHE = SOURCE_CACHE / "openstreetmap"
BUILD = MAP_DATA / "build"
QA = ROOT / "docs" / "map-qa"

PROVINCES_SOURCE = IISH_CACHE / "provinces_1897.gpkg"
DISTRICTS_SOURCE = IISH_CACHE / "districts_1897.gpkg"
RIVERS_SOURCE = NATURAL_EARTH_CACHE / "ne_50m_rivers_lake_centerlines.geojson"
MOSKVA_RIVER_SOURCE = OPENSTREETMAP_CACHE / "openstreetmap-moskva-river-2026-07-13.json"
RULES_PATH = MAP_DATA / "province-changes-1921.json"


def require_file(path: Path, hint: str) -> Path:
    if not path.exists():
        raise SystemExit(f"Missing required file: {path}\n{hint}")
    return path


def ensure_directories() -> None:
    for directory in (
        MAP_DATA,
        IISH_CACHE,
        NATURAL_EARTH_CACHE,
        OPENSTREETMAP_CACHE,
        BUILD,
        QA,
    ):
        directory.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, value: Any, *, compact: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(
            value,
            handle,
            ensure_ascii=False,
            sort_keys=compact,
            separators=(",", ":") if compact else None,
            indent=None if compact else 2,
        )
        handle.write("\n")


def read_json(path: Path) -> Any:
    require_file(path, "Run the preceding Phase Six pipeline step first.")
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def source_feature_id(level: str, value: object) -> str:
    return f"{level}:{value}"
