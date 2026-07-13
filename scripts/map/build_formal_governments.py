"""Dissolve reconstructed province features into formal-government surfaces."""

from __future__ import annotations

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
    dissolved = active.dissolve(by="formalGovernmentId", as_index=False)
    dissolved["id"] = dissolved.formalGovernmentId
    dissolved["validFrom"] = TARGET_DATE
    dissolved["sourceIds"] = '["iish-ristat-1897-gis-v3.3","province-changes-1921"]'
    dissolved = dissolved[["id", "validFrom", "sourceIds", "geometry"]]
    output = BUILD / "formal-governments-1921.gpkg"
    output.unlink(missing_ok=True)
    dissolved.to_file(output, layer="formal_governments", driver="GPKG")
    print(f"built {len(dissolved)} formal-government surfaces by province dissolve")


if __name__ == "__main__":
    main()
