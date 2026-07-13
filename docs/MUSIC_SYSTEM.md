# Music System

The Phase Four score is original deterministic PCM synthesis and is fully local.

| Context | File | Approximate length |
| --- | --- | --- |
| Title/menu | `main-menu-theme.wav` | 2:08 |
| Campaign planning | `campaign-planning.wav` | 3:12 |
| Political crisis/vote | `political-tension.wav` | 2:06 |
| Famine/emergency | `humanitarian-crisis.wav` | 1:56 |
| Hopeful ending | `outcome-hopeful.wav` | 0:28 |
| Ambiguous ending | `outcome-ambiguous.wav` | 0:28 |
| Defeat ending | `outcome-defeat.wav` | 0:28 |

The generator combines low sustained triads, sparse decaying piano-like notes, slow breathing modulation, restrained industrial pulses, and optional dissonance. It intentionally avoids known tunes.

The manager starts playback only after browser activation. Context changes create the next local audio element at zero gain and crossfade both elements over 16 steps (1.2 seconds by default). Re-requesting the current context does not restart it. Overlay navigation does not unmount or rewind campaign music. The document visibility handler pauses active elements in a hidden tab and resumes only those elements on return.

All channel volume is `master × channel × transition scale`; mute forces zero without destroying cue state. A short Web Audio fallback exists only for rejected interface effects, not for score replacement.
