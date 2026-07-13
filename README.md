# APRIL THESIS

**The Revolution After Victory** is a local-first, single-player political strategy game set in Soviet Russia in 1921. The finished playable chapter covers March through August 1921. The player leads a fictional senior organizer in the Workers' Opposition while historical figures, institutions, delegates, regional organizations, and rival blocs pursue their own agendas.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. No account, backend, or network connection is required after dependencies are installed.

## Verification

```bash
npm run lint
npm run validate:all
npm run test:e2e
```

`validate:all` runs workspace type checking, 19 Vitest tests, asset validation, and the production build. The Playwright suite contains 11 campaign scenarios.

## Political systems

- A five-phase monthly turn from March through August, with setup requirements and historically constrained or plausible event options.
- Eight named organizers with skills, fatigue, exposure, assignments, arrest status, and operation eligibility.
- Eight faction blocs with leaders, support, satisfaction, preferences, red lines, willingness to work underground, and split risk.
- A June composite Central Committee vote resolved as a deterministic named roll across 28 historical or clearly labeled composite delegates. The board exposes lean, reliability, concerns, lobbying history, abstentions, and the final tally.
- Direct campaigns for Mandatory Union Consultation, Factory Committee Co-Management, and a Protected Internal Party Press. Passed laws apply immediate and monthly effects.
- Autonomous character and institution agendas, relationships, pressure, institutional attitude/autonomy, and visible communications.
- Fifteen regional operations with named-organizer assignment, phase/resource/skill/intelligence gates, cooldowns, transparent success/detection chances, arrest and release consequences, and persistent regional effects.
- Sixteen map modes, including influence-field rendering and uncertainty treatment.
- Ten newspapers and bulletins with official/factional contradictions, suppression markers, filters, and article links.

## Structure

- `apps/web`: React 19, Zustand, Vite UI, Playwright scenarios, and local persistence.
- `packages/shared-types`: campaign, political, vote, save, map, and content contracts.
- `packages/content-schema`: Zod schemas for authored content.
- `packages/content`: regions, geometry, characters, events, institutions, laws, operations, publications, and endings.
- `packages/simulation`: seeded campaign/politics simulation, turn resolution, effects, endings, and IndexedDB saves.
- `packages/map-engine`: map-mode calculations, faction colors/patterns, uncertainty, and influence fields.
- `docs`: audit, research baseline, system notes, progress, and continuation work.

## Saves

Saves use a versioned `SaveEnvelope`, checksum validation, deterministic state, and IndexedDB. Version 2 migrations add the political systems to older campaigns. The UI supports manual save, load/continue, duplicate, export, import, delete, rotating autosaves, and quarantine of invalid imports. Ironman uses one protected campaign slot and disables duplication/deletion in the manager.

## Historical and content workflow

Content is TypeScript data validated by shared types. Historical events include a classification, date, and source identifiers. Composite delegates, meetings, and votes are labeled as simulations rather than archival claims. Add claims and source URLs to `docs/HISTORICAL_BASELINE.md`, and mark uncertainty, simplification, and gameplay interpretation.

## Assets and deployment

The build uses original CSS, SVG, and procedural audio only. Add external media under `apps/web/public`, record it in `public/assets/assets-manifest.json`, update `ATTRIBUTION.md`, and run `npm run validate:assets`.

`npm run build` writes the static site to `apps/web/dist`. Any static host can serve it; no backend is configured or required.
