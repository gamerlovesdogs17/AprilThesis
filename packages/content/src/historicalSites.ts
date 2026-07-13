import sitesGeoJson from '../map-data/sites-1921.geo.json';

export type HistoricalSiteKind =
  | 'factory'
  | 'mine'
  | 'railway_junction'
  | 'port'
  | 'union_office'
  | 'party_office'
  | 'security_office'
  | 'garrison'
  | 'relief_station'
  | 'printing_site';

export interface HistoricalSite {
  id: string;
  name: string;
  provinceId: string;
  cityId?: string;
  longitude: number;
  latitude: number;
  kind: HistoricalSiteKind;
  validFrom: string;
  validUntil?: string;
  classification: 'documented' | 'historically_plausible_composite' | 'player_created';
  sourceIds: string[];
  notes?: string;
  assignmentMethod?: 'manual_coastal_tolerance';
  assignmentNote?: string;
}

interface SiteFeatureCollection {
  type:'FeatureCollection';
  features:Array<{
    type:'Feature';
    properties:HistoricalSite;
    geometry:{type:'Point';coordinates:number[]};
  }>;
}

export const historicalSites:HistoricalSite[] = (
  sitesGeoJson as unknown as SiteFeatureCollection
).features.map(feature=>feature.properties);

export function isSiteActive(site:HistoricalSite,date:string):boolean {
  const month=date.slice(0,7);
  return site.validFrom.slice(0,7)<=month && (!site.validUntil||month<=site.validUntil.slice(0,7));
}
