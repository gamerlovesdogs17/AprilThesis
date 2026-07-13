# Phase Five Review

## Implemented acceptance matrix

- Main-menu GUIDED TUTORIAL is immediately below New Campaign.
- Tutorial launches fixed March 1921 historical settings and a 21-step gated sequence.
- Tutorial progress, milestones, pause state, save badges, and completion choices persist.
- Guided Opening remains a separate ordinary-campaign option.
- Invented Workers’ Opposition emblem treatment is removed; documentary provenance is local and explicit.
- Historical-province data is separate from the 28 simulation aggregates.
- National and dedicated province atlases are distinct renderers.
- Local factory, railway, port, union, security, garrison, and city markers are SVG pictograms rather than letters.
- Province and city labels use independent collision logic.
- Atlas and event controls no longer occlude one another.
- The 390 px opposition intro heading remains within the viewport.

## Automated evidence

`npm.cmd run lint` passes. `npm.cmd run validate:all` covers all workspaces, 41 Vitest tests, 38 asset records, and the production build. The Chromium pack contains 42 scenarios. One complete run passed 41; its only failure was a stale expectation that Petrograd comparison still listed Baltic Frontier. The renderer correctly lists Petrograd, Karelia, and Moscow, and the corrected scenario then passed alone.

The screenshot pack is in `docs/review-screenshots/phase-five-after/`:

- `main-political-map.png`
- `western-russia-province.png`
- `caucasus-province.png`
- `siberia-province.png`
- `city-labels.png`
- `railway-layer.png`
- `national-charts.png`

## Manual evidence and limit

The in-app pass inspected the title, direct tutorial launch, initial decision/tutorial composition, national atlas, province selection, and Petrograd’s dedicated local atlas. It exposed and led to fixes for the event/toolbar stacking conflict and the 390 px cinematic overflow.

The browser was stopped before the planned click-by-click March–August playthrough. That remaining human acceptance item is explicitly retained in `docs/TODO_NEXT.md`; automated six-turn and ending coverage remains green.
