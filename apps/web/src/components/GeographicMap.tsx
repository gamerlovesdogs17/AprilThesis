import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react';
import type { MapMode, RegionState } from '@april-thesis/shared-types';
import { formatGameDate } from '@april-thesis/shared-types';
import {
  cities,
  formalGovernmentBoundaries,
  geographicContext,
  getAdministrativePath,
  getCityPoint,
  getLinePath,
  getProvinceCenter,
  getProvincePath,
  historicalDistricts,
  historicalProvinceDetails,
  historicalProvinces,
  historicalSites,
  isProvinceActive,
  isSiteActive,
  provinceSources,
  projectCoordinate,
  railways,
  rivers,
  seas,
  strategicAggregateBoundaries,
  type AdministrativeGeometry,
  type Coordinate,
  type GeographicLine,
  type HistoricalProvince,
  type HistoricalSite,
  type HistoricalSiteKind,
} from '@april-thesis/content';
import {
  FACTION_COLORS,
  buildContestedZonePath,
  buildInfluenceContourBands,
  getLegendForMode,
  getMapModeDescription,
  getMapModeLabel,
  getMapZoomTier,
  getRegionValueForMode,
  layoutCityLabels,
  valueToColor,
  type InfluenceNode,
} from '@april-thesis/map-engine';
import { audioManager } from '../audio/audioManager';
import { useGameStore } from '../store/gameStore';
import styles from './GeographicMap.module.css';

const MAP_MODES:MapMode[]=['political_influence','formal_administration','party_organization','trade_union_strength','factory_committee_strength','local_soviet_autonomy','security_surveillance','red_army_loyalty','economic_output','food_supply','famine_disease','unrest_strikes','nationality_movements','railway_infrastructure','propaganda_reach','intelligence_confidence'];
const MIN_ZOOM=.85,MAX_ZOOM=4.2,DRAG_THRESHOLD=5;
const MAP_VIEW_KEY='april-thesis-map-view-v6';

type AppearancePreset='historical_atlas'|'political_intelligence'|'economic_planning'|'minimal_accessibility';
interface MapLayers {
  influence:boolean;
  dominant:boolean;
  contested:boolean;
  uncertainty:boolean;
  nodes:boolean;
  cities:boolean;
  railways:boolean;
  rivers:boolean;
  provinceBorders:boolean;
  formalBorders:boolean;
  strategicAggregates:boolean;
  operations:boolean;
  activity:boolean;
}

interface TheaterDefinition {
  id:string;
  label:string;
  center:Coordinate;
  zoom:number;
}

const THEATERS:TheaterDefinition[]=[
  {id:'western-russia',label:'Western Russia',center:[38,56],zoom:2.05},
  {id:'ukraine-donbas',label:'Ukraine and Donbas',center:[34,49],zoom:2.45},
  {id:'volga-urals',label:'Volga and Urals',center:[55,55],zoom:2.05},
  {id:'caucasus',label:'Caucasus',center:[44,43],zoom:2.8},
  {id:'central-asia',label:'Central Asia',center:[69,42],zoom:1.8},
  {id:'siberia',label:'Siberia',center:[104,59],zoom:1.45},
  {id:'far-east',label:'Far East',center:[146,58],zoom:1.75},
];

const FORMAL_GOVERNMENT_NAMES:Record<string,string>={
  'armenian-ssr':'Armenian SSR','azerbaijan-ssr':'Azerbaijan SSR','bukhara-psr':'Bukharan PSR',
  'byelorussian-ssr':'Byelorussian SSR',estonia:'Estonia','far-eastern-republic':'Far Eastern Republic',
  'georgian-ssr':'Georgian SSR','khorezm-psr':'Khorezm PSR','kirghiz-assr':'Kirghiz ASSR',
  latvia:'Latvia',lithuania:'Lithuania',rsfsr:'RSFSR','turkestan-assr':'Turkestan ASSR',
  'ukrainian-ssr':'Ukrainian SSR',
};
const MAJOR_FORMAL_LABELS=new Set(['rsfsr','ukrainian-ssr','far-eastern-republic','turkestan-assr','kirghiz-assr','byelorussian-ssr']);

function clampMapZoom(value:number){return Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,value));}

function loadMapView(){
  if(typeof sessionStorage==='undefined')return {zoom:1,pan:{x:0,y:0}};
  try{
    const saved=JSON.parse(sessionStorage.getItem(MAP_VIEW_KEY)??'{}') as {zoom?:number;pan?:{x?:number;y?:number}};
    return {zoom:clampMapZoom(saved.zoom??1),pan:{x:saved.pan?.x??0,y:saved.pan?.y??0}};
  }catch{return {zoom:1,pan:{x:0,y:0}};}
}

function geometryRings(geometry:AdministrativeGeometry):number[][][]{
  return geometry.type==='Polygon'?geometry.coordinates:geometry.coordinates.flat();
}

function geometryCenter(geometry:AdministrativeGeometry):[number,number]{
  const points=geometryRings(geometry).flat();
  const longitudes=points.map(point=>point[0]),latitudes=points.map(point=>point[1]);
  return projectCoordinate([(Math.min(...longitudes)+Math.max(...longitudes))/2,(Math.min(...latitudes)+Math.max(...latitudes))/2]);
}

interface LocalProjection {
  project:(coordinate:Coordinate)=>[number,number];
  path:(geometry:AdministrativeGeometry)=>string;
  linePath:(line:GeographicLine)=>string;
}

function buildLocalProjection(geometry:AdministrativeGeometry):LocalProjection{
  const points=geometryRings(geometry).flat();
  const longitudes=points.map(point=>point[0]),latitudes=points.map(point=>point[1]);
  const minLongitude=Math.min(...longitudes),maxLongitude=Math.max(...longitudes);
  const minLatitude=Math.min(...latitudes),maxLatitude=Math.max(...latitudes);
  const centerLongitude=(minLongitude+maxLongitude)/2,centerLatitude=(minLatitude+maxLatitude)/2;
  const cosine=Math.max(.22,Math.cos(centerLatitude*Math.PI/180));
  const spanX=Math.max(.03,(maxLongitude-minLongitude)*cosine),spanY=Math.max(.03,maxLatitude-minLatitude);
  const scale=Math.min(510/spanX,360/spanY);
  const project=(coordinate:Coordinate):[number,number]=>[
    310+(coordinate[0]-centerLongitude)*cosine*scale,
    235-(coordinate[1]-centerLatitude)*scale,
  ];
  const path=(shape:AdministrativeGeometry)=>geometryRings(shape).map(ring=>ring.map(([longitude,latitude],index)=>{
    const [x,y]=project([longitude,latitude]);return `${index?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join('')+'Z').join('');
  const linePath=(line:GeographicLine)=>line.coordinates.map((coordinate,index)=>{
    const [x,y]=project(coordinate);return `${index?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join('');
  return {project,path,linePath};
}

function humanize(value:string){return value.replaceAll('_',' ').replaceAll('-',' ').replace(/\b\w/g,letter=>letter.toUpperCase());}

function classificationLabel(value:HistoricalSite['classification']){
  if(value==='documented')return 'Historical';
  if(value==='historically_plausible_composite')return 'Historically plausible composite';
  return 'Player created';
}

function SiteIcon({kind}:{kind:HistoricalSiteKind}){
  if(kind==='factory'||kind==='mine')return <g><path d="M-9 8V-3L-3-7V1L4-4V8ZM7 8V-10H11V8Z"/><path d="M-11 8H13"/></g>;
  if(kind==='railway_junction')return <g><path d="M-9-9L-3 9M9-9L3 9M-6-3H6M-4 3H4"/><circle cx="-6" cy="-9" r="2"/><circle cx="6" cy="-9" r="2"/></g>;
  if(kind==='port')return <g><path d="M0-11V8M-7-5H7M-10 2C-7 10 7 10 10 2M-4-11H4"/></g>;
  if(kind==='union_office'||kind==='party_office')return <g><path d="M-11-4L0-11 11-4M-9-3H9M-7-2V8M0-2V8M7-2V8M-11 9H11"/></g>;
  if(kind==='security_office')return <g><path d="M0-11L10-7V0C10 6 5 10 0 12-5 10-10 6-10 0V-7Z"/><circle r="3"/></g>;
  if(kind==='garrison')return <g><path d="M0-12L3-4 12-4 5 1 8 10 0 5-8 10-5 1-12-4-3-4Z"/></g>;
  if(kind==='relief_station')return <g><path d="M-10 0H10M0-10V10"/></g>;
  return <g><rect x="-8" y="-10" width="16" height="20"/><path d="M-4-5H4M-4 0H4M-4 5H2"/></g>;
}

function ProvinceDetail({province,onReturn}:{province:HistoricalProvince;onReturn:()=>void}){
  const campaign=useGameStore(state=>state.campaign)!;
  const content=useGameStore(state=>state.content);
  const record=useGameStore(state=>state.recordTutorialMilestone);
  const detailedProvince=historicalProvinceDetails.find(item=>item.id===province.id)??province;
  const projection=useMemo(()=>buildLocalProjection(detailedProvince.geometry),[detailedProvince]);
  const districts=historicalDistricts.filter(district=>district.provinceId===province.id);
  const provinceCities=cities.filter(city=>city.provinceId===province.id);
  const provinceSites=historicalSites.filter(site=>site.provinceId===province.id&&isSiteActive(site,campaign.currentDate));
  const provinceRivers=rivers.filter(line=>line.provinceId===province.id);
  const provinceRailways=railways.filter(line=>line.provinceId===province.id);
  const neighbors=province.neighborIds.map(id=>historicalProvinceDetails.find(item=>item.id===id)).filter((item):item is HistoricalProvince=>Boolean(item));
  const operations=campaign.activeOperations.filter(operation=>operation.regionId===province.strategicRegionId);
  const organizers=Object.values(campaign.organizers).filter(organizer=>organizer.assignedRegionId===province.strategicRegionId);
  const [selectedSiteId,setSelectedSiteId]=useState<string|null>(null);
  const selectedSite=provinceSites.find(site=>site.id===selectedSiteId)??null;
  const selectSite=(site:HistoricalSite)=>{setSelectedSiteId(site.id);record('local-site-inspected');audioManager.play('mapSelect');};
  const sourceTitles=province.sourceIds.map(id=>provinceSources.find(source=>source.id===id)?.title).filter((title):title is string=>Boolean(title));
  const capital=provinceCities.find(city=>city.id===province.capitalCityId);
  return <div className={styles.provinceDetail} data-testid="province-detail-view" data-province-id={province.id}>
    <div className={styles.localAtlas}>
      <svg viewBox="0 0 620 470" role="img" aria-label={`Geographic province atlas of ${province.name1921}`}>
        <defs>
          <pattern id="local-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24"/></pattern>
          <clipPath id="province-local-clip"><path d={projection.path(detailedProvince.geometry)}/></clipPath>
        </defs>
        <rect width="620" height="470" className={styles.localPaper}/><rect width="620" height="470" fill="url(#local-grid)" className={styles.localGrid}/>
        <g className={styles.localNeighbors}>{neighbors.map(neighbor=><path key={neighbor.id} d={projection.path(neighbor.geometry)}><title>{neighbor.name1921}</title></path>)}</g>
        <path d={projection.path(detailedProvince.geometry)} className={styles.localLand}/>
        <g clipPath="url(#province-local-clip)">
          <g className={styles.localDistricts} data-testid="local-district-layer">{districts.map(district=><path key={district.id} d={projection.path(district.geometry)}><title>{district.name1921}</title></path>)}</g>
          <g className={styles.localRivers} data-testid="local-river-layer">{provinceRivers.map(river=><path key={river.id} d={projection.linePath(river)}><title>{river.name}</title></path>)}</g>
          <g className={styles.localRailways} data-testid="local-railway-layer">{provinceRailways.map(railway=><path key={railway.id} d={projection.linePath(railway)}><title>{railway.name}</title></path>)}</g>
        </g>
        <path d={projection.path(detailedProvince.geometry)} className={styles.localBoundary}/>
        <g className={styles.localCities} data-testid="local-city-layer">{provinceCities.map(city=>{const [x,y]=projection.project([city.longitude,city.latitude]);const isCapital=city.id===province.capitalCityId;return <g key={city.id} transform={`translate(${x} ${y})`} data-city-id={city.id}><circle r={isCapital?6:4}/><text x="7" y="-6">{city.name}</text><title>{city.name} · {city.importanceTier} center</title></g>;})}</g>
        <g className={styles.localSites} data-testid="local-site-layer">{provinceSites.map(site=>{const [x,y]=projection.project([site.longitude,site.latitude]);return <g key={site.id} transform={`translate(${x} ${y})`} className={`${styles.siteMarker} ${selectedSiteId===site.id?styles.siteSelected:''}`} role="button" tabIndex={0} aria-label={`${site.name}, ${classificationLabel(site.classification)}`} onClick={()=>selectSite(site)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectSite(site);}}}><circle r="11"/><g className={styles.siteIcon}><SiteIcon kind={site.kind}/></g><title>{site.name} · {classificationLabel(site.classification)}</title></g>;})}</g>
        {operations.map((operation,index)=><g key={operation.id} className={styles.localOperation} transform={`translate(${310+index*20} ${235+index*16})`}><circle r="10"/><path d="M-4 0H4M0-4V4"/><title>{humanize(operation.operationId)} · strategic-area operation</title></g>)}
      </svg>
      <div className={styles.localScale}><i/>Geographic extent · longitude/latitude source geometry</div>
    </div>
    <aside className={styles.siteLedger}>
      <p>Province atlas · {formatGameDate(campaign.currentDate)}</p><h2>{province.name1921}</h2><span>{province.administrativeType} · {FORMAL_GOVERNMENT_NAMES[province.formalGovernmentId]??humanize(province.formalGovernmentId)}</span>
      <dl>
        <div><dt>Capital</dt><dd>{capital?.name??'No verified capital point in dataset'}</dd></div>
        <div><dt>Districts</dt><dd>{districts.length||'Detailed subdivisions unavailable'}</dd></div>
        <div><dt>Transport</dt><dd>{provinceRailways.length} railway · {provinceRivers.length} river segments</dd></div>
        <div><dt>Neighbors</dt><dd>{neighbors.length?neighbors.map(item=>item.name1921.replace(' Governorate','')).join(', '):'No shared land boundary recorded'}</dd></div>
        <div><dt>Strategic context</dt><dd>{content.regions.find(item=>item.id===province.strategicRegionId)?.name}</dd></div>
        <div><dt>Boundary confidence</dt><dd>{humanize(province.confidence)}</dd></div>
      </dl>
      {!districts.length&&<p className={styles.unavailableNotice}>Verified internal district geometry is unavailable here; no decorative subdivisions are drawn.</p>}
      {operations.length>0&&<section className={styles.localContext}><h3>Active operations</h3>{operations.map(operation=><p key={operation.id}>{humanize(operation.operationId)} · {operation.turnsRemaining} turn(s)</p>)}</section>}
      {organizers.length>0&&<section className={styles.localContext}><h3>Assigned organizers</h3>{organizers.map(organizer=><p key={organizer.id}>{organizer.name} · {organizer.assignment??'regional assignment'}</p>)}</section>}
      <h3>Geographic sites</h3>{provinceSites.length?provinceSites.map((site,index)=><button key={site.id} data-tutorial={index===0?'local-site':undefined} className={selectedSiteId===site.id?styles.activeSite:''} onClick={()=>selectSite(site)}><svg viewBox="-14 -14 28 28" aria-hidden="true"><SiteIcon kind={site.kind}/></svg><span><strong>{site.name}</strong><small>{humanize(site.kind)} · {classificationLabel(site.classification)}</small></span></button>):<p className={styles.unavailableNotice}>No verified or explicitly classified site is available for this province.</p>}
      {selectedSite&&<article><b>{selectedSite.name}</b><p>{selectedSite.notes??humanize(selectedSite.kind)}</p><small>{classificationLabel(selectedSite.classification)} · coordinate-assigned site</small></article>}
      <details className={styles.researchNotes}><summary>Research Notes</summary><p>{province.notes}</p><p>{sourceTitles.length?sourceTitles.join(' · '):'Full reconstruction references are catalogued in the cartographic documentation.'}</p><p>Valid {province.validFrom}{province.validUntil?`–${province.validUntil}`:' onward'} · {humanize(province.reconstructionOperation)}</p></details>
      <button className={styles.returnAtlas} onClick={onReturn}>← Return to national atlas</button>
    </aside>
  </div>;
}

function makeTextMeasurer(){
  if(typeof document==='undefined')return (text:string)=>text.length*4.4+5;
  const canvas=document.createElement('canvas');const context=canvas.getContext('2d');
  if(!context)return (text:string)=>text.length*4.4+5;
  context.font='600 6.2px monospace';
  return (text:string)=>context.measureText(text).width+5;
}

export function GeographicMap(){
  const campaign=useGameStore(state=>state.campaign)!;
  const content=useGameStore(state=>state.content);
  const mapMode=useGameStore(state=>state.mapMode);
  const setMapMode=useGameStore(state=>state.setMapMode);
  const selectedRegionId=useGameStore(state=>state.selectedRegionId);
  const selectRegion=useGameStore(state=>state.selectRegion);
  const selectedProvinceId=useGameStore(state=>state.selectedProvinceId);
  const selectProvince=useGameStore(state=>state.selectProvince);
  const view=useGameStore(state=>state.mapView);
  const setView=useGameStore(state=>state.setMapView);
  const record=useGameStore(state=>state.recordTutorialMilestone);
  const preferences=useGameStore(state=>state.preferences);
  const initialView=useMemo(loadMapView,[]);
  const [zoom,setZoom]=useState(initialView.zoom);
  const [pan,setPan]=useState(initialView.pan);
  const [dragging,setDragging]=useState(false);
  const [activeTheater,setActiveTheater]=useState<string|null>(null);
  const [appearance,setAppearance]=useState<AppearancePreset>('historical_atlas');
  const [opacity,setOpacity]=useState(.42);
  const [layers,setLayers]=useState<MapLayers>({
    influence:true,dominant:false,contested:false,uncertainty:false,nodes:false,cities:true,
    railways:true,rivers:true,provinceBorders:true,formalBorders:true,strategicAggregates:false,
    operations:true,activity:true,
  });
  const dragOrigin=useRef<{x:number;y:number;panX:number;panY:number}|null>(null);
  const didPan=useRef(false);

  const activeProvinces=useMemo(()=>historicalProvinces.filter(province=>isProvinceActive(province,campaign.currentDate)),[campaign.currentDate]);
  const selectedProvince=activeProvinces.find(item=>item.id===selectedProvinceId)??null;
  const values=Object.values(campaign.regions).map(region=>getRegionValueForMode(region,mapMode));
  const min=Math.min(...values),max=Math.max(...values);
  const legend=getLegendForMode(mapMode,campaign.regions);
  const zoomTier=getMapZoomTier(zoom,selectedRegionId);
  const selectedProvinceNeighborRegions=new Set(selectedProvince?.neighborIds.map(id=>activeProvinces.find(item=>item.id===id)?.strategicRegionId).filter((id):id is string=>Boolean(id))??[]);
  const measureText=useMemo(makeTextMeasurer,[]);

  const cityLayout=useMemo(()=>layoutCityLabels(cities.map(city=>{const [x,y]=getCityPoint(city);return {id:city.id,name:city.name,regionId:city.regionId,x,y,labelPriority:city.labelPriority,nationalEssential:city.nationalEssential,preferredOffset:city.preferredLabelOffset};}),{
    zoom,panX:pan.x,panY:pan.y,viewportWidth:1000,viewportHeight:560,selectedRegionId,
    neighborIds:selectedProvinceNeighborRegions,allLabels:preferences.allCityLabels,
    maxLabels:zoomTier==='national'?10:zoomTier==='regional'?18:26,measureText,
  }),[zoom,pan.x,pan.y,selectedRegionId,selectedProvince?.id,preferences.allCityLabels,zoomTier,measureText]);
  const cityById=useMemo(()=>new Map(cities.map(city=>[city.id,city])),[]);
  const railwaysForTier=railways.filter(line=>zoomTier!=='national'||line.importance===1);
  const riversForTier=rivers.filter(line=>zoomTier==='province'||line.importance<=(zoomTier==='national'?2:4));
  const provinceLabels=useMemo(()=>activeProvinces.filter(province=>province.id===selectedProvinceId||(zoom>=1.55&&(province.capitalCityId||province.confidence==='high'))).slice(0,zoom>=2.4?18:8).map(province=>({province,point:getProvinceCenter(province)})),[activeProvinces,selectedProvinceId,zoom]);

  const influenceNodes=useMemo<InfluenceNode[]>(()=>{
    const activeCities=cities.filter(city=>city.validFrom<=campaign.currentDate&&(!city.validUntil||campaign.currentDate<=city.validUntil));
    const cityNodes=activeCities.map(city=>{const region=campaign.regions[city.strategicRegionId];const [x,y]=getCityPoint(city);return {id:city.id,x,y,regionId:city.strategicRegionId,factionValues:{...(region?.influence??{})} as Record<string,number>};});
    const siteNodes=historicalSites.filter(site=>isSiteActive(site,campaign.currentDate)).map(site=>{const province=activeProvinces.find(item=>item.id===site.provinceId);const regionId=province?.strategicRegionId??'';const region=campaign.regions[regionId];const [x,y]=projectCoordinate([site.longitude,site.latitude]);return {id:site.id,x,y,regionId,factionValues:{...(region?.influence??{})} as Record<string,number>};}).filter(node=>node.regionId);
    return [...cityNodes,...siteNodes];
  },[campaign.currentDate,campaign.regions,activeProvinces]);
  const topFactions=useMemo(()=>{
    const totals=new Map<string,number>();
    Object.values(campaign.regions).forEach(region=>Object.entries(region.influence).forEach(([faction,value])=>totals.set(faction,(totals.get(faction)??0)+value)));
    const ordered=[...totals.entries()].sort((a,b)=>b[1]-a[1]).map(([faction])=>faction);
    return ['workersOpposition',...ordered.filter(faction=>faction!=='workersOpposition')].slice(0,4);
  },[campaign.regions]);
  const visibleFactions=layers.dominant?topFactions:['workersOpposition'];
  const contourBands=useMemo(()=>visibleFactions.flatMap(faction=>buildInfluenceContourBands(influenceNodes,faction,1000,560,[38,56,72])),[influenceNodes,visibleFactions.join('|')]);
  const contestedPath=useMemo(()=>buildContestedZonePath(influenceNodes,topFactions,1000,560,9,28),[influenceNodes,topFactions.join('|')]);
  const uncertaintyNodes=useMemo(()=>influenceNodes.map(node=>({...node,factionValues:{uncertainty:100-(campaign.regions[node.regionId]?.intelligenceReliability??50)}})),[influenceNodes,campaign.regions]);
  const uncertaintyPath=useMemo(()=>buildInfluenceContourBands(uncertaintyNodes,'uncertainty',1000,560,[46])[0]?.path??'',[uncertaintyNodes]);

  const activityMarkers=useMemo(()=>{
    const byRegion=new Map<string,{regionId:string;kind:string;label:string;priority:number}>();
    const add=(regionId:string,kind:string,label:string,priority:number)=>{const current=byRegion.get(regionId);if(!current||priority>current.priority)byRegion.set(regionId,{regionId,kind,label,priority});};
    campaign.activeOperations.forEach(operation=>add(operation.regionId,'operation',`${humanize(operation.operationId)} completing in ${operation.turnsRemaining} turn(s)`,100));
    Object.values(campaign.regions).forEach(region=>{if(region.famineSeverity>=72)add(region.id,'food',`Food emergency · famine severity ${Math.round(region.famineSeverity)}`,90);else if(region.strikeActivity>=72)add(region.id,'strike',`Major strike activity · ${Math.round(region.strikeActivity)}`,75);});
    campaign.newspapers.filter(article=>article.date===campaign.currentDate).flatMap(article=>article.linkedRegionIds??[]).forEach(regionId=>add(regionId,'report','New report available',65));
    return [...byRegion.values()].sort((a,b)=>b.priority-a.priority).slice(0,12).map(marker=>{const boundary=strategicAggregateBoundaries.find(item=>item.id===marker.regionId);return boundary?{...marker,point:geometryCenter(boundary.geometry)}:null;}).filter((marker):marker is {regionId:string;kind:string;label:string;priority:number;point:[number,number]}=>Boolean(marker));
  },[campaign.activeOperations,campaign.currentDate,campaign.newspapers,campaign.regions]);

  const formalLabels=useMemo(()=>formalGovernmentBoundaries.filter(boundary=>MAJOR_FORMAL_LABELS.has(boundary.id)).map(boundary=>({boundary,point:geometryCenter(boundary.geometry)})),[]);
  const fillFor=(region:RegionState)=>mapMode==='political_influence'?'#67272b':valueToColor(getRegionValueForMode(region,mapMode),min,max);

  useEffect(()=>{try{sessionStorage.setItem(MAP_VIEW_KEY,JSON.stringify({zoom,pan}));}catch{/* optional */}},[pan,zoom]);

  const changeZoom=(next:number,anchor={x:500,y:280})=>{const clamped=clampMapZoom(next),ratio=clamped/zoom;setPan(current=>({x:anchor.x-(anchor.x-current.x)*ratio,y:anchor.y-(anchor.y-current.y)*ratio}));setZoom(clamped);setActiveTheater(null);};
  const returnToMap=()=>{setView('national');queueMicrotask(()=>record('national-map-viewed'));};
  const reset=()=>{returnToMap();setZoom(1);setPan({x:0,y:0});selectProvince(null);selectRegion(null);setActiveTheater(null);};
  const chooseProvince=(id:string)=>{const province=activeProvinces.find(item=>item.id===id);if(!province)return;selectProvince(id);record('province-selected');audioManager.play('mapSelect');};
  const enterProvince=()=>{if(!selectedProvince)return;setView('province');queueMicrotask(()=>record('province-detail-entered'));audioManager.play('dossier');};
  const openTheater=(theater:TheaterDefinition)=>{const [x,y]=projectCoordinate(theater.center);setView('national');setZoom(theater.zoom);setPan({x:500-x*theater.zoom,y:280-y*theater.zoom});setActiveTheater(theater.id);queueMicrotask(()=>record(`theater-${theater.id}`));};
  const applyAppearance=(preset:AppearancePreset)=>{
    setAppearance(preset);
    if(preset==='historical_atlas'){setOpacity(.38);setLayers(current=>({...current,influence:true,dominant:false,contested:false,uncertainty:false,nodes:false,railways:true,rivers:true,provinceBorders:true,formalBorders:true,strategicAggregates:false}));setMapMode('political_influence');}
    if(preset==='political_intelligence'){setOpacity(.72);setLayers(current=>({...current,influence:true,dominant:true,contested:true,uncertainty:true,nodes:false,railways:false,rivers:true,provinceBorders:true,formalBorders:true,strategicAggregates:false}));setMapMode('political_influence');}
    if(preset==='economic_planning'){setOpacity(.3);setLayers(current=>({...current,influence:false,nodes:false,railways:true,rivers:true,provinceBorders:true,formalBorders:true,strategicAggregates:false}));setMapMode('railway_infrastructure');}
    if(preset==='minimal_accessibility'){setOpacity(.34);setLayers(current=>({...current,influence:false,contested:false,uncertainty:false,nodes:false,railways:false,rivers:true,provinceBorders:true,formalBorders:true,strategicAggregates:false}));setMapMode('formal_administration');}
  };
  const setLayer=(key:keyof MapLayers,value:boolean)=>setLayers(current=>({...current,[key]:value}));
  const onWheel=(event:WheelEvent<HTMLDivElement>)=>{if(view!=='national')return;event.preventDefault();const rect=event.currentTarget.getBoundingClientRect();changeZoom(zoom*(event.deltaY<0?1.12:.89),{x:((event.clientX-rect.left)/rect.width)*1000,y:((event.clientY-rect.top)/rect.height)*560});};
  const onPointerDown=(event:PointerEvent<SVGSVGElement>)=>{if(event.button!==0||view!=='national')return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);didPan.current=false;dragOrigin.current={x:event.clientX,y:event.clientY,panX:pan.x,panY:pan.y};};
  const onPointerMove=(event:PointerEvent<SVGSVGElement>)=>{const origin=dragOrigin.current;if(!origin)return;const dx=event.clientX-origin.x,dy=event.clientY-origin.y;if(!didPan.current&&Math.hypot(dx,dy)<DRAG_THRESHOLD)return;didPan.current=true;setDragging(true);const rect=event.currentTarget.getBoundingClientRect();setPan({x:origin.panX+dx*(1000/rect.width),y:origin.panY+dy*(560/rect.height)});setActiveTheater(null);};
  const endDrag=()=>{setDragging(false);dragOrigin.current=null;requestAnimationFrame(()=>{didPan.current=false;});};
  const keyboardProvince=(event:KeyboardEvent<SVGPathElement>,id:string)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();chooseProvince(id);}};
  const overviewRect={x:Math.max(0,-pan.x/zoom),y:Math.max(0,-pan.y/zoom),width:Math.min(1000,1000/zoom),height:Math.min(560,560/zoom)};

  return <section className={`${styles.mapStage} ${styles[appearance]}`} aria-label="Historical administrative atlas" data-tutorial="map-navigation">
    <div className={styles.toolbar}><div><strong>{view==='province'&&selectedProvince?selectedProvince.name1921:getMapModeLabel(mapMode)}</strong><span>{view==='province'?'Real province outline, subdivisions, transport, and classified sites':getMapModeDescription(mapMode)}</span></div><div className={styles.mapActions}>
      <button data-tutorial="map-national" data-testid="reset-map" onClick={reset}>Full map</button>
      {view==='national'&&<><button data-testid="zoom-out" aria-label="Zoom out map" onClick={()=>changeZoom(zoom/1.25)}>−</button><output aria-label="Map zoom">{Math.round(zoom*100)}%</output><button data-testid="zoom-in" aria-label="Zoom in map" onClick={()=>changeZoom(zoom*1.25)}>+</button></>}
      <select aria-label="Map appearance preset" value={appearance} onChange={event=>applyAppearance(event.target.value as AppearancePreset)}><option value="historical_atlas">Historical Atlas</option><option value="political_intelligence">Political Intelligence</option><option value="economic_planning">Economic Planning</option><option value="minimal_accessibility">Minimal Accessibility</option></select>
      <select data-tutorial="province-selector" aria-label="Select historical province" value={selectedProvinceId??''} onChange={event=>event.target.value?chooseProvince(event.target.value):reset()}><option value="">Select historical province…</option>{activeProvinces.map(province=><option value={province.id} key={province.id}>{province.name1921} · {province.administrativeType}</option>)}</select>
      <button data-tutorial="province-detail" data-testid="enter-province" disabled={!selectedProvince} onClick={enterProvince}>Province detail</button>
      {view==='national'&&<select data-tutorial="map-mode" aria-label="Map mode" value={mapMode} onChange={event=>setMapMode(event.target.value as MapMode)}>{MAP_MODES.map(mode=><option key={mode} value={mode}>{getMapModeLabel(mode)}</option>)}</select>}
    </div></div>
    {view==='national'&&<>
      <nav className={styles.theaterBar} aria-label="Geographic theaters"><span>Theaters</span>{THEATERS.map(theater=><button key={theater.id} aria-pressed={activeTheater===theater.id} onClick={()=>openTheater(theater)}>{theater.label}</button>)}{zoom>1.05&&<button onClick={reset}>Return to Full Map</button>}</nav>
      <div className={styles.layerBar}>
        <label><input data-testid="toggle-province-borders" type="checkbox" checked={layers.provinceBorders} onChange={event=>setLayer('provinceBorders',event.target.checked)}/> provinces</label>
        <button type="button" data-testid="toggle-formal-boundaries" aria-pressed={layers.formalBorders} onClick={()=>setLayer('formalBorders',!layers.formalBorders)}>formal governments</button>
        <button type="button" data-testid="toggle-strategic-aggregates" aria-pressed={layers.strategicAggregates} onClick={()=>setLayer('strategicAggregates',!layers.strategicAggregates)}>strategic aggregates</button>
        <label><input data-testid="toggle-influence" type="checkbox" checked={layers.influence} onChange={event=>setLayer('influence',event.target.checked)}/> influence contours</label>
        <label><input type="checkbox" checked={layers.dominant} disabled={!layers.influence} onChange={event=>setLayer('dominant',event.target.checked)}/> dominant factions</label>
        <label><input type="checkbox" checked={layers.contested} disabled={!layers.influence} onChange={event=>setLayer('contested',event.target.checked)}/> contested</label>
        <label><input type="checkbox" checked={layers.uncertainty} disabled={!layers.influence} onChange={event=>setLayer('uncertainty',event.target.checked)}/> uncertainty</label>
        <label><input type="checkbox" checked={layers.nodes} disabled={!layers.influence} onChange={event=>setLayer('nodes',event.target.checked)}/> political nodes</label>
        <label><input type="checkbox" checked={layers.cities} onChange={event=>setLayer('cities',event.target.checked)}/> cities</label>
        <label><input data-testid="toggle-railways" type="checkbox" checked={layers.railways} onChange={event=>setLayer('railways',event.target.checked)}/> railways</label>
        <label><input data-testid="toggle-rivers" type="checkbox" checked={layers.rivers} onChange={event=>setLayer('rivers',event.target.checked)}/> rivers</label>
        <label><input type="checkbox" checked={layers.activity} onChange={event=>setLayer('activity',event.target.checked)}/> activity</label>
        <label>opacity <input aria-label="Influence opacity" type="range" min="0.15" max="0.9" step="0.05" value={opacity} disabled={!layers.influence} onChange={event=>setOpacity(Number(event.target.value))}/></label>
      </div>
    </>}
    <div className={styles.mapFrame} onWheel={onWheel} data-testid="geographic-map">
      {view==='province'&&selectedProvince?<ProvinceDetail province={selectedProvince} onReturn={returnToMap}/>:<svg viewBox="0 0 1000 560" className={styles.map} role="group" aria-label={`${getMapModeLabel(mapMode)} historical province map`} onDragStart={event=>event.preventDefault()} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onKeyDown={event=>{if(event.key==='+')changeZoom(zoom*1.25);if(event.key==='-')changeZoom(zoom/1.25);if(event.key==='0'||event.key==='Escape')reset();}}>
        <defs>
          <pattern id="contested-hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(35)"><line y2="8" stroke="#f2d7a6" strokeOpacity=".8" strokeWidth="2"/></pattern>
          <pattern id="uncertain-hatch" patternUnits="userSpaceOnUse" width="11" height="11"><path d="M0 11L11 0M-3 3L3-3M8 14L14 8" stroke="#d8d1c2" strokeOpacity=".55" strokeWidth="1.3"/></pattern>
          <pattern id="map-texture" patternUnits="userSpaceOnUse" width="17" height="17"><circle cx="3" cy="4" r=".65" fill="#f3d9ad" opacity=".16"/><circle cx="13" cy="11" r=".45" fill="#160e0b" opacity=".25"/></pattern>
          <clipPath id="territory-clip">{activeProvinces.map(province=><path d={getProvincePath(province)} key={province.id}/>)}</clipPath>
        </defs>
        <rect width="1000" height="560" className={styles.sea}/>
        <g data-testid="map-viewport" className={`${styles.viewport} ${dragging||!preferences.mapAnimation?styles.noTransition:''} ${preferences.ambientVisualEffects?styles.ambient:''}`} style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`}}>
          <g className={styles.contextLand}>{geographicContext.map(feature=><path d={feature.path} key={feature.id} data-country={feature.name}/>)}</g>{seas.map(sea=><text key={sea.id} x={sea.x} y={sea.y} className={styles.seaLabel}>{sea.name}</text>)}
          <g className={styles.territorialLand} data-testid="province-surface-layer">{activeProvinces.map(province=>{const region=campaign.regions[province.strategicRegionId];return <path key={province.id} d={getProvincePath(province)} fill={region?fillFor(region):'#67272b'} data-province-id={province.id}/>;})}<path d={activeProvinces.map(getProvincePath).join('')} className={styles.landTexture}/></g>
          {layers.rivers&&<g className={styles.rivers} data-testid="river-layer">{riversForTier.map(river=><path key={river.id} d={getLinePath(river)}><title>{river.name}</title></path>)}</g>}
          {layers.railways&&<g className={styles.railways} data-testid="railway-layer">{railwaysForTier.map(railway=><path key={railway.id} d={getLinePath(railway)} className={railway.importance===1?styles.primaryRail:styles.secondaryRail}><title>{railway.name}</title></path>)}</g>}
          {mapMode==='political_influence'&&layers.influence&&<g data-testid="influence-layer" clipPath="url(#territory-clip)" opacity={opacity} className={styles.influenceContours}>{contourBands.map((band,index)=><path key={`${band.faction}-${band.threshold}`} d={band.path} fill={FACTION_COLORS[band.faction]??'#766'} fillOpacity={.09+index%3*.08} data-faction={band.faction} data-threshold={band.threshold}/>)}{layers.contested&&<path d={contestedPath} fill="url(#contested-hatch)" className={styles.contestedZones}/>} {layers.uncertainty&&<path d={uncertaintyPath} fill="url(#uncertain-hatch)" className={styles.uncertainZones}/>}</g>}
          {mapMode==='political_influence'&&layers.influence&&layers.nodes&&<g className={styles.politicalNodes} data-testid="political-node-layer">{influenceNodes.map(node=><circle key={node.id} cx={node.x} cy={node.y} r="1.8"><title>Political influence node · {humanize(node.regionId)}</title></circle>)}</g>}
          {layers.formalBorders&&<g className={styles.formalBoundaries} data-testid="formal-boundary-layer">{formalGovernmentBoundaries.map(boundary=><path key={boundary.id} d={getAdministrativePath(boundary.geometry)}><title>{FORMAL_GOVERNMENT_NAMES[boundary.id]??humanize(boundary.id)}</title></path>)}{formalLabels.map(({boundary,point})=><text key={boundary.id} x={point[0]} y={point[1]}>{FORMAL_GOVERNMENT_NAMES[boundary.id]??humanize(boundary.id)}</text>)}</g>}
          {layers.strategicAggregates&&<g className={styles.strategicOverlay} data-testid="strategic-aggregate-layer">{strategicAggregateBoundaries.map(boundary=><path key={boundary.id} d={getAdministrativePath(boundary.geometry)}><title>{content.regions.find(region=>region.id===boundary.id)?.name??humanize(boundary.id)} · generated province dissolve</title></path>)}</g>}
          <g className={`${styles.provinces} ${layers.provinceBorders?'':styles.noBorders}`} data-testid="province-boundary-layer">{activeProvinces.map(province=>{const selected=province.id===selectedProvinceId;return <path key={province.id} d={getProvincePath(province)} className={selected?styles.selectedProvince:styles.province} role="button" tabIndex={0} aria-label={`${province.name1921}, ${province.administrativeType}`} data-province-id={province.id} onClick={event=>{event.stopPropagation();chooseProvince(province.id);}} onDoubleClick={event=>{event.stopPropagation();chooseProvince(province.id);setView('province');record('province-detail-entered');}} onKeyDown={event=>keyboardProvince(event,province.id)}><title>{province.name1921} · {province.administrativeType} · {province.confidence} boundary confidence</title></path>;})}{provinceLabels.map(({province,point})=><text key={province.id} x={point[0]} y={point[1]} className={styles.provinceLabel}>{province.name1921.replace(' Governorate','').replace(' Oblast','')}</text>)}</g>
          {layers.cities&&<g className={styles.cities} data-testid="city-layer">{cityLayout.filter(layout=>layout.dotVisible).map(layout=>{const city=cityById.get(layout.id)!;const radius=city.populationCategory==='metropolis'?4.8:city.populationCategory==='major'?3.4:2.3;const province=activeProvinces.find(item=>item.id===city.provinceId);return <g key={city.id} data-city-id={city.id} data-label-visible={layout.labelVisible} tabIndex={0} role="button" aria-label={city.name} onClick={event=>{event.stopPropagation();if(province)chooseProvince(province.id);}}><circle cx={layout.x} cy={layout.y} r={radius}/>{layout.labelVisible&&<line x1={layout.x} y1={layout.y} x2={layout.labelX-1} y2={layout.labelY-2}/>}<text x={layout.labelX} y={layout.labelY} className={layout.labelVisible?'':styles.hoverLabel}>{city.name}</text><title>{city.name}{city.modernName?` (modern ${city.modernName})`:''} · {city.importanceTier} center</title></g>;})}</g>}
          {layers.activity&&<g className={styles.activityMarkers} data-testid="activity-marker-layer">{activityMarkers.map(marker=><g key={marker.regionId} transform={`translate(${marker.point[0]} ${marker.point[1]})`} className={styles[`activity_${marker.kind}`]} data-activity-kind={marker.kind} role="button" tabIndex={0} aria-label={marker.label} onClick={()=>{const province=activeProvinces.find(item=>item.strategicRegionId===marker.regionId);if(province)chooseProvince(province.id);}}>{marker.kind==='operation'&&<circle className={styles.operationRing} r="10"/>}<path d="M0-6L6 0 0 6-6 0Z"/><circle r="2"/><title>{marker.label}</title></g>)}</g>}
        </g>
      </svg>}
      {view==='national'&&<><div className={styles.compass} aria-hidden="true"><b>N</b><i/></div><div className={styles.overview}>real province topology · {activeProvinces.length} active units · {Math.round(zoom*100)}%</div><div className={styles.mapNote}>March 1921 reconstruction · strategic aggregates hidden by default</div>{zoom>=1.45&&<div className={styles.nationalInset} aria-label="National overview indicator"><svg viewBox="0 0 1000 560"><g>{activeProvinces.map(province=><path key={province.id} d={getProvincePath(province)}/>)}</g><rect x={overviewRect.x} y={overviewRect.y} width={overviewRect.width} height={overviewRect.height}/></svg></div>}</>}
    </div>
    <div className={styles.legend} aria-label="Map legend">{view==='national'?<>{mapMode==='political_influence'&&layers.influence?visibleFactions.map(faction=><span key={faction}><i style={{background:FACTION_COLORS[faction]??'#766'}}/>{humanize(faction)} contour</span>):legend.map(item=><span key={item.label}><i style={{background:item.color}}/>{item.label} {Math.round(item.min)}–{Math.round(item.max)}</span>)}<span><i className={styles.formalKey}/>formal government</span><span><i className={styles.boundaryKey}/>province</span>{layers.strategicAggregates&&<span><i className={styles.strategicKey}/>simulation aggregate · province dissolve</span>}<span>{formatGameDate(campaign.currentDate)} · GIS reconstruction</span></>:<span>Province-specific geographic detail · real clipped transport and district data only</span>}</div>
    <p className="sr-only">The national atlas displays GIS-derived historical provinces as the independent selectable geography. Optional strategic aggregates are generated by dissolving their member provinces and do not clip province paths.</p>
  </section>;
}
