# Historical Province Map

## Source basis

- P. Troitsky, *Схематическая административная карта РСФСР* (Moscow, 1921), compiled from NKVD data as of 10 December 1920, Russian National Library / National Electronic Library. Primary naming and unit basis for RSFSR governorates and autonomous units.
- Lawrence Martin and the U.S. Army Military Intelligence Division, *Russian Socialist Federated Soviet Republic 1922*, Library of Congress Geography and Map Division. Near-contemporary comparison for western administrative and nationality-based units.
- A dated synthesis of Ukrainian administrative divisions, 1918–1925, for the March 1921 Ukrainian governorate state.
- A historical registry of Far Eastern Republic divisions, 1920–1922, for the FER oblast structure.

Each `HistoricalProvince` records source IDs and a high, medium, or low confidence value. Temporal changes are represented with `validFrom` and optional `validUntil`; the renderer activates records against `campaign.currentDate`.

## Coverage

The dataset contains 88 active or transitional units covering the Baltic republics, RSFSR governorates and autonomous formations, the Ukrainian and Belorussian territories, Crimea, Volga and Don regions, the Caucasus, Urals, Kirghiz ASSR/Kazakh provinces, Turkestan, Siberia, Yakutia, and the Far Eastern Republic.

## Geometric method and limitation

The current GeoJSON is a deliberately generalized display layer. It is projected with the game’s existing national projection and clipped to hidden strategic aggregates to prevent visual leakage. It supports selection, dating, source display, confidence disclosure, and a coherent separation between historical administration and simulation state.

It does not claim survey precision. Exact control-point tracing from high-resolution scans remains a possible archival refinement. The map itself labels this limitation, and no strategic aggregate line is presented to the player as a historical provincial boundary.
