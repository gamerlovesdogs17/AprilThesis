# Tutorial System

The tutorial is persisted campaign state, not a transient paragraph. It uses `tutorialStep`, `tutorialComplete`, and `tutorialPaused`; save version 4 migrates older envelopes without resetting existing completion state.

## Sequence

1. Identify the Workers' Opposition.
2. Explain the player's organizer role.
3. Show the five monthly phases.
4. Select a strategic region.
5. Explain zoom and drag.
6. Change map modes and read the legend.
7. Open Organization.
8. Assign an organizer.
9. Review a regional operation.
10. Explain exposure and security.
11. Open a character dossier.
12. Inspect an institution.
13. Inspect a policy proposal.
14. Explain limited political actions.
15. Resolve a narrative event.
16. Advance phases.
17. Save the campaign.
18. Advance from March into April.

Each step has a DOM target, placement, progress bar, Back, Next, Close, and Skip. View-specific steps open the correct command group; assignment/operation steps select Petrograd if no region is selected; collapsed sidebars/workspaces reopen when their target is required; a minimized event reopens for its tutorial step. The final step cannot complete until the campaign reaches turn two.

Close pauses without marking completion. Skip marks the tutorial complete. Settings can restart at step one. Escape closes/pauses. Active-session and save persistence resume the same step after reload or load.

## Beginner hints

Hints are a separate system. Modes are Off, First campaign only, and Every new campaign. At most one phase-relevant hint appears, tutorial steps suppress hints, ordinary dismissal is per campaign, and “Do not show this again” writes the hint ID to user preferences. Settings can restore hidden hints.
