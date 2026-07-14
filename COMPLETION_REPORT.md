# Implementation Report: Phase Seven

## Current status

Phase Seven is complete. The March-August campaign remains intact, while the GIS date model now separates geographic existence from administrative ownership, the national atlas fits the active territory, direct province selection distinguishes click from drag, and the shell is responsive across the supported viewport and text-scale matrix.

The repository contains 96 reconstruction rules, 95 stable March-August geographic partitions, 650 districts, 14 formal governments in each of six monthly snapshots, 28 optional strategic dissolves, 694 clipped river segments, and 82 clipped railway segments. Akmolinsk is geographically present under Omsk/Sibrevkom administration before its April transfer to the Kirghiz ASSR; the August Komi reorganization no longer overlaps Arkhangelsk and North Dvina.

Standard and Expert interface-detail modes use the same simulation. Quick Start provides a deterministic recommended entry path. Save version 7 supports current saves and complete Phase Six saves only; prototype versions 1-5 intentionally reset and imported files are quarantined.

## Phase Seven verification

- GIS validation passes all six monthly territorial masks with no overlap above 1 km² and no monthly mask change above 5 km².
- Lint, all TypeScript workspaces, 47 Vitest tests, 38-asset validation, and the production build pass.
- Chromium passes 54/54 scenarios, including direct pointer selection, drag suppression, stored-view validation, responsive/text-scale checks, and all prior campaign/cartographic scenarios.
- Standard and Expert browser-driven playthroughs both complete March-August with the fixed `phase-seven-complete-campaign` seed and reach `Reformist Victory`.
- `docs/review-screenshots/phase-seven-after/` contains the four stabilized responsive map captures.

See `docs/PHASE_SEVEN_AUDIT.md` for the diagnosis and `docs/PHASE_SEVEN_REVIEW.md` for final acceptance evidence.

# Archived Implementation Report: Phase Six

Phase Six introduced the GIS reconstruction and presentation systems. Its outstanding full-campaign review was closed by the Phase Seven Standard and Expert playthroughs recorded above.

# Archived Completion Report: Phase Five

## Outcome

Phase Five is implemented: a standalone fixed-seed guided tutorial, a separate 88-unit dated historical-province layer, a dedicated local province atlas with pictographic sites, historically honest Workers’ Opposition identity, save migration and tutorial badges, improved overlay/accessibility behavior, and mobile intro containment.

The 28 simulation aggregates and all existing content IDs remain stable. Seeded simulation rules were not rebalanced. Save version 5 adds tutorial mode, milestones, and end-panel state without discarding older campaigns.

## Verification

- Workspace lint passes.
- All six TypeScript workspaces pass.
- Vitest passes 41 tests: 18 web, 5 map-engine, and 18 simulation.
- Asset validation passes with 38 canonical records and no untracked public files.
- The production build passes.
- The 42-scenario Chromium suite reached 41/42 in one complete run; the only failure was an obsolete expected adjacency name, and that corrected scenario passed independently.
- The Phase Five screenshot scenario populated `docs/review-screenshots/phase-five-after/` with national, province, city-label, railway, and dashboard views.
- In-app visual inspection covered the title command, tutorial opening, national atlas, and Petrograd local atlas and caught two stacking/layout defects that were fixed before handoff.

## Accuracy boundary

The province model’s names, dates, types, government mappings, and source links are researched. The interactive vectors are visibly and textually disclosed as generalized display geometry, not exact cadastral lines. Research found no verified independent Workers’ Opposition emblem in the reviewed records; this is a research conclusion, not a claim that no emblem could ever have existed.

## Manual-pass caveat

The managed in-app browser was stopped before a final click-by-click March–August run. This report therefore distinguishes automated coverage from human manual coverage. The browser suite completes a month through save/reload and the simulation suite verifies March–August reachability and ending selection; the remaining human pass is listed in `docs/TODO_NEXT.md`.
