"""Generate the preserved 28 simulation aggregates solely by province dissolve."""

from __future__ import annotations

import json

import geopandas as gpd

from _common import BUILD, ensure_directories, require_file

TARGET_DATE = "1921-03-01"


def main() -> None:
    ensure_directories()
    provinces = gpd.read_file(
        require_file(
            BUILD / "provinces-1921.gpkg",
            "Run scripts/map/reconstruct_1921_provinces.py first.",
        )
    )
    active = provinces[
        (provinces.validFrom <= TARGET_DATE)
        & (provinces.validUntil.isna() | (provinces.validUntil >= TARGET_DATE))
    ].copy()
    dissolved = active.dissolve(by="strategicRegionId", as_index=False)
    dissolved["id"] = dissolved.strategicRegionId
    dissolved["generatedFromProvinceIds"] = dissolved.id.map(
        lambda aggregate_id: json.dumps(
            sorted(active.loc[active.strategicRegionId == aggregate_id, "id"].tolist())
        )
    )
    dissolved = dissolved[["id", "generatedFromProvinceIds", "geometry"]]
    output = BUILD / "strategic-aggregates-1921.gpkg"
    output.unlink(missing_ok=True)
    dissolved.to_file(output, layer="strategic_aggregates", driver="GPKG")
    print(f"built {len(dissolved)} strategic aggregates by province dissolve")


if __name__ == "__main__":
    main()
