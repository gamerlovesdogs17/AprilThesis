"""Build geographic river and historically routed railway layers, clipped to territory."""

from __future__ import annotations

import json

import geopandas as gpd
import pandas as pd
from shapely.geometry import LineString
from shapely.ops import unary_union

from _common import (
    BUILD,
    MOSKVA_RIVER_SOURCE,
    RIVERS_SOURCE,
    ensure_directories,
    read_json,
    require_file,
)

TARGET_DATE = "1921-03-01"

RAILWAYS = [
    {
        "id": "trans-siberian-main",
        "name": "Trans-Siberian Railway",
        "importance": 1,
        "validFrom": "1916-10",
        "coordinates": [
            (37.62, 55.75),
            (40.41, 56.13),
            (44.00, 56.33),
            (49.67, 58.60),
            (56.23, 58.01),
            (60.60, 56.84),
            (65.53, 57.15),
            (73.37, 54.99),
            (82.92, 55.03),
            (92.87, 56.01),
            (104.28, 52.29),
            (113.50, 52.03),
            (124.74, 51.99),
            (127.53, 50.26),
            (135.07, 48.48),
            (131.89, 43.12),
        ],
    },
    {
        "id": "petrograd-moscow-main",
        "name": "Petrograd-Moscow Railway",
        "importance": 1,
        "validFrom": "1851-01",
        "coordinates": [
            (30.32, 59.94),
            (31.27, 58.52),
            (33.50, 57.97),
            (34.36, 57.58),
            (36.20, 56.86),
            (37.62, 55.75),
        ],
    },
    {
        "id": "murmansk-railway",
        "name": "Murmansk Railway",
        "importance": 1,
        "validFrom": "1917-01",
        "coordinates": [
            (30.32, 59.94),
            (32.34, 59.93),
            (34.36, 61.79),
            (34.59, 64.95),
            (34.57, 67.16),
            (33.08, 68.97),
        ],
    },
    {
        "id": "moscow-western",
        "name": "Moscow-Brest Railway",
        "importance": 2,
        "validFrom": "1871-01",
        "coordinates": [
            (37.62, 55.75),
            (36.03, 55.51),
            (32.05, 54.78),
            (30.42, 54.51),
            (27.56, 53.90),
            (23.69, 52.10),
        ],
    },
    {
        "id": "moscow-southern",
        "name": "Moscow-Kursk-Donbas Railway",
        "importance": 1,
        "validFrom": "1869-01",
        "coordinates": [
            (37.62, 55.75),
            (37.62, 54.20),
            (36.07, 52.97),
            (36.19, 51.74),
            (36.59, 50.60),
            (36.23, 49.99),
            (37.80, 48.10),
            (39.70, 47.24),
        ],
    },
    {
        "id": "north-caucasus-main",
        "name": "North Caucasus and Transcaucasus Railway",
        "importance": 1,
        "validFrom": "1900-01",
        "coordinates": [
            (39.70, 47.24),
            (40.12, 45.85),
            (41.12, 44.99),
            (44.68, 43.02),
            (44.79, 41.72),
            (46.37, 41.64),
            (49.87, 40.41),
        ],
    },
    {
        "id": "tiflis-yerevan",
        "name": "Tiflis-Alexandropol-Erivan Railway",
        "importance": 2,
        "validFrom": "1902-01",
        "coordinates": [(44.79, 41.72), (43.85, 40.79), (44.51, 40.18)],
    },
    {
        "id": "ukraine-east-west",
        "name": "Kiev-Poltava-Kharkov Railway",
        "importance": 1,
        "validFrom": "1901-01",
        "coordinates": [(30.52, 50.45), (34.55, 49.59), (36.23, 49.99)],
    },
    {
        "id": "ukraine-southwestern",
        "name": "Southwestern Railway",
        "importance": 1,
        "validFrom": "1870-01",
        "coordinates": [
            (30.52, 50.45),
            (29.25, 49.23),
            (28.10, 49.04),
            (29.62, 47.75),
            (30.73, 46.48),
        ],
    },
    {
        "id": "orenburg-tashkent",
        "name": "Orenburg-Tashkent Railway",
        "importance": 1,
        "validFrom": "1906-01",
        "coordinates": [
            (50.10, 53.20),
            (55.10, 51.77),
            (57.17, 50.28),
            (61.00, 46.80),
            (65.50, 44.85),
            (69.24, 41.30),
        ],
    },
]


def line_parts(geometry):
    if geometry.is_empty:
        return []
    if geometry.geom_type == "LineString":
        return [geometry]
    if geometry.geom_type == "MultiLineString":
        return list(geometry.geoms)
    if geometry.geom_type == "GeometryCollection":
        return [part for part in geometry.geoms if part.geom_type == "LineString"]
    return []


def main() -> None:
    ensure_directories()
    provinces = gpd.read_file(
        require_file(
            BUILD / "provinces-1921.gpkg",
            "Run scripts/map/reconstruct_1921_provinces.py first.",
        )
    )
    active = provinces[
        (provinces.geographicValidFrom <= TARGET_DATE)
        & (
            provinces.geographicValidUntil.isna()
            | (provinces.geographicValidUntil >= TARGET_DATE)
        )
    ]
    territorial_mask = unary_union(active.geometry)

    def clip_to_provinces(geometry):
        """Yield province-attributed line parts from real polygon intersections."""
        for _, province in active.iterrows():
            if not geometry.intersects(province.geometry):
                continue
            for part in line_parts(geometry.intersection(province.geometry)):
                if part.length > 1e-7:
                    yield province.id, part

    river_source = gpd.read_file(
        require_file(RIVERS_SOURCE, "Run scripts/map/download_sources.py first.")
    ).to_crs("EPSG:4326")
    river_rows = []
    for index, row in river_source.iterrows():
        clipped = row.geometry.intersection(territorial_mask)
        for part_index, (province_id, part) in enumerate(clip_to_provinces(clipped)):
            name = row.get("name") or row.get("name_en") or "Major river"
            river_rows.append(
                {
                    "id": f"natural-earth-river-{index}-{part_index}",
                    "name": name,
                    "provinceId": province_id,
                    "importance": int(row.get("scalerank", 8) or 8),
                    "validFrom": "1921-01",
                    "sourceIds": '["natural-earth-rivers-5.0.0"]',
                    "geometry": part,
                }
            )

    moskva_source = read_json(
        require_file(
            MOSKVA_RIVER_SOURCE,
            "Run scripts/map/download_sources.py to obtain the dated OSM extract.",
        )
    )
    for element in moskva_source.get("elements", []):
        coordinates = [
            (point["lon"], point["lat"])
            for point in element.get("geometry", [])
            if "lon" in point and "lat" in point
        ]
        if len(coordinates) < 2:
            continue
        line = LineString(coordinates).intersection(territorial_mask)
        for part_index, (province_id, part) in enumerate(clip_to_provinces(line)):
            river_rows.append(
                {
                    "id": f"openstreetmap-moskva-{element['id']}-{part_index}",
                    "name": "Moskva River",
                    "provinceId": province_id,
                    "importance": 4,
                    "validFrom": "1921-01",
                    "historicalStatus": (
                        "documented river; modern OSM centerline used as a positional reference"
                    ),
                    "sourceIds": '["openstreetmap-moskva-river-2026-07-13"]',
                    "geometry": part,
                }
            )
    rivers = gpd.GeoDataFrame(pd.DataFrame(river_rows), geometry="geometry", crs="EPSG:4326")

    railway_rows = []
    for railway in RAILWAYS:
        clipped = LineString(railway["coordinates"]).intersection(territorial_mask)
        for part_index, (province_id, part) in enumerate(clip_to_provinces(clipped)):
            railway_rows.append(
                {
                    "id": f"{railway['id']}-{part_index}",
                    "routeId": railway["id"],
                    "name": railway["name"],
                    "provinceId": province_id,
                    "importance": railway["importance"],
                    "validFrom": railway["validFrom"],
                    "historicalStatus": "documented trunk route; small-scale line digitization",
                    "sourceIds": json.dumps(
                        ["troitsky-nkvd-1921", "loc-rsfsr-1922", "rail-network-1921"]
                    ),
                    "geometry": part,
                }
            )
    railways = gpd.GeoDataFrame(
        pd.DataFrame(railway_rows), geometry="geometry", crs="EPSG:4326"
    )

    for name, frame in (("rivers", rivers), ("railways", railways)):
        gpkg = BUILD / f"{name}-1921.gpkg"
        geojson = BUILD / f"{name}-1921.geo.json"
        gpkg.unlink(missing_ok=True)
        geojson.unlink(missing_ok=True)
        frame.to_file(gpkg, layer=name, driver="GPKG")
        frame.to_file(geojson, driver="GeoJSON")
    print(f"built {len(rivers)} real river segments and {len(railways)} railway segments")


if __name__ == "__main__":
    main()
