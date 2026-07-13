# Map Implementation

## Sources and topology

Natural Earth provides the exterior land/coast context. Authored strategic composites, city records, rivers, railways, projection helpers, and validation live in `packages/content/src/geography.ts`. Adjacency is derived from collinear shared boundary segments. Development builds expose a boundary/ID overlay and live topology status.

## View hierarchy

- **National** below 130%: only 10 nationally essential city candidates, primary rail corridors, and priority region labels.
- **Regional** from 130%: priority-two cities, secondary rail branches, and more region labels.
- **Province focus** from 200% with a selected region: the region and immediate neighbors, local city labels, and derived factory/rail/port/union/security/garrison symbols.

`layoutCityLabels()` sorts the selected region first, then essential status and authored priority. Approximate label boxes suppress collisions. Hidden labels remain available on hover/focus of their city dots. “Show all city labels” is an explicit preference.

## Interaction

Wheel and button zoom are pointer-anchored and clamped to 85–400%. Pointer pan starts only after a five-pixel threshold, prevents browser text selection, and does not trigger a region choice at drag end. Single selection centers at a regional scale; double-click, Enter, the focus menu, and Fit region use province scale. Escape, `0`, National view, and the legend return control restore overview. Zoom and pan survive reloads in session storage; no view value enters the seeded campaign.

Political mode uses a unified burgundy territorial surface with clipped faction reach above it. Contested intelligence hatching, internal borders, selected/neighbor emphasis, rivers, rail tiers, operations, and labels remain independently legible. The political overlay is explicitly organizational reach, not sovereignty.

## Validation

Unit coverage checks zoom tiers, selected-label precedence, collision suppression, region/city parity, topology errors, projection bounds, and historical names. Browser scenarios cover zoom, focus, national return, layers, label density, local symbols, drag behavior, and settings return.
