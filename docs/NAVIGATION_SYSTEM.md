# Navigation System

Settings, Archive, and Credits open as modal overlays when invoked from a campaign. `GameScreen` stays mounted beneath them, so campaign phase, current event, selected region/character, map view, command group/tab, tutorial state, and adaptive music playback are not reconstructed.

Opening an overlay pushes one browser-history entry. Browser Back, Escape, and the visible Return to campaign button all close that layer first. From title/setup, the same screens remain ordinary full-page destinations and Back returns to their recorded origin.

Settings distinguishes three exit actions:

- Return to campaign: no state discarded.
- Return to title (campaign kept): warns if a non-Ironman campaign is dirty and leaves the active campaign available to save later.
- Save and return to title: writes the manual slot before leaving.

Session recovery uses `april-thesis-active-session-v4`. It retains campaign state, selection, map mode, command group/tab, and sidebar collapse while the campaign is active. Map zoom/pan uses session storage. IndexedDB remains the durable explicit save system; session recovery is convenience, not a replacement for saves.
