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

  it('ships coherent geographic context, infrastructure, and historical city labels', () => {
    const content = getContentBundle();
    const regionIds = new Set(content.regions.map(region => region.id));
    expect(content.geographicContext.length).toBeGreaterThan(20);
    expect(content.cities.length).toBeGreaterThanOrEqual(20);
    expect(content.rivers.map(river => river.name)).toEqual(expect.arrayContaining(['Volga', 'Dnieper', 'Don']));
    expect(content.railways.map(rail => rail.name)).toEqual(expect.arrayContaining(['Trans-Siberian Railway', 'Moscow-Southern Railway']));
    expect(content.cities.every(city => regionIds.has(city.regionId))).toBe(true);
    expect(content.cities.find(city => city.name === 'Novo-Nikolayevsk')?.periodNote).toMatch(/1926/);
  });

  it('defines valid strategic adjacency and projected label positions', () => {
    const content = getContentBundle();
    const regionIds = new Set(content.mapGeometries.map(region => region.id));
    for (const geometry of content.mapGeometries) {
      expect(geometry.path).toMatch(/^M/);
      expect(geometry.centerX).toBeGreaterThanOrEqual(0);
      expect(geometry.centerX).toBeLessThanOrEqual(1000);
      expect(geometry.centerY).toBeGreaterThanOrEqual(0);
      expect(geometry.centerY).toBeLessThanOrEqual(560);
      expect(geometry.neighborIds?.every(id => regionIds.has(id))).toBe(true);
    }
    expect(content.mapGeometries.find(region => region.id === 'moscow')?.neighborIds).toContain('central_industrial');
    expect(content.mapGeometries.find(region => region.id === 'western_siberia')?.neighborIds).toContain('central_siberia');
  });
});
