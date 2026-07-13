# Phase Three Audit

## Scope reviewed

The Phase Two React UI, cinematic, setup/title/archive screens, campaign store, shared save contracts, 28-region geometry/data, map engine, global styles, asset manifest, attribution, licenses, completion report, and continuation notes were reviewed before implementation. Baseline captures are stored in `docs/review-screenshots/phase-three-before/`.

## Visual findings

- The intro opening is almost entirely black, with a single red rule and two lines of copy. It claims wind, telegraph, and railway sound without playing those assets.
- The civil-war scene is a generated grid of 28 unrelated quadrilaterals and one horizontal line, not a geographic or historical composition.
- Newspaper cards share one masthead, paper treatment, size, and structure; the montage reads as repeated alert cards rather than competing publications.
- The congress is a bordered empty rectangle with twelve identical rounded silhouettes. It is not recognizable as a hall, dais, vote, or resolution scene.
- The faction meeting has text tags but no people, faction identity, dossier portraits, printing equipment, map, security report, or visual stakes.
- The title reveal is disconnected from the strategic map.
- The main map is a disconnected patchwork of hand-authored paths. The European cluster overlaps, the Caucasus is detached, Siberian shapes float, coastlines are absent, and no west/east/north context is legible.
- Region labels are always rendered at one tiny size. Labels collide around Moscow, Belarus, the Central Industrial Region, and the Baltic frontier.
- One centroid dot per region substitutes for real cities. There are no city records, rivers, railways, foreign territory, seas, ports, or mountains.
- The map has no zoom, pan, fit/reset, contextual-layer controls, or close-zoom detail.
- Political influence is rendered as large blurred circles behind flat region fills. It does not form a clipped, intelligible national surface.
- The top bar gives seven resources identical visual weight; bottom workspaces rely heavily on repeated cards, meter strips, and dense small text.
- Faction identity is a small kicker. Setup explains the player in one sentence but does not show leaders, status, strengths, weaknesses, or the central dilemma.
- National, faction, institution, regional, and vote information lacks data-driven charts or diagrams.
- Character records have no portrait or intentional fallback artwork. Institution cards do not show organizational relationships.
- Newspaper gameplay cards use nearly identical layouts and have no visual distinction for official, worker, foreign, or security sources.

## Asset and audio findings

- `assets-manifest.json` contains no assets.
- No images, portraits, local illustrations, or audio files ship.
- Attribution and license documents correctly say that no third-party media is bundled.
- The intro creates a looping random-noise Web Audio buffer. It has no centralized manager, no asset preloading, no scene cleanup, and no actual telegraph, railway, paper, press, stamp, telegram, meeting, factory, interaction, or warning sound.
- Existing volume preferences are durable but are not connected to real local audio categories.

## Information hierarchy

- The map, event drawer, both sidebars, seven top metrics, and eleven bottom tabs compete simultaneously.
- Important warnings are visually similar to routine records.
- Dense workspaces expose details immediately instead of using a chart/summary layer with expandable records.
- Small monospaced text is overused for body copy and data at laptop dimensions.

## Elements worth preserving

- Dark red, cream, ink, muted gold, paper, stamp, dossier, and constructivist motifs establish a strong identity.
- The paper event drawer and stamped monthly report are effective visual metaphors.
- Color/pattern redundancy, keyboard region selection, reduced motion, text scaling, captions, and semantic controls already provide a sound accessibility base.
- Sixteen map modes, uncertainty semantics, faction colors, all stable content IDs, deterministic simulation, and the March-August campaign should remain unchanged.

## Compatibility constraints

- All existing region, character, event, institution, law, operation, and publication IDs must remain stable.
- Region geometry may be replaced, but each region must continue to resolve to the same simulation record.
- Save version 2 campaigns must load. Phase Three history/chart data must use an additive migration with compact snapshots rather than saved campaign copies.
- Presentation state such as zoom and layer visibility must not influence deterministic campaign outcomes.
- Generated or sourced assets must be local, offline-capable, licensed, manifested, and fail gracefully.
