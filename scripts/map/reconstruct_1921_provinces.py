"""Reconstruct March 1921 provinces by unioning real IISH source features."""

from __future__ import annotations

import json

import geopandas as gpd
import pandas as pd
from shapely import make_valid
from shapely.ops import unary_union

from _common import (
    BUILD,
    DISTRICTS_SOURCE,
    PROVINCES_SOURCE,
    RULES_PATH,
    ensure_directories,
    read_json,
    require_file,
)


def load_sources():
    provinces = gpd.read_file(
        require_file(PROVINCES_SOURCE, "Run scripts/map/download_sources.py first.")
    )
    districts = gpd.read_file(
        require_file(DISTRICTS_SOURCE, "Run scripts/map/download_sources.py first.")
    )
    provinces["Gub_ID"] = provinces["Gub_ID"].astype(str)
    districts["Distr_ID"] = districts["Distr_ID"].astype(int)
    return provinces, districts


def geometry_for_rule(rule, provinces, districts):
    geometries = []
    for feature_id in rule["inputFeatureIds"]:
        level, raw_value = feature_id.split(":", 1)
        if level == "province":
            matches = provinces[provinces.Gub_ID == raw_value]
        elif level == "district":
            matches = districts[districts.Distr_ID == int(raw_value)]
        else:
            raise SystemExit(f"Unknown source feature level in {feature_id}")
        if len(matches) != 1:
            raise SystemExit(
                f"Rule {rule['id']} expected one source feature for {feature_id}; found {len(matches)}"
            )
        geometries.append(matches.geometry.iloc[0])
    geometry = make_valid(unary_union(geometries))
    if geometry.is_empty or geometry.geom_type not in {"Polygon", "MultiPolygon"}:
        raise SystemExit(
            f"Rule {rule['id']} produced unusable geometry type {geometry.geom_type}"
        )
    return geometry


def reconstruct():
    ensure_directories()
    provinces, districts = load_sources()
    rules_document = read_json(RULES_PATH)
    rows = []
    for rule in rules_document["rules"]:
        rows.append(
            {
                "id": rule["outputProvinceId"],
                "name1921": rule["name1921"],
                "alternateNames": json.dumps(rule.get("alternateNames", []), ensure_ascii=False),
                "formalGovernmentId": rule["formalGovernmentId"],
                "administrativeType": rule["administrativeType"],
                "strategicRegionId": rule["strategicRegionId"],
                "capitalCityId": rule.get("capitalCityId"),
                "validFrom": rule.get("validFrom", rule["effectiveDate"]),
                "validUntil": rule.get("validUntil"),
                "sourceIds": json.dumps(rule["sourceIds"], ensure_ascii=False),
                "sourceFeatureIds": json.dumps(rule["inputFeatureIds"]),
                "reconstructionOperation": rule["operation"],
                "confidence": rule["confidence"],
                "notes": rule["notes"],
                "selectable": rule.get("selectable", True),
                "geometry": geometry_for_rule(rule, provinces, districts),
            }
        )
    frame = gpd.GeoDataFrame(pd.DataFrame(rows), geometry="geometry", crs="EPSG:4326")
    if frame.id.duplicated().any():
        raise SystemExit("Duplicate reconstructed province IDs detected.")
    if (~frame.geometry.is_valid).any():
        invalid = frame.loc[~frame.geometry.is_valid, "id"].tolist()
        raise SystemExit(f"Invalid reconstructed province geometry: {invalid}")

    # Record adjacency from the unsimplified shared source geometry.  The web
    # client can then expose true neighboring provinces without guessing from
    # strategic-region membership or bounding boxes.
    neighbors: dict[str, list[str]] = {province_id: [] for province_id in frame.id}
    for left_index, left in frame.iterrows():
        for right_index in frame.sindex.query(left.geometry, predicate="intersects"):
            if right_index <= left_index:
                continue
            right = frame.iloc[right_index]
            shared_boundary = left.geometry.boundary.intersection(right.geometry.boundary)
            if shared_boundary.is_empty or shared_boundary.length <= 1e-7:
                continue
            neighbors[left.id].append(right.id)
            neighbors[right.id].append(left.id)
    frame["neighborIds"] = frame.id.map(
        lambda province_id: json.dumps(sorted(neighbors[province_id]))
    )
    return frame


def main() -> None:
    frame = reconstruct()
    gpkg = BUILD / "provinces-1921.gpkg"
    geojson = BUILD / "provinces-1921.geo.json"
    gpkg.unlink(missing_ok=True)
    geojson.unlink(missing_ok=True)
    frame.to_file(gpkg, layer="provinces", driver="GPKG")
    frame.to_file(geojson, driver="GeoJSON")
    print(f"reconstructed {len(frame)} province records from real source features")


if __name__ == "__main__":
    main()
