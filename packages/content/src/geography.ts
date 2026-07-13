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

const regionPolygons: Array<{
  id: string;
  coordinates: Coordinate[];
  center: Coordinate;
  label?: Coordinate;
  labelPriority: number;
  neighbors: string[];
}> = [
  { id: 'baltic_frontier', coordinates: [[24,61],[29,61],[31,58],[31,55],[27,54],[23,56]], center:[27,57.5], labelPriority:3, neighbors:['petrograd','belarus'] },
  { id: 'petrograd', coordinates: [[29,62],[35,62],[36,59],[34,57],[31,58]], center:[31.7,59.6], labelPriority:1, neighbors:['baltic_frontier','karelia','northern_russia','moscow'] },
  { id: 'karelia', coordinates: [[29,72],[40,72],[43,66],[35,62],[29,62],[26,66]], center:[34.5,67], labelPriority:2, neighbors:['petrograd','northern_russia'] },
  { id: 'northern_russia', coordinates: [[40,75],[67,73],[70,64],[58,61],[43,66],[40,72]], center:[54,68], label:[52,70], labelPriority:1, neighbors:['karelia','petrograd','central_industrial','upper_volga','urals'] },
  { id: 'belarus', coordinates: [[23,56],[31,58],[34,55],[33,51],[27,50],[22,52]], center:[28.5,53.5], labelPriority:1, neighbors:['baltic_frontier','moscow','central_industrial','western_ukraine','central_ukraine'] },
  { id: 'western_ukraine', coordinates: [[22,52],[27,50],[31,47],[30,44.5],[24,45],[20,48]], center:[25.5,48], labelPriority:2, neighbors:['belarus','central_ukraine'] },
  { id: 'central_ukraine', coordinates: [[27,50],[33,51],[37,49],[38,46],[34,44],[30,44.5],[31,47]], center:[33.5,47.5], labelPriority:1, neighbors:['western_ukraine','belarus','tula','tambov','donbas','crimea'] },
  { id: 'crimea', coordinates: [[31.5,45.5],[36.8,45.4],[36,43.3],[33,43.1],[31,44]], center:[34.2,44.3], labelPriority:2, neighbors:['central_ukraine','donbas','kuban'] },
  { id: 'moscow', coordinates: [[33,58],[40,59],[43,56],[40,53],[34,55]], center:[37.6,55.8], labelPriority:1, neighbors:['petrograd','belarus','central_industrial','tula'] },
  { id: 'central_industrial', coordinates: [[40,62],[49,62],[51,58],[47,55],[43,56],[40,59]], center:[45,59], label:[45,60], labelPriority:2, neighbors:['moscow','northern_russia','upper_volga','tula','belarus'] },
  { id: 'tula', coordinates: [[34,55],[40,53],[42,50],[37,49],[33,51]], center:[37.5,52], labelPriority:2, neighbors:['moscow','central_industrial','tambov','central_ukraine'] },
  { id: 'upper_volga', coordinates: [[49,62],[58,61],[60,56],[55,53],[47,55],[51,58]], center:[54,57], labelPriority:1, neighbors:['central_industrial','northern_russia','urals','middle_volga','tambov'] },
  { id: 'tambov', coordinates: [[40,53],[47,55],[55,53],[52,49],[44,48],[42,50]], center:[48,51.5], labelPriority:2, neighbors:['tula','upper_volga','middle_volga','lower_volga','don_basin','central_ukraine'] },
  { id: 'middle_volga', coordinates: [[55,53],[63,54],[66,50],[60,47],[52,49]], center:[59,50.5], labelPriority:1, neighbors:['upper_volga','urals','kazakhstan','lower_volga','tambov'] },
  { id: 'lower_volga', coordinates: [[52,49],[60,47],[59,43],[51,42],[45,45],[44,48]], center:[53,45.5], labelPriority:1, neighbors:['middle_volga','kazakhstan','northern_caucasus','don_basin','tambov'] },
  { id: 'don_basin', coordinates: [[38,46],[44,48],[45,45],[43,42],[38,42],[35,44]], center:[41,44.5], labelPriority:2, neighbors:['central_ukraine','tambov','lower_volga','donbas','kuban'] },
  { id: 'donbas', coordinates: [[37,49],[42,50],[44,48],[38,46],[35,44],[34,46]], center:[38.5,47.5], labelPriority:1, neighbors:['central_ukraine','tambov','don_basin','crimea'] },
  { id: 'kuban', coordinates: [[35,44],[38,42],[43,42],[45,40],[39,39],[34,41],[31.5,43.5]], center:[38.5,41], labelPriority:2, neighbors:['crimea','don_basin','northern_caucasus','georgia'] },
  { id: 'northern_caucasus', coordinates: [[43,42],[51,42],[53,39],[48,37],[45,40]], center:[48,40], label:[49,40.6], labelPriority:2, neighbors:['kuban','lower_volga','kazakhstan','georgia','armenia','azerbaijan'] },
  { id: 'georgia', coordinates: [[39,39],[45,40],[48,37],[45,35.8],[40,36.5]], center:[43,37.6], labelPriority:1, neighbors:['kuban','northern_caucasus','armenia'] },
  { id: 'armenia', coordinates: [[45,35.8],[48,37],[50,35],[48,33],[45,33.8]], center:[47.3,35], labelPriority:2, neighbors:['georgia','northern_caucasus','azerbaijan'] },
  { id: 'azerbaijan', coordinates: [[48,37],[53,39],[55,36],[52,33.5],[50,35]], center:[52,36], labelPriority:1, neighbors:['northern_caucasus','armenia','kazakhstan','turkestan'] },
  { id: 'urals', coordinates: [[58,61],[70,64],[76,60],[73,52],[66,50],[63,54],[60,56]], center:[67,57], labelPriority:1, neighbors:['northern_russia','upper_volga','middle_volga','western_siberia','kazakhstan'] },
  { id: 'kazakhstan', coordinates: [[66,50],[73,52],[88,52],[96,48],[88,41],[70,39],[59,43],[60,47]], center:[77,46], labelPriority:1, neighbors:['urals','western_siberia','middle_volga','lower_volga','northern_caucasus','azerbaijan','turkestan'] },
  { id: 'turkestan', coordinates: [[55,36],[59,43],[70,39],[88,41],[91,32],[80,27],[63,29]], center:[73,34], labelPriority:1, neighbors:['azerbaijan','kazakhstan','western_siberia'] },
  { id: 'western_siberia', coordinates: [[70,64],[94,68],[103,61],[100,51],[96,48],[88,52],[73,52],[76,60]], center:[87,58], labelPriority:1, neighbors:['urals','kazakhstan','turkestan','central_siberia'] },
  { id: 'central_siberia', coordinates: [[94,68],[125,74],[135,66],[130,53],[117,48],[100,51],[103,61]], center:[114,61], labelPriority:1, neighbors:['western_siberia','far_east'] },
  { id: 'far_east', coordinates: [[125,74],[155,73],[176,67],[171,54],[157,48],[140,45],[130,53],[135,66]], center:[151,60], labelPriority:1, neighbors:['central_siberia'] },
];

export const mapGeometries: MapRegionGeometry[] = regionPolygons.map(region => {
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
    neighborIds: region.neighbors,
  };
});

export const geographicContext: GeographicContextFeature[] = context.features;

export const cities: HistoricalCity[] = [
  { id:'petrograd-city', name:'Petrograd', regionId:'petrograd', longitude:30.32, latitude:59.94, populationCategory:'metropolis', industrialImportance:95, railwayImportance:90, politicalImportance:100, labelPriority:1, port:true },
  { id:'moscow-city', name:'Moscow', regionId:'moscow', longitude:37.62, latitude:55.75, populationCategory:'metropolis', industrialImportance:90, railwayImportance:100, politicalImportance:100, labelPriority:1 },
  { id:'minsk-city', name:'Minsk', regionId:'belarus', longitude:27.56, latitude:53.90, populationCategory:'major', industrialImportance:45, railwayImportance:80, politicalImportance:70, labelPriority:1 },
  { id:'kiev-city', name:'Kiev', regionId:'central_ukraine', longitude:30.52, latitude:50.45, populationCategory:'major', industrialImportance:65, railwayImportance:85, politicalImportance:85, labelPriority:1 },
  { id:'kharkov-city', name:'Kharkov', regionId:'donbas', longitude:36.23, latitude:49.99, populationCategory:'major', industrialImportance:85, railwayImportance:90, politicalImportance:80, labelPriority:1 },
  { id:'odessa-city', name:'Odessa', regionId:'central_ukraine', longitude:30.73, latitude:46.48, populationCategory:'major', industrialImportance:65, railwayImportance:70, politicalImportance:65, labelPriority:2, port:true },
  { id:'rostov-city', name:'Rostov-on-Don', regionId:'don_basin', longitude:39.70, latitude:47.24, populationCategory:'major', industrialImportance:70, railwayImportance:90, politicalImportance:65, labelPriority:1 },
  { id:'tsaritsyn-city', name:'Tsaritsyn', modernName:'Volgograd', regionId:'lower_volga', longitude:44.51, latitude:48.71, populationCategory:'regional', industrialImportance:65, railwayImportance:80, politicalImportance:60, labelPriority:1, periodNote:'Name used until 1925.' },
  { id:'saratov-city', name:'Saratov', regionId:'middle_volga', longitude:46.03, latitude:51.53, populationCategory:'major', industrialImportance:55, railwayImportance:75, politicalImportance:60, labelPriority:2 },
  { id:'samara-city', name:'Samara', regionId:'middle_volga', longitude:50.10, latitude:53.20, populationCategory:'major', industrialImportance:60, railwayImportance:90, politicalImportance:65, labelPriority:1 },
  { id:'kazan-city', name:'Kazan', regionId:'upper_volga', longitude:49.11, latitude:55.79, populationCategory:'major', industrialImportance:65, railwayImportance:75, politicalImportance:75, labelPriority:1 },
  { id:'perm-city', name:'Perm', regionId:'urals', longitude:56.23, latitude:58.01, populationCategory:'major', industrialImportance:80, railwayImportance:85, politicalImportance:55, labelPriority:2 },
  { id:'ekaterinburg-city', name:'Ekaterinburg', modernName:'Yekaterinburg', regionId:'urals', longitude:60.60, latitude:56.84, populationCategory:'major', industrialImportance:85, railwayImportance:90, politicalImportance:70, labelPriority:1, periodNote:'Renamed Sverdlovsk in 1924.' },
  { id:'omsk-city', name:'Omsk', regionId:'western_siberia', longitude:73.37, latitude:54.99, populationCategory:'major', industrialImportance:55, railwayImportance:95, politicalImportance:70, labelPriority:1 },
  { id:'novonikolayevsk-city', name:'Novo-Nikolayevsk', modernName:'Novosibirsk', regionId:'western_siberia', longitude:82.92, latitude:55.03, populationCategory:'major', industrialImportance:55, railwayImportance:100, politicalImportance:60, labelPriority:1, periodNote:'Renamed Novosibirsk in 1926.' },
  { id:'irkutsk-city', name:'Irkutsk', regionId:'central_siberia', longitude:104.28, latitude:52.29, populationCategory:'major', industrialImportance:50, railwayImportance:90, politicalImportance:60, labelPriority:1 },
  { id:'vladivostok-city', name:'Vladivostok', regionId:'far_east', longitude:131.89, latitude:43.12, populationCategory:'major', industrialImportance:50, railwayImportance:95, politicalImportance:85, labelPriority:1, port:true },
  { id:'tashkent-city', name:'Tashkent', regionId:'turkestan', longitude:69.24, latitude:41.30, populationCategory:'major', industrialImportance:55, railwayImportance:85, politicalImportance:80, labelPriority:1 },
  { id:'baku-city', name:'Baku', regionId:'azerbaijan', longitude:49.87, latitude:40.41, populationCategory:'major', industrialImportance:100, railwayImportance:75, politicalImportance:85, labelPriority:1, port:true },
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
