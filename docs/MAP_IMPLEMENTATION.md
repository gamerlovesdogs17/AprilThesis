# Map Implementation

## Separation of historical display and simulation

The 28 strategic region IDs remain the stable simulation aggregates. They drive state, AI, operations, save compatibility, and political calculations but no longer supply the visible internal administrative labels or normal boundary strokes.

`packages/content/src/historicalProvinces.ts` defines 88 dated units through `HistoricalProvince`: period name, alternate names, government, administrative type, simulation aggregate mapping, GeoJSON polygon or multipolygon, capital, validity interval, sources, confidence, and notes. `isProvinceActive()` selects the units valid for the campaign month. Every source ID resolves to a dated source record.

The national renderer clips each generalized province geometry to its hidden simulation aggregate. This prevents the display geometry from leaking across the playable land surface while keeping the aggregate topology invisible in production. A development-only debug overlay can reveal the 28 aggregates.

## Two map surfaces

The **National atlas** shows dated administrative units, political reach, period city names, rivers, railways, uncertainty, and operations. A province selector is the primary administrative navigation. Labels use a collision pass and only appear at appropriate scale; the 10 essential national cities remain the restrained overview set.

**Province detail** is a separate local atlas, not a national-map zoom. It normalizes the selected province geometry into its own drawing surface and adds a local ledger, rail and river context, and named sites. City, factory, railway, port, union, security, and garrison sites use distinct SVG pictograms. The former F/R/P/U/S/G map glyphs are gone.

All map controls stay above the active-decision overlay. The dossier begins below the atlas toolbar so map and event controls remain independently usable.

## Accuracy statement

Administrative identities, dates, names, and source relationships are historical. Display geometries are explicitly generalized interpretive vectors prepared for this interface, not cadastral boundary claims. The UI and legend say “generalized display geometry,” and confidence is shown in the province ledger. The source basis and limits are detailed in `docs/HISTORICAL_PROVINCE_MAP.md`.

## Validation

Unit coverage checks unique IDs, source resolution, dated activation, GeoJSON path output, aggregate mapping, strategic topology, city projection, collision logic, and historical names. Browser coverage checks selection, the dedicated province transition, local atlas semantics, zoom/reset, layer toggles, drag behavior, accessible controls, and screenshot capture.
