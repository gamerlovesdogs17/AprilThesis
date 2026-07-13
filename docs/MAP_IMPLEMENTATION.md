# Map Implementation

## Administrative and simulation separation

`packages/content/src/historicalProvinces.ts` imports 96 dated GIS-derived units. Each records period name, government, administrative type, stable simulation parent, polygon or multipolygon, capital, validity, source features, reconstruction operation, confidence, and notes. Ninety-three units are active in March 1921.

Province paths are independent selectable surfaces and are never clipped to strategic aggregates. The optional strategic overlay is a low-opacity dissolve of member provinces, hidden by default. Formal-government borders are a separate stronger dissolve.

## National atlas

The national map uses a muted territorial field, coastline and border hierarchy, major rivers, trunk railways, at most ten overview city labels, screen-space text measurement, and a fine selected-province stroke. Historical Atlas, Political Intelligence, Economic Planning, and Minimal Accessibility presets alter presentation only. Seven theater buttons pan and zoom this same map and show a national inset at depth.

Influence is an interpolated scalar field rendered with marching-squares contours and territorial clipping. Optional contested and uncertainty hatches remain legible over administrative lines; large blurred circles are no longer the primary display.

## Province atlas

Province detail uses the detailed exterior, real uyezd boundaries, province-clipped rivers and railways, exact province-assigned cities, geographic sites, neighbors, current organizers and operations, and formal-government context. Missing district data is disclosed without decorative subdivision. Raw source IDs stay in Research Notes and documentation.

## Runtime and saves

The browser imports committed GeoJSON/TopoJSON from `packages/content/map-data/`; it does not fetch a map service. Map geometry is absent from saves. Save version 6 adds only compact Situation Board and Campaign History records.

## Validation

`scripts/map/validate_geometry.py` checks validity, overlaps, gaps, slivers, containment, mappings, dates, transport bounds, and metadata, then emits QA reports under `docs/map-qa/`. Unit tests cover reconstruction imports, city/site/transport assignment, strategic dissolves, contours, screen-space labels, presentation selection, and save migration.
