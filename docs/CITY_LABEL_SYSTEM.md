# City Label System

City metadata supplies stable ID, period name, region, projected coordinate, population category, three importance scores, label priority, optional national-essential status, and optional preferred label offset.

## Density rules

- National view admits exactly the authored essential set (10 candidates).
- Regional view admits priority-one/two cities and all cities in the selected region.
- Province focus admits selected-region cities plus high-priority neighboring cities.
- “Show all city labels” bypasses eligibility and collision suppression by explicit user choice.

Eligible labels are sorted by selected-region status, national-essential status, priority, then stable ID. An approximate monospace text box is placed at the preferred/default offset. A label is suppressed if its box collides with a previously accepted label. The dot remains keyboard-focusable and its hidden label appears on hover/focus, so collision management does not remove access.

The 10 national essentials are Petrograd, Moscow, Kiev, Rostov-on-Don, Tsaritsyn, Kazan, Omsk, Vladivostok, Tashkent, and Baku. Other period names such as Tiflis and Novo-Nikolayevsk appear at closer scales; modern names remain tooltip notes.

Map-engine unit tests verify tier thresholds, national eligibility, collision removal, and selected-region precedence. Browser coverage checks overview density, focus detail, and the opt-in all-label mode.
