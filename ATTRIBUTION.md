# Attribution

APRIL THESIS is offline-capable. Every distributed media or geographic source is stored locally and recorded in `apps/web/public/assets/assets-manifest.json`.

## Geographic context

The low-resolution surrounding land context derives from Natural Earth's `ne_110m_admin_0_countries` dataset. Natural Earth data is public domain. The game uses a simplified projected extract as context; the 28 selectable strategic regions remain original gameplay composites and are not claimed as archival administrative boundaries.

- Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson
- Terms: https://www.naturalearthdata.com/about/terms-of-use/
- Creator: Natural Earth contributors
- License: public domain

## Original game illustration

`apps/web/public/assets/illustrations/congress-hall-reconstruction.png` is an original artistic reconstruction generated for APRIL THESIS with OpenAI image generation under project direction. It is labeled "Original artistic reconstruction" in the cinematic and is not represented as a historical photograph.

Generation brief: wide cinematic painterly reconstruction of a crowded 1921 political congress hall, central dais, delegates raising papers, period clothing and warm smoky light, no readable text, no copied poster or photograph composition.

## Original generated audio

The fourteen PCM WAV files under `apps/web/public/assets/audio/` were generated deterministically by `scripts/generate-audio-assets.mjs`. They are original synthesized game assets, not field recordings or copied music. Categories cover winter wind, railway, factory, meeting room, telegraph, printing press, paper, typewriter, stamp, telegram, dossier, map selection, political warning, and title cue.

## Code-native visual work

Strategic region geometry, projection code, rivers, rail paths, faction symbol, dossier silhouettes, charts, newspaper treatments, map layers, patterns, and cinematic motion are original TypeScript, SVG, and CSS. System font fallbacks are used; no font files are bundled.

Historical source links in `docs/HISTORICAL_BASELINE.md` support dates and gameplay interpretations but are not distributed media.
