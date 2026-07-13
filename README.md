# APRIL THESIS

**The Revolution After Victory** is a local-first political strategy game about the Workers' Opposition in Soviet Russia. The playable chapter remains March–August 1921. Phase Four improves how players learn, navigate, and read the existing simulation; it does not rebalance Phase Two or add a later chapter.

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

Save version 4 adds tutorial pause/progress and hint-dismissal fields. Earlier envelopes are migrated additively; content IDs, campaign seed state, political calculations, and the March–August date range are unchanged. An active local session also restores the selected region, character, map mode, command group, sidebar state, and tutorial progress after a reload; map zoom/pan is kept in session storage.

## Assets and historical honesty

`apps/web/public/assets/assets-manifest.json` is the sole canonical asset manifest. `npm run validate:assets` rejects missing records, untracked public files, and a reintroduced root manifest. Portrait provenance and display-crop notes are in `apps/web/public/assets/portraits/sources.json` and `docs/ASSET_SOURCES.md`.

Research did not establish a distinct documented Workers' Opposition emblem. The code-native mark remains only as a labeled modern interface insignia. See `ATTRIBUTION.md`, `THIRD_PARTY_LICENSES.md`, and `docs/PHASE_FOUR_REVIEW.md` for evidence and remaining verification limits.
