# Audio Implementation

Four ambience loops, six cinematic effects, three interface cues, and seven score files are generated locally by `scripts/generate-audio-assets.mjs`. The score contains a 128-second menu theme, 192-second planning theme, 126-second political-tension theme, 116-second humanitarian theme, and three 28-second outcomes. These are original deterministic synthesis, not Soviet songs, anthems, film music, or copied melodies.

`audioManager.ts` maps title, campaign, crisis, vote, famine, and three ending contexts to music cues. A 16-step gain crossfade changes context without restarting the current track. Opening Settings or Archive leaves the campaign component and playback position mounted. Master/music/ambience/interface volume, mute, preload, gesture activation, duplicate-loop protection, missing-asset containment, and offline playback are supported.

When the document becomes hidden, playing elements pause and only those elements resume when visibility returns. Reduced motion affects visuals, not essential audio controls. Captions describe cinematic cues, and muted play remains fully usable.

Unit tests cover activation, channel multiplication, mute, duplicate loops, cleanup, rejected-file fallback, adaptive crossfade, same-context reuse, and hidden-tab pause/resume. A human mastering/listening pass remains on the acceptance checklist.
