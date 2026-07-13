# GIS Pipeline

The deterministic build lives in `scripts/map/`. Ordinary players need only the committed browser assets; Python and network access are build-time requirements.

## Environment and commands

Use Python 3.12 and install the pinned `scripts/map/requirements.txt` (GeoPandas 1.1.1, Pyogrio 0.11.1, Shapely 2.1.1, TopoJSON 1.10):

```powershell
python -m pip install -r scripts/map/requirements.txt
python scripts/map/download_sources.py
python scripts/map/inspect_sources.py
python scripts/map/reconstruct_1921_districts.py
python scripts/map/reconstruct_1921_provinces.py
python scripts/map/build_formal_governments.py
python scripts/map/build_strategic_aggregates.py
python scripts/map/build_transport_layers.py
python scripts/map/validate_geometry.py
python scripts/map/export_web_assets.py
python scripts/map/generate_documentation.py
```

`download_sources.py` reuses only checksum-valid cache files. A missing network or checksum mismatch exits with an actionable error and generates no fallback geometry.

## Data flow

1. Inspect the IISH province and district schema and record a source inventory.
2. Select and date real district membership using `province-changes-1921.json`.
3. Dissolve selected features into 96 province records; 93 are active in March 1921.
4. Derive province neighbors from genuine shared boundary intersections.
5. Dissolve active provinces into 14 formal-government and 28 strategic-aggregate geometries.
6. Clip 694 river segments and 82 railway segments to the province geometry, preserving `provinceId` and provenance.
7. Validate 646 districts, 36 cities, 24 sites, validity, containment, gaps, overlaps, slivers, mappings, bounds, metadata, and geometry validity.
8. Export GeoJSON and shared-arc TopoJSON at national, theater, and province detail levels.

Severe invalid geometry, unexplained overlap, duplicate or orphan IDs, missing strategic mapping, out-of-province cities or sites, invalid transport bounds, or missing provenance fails the build. QA maps and reports are written to `docs/map-qa/`.

## Committed runtime outputs

The browser imports province, district, formal-government, strategic-aggregate, city, site, railway, and river assets from `packages/content/map-data/`. Geometry is never stored in a save and no external URL is requested during play.
