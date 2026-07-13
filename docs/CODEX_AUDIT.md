# Codex Audit: Phase Two

## Starting point

Phase One had already restored a sound npm-workspaces architecture, repaired the React/Vite/TypeScript build, and created a playable map-centered March-August loop. Its remaining weakness was political depth: laws, institutions, characters, faction strength, and the June decision were mostly observational or event-driven.

## Phase Two diagnosis

- The June vote exposed only an aggregate estimate and could not model lobbying or named decisions.
- Laws had no direct proposal route outside narrative choices.
- Organizers were abstract capacity rather than people who could be assigned, tired, exposed, arrested, or recovered.
- Internal faction differences had no durable leaders, preferences, red lines, satisfaction, or split risk.
- Institutions and characters displayed state but did little independently.
- Operations did not explain phase/skill/intelligence gates or calculate organizer-specific success and detection.
- Save export/import helpers lacked a complete manager and invalid imports lacked quarantine UX.
- Map modes, influence rendering, newspapers, setup enforcement, and tutorial guidance required completion.

## Architectural decision

The content/simulation/UI split was retained. Political rules live in `packages/simulation/src/politics.ts`; durable contracts live in `packages/shared-types`; existing content definitions remain authoritative; Zustand coordinates UI actions without moving simulation rules into components. Save migration is centralized in `packages/simulation/src/save.ts`.

This keeps seeded outcomes reproducible, makes old saves migratable, and lets tests exercise systems without a browser.

## Implemented system boundaries

- **Political simulation:** organizers, blocs, delegates, proposals, lobbying, roll call, institution actions, autonomous agendas, event eligibility, and monthly political updates.
- **Campaign/turn simulation:** historically differentiated government labels, background effects, operation completion, cooldowns, exposure/detection, arrests, releases, and histories.
- **UI:** 16 map modes, influence field, management panels, delegate board, laws, institutions, characters, newspaper filters/contradictions, guided callouts, and reason-bearing disabled actions.
- **Persistence:** save version 2, migration, duplicate/export/import/delete, checksum checks, quarantine, and ironman slot behavior.
- **Verification:** 19 passing Vitest tests, lint/type/build/asset validation, 11 authored Playwright scenarios, and a full manual March-August browser campaign.

## Remaining debt

- The map deliberately favors strategic readability over archival boundary accuracy.
- The June vote is a transparent composite model, not a recovered historical roll call.
- The 1921-1924 campaign beyond the September chapter outcome remains a later content phase.
- More granular interrogation, imprisonment, exile, relationship, and regional press chains would deepen the systems without changing their architecture.
- A dedicated assistive-technology audit and a successful run of the expanded Playwright suite remain advisable.
