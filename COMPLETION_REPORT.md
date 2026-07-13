# Completion Report: Phase Two

## Outcome

The March-August 1921 vertical slice now has functioning political systems instead of passive information panels. A campaign can be configured, played through all six months, and resolved at the September chapter outcome. The original longer 1921-1924 concept is intentionally outside this phase.

## Implemented

### Named people and political organization

- Eight named fictional-composite organizers have organizing, security, speaking, and research skills; traits; fatigue; exposure; assignment; knowledge; and available, assigned, arrested, recovering, or exiled status.
- Eight internal blocs have named leaders, support, satisfaction, policy preferences, red lines, underground willingness, split risk, relationship notes, and monthly drift.
- Faction management has a limited monthly action economy for assignment, cell protection, printing, meetings, institutional work, rest, and budget allocation.
- Fifteen historical characters now carry agendas, pressure, availability, action history, secrets, relationships, memory, and autonomous monthly behavior.

### Named June vote

- The June Central Committee labor-policy composite is resolved delegate by delegate across 28 named historical or fictional-composite participants.
- Each delegate exposes office/constituency, bloc, lean, confidence, reliability, concerns, relationship influence, lobbying history, and recorded vote.
- Meet, mandate, and concede actions have visible costs and consequences. The board reports the threshold, support/oppose/abstain tally, confidence, roll log, and final decision.
- Resolution is deterministic for a saved campaign seed and applies the linked policy outcome.

### Direct policy and institution play

- Players can directly campaign for Mandatory Union Consultation, Factory Committee Co-Management, and a Protected Internal Party Press.
- Proposal support, opposition, campaign investment, political-action costs, immediate effects, and ongoing monthly law effects are visible.
- All eight institutions expose attitude, autonomy, agenda, current business, contacts, relationship, and last action. Institution actions consume the same limited political economy.

### Operations, map, and information

- Fifteen regional operations now require the correct phase, resources, cooldown, and sometimes organizer skills or intelligence.
- Assigning an organizer changes visible success/detection chances. Completion can create persistent regional effects, fatigue/exposure, arrest, release, and history entries.
- The map has 16 selectable modes, complete legends, uncertainty treatment, formal-government labels, and a toggleable blurred influence field.
- Ten publications support publication/region/topic filters, suppression markers, official-versus-factional contradictions, and links to related entities.
- Event choices are disabled with explicit reasons when setup, state, or historical-rail requirements are not met.

### Saves and continuity

- Save format 2 adds political state with migration from older envelopes.
- The archive supports manual save/load, continue-latest, rotating autosaves, duplicate, export, import, delete, checksum validation, and quarantine of rejected imports.
- Ironman uses one protected campaign slot and blocks duplication/deletion in the manager.

### Guidance and accessibility

- Contextual guided-opening callouts point players toward faction, party, laws, institutions, and operations without blocking normal play.
- Existing keyboard map selection, visible focus, semantic controls, reduced motion, captions, text scaling, pattern redundancy, and colorblind support were preserved.

## Verification

- `npm run lint`: passed.
- `npm run validate:all`: passed.
  - Workspace TypeScript checks passed.
  - 19 Vitest tests passed: 14 simulation, three map-engine, and two content tests.
  - Asset validation passed with no untracked public files.
  - Production build passed: 347.41 kB JavaScript (107.46 kB gzip) and 24.03 kB CSS (6.02 kB gzip).
- Manual in-app browser playthrough passed from campaign setup through the September ending. It covered setup gating, faction actions, organizer assignment, operation chances/results, 16 map modes, direct laws, institutions, newspapers, 28 delegates, lobbying, the named roll call, and March-August progression.
- The final browser page had no current-page errors or warnings. One retained developer-log entry belonged to an earlier stopped Vite tab on port 5173, not the tested port 4174 campaign.
- Eleven Playwright scenarios are authored. Their final Chromium launch was not executed because the environment's escalation approval service rejected the launch request while its reviewer model was unavailable. They can be run locally with `npm run test:e2e`.

## Historical handling

Historical rails preserve the adoption of the Tenth Congress unity resolution while allowing plausible strategic responses. Formal government labels distinguish the RSFSR, Soviet republics, autonomous republics, and the Far Eastern Republic instead of flattening the map into a later USSR. The June roster and resolution are explicitly labeled as a composite simulation; names and numeric regional influence are not presented as archival measurements.

## Backend and assets

No backend was added. Campaigns and saves are deterministic, local-first, and offline-capable. No third-party portraits or recordings ship; the presentation uses original CSS, SVG geometry/patterns, and procedural audio.

## Known limits

- The strategic map is an abstract operational diagram, not researched administrative boundary geometry.
- The long 1921-1924 campaign is not authored beyond this completed chapter.
- Character secrets, imprisonment, exile, and organizer interpersonal conflict can be deepened further.
- The composite June decision should not be mistaken for a literal documented roll call.
- A dedicated screen-reader audit and formal performance trace remain follow-up work.

See `docs/TODO_NEXT.md` for post-Phase-Two continuation ideas.
