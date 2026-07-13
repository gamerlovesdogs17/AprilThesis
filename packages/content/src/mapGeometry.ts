import { mapGeometries } from './geography';

export { mapGeometries };

export function getRegionPath(regionId: string): string {
  return mapGeometries.find(geometry => geometry.id === regionId)?.path ?? '';
}
