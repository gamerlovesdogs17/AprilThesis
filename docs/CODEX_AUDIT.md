# Codex Audit

## Existing architecture

The repository began as an uncommitted npm-workspaces monorepo using React 19, TypeScript, Vite, Zustand, Zod, SVG, IndexedDB, Vitest, and Playwright dependencies. The content/simulation split was sound and worth preserving.

## Working work found

- 28 strategic regions with matching original SVG geometry.
- 15 historical characters, eight institutions, 12 policy tracks, 26 events, 15 operations, six publications, and six endings.
- Seeded RNG, campaign initialization, effect resolution, month advancement, ending checks, and save-envelope utilities.
- A strong constructivist title screen and approximately 64-second skippable/captioned intro.

## Broken or partial work found

- `App.tsx` used a wrong store import and referenced six missing screens.
- No playable map/game UI existed.
- Project references prevented type checking; numerous strict-cast errors remained.
- Operation costs did not match the schema, nested influence effects did not resolve, operation effects were applied at the wrong time, and target substitution failed at completion.
- Save timestamps invalidated their own checksum.
- No tests, README, docs, asset manifest, validation script, attribution, or licenses existed.
- Lint invoked an undeclared ESLint binary.
- Browser layout initially pushed bottom navigation out of view.

## Systems preserved

Content definitions, content schemas, deterministic RNG, campaign initializer, map calculations, save envelope, intro, title screen, workspace boundaries, and all authored narrative events were retained and repaired incrementally.

## Replacements

No major existing system was replaced. Missing UI systems were added; broken functions were corrected in place.

## Priorities selected

1. Restore type checking and production build.
2. Build a playable map-centered March–August loop.
3. Make operations, decisions, relationships, newspapers, saves, endings, and accessibility observable in play.
4. Add tests, research notes, asset validation, and continuation documentation.

## Remaining technical debt

- Policy tracks are observable but not yet directly lobbied outside narrative events.
- The political vote uses a live estimate and June event resolution, but does not yet model named delegates individually.
- The map is a deliberately abstract strategic diagram, not archival administrative borders.
- End-to-end test files and export/import UI remain follow-up work.
