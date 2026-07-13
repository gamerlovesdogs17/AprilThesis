# Phase Three Review

## Outcome

Phase Three replaces the presentation placeholders identified in `PHASE_THREE_AUDIT.md` without extending or rebalancing the March–August 1921 chapter. The active build has a geographic map, designed six-scene cinematic, local audio, persistent faction identity, historical campaign charts, visual political dashboards, character dossiers, and differentiated press presentation.

## Before and after evidence

Baseline captures are in `docs/review-screenshots/phase-three-before/`. Final captures are in `docs/review-screenshots/phase-three-after/`.

The final set includes:

- title and setup;
- every cinematic scene (`cinematic-01` through `cinematic-06`);
- opening dossier and main political map;
- formal administration, food, railway, and intelligence modes;
- region focus/fit view;
- economic history, faction, vote, institution, character, law, newspaper, and archive workspaces.

## Compatibility

- All existing region, character, event, institution, law, operation, and publication IDs remain stable.
- The Phase Two political mechanics and deterministic seed behavior are unchanged.
- Save version 3 is additive: it stores compact monthly chart snapshots and migrates version 2 campaigns with a snapshot of their current state.
- Zoom, pan, layers, opacity, animation, and audio settings never affect campaign resolution.
- The playable chapter remains March–August 1921, with its existing September outcome. No 1922–1924 campaign content was authored.

## Automated verification

- `npm run validate:all`: passed.
- TypeScript: all six workspaces passed.
- Vitest: 27 passed (16 simulation, 8 web/content/audio, 3 map engine).
- Asset validation: 16 manifested assets, no missing or untracked public files.
- Production build: passed; 69 modules transformed.
- Playwright: 27 of 27 scenarios passed in Chromium in 40.8 seconds when run against the local Vite server.

The Playwright configuration also supports `PLAYWRIGHT_BASE_URL` for an already-running server, which avoids Windows child-process shutdown delays in managed environments.

## Manual browser verification

The in-app browser was used at 1280×720 to inspect and capture all six cinematic frames, complete the opening dossier, select and focus Petrograd, switch strategic modes, inspect every redesigned bottom workspace, and review responsive clipping/scroll behavior. The active developer log contained Vite connection messages and no application error entry.

## Asset honesty

Natural Earth is public-domain context and is credited. The congress scene is labeled an original artistic reconstruction rather than a photograph. Character visuals are labeled designed silhouettes rather than likenesses. All WAV files are original deterministic synthesis. See `ATTRIBUTION.md`, `THIRD_PARTY_LICENSES.md`, `ASSET_SOURCES.md`, and the manifest.

## Deliberate limits

- The regional polygons are geographically coherent strategic composites, not archival administrative boundaries.
- Historical city populations and normalized regional metrics remain gameplay estimates unless individually sourced.
- No historical portraits were introduced.
- No backend, cloud save, multiplayer, or post-1921 campaign extension was added.
