import { regions } from './regions';
import { characters } from './characters';
import { institutions, laws } from './institutions';
import { events } from './events';
import { operations, endings, publications } from './operations';
import { mapGeometries, getRegionPath } from './mapGeometry';
import { cities, rivers, railways, seas, geographicContext } from './geography';
import { historicalProvinces, historicalProvinceDetails, historicalDistricts, formalGovernmentBoundaries, strategicAggregateBoundaries, provinceSources } from './historicalProvinces';
import { historicalSites } from './historicalSites';
import { historicalAssets } from './historicalAssets';

// Attach map paths to region definitions
export const regionsWithPaths = regions.map(r => ({
  ...r,
  mapPath: getRegionPath(r.id),
  centerX: mapGeometries.find(geometry => geometry.id === r.id)?.centerX ?? r.centerX,
  centerY: mapGeometries.find(geometry => geometry.id === r.id)?.centerY ?? r.centerY,
  influenceNodes: [{
    id: `${r.id}-main`,
    x: mapGeometries.find(geometry => geometry.id === r.id)?.centerX ?? r.centerX,
    y: mapGeometries.find(geometry => geometry.id === r.id)?.centerY ?? r.centerY,
    type: 'city' as const,
    name: r.majorCities[0] ?? r.name,
  }],
}));

export { regions, characters, institutions, laws, events, operations, endings, publications, mapGeometries, getRegionPath, cities, rivers, railways, seas, geographicContext, historicalProvinces, historicalProvinceDetails, historicalDistricts, formalGovernmentBoundaries, strategicAggregateBoundaries, provinceSources, historicalSites, historicalAssets };
export * from './geography';
export * from './historicalProvinces';
export * from './historicalSites';
export * from './historicalAssets';
export { regionsWithPaths as gameRegions };

export function getContentBundle() {
  return {
    regions: regionsWithPaths,
    characters,
    institutions,
    laws,
    events,
    operations,
    endings,
    publications,
    mapGeometries,
    cities,
    rivers,
    railways,
    seas,
    geographicContext,
    historicalProvinces,
    historicalProvinceDetails,
    historicalDistricts,
    formalGovernmentBoundaries,
    strategicAggregateBoundaries,
    provinceSources,
    historicalSites,
    historicalAssets,
  };
}

export function getEventsForMonth(month: string) {
  return events.filter(e => !e.month || e.month === month);
}

export function getCharacterById(id: string) {
  return characters.find(c => c.id === id);
}

export function getRegionById(id: string) {
  return regionsWithPaths.find(r => r.id === id);
}

export function getOperationById(id: string) {
  return operations.find(o => o.id === id);
}

export function getEventById(id: string) {
  return events.find(e => e.id === id);
}

export function getEndingById(id: string) {
  return endings.find(e => e.id === id);
}
