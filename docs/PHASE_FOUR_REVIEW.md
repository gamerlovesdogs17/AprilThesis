# Phase Four Review

## Audit result

The baseline confirmed the brief's main findings: a paragraph instead of a tutorial, full-page navigation with hardwired returns, an 11-tab scrolling dock, angular independent map fills, crowded labels, a large event dossier, visible source IDs, silhouette-only characters, one short title cue, and duplicate manifests.

Baseline images are in `docs/review-screenshots/phase-four-before/`: title screen, opening dossier, and province focus.

## Implemented review matrix

- Tutorial/hints: 18 persisted steps, pause/skip/restart, target recovery, final-month gate, and separate hint preferences.
- Navigation: in-campaign overlays, browser Back/Escape, exact return, dirty messaging, reload recovery.
- Map: validated shared topology, unified national surface, three zoom tiers, collision labels, local detail, focus/return, drag threshold, keyboard access, debug layer.
- Workspace/events: five command groups, no scrolling group row, collapse, compact/expanded/minimized dossier, Research Mode sources.
- Media: 13 verified portraits, two honest fallbacks, modern-insignia disclosure, seven sustained score files and crossfades.
- Accessibility/QOL: reduced-motion map overrides, captions, all-label opt-in, visible focus, sidebar/workspace shortcuts, safe-area intro rules.

## Automated evidence

- 42 Playwright scenarios are registered (`npm run test:e2e -- --list`).
- Unit coverage includes tutorial ordering/progress, hints, save migration, topology, label tiers/collision, audio crossfade/visibility, deterministic simulation, and asset/content parity.
- The canonical manifest records 36 assets and validation rejects missing/unlisted files or a stale root manifest.

## Verification limitation

The managed in-app browser initially produced baseline captures. After implementation it rejected the local URL under browser security policy, which also prohibited switching to an alternate browser surface as a workaround. Consequently the after-screenshot pack, the 42-scenario browser run, and a post-change manual March–August playthrough are pending.

When an allowed browser environment is available:

```bash
npm run dev
npm run test:e2e
```

Then inspect `docs/review-screenshots/phase-four-after/` at 1440×900, 1280×720, 1024×768, and mobile intro width. Confirm label collisions, event/map balance, every dock group, portrait crops, tutorial target visibility, overlay return state, reduced motion, and score controls.

## Compatibility

The playable chapter remains March–August 1921. Save version 4 is additive. IDs and deterministic mechanics remain stable. Kharkov's city record now belongs to the revised Central Ukraine strategic composite because that polygon contains its coordinate; the city and region identifiers are unchanged.
