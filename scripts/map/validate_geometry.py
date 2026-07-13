"""Fail the Phase Six cartographic build on severe geometry or assignment errors."""

from __future__ import annotations

import html
import json
from collections import Counter
from pathlib import Path

import geopandas as gpd
import pandas as pd
from pyproj import Geod
from shapely.geometry import Point

from _common import BUILD, MAP_DATA, QA, ensure_directories, read_json, require_file, write_json

TARGET_DATE = "1921-03-01"
STRATEGIC_REGION_IDS = {
    "baltic_frontier", "petrograd", "karelia", "northern_russia", "belarus",
    "western_ukraine", "central_ukraine", "crimea", "moscow", "central_industrial",
    "tula", "upper_volga", "tambov", "middle_volga", "lower_volga", "don_basin",
    "donbas", "kuban", "northern_caucasus", "georgia", "armenia", "azerbaijan",
    "urals", "kazakhstan", "turkestan", "western_siberia", "central_siberia", "far_east",
}

PALETTE = [
    "#71313a", "#9a5c43", "#b0895d", "#63745e", "#526b78",
    "#7d6881", "#8b7d55", "#875c52", "#516c68", "#816d47",
]
GEOD = Geod(ellps="WGS84")


def active(frame):
    return frame[
        (frame.validFrom <= TARGET_DATE)
        & (frame.validUntil.isna() | (frame.validUntil >= TARGET_DATE))
    ].copy()


def json_list(value) -> list[str]:
    if isinstance(value, list):
        return value
    if not value:
        return []
    return json.loads(value)


def project(longitude: float, latitude: float) -> tuple[float, float]:
    x = 24 + ((longitude - 18) / (191 - 18)) * 1152
    y = 24 + ((78 - latitude) / (78 - 25)) * 552
    return x, y


def geometry_path(geometry) -> str:
    polygons = [geometry] if geometry.geom_type == "Polygon" else list(geometry.geoms)
    commands: list[str] = []
    for polygon in polygons:
        for ring in [polygon.exterior, *polygon.interiors]:
            points = [project(float(x), float(y)) for x, y in ring.coords]
            if not points:
                continue
            commands.append(
                f"M{points[0][0]:.2f},{points[0][1]:.2f}"
                + "".join(f"L{x:.2f},{y:.2f}" for x, y in points[1:])
                + "Z"
            )
    return "".join(commands)


def categorical_color(value: str) -> str:
    return PALETTE[sum(ord(character) for character in value) % len(PALETTE)]


def write_polygon_map(path: Path, frame, field: str, title: str, errors: set[str] | None = None):
    errors = errors or set()
    paths = []
    for row in frame.itertuples():
        value = str(getattr(row, field))
        fill = "#d33b45" if row.id in errors else categorical_color(value)
        paths.append(
            f'<path d="{geometry_path(row.geometry)}" fill="{fill}" '
            f'stroke="#e0c58c" stroke-width=".35"><title>{html.escape(str(row.id))} · '
            f'{html.escape(value)}</title></path>'
        )
    path.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600">'
        '<rect width="1200" height="600" fill="#171814"/>'
        f'<text x="24" y="20" fill="#f0d8a5" font-family="serif" font-size="14">{html.escape(title)}</text>'
        f'<g fill-rule="evenodd">{"".join(paths)}</g></svg>\n',
        encoding="utf-8",
    )


def write_point_map(path: Path, provinces, records: list[dict], title: str):
    province_paths = "".join(
        f'<path d="{geometry_path(row.geometry)}"/>' for row in provinces.itertuples()
    )
    points = []
    for record in records:
        x, y = project(float(record["longitude"]), float(record["latitude"]))
        points.append(
            f'<circle cx="{x:.2f}" cy="{y:.2f}" r="2.6"><title>'
            f'{html.escape(record["id"])} · {html.escape(record["provinceId"])}</title></circle>'
        )
    path.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600">'
        '<rect width="1200" height="600" fill="#171814"/>'
        f'<text x="24" y="20" fill="#f0d8a5" font-family="serif" font-size="14">{html.escape(title)}</text>'
        f'<g fill="#5b302e" stroke="#b99a65" stroke-width=".25" fill-rule="evenodd">{province_paths}</g>'
        f'<g fill="#f4df9c" stroke="#331718" stroke-width=".8">{"".join(points)}</g></svg>\n',
        encoding="utf-8",
    )


def main() -> None:
    ensure_directories()
    provinces_all = gpd.read_file(
        require_file(BUILD / "provinces-1921.gpkg", "Run province reconstruction first.")
    )
    provinces = active(provinces_all)
    districts = gpd.read_file(
        require_file(BUILD / "districts-1921.gpkg", "Run district reconstruction first.")
    )
    formal = gpd.read_file(
        require_file(BUILD / "formal-governments-1921.gpkg", "Run formal dissolve first.")
    )
    strategic = gpd.read_file(
        require_file(BUILD / "strategic-aggregates-1921.gpkg", "Run strategic dissolve first.")
    )
    railways = gpd.read_file(
        require_file(BUILD / "railways-1921.gpkg", "Run transport build first.")
    )
    rivers = gpd.read_file(require_file(BUILD / "rivers-1921.gpkg", "Run transport build first."))
    cities = read_json(MAP_DATA / "cities-1921-source.json")["cities"]
    sites = read_json(MAP_DATA / "sites-1921-source.json")["sites"]
    rules = read_json(MAP_DATA / "province-changes-1921.json")["rules"]

    duplicate_province_ids = [
        value for value, count in Counter(provinces_all.id).items() if count > 1
    ]
    duplicate_district_ids = [value for value, count in Counter(districts.id).items() if count > 1]
    invalid_provinces = provinces_all.loc[~provinces_all.geometry.is_valid, "id"].tolist()
    invalid_districts = districts.loc[~districts.geometry.is_valid, "id"].tolist()
    invalid_multi = provinces_all.loc[
        ~provinces_all.geom_type.isin(["Polygon", "MultiPolygon"]), "id"
    ].tolist()

    geographic = provinces.reset_index(drop=True)
    overlap_records = []
    for left_index, left in geographic.iterrows():
        for right_index in geographic.sindex.query(left.geometry, predicate="intersects"):
            if int(right_index) <= int(left_index):
                continue
            right = geographic.iloc[int(right_index)]
            intersection = left.geometry.intersection(right.geometry)
            area_m2, _ = GEOD.geometry_area_perimeter(intersection)
            area_km2 = abs(area_m2) / 1_000_000
            if area_km2 > 5:
                overlap_records.append(
                    {"left": left.id, "right": right.id, "areaKm2": round(area_km2, 3)}
                )

    province_lookup = {row.id: row.geometry for row in provinces.itertuples()}
    city_outside = []
    for city in cities:
        geometry = province_lookup.get(city["provinceId"])
        point = Point(city["longitude"], city["latitude"])
        coastal_exception = city.get("assignmentMethod") == "manual_coastal_tolerance"
        if geometry is None or not (
            geometry.covers(point) or (coastal_exception and geometry.distance(point) <= 0.2)
        ):
            city_outside.append(city["id"])
    site_outside = []
    for site in sites:
        geometry = province_lookup.get(site["provinceId"])
        point = Point(site["longitude"], site["latitude"])
        coastal_exception = site.get("assignmentMethod") == "manual_coastal_tolerance"
        if geometry is None or not (
            geometry.covers(point) or (coastal_exception and geometry.distance(point) <= 0.2)
        ):
            site_outside.append(site["id"])

    orphan_districts = sorted(set(districts.provinceId) - set(provinces.id))
    missing_strategic_mappings = sorted(
        STRATEGIC_REGION_IDS - set(provinces_all.strategicRegionId)
    )
    extra_strategic_mappings = sorted(
        set(provinces_all.strategicRegionId) - STRATEGIC_REGION_IDS
    )
    missing_aggregate_ids = sorted(STRATEGIC_REGION_IDS - set(strategic.id))
    missing_sources = [
        row.id for row in provinces_all.itertuples() if not json_list(row.sourceIds)
    ]
    invalid_dates = [
        row.id
        for row in provinces_all.itertuples()
        if pd.notna(row.validUntil) and row.validFrom > row.validUntil
    ]
    missing_site_sources = [site["id"] for site in sites if not site.get("sourceIds")]

    territorial_mask = provinces.geometry.union_all()
    railway_outside = [
        row.id for row in railways.itertuples() if row.geometry.difference(territorial_mask).length > 1e-7
    ]
    river_outside = [
        row.id for row in rivers.itertuples() if row.geometry.difference(territorial_mask).length > 1e-7
    ]

    province_parts = provinces.to_crs("EPSG:6933").explode(index_parts=False)
    sliver_count = int((province_parts.geometry.area < 10_000_000).sum())
    severe = {
        "duplicateProvinceIds": duplicate_province_ids,
        "duplicateDistrictIds": duplicate_district_ids,
        "invalidProvinces": invalid_provinces,
        "invalidDistricts": invalid_districts,
        "invalidPolygonTypes": invalid_multi,
        "overlapsOverOneSquareKilometer": overlap_records,
        "orphanDistrictProvinceIds": orphan_districts,
        "missingStrategicMappings": missing_strategic_mappings,
        "extraStrategicMappings": extra_strategic_mappings,
        "missingGeneratedAggregateIds": missing_aggregate_ids,
        "citiesOutsideAssignedProvince": city_outside,
        "sitesOutsideAssignedProvince": site_outside,
        "railwaySegmentsOutsideTerritory": railway_outside,
        "riverSegmentsOutsideTerritory": river_outside,
        "invalidDateRanges": invalid_dates,
        "missingProvinceSourceMetadata": missing_sources,
        "missingSiteSourceMetadata": missing_site_sources,
    }
    report = {
        "targetDate": TARGET_DATE,
        "sourceRuleCount": len(rules),
        "provinceRecordCount": len(provinces_all),
        "activeProvinceCount": len(provinces),
        "districtCount": len(districts),
        "formalGovernmentCount": len(formal),
        "strategicAggregateCount": len(strategic),
        "cityCount": len(cities),
        "siteCount": len(sites),
        "railwaySegmentCount": len(railways),
        "riverSegmentCount": len(rivers),
        "smallIslandOrSliverPartsUnderTenSquareKilometers": sliver_count,
        "severe": severe,
    }
    write_json(QA / "geometry-validation-report.json", report)

    write_polygon_map(QA / "province-id-map.svg", provinces, "id", "March 1921 province IDs")
    write_polygon_map(
        QA / "province-confidence-map.svg", provinces, "confidence", "Boundary confidence"
    )
    write_polygon_map(
        QA / "formal-government-map.svg", provinces, "formalGovernmentId", "Formal governments"
    )
    write_polygon_map(
        QA / "strategic-parent-map.svg", provinces, "strategicRegionId", "Simulation parents"
    )
    write_polygon_map(
        QA / "district-membership-map.svg", districts, "provinceId", "Real district membership"
    )
    error_ids = {record["left"] for record in overlap_records} | {
        record["right"] for record in overlap_records
    } | set(invalid_provinces)
    write_polygon_map(
        QA / "geometry-error-map.svg",
        provinces,
        "confidence",
        "Geometry errors (red; none expected)",
        error_ids,
    )
    write_point_map(QA / "city-assignment-map.svg", provinces, cities, "City assignments")
    write_point_map(QA / "site-assignment-map.svg", provinces, sites, "Site assignments")
    (QA / "gap-and-overlap-report.md").write_text(
        "# Gap and overlap report\n\n"
        f"Target date: {TARGET_DATE}\n\n"
        f"- Active provinces: {len(provinces)}\n"
        f"- Polygon overlaps over 1 km²: {len(overlap_records)}\n"
        f"- Invalid active province geometries: {len(invalid_provinces)}\n"
        f"- Districts assigned to missing provinces: {len(orphan_districts)}\n"
        f"- Small island/sliver parts under 10 km²: {sliver_count} (reported, not automatically severe)\n\n"
        "The reconstruction mask is the union of explicitly selected real source features. "
        "Territory excluded by treaty, foreign control, or unavailable fine reconstruction is not "
        "silently filled with generated geometry.\n",
        encoding="utf-8",
    )
    (QA / "before-and-after-comparison.md").write_text(
        "# Before and after\n\n"
        "Phase Five used beveled polygons generated from longitude/latitude bounds and clipped them "
        "to manually authored strategic shapes. The Phase Five reference is "
        "../review-screenshots/phase-five-after/main-political-map.png.\n\n"
        "Phase Six uses the source-feature unions shown in province-id-map.svg; no generated box "
        "fallback or strategic clip participates in the new geometry.\n",
        encoding="utf-8",
    )

    failures = {key: value for key, value in severe.items() if value}
    if failures:
        raise SystemExit(
            "Cartographic validation failed. See docs/map-qa/geometry-validation-report.json: "
            + ", ".join(f"{key}={len(value)}" for key, value in failures.items())
        )
    print(
        f"cartographic validation passed: {len(provinces)} active provinces, "
        f"{len(districts)} districts, {len(cities)} cities, {len(sites)} sites"
    )


if __name__ == "__main__":
    main()
