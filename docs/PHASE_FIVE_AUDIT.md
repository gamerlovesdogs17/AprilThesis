# Phase Five Audit

## Baseline verified on 13 July 2026

The Phase Four candidate remains structurally intact and the working tree was clean before Phase Five began. The political simulation, seeded RNG, events, organizers, delegate vote, laws, institutions, saves, newspapers, audio, portraits, and March–August 1921 chapter are all present. No simulation-facing content IDs need to change for this phase.

## Confirmed gaps

- `TitleScreen.tsx` has no tutorial command. Its main menu begins with **New Campaign**, and tutorial-enabled play can only be launched through the **Guided opening** checkbox in `CampaignSetup.tsx`.
- The existing onboarding is an 18-step overlay attached to an ordinary campaign. Steps can be advanced manually and are not consistently gated by the requested interactions, so it is not yet a deliberately configured complete tutorial scenario.
- `strategicRegionPolygons` in `packages/content/src/geography.ts` is a manually authored list of 28 coordinate polygons. Those strategic composites currently provide both simulation aggregation and all visible internal map boundaries.
- “Province focus” is only the highest zoom tier. `fitGeometry()` centers and enlarges the same national SVG; there is no separate historical-province model, province selection state, or dedicated local atlas.
- Local detail is rendered with hardcoded text glyphs: `F` factory, `R` railway junction, `P` port, `U` union center, `S` security presence, and `G` garrison.
- City-label collision suppression exists, but labels and strategic-region names share the same national surface and still compete at close scales. No independent province-detail label layout exists.
- Prominent faction identity locations still use a project-created circular or abstract insignia. The interface discloses that it is modern, but it nevertheless occupies the visual role of a faction emblem.
- `COMPLETION_REPORT.md`, `docs/PHASE_FOUR_REVIEW.md`, and `docs/TODO_NEXT.md` all state that the Phase Four after-screenshot pack, 42-scenario browser run, and a complete post-change manual March–August campaign were not completed.

## Untouched static baseline

Before any source edit:

- `npm.cmd run lint` passed.
- `npm.cmd run validate:all` passed.
- All six TypeScript workspaces typechecked.
- Vitest passed 39 tests: 16 web, 5 map-engine, and 18 simulation tests.
- Asset validation passed with 36 records and no untracked public files.
- The Vite production build completed successfully.

The first `npm run validate:all` attempt was blocked by the workstation PowerShell execution policy for `npm.ps1`; the equivalent `npm.cmd` command then passed. This is an environment detail, not a project failure.

## Phase Five implementation boundary

The 28 strategic region IDs will remain the simulation-facing aggregates. A separate dated historical-province dataset and renderer will become the visible administrative layer. Tutorial additions will be additive and migrated for old saves. The campaign end remains August 1921.
