"""Assign real IISH districts to the active March 1921 province reconstruction."""

from __future__ import annotations

import geopandas as gpd

from _common import (
    BUILD,
    DISTRICTS_SOURCE,
    RULES_PATH,
    ensure_directories,
    read_json,
    require_file,
)

TARGET_DATE = "1921-03-01"


def is_active(rule) -> bool:
    valid_from = rule.get("validFrom", rule["effectiveDate"])
    valid_until = rule.get("validUntil")
    return valid_from <= TARGET_DATE and (valid_until is None or TARGET_DATE <= valid_until)


def main() -> None:
    ensure_directories()
    districts = gpd.read_file(
        require_file(DISTRICTS_SOURCE, "Run scripts/map/download_sources.py first.")
    )
    districts["Distr_ID"] = districts["Distr_ID"].astype(int)
    districts["Gub_ID"] = districts["Gub_ID"].astype(str)
    assignments: dict[int, dict] = {}
    duplicates: dict[int, list[str]] = {}
    for rule in filter(is_active, read_json(RULES_PATH)["rules"]):
        selected_ids: set[int] = set()
        for feature_id in rule["inputFeatureIds"]:
            level, raw_value = feature_id.split(":", 1)
            if level == "province":
                selected_ids.update(
                    int(value) for value in districts.loc[districts.Gub_ID == raw_value, "Distr_ID"]
                )
            elif level == "district":
                selected_ids.add(int(raw_value))
        for district_id in selected_ids:
            if district_id in assignments:
                duplicates.setdefault(district_id, [assignments[district_id]["provinceId"]]).append(
                    rule["outputProvinceId"]
                )
            assignments[district_id] = {
                "provinceId": rule["outputProvinceId"],
                "strategicRegionId": rule["strategicRegionId"],
                "formalGovernmentId": rule["formalGovernmentId"],
                "provinceConfidence": rule["confidence"],
            }
    if duplicates:
        raise SystemExit(f"Districts assigned to multiple active provinces: {duplicates}")
    selected = districts[districts.Distr_ID.isin(assignments)].copy()
    selected["id"] = selected.Distr_ID.map(lambda value: f"iish-district-{value}")
    selected["provinceId"] = selected.Distr_ID.map(
        lambda value: assignments[int(value)]["provinceId"]
    )
    selected["strategicRegionId"] = selected.Distr_ID.map(
        lambda value: assignments[int(value)]["strategicRegionId"]
    )
    selected["formalGovernmentId"] = selected.Distr_ID.map(
        lambda value: assignments[int(value)]["formalGovernmentId"]
    )
    selected["confidence"] = selected.Distr_ID.map(
        lambda value: assignments[int(value)]["provinceConfidence"]
    )
    selected["sourceIds"] = '["iish-ristat-1897-gis-v3.3"]'
    selected = selected.rename(columns={"Name_ENG": "name1921", "Name_RU": "nameRussian"})
    columns = [
        "id",
        "name1921",
        "nameRussian",
        "provinceId",
        "strategicRegionId",
        "formalGovernmentId",
        "confidence",
        "sourceIds",
        "Distr_ID",
        "Gub_ID",
        "geometry",
    ]
    selected = selected[columns]
    output = BUILD / "districts-1921.gpkg"
    geojson = BUILD / "districts-1921.geo.json"
    output.unlink(missing_ok=True)
    geojson.unlink(missing_ok=True)
    selected.to_file(output, layer="districts", driver="GPKG")
    selected.to_file(geojson, driver="GeoJSON")
    print(f"assigned {len(selected)} real districts to active March 1921 provinces")


if __name__ == "__main__":
    main()
