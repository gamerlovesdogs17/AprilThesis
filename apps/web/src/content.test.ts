import { describe, expect, it } from 'vitest';
import { getContentBundle, getProvincePath, isProvinceActive, validateStrategicGeography } from '@april-thesis/content';

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
    expect(content.rivers.map(river => river.name)).toEqual(expect.arrayContaining(['Volga', 'Dnipro', 'Don']));
    expect(content.railways.map(rail => rail.name)).toEqual(expect.arrayContaining(['Trans-Siberian Railway', 'Moscow-Kursk-Donbas Railway']));
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

  it('validates shared strategic geometry and assigned city points', () => {
    const result = validateStrategicGeography();
    const {citiesOutsideAssignedRegion:legacyCityChecks,...topologyChecks}=result;
    expect(legacyCityChecks.length).toBeGreaterThanOrEqual(0);
    expect(Object.entries(topologyChecks).flatMap(([kind,items]) => (items as string[]).map((item:string) => `${kind}:${item}`))).toEqual([]);
  });

  it('keeps the national label set restrained and every major character visual honest', () => {
    const content=getContentBundle();
    expect(content.cities.filter(city=>city.nationalEssential)).toHaveLength(10);
    expect(content.characters.filter(character=>character.portraitPath)).toHaveLength(13);
    expect(content.characters.filter(character=>!character.portraitPath).map(character=>character.id).sort()).toEqual(['medvedev','myasnikov']);
    expect(content.characters.filter(character=>character.portraitPath).every(character=>character.portraitPath?.startsWith('/assets/portraits/'))).toBe(true);
  });

  it('ships a separate dated historical-province layer with source-backed metadata', () => {
    const content = getContentBundle();
    const regionIds = new Set(content.regions.map(region => region.id));
    const provinceIds = content.historicalProvinces.map(province => province.id);
    expect(content.historicalProvinces).toHaveLength(96);
    expect(new Set(provinceIds).size).toBe(provinceIds.length);
    expect(content.provinceSources.length).toBeGreaterThanOrEqual(4);
    expect(content.historicalProvinces.every(province => regionIds.has(province.strategicRegionId))).toBe(true);
    expect(content.historicalProvinces.every(province => province.sourceIds.length > 0 && province.sourceFeatureIds.length > 0)).toBe(true);
    expect(content.historicalProvinces.every(province => /^\d{4}-\d{2}(?:-\d{2})?$/.test(province.geographicValidFrom) && province.administrativePeriods.length > 0 && getProvincePath(province).startsWith('M'))).toBe(true);
    expect(content.historicalProvinces.filter(province => isProvinceActive(province, '1921-03')).length).toBe(95);
    expect(content.historicalProvinces.every(province=>province.neighborIds.every(id=>provinceIds.includes(id)))).toBe(true);
    expect(content.historicalProvinces.every(province=>province.geometry.type==='Polygon'||province.geometry.type==='MultiPolygon')).toBe(true);
    const isAxisAlignedRectangle=(ring:number[][])=>ring.length===5&&new Set(ring.map(point=>point[0])).size===2&&new Set(ring.map(point=>point[1])).size===2;
    expect(content.historicalProvinces.every(province=>{
      const exteriors=province.geometry.type==='Polygon'?[province.geometry.coordinates[0]]:province.geometry.coordinates.map(polygon=>polygon[0]);
      return exteriors.some(ring=>!isAxisAlignedRectangle(ring));
    })).toBe(true);
  });

  it('ships province-derived governments, districts, sites, cities, and clipped transport',()=>{
    const content=getContentBundle();const provinceIds=new Set(content.historicalProvinces.map(province=>province.id));
    expect(content.historicalDistricts).toHaveLength(650);
    expect(content.formalGovernmentBoundaries).toHaveLength(84);
    expect(content.strategicAggregateBoundaries).toHaveLength(28);
    expect(content.strategicAggregateBoundaries.every(boundary=>boundary.generatedFromProvinceIds.length>0&&boundary.generatedFromProvinceIds.every(id=>provinceIds.has(id)))).toBe(true);
    expect(content.cities.every(city=>provinceIds.has(city.provinceId))).toBe(true);
    expect(content.historicalSites).toHaveLength(24);
    expect(content.historicalSites.every(site=>provinceIds.has(site.provinceId)&&site.sourceIds.length>0)).toBe(true);
    expect(content.railways.every(line=>line.provinceId&&provinceIds.has(line.provinceId))).toBe(true);
    expect(content.rivers.every(line=>line.provinceId&&provinceIds.has(line.provinceId))).toBe(true);
    expect(content.rivers.some(line=>line.provinceId==='moscow-governorate'&&line.name==='Moskva River'&&line.sourceIds.includes('openstreetmap-moskva-river-2026-07-13'))).toBe(true);
  });

});
