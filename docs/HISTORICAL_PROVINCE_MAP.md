# Historical Province Map

## Source basis

The primary vector foundation is the IISH/RiStat *Russian Empire Historical GIS Maps (1897)* province and district dataset. The 1921 Troitsky/NKVD schematic administrative map and the Library of Congress 1922 RSFSR map supply dated documentary checks. Region-specific source IDs are attached to affected Ukraine, Caucasus, Central Asia, Baltic, and Far Eastern Republic rules.

Each `HistoricalProvince` records original province or district IDs, an operation, sources, confidence, validity, formal government, strategic parent, and uncertainty note. Temporal changes are month-sliced against the campaign date.

## Coverage

The dataset contains 96 active or transitional units covering the Baltic republics, RSFSR governorates and autonomous formations, Ukrainian and Belorussian territories, Crimea, Volga and Don regions, the Caucasus, Urals, Kirghiz ASSR/Kazakh provinces, Turkestan, Siberia, Yakutia, and the Far Eastern Republic. Ninety-three are active in March 1921.

## Geometric method and limitation

GeoJSON and shared-arc TopoJSON are deterministic dissolves of real IISH province and uyezd features selected by `province-changes-1921.json`. Neighboring administrative features share topology. Strategic aggregates are optional province dissolves and never clip province paths.

The reconstruction does not claim cadastral precision. Whole-uyezd operations leave documented uncertainty where 1921 changes cut below district scale. Exact rule details are in `PROVINCE_RECONSTRUCTION_1921.md`; source provenance is in `CARTOGRAPHIC_SOURCES.md`.
