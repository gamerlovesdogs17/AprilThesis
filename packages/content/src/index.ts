import { regions } from './regions';
import { characters } from './characters';
import { institutions, laws } from './institutions';
import { events } from './events';
import { operations, endings, publications } from './operations';
import { mapGeometries, getRegionPath } from './mapGeometry';

// Attach map paths to region definitions
export const regionsWithPaths = regions.map(r => ({
  ...r,
  mapPath: getRegionPath(r.id),
}));

export { regions, characters, institutions, laws, events, operations, endings, publications, mapGeometries, getRegionPath };
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
