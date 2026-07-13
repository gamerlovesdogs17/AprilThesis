# Influence Contours

Political influence is now a scalar field, not a collection of blurred city circles.

The map engine collects current city and classified-site nodes. Each node inherits the live faction values of its strategic simulation parent. `computeInfluenceField` evaluates inverse-distance weighted influence on a regular projected grid. `generateContourBandPath` applies marching squares at documented thresholds; the production view uses 38, 56, and 72. Contours are clipped to the union of active province geometry.

The Historical Atlas preset shows only restrained Workers' Opposition bands. Political Intelligence can show the nationally strongest factions, contested hatching, intelligence uncertainty, and optional political nodes. A separate contested path marks cells where the two leading faction estimates are close. Uncertainty converts intelligence reliability to a scalar field and uses hatch rather than a false hard frontier.

Map-engine tests cover interpolation, contour generation, contested zones, and threshold behavior. The layer animates through CSS only when motion is permitted; reduced motion removes the transition.
