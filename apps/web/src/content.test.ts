import { describe, expect, it } from 'vitest';
import { getContentBundle } from '@april-thesis/content';

describe('vertical-slice content', () => {
  it('ships a playable six-month chapter', () => {
    const content = getContentBundle();
    expect(content.regions.length).toBeGreaterThanOrEqual(24);
    expect(content.characters.length).toBeGreaterThanOrEqual(15);
    expect(content.institutions.length).toBeGreaterThanOrEqual(6);
    expect(content.laws.length).toBeGreaterThanOrEqual(12);
    expect(content.events.length).toBeGreaterThanOrEqual(25);
    expect(content.endings.length).toBeGreaterThanOrEqual(4);
  });

  it('keeps map geometry synchronized with region content', () => {
    const content = getContentBundle();
    expect(new Set(content.mapGeometries.map(item => item.id))).toEqual(new Set(content.regions.map(item => item.id)));
    expect(content.regions.every(region => region.mapPath.length > 0)).toBe(true);
  });
});
