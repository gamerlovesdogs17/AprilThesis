"""Export deterministic shared-topology and GeoJSON assets for offline browser play."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import geopandas as gpd
from shapely.geometry import Point
from topojson import Topology

from _common import BUILD, MAP_DATA, ensure_directories, read_json, require_file, write_json


def normalize_properties(frame: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    frame = frame.copy()
    for column in (
        "alternateNames",
        "sourceIds",
        "sourceFeatureIds",
        "neighborIds",
        "generatedFromProvinceIds",
    ):
        if column in frame.columns:
            frame[column] = frame[column].map(
                lambda value: json.loads(value)
                if isinstance(value, str) and value.startswith("[")
                else ([] if value is None else value)
            )
    for column in frame.columns:
        if column == "geometry":
            continue
        frame[column] = frame[column].map(
            lambda value: None
            if value is None or (isinstance(value, float) and value != value)
            else value
        )
    return frame


def topology_for(frame: gpd.GeoDataFrame, object_name: str, epsilon: float | None):
    topology = Topology(
        json.loads(frame.to_json(drop_id=True)),
        object_name=object_name,
        prequantize=100000,
        prevent_oversimplify=True,
    )
    return topology.toposimplify(epsilon) if epsilon else topology


def export_topology(
    frame: gpd.GeoDataFrame,
    object_name: str,
    filename: str,
    epsilon: float | None,
):
    topology = topology_for(frame, object_name, epsilon)
    write_json(MAP_DATA / filename, topology.to_dict(), compact=True)
    return topology


def write_feature_collection(path: Path, features: list[dict]) -> None:
    write_json(path, {"type": "FeatureCollection", "features": features}, compact=True)


def point_features(records: list[dict]) -> list[dict]:
    return [
        {
            "type": "Feature",
            "id": record["id"],
            "properties": record,
            "geometry": {
                "type": "Point",
                "coordinates": [record["longitude"], record["latitude"]],
            },
        }
        for record in records
    ]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    ensure_directories()
    provinces = normalize_properties(
        gpd.read_file(
            require_file(BUILD / "provinces-1921.gpkg", "Run reconstruction first.")
        )
    )
    districts = normalize_properties(
        gpd.read_file(
            require_file(BUILD / "districts-1921.gpkg", "Run reconstruction first.")
        )
    )
    formal = normalize_properties(
        gpd.read_file(
            require_file(BUILD / "formal-governments-1921.gpkg", "Run dissolve first.")
        )
    )
    strategic = normalize_properties(
        gpd.read_file(
            require_file(BUILD / "strategic-aggregates-1921.gpkg", "Run dissolve first.")
        )
    )
    railways = normalize_properties(
        gpd.read_file(require_file(BUILD / "railways-1921.gpkg", "Run transport build first."))
    )
    rivers = normalize_properties(
        gpd.read_file(require_file(BUILD / "rivers-1921.gpkg", "Run transport build first."))
    )

    province_detail = export_topology(
        provinces, "provinces", "provinces-1921.topo.json", None
    )
    province_medium = export_topology(
        provinces, "provinces", "provinces-1921.medium.topo.json", 0.03
    )
    export_topology(
        provinces, "provinces", "provinces-1921.national.topo.json", 0.08
    )
    district_topology = export_topology(
        districts, "districts", "districts-1921.topo.json", 0.015
    )
    formal_topology = export_topology(
        formal, "formal_governments", "formal-governments-1921.topo.json", 0.03
    )
    strategic_topology = export_topology(
        strategic, "strategic_aggregates", "strategic-aggregates-1921.topo.json", 0.03
    )

    write_json(
        MAP_DATA / "provinces-1921.geo.json",
        json.loads(province_medium.to_geojson()),
        compact=True,
    )
    write_json(
        MAP_DATA / "provinces-1921.detail.geo.json",
        json.loads(province_detail.to_geojson()),
        compact=True,
    )
    write_json(
        MAP_DATA / "districts-1921.geo.json",
        json.loads(district_topology.to_geojson()),
        compact=True,
    )
    write_json(
        MAP_DATA / "formal-governments-1921.geo.json",
        json.loads(formal_topology.to_geojson()),
        compact=True,
    )
    write_json(
        MAP_DATA / "strategic-aggregates-1921.geo.json",
        json.loads(strategic_topology.to_geojson()),
        compact=True,
    )
    for name, frame in (("railways-1921.geo.json", railways), ("rivers.geo.json", rivers)):
        write_json(MAP_DATA / name, json.loads(frame.to_json(drop_id=True)), compact=True)

    cities = read_json(MAP_DATA / "cities-1921-source.json")["cities"]
    sites = read_json(MAP_DATA / "sites-1921-source.json")["sites"]
    write_feature_collection(MAP_DATA / "cities-1921.geo.json", point_features(cities))
    write_feature_collection(MAP_DATA / "sites-1921.geo.json", point_features(sites))

    output_files = sorted(
        path
        for path in MAP_DATA.glob("*.json")
        if path.name not in {"topology-manifest.json"}
    )
    manifest = {
        "schemaVersion": 1,
        "targetDate": "1921-03-01",
        "crs": "EPSG:4326",
        "simplifications": {
            "detail": {"epsilonDegrees": 0, "quantization": 100000},
            "theater": {"epsilonDegrees": 0.03, "quantization": 100000},
            "national": {"epsilonDegrees": 0.08, "quantization": 100000},
        },
        "files": [
            {
                "path": path.name,
                "bytes": path.stat().st_size,
                "sha256": sha256(path),
            }
            for path in output_files
        ],
    }
    write_json(MAP_DATA / "topology-manifest.json", manifest)
    print(
        f"exported {len(output_files)} browser assets with shared province/district topology"
    )


if __name__ == "__main__":
    main()
