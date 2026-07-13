# Regional Geography

The campaign uses 28 stable strategic composites, not a cadastral reconstruction of one 1921 administrative date. Natural Earth supplies public-domain exterior context; `packages/content/src/geography.ts` authors the selectable strategic topology.

## Phase Four topology

Every selectable polygon now participates in a derived shared-boundary graph. `validateStrategicGeography()` checks expected IDs, duplicate IDs, self-intersections, strict polygon overlaps, broken/asymmetric derived adjacency, projection bounds, and whether every city point lies inside its assigned gameplay region. The runtime uses the derived graph rather than the older hand-authored neighbor list.

The central and southern composites were redrawn so Western Russia, Ukraine, Crimea, the Volga, Caucasus, Urals, Siberia, Central Asia, and the Far East read as one connected strategic surface. Kharkov is assigned to the Central Ukraine composite because its coordinate lies inside that revised theater; the city ID and every simulation region ID remain unchanged.

## Limits

- Boundaries aggregate guberniyas, republics, operational theaters, and communication regions.
- The Baltic Frontier and Far Eastern Republic context are deliberately schematic.
- Siberia, Kazakhstan, and Turkestan remain heavily aggregated; Caucasus polygons are enlarged for interaction.
- Rivers and railways are generalized lines. Local factory, rail, port, union, security, and garrison symbols are derived from authored city importance and current campaign metrics, not a site-by-site archival gazetteer.
- Topology validation proves internal consistency, not historical accuracy. Specialist cartographic review remains appropriate.
