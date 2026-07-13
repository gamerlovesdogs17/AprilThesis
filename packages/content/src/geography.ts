import type { MapRegionGeometry } from '@april-thesis/map-engine';
import context from './geography-context.json';

export const MAP_BOUNDS = { minLongitude: 18, maxLongitude: 180, minLatitude: 25, maxLatitude: 82, width: 1000, height: 560 } as const;

export type Coordinate = readonly [longitude: number, latitude: number];

export interface HistoricalCity {
  id: string;
  name: string;
  modernName?: string;
  regionId: string;
  longitude: number;
  latitude: number;
  populationCategory: 'metropolis' | 'major' | 'regional' | 'local';
  industrialImportance: number;
  railwayImportance: number;
  politicalImportance: number;
  labelPriority: number;
  nationalEssential?: boolean;
  preferredLabelOffset?: readonly [number, number];
  periodNote?: string;
  port?: boolean;
}

export interface GeographicLine {
  id: string;
  name: string;
  coordinates: Coordinate[];
  importance: number;
}

export interface GeographicContextFeature {
  id: string;
  name: string;
  path: string;
}

export function projectCoordinate([longitude, latitude]: Coordinate): [number, number] {
  const x = ((longitude - MAP_BOUNDS.minLongitude) / (MAP_BOUNDS.maxLongitude - MAP_BOUNDS.minLongitude)) * MAP_BOUNDS.width;
  const y = ((MAP_BOUNDS.maxLatitude - latitude) / (MAP_BOUNDS.maxLatitude - MAP_BOUNDS.minLatitude)) * MAP_BOUNDS.height;
  return [Number(x.toFixed(2)), Number(y.toFixed(2))];
}

export function coordinatesToPath(coordinates: Coordinate[], closed = false): string {
  const [first, ...rest] = coordinates.map(projectCoordinate);
  if (!first) return '';
  return `M${first[0]},${first[1]}${rest.map(([x, y]) => `L${x},${y}`).join('')}${closed ? 'Z' : ''}`;
}

export const strategicRegionPolygons: Array<{
  id: string;
  coordinates: Coordinate[];
  center: Coordinate;
  label?: Coordinate;
  labelPriority: number;
  neighbors: string[];
}> = [
  { id: 'baltic_frontier', coordinates: [[24,61],[29,61],[31,58],[23,56]], center:[27,58.5], labelPriority:3, neighbors:['belarus'] },
  { id: 'petrograd', coordinates: [[29,62],[35,62],[40,59],[36,59],[33,58],[31,58]], center:[32.7,59.6], labelPriority:1, neighbors:['karelia','moscow'] },
  { id: 'karelia', coordinates: [[29,72],[40,72],[43,66],[35,62],[29,62],[26,66]], center:[34.5,67], labelPriority:2, neighbors:['petrograd','northern_russia'] },
  { id: 'northern_russia', coordinates: [[40,75],[67,73],[70,64],[55,61],[43,66],[40,72]], center:[54,68], label:[52,70], labelPriority:1, neighbors:['karelia','urals'] },
  { id: 'belarus', coordinates: [[23,56],[31,58],[34,55],[33,51],[27,50],[22,52]], center:[28.5,53.5], labelPriority:1, neighbors:['baltic_frontier','western_ukraine','central_ukraine','tula'] },
  { id: 'western_ukraine', coordinates: [[22,52],[27,50],[31,47],[29.5,44.5],[24,45],[20,48]], center:[25.5,48], labelPriority:2, neighbors:['belarus','central_ukraine'] },
  { id: 'central_ukraine', coordinates: [[27,50],[33,51],[37,51],[37,49],[38,46],[36.8,45.4],[31.5,45.5],[29.5,44.5],[31,47]], center:[33.5,48], labelPriority:1, neighbors:['belarus','western_ukraine','crimea','tula','donbas','kuban'] },
  { id: 'crimea', coordinates: [[31.5,45.5],[36.8,45.4],[36,43.3],[33,43.1],[31,44]], center:[34.2,44.3], labelPriority:2, neighbors:['central_ukraine'] },
  { id: 'moscow', coordinates: [[33,58],[36,59],[40,59],[43,56],[40,53],[34,55]], center:[37.6,55.8], labelPriority:1, neighbors:['petrograd','central_industrial','tula'] },
  { id: 'central_industrial', coordinates: [[40,62],[49,62],[51,58],[47,55],[43,56],[40,59]], center:[45,59], label:[45,60], labelPriority:2, neighbors:['moscow','upper_volga'] },
  { id: 'tula', coordinates: [[34,55],[40,53],[42,50],[37,49],[37,51],[33,51]], center:[37.5,52], labelPriority:2, neighbors:['belarus','central_ukraine','moscow','tambov','donbas'] },
  { id: 'upper_volga', coordinates: [[49,62],[55,61],[56,56],[55,53],[47,55],[51,58]], center:[52,57], labelPriority:1, neighbors:['central_industrial','middle_volga','urals'] },
  { id: 'tambov', coordinates: [[40,53],[44,53],[44,49],[42,50]], center:[42.5,51.5], labelPriority:2, neighbors:['tula','middle_volga'] },
  { id: 'middle_volga', coordinates: [[44,53],[47,55],[55,53],[63,54],[66,50],[60,47],[52,49],[44,49]], center:[52,51.5], labelPriority:1, neighbors:['upper_volga','tambov','lower_volga','urals','kazakhstan'] },
  { id: 'lower_volga', coordinates: [[44,49],[52,49],[60,47],[59,43],[51,42],[45,45]], center:[51,46], labelPriority:1, neighbors:['middle_volga','northern_caucasus','kazakhstan'] },
  { id: 'don_basin', coordinates: [[38,46],[39,48],[44,48],[45,45]], center:[41,46.5], labelPriority:2, neighbors:['donbas','kuban'] },
  { id: 'donbas', coordinates: [[37,49],[42,50],[44,48],[39,48],[38,46]], center:[40,48.5], labelPriority:1, neighbors:['central_ukraine','tula','don_basin'] },
  { id: 'kuban', coordinates: [[38,46],[45,45],[45,43],[39,43],[36.8,45.4]], center:[41,44.5], labelPriority:2, neighbors:['central_ukraine','don_basin','northern_caucasus','georgia'] },
  { id: 'northern_caucasus', coordinates: [[45,45],[51,42],[53,42],[51,41],[48,42],[45,43]], center:[49,43], labelPriority:2, neighbors:['lower_volga','kuban','georgia','azerbaijan'] },
  { id: 'georgia', coordinates: [[39,43],[45,43],[48,42],[47,41],[43.5,41],[40,40]], center:[44,42], labelPriority:1, neighbors:['kuban','northern_caucasus','armenia','azerbaijan'] },
  { id: 'armenia', coordinates: [[43.5,41],[47,41],[50,38],[47,37],[44,37],[43,39]], center:[46,39.5], labelPriority:2, neighbors:['georgia','azerbaijan'] },
  { id: 'azerbaijan', coordinates: [[47,41],[48,42],[51,41],[53,42],[55,39],[52,37],[50,38]], center:[51,40], labelPriority:1, neighbors:['northern_caucasus','georgia','armenia'] },
  { id: 'urals', coordinates: [[55,61],[70,64],[70,52],[66,50],[63,54],[56,56]], center:[64,57], labelPriority:1, neighbors:['northern_russia','upper_volga','middle_volga','kazakhstan','western_siberia'] },
  { id: 'kazakhstan', coordinates: [[66,50],[70,52],[88,52],[96,48],[88,42],[72,45],[59,43],[60,47]], center:[77,48], labelPriority:1, neighbors:['middle_volga','lower_volga','urals','turkestan','western_siberia'] },
  { id: 'turkestan', coordinates: [[55,36],[59,43],[72,45],[88,42],[91,32],[80,27],[63,29]], center:[73,36], labelPriority:1, neighbors:['kazakhstan'] },
  { id: 'western_siberia', coordinates: [[70,64],[94,68],[103,61],[100,51],[96,48],[88,52],[70,52]], center:[84,58], labelPriority:1, neighbors:['urals','kazakhstan','central_siberia'] },
  { id: 'central_siberia', coordinates: [[94,68],[125,74],[135,66],[130,53],[117,48],[100,51],[103,61]], center:[114,61], labelPriority:1, neighbors:['western_siberia','far_east'] },
  { id: 'far_east', coordinates: [[125,74],[155,73],[176,67],[171,54],[157,48],[140,45],[130,40],[130,53],[135,66]], center:[151,60], labelPriority:1, neighbors:['central_siberia'] },
];

export const mapGeometries: MapRegionGeometry[] = strategicRegionPolygons.map(region => {
  const [centerX, centerY] = projectCoordinate(region.center);
  const [labelX, labelY] = projectCoordinate(region.label ?? region.center);
  return {
    id: region.id,
    path: coordinatesToPath(region.coordinates, true),
    centerX,
    centerY,
    labelX,
    labelY,
    labelPriority: region.labelPriority,
    neighborIds: strategicRegionPolygons.filter(other => other.id !== region.id && sharesBoundary(region.coordinates,other.coordinates)).map(other => other.id),
  };
});

export const geographicContext: GeographicContextFeature[] = context.features;

export const cities: HistoricalCity[] = [
  { id:'petrograd-city', name:'Petrograd', regionId:'petrograd', longitude:30.32, latitude:59.94, populationCategory:'metropolis', industrialImportance:95, railwayImportance:90, politicalImportance:100, labelPriority:1, nationalEssential:true, preferredLabelOffset:[7,-7], port:true },
  { id:'moscow-city', name:'Moscow', regionId:'moscow', longitude:37.62, latitude:55.75, populationCategory:'metropolis', industrialImportance:90, railwayImportance:100, politicalImportance:100, labelPriority:1, nationalEssential:true, preferredLabelOffset:[7,10] },
  { id:'minsk-city', name:'Minsk', regionId:'belarus', longitude:27.56, latitude:53.90, populationCategory:'major', industrialImportance:45, railwayImportance:80, politicalImportance:70, labelPriority:1 },
  { id:'kiev-city', name:'Kiev', regionId:'central_ukraine', longitude:30.52, latitude:50.45, populationCategory:'major', industrialImportance:65, railwayImportance:85, politicalImportance:85, labelPriority:1, nationalEssential:true, preferredLabelOffset:[-28,-7] },
  { id:'kharkov-city', name:'Kharkov', regionId:'central_ukraine', longitude:36.23, latitude:49.99, populationCategory:'major', industrialImportance:85, railwayImportance:90, politicalImportance:80, labelPriority:1 },
  { id:'odessa-city', name:'Odessa', regionId:'central_ukraine', longitude:30.73, latitude:46.48, populationCategory:'major', industrialImportance:65, railwayImportance:70, politicalImportance:65, labelPriority:2, port:true },
  { id:'rostov-city', name:'Rostov-on-Don', regionId:'don_basin', longitude:39.70, latitude:47.24, populationCategory:'major', industrialImportance:70, railwayImportance:90, politicalImportance:65, labelPriority:1, nationalEssential:true, preferredLabelOffset:[7,10] },
  { id:'tsaritsyn-city', name:'Tsaritsyn', modernName:'Volgograd', regionId:'lower_volga', longitude:44.51, latitude:48.71, populationCategory:'regional', industrialImportance:65, railwayImportance:80, politicalImportance:60, labelPriority:1, nationalEssential:true, periodNote:'Name used until 1925.' },
  { id:'saratov-city', name:'Saratov', regionId:'middle_volga', longitude:46.03, latitude:51.53, populationCategory:'major', industrialImportance:55, railwayImportance:75, politicalImportance:60, labelPriority:2 },
  { id:'samara-city', name:'Samara', regionId:'middle_volga', longitude:50.10, latitude:53.20, populationCategory:'major', industrialImportance:60, railwayImportance:90, politicalImportance:65, labelPriority:1 },
  { id:'kazan-city', name:'Kazan', regionId:'upper_volga', longitude:49.11, latitude:55.79, populationCategory:'major', industrialImportance:65, railwayImportance:75, politicalImportance:75, labelPriority:1, nationalEssential:true },
  { id:'perm-city', name:'Perm', regionId:'urals', longitude:56.23, latitude:58.01, populationCategory:'major', industrialImportance:80, railwayImportance:85, politicalImportance:55, labelPriority:2 },
  { id:'ekaterinburg-city', name:'Ekaterinburg', modernName:'Yekaterinburg', regionId:'urals', longitude:60.60, latitude:56.84, populationCategory:'major', industrialImportance:85, railwayImportance:90, politicalImportance:70, labelPriority:1, periodNote:'Renamed Sverdlovsk in 1924.' },
  { id:'omsk-city', name:'Omsk', regionId:'western_siberia', longitude:73.37, latitude:54.99, populationCategory:'major', industrialImportance:55, railwayImportance:95, politicalImportance:70, labelPriority:1, nationalEssential:true },
  { id:'novonikolayevsk-city', name:'Novo-Nikolayevsk', modernName:'Novosibirsk', regionId:'western_siberia', longitude:82.92, latitude:55.03, populationCategory:'major', industrialImportance:55, railwayImportance:100, politicalImportance:60, labelPriority:1, periodNote:'Renamed Novosibirsk in 1926.' },
  { id:'irkutsk-city', name:'Irkutsk', regionId:'central_siberia', longitude:104.28, latitude:52.29, populationCategory:'major', industrialImportance:50, railwayImportance:90, politicalImportance:60, labelPriority:1 },
  { id:'vladivostok-city', name:'Vladivostok', regionId:'far_east', longitude:131.89, latitude:43.12, populationCategory:'major', industrialImportance:50, railwayImportance:95, politicalImportance:85, labelPriority:1, nationalEssential:true, port:true },
  { id:'tashkent-city', name:'Tashkent', regionId:'turkestan', longitude:69.24, latitude:41.30, populationCategory:'major', industrialImportance:55, railwayImportance:85, politicalImportance:80, labelPriority:1, nationalEssential:true },
  { id:'baku-city', name:'Baku', regionId:'azerbaijan', longitude:49.87, latitude:40.41, populationCategory:'major', industrialImportance:100, railwayImportance:75, politicalImportance:85, labelPriority:1, nationalEssential:true, port:true },
  { id:'tiflis-city', name:'Tiflis', modernName:'Tbilisi', regionId:'georgia', longitude:44.79, latitude:41.72, populationCategory:'major', industrialImportance:55, railwayImportance:80, politicalImportance:85, labelPriority:1, periodNote:'Contemporary English and Russian usage; Georgian name Tbilisi.' },
  { id:'yerevan-city', name:'Yerevan', regionId:'armenia', longitude:44.51, latitude:40.18, populationCategory:'regional', industrialImportance:35, railwayImportance:55, politicalImportance:75, labelPriority:2 },
];

export const rivers: GeographicLine[] = [
  { id:'volga', name:'Volga', importance:1, coordinates:[[32.5,57],[38,56],[44,56],[49,55.8],[47,52],[46,48],[47.5,45.7]] },
  { id:'don', name:'Don', importance:2, coordinates:[[39,54],[41,51],[40,48],[39.5,47],[39,46.5]] },
  { id:'dnieper', name:'Dnieper', importance:1, coordinates:[[32,54],[31,51],[32,49],[33,47],[33.5,46]] },
  { id:'ural-river', name:'Ural', importance:2, coordinates:[[59,57],[57,53],[54,50],[52,47],[51.5,46]] },
  { id:'ob', name:'Ob', importance:1, coordinates:[[85,51],[82,55],[80,60],[75,66]] },
  { id:'yenisei', name:'Yenisei', importance:1, coordinates:[[92,51],[91,57],[89,63],[86,70]] },
];

export const railways: GeographicLine[] = [
  { id:'trans-siberian', name:'Trans-Siberian Railway', importance:1, coordinates:[[30.3,59.9],[37.6,55.8],[49.1,55.8],[60.6,56.8],[73.4,55],[82.9,55],[104.3,52.3],[131.9,43.1]] },
  { id:'moscow-south', name:'Moscow-Southern Railway', importance:1, coordinates:[[37.6,55.8],[37.6,54],[36.2,50],[39.7,47.2],[44.5,48.7]] },
  { id:'ukraine-main', name:'Southwestern Railway', importance:2, coordinates:[[27.6,53.9],[30.5,50.5],[36.2,50],[30.7,46.5]] },
  { id:'caucasus-line', name:'Caucasus Railway', importance:2, coordinates:[[39.7,47.2],[40,44.5],[44.8,41.7],[49.9,40.4]] },
  { id:'turkestan-line', name:'Turkestan-Siberian connections', importance:2, coordinates:[[50.1,53.2],[61,51],[69.2,41.3]] },
];

export const seas = [
  { id:'baltic', name:'Baltic Sea', x:projectCoordinate([22,61])[0], y:projectCoordinate([22,61])[1] },
  { id:'black', name:'Black Sea', x:projectCoordinate([31,42])[0], y:projectCoordinate([31,42])[1] },
  { id:'caspian', name:'Caspian Sea', x:projectCoordinate([51,43])[0], y:projectCoordinate([51,43])[1] },
  { id:'arctic', name:'Arctic Ocean', x:projectCoordinate([90,78])[0], y:projectCoordinate([90,78])[1] },
] as const;

export function getCityPoint(city: HistoricalCity): [number, number] {
  return projectCoordinate([city.longitude, city.latitude]);
}

export function getLinePath(line: GeographicLine): string {
  return coordinatesToPath(line.coordinates);
}

export interface StrategicGeographyValidation {
  missingRegionIds: string[];
  duplicateRegionIds: string[];
  selfIntersections: string[];
  overlappingPairs: string[];
  gappedAdjacency: string[];
  brokenAdjacency: string[];
  asymmetricAdjacency: string[];
  outsideTerritorialMask: string[];
  citiesOutsideAssignedRegion: string[];
}

const EXPECTED_REGION_IDS = [
  'petrograd','moscow','central_industrial','tula','upper_volga','middle_volga','lower_volga','tambov','don_basin','donbas','kuban','northern_caucasus','crimea','central_ukraine','western_ukraine','belarus','karelia','northern_russia','urals','western_siberia','central_siberia','far_east','turkestan','kazakhstan','armenia','azerbaijan','georgia','baltic_frontier',
];

function orientation(a: Coordinate,b: Coordinate,c: Coordinate) { const cross=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]); return Math.abs(cross)<1e-7?0:Math.sign(cross); }
function segmentsCross(a:Coordinate,b:Coordinate,c:Coordinate,d:Coordinate) { return orientation(a,b,c)*orientation(a,b,d)<0 && orientation(c,d,a)*orientation(c,d,b)<0; }
function polygonEdges(points:Coordinate[]) { return points.map((point,index) => [point,points[(index+1)%points.length]] as const); }
function pointOnSegment(point:Coordinate,a:Coordinate,b:Coordinate) { return orientation(a,b,point)===0 && point[0]>=Math.min(a[0],b[0])-1e-7 && point[0]<=Math.max(a[0],b[0])+1e-7 && point[1]>=Math.min(a[1],b[1])-1e-7 && point[1]<=Math.max(a[1],b[1])+1e-7; }
function pointInPolygon(point:Coordinate, polygon:Coordinate[], strict=false) {
  let inside=false;
  for (let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const a=polygon[i], b=polygon[j];
    if (pointOnSegment(point,a,b)) return !strict;
    const intersects=((a[1]>point[1]) !== (b[1]>point[1])) && point[0] < ((b[0]-a[0])*(point[1]-a[1]))/(b[1]-a[1])+a[0];
    if (intersects) inside=!inside;
  }
  return inside;
}
function sharesBoundary(a:Coordinate[],b:Coordinate[]) {
  return polygonEdges(a).some(([a1,a2]) => polygonEdges(b).some(([b1,b2]) => {
    if (orientation(a1,a2,b1)!==0 || orientation(a1,a2,b2)!==0) return false;
    const useX=Math.abs(a1[0]-a2[0])>=Math.abs(a1[1]-a2[1]);
    const aa=[useX?a1[0]:a1[1],useX?a2[0]:a2[1]].sort((x,y)=>x-y); const bb=[useX?b1[0]:b1[1],useX?b2[0]:b2[1]].sort((x,y)=>x-y);
    return Math.min(aa[1],bb[1])-Math.max(aa[0],bb[0])>1e-7;
  }));
}

export function validateStrategicGeography(): StrategicGeographyValidation {
  const ids=strategicRegionPolygons.map(region=>region.id); const counts=new Map<string,number>(); ids.forEach(id=>counts.set(id,(counts.get(id)??0)+1));
  const validation: StrategicGeographyValidation = { missingRegionIds:EXPECTED_REGION_IDS.filter(id=>!counts.has(id)), duplicateRegionIds:[...counts].filter(([,count])=>count>1).map(([id])=>id), selfIntersections:[], overlappingPairs:[], gappedAdjacency:[], brokenAdjacency:[], asymmetricAdjacency:[], outsideTerritorialMask:[], citiesOutsideAssignedRegion:[] };
  for (const region of strategicRegionPolygons) {
    const edges=polygonEdges(region.coordinates);
    for (let i=0;i<edges.length;i++) for (let j=i+1;j<edges.length;j++) {
      if (Math.abs(i-j)<=1 || (i===0&&j===edges.length-1)) continue;
      if (segmentsCross(edges[i][0],edges[i][1],edges[j][0],edges[j][1])) validation.selfIntersections.push(region.id);
    }
    if (region.coordinates.some(([lon,lat])=>lon<MAP_BOUNDS.minLongitude||lon>MAP_BOUNDS.maxLongitude||lat<MAP_BOUNDS.minLatitude||lat>MAP_BOUNDS.maxLatitude)) validation.outsideTerritorialMask.push(region.id);
    const derivedNeighborIds=mapGeometries.find(item=>item.id===region.id)?.neighborIds ?? [];
    for (const neighborId of region.neighbors) {
      const neighbor=strategicRegionPolygons.find(item=>item.id===neighborId);
      if (!neighbor) validation.brokenAdjacency.push(`${region.id}:${neighborId}`);
      else if (!sharesBoundary(region.coordinates,neighbor.coordinates)) validation.gappedAdjacency.push(`${region.id}:${neighborId}`);
      if (neighbor && !neighbor.neighbors.includes(region.id)) validation.asymmetricAdjacency.push(`${region.id}:${neighborId}`);
    }
    for(const neighborId of derivedNeighborIds) if(!region.neighbors.includes(neighborId)) validation.brokenAdjacency.push(`${region.id}:unrecorded:${neighborId}`);
  }
  for (let i=0;i<strategicRegionPolygons.length;i++) for (let j=i+1;j<strategicRegionPolygons.length;j++) {
    const a=strategicRegionPolygons[i],b=strategicRegionPolygons[j];
    if (a.coordinates.some(point=>pointInPolygon(point,b.coordinates,true)) || b.coordinates.some(point=>pointInPolygon(point,a.coordinates,true))) validation.overlappingPairs.push(`${a.id}:${b.id}`);
  }
  for (const city of cities) {
    const region=strategicRegionPolygons.find(item=>item.id===city.regionId);
    if (!region || !pointInPolygon([city.longitude,city.latitude],region.coordinates)) validation.citiesOutsideAssignedRegion.push(city.id);
  }
  return validation;
}
