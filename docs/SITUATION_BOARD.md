# Monthly Situation Board

The Situation Board is a compact briefing generated from live campaign values. It does not invent decorative alerts.

- **Urgent crises:** the highest famine, strike, and security-pressure states.
- **Political opportunities:** the strongest union base, best available character relationship, and best current institutional route.
- **Political movement:** recorded character and institutional actions, the most changed province, and the active proposal, vote, or event.

Every item stores a compact typed link to a province, character, institution, event, law, operation, or newspaper. Following a province item selects the mapped historical province; other items open the matching workspace or dossier. Players can pin one item, close the board, dismiss it for the month, reopen it from the top bar, or disable automatic display in Settings.

The saved `SituationBoardState` is additive schema version 1. It contains the month, generated turn, dismissal and pin state, and compact item summaries—never duplicated map geometry or campaign snapshots.
