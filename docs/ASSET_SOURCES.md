# Asset Sources

The canonical machine-readable record is `apps/web/public/assets/assets-manifest.json`. `npm run validate:assets` rejects missing manifest fields, missing files, unverified external records, and untracked public files.

| Asset group | Local path | Origin | License/status |
| --- | --- | --- | --- |
| Country context | `assets/map/natural-earth-admin0-110m.geojson` | Natural Earth vector repository | Public domain; verified |
| Congress reconstruction | `assets/illustrations/congress-hall-reconstruction.png` | Original OpenAI-generated artwork directed for this project | Original artistic reconstruction; verified |
| Ambience | `assets/audio/ambience/*.wav` | Deterministic repository generator | Original generated audio |
| Cinematic effects | `assets/audio/cinematic/*.wav` | Deterministic repository generator | Original generated audio |
| Interface cues | `assets/audio/interface/*.wav` | Deterministic repository generator | Original generated audio |
| Title cue | `assets/audio/music/title-cue.wav` | Deterministic repository generator | Original generated audio |

## Reproduction

- Rebuild map context: `node scripts/build-map-context.mjs`
- Rebuild WAV assets: `node scripts/generate-audio-assets.mjs`
- Verify the public tree: `npm run validate:assets`

## Visual provenance

All other visible elements are code-native original work: 28 gameplay-region polygons, projection and adjacency records, city/river/rail overlays, map influence contours, faction symbol, designed dossier silhouettes, charts, newspapers, captions, and cinematic motion.

The congress prompt and labeling are recorded in `ATTRIBUTION.md`. The image is never called a photograph. No portrait fallback is called a likeness.
