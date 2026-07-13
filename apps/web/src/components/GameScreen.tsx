import type { KeyboardEvent } from 'react';
import { useMemo, useState } from 'react';
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
import { useGameStore } from '../store/gameStore';
import { SaveArchivePanel } from './AuxiliaryScreens';
import styles from './GameScreen.module.css';

const MAP_MODES: MapMode[] = [
  'political_influence', 'formal_administration', 'trade_union_strength',
  'security_surveillance', 'red_army_loyalty', 'economic_output', 'food_supply',
  'famine_disease', 'unrest_strikes', 'nationality_movements',
  'railway_infrastructure', 'intelligence_confidence',
];

const PHASE_LABELS = {
  briefing: 'National briefing', faction_management: 'Faction management',
  regional_operations: 'Regional operations', party_politics: 'Party politics',
  consequences: 'Resolution',
};

const BOTTOM_TABS = ['economy', 'faction', 'party', 'institutions', 'characters', 'intelligence', 'laws', 'newspapers', 'archive', 'decisions', 'sources'];

function humanize(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function Metric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return <div className={`${styles.metric} ${danger ? styles.dangerMetric : ''}`} title={`${label}: ${value} out of 100`}>
    <span>{label}</span><strong>{Math.round(value)}</strong><i style={{ width: `${value}%` }}/>
  </div>;
}

function CampaignMap() {
  const campaign = useGameStore(s => s.campaign)!;
  const content = useGameStore(s => s.content);
  const mapMode = useGameStore(s => s.mapMode);
  const setMapMode = useGameStore(s => s.setMapMode);
  const selectedRegionId = useGameStore(s => s.selectedRegionId);
  const selectRegion = useGameStore(s => s.selectRegion);
  const preferences = useGameStore(s => s.preferences);
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
      <label>Map mode <select aria-label="Map mode" value={mapMode} onChange={e => setMapMode(e.target.value as MapMode)}>
        {MAP_MODES.map(mode => <option value={mode} key={mode}>{getMapModeLabel(mode)}</option>)}
      </select></label>
    </div>
    <div className={styles.mapFrame}>
      <svg viewBox="55 65 585 365" className={styles.map} role="group" aria-label={`${getMapModeLabel(mapMode)} map of Soviet Russia and adjacent strategic regions`}>
        <defs>
          {Object.entries(FACTION_COLORS).map(([faction, color]) => <pattern key={faction} id={`${faction}-pattern`} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(35)"><rect width="8" height="8" fill={color}/><line x1="0" y1="0" x2="0" y2="8" stroke="#f5e6d3" strokeOpacity=".55" strokeWidth="2"/></pattern>)}
          <pattern id="uncertain" patternUnits="userSpaceOnUse" width="10" height="10"><path d="M0 10L10 0M-2 2L2-2M8 12L12 8" stroke="#fff" strokeOpacity=".35"/></pattern>
        </defs>
        <rect x="55" y="65" width="585" height="365" rx="4" className={styles.mapSea}/>
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
    <div className={styles.legend} aria-label="Map legend">{legend.slice(0, mapMode === 'political_influence' ? 6 : 3).map(item => <span key={item.label}><i style={{ background: item.color }}/>{item.label}</span>)}<span><i className={styles.hatch}/>contested / uncertain</span></div>
  </section>;
}

function RegionPanel() {
  const campaign = useGameStore(s => s.campaign)!;
  const content = useGameStore(s => s.content);
  const selectedRegionId = useGameStore(s => s.selectedRegionId);
  const startOperation = useGameStore(s => s.startOperation);
  const [showAll, setShowAll] = useState(false);
  const regionDef = content.regions.find(r => r.id === selectedRegionId);
  const region = selectedRegionId ? campaign.regions[selectedRegionId] : null;
  if (!region || !regionDef) return <NationalBriefing />;
  const operations = showAll ? content.operations : content.operations.slice(0, 6);
  const activeThisTurn = campaign.activeOperations.filter(op => op.startedTurn === campaign.turnNumber).length;
  return <div className={styles.contextPanel}>
    <p className={styles.kicker}>Regional dossier · confidence {region.intelligenceReliability}%</p>
    <h2>{regionDef.name}</h2><p>{regionDef.description}</p>
    <div className={styles.regionFacts}><span><b>Cities</b>{regionDef.majorCities.join(', ')}</span><span><b>Population</b>{(regionDef.urbanPopulation + regionDef.ruralPopulation).toLocaleString()} thousand</span><span><b>Economy</b>{regionDef.economicProfile}</span><span><b>Composition</b>{regionDef.ethnicComposition}</span></div>
    <div className={styles.miniMeters}>
      <Metric label="Workers' Opposition" value={region.influence.workersOpposition}/><Metric label="Trade unions" value={region.tradeUnionOrganization}/><Metric label="Food supply" value={region.foodSupply}/><Metric label="Unrest" value={region.publicUnrest} danger/><Metric label="Cheka" value={region.chekaPresence} danger/>
    </div>
    <h3>Regional operations <small>{activeThisTurn}/2 ordered this turn</small></h3>
    <div className={styles.operationList}>{operations.map(op => {
      const resources = campaign.resources as unknown as Record<string, number>;
      const affordable = Object.entries(op.cost).every(([key,value]) => resources[key] >= value) && activeThisTurn < 2;
      return <button key={op.id} disabled={!affordable} onClick={() => startOperation(region.id, op.id)} title={op.description}>
        <strong>{op.name}</strong><span>{op.duration} turn{op.duration === 1 ? '' : 's'} · {Object.entries(op.cost).map(([k,v]) => `${humanize(k)} ${v}`).join(' · ') || 'no cost'}</span>
        {op.risks?.exposureIncrease ? <em>Exposure risk +{op.risks.exposureIncrease}</em> : null}
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
  const event = content.events.find(item => item.id === campaign.currentEventId);
  if (!event) return null;
  return <aside className={styles.eventDrawer} aria-label="Active decision" aria-live="polite">
    <p className={styles.kicker}>{event.historical.classification.replaceAll('_', ' ')} · {event.historical.historicalDate}</p><h2>{event.title}</h2><p>{event.description}</p>
    <div className={styles.eventChoices}>{event.choices.map(choice => <button key={choice.id} onClick={() => resolveEventChoice(event.id, choice.id)}><strong>{choice.text}</strong>{choice.narrative && <span>{choice.narrative}</span>}</button>)}</div>
    <details><summary>Historical metadata</summary><p>Sources: {event.historical.sourceIds.join(', ')}. Classification: {event.historical.classification.replaceAll('_', ' ')}.</p></details>
  </aside>;
}

function BottomPanel() {
  const campaign = useGameStore(s => s.campaign)!;
  const content = useGameStore(s => s.content);
  const tab = useGameStore(s => s.bottomTab);
  const setTab = useGameStore(s => s.setBottomTab);
  const selectCharacter = useGameStore(s => s.selectCharacter);
  return <section className={styles.bottomPanel}>
    <nav aria-label="Campaign sections">{BOTTOM_TABS.map(item => <button key={item} className={tab === item ? styles.activeTab : ''} onClick={() => setTab(item)}>{humanize(item)}</button>)}</nav>
    <div className={styles.tabContent}>
      {tab === 'economy' && <DataCards items={[
        ['Industrial production', campaign.nationalStats.industrialProduction], ['Agricultural production', campaign.nationalStats.agriculturalProduction], ['Grain reserves', campaign.nationalStats.grainReserves], ['Urban food supply', campaign.nationalStats.urbanFoodSupply], ['Inflation', campaign.nationalStats.inflation], ['Black market', campaign.nationalStats.blackMarketActivity], ['Infrastructure', campaign.nationalStats.infrastructure], ['State revenue', campaign.nationalStats.stateRevenue],
      ]}/>} 
      {tab === 'faction' && <><DataCards items={Object.entries(campaign.resources).map(([k,v]) => [humanize(k), v])}/><p className={styles.blurb}>Internal cohesion {campaign.internalCohesion}. Strategy: {humanize(String(campaign.flags.opening_strategy ?? 'not yet chosen'))}. Status: {humanize(String(campaign.flags.faction_response ?? 'awaiting congress resolution'))}.</p></>}
      {tab === 'party' && <VotePanel/>}
      {tab === 'institutions' && <div className={styles.recordGrid}>{content.institutions.map(inst => <article key={inst.id}><h3>{inst.name}</h3><p>{inst.description}</p><small>Led by {humanize(inst.leadership)} · influence {campaign.institutions[inst.id]?.factionInfluence}% · penetration {campaign.institutions[inst.id]?.securityPenetration}%</small></article>)}</div>}
      {tab === 'characters' && <div className={styles.recordGrid}>{content.characters.map(char => <button key={char.id} onClick={() => selectCharacter(char.id)}><strong>{char.name}</strong><span>{char.title}</span><small>Trust {campaign.characters[char.id]?.trust} · {humanize(char.initialState.factionAlignment)}</small></button>)}</div>}
      {tab === 'intelligence' && <div className={styles.recordGrid}>{content.regions.slice().sort((a,b) => campaign.regions[a.id].intelligenceReliability - campaign.regions[b.id].intelligenceReliability).map(def => <article key={def.id}><h3>{def.name}</h3><p>Confidence {campaign.regions[def.id].intelligenceReliability}% · report age {campaign.regions[def.id].intelligenceAge} month(s)</p></article>)}</div>}
      {tab === 'laws' && <div className={styles.recordGrid}>{content.laws.map(law => { const level = law.levels.find(item => item.value === campaign.laws[law.id]) ?? law.levels[0]; return <article key={law.id}><h3>{law.name}</h3><p>{level.label}: {level.description}</p><small>{law.category} · current law</small></article>; })}</div>}
      {tab === 'newspapers' && <Newspapers/>}
      {tab === 'archive' && <SaveArchivePanel/>}
      {tab === 'decisions' && <div className={styles.timeline}>{campaign.decisions.slice().reverse().map((decision,i) => <p key={`${decision.turn}-${i}`}><b>{formatGameDate(decision.date)}</b>{decision.description}</p>)}{!campaign.decisions.length && <p>No decisions recorded.</p>}</div>}
      {tab === 'sources' && <div className={styles.recordGrid}>{Array.from(new Set(content.events.flatMap(event => event.historical.sourceIds))).map(source => <article key={source}><h3>{source}</h3><p>Research record listed in docs/HISTORICAL_BASELINE.md.</p></article>)}</div>}
    </div>
  </section>;
}

function DataCards({ items }: { items: (string | number)[][] }) {
  return <div className={styles.dataCards}>{items.map(([label,value]) => <div key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}

function VotePanel() {
  const campaign = useGameStore(s => s.campaign)!;
  const influence = campaign.resources.politicalInfluence;
  const support = Math.max(12, Math.min(48, 18 + Math.round(influence * .35)));
  const undecided = Math.max(8, 38 - Math.round(campaign.resources.intelligence * .2));
  const opposition = 100 - support - undecided;
  const resolved = campaign.completedEventIds.includes('party_vote_june');
  return <div className={styles.votePanel}><div><p className={styles.kicker}>Central Committee · labor policy</p><h3>{resolved ? 'Vote resolved' : 'Delegate estimate'}</h3><p>Trotsky-aligned administrators demand stronger labor discipline. Your contacts seek union consultation and an amendment.</p></div><div className={styles.voteBars}><span style={{width:`${support}%`}}>Support {support}</span><span style={{width:`${undecided}%`}}>Undecided {undecided}</span><span style={{width:`${opposition}%`}}>Oppose {opposition}</span></div><p>Confidence {campaign.resources.intelligence}% · unreliable supporters {Math.round(support * .2)}. Resolve the June decision when it enters the party-politics phase.</p></div>;
}

function Newspapers() {
  const campaign = useGameStore(s => s.campaign)!;
  const content = useGameStore(s => s.content);
  if (!campaign.newspapers.length) return <p>The presses are waiting. Major decisions generate clippings with distinct editorial framing.</p>;
  return <div className={styles.newspaperGrid}>{campaign.newspapers.slice().reverse().map(article => { const publication = content.publications.find(pub => pub.id === article.publicationId); return <article key={article.id}><small>{publication?.name ?? article.publicationId} · {article.date} · reliability {article.reliability}%</small><h3>{article.headline}</h3><p>{article.body}</p><em>{publication?.bias}</em></article>; })}</div>;
}

export function GameScreen() {
  const campaign = useGameStore(s => s.campaign);
  const advancePhase = useGameStore(s => s.advancePhase);
  const setScreen = useGameStore(s => s.setScreen);
  const saveGame = useGameStore(s => s.saveGame);
  const turnSummary = useGameStore(s => s.turnSummary);
  const dismissTurnSummary = useGameStore(s => s.dismissTurnSummary);
  const [notice, setNotice] = useState('');
  if (!campaign) return <div className={styles.empty}><h1>No campaign loaded</h1><button onClick={() => setScreen('title')}>Return to title</button></div>;
  const save = async () => { try { await saveGame('manual-1', `Manual · ${formatGameDate(campaign.currentDate)}`); setNotice('Campaign secured in local archive.'); } catch (error) { setNotice(error instanceof Error ? error.message : 'Save failed'); } };
  return <main className={styles.game}>
    <header className={styles.topBar}>
      <div className={styles.dateBlock}><strong>{formatGameDate(campaign.currentDate)}</strong><span>Turn {campaign.turnNumber} · {PHASE_LABELS[campaign.phase]}</span></div>
      <div className={styles.topMetrics}><Metric label="Stability" value={campaign.nationalStats.regimeStability}/><Metric label="Worker support" value={campaign.resources.workerSupport}/><Metric label="Influence" value={campaign.resources.politicalInfluence}/><Metric label="Capacity" value={campaign.resources.organizationalCapacity}/><Metric label="Treasury" value={campaign.resources.treasury}/><Metric label="Security" value={campaign.resources.security}/><Metric label="Exposure" value={campaign.resources.exposure} danger/></div>
      <div className={styles.topActions}><button onClick={save}>Save</button><button onClick={() => setScreen('settings')}>⚙</button><button className="primary" onClick={advancePhase}>{campaign.phase === 'consequences' ? 'Advance month' : 'Next phase'} →</button></div>
    </header>
    {notice && <div className={styles.notice} role="status" onAnimationEnd={() => setNotice('')}>{notice}</div>}
    <div className={styles.mainGrid}>
      <aside className={styles.leftPanel}><p className={styles.kicker}>Workers’ Opposition</p><h2>Immediate objectives</h2><ol>{campaign.objectives.map(item => <li key={item}>{item}</li>)}</ol><h3>Active operations</h3>{campaign.activeOperations.length ? campaign.activeOperations.map(op => <div className={styles.activeOperation} key={op.id}><strong>{humanize(op.operationId)}</strong><span>{humanize(op.regionId)} · {op.turnsRemaining} turn(s)</span></div>) : <p className={styles.muted}>No operations in motion.</p>}<h3>Immediate threats</h3><p className={campaign.resources.exposure > 60 ? styles.warning : styles.muted}>{campaign.resources.exposure > 60 ? 'Security attention is approaching a raid threshold.' : 'Surveillance remains serious but contained.'}</p><h3>Turn structure</h3><ul className={styles.phaseList}>{Object.entries(PHASE_LABELS).map(([key,label]) => <li className={campaign.phase === key ? styles.currentPhase : ''} key={key}>{label}</li>)}</ul></aside>
      <CampaignMap/>
      <aside className={styles.rightPanel}><RegionPanel/></aside>
      <EventDrawer/>
    </div>
    <BottomPanel/>
    {turnSummary && <div className={styles.summary} role="dialog" aria-label="Turn report"><p className={styles.kicker}>Monthly resolution</p><h2>Dispatches from the field</h2>{turnSummary.map(line => <p key={line}>{line}</p>)}<button className="primary" onClick={dismissTurnSummary}>Return to map</button></div>}
  </main>;
}
