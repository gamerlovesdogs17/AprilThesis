# Cartographic Sources

Phase Six treats the map as a reproducible historical-GIS reconstruction. Browser play uses only committed local exports; no map service is contacted at runtime.

| Source ID | Repository and date | License / rights | Pipeline use |
| --- | --- | --- | --- |
| `iish-ristat-1897-gis-v3.3` | [IISH Dataverse / RiStat, Russian Empire Historical GIS Maps (1897)](https://datasets.iisg.amsterdam/dataset.xhtml?persistentId=hdl%3A10622%2FDN9QDM), cleaned GeoPackages published 17 December 2021 | CC0; dataset requests citation | Primary province and uyezd vectors. Cached MD5: provinces `db5cea09836b4971da087e711bff9587`; districts `c4aa427798360f0b4b3d9818a7c5654f`. |
| `troitsky-nkvd-1921` | [Russian National Library / National Electronic Library, schematic RSFSR administrative map](https://rusneb.ru/catalog/000200_000018_RU_NLR_cart_8873/), 1921, information to 10 December 1920 | Public-domain historical cartographic reference | Main dated verification for RSFSR governorates, autonomous units, and railway routing. |
| `loc-rsfsr-1922` | [Library of Congress, Russian Socialist Federated Soviet Republic](https://www.loc.gov/resource/g7001f.ct007695/), 1922 | No known restrictions stated by LOC | Near-contemporary check for autonomous, Siberian, Central Asian, and Far Eastern administrative context. |
| `natural-earth-rivers-5.0.0` | [Natural Earth 1:50m Rivers and Lake Centerlines](https://www.naturalearthdata.com/downloads/50m-physical-vectors/50m-rivers-lake-centerlines/), version 5.0.0 | Public domain | National river foundation, clipped province by province. Cached SHA-256 `f286e0ce978fde999ca2d7a78c764be08542e19b63cded52b05c12d5173ccc51`. |
| `openstreetmap-moskva-river-2026-07-13` | [OpenStreetMap waterway relation 389341](https://www.openstreetmap.org/relation/389341), Overpass snapshot at 2026-07-13T22:19:45Z | ODbL 1.0; attribution to OpenStreetMap contributors | Modern hydrographic positional reference for the documented Moskva River, omitted at Natural Earth's national scale. Never used for an administrative boundary. Cached SHA-256 `423ce5d198a75361827eb66c7ecf5db5d766020c6efeb79a07a5e886f8112e69`. |

## Reconstruction policy

The 1897 layer is not relabeled wholesale as 1921. `province-changes-1921.json` selects real province or district features and applies dated `retain`, `rename`, `split`, `merge`, `transfer_district`, and `create_external_unit` operations. Low-confidence lines are disclosed and retain district-scale uncertainty. No production province accepts coordinate bounds, centroid cells, Voronoi geometry, or strategic-region clipping.

Separate dated references for Ukraine, the Caucasus, Central Asia, and the Far Eastern Republic are recorded as source IDs on affected rules. Their current use is documentary verification at small scale; where the vector foundation cannot express a sub-uyezd treaty or control line, the register says so explicitly rather than inventing precision.

## Historical limits

- IISH source geometry describes 1897 units; every post-1897 administrative change is an authored historical interpretation.
- Whole-uyezd dissolves cannot reproduce every canton, treaty, occupation, or sub-uyezd adjustment.
- Natural Earth and OSM describe physical centerlines, not 1921 administrative authority.
- The small-scale railway layer is a documented route digitization, not a track-level engineering survey.
- Specialist archival review is still desirable for the western treaty frontiers, Mountain and Bashkir internal divisions, the Georgian-Armenian-Azerbaijani frontier, and Japanese-occupied Sakhalin context.
