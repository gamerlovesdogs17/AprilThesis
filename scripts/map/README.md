# Phase Six GIS pipeline

The scripts in this directory reconstruct and validate the browser-ready March 1921 cartographic bundle. The committed web assets allow ordinary offline play without Python or network access.

Use the bundled or a local Python 3.12 environment:

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
```

Every script resolves paths relative to the repository, fails with a clear message when an input is absent, and writes deterministic UTF-8 output. `download_sources.py` verifies published or pinned checksums and reuses valid cached files. The Moskva River supplement is a dated OpenStreetMap waterway-relation extract; it fills a documented local-detail omission in the national-scale Natural Earth layer and is never used as historical boundary evidence.
