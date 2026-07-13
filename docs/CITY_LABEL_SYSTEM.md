# City and Province Label System

City metadata supplies a stable ID, period name, simulation region, projected coordinate, population category, importance scores, label priority, optional national-essential status, and preferred offset.

The national view admits 10 essential city labels: Petrograd, Moscow, Kiev, Rostov-on-Don, Tsaritsyn, Kazan, Omsk, Vladivostok, Tashkent, and Baku. Closer scale admits secondary cities including Tiflis and Novo-Nikolayevsk. Modern names remain tooltip notes. “Show all city labels” is an explicit opt-in and currently exposes all 21 city records.

Eligible city labels are ordered by selected aggregate, national-essential status, priority, and stable ID. Approximate text boxes suppress collisions; the dot remains keyboard focusable, and a suppressed name appears on hover or focus.

Province labels run through a separate collision pass over the 88 dated administrative units. They do not compete with old strategic-region names because those names are no longer rendered in the normal atlas. Province detail uses its own site-label surface and ledger.

Tests cover overview density, all-label opt-in, secondary period names, projected bounds, and selection priority.
