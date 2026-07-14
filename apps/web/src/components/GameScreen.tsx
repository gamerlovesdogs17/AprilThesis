import type { KeyboardEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MapMode, RegionState } from '@april-thesis/shared-types';
import { formatGameDate } from '@april-thesis/shared-types';
import {
  FACTION_COLORS,
  getDominantFactionAtNode,
  getLegendForMode,
  getMapModeDescription,
  getMapModeLabel,
  getRegionValueForMode,
  valueToColor,
} from '@april-thesis/map-engine';
import { getOperationEligibility, isEventChoiceEligible } from '@april-thesis/simulation';
import { useGameStore } from '../store/gameStore';
import { SaveArchivePanel } from './AuxiliaryScreens';
import { GeographicMap } from './GeographicMap';
import { CampaignHistoryStrip, SituationBoardOverlay } from './CampaignPresentation';
import { InstitutionalBalanceChart, NationalDashboard, RegionalComparisonChart, VoteSeatingChart } from './PoliticalCharts';
import { audioManager } from '../audio/audioManager';
import { BeginnerHint, TutorialCompletionPanel, TutorialOverlay } from './GuidedOverlays';
import styles from './GameScreen.module.css';

const MAP_MODES: MapMode[] = [
  'political_influence', 'formal_administration', 'party_organization', 'trade_union_strength',
  'factory_committee_strength', 'local_soviet_autonomy',
  'security_surveillance', 'red_army_loyalty', 'economic_output', 'food_supply',
  'famine_disease', 'unrest_strikes', 'nationality_movements',
  'railway_infrastructure', 'propaganda_reach', 'intelligence_confidence',
];

const PHASE_LABELS = {
  briefing: 'National briefing', faction_management: 'Faction management',
  regional_operations: 'Regional operations', party_politics: 'Party politics',
  consequences: 'Resolution',
};

const DOCK_GROUPS = [
  { id:'situation', label:'Situation', icon:'S', tabs:[['economy','National'],['intelligence','Intelligence'],['regional','Regions']] },
  { id:'organization', label:'Organization', icon:'O', tabs:[['faction','Faction'],['organizers','Organizers'],['characters','Characters'],['institutions','Institutions']] },
  { id:'politics', label:'Politics', icon:'P', tabs:[['party','Party'],['laws','Laws'],['decisions','Decisions']] },
  { id:'press', label:'Press', icon:'N', tabs:[['newspapers','Newspapers'],['archive','Historical archive']] },
  { id:'saves', label:'Saves', icon:'D', tabs:[['saves','Save management'],['import_export','Import / export']] },
] as const;

function humanize(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function Metric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return <div className={`${styles.metric} ${danger ? styles.dangerMetric : ''}`} title={`${label}: ${value} out of 100`}>
    <span>{label}</span><strong>{Math.round(value)}</strong><i style={{ width: `${value}%` }}/>
  </div>;
}

export function LegacyCampaignMap() {
  const campaign = useGameStore(s => s.campaign)!;
  const content = useGameStore(s => s.content);
  const mapMode = useGameStore(s => s.mapMode);
  const setMapMode = useGameStore(s => s.setMapMode);
  const selectedRegionId = useGameStore(s => s.selectedRegionId);
  const selectRegion = useGameStore(s => s.selectRegion);
  const preferences = useGameStore(s => s.preferences);
  const [showInfluenceField, setShowInfluenceField] = useState(true);
  const values = Object.values(campaign.regions).map(region => getRegionValueForMode(region, mapMode));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const legend = getLegendForMode(mapMode, campaign.regions);

  const fillFor = (region: RegionState) => {
    if (mapMode === 'political_influence') {
      const dominant = getDominantFactionAtNode(region);
      const sorted = Object.values(region.influence).sort((a,b) => b-a);
      const contested = sorted[0] - sorted[1] < 12;
      if (contested || preferences.colorblindMode) return `url(#${dominant}-pattern)`;
      return FACTION_COLORS[dominant] ?? '#666';
    }
    return valueToColor(getRegionValueForMode(region, mapMode), min, max);
  };

  const keyboardSelect = (event: KeyboardEvent<SVGPathElement>, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectRegion(id); }
  };

  return <section className={styles.mapStage} aria-label="Strategic map">
    <div className={styles.mapToolbar}>
      <div><strong>{getMapModeLabel(mapMode)}</strong><span>{getMapModeDescription(mapMode)}</span></div>
      <label><input type="checkbox" checked={showInfluenceField} onChange={e => setShowInfluenceField(e.target.checked)}/> field <select aria-label="Map mode" value={mapMode} onChange={e => setMapMode(e.target.value as MapMode)}>
        {MAP_MODES.map(mode => <option value={mode} key={mode}>{getMapModeLabel(mode)}</option>)}
      </select></label>
    </div>
    <div className={styles.mapFrame}>
      <svg viewBox="55 65 585 365" className={styles.map} role="group" aria-label={`${getMapModeLabel(mapMode)} map of Soviet Russia and adjacent strategic regions`}>
        <defs>
          {Object.entries(FACTION_COLORS).map(([faction, color]) => <pattern key={faction} id={`${faction}-pattern`} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(35)"><rect width="8" height="8" fill={color}/><line x1="0" y1="0" x2="0" y2="8" stroke="#f5e6d3" strokeOpacity=".55" strokeWidth="2"/></pattern>)}
          <pattern id="uncertain" patternUnits="userSpaceOnUse" width="10" height="10"><path d="M0 10L10 0M-2 2L2-2M8 12L12 8" stroke="#fff" strokeOpacity=".35"/></pattern>
          <filter id="influence-blur"><feGaussianBlur stdDeviation="18"/></filter>
        </defs>
        <rect x="55" y="65" width="585" height="365" rx="4" className={styles.mapSea}/>
        {mapMode === 'political_influence' && showInfluenceField && <g filter="url(#influence-blur)" opacity=".44" pointerEvents="none">
          {content.regions.flatMap(def => def.influenceNodes.map(node => {
            const region = campaign.regions[def.id]; const faction = getDominantFactionAtNode(region);
            return <circle key={node.id} cx={node.x} cy={node.y} r={18 + region.influence[faction as keyof typeof region.influence] * .3} fill={FACTION_COLORS[faction] ?? '#777'}/>;
          }))}
        </g>}
        {content.mapGeometries.map(geometry => {
          const region = campaign.regions[geometry.id];
          if (!region) return null;
          const stale = region.intelligenceReliability < 35 || region.intelligenceAge > 2;
          return <g key={geometry.id} className={selectedRegionId === geometry.id ? styles.selectedRegion : ''}>
            <path
              d={geometry.path} fill={fillFor(region)} className={styles.region}
              role="button" tabIndex={0} aria-label={`${content.regions.find(r => r.id === geometry.id)?.name}: ${Math.round(getRegionValueForMode(region, mapMode))}`}
              onClick={() => selectRegion(geometry.id)} onKeyDown={e => keyboardSelect(e, geometry.id)}
            ><title>{content.regions.find(r => r.id === geometry.id)?.name}: {Math.round(getRegionValueForMode(region, mapMode))}/100 · intelligence {region.intelligenceReliability}%</title></path>
            {stale && <path d={geometry.path} fill="url(#uncertain)" pointerEvents="none"/>}
            <circle cx={geometry.centerX} cy={geometry.centerY} r={region.urbanPopulation > 500 ? 3.4 : 2.2} className={styles.cityNode}/>
            <text x={geometry.labelX} y={geometry.labelY} className={styles.mapLabel}>{content.regions.find(r => r.id === geometry.id)?.name.replace('Central ', 'C. ').replace('Western ', 'W. ')}</text>
          </g>;
        })}
      </svg>
      <div className={styles.mapStamp}>Political influence is not sovereignty · Intelligence dated {formatGameDate(campaign.currentDate)}</div>
    </div>
    <div className={styles.legend} aria-label="Map legend">{legend.map(item => <span key={item.label}><i style={{ background: item.color }}/>{item.label} {mapMode === 'political_influence' ? '' : `${Math.round(item.min)}–${Math.round(item.max)}`}</span>)}<span><i className={styles.hatch}/>contested / uncertain</span></div>
  </section>;
}

function RegionPanel() {
  const campaign = useGameStore(s => s.campaign)!;
  const content = useGameStore(s => s.content);
  const selectedRegionId = useGameStore(s => s.selectedRegionId);
  const selectedCharacterId = useGameStore(s => s.selectedCharacterId);
  const startOperation = useGameStore(s => s.startOperation);
  const [showAll, setShowAll] = useState(false);
  const availableOrganizers = Object.values(campaign.organizers).filter(org => ['available', 'assigned'].includes(org.status));
  const [organizerId, setOrganizerId] = useState(availableOrganizers[0]?.id ?? '');
  const selectedCharacter = content.characters.find(character => character.id === selectedCharacterId);
  if (selectedCharacter) {
    const state = campaign.characters[selectedCharacter.id];
    return <div className={styles.contextPanel} data-testid="character-dossier"><p className={styles.kicker}>Character dossier · {humanize(state.availability)}</p>{selectedCharacter.portraitPath ? <img className={styles.dossierPortrait} src={selectedCharacter.portraitPath} alt={`Historical portrait of ${selectedCharacter.name}`}/> : <div className={styles.dossierFallback} role="img" aria-label={`Designed portrait fallback for ${selectedCharacter.name}`}>{selectedCharacter.name.split(' ').map(part=>part[0]).slice(0,2).join('')}</div>}<h2>{selectedCharacter.name}</h2><p>{selectedCharacter.description}</p><div className={styles.regionFacts}><span><b>Office</b>{selectedCharacter.title}</span><span><b>Alignment</b>{humanize(state.factionAlignment)}</span><span><b>Trust / respect</b>{state.trust} / {state.respect}</span><span><b>Health</b>{state.health}</span><span><b>Current agenda</b>{state.currentAgenda}</span><span><b>Last action</b>{state.lastAction}</span></div><h3>Known red lines</h3><p>{selectedCharacter.redLines.join(' · ') || 'Not yet established.'}</p></div>;
  }
  const regionDef = content.regions.find(r => r.id === selectedRegionId);
  const region = selectedRegionId ? campaign.regions[selectedRegionId] : null;
  if (!region || !regionDef) return <NationalBriefing />;
  const geometry = content.mapGeometries.find(item => item.id === region.id);
  const regionCities = content.cities.filter(city => city.regionId === region.id);
  const comparisonIds = [region.id, ...(geometry?.neighborIds ?? []).slice(0, 2)];
  const operations = showAll ? content.operations : content.operations.slice(0, 6);
  const activeThisTurn = campaign.activeOperations.filter(op => op.startedTurn === campaign.turnNumber).length;
  return <div className={styles.contextPanel}>
    <p className={styles.kicker}>Regional dossier · confidence {region.intelligenceReliability}%</p>
    <h2>{regionDef.name}</h2><p>{regionDef.description}</p>
    <div className={styles.regionFacts}><span><b>Formal government</b>{region.formalGovernment}</span><span><b>Mapped cities</b>{regionCities.map(city => city.name).join(', ') || regionDef.majorCities.join(', ')}</span><span><b>Population</b>{(regionDef.urbanPopulation + regionDef.ruralPopulation).toLocaleString()} thousand</span><span><b>Economy</b>{regionDef.economicProfile}</span><span><b>Composition</b>{regionDef.ethnicComposition}</span></div>
    <RegionalComparisonChart campaign={campaign} regionIds={comparisonIds}/>
    <div className={styles.miniMeters}>
      <Metric label="Workers' Opposition" value={region.influence.workersOpposition}/><Metric label="Trade unions" value={region.tradeUnionOrganization}/><Metric label="Food supply" value={region.foodSupply}/><Metric label="Unrest" value={region.publicUnrest} danger/><Metric label="Cheka" value={region.chekaPresence} danger/>
    </div>
    <h3 data-tutorial="regional-operations">Regional operations <small>{activeThisTurn}/2 ordered this turn</small></h3>
    <label className={styles.inlineControl}>Assigned organizer <select aria-label="Assigned organizer" value={organizerId} onChange={e => setOrganizerId(e.target.value)}><option value="">No named organizer</option>{availableOrganizers.map(org => <option value={org.id} key={org.id}>{org.name} · org {org.skills.organizing} / sec {org.skills.security}</option>)}</select></label>
    <div className={styles.operationList} data-tutorial="regional-operations">{operations.map(op => {
      const resources = campaign.resources as unknown as Record<string, number>;
      const eligibility = getOperationEligibility(campaign, op, region.id, organizerId || undefined);
      const affordable = Object.entries(op.cost).every(([key,value]) => resources[key] >= value) && activeThisTurn < 2 && eligibility.eligible;
      return <button key={op.id} data-tutorial="risk-readout" disabled={!affordable} onClick={() => startOperation(region.id, op.id, organizerId || undefined)} title={eligibility.reason || op.description}>
        <strong>{op.name}</strong><span>{op.duration} turn{op.duration === 1 ? '' : 's'} · {Object.entries(op.cost).map(([k,v]) => `${humanize(k)} ${v}`).join(' · ') || 'no cost'}</span>
        <em>{eligibility.eligible ? `${eligibility.successChance}% success · ${eligibility.detectionChance}% detection` : eligibility.reason}</em>
      </button>;
    })}</div>
    <button className={styles.textButton} onClick={() => setShowAll(value => !value)}>{showAll ? 'Show priority operations' : `Show all ${content.operations.length} operations`}</button>
  </div>;
}

function NationalBriefing() {
  const campaign = useGameStore(s => s.campaign)!;
  const content = useGameStore(s => s.content);
  const hottest = useMemo(() => content.regions.map(def => ({ def, state: campaign.regions[def.id] })).sort((a,b) => (b.state.publicUnrest + b.state.famineSeverity) - (a.state.publicUnrest + a.state.famineSeverity)).slice(0,3), [campaign, content]);
  return <div className={styles.contextPanel}><p className={styles.kicker}>National briefing · {formatGameDate(campaign.currentDate)}</p><h2>The revolution after victory</h2>
    <p>War has receded, but administration, food distribution, and party unity remain near collapse. Your faction is influential among militants and weak everywhere power is formal.</p>
    <h3>Emergency telegrams</h3>{hottest.map(({def,state}) => <button className={styles.telegram} key={def.id} onClick={() => useGameStore.getState().selectRegion(def.id)}><strong>{def.name}</strong><span>Famine {state.famineSeverity} · unrest {state.publicUnrest} · intelligence {state.intelligenceReliability}%</span></button>)}
    <h3>National conditions</h3><div className={styles.miniMeters}><Metric label="Regime stability" value={campaign.nationalStats.regimeStability}/><Metric label="Party unity" value={campaign.nationalStats.partyUnity}/><Metric label="Urban food" value={campaign.nationalStats.urbanFoodSupply}/><Metric label="Famine" value={campaign.nationalStats.famineSeverity} danger/></div>
  </div>;
}

function EventDrawer() {
  const campaign = useGameStore(s => s.campaign)!;
  const content = useGameStore(s => s.content);
  const resolveEventChoice = useGameStore(s => s.resolveEventChoice);
  const researchMode = useGameStore(s => s.preferences.researchMode);
  const [mode, setMode] = useState<'compact'|'expanded'|'minimized'>(campaign.settings.tutorialMode === 'guided_tutorial' ? 'minimized' : 'compact');
  const event = content.events.find(item => item.id === campaign.currentEventId);
  useEffect(() => setMode(campaign.settings.tutorialMode === 'guided_tutorial' ? 'minimized' : 'compact'), [campaign.settings.tutorialMode, event?.id]);
  if (!event) return null;
  if (mode === 'minimized') return <button className={styles.eventTelegram} data-testid="event-minimized" onClick={() => setMode('compact')}><span>Pending decision</span><strong>{event.title}</strong><em>Open dossier</em></button>;
  return <aside className={`${styles.eventDrawer} ${mode === 'expanded' ? styles.eventExpanded : ''}`} data-testid="event-dossier" data-tutorial="event-dossier" aria-label="Active decision" aria-live="polite">
    <header className={styles.eventHeader}><div><p className={styles.kicker}>{event.historical.classification.replaceAll('_', ' ')} · {event.historical.historicalDate}</p><h2>{event.title}</h2></div><div><button aria-label="Minimize active decision" onClick={() => setMode('minimized')}>Minimize</button><button aria-label={mode === 'expanded' ? 'Compact decision dossier' : 'Expand decision dossier'} onClick={() => setMode(value => value === 'expanded' ? 'compact' : 'expanded')}>{mode === 'expanded' ? 'Compact' : 'Expand'}</button></div></header><p>{event.description}</p>
    <div className={styles.eventChoices}>{event.choices.map(choice => { const eligibility = isEventChoiceEligible(campaign, event, choice.id); return <button key={choice.id} disabled={!eligibility.eligible} title={eligibility.reason} onClick={() => resolveEventChoice(event.id, choice.id)}><strong>{choice.text}</strong>{choice.narrative && <span>{choice.narrative}</span>}{!eligibility.eligible && <em>{eligibility.reason}</em>}</button>; })}</div>
    {mode === 'expanded' && <section className={styles.eventContext}><h3>Known context</h3><p>This dossier records information already available to the organizer. Choice consequences that have not occurred remain concealed.</p>{researchMode && <details><summary>Research notes</summary><p>Sources: {event.historical.sourceIds.join(', ')}. Classification: {event.historical.classification.replaceAll('_', ' ')}.</p></details>}</section>}
  </aside>;
}

function BottomPanel() {
  const campaign = useGameStore(s => s.campaign)!;
  const content = useGameStore(s => s.content);
  const groupId = useGameStore(s => s.bottomGroup);
  const tab = useGameStore(s => s.bottomTab);
  const collapsed = useGameStore(s => s.bottomWorkspaceCollapsed);
  const setGroup = useGameStore(s => s.setBottomGroup);
  const setTab = useGameStore(s => s.setBottomTab);
  const recordTutorialMilestone = useGameStore(s => s.recordTutorialMilestone);
  const toggle = useGameStore(s => s.toggleBottomWorkspace);
  const researchMode = useGameStore(s => s.preferences.researchMode);
  const group = DOCK_GROUPS.find(item => item.id === groupId) ?? DOCK_GROUPS[0];
  const selectedTab = group.tabs.some(([id]) => id === tab) ? tab : group.tabs[0][0];
  useEffect(() => { if (selectedTab !== tab) setTab(selectedTab); }, [selectedTab, setTab, tab]);
  const chooseGroup=(id:string,firstTab:string)=>{setGroup(id,firstTab);if(id==='organization')recordTutorialMilestone('faction-management-opened');};
  const chooseTab=(id:string)=>{setTab(id);if(id==='institutions')recordTutorialMilestone('institution-opened');if(id==='laws')recordTutorialMilestone('policy-opened');};
  const navigateGroups = (event: KeyboardEvent<HTMLElement>) => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const index = DOCK_GROUPS.findIndex(item => item.id === group.id);
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? DOCK_GROUPS.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + DOCK_GROUPS.length) % DOCK_GROUPS.length;
    const nextGroup = DOCK_GROUPS[nextIndex]; chooseGroup(nextGroup.id, nextGroup.tabs[0][0]);
  };
  return <section className={`${styles.bottomPanel} ${collapsed ? styles.bottomCollapsed : ''}`} data-testid="command-dock">
    <div className={styles.dockHeader}><nav aria-label="Campaign command groups" onKeyDown={navigateGroups}>{DOCK_GROUPS.map(item => <button key={item.id} aria-label={item.label} data-tutorial={`dock-${item.id}`} aria-pressed={group.id === item.id} className={group.id === item.id ? styles.activeGroup : ''} onClick={() => chooseGroup(item.id,item.tabs[0][0])}><i aria-hidden="true">{item.icon}</i><span>{item.label}</span>{item.id === 'press' && campaign.newspapers.length > 0 && <b>{campaign.newspapers.length}</b>}</button>)}</nav><button className={styles.collapseDock} data-testid="toggle-command-dock" onClick={toggle} title="Toggle bottom workspace (Alt+B)">{collapsed ? 'Expand workspace' : 'Collapse workspace'}</button></div>
    {!collapsed && <nav className={styles.subnav} aria-label={`${group.label} sections`}>{group.tabs.map(([id,label]) => <button key={id} data-tutorial={id === 'characters' ? 'characters-view' : id === 'institutions' ? 'institutions-view' : id === 'laws' ? 'laws-view' : id === 'party' ? 'politics-view' : undefined} className={selectedTab === id ? styles.activeTab : ''} onClick={() => chooseTab(id)}>{label}</button>)}</nav>}
    {!collapsed && <div className={styles.tabContent}>
      {selectedTab === 'economy' && <><NationalDashboard campaign={campaign}/><details className={styles.ledger}><summary>Detailed economic ledger</summary><DataCards items={[
        ['Industrial production', campaign.nationalStats.industrialProduction], ['Agricultural production', campaign.nationalStats.agriculturalProduction], ['Grain reserves', campaign.nationalStats.grainReserves], ['Urban food supply', campaign.nationalStats.urbanFoodSupply], ['Inflation', campaign.nationalStats.inflation], ['Black market', campaign.nationalStats.blackMarketActivity], ['Infrastructure', campaign.nationalStats.infrastructure], ['State revenue', campaign.nationalStats.stateRevenue],
      ]}/></details></>} 
      {selectedTab === 'faction' && <FactionPanel/>}
      {selectedTab === 'organizers' && <FactionPanel/>}
      {selectedTab === 'party' && <VotePanel/>}
      {selectedTab === 'institutions' && <InstitutionsPanel/>}
      {selectedTab === 'characters' && <CharactersPanel/>}
      {selectedTab === 'intelligence' && <div className={styles.recordGrid}>{content.regions.slice().sort((a,b) => campaign.regions[a.id].intelligenceReliability - campaign.regions[b.id].intelligenceReliability).map(def => <article key={def.id}><h3>{def.name}</h3><p>Confidence {campaign.regions[def.id].intelligenceReliability}% · report age {campaign.regions[def.id].intelligenceAge} month(s)</p></article>)}</div>}
      {selectedTab === 'regional' && <RegionalComparisonChart campaign={campaign} regionIds={content.regions.slice(0,8).map(region => region.id)}/>}
      {selectedTab === 'laws' && <LawsPanel/>}
      {selectedTab === 'newspapers' && <Newspapers/>}
      {selectedTab === 'archive' && <div className={styles.recordGrid}>{content.events.map(event => <article key={event.id}><h3>{event.title}</h3><p>{humanize(event.historical.classification)} · {event.historical.historicalDate ?? 'Undated'}</p>{researchMode && <small>{event.historical.sourceIds.join(', ')}</small>}</article>)}</div>}
      {(selectedTab === 'saves' || selectedTab === 'import_export') && <SaveArchivePanel/>}
      {selectedTab === 'decisions' && <div className={styles.timeline}>{campaign.decisions.slice().reverse().map((decision,i) => <p key={`${decision.turn}-${i}`}><b>{formatGameDate(decision.date)}</b>{decision.description}</p>)}{!campaign.decisions.length && <p>No decisions recorded.</p>}</div>}
    </div>}
  </section>;
}

function DataCards({ items }: { items: (string | number)[][] }) {
  return <div className={styles.dataCards}>{items.map(([label,value]) => <div key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}

function FactionPanel() {
  const campaign = useGameStore(s => s.campaign)!;
  const selectedRegionId = useGameStore(s => s.selectedRegionId);
  const act = useGameStore(s => s.performFactionAction);
  return <div className={styles.managementPanel}>
    <div className={styles.managementHeader}><div><p className={styles.kicker}>Monthly internal work</p><h3>{campaign.factionActionsRemaining} action(s) remaining</h3><p>Budget: {Object.entries(campaign.monthlyBudget).map(([key,value]) => `${humanize(key)} ₽${value}`).join(' · ') || 'unallocated'}</p></div><div className={styles.actionStrip}><button disabled={campaign.phase !== 'faction_management' || campaign.factionActionsRemaining < 1} onClick={() => act('protect_cells')}>Protect cells · ₽5</button><button disabled={campaign.phase !== 'faction_management' || campaign.factionActionsRemaining < 1} onClick={() => act('internal_meeting')}>Internal meeting</button><button disabled={campaign.phase !== 'faction_management' || campaign.factionActionsRemaining < 1} onClick={() => act('print_material', undefined, 'worker democracy')}>Print propaganda · ₽6</button><button disabled={campaign.phase !== 'faction_management' || campaign.factionActionsRemaining < 1} onClick={() => act('allocate_budget', undefined, 'security')}>Budget ₽5 security</button><button disabled={campaign.phase !== 'faction_management' || campaign.factionActionsRemaining < 1} onClick={() => act('allocate_budget', undefined, 'relief')}>Budget ₽5 relief</button></div></div>
    <h3>Organizer roster</h3><div className={styles.recordGrid} data-tutorial="organizer-assignment">{Object.values(campaign.organizers).map(org => <article key={org.id} className={org.status === 'arrested' ? styles.unavailable : ''}><h3>{org.name}</h3><p>{org.background}</p><small>{humanize(org.status)} · morale {org.morale} · exposure {org.exposure} · health {org.health}</small><small>Organizing {org.skills.organizing} · security {org.skills.security} · persuasion {org.skills.persuasion} · intelligence {org.skills.intelligence}</small><p>{org.traits.join(' · ')}</p><button disabled={!selectedRegionId || campaign.phase !== 'faction_management' || campaign.factionActionsRemaining < 1 || org.status === 'arrested'} onClick={() => act('assign_region', org.id, selectedRegionId ?? undefined)}>Assign to selected region</button><button disabled={campaign.phase !== 'faction_management' || campaign.factionActionsRemaining < 1 || org.status === 'arrested'} onClick={() => act('rest_organizer', org.id)}>Rest / recover</button></article>)}</div>
    <h3>Internal blocs</h3><div className={styles.blocTable}>{Object.values(campaign.factionBlocs).map(blocState => <div key={blocState.id}><strong>{blocState.name}</strong><span>Leader {humanize(blocState.leaderId)}</span><span>Support {Math.round(blocState.support)} · satisfaction {Math.round(blocState.satisfaction)} · split risk {Math.round(blocState.splitRisk)}</span><span>Underground willingness {blocState.undergroundWillingness} · red line: {blocState.redLines[0]}</span><em>{blocState.lastReaction}</em></div>)}</div>
  </div>;
}

function VotePanel() {
  const campaign = useGameStore(s => s.campaign)!;
  const lobby = useGameStore(s => s.lobbyDelegate);
  const resolve = useGameStore(s => s.resolvePoliticalVote);
  const vote = campaign.voteState;
  if (!vote) return <p>No ballot is scheduled.</p>;
  const total = vote.delegates.length;
  return <div className={styles.voteWorkspace}><VoteSeatingChart campaign={campaign}/><div className={styles.managementHeader}><div><p className={styles.kicker}>{humanize(vote.institutionId)} · scheduled {formatGameDate(vote.scheduledDate)}</p><h3>{vote.title}</h3><p>{vote.description}</p></div><div><strong>{vote.resolved && vote.tally ? `${vote.tally.for}–${vote.tally.against}` : `${vote.declaredSupporters} likely for · ${vote.declaredOpponents} likely against · ${vote.undecided} uncertain`}</strong><p>Threshold {vote.threshold}/{total} · confidence {vote.confidence}% · lobbying actions {vote.actionsRemaining}</p><button className="primary" disabled={vote.resolved || campaign.currentDate < vote.scheduledDate || campaign.phase !== 'party_politics'} onClick={resolve}>Call named roll</button></div></div>
    <div className={styles.delegateGrid}>{vote.delegates.map(delegate => <article key={delegate.id} data-stance={delegate.resolvedVote ?? delegate.publicStance}><h3>{delegate.name}</h3><small>{delegate.delegation} · {humanize(delegate.bloc)}</small><p>{delegate.resolvedVote ? `Recorded: ${delegate.resolvedVote}` : `Estimate ${delegate.estimatedLean + delegate.lobbying > 0 ? '+' : ''}${delegate.estimatedLean + delegate.lobbying} · confidence ${delegate.intelligenceConfidence}%`}</p><p>Concerns: {delegate.concerns.join(', ')}</p>{delegate.promises.length > 0 && <em>Approaches: {delegate.promises.join(', ')}</em>}<div className={styles.delegateActions}><button disabled={vote.resolved || vote.actionsRemaining < 1 || campaign.phase !== 'party_politics'} onClick={() => lobby(delegate.id, 'private_meeting')}>Meet</button><button disabled={vote.resolved || vote.actionsRemaining < 1 || campaign.phase !== 'party_politics'} onClick={() => lobby(delegate.id, 'union_mandate')}>Mandate</button><button disabled={vote.resolved || vote.actionsRemaining < 1 || campaign.phase !== 'party_politics'} onClick={() => lobby(delegate.id, 'policy_concession')}>Concede</button></div></article>)}</div>
  </div>;
}

function InstitutionsPanel() {
  const campaign = useGameStore(s => s.campaign)!; const content = useGameStore(s => s.content); const approach = useGameStore(s => s.approachInstitution);
  return <><InstitutionalBalanceChart campaign={campaign}/><div className={styles.recordGrid}>{content.institutions.map(inst => { const state = campaign.institutions[inst.id]; return <article key={inst.id}><h3>{inst.name}</h3><p>{inst.description}</p><small>Leadership {humanize(inst.leadership)} · formal authority {inst.formalAuthority} · autonomy {Math.round(state.autonomy)}</small><p><strong>Agenda</strong>{state.activeAgenda}</p><p>Contacts {state.playerContacts} · attitude {Math.round(state.attitude)} · security penetration {state.securityPenetration}</p><p>Business: {state.pendingBusiness.join(' · ') || 'No pending business'}</p><button disabled={campaign.phase !== 'party_politics' || campaign.politicalActionsRemaining < 1} onClick={() => approach(inst.id)}>Approach · influence 3</button></article>; })}</div></>;
}

function CharactersPanel() {
  const campaign = useGameStore(s => s.campaign)!; const content = useGameStore(s => s.content); const selectCharacter = useGameStore(s => s.selectCharacter);
  const [query, setQuery] = useState('');
  const characters = content.characters.filter(char => `${char.name} ${char.title} ${char.aliases.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  return <><label className={styles.characterSearch}>Search characters <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, alias, or office"/></label><div className={styles.characterGrid}>{characters.map(char => { const state=campaign.characters[char.id]; const initials=char.name.split(' ').map(part=>part[0]).slice(0,2).join(''); return <button key={char.id} className={state.availability !== 'active' ? styles.unavailable : ''} onClick={() => selectCharacter(char.id)}>{char.portraitPath ? <img className={styles.characterPortraitImage} src={char.portraitPath} alt={`Historical portrait of ${char.name}`}/> : <div className={styles.characterPortrait} role="img" aria-label={`Designed portrait fallback for ${char.name}`}><span>{initials}</span><svg viewBox="0 0 70 88" aria-hidden="true"><circle cx="35" cy="26" r="16"/><path d="M9 86Q12 48 35 47Q58 48 61 86Z"/></svg></div>}<div><small className={styles.officeBadge}>{char.title}</small><strong>{char.name}</strong><span>{humanize(state.availability)} · trust {state.trust} · respect {state.respect} · health {state.health}</span><p><b>Current agenda</b>{state.currentAgenda}</p><p>{state.lastAction}</p><small>Red lines: {char.redLines.join(', ') || 'not yet known'} · known secrets {state.knownSecrets.length}</small></div></button>; })}</div></>;
}

function LawsPanel() {
  const campaign = useGameStore(s => s.campaign)!; const content = useGameStore(s => s.content); const begin = useGameStore(s => s.beginPolicyCampaign); const campaignAction = useGameStore(s => s.campaignForProposal);
  const proposalsByLaw = Object.fromEntries(Object.values(campaign.policyProposals).map(proposal => [proposal.lawId, proposal]));
  return <><div className={styles.managementHeader}><div><p className={styles.kicker}>Direct policy work</p><h3>{campaign.politicalActionsRemaining} political action(s) remaining</h3></div><p>Passed policies apply an immediate effect and a smaller monthly ongoing effect.</p></div><div className={styles.recordGrid}>{content.laws.map(law => { const level = law.levels.find(item => item.value === campaign.laws[law.id]) ?? law.levels[0]; const proposal = proposalsByLaw[law.id]; return <article key={law.id}><h3>{law.name}</h3><p><strong>{level.label}</strong>: {level.description}</p><small>{law.category} · current level {campaign.laws[law.id]}</small>{proposal && <><p>{proposal.title} · {humanize(proposal.stage)} · support {Math.round(proposal.support)} / opposition {Math.round(proposal.opposition)}</p><p>Immediate: {Object.entries(proposal.immediateEffects).map(([k,v]) => `${humanize(k)} ${v > 0 ? '+' : ''}${v}`).join(' · ')}</p>{proposal.stage === 'available' && <button disabled={campaign.phase !== 'party_politics' || campaign.politicalActionsRemaining < 1} onClick={() => begin(proposal.id)}>Introduce proposal</button>}{proposal.stage === 'campaigning' && <button disabled={campaign.phase !== 'party_politics' || campaign.politicalActionsRemaining < 1} onClick={() => campaignAction(proposal.id)}>Campaign in {humanize(proposal.institutionId)}</button>}</>}</article>; })}</div></>;
}

function Newspapers() {
  const campaign = useGameStore(s => s.campaign)!;
  const content = useGameStore(s => s.content);
  const [filter, setFilter] = useState('all');
  if (!campaign.newspapers.length) return <p>The presses are waiting. Major decisions generate clippings with distinct editorial framing.</p>;
  const articles = campaign.newspapers.filter(article => filter === 'all' || article.template === filter || (filter === 'suppressed' && article.suppressed));
  return <><div className={styles.actionStrip}><button onClick={() => setFilter('all')}>All</button><button onClick={() => setFilter('official')}>Official</button><button onClick={() => setFilter('factional')}>Factional</button><button onClick={() => setFilter('security')}>Security</button><button onClick={() => setFilter('suppressed')}>Suppressed</button></div><div className={styles.newspaperGrid}>{articles.slice().reverse().map(article => { const publication = content.publications.find(pub => pub.id === article.publicationId); return <article key={article.id} data-template={article.template} className={article.suppressed ? styles.suppressed : ''}><header><strong>{publication?.name ?? article.publicationId}</strong><span>{article.date} · reliability {article.reliability}%</span></header><h3>{article.headline}</h3><div className={styles.articleColumns}><p>{article.body}</p></div><footer>{publication?.bias}{article.suppressed ? ' · circulation suppressed' : ''}{article.contradictsArticleId ? ' · contradicts another clipping' : ''}</footer></article>; })}</div></>;
}

export function GameScreen() {
  const campaign = useGameStore(s => s.campaign);
  const preferences = useGameStore(s => s.preferences);
  const advancePhase = useGameStore(s => s.advancePhase);
  const setScreen = useGameStore(s => s.setScreen);
  const saveGame = useGameStore(s => s.saveGame);
  const campaignDirty = useGameStore(s => s.campaignDirty);
  const leftCollapsed = useGameStore(s => s.leftSidebarCollapsed);
  const bottomCollapsed = useGameStore(s => s.bottomWorkspaceCollapsed);
  const toggleLeft = useGameStore(s => s.toggleLeftSidebar);
  const toggleBottom = useGameStore(s => s.toggleBottomWorkspace);
  const setTutorialStep = useGameStore(s => s.setTutorialStep);
  const turnSummary = useGameStore(s => s.turnSummary);
  const dismissTurnSummary = useGameStore(s => s.dismissTurnSummary);
  const [notice, setNotice] = useState('');
  const [situationBoardOpen,setSituationBoardOpen]=useState(false);
  const [campaignHistoryOpen,setCampaignHistoryOpen]=useState(false);
  const boardAutoOpenedMonth=useRef<string|null>(null);
  useEffect(() => {
    if (turnSummary) audioManager.play('paper');
  }, [turnSummary]);
  useEffect(()=>{
    if(campaign?.settings.tutorialEnabled&&!campaign.tutorialComplete){
      boardAutoOpenedMonth.current=campaign.situationBoard.month;
      return;
    }
    const tutorialAllowsBoard=Boolean(campaign&&(!campaign.settings.tutorialEnabled||campaign.tutorialComplete));
    if(campaign&&tutorialAllowsBoard&&preferences.situationBoardEnabled&&!campaign.situationBoard.dismissed&&!turnSummary&&boardAutoOpenedMonth.current!==campaign.situationBoard.month){
      boardAutoOpenedMonth.current=campaign.situationBoard.month;
      setSituationBoardOpen(true);
    }
  },[campaign?.situationBoard.month,campaign?.situationBoard.dismissed,campaign?.tutorialPaused,campaign?.tutorialComplete,preferences.situationBoardEnabled,turnSummary]);
  useEffect(() => {
    if (!campaign) return;
    const averageFamine=Object.values(campaign.regions).reduce((sum,region)=>sum+region.famineSeverity,0)/Math.max(1,Object.keys(campaign.regions).length);
    const context=averageFamine>=62?'famine':campaign.voteState||campaign.phase==='party_politics'?'vote':campaign.resources.exposure>=70||campaign.nationalStats.regimeStability<=30?'crisis':'campaign';
    audioManager.setMusicContext(context);
  }, [campaign?.phase,campaign?.resources.exposure,campaign?.nationalStats.regimeStability,campaign?.voteState,campaign?.turnNumber]);
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === 'b') { event.preventDefault(); toggleBottom(); }
      if (event.altKey && event.key.toLowerCase() === 'l') { event.preventDefault(); toggleLeft(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleBottom, toggleLeft]);
  if (!campaign) return <div className={styles.empty}><h1>No campaign loaded</h1><button onClick={() => setScreen('title')}>Return to title</button></div>;
  const save = async () => { try { await saveGame('manual-1', `Manual · ${formatGameDate(campaign.currentDate)}`); audioManager.play('stamp'); setNotice('Campaign secured in local archive.'); } catch (error) { audioManager.play('warning'); setNotice(error instanceof Error ? error.message : 'Save failed'); } };
  return <main className={`${styles.game} ${preferences.interfaceDetail === 'standard' ? styles.standardDetail : styles.expertDetail} ${bottomCollapsed ? styles.gameWorkspaceCollapsed : ''}`}>
    <header className={styles.topBar}>
      <div className={styles.dateBlock} data-tutorial="phase-progress"><strong>{formatGameDate(campaign.currentDate)}</strong><span>Turn {campaign.turnNumber} · {PHASE_LABELS[campaign.phase]}</span><div className={styles.phaseProgress}>{Object.keys(PHASE_LABELS).map(key => <i key={key} className={campaign.phase === key ? styles.phaseActive : ''}/>)}</div></div>
      <div className={styles.topMetrics}><Metric label="Stability" value={campaign.nationalStats.regimeStability}/><Metric label="Worker support" value={campaign.resources.workerSupport}/><div data-tutorial="exposure-meter"><Metric label="Exposure" value={campaign.resources.exposure} danger/></div><details className={styles.resourceDrawer}><summary>All resources</summary><div><Metric label="Influence" value={campaign.resources.politicalInfluence}/><Metric label="Capacity" value={campaign.resources.organizationalCapacity}/><Metric label="Treasury" value={campaign.resources.treasury}/><Metric label="Security" value={campaign.resources.security}/><Metric label="Legitimacy" value={campaign.resources.partyLegitimacy}/></div></details></div>
      <div className={styles.topActions}><span className={campaignDirty ? styles.unsaved : styles.saved}>{campaignDirty ? 'Unsaved changes' : 'Saved'}</span><button onClick={()=>setSituationBoardOpen(true)}>Situation Board</button><button className={styles.expertOnly} onClick={()=>setCampaignHistoryOpen(true)}>Campaign History</button><button data-tutorial="save-campaign" onClick={save}>Save</button><button aria-label="Settings" title="Settings" onClick={() => { audioManager.play('dossier'); setScreen('settings'); }}>Settings</button><button className="primary" data-tutorial="advance-phase" onClick={() => { audioManager.play(campaign.phase === 'consequences' ? 'telegram' : 'dossier'); advancePhase(); }}>{campaign.phase === 'consequences' ? 'Advance month' : 'Next phase'} →</button></div>
    </header>
    {notice && <div className={styles.notice} role="status" onAnimationEnd={() => setNotice('')}>{notice}</div>}
    <div className={`${styles.mainGrid} ${leftCollapsed ? styles.mainGridLeftCollapsed : ''}`}>
      <button className={styles.collapseLeft} onClick={toggleLeft} title="Toggle objectives sidebar (Alt+L)">{leftCollapsed ? 'Show objectives' : 'Hide'}</button>
      {!leftCollapsed && <aside className={styles.leftPanel}><section className={styles.factionIdentity} data-tutorial="faction-identity" aria-label="Player faction identity"><figure><img src="/assets/documents/workers-opposition-1921-title-page.jpg" alt="1921 Workers Opposition in Russia pamphlet title page"/><figcaption>Historical platform pamphlet · documentary framing, not a logo</figcaption></figure><div><p className={styles.kicker}>You organize</p><h1>Workers’ Opposition</h1><span>WO is an interface abbreviation · no official emblem documented</span></div><dl><div data-tutorial="faction-leaders"><dt>Principal leaders</dt><dd><img src="/assets/portraits/kollontai.jpg" alt=""/><img src="/assets/portraits/shliapnikov.jpg" alt=""/>Kollontai · Shliapnikov · Medvedev</dd></div><div><dt>Your background</dt><dd>{humanize(campaign.settings.background)}</dd></div><div><dt>Opening strategy</dt><dd>{campaign.openingStrategy ? humanize(campaign.openingStrategy) : 'Decision pending'}</dd></div><div><dt>Institutional base</dt><dd>Trade unions · factory committees</dd></div><div data-tutorial="faction-ban"><dt>Legal position</dt><dd>Faction activity prohibited by the Tenth Congress</dd></div></dl></section>{campaign.settings.tutorialEnabled && !campaign.tutorialComplete && campaign.tutorialPaused && <button className={styles.resumeTutorial} onClick={() => setTutorialStep(campaign.tutorialStep)}>Resume tutorial at step {campaign.tutorialStep + 1}</button>}<h2>Immediate objectives</h2><ol>{campaign.objectives.map(item => <li key={item}>{item}</li>)}</ol><h3>Active operations</h3>{campaign.activeOperations.length ? campaign.activeOperations.map(op => <div className={styles.activeOperation} key={op.id}><strong>{humanize(op.operationId)}</strong><span>{humanize(op.regionId)} · {op.turnsRemaining} turn(s){op.organizerId ? ` · ${campaign.organizers[op.organizerId]?.name}` : ''}</span></div>) : <p className={styles.muted}>No operations in motion.</p>}<h3>Immediate threats</h3><p className={campaign.resources.exposure > 60 ? styles.warning : styles.muted}>{campaign.resources.exposure > 60 ? 'Security attention is approaching a raid threshold.' : 'Surveillance remains serious but contained.'}</p><h3>Turn structure</h3><ul className={styles.phaseList}>{Object.entries(PHASE_LABELS).map(([key,label]) => <li className={campaign.phase === key ? styles.currentPhase : ''} key={key}>{label}</li>)}</ul></aside>}
      <GeographicMap/>
      <aside className={styles.rightPanel}><RegionPanel/></aside>
      <EventDrawer/>
    </div>
    <BottomPanel/>
    {campaign.settings.tutorialEnabled && !campaign.tutorialComplete && !campaign.tutorialPaused && <TutorialOverlay/>}
    <TutorialCompletionPanel/>
    <BeginnerHint/>
    <SituationBoardOverlay open={situationBoardOpen} onClose={()=>setSituationBoardOpen(false)}/>
    <CampaignHistoryStrip open={campaignHistoryOpen} onClose={()=>setCampaignHistoryOpen(false)}/>
    {turnSummary && <div className={styles.summary} role="dialog" aria-label="Turn report"><p className={styles.kicker}>Monthly resolution</p><h2>Dispatches from the field</h2>{turnSummary.map(line => <p key={line}>{line}</p>)}<button className="primary" onClick={dismissTurnSummary}>Return to map</button></div>}
  </main>;
}
