import type { MapMode, RegionState } from '@april-thesis/shared-types';

export interface InfluenceNode {
  id: string;
  x: number;
  y: number;
  regionId: string;
  factionValues: Record<string, number>;
}

export interface MapRegionGeometry {
  id: string;
  path: string;
  centerX: number;
  centerY: number;
  labelX: number;
  labelY: number;
  labelPriority?: number;
  neighborIds?: string[];
}

export type MapZoomTier = 'national' | 'regional' | 'province';

export interface CityLabelCandidate {
  id: string;
  name: string;
  regionId: string;
  x: number;
  y: number;
  labelPriority: number;
  nationalEssential?: boolean;
  preferredOffset?: readonly [number, number];
}

export interface CityLabelLayout extends CityLabelCandidate {
  dotVisible: boolean;
  labelVisible: boolean;
  labelX: number;
  labelY: number;
  selectedPriority: boolean;
}

export interface CityLabelLayoutOptions {
  zoom: number;
  panX?: number;
  panY?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  selectedRegionId?: string | null;
  neighborIds?: Iterable<string>;
  allLabels?: boolean;
  maxLabels?: number;
  measureText?: (text: string) => number;
}

export function getMapZoomTier(zoom: number, selectedRegionId?: string | null): MapZoomTier {
  if (selectedRegionId && zoom >= 2) return 'province';
  if (zoom >= 1.3) return 'regional';
  return 'national';
}

function boxesOverlap(a: {x:number;y:number;width:number;height:number}, b: {x:number;y:number;width:number;height:number}) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function layoutCityLabels(
  candidates: CityLabelCandidate[],
  options: CityLabelLayoutOptions,
): CityLabelLayout[] {
  const tier = getMapZoomTier(options.zoom, options.selectedRegionId);
  const neighbors = new Set(options.neighborIds ?? []);
  const eligible = candidates.filter(city => {
    if (options.allLabels) return true;
    if (tier === 'national') return Boolean(city.nationalEssential);
    if (tier === 'regional') return city.labelPriority <= 2 || city.regionId === options.selectedRegionId;
    return city.regionId === options.selectedRegionId || (neighbors.has(city.regionId) && city.labelPriority <= 2);
  });
  const ordered = eligible.slice().sort((a,b) => {
    const aSelected = a.regionId === options.selectedRegionId ? 1 : 0;
    const bSelected = b.regionId === options.selectedRegionId ? 1 : 0;
    return bSelected - aSelected || Number(Boolean(b.nationalEssential)) - Number(Boolean(a.nationalEssential)) || a.labelPriority - b.labelPriority || a.id.localeCompare(b.id);
  });
  const occupied: Array<{x:number;y:number;width:number;height:number}> = [];
  const visible = new Set<string>();
  const positions = new Map<string,{x:number;y:number}>();
  for (const city of ordered) {
    const [dx,dy] = city.preferredOffset ?? [7,-5];
    const labelX = city.x + dx; const labelY = city.y + dy;
    const screenZoom=Math.max(.01,options.zoom);
    const screenX=labelX*screenZoom+(options.panX??0);
    const screenY=labelY*screenZoom+(options.panY??0);
    const measuredWidth=options.measureText?.(city.name) ?? Math.max(18,city.name.length*4.4+5);
    const box = { x:screenX-2*screenZoom, y:screenY-8*screenZoom, width:Math.max(18,measuredWidth)*screenZoom, height:10*screenZoom };
    const insideViewport=(options.viewportWidth===undefined||box.x+box.width>=0&&box.x<=options.viewportWidth)
      &&(options.viewportHeight===undefined||box.y+box.height>=0&&box.y<=options.viewportHeight);
    const belowLimit=options.allLabels||visible.size<(options.maxLabels??Number.POSITIVE_INFINITY);
    if (insideViewport&&belowLimit&&(options.allLabels || !occupied.some(other => boxesOverlap(box,other)))) { visible.add(city.id); occupied.push(box); }
    positions.set(city.id,{x:labelX,y:labelY});
  }
  const eligibleIds = new Set(eligible.map(city => city.id));
  return candidates.map(city => ({ ...city, dotVisible:eligibleIds.has(city.id), labelVisible:visible.has(city.id), labelX:positions.get(city.id)?.x ?? city.x+7, labelY:positions.get(city.id)?.y ?? city.y-5, selectedPriority:city.regionId === options.selectedRegionId }));
}

export interface InfluenceContourBand {
  faction: string;
  threshold: number;
  path: string;
}

type GridPoint = readonly [number,number];

function interpolatePoint(a:GridPoint,b:GridPoint,aValue:number,bValue:number,threshold:number):GridPoint {
  const denominator=bValue-aValue;
  const t=Math.max(0,Math.min(1,Math.abs(denominator)<1e-9?.5:(threshold-aValue)/denominator));
  return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
}

function polygonPath(points:GridPoint[],scaleX:number,scaleY:number):string {
  if(points.length<3)return '';
  return points.map(([x,y],index)=>`${index?'L':'M'}${(x*scaleX).toFixed(2)},${(y*scaleY).toFixed(2)}`).join('')+'Z';
}

/**
 * Convert a scalar grid into a filled threshold band with marching squares.
 * Ambiguous saddle cells use their center value to choose connectivity.
 */
export function generateContourBandPath(
  field:Float32Array,
  gridWidth:number,
  gridHeight:number,
  mapWidth:number,
  mapHeight:number,
  threshold:number,
):string {
  if(field.length!==gridWidth*gridHeight||gridWidth<2||gridHeight<2)return '';
  const scaleX=mapWidth/(gridWidth-1),scaleY=mapHeight/(gridHeight-1);
  const paths:string[]=[];
  for(let y=0;y<gridHeight-1;y++)for(let x=0;x<gridWidth-1;x++){
    const aValue=field[y*gridWidth+x];
    const bValue=field[y*gridWidth+x+1];
    const cValue=field[(y+1)*gridWidth+x+1];
    const dValue=field[(y+1)*gridWidth+x];
    const a:[number,number]=[x,y],b:[number,number]=[x+1,y],c:[number,number]=[x+1,y+1],d:[number,number]=[x,y+1];
    const top=interpolatePoint(a,b,aValue,bValue,threshold);
    const right=interpolatePoint(b,c,bValue,cValue,threshold);
    const bottom=interpolatePoint(d,c,dValue,cValue,threshold);
    const left=interpolatePoint(a,d,aValue,dValue,threshold);
    const mask=(aValue>=threshold?1:0)|(bValue>=threshold?2:0)|(cValue>=threshold?4:0)|(dValue>=threshold?8:0);
    const center=(aValue+bValue+cValue+dValue)/4;
    let polygons:GridPoint[][]=[];
    switch(mask){
      case 1:polygons=[[a,top,left]];break;
      case 2:polygons=[[b,right,top]];break;
      case 3:polygons=[[a,b,right,left]];break;
      case 4:polygons=[[c,bottom,right]];break;
      case 5:polygons=center>=threshold?[[a,top,right,c,bottom,left]]:[[a,top,left],[c,bottom,right]];break;
      case 6:polygons=[[b,c,bottom,top]];break;
      case 7:polygons=[[a,b,c,bottom,left]];break;
      case 8:polygons=[[d,left,bottom]];break;
      case 9:polygons=[[a,top,bottom,d]];break;
      case 10:polygons=center>=threshold?[[b,right,bottom,d,left,top]]:[[b,right,top],[d,left,bottom]];break;
      case 11:polygons=[[a,b,right,bottom,d]];break;
      case 12:polygons=[[d,c,right,left]];break;
      case 13:polygons=[[a,top,right,c,d]];break;
      case 14:polygons=[[top,b,c,d,left]];break;
      case 15:polygons=[[a,b,c,d]];break;
    }
    for(const polygon of polygons)paths.push(polygonPath(polygon,scaleX,scaleY));
  }
  return paths.join('');
}

export function buildInfluenceContourBands(
  nodes:InfluenceNode[],
  faction:string,
  mapWidth:number,
  mapHeight:number,
  thresholds:readonly number[]=[35,55,72],
  gridWidth=58,
  gridHeight=34,
):InfluenceContourBand[] {
  const gridNodes=nodes.map(node=>({...node,x:node.x/mapWidth*(gridWidth-1),y:node.y/mapHeight*(gridHeight-1)}));
  const field=computeInfluenceField(gridNodes,gridWidth,gridHeight,faction);
  return thresholds.map(threshold=>({
    faction,
    threshold,
    path:generateContourBandPath(field,gridWidth,gridHeight,mapWidth,mapHeight,threshold),
  }));
}

export function buildContestedZonePath(
  nodes:InfluenceNode[],
  factions:readonly string[],
  mapWidth:number,
  mapHeight:number,
  maximumGap=10,
  minimumStrength=25,
  gridWidth=58,
  gridHeight=34,
):string {
  if(factions.length<2)return '';
  const gridNodes=nodes.map(node=>({...node,x:node.x/mapWidth*(gridWidth-1),y:node.y/mapHeight*(gridHeight-1)}));
  const fields=factions.map(faction=>computeInfluenceField(gridNodes,gridWidth,gridHeight,faction));
  const mask=new Float32Array(gridWidth*gridHeight);
  for(let index=0;index<mask.length;index++){
    const ordered=fields.map(field=>field[index]).sort((a,b)=>b-a);
    mask[index]=ordered[0]>=minimumStrength&&ordered[0]-ordered[1]<=maximumGap?1:0;
  }
  return generateContourBandPath(mask,gridWidth,gridHeight,mapWidth,mapHeight,.5);
}

export interface ContourLine {
  faction: string;
  points: { x: number; y: number }[];
  strength: number;
}

const FACTION_COLORS: Record<string, string> = {
  workersOpposition: '#c41e3a',
  centralCommittee: '#8b0000',
  secretariat: '#4a0e0e',
  trotsky: '#1a5276',
  zinoviev: '#6c3483',
  leftCommunist: '#d35400',
  democraticCentralist: '#27ae60',
  srUnderground: '#f39c12',
  menshevikUnderground: '#3498db',
  anarchist: '#2c3e50',
};

const FACTION_PATTERNS: Record<string, string> = {
  workersOpposition: 'diagonal-lines',
  centralCommittee: 'solid',
  secretariat: 'crosshatch',
  trotsky: 'dots',
  zinoviev: 'vertical-lines',
  leftCommunist: 'horizontal-lines',
};

export function getRegionValueForMode(region: RegionState, mode: MapMode): number {
  switch (mode) {
    case 'political_influence':
      return region.influence.workersOpposition;
    case 'formal_administration':
      return region.administrativeCapacity;
    case 'party_organization':
      return region.partyMembership;
    case 'trade_union_strength':
      return region.tradeUnionOrganization;
    case 'factory_committee_strength':
      return region.factoryCommitteeOrganization;
    case 'local_soviet_autonomy':
      return region.localSovietAutonomy;
    case 'security_surveillance':
      return region.chekaPresence;
    case 'red_army_loyalty':
      return region.redArmyLoyalty;
    case 'economic_output':
      return (region.industrialProduction + region.agriculturalProduction) / 2;
    case 'food_supply':
      return region.foodSupply;
    case 'famine_disease':
      return region.famineSeverity;
    case 'unrest_strikes':
      return (region.publicUnrest + region.strikeActivity) / 2;
    case 'nationality_movements':
      return region.nationalMovementStrength;
    case 'railway_infrastructure':
      return (region.railwayAccess + region.infrastructure) / 2;
    case 'propaganda_reach':
      return region.influence.workersOpposition * 0.6 + region.workerSupport * 0.4;
    case 'intelligence_confidence':
      return region.intelligenceReliability;
    default:
      return 50;
  }
}

export function getMapModeLabel(mode: MapMode): string {
  const labels: Record<MapMode, string> = {
    political_influence: 'Political Influence',
    formal_administration: 'Formal Administration',
    party_organization: 'Party Organization',
    trade_union_strength: 'Trade Union Strength',
    factory_committee_strength: 'Factory Committee Strength',
    local_soviet_autonomy: 'Local Soviet Autonomy',
    security_surveillance: 'Security Surveillance',
    red_army_loyalty: 'Red Army Loyalty',
    economic_output: 'Economic Output',
    food_supply: 'Food Supply',
    famine_disease: 'Famine & Disease',
    unrest_strikes: 'Unrest & Strikes',
    nationality_movements: 'Nationality Movements',
    railway_infrastructure: 'Railway & Infrastructure',
    propaganda_reach: 'Propaganda Reach',
    intelligence_confidence: 'Intelligence Confidence',
  };
  return labels[mode];
}

export function getMapModeDescription(mode: MapMode): string {
  const descriptions: Record<MapMode, string> = {
    political_influence: 'Estimated political reach of factions — not sovereign borders',
    formal_administration: 'State administrative capacity and bureaucratic control',
    party_organization: 'Density and activity of Communist Party membership',
    trade_union_strength: 'Organization and militancy of trade unions',
    factory_committee_strength: 'Worker factory committee presence and autonomy',
    local_soviet_autonomy: 'Independence of local soviets from central directives',
    security_surveillance: 'Cheka/GPU presence and surveillance intensity',
    red_army_loyalty: 'Red Army unit loyalty to central command',
    economic_output: 'Combined industrial and agricultural production',
    food_supply: 'Regional food availability relative to population',
    famine_disease: 'Famine severity and disease burden',
    unrest_strikes: 'Public unrest and strike activity',
    nationality_movements: 'Strength of national autonomy movements',
    railway_infrastructure: 'Railway access and infrastructure condition',
    propaganda_reach: 'Estimated reach of faction propaganda',
    intelligence_confidence: 'Reliability of intelligence on this region',
  };
  return descriptions[mode];
}

export function computeInfluenceField(
  nodes: InfluenceNode[],
  width: number,
  height: number,
  faction: string,
  power = 2,
): Float32Array {
  const grid = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let weightSum = 0;
      for (const node of nodes) {
        const value = node.factionValues[faction] ?? 0;
        if (value <= 0) continue;
        const dx = x - node.x;
        const dy = y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        const weight = value / Math.pow(dist, power);
        sum += weight * value;
        weightSum += weight;
      }
      grid[y * width + x] = weightSum > 0 ? sum / weightSum : 0;
    }
  }
  return grid;
}

export function getDominantFactionAtNode(region: RegionState): string {
  const inf = region.influence;
  let max = 0;
  let dominant = 'centralCommittee';
  for (const [faction, value] of Object.entries(inf)) {
    if (value > max) {
      max = value;
      dominant = faction;
    }
  }
  return dominant;
}

export function buildInfluenceNodes(
  regions: Record<string, RegionState>,
  geometries: MapRegionGeometry[],
): InfluenceNode[] {
  const nodes: InfluenceNode[] = [];
  for (const geo of geometries) {
    const region = regions[geo.id];
    if (!region) continue;
    nodes.push({
      id: `${geo.id}-center`,
      x: geo.centerX,
      y: geo.centerY,
      regionId: geo.id,
      factionValues: { ...region.influence } as Record<string, number>,
    });
  }
  return nodes;
}

export function getFactionColor(faction: string): string {
  return FACTION_COLORS[faction] ?? '#666';
}

export function getFactionPattern(faction: string): string {
  return FACTION_PATTERNS[faction] ?? 'solid';
}

export function getLegendForMode(
  mode: MapMode,
  regions: Record<string, RegionState>,
): { label: string; color: string; min: number; max: number }[] {
  const values = Object.values(regions).map(r => getRegionValueForMode(r, mode));
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (mode === 'political_influence') {
    return Object.entries(FACTION_COLORS).map(([faction, color]) => ({
      label: faction.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
      color,
      min: 0,
      max: 100,
    }));
  }
  return [
    { label: 'Low', color: '#f5e6d3', min, max: min + (max - min) * 0.33 },
    { label: 'Medium', color: '#c9a87c', min: min + (max - min) * 0.33, max: min + (max - min) * 0.66 },
    { label: 'High', color: '#8b4513', min: min + (max - min) * 0.66, max },
  ];
}

export function valueToColor(value: number, min = 0, max = 100): string {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const r = Math.round(245 - t * 150);
  const g = Math.round(230 - t * 180);
  const b = Math.round(211 - t * 150);
  return `rgb(${r},${g},${b})`;
}

export function getIntelligenceBlur(reliability: number, age: number): number {
  const baseBlur = (100 - reliability) * 0.15;
  const ageBlur = Math.min(age * 0.5, 10);
  return baseBlur + ageBlur;
}

export { FACTION_COLORS, FACTION_PATTERNS };
