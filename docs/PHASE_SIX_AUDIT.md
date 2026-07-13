# Phase Six Audit

## Scope and baseline

Phase Six begins from the completed Phase Five working state and preserves the political simulation, all content IDs, the 28 strategic-region IDs, deterministic behavior, save compatibility, Guided Tutorial, March-August 1921 campaign extent, offline play, and accessibility settings.

Before production map changes, on 13 July 2026:

- `npm.cmd run lint` passed.
- `npm.cmd run validate:all` passed all six TypeScript workspaces.
- Vitest passed 41 tests: 18 web, 5 map-engine, and 18 simulation.
- Asset validation passed 38 records with no untracked public assets.
- The production Vite build passed.

The outstanding human click-by-click March-August campaign identified in Phase Five remains incomplete at the Phase Six baseline.

## Confirmed Phase Five cartographic limitations

The Phase Five administrative layer is an explicitly disclosed display approximation, not a GIS reconstruction:

- `packages/content/src/historicalProvinces.ts` constructs every visible province with `generalizedBox` from rectangular west/south/east/north bounds.
- The renderer creates an `aggregate-clip-<strategic-region-id>` clip path for each of the 28 manually authored strategic surfaces and clips every province to its simulation parent.
- Those manually authored strategic surfaces remain beneath the visible province layer.
- Political influence is primarily rendered as large SVG circles with Gaussian blur at city or aggregate centers.
- Province detail draws the same fixed quadratic railway and river curves for every province.
- Local province sites use a shared fixed screen-position array rather than longitude and latitude.
- Local cities are selected by `city.regionId === province.strategicRegionId`, so a province can display cities from another province in the same simulation aggregate.
- Province labels use projected but untransformed SVG estimates; collision decisions are not recalculated in final screen coordinates after pan and zoom.

## Documentation correction

No current Phase Five documentation should be read as claiming that the visible province geometry was traced from historical administrative borders. The names, dates, types, and government mappings were researched; the geometry was generated from coordinate bounds. Phase Six replaces that geometry with source-feature-derived vectors and records reconstruction uncertainty feature by feature.

## GIS dependency decision

The primary vector source is the IISH/RiStat 1897 Russian Empire province and district GeoPackage dataset (Kessler and Markevich; cleaned by Rombert Stapel, IISH). Phase Six may only replace production province geometry after those real source features have been downloaded, inspected, reconstructed through machine-readable rules, validated, and exported. Missing or uncertain areas must remain explicitly provisional rather than falling back to generated boxes.
