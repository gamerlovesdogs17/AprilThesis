# Province Detail View

Province detail is a geographic local atlas of the selected province, not a reused decorative inset.

- Exterior and neighboring outlines use the detailed shared-topology province export.
- Subordinate district paths come from the 646-feature reconstructed uyezd layer. When none are supported, the UI states that detail is unavailable and draws no fake divisions.
- Cities use exact `provinceId` membership. The Moscow atlas therefore shows Moscow, not every city in the Moscow strategic aggregate.
- Rivers and railways are actual source geometries intersected with and attributed to the province. Moscow currently shows four trunk-rail segments and 148 source-way segments of the Moskva River.
- The 24 authored sites carry longitude, latitude, province ID, type, date range, source IDs, and a `documented`, `historically_plausible_composite`, or `player_created` classification.
- Operations, organizers, influence nodes, neighboring provinces, and formal-government context are read from current campaign state.

Raw source IDs remain outside ordinary play. The atlas exposes historical/composite classification and boundary confidence; full identifiers belong to Research Notes, credits, and these documents.
