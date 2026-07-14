# Phase Seven Review

Date: 2026-07-13

## Outcome

Phase Seven is implemented. The March-August 1921 campaign remains unchanged in duration and political balance, but the geographic model, map interaction, responsive shell, onboarding path, and save compatibility boundary are now explicit and testable.

## Map integrity

- Akmolinsk is a stable geographic partition for the whole campaign. In March it is displayed as the Akmolinsk uyezds of Omsk Governorate under Sibrevkom/RSFSR; from 25 April it is Akmolinsk Province of the Kirghiz ASSR.
- The Komi partition is stable for the whole campaign. It is administered through Arkhangelsk and North Dvina through July and becomes the Komi-Zyryan Autonomous Oblast on 22 August.
- March, April, May, June, July, and August use an identical 95-unit territorial mask.
- Validation reports zero overlaps above 1 km², zero invalid active provinces, zero monthly mask changes above 5 km², complete administrative coverage, 650 district features, and 84 formal-government records (14 monthly surfaces across six snapshots).
- The map does not use decorative gap patches. Territory and administration are separate source-backed date models.

## Map usability

- Full Map computes and applies a padded fit from the active province bounds rather than forcing 100 percent zoom at projection origin.
- Stored map views are versioned with their viewport dimensions. Malformed, extreme, obsolete, or dimension-incompatible views reset to the current national fit.
- A single pointer recognizer distinguishes click from drag at a five-pixel threshold. Province selection occurs on release only when the gesture did not pan.
- Selection feedback includes persistent boundary emphasis, `aria-pressed`, a live named card, and direct Open/Clear actions.
- Visual acceptance captures exist at 1280 x 720, 1024 x 768, 800 x 600, and 640 x 720 in `docs/review-screenshots/phase-seven-after/`.
- Visual inspection of the compact captures found and corrected setup-to-game scroll retention that had clipped the header. The final images show the complete date/resources header, contained event drawer, fitted national geography, and scroll-contained workspace.

## Standard and Expert experiences

Both modes use the same `CampaignState`, events, political systems, deterministic RNG, and ending evaluation.

Standard is the default. It emphasizes the date, three essential indicators, Situation Board, map selection, and the next-phase control. Map overlays, documentary context, advanced setup rules, and secondary history controls are available through progressive disclosure.

Expert exposes all resource, appearance, map-mode, overlay, and history controls immediately. The mode can be changed in setup or Settings without changing campaign state.

Quick Start launches the fixed `april-thesis-quick-start-march-1921-v1` seed with plausible divergence, standard difficulty, Trade-Union Organizer, Guided Opening, Standard detail, normal saving, and the unchanged March 1921 start.

## Responsive behavior

- Removed the forced 760 px game width and fixed three-column assumptions.
- The objectives panel collapses below 900 px; the region panel collapses below 700 px.
- Header actions reflow into an explicit second row, drawers remain inside the viewport, the command dock remains horizontally navigable, and province detail stacks at compact sizes.
- Text scaling is applied centrally and clamped to 0.85-1.35. The 800 x 600 acceptance case passes at 1.35 scale without page-level horizontal overflow.
- Every screen transition resets the document scroll offset so a long setup or auxiliary page cannot displace the fixed game shell.

## Save reset

- Save version is 7; IndexedDB schema version is 3.
- Complete Phase Six saves (version 6) migrate by updating envelope metadata and checksum only.
- Prototype versions 1-5 are intentionally unsupported and return: `Prototype saves from before Phase Six are no longer supported. Start a new campaign.`
- Imported unsupported files use the existing quarantine path. IndexedDB upgrade deletes unsupported records, save-slot listing filters them, and the active-session and map-view storage keys are version 7.
- The prior multi-phase field reconstruction code has been removed.

## Campaign playability review

Two browser-driven click-by-click campaigns were completed from March through August with the fixed `phase-seven-complete-campaign` seed and the same risk-controlled sequence of event decisions:

1. Standard interface detail reached August 1921 and the `Reformist Victory` ending.
2. Expert interface detail reached August 1921 and the identical `Reformist Victory` ending.

Each campaign traversed all five monthly phases, resolved the available dated event dossiers, advanced all six campaign months, set the August chapter-complete flag, displayed a real ending rather than the fallback heading, and rendered the final ledger. This verifies that interface detail changes presentation rather than simulation results. The campaign did not advance beyond August.

## Verification

- GIS reconstruction and all six monthly mask checks: pass.
- Workspace lint: pass.
- TypeScript across all workspaces: pass.
- Vitest: 47/47 pass (19 web, 7 map-engine, 21 simulation).
- Asset validation: pass, 38 canonical assets.
- Production build: pass.
- Chromium: 54/54 scenarios pass, including six Phase Seven acceptance scenarios and both complete campaigns.

Known research limits remain unchanged: treaty-scale western frontiers, Mountain and Bashkir internal divisions, Transcaucasian disputes, and Sakhalin occupation context would benefit from finer specialist digitization. These are documented confidence limits, not holes in the March-August territorial mask.
