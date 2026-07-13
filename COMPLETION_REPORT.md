# Completion Report: Phase Four Candidate

## Outcome

The requested Phase Four systems are implemented inside the campaign: persisted onboarding, exact-return overlays, a validated strategic map and label hierarchy, grouped workspace, resizable event dossiers, verified portraits, honest faction branding, sustained adaptive music, restrained idle motion, and responsive intro overrides.

The work preserves every simulation-facing region, character, event, operation, institution, law, and publication ID. Save migration is additive and seeded resolution code was not rebalanced.

## Verification completed

- Workspace lint and all six TypeScript workspaces pass.
- Vitest passes for simulation, content, audio, tutorial, and map-engine coverage.
- Asset validation passes for one canonical 36-record manifest.
- The production build passes.
- The Playwright suite parses and lists 42 scenarios, including the Phase Four acceptance matrix.
- Baseline Chromium automation completed all 27 pre-change scenarios before teardown; the managed runner then timed out during shutdown.

## Not yet honestly complete

The managed in-app browser later rejected the local application URL under its security policy. The Phase Four Playwright scenarios and after-screenshot pack therefore were not executed in this run, and a manual March–August campaign was not completed after the changes. `docs/review-screenshots/phase-four-before/` contains the baseline evidence; the updated capture scenario targets `docs/review-screenshots/phase-four-after/` when browser execution is available.

Because the brief explicitly requires those visual and full-playthrough checks, this report calls the result a **Phase Four candidate**, not final completion. The exact remaining commands and manual matrix are recorded in `docs/PHASE_FOUR_REVIEW.md` and `docs/TODO_NEXT.md`.
