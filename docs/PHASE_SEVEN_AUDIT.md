# Phase Seven Audit

Date: 2026-07-13  
Campaign boundary: March-August 1921 (unchanged)

## Baseline

Before Phase Seven implementation, the existing build passed workspace lint, all six TypeScript workspace checks, 47 Vitest tests, asset validation, and the production build. The GIS, simulation, tutorial, political systems, events, delegates, organizers, institutions, laws, newspapers, audio, and campaign content were retained.

## Territorial integrity finding

The March hole beside the Kirghiz ASSR was `akmolinsk-province`. Its four real source uyezd geometries (`district:793`, `district:795`, `district:796`, and `district:797`) were already present, but the province record used the 25 April 1921 transfer as its geographic `validFrom`. The renderer consequently omitted real territory during March.

This was an administrative-date error, not missing geometry. The State Archive of East Kazakhstan chronology describes Akmolinsk and Semipalatinsk as temporarily under the Siberian Revolutionary Committee before their transfer to the Kirghiz ASSR. Other summaries likewise date the transfer process to spring 1921. Sources reviewed:

- [State Archive of East Kazakhstan Region](https://e-arhiv.vko.gov.kz/ru/Page/Index/1495)
- [North Kazakhstan regional history](https://www.gov.kz/memleket/entities/sko-madeniet/press/article/details/37866?lang=ru)
- [Great Russian Encyclopedia: Akmolinsk Governorate](https://old.bigenc.ru/domestic_history/text/1806948)

The corrected model keeps the Akmolinsk territory geographically present from 1920. It displays as the Akmolinsk uyezds of Omsk Governorate under Sibrevkom/RSFSR through March, then as Akmolinsk Province of the Kirghiz ASSR from 25 April.

The monthly audit found one second date-model defect: the Komi-Zyryan Autonomous Oblast appeared in August while its constituent Pechora, Yarensk, and Ust-Sysolsk districts still remained in the Arkhangelsk and North Dvina province geometries. That produced an August overlap rather than a hole. The correction defines one stable Komi geographic partition for the entire campaign, administered as districts of Arkhangelsk and North Dvina through July and as the Komi-Zyryan Autonomous Oblast from 22 August.

After correction, March, April, May, June, July, and August have an identical 95-unit territorial mask, zero overlaps above 1 km², no invalid active province geometries, and complete administrative coverage for every active unit. The formal-government layer is now generated as six monthly snapshots (14 governments per month, 84 records total).

## Map behavior finding

The national reset previously forced `zoom = 1` and `pan = {x: 0, y: 0}`. It did not calculate the bounds of the active province set, so the territorial center depended on the original projection rather than the usable map frame. The new national fit calculates active geographic bounds, applies padding in the 1000 x 560 view box, and centers the result. Reset and first load use that fit.

The old `april-thesis-map-view-v6` session record restored finite zoom and pan values without checking the current map-frame dimensions. A layout change, browser zoom, text scale, or opened panel could therefore restore a view that was valid for a different viewport. Phase Seven uses a version-7 record with the measured map-frame width and height, clamps zoom and extreme pan, discards malformed values, and rejects a restored view when either viewport dimension differs by more than 20 percent. The obsolete session key is removed.

Province paths and the root SVG previously split one gesture across two independent systems: the path used `click` for selection while the SVG immediately captured `pointerdown` for dragging. Small movement or browser click suppression could lose the selection, and a drag could still produce ambiguous feedback. The new gesture recognizer records the province under the initial pointer, applies a five-pixel drag threshold, selects on pointer release only when no drag occurred, and cancels selection after a pan. Keyboard selection remains available. Selection now has a persistent highlighted boundary, `aria-pressed`, a named live feedback card, and direct Open/Clear actions.

## Responsive-layout finding

The game shell used fixed desktop columns of 240 px / at least 420 px / 310 px, a 72 px header, and a 235 px workspace. At 800 px it explicitly forced `.game { min-width: 760px }`, while secondary rules still assumed 300 px side panels. Toolbars and setup controls also expected desktop-width rows. These rules were brittle under narrow windows, browser zoom, larger text, and open event or province panels.

Phase Seven removes the forced page width, progressively collapses the objectives panel below 900 px and the region panel below 700 px, reflows the header actions, keeps drawers inside the available width, makes docks horizontally navigable, stacks province detail at narrow sizes, and wraps setup/settings controls. Text scale is applied centrally from preferences on every screen and clamped to the supported 0.85-1.35 range.

## Beginner-experience finding

The first campaign setup led with a large documentary faction panel, six background cards, historical constraint, difficulty, seed, Guided Opening, and Ironman. The game header simultaneously exposed eight resource values, history/situation controls, and the full map appearance/mode/layer system. None of those systems was individually defective, but their simultaneous presentation obscured the basic loop.

Standard mode now uses the same campaign state and simulation as Expert mode while presenting essential resources and contextual controls first. Documentary context, advanced campaign rules, map layers, and secondary history controls are progressive disclosures. Expert mode restores all controls and statistics. Both modes can be changed in setup or Settings without restarting the campaign.

Quick Start launches a deterministic plausible-divergence, standard-difficulty, trade-union-organizer campaign with Standard detail, Guided Opening, normal saving, and the fixed `april-thesis-quick-start-march-1921-v1` seed. Custom Setup remains available.

## Save-policy finding

The old save migrator still reconstructed systems introduced across multiple prototype phases: political systems, operation history, character and institution fields, tutorial state, history snapshots, Situation Board, and Campaign History. Maintaining those partial schemas made save loading larger and less predictable than the current release needs.

Save version 7 intentionally supports only complete Phase Six saves (version 6) and current saves. Versions 1-5 return a clear restart message; imported files are retained by the existing quarantine path. IndexedDB schema version 3 deletes unsupported prototype records during upgrade, slot listing excludes them, and the active-session and map-state keys have both moved to version 7. The remaining version-6-to-7 migration updates envelope metadata and checksum only; it does not rebuild simulation state.

## Verification obligations

Phase Seven is not complete on static checks alone. The acceptance pass must include:

- GIS reconstruction and all six monthly gap/overlap masks.
- Lint, TypeScript, Vitest, assets, and production build.
- Direct click versus drag selection behavior.
- Reset, stored-view rejection, and map fit at 1280 x 720, 1024 x 768, 800 x 600, and 640 x 720, including enlarged text.
- Quick Start plus Standard and Expert visibility checks.
- Complete March-August browser playthroughs in both Standard and Expert mode, reaching an ending without extending the campaign.
