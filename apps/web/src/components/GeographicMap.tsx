import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type WheelEvent } from 'react';
import type { MapMode, RegionState } from '@april-thesis/shared-types';
import { formatGameDate } from '@april-thesis/shared-types';
import {
  cities, geographicContext, getCityPoint, getLinePath, getProvinceCenter, getProvincePath,
  historicalProvinces, isProvinceActive, railways, rivers, seas, validateStrategicGeography,
  type HistoricalCity, type HistoricalProvince,
} from '@april-thesis/content';
import { FACTION_COLORS, getDominantFactionAtNode, getLegendForMode, getMapModeDescription, getMapModeLabel, getMapZoomTier, getRegionValueForMode, layoutCityLabels, valueToColor } from '@april-thesis/map-engine';
import { audioManager } from '../audio/audioManager';
import { useGameStore } from '../store/gameStore';
import styles from './GeographicMap.module.css';

const MAP_MODES: MapMode[] = ['political_influence','formal_administration','party_organization','trade_union_strength','factory_committee_strength','local_soviet_autonomy','security_surveillance','red_army_loyalty','economic_output','food_supply','famine_disease','unrest_strikes','nationality_movements','railway_infrastructure','propaganda_reach','intelligence_confidence'];
const MIN_ZOOM=.85, MAX_ZOOM=4, DRAG_THRESHOLD=5;
const MAP_VIEW_KEY='april-thesis-map-view-v5';
type LocalSiteKind='city'|'factory'|'railway'|'port'|'union'|'security'|'garrison';
interface LocalSite { id:string; name:string; kind:LocalSiteKind; detail:string; x:number; y:number }

function loadMapView(){
  if(typeof sessionStorage==='undefined')return {zoom:1,pan:{x:0,y:0}};
  try{const saved=JSON.parse(sessionStorage.getItem(MAP_VIEW_KEY)??'{}') as {zoom?:number;pan?:{x?:number;y?:number}};return {zoom:clampMapZoom(saved.zoom??1),pan:{x:saved.pan?.x??0,y:saved.pan?.y??0}};}catch{return {zoom:1,pan:{x:0,y:0}};}
}
function clampMapZoom(value:number){return Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,value));}

function localProvincePath(province:HistoricalProvince):string {
  const rings=province.geometry.type==='Polygon'?province.geometry.coordinates:province.geometry.coordinates.flat();
  const points=rings.flat(); const xs=points.map(point=>point[0]),ys=points.map(point=>point[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const width=Math.max(1,maxX-minX),height=Math.max(1,maxY-minY);
  return rings.map(ring=>ring.map(([longitude,latitude],index)=>`${index?'L':'M'}${80+(longitude-minX)/width*500},${430-(latitude-minY)/height*370}`).join('')+'Z').join('');
}

function buildLocalSites(province:HistoricalProvince,region:RegionState,regionCities:HistoricalCity[]):LocalSite[] {
  const sites:LocalSite[]=[]; const positions=[[235,190],[355,135],[455,235],[290,320],[455,350],[155,290],[180,110]];
  regionCities.slice(0,3).forEach((city,index)=>sites.push({id:city.id,name:city.name,kind:'city',detail:`${city.populationCategory} center · industrial importance ${city.industrialImportance} · political importance ${city.politicalImportance}`,x:positions[index][0],y:positions[index][1]}));
  const principal=regionCities[0]?.name??province.name1921.replace(/ Governorate| Oblast| ASSR/,'');
  if(regionCities.some(city=>city.industrialImportance>=55))sites.push({id:'factory-belt',name:`${principal} industrial belt`,kind:'factory',detail:`Factory committees ${Math.round(region.factoryCommitteeOrganization)}/100 · production ${Math.round(region.industrialProduction)}/100`,x:positions[3][0],y:positions[3][1]});
  if(region.railwayAccess>=35)sites.push({id:'rail-junction',name:'Provincial rail junction',kind:'railway',detail:`Rail access ${Math.round(region.railwayAccess)}/100 · infrastructure ${Math.round(region.infrastructure)}/100`,x:positions[4][0],y:positions[4][1]});
  if(regionCities.some(city=>city.port))sites.push({id:'port-district',name:'Port and river landing',kind:'port',detail:'Dock labor, freight movement, and naval surveillance intersect here.',x:positions[5][0],y:positions[5][1]});
  sites.push({id:'union-bureau',name:'Trade-union bureau',kind:'union',detail:`Union organization ${Math.round(region.tradeUnionOrganization)}/100 · worker support ${Math.round(region.workerSupport)}/100`,x:positions[6][0],y:positions[6][1]});
  if(region.chekaPresence>=45)sites.push({id:'security-office',name:'Security district office',kind:'security',detail:`Cheka presence ${Math.round(region.chekaPresence)}/100 · intelligence confidence ${Math.round(region.intelligenceReliability)}/100`,x:520,y:125});
  if(region.redArmyLoyalty>=55)sites.push({id:'garrison',name:'Red Army garrison',kind:'garrison',detail:`Red Army loyalty ${Math.round(region.redArmyLoyalty)}/100`,x:520,y:315});
  return sites;
}

function SiteIcon({kind}:{kind:LocalSiteKind}) {
  if(kind==='factory')return <g><path d="M-10 8V-3L-4-7V1L3-4V8ZM7 8V-10H11V8Z"/><path d="M-12 8H13"/></g>;
  if(kind==='railway')return <g><path d="M-10-9L-4 9M10-9L4 9M-7-3H7M-5 3H5"/><circle cx="-7" cy="-9" r="2"/><circle cx="7" cy="-9" r="2"/></g>;
  if(kind==='port')return <g><path d="M0-11V8M-7-5H7M-10 2C-7 10 7 10 10 2M-4-11H4"/></g>;
  if(kind==='union')return <g><path d="M-11-4L0-11 11-4M-9-3H9M-7-2V8M0-2V8M7-2V8M-11 9H11"/></g>;
  if(kind==='security')return <g><path d="M0-11L10-7V0C10 6 5 10 0 12-5 10-10 6-10 0V-7Z"/><circle r="3"/><path d="M-7 0Q0-6 7 0Q0 6-7 0"/></g>;
  if(kind==='garrison')return <g><path d="M0-12L3-4 12-4 5 1 8 10 0 5-8 10-5 1-12-4-3-4Z"/><circle r="2"/></g>;
  return <g><circle r="9"/><circle r="3"/><path d="M-12 10H12"/></g>;
}

function ProvinceDetail({province,onReturn}:{province:HistoricalProvince;onReturn:()=>void}) {
  const campaign=useGameStore(s=>s.campaign)!; const content=useGameStore(s=>s.content); const record=useGameStore(s=>s.recordTutorialMilestone);
  const region=campaign.regions[province.strategicRegionId]; const regionCities=content.cities.filter(city=>city.regionId===province.strategicRegionId);
  const sites=useMemo(()=>buildLocalSites(province,region,regionCities),[province,region,regionCities]); const [selected,setSelected]=useState<LocalSite|null>(null);
  const inspect=(site:LocalSite)=>{setSelected(site);record('local-site-inspected');audioManager.play('mapSelect');};
  return <div className={styles.provinceDetail} data-testid="province-detail-view">
    <div className={styles.localAtlas}>
      <svg viewBox="0 0 620 470" role="img" aria-label={`Detailed local atlas of ${province.name1921}`}>
        <defs><pattern id="local-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24"/></pattern></defs>
        <rect width="620" height="470" className={styles.localPaper}/><rect width="620" height="470" fill="url(#local-grid)" className={styles.localGrid}/>
        <path d={localProvincePath(province)} className={styles.localBoundary}/>
        <path d="M90 375Q220 245 330 260T550 110" className={styles.localRail}/><path d="M120 105Q250 205 300 420" className={styles.localRiver}/>
        {sites.map(site=><g key={site.id} transform={`translate(${site.x} ${site.y})`} className={`${styles.siteMarker} ${selected?.id===site.id?styles.siteSelected:''}`} role="button" tabIndex={0} aria-label={`${site.name}: ${site.detail}`} onClick={()=>inspect(site)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();inspect(site);}}}><circle r="17"/><g className={styles.siteIcon}><SiteIcon kind={site.kind}/></g><text y="31">{site.name}</text><title>{site.detail}</title></g>)}
      </svg>
      <div className={styles.localScale}><i/>20 km generalized scale</div>
    </div>
    <aside className={styles.siteLedger}>
      <p>Local administrative atlas · {campaign.currentDate}</p><h2>{province.name1921}</h2><span>{province.administrativeType} · {province.formalGovernmentId.replaceAll('-',' ')}</span>
      <dl><div><dt>Simulation aggregate</dt><dd>{content.regions.find(item=>item.id===province.strategicRegionId)?.name}</dd></div><div><dt>Boundary confidence</dt><dd>{province.confidence}</dd></div><div><dt>Valid from</dt><dd>{province.validFrom}</dd></div><div><dt>Sources</dt><dd>{province.sourceIds.join(' · ')}</dd></div></dl>
      <h3>Sites and centers</h3>{sites.map((site,index)=><button key={site.id} data-tutorial={index===0?'local-site':undefined} className={selected?.id===site.id?styles.activeSite:''} onClick={()=>inspect(site)}><svg viewBox="-14 -14 28 28" aria-hidden="true"><SiteIcon kind={site.kind}/></svg><span><strong>{site.name}</strong><small>{site.detail}</small></span></button>)}
      {selected&&<article><b>{selected.name}</b><p>{selected.detail}</p><small>Interface map symbol · not a historical badge</small></article>}
      <button className={styles.returnAtlas} onClick={onReturn}>← Return to national atlas</button>
    </aside>
  </div>;
}

export function GeographicMap(){
  const campaign=useGameStore(state=>state.campaign)!; const content=useGameStore(state=>state.content);
  const mapMode=useGameStore(state=>state.mapMode); const setMapMode=useGameStore(state=>state.setMapMode);
  const selectedRegionId=useGameStore(state=>state.selectedRegionId); const selectRegion=useGameStore(state=>state.selectRegion); const record=useGameStore(state=>state.recordTutorialMilestone);
  const preferences=useGameStore(state=>state.preferences); const initialView=useMemo(loadMapView,[]);
  const [zoom,setZoom]=useState(initialView.zoom); const [pan,setPan]=useState(initialView.pan); const [dragging,setDragging]=useState(false); const [view,setView]=useState<'national'|'province'>('national');
  const activeProvinces=useMemo(()=>historicalProvinces.filter(province=>isProvinceActive(province,campaign.currentDate)),[campaign.currentDate]);
  const [selectedProvinceId,setSelectedProvinceId]=useState<string|null>(null); const selectedProvince=activeProvinces.find(item=>item.id===selectedProvinceId)??null;
  const [layers,setLayers]=useState({influence:true,cities:true,railways:true,borders:true,uncertainty:true,operations:true}); const [opacity,setOpacity]=useState(.68); const [debugBoundaries,setDebugBoundaries]=useState(false);
  const dragOrigin=useRef<{x:number;y:number;panX:number;panY:number}|null>(null); const didPan=useRef(false);
  const values=Object.values(campaign.regions).map(region=>getRegionValueForMode(region,mapMode)); const min=Math.min(...values),max=Math.max(...values); const legend=getLegendForMode(mapMode,campaign.regions);
  const selectedGeometry=content.mapGeometries.find(item=>item.id===selectedRegionId); const neighborIds=new Set(selectedGeometry?.neighborIds??[]); const zoomTier=getMapZoomTier(zoom,selectedRegionId);
  const cityLayout=useMemo(()=>layoutCityLabels(cities.map(city=>{const [x,y]=getCityPoint(city);return {id:city.id,name:city.name,regionId:city.regionId,x,y,labelPriority:city.labelPriority,nationalEssential:city.nationalEssential,preferredOffset:city.preferredLabelOffset};}),{zoom,selectedRegionId,neighborIds,allLabels:preferences.allCityLabels}),[zoom,selectedRegionId,preferences.allCityLabels,selectedGeometry?.neighborIds]);
  const cityById=useMemo(()=>new Map(cities.map(city=>[city.id,city])),[]); const railwaysForTier=railways.filter(line=>zoomTier!=='national'||line.importance===1); const geographyValidation=useMemo(()=>validateStrategicGeography(),[]);
  const provinceLabels=useMemo(()=>{const occupied:Array<{x:number;y:number;w:number}>=[];return activeProvinces.map(province=>{const [x,y]=getProvinceCenter(province);const w=Math.min(90,province.name1921.length*3.7+8);const visible=zoom>=1.25&&!occupied.some(box=>Math.abs(box.x-x)<(box.w+w)/2&&Math.abs(box.y-y)<12);if(visible)occupied.push({x,y,w});return {province,x,y,visible};});},[activeProvinces,zoom]);
  useEffect(()=>{try{sessionStorage.setItem(MAP_VIEW_KEY,JSON.stringify({zoom,pan}));}catch{/* Storage is optional. */}},[pan,zoom]);

  const fillFor=(region:RegionState)=>mapMode==='political_influence'?'#5d2022':valueToColor(getRegionValueForMode(region,mapMode),min,max);
  const changeZoom=(next:number,anchor={x:500,y:280})=>{const clamped=clampMapZoom(next),ratio=clamped/zoom;setPan(current=>({x:anchor.x-(anchor.x-current.x)*ratio,y:anchor.y-(anchor.y-current.y)*ratio}));setZoom(clamped);};
  const national=()=>{setView('national');record('national-map-viewed');};
  const reset=()=>{national();setZoom(1);setPan({x:0,y:0});setSelectedProvinceId(null);selectRegion(null);};
  const chooseProvince=(id:string)=>{const province=activeProvinces.find(item=>item.id===id);if(!province)return;setSelectedProvinceId(id);selectRegion(province.strategicRegionId);record('province-selected');audioManager.play('mapSelect');};
  const enterProvince=()=>{if(!selectedProvince)return;setView('province');record('province-detail-entered');audioManager.play('dossier');};
  const onWheel=(event:WheelEvent<HTMLDivElement>)=>{if(view!=='national')return;event.preventDefault();const rect=event.currentTarget.getBoundingClientRect();changeZoom(zoom*(event.deltaY<0?1.12:.89),{x:((event.clientX-rect.left)/rect.width)*1000,y:((event.clientY-rect.top)/rect.height)*560});};
  const onPointerDown=(event:PointerEvent<SVGSVGElement>)=>{if(event.button!==0||view!=='national')return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);didPan.current=false;dragOrigin.current={x:event.clientX,y:event.clientY,panX:pan.x,panY:pan.y};};
  const onPointerMove=(event:PointerEvent<SVGSVGElement>)=>{const origin=dragOrigin.current;if(!origin)return;const dx=event.clientX-origin.x,dy=event.clientY-origin.y;if(!didPan.current&&Math.hypot(dx,dy)<DRAG_THRESHOLD)return;didPan.current=true;setDragging(true);const rect=event.currentTarget.getBoundingClientRect();setPan({x:origin.panX+dx*(1000/rect.width),y:origin.panY+dy*(560/rect.height)});};
  const endDrag=()=>{setDragging(false);dragOrigin.current=null;requestAnimationFrame(()=>{didPan.current=false;});};
  const keyboardProvince=(event:KeyboardEvent<SVGPathElement>,id:string)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();chooseProvince(id);}};
  const setLayer=(key:keyof typeof layers,value:boolean)=>setLayers(current=>({...current,[key]:value}));

  return <section className={styles.mapStage} aria-label="Historical administrative atlas" data-tutorial="map-navigation">
    <div className={styles.toolbar}><div><strong>{view==='province'&&selectedProvince?selectedProvince.name1921:getMapModeLabel(mapMode)}</strong><span>{view==='province'?'Local administrative and organizational sites':getMapModeDescription(mapMode)}</span></div><div className={styles.mapActions}>
      <button data-tutorial="map-national" data-testid="reset-map" onClick={reset}>National atlas</button>
      {view==='national'&&<><button data-testid="zoom-out" aria-label="Zoom out map" onClick={()=>changeZoom(zoom/1.25)}>−</button><output aria-label="Map zoom">{Math.round(zoom*100)}%</output><button data-testid="zoom-in" aria-label="Zoom in map" onClick={()=>changeZoom(zoom*1.25)}>+</button></>}
      <select data-tutorial="province-selector" aria-label="Select historical province" value={selectedProvinceId??''} onChange={event=>event.target.value?chooseProvince(event.target.value):reset()}><option value="">Select historical province…</option>{activeProvinces.map(province=><option value={province.id} key={province.id}>{province.name1921} · {province.administrativeType}</option>)}</select>
      <button data-tutorial="province-detail" data-testid="enter-province" disabled={!selectedProvince} onClick={enterProvince}>Province detail</button>
      {view==='national'&&<select data-tutorial="map-mode" aria-label="Map mode" value={mapMode} onChange={event=>setMapMode(event.target.value as MapMode)}>{MAP_MODES.map(mode=><option key={mode} value={mode}>{getMapModeLabel(mode)}</option>)}</select>}
    </div></div>
    {view==='national'&&<div className={styles.layerBar}><label><input data-testid="toggle-influence" type="checkbox" checked={layers.influence} onChange={event=>setLayer('influence',event.target.checked)}/> political reach</label><label><input type="checkbox" checked={layers.cities} onChange={event=>setLayer('cities',event.target.checked)}/> cities</label><label><input data-testid="toggle-railways" type="checkbox" checked={layers.railways} onChange={event=>setLayer('railways',event.target.checked)}/> railways</label><label><input type="checkbox" checked={layers.borders} onChange={event=>setLayer('borders',event.target.checked)}/> province borders</label><label><input type="checkbox" checked={layers.uncertainty} onChange={event=>setLayer('uncertainty',event.target.checked)}/> uncertainty</label><label><input type="checkbox" checked={layers.operations} onChange={event=>setLayer('operations',event.target.checked)}/> operations</label><label>opacity <input aria-label="Influence opacity" type="range" min="0.15" max="1" step="0.05" value={opacity} onChange={event=>setOpacity(Number(event.target.value))}/></label>{import.meta.env.DEV&&<label><input type="checkbox" checked={debugBoundaries} onChange={event=>setDebugBoundaries(event.target.checked)}/> aggregate debug</label>}</div>}
    <div className={styles.mapFrame} onWheel={onWheel} data-testid="geographic-map">
      {view==='province'&&selectedProvince?<ProvinceDetail province={selectedProvince} onReturn={national}/>:<svg viewBox="0 0 1000 560" className={styles.map} role="group" aria-label={`${getMapModeLabel(mapMode)} historical province map`} onDragStart={event=>event.preventDefault()} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onKeyDown={event=>{if(event.key==='+')changeZoom(zoom*1.25);if(event.key==='-')changeZoom(zoom/1.25);if(event.key==='0'||event.key==='Escape')reset();}}>
        <defs>{Object.entries(FACTION_COLORS).map(([faction,color])=><pattern key={faction} id={`${faction}-pattern`} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(35)"><rect width="8" height="8" fill={color}/><line y2="8" stroke="#f5e6d3" strokeOpacity=".5" strokeWidth="2"/></pattern>)}<pattern id="uncertain" patternUnits="userSpaceOnUse" width="10" height="10"><path d="M0 10L10 0M-2 2L2-2M8 12L12 8" stroke="#fff" strokeOpacity=".28"/></pattern><filter id="surface-blur"><feGaussianBlur stdDeviation={preferences.enhancedInfluence?'16':'7'}/></filter><clipPath id="territory-clip">{content.mapGeometries.map(geometry=><path d={geometry.path} key={geometry.id}/>)}</clipPath>{content.mapGeometries.map(geometry=><clipPath id={`aggregate-clip-${geometry.id}`} key={geometry.id}><path d={geometry.path}/></clipPath>)}</defs>
        <rect width="1000" height="560" className={styles.sea}/><g data-testid="map-viewport" className={`${styles.viewport} ${dragging||!preferences.mapAnimation?styles.noTransition:''} ${preferences.ambientVisualEffects?styles.ambient:''}`} style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`}}>
          <g className={styles.contextLand}>{geographicContext.map(feature=><path d={feature.path} key={feature.id} data-country={feature.name}/>)}</g>{seas.map(sea=><text key={sea.id} x={sea.x} y={sea.y} className={styles.seaLabel}>{sea.name}</text>)}
          <g className={styles.strategicSurface}>{content.mapGeometries.map(geometry=>{const region=campaign.regions[geometry.id];return region?<path key={geometry.id} d={geometry.path} fill={fillFor(region)}/>:null;})}</g>
          <g className={styles.rivers}>{rivers.map(river=><path key={river.id} d={getLinePath(river)}><title>{river.name}</title></path>)}</g>{layers.railways&&<g className={styles.railways} data-testid="railway-layer">{railwaysForTier.map(railway=><path key={railway.id} d={getLinePath(railway)} className={railway.importance===1?styles.primaryRail:styles.secondaryRail}><title>{railway.name}</title></path>)}</g>}
          {mapMode==='political_influence'&&layers.influence&&<g data-testid="influence-layer" clipPath="url(#territory-clip)" opacity={opacity} className={styles.influenceSurface}>{content.regions.flatMap(def=>{const region=campaign.regions[def.id],dominant=getDominantFactionAtNode(region);const nodes=cities.filter(city=>city.regionId===def.id).map(getCityPoint);return (nodes.length?nodes:[[def.centerX,def.centerY] as [number,number]]).map(([x,y],index)=><circle key={`${def.id}-${index}`} cx={x} cy={y} r={20+region.influence[dominant as keyof typeof region.influence]*.34} fill={FACTION_COLORS[dominant]??'#777'} filter="url(#surface-blur)"/>);})}</g>}
          <g className={`${styles.provinces} ${layers.borders?'':styles.noBorders}`}>{content.mapGeometries.map(geometry=><g key={geometry.id} clipPath={`url(#aggregate-clip-${geometry.id})`}>{activeProvinces.filter(province=>province.strategicRegionId===geometry.id).map(province=>{const region=campaign.regions[province.strategicRegionId];const selected=province.id===selectedProvinceId;return <path key={province.id} d={getProvincePath(province)} fill={region?fillFor(region):'#6b5e4c'} className={selected?styles.selectedProvince:styles.province} role="button" tabIndex={0} aria-label={`${province.name1921}, ${province.administrativeType}`} onClick={event=>{event.stopPropagation();chooseProvince(province.id);}} onDoubleClick={event=>{event.stopPropagation();chooseProvince(province.id);setView('province');record('province-detail-entered');}} onKeyDown={event=>keyboardProvince(event,province.id)}><title>{province.name1921} · {province.administrativeType} · ${province.confidence} boundary confidence</title></path>;})}</g>)}{provinceLabels.map(({province,x,y,visible})=>(visible||province.id===selectedProvinceId)?<text key={province.id} x={x} y={y} className={styles.provinceLabel}>{province.name1921.replace(' Governorate','').replace(' Oblast','')}</text>:null)}</g>
          {layers.cities&&<g className={styles.cities} data-testid="city-layer">{cityLayout.filter(layout=>layout.dotVisible).map(layout=>{const city=cityById.get(layout.id)!;const radius=city.populationCategory==='metropolis'?5:city.populationCategory==='major'?3.6:2.5;const province=activeProvinces.find(item=>item.capitalCityId===city.id)??activeProvinces.find(item=>item.strategicRegionId===city.regionId);return <g key={city.id} data-city-id={city.id} data-label-visible={layout.labelVisible} tabIndex={0} role="button" aria-label={city.name} onClick={event=>{event.stopPropagation();if(province)chooseProvince(province.id);}}><circle cx={layout.x} cy={layout.y} r={radius}/><text x={layout.labelX} y={layout.labelY} className={layout.labelVisible?'':styles.hoverLabel}>{city.name}</text><title>{city.name}{city.modernName?` (modern ${city.modernName})`:''} · {city.periodNote??'1921 name record'}</title></g>;})}</g>}
          {layers.operations&&<g className={styles.operationMarkers}>{campaign.activeOperations.map(operation=>{const geometry=content.mapGeometries.find(item=>item.id===operation.regionId);return geometry?<g key={operation.id} transform={`translate(${geometry.centerX} ${geometry.centerY})`}><circle r="9"/><path d="M-4 0H4M0-4V4"/><title>{operation.operationId} · {operation.turnsRemaining} turn(s)</title></g>:null;})}</g>}
          {debugBoundaries&&<g className={styles.boundaryDebug}>{content.mapGeometries.map(geometry=><g key={geometry.id}><path d={geometry.path}/><text x={geometry.centerX} y={geometry.centerY}>{geometry.id}</text></g>)}</g>}
        </g>
      </svg>}
      {view==='national'&&<><div className={styles.compass} aria-hidden="true"><b>N</b><i/></div><div className={styles.overview}>historical provinces · {activeProvinces.length} active units · {Math.round(zoom*100)}%</div><div className={styles.mapNote}>Administrative boundaries generalized from dated sources · simulation aggregates hidden</div>{debugBoundaries&&<div className={styles.debugStatus}>Aggregate topology: {Object.values(geographyValidation).flat().length===0?'valid':`${Object.values(geographyValidation).flat().length} issue(s)`}</div>}</>}
    </div>
    <div className={styles.legend} aria-label="Map legend">{view==='national'?<>{legend.map(item=><span key={item.label}><i style={{background:item.color}}/>{item.label}{mapMode==='political_influence'?'':` ${Math.round(item.min)}–${Math.round(item.max)}`}</span>)}<span><i className={styles.boundaryKey}/>historical administrative boundary</span><span>{formatGameDate(campaign.currentDate)} · generalized display geometry</span></>:<span>Dedicated province atlas · select a site for local intelligence</span>}</div>
    <p className="sr-only">The national atlas displays dated historical administrative provinces over hidden strategic simulation aggregates. Province detail opens a separate local map with named icon symbols.</p>
  </section>;
}
