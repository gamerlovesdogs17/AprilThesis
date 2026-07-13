import { describe, expect, it } from 'vitest';
import type { RegionState } from '@april-thesis/shared-types';
import { computeInfluenceField, getIntelligenceBlur, getRegionValueForMode, valueToColor } from './index';

const region = {
  influence: { workersOpposition: 42 }, industrialProduction: 60, agriculturalProduction: 20,
  publicUnrest: 50, strikeActivity: 30, foodSupply: 25, intelligenceReliability: 55,
} as RegionState;

describe('map calculations', () => {
  it('maps modes to visible values', () => {
    expect(getRegionValueForMode(region, 'political_influence')).toBe(42);
    expect(getRegionValueForMode(region, 'economic_output')).toBe(40);
    expect(getRegionValueForMode(region, 'unrest_strikes')).toBe(40);
  });

  it('creates deterministic influence fields and uncertainty blur', () => {
    const field = computeInfluenceField([{ id:'a', x:1, y:1, regionId:'r', factionValues:{workersOpposition:80} }], 3, 3, 'workersOpposition');
    expect(field).toHaveLength(9);
    expect(field[4]).toBeCloseTo(80);
    expect(getIntelligenceBlur(40, 3)).toBeGreaterThan(getIntelligenceBlur(80, 0));
  });

  it('converts values to stable colors', () => {
    expect(valueToColor(0)).toBe('rgb(245,230,211)');
    expect(valueToColor(100)).toBe('rgb(95,50,61)');
  });
});
