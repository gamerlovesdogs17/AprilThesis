# APRIL THESIS

**The Revolution After Victory** is a local-first, single-player political strategy game set in Soviet Russia in 1921. The playable vertical slice covers March through August. The player leads a fictional senior organizer in the Workers' Opposition while historical figures pursue independent agendas.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. No account, backend, or network connection is required after dependencies are installed.

## Verification

```bash
npm run typecheck
npm test
npm run validate:assets
npm run build
npm run validate:all
```

## Structure

- `apps/web`: React 19, Zustand, Vite UI and local persistence.
- `packages/shared-types`: campaign, save, map, and content contracts.
- `packages/content-schema`: Zod schemas for authored content.
- `packages/content`: regions, map geometry, characters, events, institutions, laws, operations, publications, and endings.
- `packages/simulation`: seeded RNG, campaign initialization, turn resolution, effects, endings, and IndexedDB saves.
- `packages/map-engine`: map-mode calculations, faction colors/patterns, uncertainty, and influence fields.
- `docs`: audit, research baseline, progress, and continuation notes.

## Content authoring

Content is TypeScript data validated by shared types. Every historical event includes a classification, date, and source identifiers. New gameplay effects use resource names (`workerSupport`), national-stat names (`urbanFoodSupply`), or explicit paths such as `region:petrograd:foodSupply` and `character:lenin:trust`.

## Saves

Saves use a versioned `SaveEnvelope`, checksum validation, deterministic seed/state, IndexedDB, one manual slot, and three rotating autosaves. Loading never requires a backend. Save migration is centralized in `packages/simulation/src/save.ts`.

## Assets

The current build uses original CSS/SVG/procedural audio only. Add external media under `apps/web/public`, record it in `public/assets/assets-manifest.json`, update `ATTRIBUTION.md`, and run `npm run validate:assets`.

## Historical workflow

Add claims and source URLs to `docs/HISTORICAL_BASELINE.md`; mark uncertainty, simplification, and gameplay interpretation. Do not call the 1921 state the USSR, give Stalin the 1922 General Secretary office early, or present fictional scenes as documented fact.

## Deployment

`npm run build` writes the static site to `apps/web/dist`. Any static host can serve it. No backend is configured because it adds no value to the current local-first chapter.
