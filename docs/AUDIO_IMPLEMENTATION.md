# Audio Implementation

## Asset set

Fourteen local PCM WAV assets cover four channels:

- ambience: winter wind, distant railway, factory floor, meeting room;
- cinematic: telegraph, printing press, paper movement, typewriter, stamp, telegram;
- interface: dossier open, map select, political warning;
- music: restrained title cue.

The files are deterministic outputs of `scripts/generate-audio-assets.mjs`. No runtime randomness, network request, copied recording, or copyrighted music is required.

## Manager

`apps/web/src/audio/audioManager.ts` owns cue metadata, activation, channel volume, mute, preload policy, loop reuse, short duplicate suppression, one-shots, scene transitions, fades, and teardown. It returns safely when `Audio` is unavailable.

If a local file rejects during playback, the manager removes the failed element and attempts a very short deterministic Web Audio cue as a low-fidelity fallback. The fallback oscillator stops after 120 ms and closes its context; it never replaces the normal asset set or leaves an audio context running after the cinematic.

Playback starts only after a user gesture. The cinematic's enable-audio control activates the manager; settings expose master, music, ambience, and interface values plus mute and preload policy. Scene changes stop obsolete loops, and component cleanup pauses and rewinds every tracked element.

## Caption contract

Cinematic captions describe the sound that is actually requested for the current scene. When audio is disabled, the caption says so rather than claiming unheard effects. Reduced-motion mode remains usable without audio.

## Verification

Unit tests cover gesture activation, master/channel volume multiplication, mute, duplicate loop prevention, and cleanup. Asset validation records and verifies all WAV paths. The browser suite requests every manifest asset from the local server.
