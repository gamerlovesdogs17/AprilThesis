# APRIL THESIS

## Phase Six current state

The playable chapter remains March-August 1921. Phase Six replaces the former generalized province boxes with a reproducible historical-GIS atlas and adds strategic presentation without rebalancing the political simulation. The map now ships 96 dated reconstruction rules, 93 active March provinces, 646 uyezds, 14 formal governments, province-derived dissolves for the 28 stable simulation aggregates, source-backed local transport, theater navigation, influence contours, a monthly Situation Board, and compact Campaign History.

Save version 6 migrates earlier campaigns additively. Map geometry is never stored in saves. The clean 48-scenario Playwright pass is complete; the human March-August playthrough remains the sole Phase Six completion gate. See `docs/PHASE_SIX_REVIEW.md`.

**The Revolution After Victory** is a local-first political strategy game about the Workers' Opposition in Soviet Russia. The playable chapter remains March–August 1921. The earlier Phase Four presentation work remains intact beneath the Phase Six cartographic replacement; neither phase rebalances the simulation or adds a later chapter.

## Run and verify

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
npm run validate:all
npm run test:e2e
```

The static production build is written to `apps/web/dist`. The game has no backend and all distributed media is local.

## Current systems

- Five-phase deterministic monthly turns, 28 stable strategic regions, named organizers, faction blocs, institutions, characters, policy campaigns, delegate politics, regional operations, newspapers, and versioned local saves.
- An 18-step persisted first-month tutorial plus separately configurable beginner hints.
- Return-preserving Settings, Archive, and Credits overlays; browser Back and Escape return to the exact campaign.
- A unified strategic land view with derived shared-border adjacency, topology validation, three zoom tiers, collision-managed labels, province focus, local symbols, layers, keyboard focus, and a return-to-national control.
- A five-group non-scrolling command dock that can collapse without changing campaign state.
- Compact, expanded, and minimized event dossiers. Raw source identifiers appear only in Research Mode.
- Thirteen verified public-domain or CC0 historical portraits and two clearly labeled dossier fallbacks.
- Seven original sustained music files with title/campaign/crisis/vote/famine/ending contexts, crossfades, offline looping, volume controls, and hidden-tab pause/resume.
- A responsive, skippable, captioned introduction with reduced-motion treatment and an explicitly modern Workers' Opposition interface insignia.

## Saves and compatibility

Save version 6 adds Situation Board and Campaign History presentation state on top of the earlier tutorial fields. Earlier envelopes are migrated additively; content IDs, campaign seed state, political calculations, and the March–August date range are unchanged. An active local session also restores the selected region, character, map mode, command group, sidebar state, and tutorial progress after a reload; map zoom/pan is kept in session storage.

## Assets and historical honesty

`apps/web/public/assets/assets-manifest.json` is the sole canonical asset manifest. `npm run validate:assets` rejects missing records, untracked public files, and a reintroduced root manifest. Portrait provenance and display-crop notes are in `apps/web/public/assets/portraits/sources.json` and `docs/ASSET_SOURCES.md`.

Research did not establish a distinct documented Workers' Opposition emblem. The code-native mark remains only as a labeled modern interface insignia. See `ATTRIBUTION.md`, `THIRD_PARTY_LICENSES.md`, and `docs/PHASE_FOUR_REVIEW.md` for evidence and remaining verification limits.
