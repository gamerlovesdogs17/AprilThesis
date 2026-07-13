import { describe, expect, it } from 'vitest';
import type { RegionState } from '@april-thesis/shared-types';
import { computeInfluenceField, getIntelligenceBlur, getMapZoomTier, getRegionValueForMode, layoutCityLabels, valueToColor } from './index';

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

  it('uses explicit national, regional, and province city tiers', () => {
    expect(getMapZoomTier(1,null)).toBe('national');
    expect(getMapZoomTier(1.4,null)).toBe('regional');
    expect(getMapZoomTier(2.4,'petrograd')).toBe('province');
  });

  it('suppresses collisions while preserving selected-region priority', () => {
    const labels = layoutCityLabels([
      {id:'capital',name:'Capital',regionId:'other',x:100,y:100,labelPriority:1,nationalEssential:true},
      {id:'selected',name:'Selected Hub',regionId:'selected',x:102,y:100,labelPriority:2,nationalEssential:true},
      {id:'local',name:'Local',regionId:'selected',x:160,y:100,labelPriority:3},
    ],{zoom:2.4,selectedRegionId:'selected'});
    expect(labels.find(item => item.id === 'selected')?.labelVisible).toBe(true);
    expect(labels.find(item => item.id === 'capital')?.labelVisible).toBe(false);
    expect(labels.find(item => item.id === 'local')?.labelVisible).toBe(true);
  });
});
