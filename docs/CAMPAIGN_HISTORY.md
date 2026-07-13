# Campaign History

Campaign History is a compact event-reference strip. Store actions append deduplicated entries for decisions, votes, policy proposals, institutional approaches, operations, newspapers, character status changes, laws, and material regional shifts.

Each entry contains an ID, date, icon, title, category, one typed object link, related object IDs, known consequence strings, and a historical classification. The strip retains at most 120 entries and never serializes a full campaign-state copy. Selecting an entry reveals its known consequences; **Reopen related…** focuses the linked province, dossier, workspace, law, operation, or newspaper.

`CampaignHistoryState` is additive schema version 1. Phase Five saves migrate to save version 6 with an empty history and a Situation Board derived from the migrated live state.
