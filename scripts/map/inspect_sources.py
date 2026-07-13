"""Inspect source schema and write the canonical source-feature inventory."""

from __future__ import annotations

import geopandas as gpd

from _common import (
    DISTRICTS_SOURCE,
    MAP_DATA,
    PROVINCES_SOURCE,
    ensure_directories,
    require_file,
    source_feature_id,
    write_json,
)


def main() -> None:
    ensure_directories()
    provinces = gpd.read_file(
        require_file(PROVINCES_SOURCE, "Run scripts/map/download_sources.py first.")
    )
    districts = gpd.read_file(
        require_file(DISTRICTS_SOURCE, "Run scripts/map/download_sources.py first.")
    )
    if str(provinces.crs).upper() != "EPSG:4326" or str(districts.crs).upper() != "EPSG:4326":
        raise SystemExit("IISH source CRS changed; expected EPSG:4326 for both layers.")

    province_records = [
        {
            "featureId": source_feature_id("province", row.Gub_ID),
            "gubId": str(row.Gub_ID),
            "nameEnglish": row.prov_ENG,
            "nameRussian": row.prov_RU,
            "ristatId": row.RISTAT_ID if isinstance(row.RISTAT_ID, str) else None,
            "geometryType": row.geometry.geom_type,
        }
        for row in provinces.sort_values("Gub_ID", key=lambda values: values.astype(str)).itertuples()
    ]
    district_records = [
        {
            "featureId": source_feature_id("district", row.Distr_ID),
            "districtId": int(row.Distr_ID),
            "parentGubId": str(row.Gub_ID),
            "nameEnglish": row.Name_ENG,
            "nameRussian": row.Name_RU,
            "parentEnglish": row.prov_ENG,
            "ristatId": row.RISTAT_ID if isinstance(row.RISTAT_ID, str) else None,
            "geometryType": row.geometry.geom_type,
        }
        for row in districts.sort_values("Distr_ID").itertuples()
    ]
    inventory = {
        "sourceId": "iish-ristat-1897-gis-v3.3",
        "crs": "EPSG:4326",
        "provinceCount": len(province_records),
        "districtCount": len(district_records),
        "provinceInvalidGeometryCount": int((~provinces.geometry.is_valid).sum()),
        "districtInvalidGeometryCount": int((~districts.geometry.is_valid).sum()),
        "bounds": [float(value) for value in districts.total_bounds],
        "provinces": province_records,
        "districts": district_records,
    }
    write_json(MAP_DATA / "source-inventory-1897.json", inventory)
    print(
        f"inspected {len(province_records)} provinces and {len(district_records)} districts; "
        f"invalid geometries: {inventory['provinceInvalidGeometryCount']} / "
        f"{inventory['districtInvalidGeometryCount']}"
    )


if __name__ == "__main__":
    main()
