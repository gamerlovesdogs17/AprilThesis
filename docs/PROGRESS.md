# Progress

## Phase Two complete

- Preserved and extended the npm-workspaces architecture, seeded simulation, content schemas, March opening, and local-first campaign.
- Enforced setup choices for background, difficulty, historical constraint, seed, tutorial, and ironman.
- Expanded the strategic map to 16 working modes with formal government labels, full legends, uncertainty, and a toggleable influence field.
- Added eight named organizers, eight internal blocs, limited faction actions, assignments, protection, printing, meetings, budget allocation, fatigue, exposure, arrests, releases, and monthly drift.
- Replaced the June estimate with a 28-delegate named composite roll call, three lobbying methods, delegate histories, abstentions, threshold, tally, and deterministic resolution.
- Added three direct policy proposals with campaign costs, opposition, immediate effects, and ongoing monthly law effects.
- Made all eight institutions and 15 characters active through agendas, attitudes, relationships, pressure, communications, and autonomous monthly actions.
- Added transparent operation eligibility, organizer-skill and intelligence inputs, success/detection chances, cooldown/history, and persistent results.
- Expanded newspapers to ten publications with filters, suppression status, contradictory official/factional accounts, and entity links.
- Upgraded saves to version 2 with migrations, manual/autosave/ironman behavior, continue-latest, duplicate, export/import, delete, checksum validation, and quarantine.
- Authored 11 Playwright campaign scenarios and expanded the automated unit/integration suite to 19 tests.

## Verification status

- `npm run lint`: passing.
- `npm run validate:all`: passing; all 19 Vitest tests, asset validation, type checking, and production build passed.
- Full in-app browser playthrough: passing from setup through the September chapter outcome, including a named June vote and March-August event/turn flow.
- Current Playwright suite execution still requires a successful local Chromium launch; the final environment's browser-launch approval service did not execute that command. The 11 scenarios remain available through `npm run test:e2e`.
