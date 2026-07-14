import provincesGeoJson from '../map-data/provinces-1921.geo.json';
import provincesDetailGeoJson from '../map-data/provinces-1921.detail.geo.json';
import districtsGeoJson from '../map-data/districts-1921.geo.json';
import formalGovernmentsGeoJson from '../map-data/formal-governments-1921.geo.json';
import strategicAggregatesGeoJson from '../map-data/strategic-aggregates-1921.geo.json';
import { coordinatesToPath, projectCoordinate, type Coordinate } from './geography';

export interface GeoJSONPolygon { type:'Polygon'; coordinates:number[][][] }
export interface GeoJSONMultiPolygon { type:'MultiPolygon'; coordinates:number[][][][] }
export type AdministrativeGeometry = GeoJSONPolygon | GeoJSONMultiPolygon;

export interface ProvinceAdministrativePeriod {
  validFrom: string;
  validUntil?: string;
  formalGovernmentId: string;
  administrativeType: string;
  displayName?: string;
  sourceIds: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface GeoJSONFeature<P, G> {
  type: 'Feature';
  id?: string | number;
  properties: P;
  geometry: G;
}

interface GeoJSONFeatureCollection<P, G> {
  type: 'FeatureCollection';
  features: Array<GeoJSONFeature<P, G>>;
}

export interface HistoricalProvince {
  id: string;
  name1921: string;
  alternateNames: string[];
  neighborIds: string[];
  strategicRegionId: string;
  geometry: AdministrativeGeometry;
  capitalCityId?: string;
  geographicValidFrom: string;
  geographicValidUntil?: string;
  administrativePeriods: ProvinceAdministrativePeriod[];
  sourceIds: string[];
  sourceFeatureIds: string[];
  reconstructionOperation: string;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
  selectable: boolean;
}

export interface HistoricalDistrict {
  id: string;
  name1921: string;
  nameRussian: string;
  provinceId: string;
  strategicRegionId: string;
  formalGovernmentId: string;
  confidence: 'high' | 'medium' | 'low';
  sourceIds: string[];
  geometry: AdministrativeGeometry;
}

export interface FormalGovernmentBoundary {
  id: string;
  governmentId: string;
  validFrom: string;
  validUntil: string;
  sourceIds: string[];
  geometry: AdministrativeGeometry;
}

export interface StrategicAggregateBoundary {
  id: string;
  generatedFromProvinceIds: string[];
  geometry: AdministrativeGeometry;
}

export interface ProvinceSource {
  id:string;
  title:string;
  date:string;
  repository:string;
  url:string;
  license:string;
  note:string;
}

export const provinceSources: ProvinceSource[] = [
  {
    id:'east-kazakhstan-archive-akmolinsk-1921',
    title:'Administrative history of Akmolinsk and Semipalatinsk territories',
    date:'1920–1921 administrative transfer chronology',
    repository:'State Archive of East Kazakhstan Region',
    url:'https://e-arhiv.vko.gov.kz/ru/Page/Index/1495',
    license:'Government archival reference; factual chronology cited',
    note:'Documents the temporary subordination of Akmolinsk and Semipalatinsk to the Siberian Revolutionary Committee until April 1921.',
  },
  {
    id:'iish-ristat-1897-gis-v3.3',
    title:'Russian Empire Historical GIS Maps (1897), provinces and districts',
    date:'2017 dataset; IISH cleaned GeoPackages published 17 December 2021',
    repository:'International Institute of Social History / RiStat',
    url:'https://hdl.handle.net/10622/DN9QDM',
    license:'CC0 with citation requirement',
    note:'Primary vector foundation. March 1921 provinces are retained, split, transferred, or dissolved from these real province and uyezd features.',
  },
  {
    id:'troitsky-nkvd-1921',
    title:'Schematic administrative map of the RSFSR',
    date:'1921; administrative information as of 10 December 1920',
    repository:'Russian National Library / National Electronic Library',
    url:'https://rusneb.ru/catalog/000200_000018_RU_NLR_cart_8873/',
    license:'Public-domain historical cartographic reference',
    note:'Primary documentary check for RSFSR governorates and autonomous units.',
  },
  {
    id:'loc-rsfsr-1922',
    title:'Russian Socialist Federated Soviet Republic 1922',
    date:'1922',
    repository:'Library of Congress Geography and Map Division',
    url:'https://www.loc.gov/resource/g7001f.ct007695/',
    license:'Library of Congress states no known restrictions; public-domain historical map',
    note:'Near-contemporary comparison for republic, autonomous, Siberian, and Far Eastern boundaries.',
  },
  {
    id:'natural-earth-rivers-5.0.0',
    title:'Natural Earth 1:50m Rivers and Lake Centerlines',
    date:'Version 5.0.0',
    repository:'Natural Earth / NACIS',
    url:'https://www.naturalearthdata.com/downloads/50m-physical-vectors/50m-rivers-lake-centerlines/',
    license:'Public domain',
    note:'Physical river centerlines clipped to the reconstructed March 1921 territorial mask.',
  },
  {
    id:'openstreetmap-moskva-river-2026-07-13',
    title:'OpenStreetMap Moskva River waterway relation 389341',
    date:'Dated Overpass snapshot at 2026-07-13T22:19:45Z',
    repository:'OpenStreetMap contributors / Overpass API',
    url:'https://www.openstreetmap.org/relation/389341',
    license:'Open Database License 1.0 (ODbL)',
    note:'Modern hydrographic centerline reference used only to supply local Moskva River position where Natural Earth 1:50m omits it; never used as historical boundary evidence.',
  },
];

interface ProvinceProperties extends Omit<HistoricalProvince, 'geometry' | 'capitalCityId' | 'geographicValidUntil'> {
  capitalCityId: string | null;
  geographicValidUntil: string | null;
}

interface DistrictProperties extends Omit<HistoricalDistrict, 'geometry'> {
  Distr_ID: number;
  Gub_ID: string;
}

type FormalProperties = Omit<FormalGovernmentBoundary, 'geometry'>;
interface StrategicProperties {
  id: string;
  generatedFromProvinceIds: string[];
}

const provinceCollection = provincesGeoJson as unknown as GeoJSONFeatureCollection<ProvinceProperties, AdministrativeGeometry>;
const provinceDetailCollection = provincesDetailGeoJson as unknown as GeoJSONFeatureCollection<ProvinceProperties, AdministrativeGeometry>;
const districtCollection = districtsGeoJson as unknown as GeoJSONFeatureCollection<DistrictProperties, AdministrativeGeometry>;
const formalCollection = formalGovernmentsGeoJson as unknown as GeoJSONFeatureCollection<FormalProperties, AdministrativeGeometry>;
const strategicCollection = strategicAggregatesGeoJson as unknown as GeoJSONFeatureCollection<StrategicProperties, AdministrativeGeometry>;

export const historicalProvinces: HistoricalProvince[] = provinceCollection.features.map(({properties,geometry}) => ({
  ...properties,
  capitalCityId: properties.capitalCityId ?? undefined,
  geographicValidUntil: properties.geographicValidUntil ?? undefined,
  geometry,
}));

export const historicalProvinceDetails: HistoricalProvince[] = provinceDetailCollection.features.map(({properties,geometry}) => ({
  ...properties,
  capitalCityId: properties.capitalCityId ?? undefined,
  geographicValidUntil: properties.geographicValidUntil ?? undefined,
  geometry,
}));

export const historicalDistricts: HistoricalDistrict[] = districtCollection.features.map(({properties,geometry}) => ({
  id:properties.id,
  name1921:properties.name1921,
  nameRussian:properties.nameRussian,
  provinceId:properties.provinceId,
  strategicRegionId:properties.strategicRegionId,
  formalGovernmentId:properties.formalGovernmentId,
  confidence:properties.confidence,
  sourceIds:properties.sourceIds,
  geometry,
}));

export const formalGovernmentBoundaries: FormalGovernmentBoundary[] = formalCollection.features.map(({properties,geometry}) => ({
  ...properties,
  geometry,
}));

export const strategicAggregateBoundaries: StrategicAggregateBoundary[] = strategicCollection.features.map(({properties,geometry}) => ({
  id:properties.id,
  generatedFromProvinceIds:properties.generatedFromProvinceIds,
  geometry,
}));

function rings(geometry:AdministrativeGeometry): number[][][] {
  return geometry.type==='Polygon' ? geometry.coordinates : geometry.coordinates.flat();
}

export function isProvinceActive(province:HistoricalProvince,date:string):boolean {
  const month=date.slice(0,7);
  return province.geographicValidFrom.slice(0,7)<=month && (!province.geographicValidUntil||month<=province.geographicValidUntil.slice(0,7));
}

export function getProvinceAdministration(province:HistoricalProvince,date:string):ProvinceAdministrativePeriod|undefined {
  const month=date.slice(0,7);
  return province.administrativePeriods.find(period=>period.validFrom.slice(0,7)<=month&&(!period.validUntil||month<=period.validUntil.slice(0,7)));
}

export function getProvinceDisplayName(province:HistoricalProvince,date:string):string {
  return getProvinceAdministration(province,date)?.displayName??province.name1921;
}

export function isFormalGovernmentBoundaryActive(boundary:FormalGovernmentBoundary,date:string):boolean {
  const month=date.slice(0,7);
  return boundary.validFrom.slice(0,7)<=month&&month<=boundary.validUntil.slice(0,7);
}

export function getAdministrativePath(geometry:AdministrativeGeometry):string {
  return rings(geometry)
    .map(ring=>coordinatesToPath(ring.map(([longitude,latitude])=>[longitude,latitude] as Coordinate),true))
    .join('');
}

export function getProvincePath(province:HistoricalProvince):string {
  return getAdministrativePath(province.geometry);
}

export function getDistrictPath(district:HistoricalDistrict):string {
  return getAdministrativePath(district.geometry);
}

export function getProvinceCenter(province:HistoricalProvince):[number,number] {
  const points=rings(province.geometry).flat();
  const longitudes=points.map(point=>point[0]);
  const latitudes=points.map(point=>point[1]);
  const longitude=(Math.min(...longitudes)+Math.max(...longitudes))/2;
  const latitude=(Math.min(...latitudes)+Math.max(...latitudes))/2;
  return projectCoordinate([longitude,latitude]);
}
