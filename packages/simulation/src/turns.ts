import type { CampaignState, TurnPhase, FactionResources, NationalStatistics } from '@april-thesis/shared-types';
import { advanceDate, VERTICAL_SLICE_END } from '@april-thesis/shared-types';
import type { EventDefinition, OperationDefinition, EndingDefinition } from '@april-thesis/content-schema';
import { SeededRng } from './rng';
import { clamp } from './campaign';

export interface TurnSummary {
  date: string;
  turnNumber: number;
  resourceChanges: Partial<FactionResources>;
  nationalChanges: Partial<NationalStatistics>;
  headlines: string[];
  regionHighlights: { regionId: string; message: string }[];
  exposureWarning: boolean;
  newEvents: string[];
}

const PHASE_ORDER: TurnPhase[] = [
  'briefing',
  'faction_management',
  'regional_operations',
  'party_politics',
  'consequences',
];

export function getNextPhase(current: TurnPhase): TurnPhase | 'advance_month' {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx === PHASE_ORDER.length - 1) return 'advance_month';
  return PHASE_ORDER[idx + 1];
}

export function applyEffects(
  state: CampaignState,
  effects: Record<string, number | string | boolean>,
): CampaignState {
  const next = structuredClone(state);
  for (const [key, value] of Object.entries(effects)) {
    if (typeof value === 'number') {
      if (key in next.resources) {
        const resources = next.resources as unknown as Record<string, number>;
        resources[key] = clamp(resources[key] + value, 0, 100);
      } else if (key in next.nationalStats) {
        const stats = next.nationalStats as unknown as Record<string, number>;
        stats[key] = clamp(stats[key] + value, 0, 100);
      } else if (key.startsWith('region:')) {
        const [, regionId, fieldPath] = key.split(':');
        const region = next.regions[regionId];
        if (region) {
          const parts = fieldPath.split('.');
          const target = parts.length === 2 && parts[0] === 'influence'
            ? region.influence as unknown as Record<string, number>
            : region as unknown as Record<string, number>;
          const field = parts.at(-1)!;
          if (typeof target[field] === 'number') target[field] = clamp(target[field] + value, 0, 100);
        }
      } else if (key.startsWith('character:')) {
        const [, charId, field] = key.split(':');
        if (next.characters[charId] && field in next.characters[charId]) {
          const character = next.characters[charId] as unknown as Record<string, number>;
          character[field] = clamp(character[field] + value, 0, 100);
        }
      } else if (key === 'internalCohesion') {
        next.internalCohesion = clamp(next.internalCohesion + value, 0, 100);
      }
    } else if (typeof value === 'boolean' || typeof value === 'string') {
      next.flags[key] = value;
    }
  }
  return next;
}

export function applyFlags(
  state: CampaignState,
  flags: Record<string, boolean | number | string>,
): CampaignState {
  const next = structuredClone(state);
  Object.assign(next.flags, flags);
  return next;
}

export function checkRequirements(
  state: CampaignState,
  requirements?: Record<string, number | string | boolean>,
): boolean {
  if (!requirements) return true;
  for (const [key, value] of Object.entries(requirements)) {
    if (key.startsWith('flag:')) {
      const flagKey = key.slice(5);
      if (state.flags[flagKey] !== value) return false;
    } else if (key in state.resources) {
      const current = (state.resources as unknown as Record<string, number>)[key];
      if (typeof value === 'number' && current < value) return false;
    } else if (key in state.nationalStats) {
      const current = (state.nationalStats as unknown as Record<string, number>)[key];
      if (typeof value === 'number' && current < value) return false;
    } else if (key === 'turnNumber' && typeof value === 'number') {
      if (state.turnNumber < value) return false;
    } else if (key === 'internalCohesion' && typeof value === 'number') {
      if (state.internalCohesion < value) return false;
    }
  }
  return true;
}

export function getEligibleEvents(
  state: CampaignState,
  events: EventDefinition[],
  month?: string,
): EventDefinition[] {
  return events
    .filter(e => !state.completedEventIds.includes(e.id))
    .filter(e => !state.pendingEventIds.includes(e.id) || state.currentEventId === e.id)
    .filter(e => {
      if (e.excludeIfFlags?.some(f => state.flags[f])) return false;
      if (e.requireFlags?.some(f => !state.flags[f])) return false;
      return checkRequirements(state, e.requirements as Record<string, number | string | boolean>);
    })
    .filter(e => !month || !e.month || e.month === month)
    .sort((a, b) => b.priority - a.priority);
}

export function resolveOperations(
  state: CampaignState,
  operations: OperationDefinition[],
): { state: CampaignState; completed: string[] } {
  const next = structuredClone(state);
  const completed: string[] = [];
  const rng = new SeededRng(state.rngState);

  next.activeOperations = next.activeOperations.filter(op => {
    op.turnsRemaining -= 1;
    if (op.turnsRemaining <= 0) {
      const opDef = operations.find(o => o.id === op.operationId);
      if (opDef) {
        const effects = Object.fromEntries(
          Object.entries(opDef.effects).map(([key, value]) => [key.replace('TARGET', op.regionId), value]),
        );
        Object.assign(next, applyEffects(next, effects));
        if (opDef.risks?.arrestChance && rng.chance(opDef.risks.arrestChance)) {
          next.resources.exposure = clamp(next.resources.exposure + 10, 0, 100);
        }
        if (opDef.risks?.exposureIncrease) {
          next.resources.exposure = clamp(next.resources.exposure + opDef.risks.exposureIncrease, 0, 100);
        }
      }
      completed.push(op.id);
      return false;
    }
    return true;
  });

  next.rngState = rng.getState();
  return { state: next, completed };
}

export function advanceMonth(state: CampaignState): CampaignState {
  const next = structuredClone(state);
  next.currentDate = advanceDate(next.currentDate);
  next.turnNumber += 1;
  next.phase = 'briefing';

  for (const region of Object.values(next.regions)) {
    region.intelligenceAge += 1;
  }

  if (next.resources.exposure > 70) {
    next.resources.security = clamp(next.resources.security - 5, 0, 100);
    next.nationalStats.politicalRepression = clamp(next.nationalStats.politicalRepression + 3, 0, 100);
  }

  if (next.nationalStats.famineSeverity > 50) {
    next.nationalStats.disease = clamp(next.nationalStats.disease + 2, 0, 100);
    next.resources.publicLegitimacy = clamp(next.resources.publicLegitimacy - 2, 0, 100);
  }

  return next;
}

export function evaluateEndings(
  state: CampaignState,
  endings: EndingDefinition[],
): EndingDefinition | null {
  if (state.currentDate >= VERTICAL_SLICE_END && state.turnNumber >= 6 && state.flags.chapter_one_complete) {
    const prioritized = endings.filter(ending => ending.id !== 'ending_survival');
    for (const ending of prioritized) {
      if (checkRequirements(state, ending.requirements as Record<string, number | string | boolean>)) {
        return ending;
      }
    }
    return endings.find(ending => ending.id === 'ending_survival') ?? null;
  }
  if (state.resources.exposure >= 95) {
    return endings.find(e => e.id === 'ending_purge') ?? null;
  }
  if (state.resources.workerSupport <= 10 && state.resources.organizationalCapacity <= 15) {
    return endings.find(e => e.id === 'ending_collapse') ?? null;
  }
  if (state.turnNumber > 6 && state.currentDate > VERTICAL_SLICE_END) {
    return endings.find(e => e.id === 'ending_survival') ?? endings[0] ?? null;
  }
  return null;
}

export function generateTurnSummary(
  prev: CampaignState,
  next: CampaignState,
  headlines: string[],
): TurnSummary {
  const resourceChanges: Partial<FactionResources> = {};
  for (const key of Object.keys(next.resources) as (keyof FactionResources)[]) {
    const delta = next.resources[key] - prev.resources[key];
    if (delta !== 0) resourceChanges[key] = delta;
  }
  const nationalChanges: Partial<NationalStatistics> = {};
  for (const key of Object.keys(next.nationalStats) as (keyof NationalStatistics)[]) {
    const delta = next.nationalStats[key] - prev.nationalStats[key];
    if (delta !== 0) nationalChanges[key] = delta;
  }
  return {
    date: next.currentDate,
    turnNumber: next.turnNumber,
    resourceChanges,
    nationalChanges,
    headlines,
    regionHighlights: [],
    exposureWarning: next.resources.exposure > 60,
    newEvents: next.pendingEventIds.filter(id => !prev.pendingEventIds.includes(id)),
  };
}

export { PHASE_ORDER };
