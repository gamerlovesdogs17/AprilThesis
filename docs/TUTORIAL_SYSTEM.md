# Tutorial System

## Two deliberately different modes

**GUIDED TUTORIAL** is a standalone main-menu command directly below New Campaign. It starts a deterministic March 1921 historical campaign as the Trade-Union Organizer with standard difficulty, seed `april-thesis-guided-tutorial-march-1921-v1`, ironman off, monthly autosave, beginner hints on, and `tutorialMode: guided_tutorial`.

**Guided Opening** remains an ordinary campaign-setup option. It preserves the player’s chosen background, seed, difficulty, simulation mode, and ironman setting and uses `tutorialMode: guided_opening`. It is not described as the complete tutorial.

## Persisted 21-step sequence

1. Identify the Workers’ Opposition.
2. Understand the organizer role.
3. Identify Kollontai, Shliapnikov, and Medvedev.
4. Understand the Tenth Congress faction ban.
5. Read the national atlas.
6. Select a dated historical province.
7. Enter the dedicated province atlas.
8. Inspect a local city or organizational site.
9. Open faction management.
10. Assign an organizer.
11. Enter Regional Operations and start real work.
12. Read success and detection risk separately.
13. Compare exposure with security.
14. Open a character dossier.
15. Inspect an institution.
16. Review a policy proposal.
17. Resolve a narrative event.
18. Advance to Consequences.
19. Review the March consequences.
20. Create a manual save.
21. Advance into April and finish the round.

Required interactions write named entries to `tutorialMilestones`; Next remains disabled until the relevant milestone exists. Tutorial step, completion, pause state, milestones, and end-panel state are campaign data and survive active-session reload and save/load. Save version 5 migrates older campaigns additively and derives `tutorialMode` from the old boolean where necessary.

Close pauses. Escape pauses. Skip completes without showing the end panel. Normal completion presents Continue this campaign, Start a normal new campaign, Restart tutorial, and Return to main menu. Tutorial saves display a badge in the save manager.

The active decision begins minimized in the structured tutorial so the atlas remains readable. It opens automatically at the event lesson. Beginner hints remain a separate system with Off, First campaign only, and Every campaign modes.
