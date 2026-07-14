"""Dissolve reconstructed province features into formal-government surfaces."""

from __future__ import annotations

import json

import geopandas as gpd
import pandas as pd

from _common import BUILD, ensure_directories, require_file

CAMPAIGN_MONTHS = [f"1921-{month:02d}" for month in range(3, 9)]


def administration_for_month(value: str, month: str) -> dict:
    periods = json.loads(value)
    for period in periods:
        valid_from = period["validFrom"][:7]
        valid_until = period.get("validUntil")
        if valid_from <= month and (valid_until is None or month <= valid_until[:7]):
            return period
    raise SystemExit(f"No administrative period found for {month}.")


def main() -> None:
    ensure_directories()
    provinces = gpd.read_file(
        require_file(
            BUILD / "provinces-1921.gpkg",
            "Run scripts/map/reconstruct_1921_provinces.py first.",
        )
    )
    snapshots = []
    for month in CAMPAIGN_MONTHS:
        active = provinces[
            (provinces.geographicValidFrom.str[:7] <= month)
            & (
                provinces.geographicValidUntil.isna()
                | (provinces.geographicValidUntil.str[:7] >= month)
            )
        ].copy()
        active["formalGovernmentId"] = active.administrativePeriods.map(
            lambda value: administration_for_month(value, month)["formalGovernmentId"]
        )
        dissolved = active.dissolve(by="formalGovernmentId", as_index=False)
        dissolved["governmentId"] = dissolved.formalGovernmentId
        dissolved["id"] = dissolved.governmentId.map(lambda value: f"{value}-{month}")
        dissolved["validFrom"] = month
        dissolved["validUntil"] = month
        dissolved["sourceIds"] = '["iish-ristat-1897-gis-v3.3","province-changes-1921"]'
        snapshots.append(dissolved[["id", "governmentId", "validFrom", "validUntil", "sourceIds", "geometry"]])
    dissolved = gpd.GeoDataFrame(
        pd.concat(snapshots, ignore_index=True),
        geometry="geometry",
        crs=provinces.crs,
    )
    output = BUILD / "formal-governments-1921.gpkg"
    output.unlink(missing_ok=True)
    dissolved.to_file(output, layer="formal_governments", driver="GPKG")
    print(f"built {len(dissolved)} monthly formal-government surfaces by province dissolve")


if __name__ == "__main__":
    main()
