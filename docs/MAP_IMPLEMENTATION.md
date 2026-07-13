# Map Implementation

## Data pipeline

`scripts/build-map-context.mjs` reads the bundled Natural Earth GeoJSON, selects relevant surrounding features, projects them into a 1000×560 view, and writes `packages/content/src/geography-context.json`. The runtime does not fetch map data.

`packages/content/src/geography.ts` is the authored layer for:

- 28 stable strategic-region polygons, centers, label positions, label priority, and adjacency;
- 21 historical city records with geographic coordinates and importance metadata;
- Volga, Don, Dnieper, Ural, Ob, and Yenisei context;
- Trans-Siberian, Moscow-Southern, Southwestern, Caucasus, and Turkestan connections;
- sea labels, projection bounds, and line/path helpers.

## Interaction model

`GeographicMap.tsx` maintains presentation-only zoom and pan state. Zoom is clamped from 85% to 400%. Pointer drag, wheel zoom, plus/minus buttons, Reset, Fit region, SVG keyboard selection, and the accessible region-focus menu all call the same view functions. These values never enter campaign state or seeded resolution.

Selecting a region centers it at a useful working scale, outlines its polygon, emphasizes immediate neighbors, dims unrelated regions, and opens the existing regional dossier. Region IDs and operation targets are unchanged.

## Layers

Political overlay, cities, railways, borders, uncertainty, and active operations can be toggled independently. Political opacity is adjustable. The 16 Phase Two map modes remain available.

Influence is a clipped continuous surface assembled from city/region nodes, blurred fields, contour rings, dominant-faction colors, and contested/pattern fallbacks. It is explicitly labeled organizational reach rather than sovereignty.

Labels use priority and zoom thresholds. Important national cities remain visible at overview scale; secondary city and region labels appear on closer zoom.

## Accessibility and failure behavior

Every region path is keyboard focusable and named with its current mode value. Controls have labels, zoom has live output, layers are real checkboxes, and a screen-reader description summarizes available input methods. Natural Earth is contextual only; failure of that derived layer would not remove selectable gameplay regions.

## Validation

Unit tests assert geometry/region parity, valid adjacency IDs, projected bounds, core city mapping, historical-name notes, and expected river/rail records. Playwright covers focus, zoom clamping, reset, fit-region, layer visibility, selection persistence, 16 modes, and historical city labels.
