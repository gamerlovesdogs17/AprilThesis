import { coordinatesToPath, projectCoordinate, type Coordinate } from './geography';

export interface GeoJSONPolygon { type:'Polygon'; coordinates:number[][][] }
export interface GeoJSONMultiPolygon { type:'MultiPolygon'; coordinates:number[][][][] }

export interface HistoricalProvince {
  id: string;
  name1921: string;
  alternateNames: string[];
  formalGovernmentId: string;
  administrativeType: string;
  strategicRegionId: string;
  geometry: GeoJSONPolygon | GeoJSONMultiPolygon;
  capitalCityId?: string;
  validFrom: string;
  validUntil?: string;
  sourceIds: string[];
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface ProvinceSource {
  id:string; title:string; date:string; repository:string; url:string; note:string;
}

export const provinceSources: ProvinceSource[] = [
  { id:'troitsky-nkvd-1921', title:'Схематическая административная карта РСФСР', date:'1921 (data as of 10 December 1920)', repository:'Russian National Library / National Electronic Library', url:'https://rusneb.ru/catalog/000200_000018_RU_NLR_cart_8873/', note:'Primary base for RSFSR governorates and autonomous units; compiled by P. Troitsky from NKVD data.' },
  { id:'loc-rsfsr-1922', title:'Russian Socialist Federated Soviet Republic 1922', date:'1922', repository:'Library of Congress Geography and Map Division', url:'https://www.loc.gov/resource/g7001f.ct007695/', note:'Near-contemporary comparison for national and autonomous administrative units.' },
  { id:'ukrssr-1921-divisions', title:'Administrative divisions of Ukraine, 1918–1925', date:'March 1921 state', repository:'Secondary synthesis with governorate map', url:'https://en.wikipedia.org/wiki/Administrative_divisions_of_Ukraine_(1918%E2%80%931925)', note:'Used for Ukrainian SSR governorate names and March 1921 changes; geometry remains generalized.' },
  { id:'fer-1921-divisions', title:'Far Eastern Republic administrative divisions, 1920–1922', date:'1921 state', repository:'WorldStatesmen historical registry', url:'https://www.worldstatesmen.org/Russia-FER-reg.html', note:'Used for the Far Eastern Republic oblast structure.' },
];

const RSFSR=['troitsky-nkvd-1921','loc-rsfsr-1922'];
const UKR=['ukrssr-1921-divisions','troitsky-nkvd-1921'];
const FER=['fer-1921-divisions','loc-rsfsr-1922'];

function generalizedBox(w:number,s:number,e:number,n:number): GeoJSONPolygon {
  const dx=(e-w)*.12,dy=(n-s)*.14;
  return { type:'Polygon', coordinates:[[[w,s],[e-dx,s],[e,n-dy],[e-dx,n],[w+dx,n],[w,s+dy],[w,s]]] };
}

function p(id:string,name1921:string,strategicRegionId:string,formalGovernmentId:string,administrativeType:string,bounds:[number,number,number,number],options:Partial<Omit<HistoricalProvince,'id'|'name1921'|'strategicRegionId'|'formalGovernmentId'|'administrativeType'|'geometry'>>={}):HistoricalProvince {
  return { id,name1921,alternateNames:[],formalGovernmentId,administrativeType,strategicRegionId,geometry:generalizedBox(...bounds),validFrom:'1921-01',sourceIds:RSFSR,confidence:'medium',notes:'Boundary generalized for national-atlas legibility from the cited near-contemporary administrative maps; not cadastral geometry.',...options };
}

export const historicalProvinces: HistoricalProvince[] = [
  p('estonia-republic','Republic of Estonia','baltic_frontier','estonia','independent republic',[23.2,57.4,28.2,60],{validFrom:'1918-02',confidence:'high'}),
  p('latvia-republic','Republic of Latvia','baltic_frontier','latvia','independent republic',[20.8,55.7,28.3,58.2],{validFrom:'1918-11',confidence:'high'}),
  p('lithuania-republic','Republic of Lithuania','baltic_frontier','lithuania','independent republic',[21,53.8,27.1,56.4],{validFrom:'1918-02',confidence:'high'}),
  p('petrograd-governorate','Petrograd Governorate','petrograd','rsfsr','governorate',[28.4,58.4,35.2,61.6],{alternateNames:['Petrograd Guberniya'],capitalCityId:'petrograd-city',confidence:'high'}),
  p('pskov-governorate','Pskov Governorate','petrograd','rsfsr','governorate',[26.8,56.1,31.2,59]),
  p('novgorod-governorate','Novgorod Governorate','petrograd','rsfsr','governorate',[31,56.2,38.4,59.4]),
  p('cherepovets-governorate','Cherepovets Governorate','central_industrial','rsfsr','governorate',[35.5,58.2,41.4,61.2],{validFrom:'1918-06'}),
  p('karelian-labour-commune','Karelian Labour Commune','karelia','rsfsr','autonomous labour commune',[29.4,61,37.2,66.7],{validFrom:'1920-06',confidence:'high'}),
  p('murmansk-governorate','Murmansk Governorate','karelia','rsfsr','governorate',[30,66,43,72.2]),
  p('arkhangelsk-governorate','Arkhangelsk Governorate','northern_russia','rsfsr','governorate',[39,64,58.5,74]),
  p('north-dvina-governorate','North Dvina Governorate','northern_russia','rsfsr','governorate',[44,59.8,60.5,66.2],{validFrom:'1918-06'}),
  p('vologda-governorate','Vologda Governorate','central_industrial','rsfsr','governorate',[37,58.3,48.5,62.4]),
  p('moscow-governorate','Moscow Governorate','moscow','rsfsr','governorate',[34.8,54.1,40.4,57.4],{capitalCityId:'moscow-city',confidence:'high'}),
  p('tver-governorate','Tver Governorate','moscow','rsfsr','governorate',[32.7,56,38.8,59.3]),
  p('rybinsk-governorate','Rybinsk Governorate','central_industrial','rsfsr','governorate',[37.2,57,41.4,59.3],{validFrom:'1921-02'}),
  p('yaroslavl-governorate','Yaroslavl Governorate','central_industrial','rsfsr','governorate',[38.6,56,42.3,58.3]),
  p('ivanovo-voznesensk-governorate','Ivanovo-Voznesensk Governorate','central_industrial','rsfsr','governorate',[40.2,55,44.8,58.1],{validFrom:'1918-06'}),
  p('vladimir-governorate','Vladimir Governorate','central_industrial','rsfsr','governorate',[38.5,53.8,43.8,56.4]),
  p('kostroma-governorate','Kostroma Governorate','central_industrial','rsfsr','governorate',[41.5,56.8,48.7,60.4]),
  p('kaluga-governorate','Kaluga Governorate','tula','rsfsr','governorate',[32.8,52.8,37.8,55.5]),
  p('tula-governorate','Tula Governorate','tula','rsfsr','governorate',[35.6,52.1,40,54.4]),
  p('oryol-governorate','Oryol Governorate','tula','rsfsr','governorate',[33.8,50.8,39.5,53.1]),
  p('bryansk-governorate','Bryansk Governorate','tula','rsfsr','governorate',[31,51.5,35.7,54.2],{validFrom:'1920-04'}),
  p('smolensk-governorate','Smolensk Governorate','belarus','rsfsr','governorate',[29.2,53,34.5,56.5]),
  p('minsk-governorate','Minsk Governorate','belarus','byelorussian-ssr','governorate / reduced SSR territory',[24.8,51.8,30.8,55.3],{capitalCityId:'minsk-city',confidence:'medium'}),
  p('gomel-governorate','Gomel Governorate','belarus','rsfsr','governorate',[28,50.5,33.8,54.2],{validFrom:'1919-04'}),
  p('vitebsk-governorate','Vitebsk Governorate','belarus','rsfsr','governorate',[27.2,54,32,57.4]),
  p('volhynia-governorate','Volhynia Governorate','western_ukraine','ukrainian-ssr','governorate',[22.8,48.8,28.6,52.2],{sourceIds:UKR}),
  p('podolia-governorate','Podolia Governorate','western_ukraine','ukrainian-ssr','governorate',[25,46.8,30.5,50.3],{sourceIds:UKR}),
  p('kiev-governorate','Kiev Governorate','central_ukraine','ukrainian-ssr','governorate',[27.8,48.8,33.4,52.3],{capitalCityId:'kiev-city',sourceIds:UKR,confidence:'high'}),
  p('chernigov-governorate','Chernigov Governorate','central_ukraine','ukrainian-ssr','governorate',[29.8,50.5,34.8,53.5],{alternateNames:['Chernihiv Governorate'],sourceIds:UKR}),
  p('poltava-governorate','Poltava Governorate','central_ukraine','ukrainian-ssr','governorate',[31.5,48.5,36.5,51.4],{sourceIds:UKR}),
  p('kharkov-governorate','Kharkov Governorate','central_ukraine','ukrainian-ssr','governorate',[34.5,48.5,39.6,51.5],{capitalCityId:'kharkov-city',sourceIds:UKR}),
  p('ekaterinoslav-governorate','Ekaterinoslav Governorate','central_ukraine','ukrainian-ssr','governorate',[32.5,46.5,38.4,49.6],{alternateNames:['Katerynoslav Governorate'],sourceIds:UKR}),
  p('donetsk-governorate','Donetsk Governorate','donbas','ukrainian-ssr','governorate',[36.7,46.8,41.8,50.2],{validFrom:'1920-04',sourceIds:UKR,confidence:'high'}),
  p('nikolayev-governorate','Nikolayev Governorate','central_ukraine','ukrainian-ssr','governorate',[29.4,45.2,34.7,48.3],{alternateNames:['Mykolaiv Governorate'],sourceIds:UKR}),
  p('odessa-governorate','Odessa Governorate','central_ukraine','ukrainian-ssr','governorate',[27.2,44.8,31.5,48],{capitalCityId:'odessa-city',sourceIds:UKR}),
  p('crimean-revcom','Crimean Revolutionary Committee','crimea','rsfsr','revolutionary committee territory',[31.5,43,37.4,46],{validFrom:'1920-11',validUntil:'1921-10',confidence:'high'}),
  p('tambov-governorate','Tambov Governorate','tambov','rsfsr','governorate',[39,49.5,44.8,53.6]),
  p('nizhny-novgorod-governorate','Nizhny Novgorod Governorate','upper_volga','rsfsr','governorate',[42,53.5,47.8,57.8]),
  p('vyatka-governorate','Vyatka Governorate','upper_volga','rsfsr','governorate',[46.5,55.5,55.7,61.5]),
  p('tatar-assr','Tatar ASSR','upper_volga','rsfsr','autonomous soviet socialist republic',[47,54,52.5,57.2],{validFrom:'1920-05',capitalCityId:'kazan-city',confidence:'high'}),
  p('mari-autonomous-oblast','Mari Autonomous Oblast','upper_volga','rsfsr','autonomous oblast',[44.8,55,49.2,57.4],{validFrom:'1920-11'}),
  p('chuvash-autonomous-oblast','Chuvash Autonomous Oblast','upper_volga','rsfsr','autonomous oblast',[45,53.8,49.2,56.1],{validFrom:'1920-06'}),
  p('penza-governorate','Penza Governorate','middle_volga','rsfsr','governorate',[42.4,50.8,47.8,54.2]),
  p('simbirsk-governorate','Simbirsk Governorate','middle_volga','rsfsr','governorate',[46.5,51.8,51.5,55.4]),
  p('samara-governorate','Samara Governorate','middle_volga','rsfsr','governorate',[48.5,50.5,54.8,54.3],{capitalCityId:'samara-city'}),
  p('saratov-governorate','Saratov Governorate','middle_volga','rsfsr','governorate',[43.5,48.5,49.5,52.3],{capitalCityId:'saratov-city'}),
  p('tsaritsyn-governorate','Tsaritsyn Governorate','lower_volga','rsfsr','governorate',[42.5,46,48.8,50.2],{capitalCityId:'tsaritsyn-city'}),
  p('astrakhan-governorate','Astrakhan Governorate','lower_volga','rsfsr','governorate',[45.5,43.5,51.5,48.2]),
  p('don-oblast','Don Oblast','don_basin','rsfsr','oblast',[37.7,45.5,43.8,49.2],{capitalCityId:'rostov-city'}),
  p('kuban-black-sea-oblast','Kuban–Black Sea Oblast','kuban','rsfsr','oblast',[36.5,42.5,44.2,46.5],{validFrom:'1920-03'}),
  p('terek-governorate','Terek Governorate','northern_caucasus','rsfsr','governorate',[41.5,41.5,48.5,45.2],{validUntil:'1921-03'}),
  p('mountain-assr','Mountain ASSR','northern_caucasus','rsfsr','autonomous soviet socialist republic',[41.8,41.7,47.8,44.5],{validFrom:'1921-01',confidence:'high'}),
  p('dagestan-assr','Dagestan ASSR','northern_caucasus','rsfsr','autonomous soviet socialist republic',[46,40.8,52,44.5],{validFrom:'1921-01',confidence:'high'}),
  p('georgian-ssr','Georgian SSR','georgia','georgian-ssr','soviet socialist republic',[39.5,40,47.8,43.5],{validFrom:'1921-02',capitalCityId:'tiflis-city',confidence:'high'}),
  p('armenian-ssr','Armenian SSR','armenia','armenian-ssr','soviet socialist republic',[43,37,50.2,41.2],{validFrom:'1920-12',capitalCityId:'yerevan-city',confidence:'high'}),
  p('azerbaijan-ssr','Azerbaijan SSR','azerbaijan','azerbaijan-ssr','soviet socialist republic',[47,37,55,42.2],{validFrom:'1920-04',capitalCityId:'baku-city',confidence:'high'}),
  p('perm-governorate','Perm Governorate','urals','rsfsr','governorate',[53.5,56,61.5,61.5],{capitalCityId:'perm-city'}),
  p('ekaterinburg-governorate','Ekaterinburg Governorate','urals','rsfsr','governorate',[58,54.5,66.5,59.6],{capitalCityId:'ekaterinburg-city',validFrom:'1919-07'}),
  p('chelyabinsk-governorate','Chelyabinsk Governorate','urals','rsfsr','governorate',[59.5,51.5,68.5,56.2],{validFrom:'1919-08'}),
  p('ufa-governorate','Ufa Governorate','urals','rsfsr','governorate',[53.5,52.3,59.5,56.8]),
  p('bashkir-assr','Bashkir ASSR','urals','rsfsr','autonomous soviet socialist republic',[54.5,50.5,61.7,55.5],{validFrom:'1919-03',confidence:'high'}),
  p('orenburg-governorate','Orenburg Governorate','kazakhstan','rsfsr','governorate / Kirghiz ASSR capital district',[50,48.5,58.5,53.5]),
  p('ural-province','Ural Province','kazakhstan','kirghiz-assr','province',[47.5,45,56.5,51.2],{validFrom:'1920-08'}),
  p('bukey-province','Bukey Province','kazakhstan','kirghiz-assr','province',[45.5,44,51.8,49.5],{validFrom:'1920-08'}),
  p('turgai-province','Turgai Province','kazakhstan','kirghiz-assr','province',[56.5,46.5,69.5,53.8],{validFrom:'1920-08'}),
  p('akmolinsk-province','Akmolinsk Province','kazakhstan','kirghiz-assr','province',[67,49.5,79.8,56.5],{validFrom:'1920-08'}),
  p('semipalatinsk-province','Semipalatinsk Province','kazakhstan','kirghiz-assr','province',[75.5,46.5,89,53.8],{validFrom:'1920-08'}),
  p('transcaspian-oblast','Transcaspian Oblast','turkestan','turkestan-assr','oblast',[53,34.5,63.5,43.2]),
  p('syr-darya-oblast','Syr-Darya Oblast','turkestan','turkestan-assr','oblast',[61,37.5,73.8,45.5],{capitalCityId:'tashkent-city'}),
  p('fergana-oblast','Fergana Oblast','turkestan','turkestan-assr','oblast',[68,37.5,76.5,42.5]),
  p('samarkand-oblast','Samarkand Oblast','turkestan','turkestan-assr','oblast',[60,36,69.5,41.5]),
  p('semirechye-oblast','Semirechye Oblast','turkestan','turkestan-assr','oblast',[72,40.5,82.5,47.5]),
  p('khorezm-peoples-republic','Khorezm People’s Soviet Republic','turkestan','khorezm-psr','people’s soviet republic',[56.5,39,63,44.5],{validFrom:'1920-04',confidence:'high'}),
  p('bukhara-peoples-republic','Bukharan People’s Soviet Republic','turkestan','bukhara-psr','people’s soviet republic',[59,35,70,42],{validFrom:'1920-10',confidence:'high'}),
  p('tyumen-governorate','Tyumen Governorate','western_siberia','rsfsr','governorate',[63,54,74,64.5],{validFrom:'1919-08'}),
  p('omsk-governorate','Omsk Governorate','western_siberia','rsfsr','governorate',[69,51.5,79.5,58.5],{capitalCityId:'omsk-city'}),
  p('tomsk-governorate','Tomsk Governorate','western_siberia','rsfsr','governorate',[77,51,91.5,61],{capitalCityId:'novonikolayevsk-city'}),
  p('altai-governorate','Altai Governorate','western_siberia','rsfsr','governorate',[78.5,47.5,90,54.5]),
  p('yeniseisk-governorate','Yeniseisk Governorate','central_siberia','rsfsr','governorate',[88,51,106,69]),
  p('irkutsk-governorate','Irkutsk Governorate','central_siberia','rsfsr','governorate',[98,47.5,116,61],{capitalCityId:'irkutsk-city'}),
  p('yakutsk-oblast','Yakutsk Oblast','central_siberia','rsfsr','oblast',[108,54,141,75]),
  p('transbaikal-oblast-fer','Transbaikal Oblast','far_east','far-eastern-republic','oblast',[104,47,121,59],{sourceIds:FER,confidence:'high'}),
  p('amur-oblast-fer','Amur Oblast','far_east','far-eastern-republic','oblast',[118,47,136,58],{sourceIds:FER,confidence:'high'}),
  p('maritime-oblast-fer','Maritime Oblast','far_east','far-eastern-republic','oblast',[128,41,141,51],{capitalCityId:'vladivostok-city',sourceIds:FER,confidence:'high'}),
  p('kamchatka-oblast-fer','Kamchatka Oblast','far_east','far-eastern-republic','oblast',[143,54,176,73],{sourceIds:FER}),
  p('sakhalin-oblast-fer','Sakhalin Oblast','far_east','far-eastern-republic','oblast',[141,45,148,56],{sourceIds:FER}),
];

function rings(province:HistoricalProvince): number[][][] {
  return province.geometry.type==='Polygon' ? province.geometry.coordinates : province.geometry.coordinates.flat();
}

export function isProvinceActive(province:HistoricalProvince,date:string):boolean {
  return province.validFrom<=date && (!province.validUntil||date<=province.validUntil);
}

export function getProvincePath(province:HistoricalProvince):string {
  return rings(province).map(ring=>coordinatesToPath(ring.map(([longitude,latitude])=>[longitude,latitude] as Coordinate),true)).join('');
}

export function getProvinceCenter(province:HistoricalProvince):[number,number] {
  const points=rings(province).flat();
  const longitude=points.reduce((sum,point)=>sum+point[0],0)/Math.max(1,points.length);
  const latitude=points.reduce((sum,point)=>sum+point[1],0)/Math.max(1,points.length);
  return projectCoordinate([longitude,latitude]);
}
