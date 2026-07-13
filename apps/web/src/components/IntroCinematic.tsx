import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { cities, geographicContext, getCityPoint, getLinePath, railways } from '@april-thesis/content';
import { audioManager, type AudioCue } from '../audio/audioManager';
import { useGameStore } from '../store/gameStore';
import styles from './IntroCinematic.module.css';

const SCENES = [
  { id:'old-order', duration:10000, caption:'[Winter wind. Telegraph keys begin.]' },
  { id:'civil-war', duration:14000, caption:'[Distant railway. Military traffic recedes.]' },
  { id:'newspapers', duration:12000, caption:'[Printing press, typewriter, and paper.]' },
  { id:'congress', duration:10000, caption:'[Congress murmur. A heavy stamp strikes.]' },
  { id:'opposition', duration:14000, caption:'[Quiet meeting room. A telegram arrives.]' },
  { id:'title', duration:0, caption:'[The railway fades into the title theme.]' },
] as const;

const CIVIL_LINES = ['Revolution became civil war.','By 1921, the armies were exhausted.','The factories were silent.','The villages resisted.','The revolution had survived.','Its promises had not.'];

const PAPERS = [
  { className:'pravda', masthead:'PRAVDA', meta:'MOSCOW · 16 MARCH 1921', headline:'PARTY UNITY RESOLUTION ADOPTED', deck:'Congress closes ranks as war gives way to reconstruction.' },
  { className:'foreign', masthead:'THE SOCIALIST CALL', meta:'RIGA EDITION · DISPATCH', headline:'REVOLT AT KRONSTADT', deck:'Foreign socialists debate the meaning of the sailors’ rising.' },
  { className:'circular', masthead:'METALWORKERS’ CIRCULAR', meta:'PETROGRAD · HAND TO HAND', headline:'WORKERS’ OPPOSITION DENOUNCED', deck:'Union militants ask what organized labor may still decide.' },
  { className:'memorandum', masthead:'SPECIAL DEPARTMENT', meta:'CLASSIFIED · FILE 4/1921', headline:'FACTIONS ORDERED TO DISSOLVE', deck:'Security memorandum: observe printing, travel, and private meetings.' },
];

const LEADERS = [
  { initials:'AK', name:'Alexandra Kollontai', role:'Agitator, writer, international voice' },
  { initials:'AS', name:'Alexander Shliapnikov', role:'Metalworker and union organizer' },
  { initials:'SM', name:'Sergei Medvedev', role:'Industrial organizer and faction leader' },
  { initials:'YOU', name:'The player-organizer', role:'Background chosen in the campaign dossier' },
];

function initialScene() {
  if (typeof window === 'undefined') return 0;
  const requested = new URLSearchParams(window.location.search).get('introScene');
  const index = SCENES.findIndex(scene => scene.id === requested);
  return index >= 0 ? index : 0;
}

function sceneLoops(scene: string): AudioCue[] {
  if (scene === 'old-order') return ['wind'];
  if (scene === 'civil-war') return ['wind','railway'];
  if (scene === 'newspapers') return ['printingPress'];
  if (scene === 'congress') return ['meeting'];
  if (scene === 'opposition') return ['meeting'];
  return [];
}

function EmpireMap({ conflict = false }: { conflict?: boolean }) {
  const russia = geographicContext.find(feature => feature.name === 'Russia');
  const frontCities = cities.filter(city => ['petrograd-city','moscow-city','kiev-city','omsk-city','vladivostok-city','tsaritsyn-city'].includes(city.id));
  return <svg viewBox="0 0 1000 560" className={styles.empireMap} aria-label={conflict ? 'Geographic civil-war map with railways and major cities' : 'Distressed geographic outline of the former Russian Empire'} role="img">
    <defs><pattern id="print-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line y2="10" stroke="currentColor" strokeOpacity=".16" strokeWidth="3"/></pattern></defs>
    {russia && <path d={russia.path} className={styles.empireLand}/>}<path d={russia?.path ?? ''} fill="url(#print-hatch)" className={styles.printTexture}/>
    {conflict && <>
      {railways.slice(0,4).map(line => <path key={line.id} d={getLinePath(line)} className={styles.cinematicRail}/>) }
      <path d="M83 205 Q185 155 260 230 T430 190" className={`${styles.front} ${styles.frontWest}`}/>
      <path d="M355 255 Q480 215 610 285 T790 250" className={`${styles.front} ${styles.frontEast}`}/>
      <path d="M165 380 Q255 325 340 390" className={`${styles.front} ${styles.frontSouth}`}/>
      {frontCities.map(city => { const [x,y]=getCityPoint(city); return <g key={city.id}><circle cx={x} cy={y} r={city.populationCategory === 'metropolis' ? 6 : 4} className={styles.cinematicCity}/><text x={x+9} y={y-6}>{city.name}</text></g>; })}
      <g className={styles.supplyWarnings}><circle cx="185" cy="300" r="28"/><circle cx="270" cy="280" r="21"/><circle cx="340" cy="318" r="18"/><text x="202" y="345">SUPPLY FAILURES · FAMINE WARNINGS</text></g>
    </>}
    {!conflict && <>
      <path d="M80 118H310M155 82V255M240 108V310M310 145H500" className={styles.telegraphLines}/>
      <g className={styles.brokenSeal}><circle cx="290" cy="255" r="72"/><path d="M250 212L330 298M335 210L250 302"/><text x="290" y="262">1917</text></g>
    </>}
  </svg>;
}

export function IntroCinematic() {
  const [sceneIndex, setSceneIndex] = useState(initialScene);
  const [audioActive, setAudioActive] = useState(false);
  const [stampVisible, setStampVisible] = useState(false);
  const setScreen = useGameStore(state => state.setScreen);
  const updatePreferences = useGameStore(state => state.updatePreferences);
  const preferences = useGameStore(state => state.preferences);
  const setAudioEnabled = useGameStore(state => state.setAudioEnabled);
  const reducedMotion = preferences.reducedMotion;
  const scene = SCENES[sceneIndex] ?? SCENES[0];

  const finish = useCallback(() => {
    audioManager.cleanup();
    updatePreferences({ introViewed:true });
    setScreen('title');
  }, [setScreen, updatePreferences]);

  const enableAudio = useCallback(() => {
    audioManager.activate(preferences); setAudioEnabled(true); setAudioActive(true);
    audioManager.setScene(sceneLoops(scene.id));
    if (scene.id === 'old-order') audioManager.play('telegraph');
  }, [preferences, scene.id, setAudioEnabled]);

  useEffect(() => {
    if (reducedMotion || scene.duration === 0) return;
    const timer = window.setTimeout(() => setSceneIndex(index => Math.min(index + 1, SCENES.length - 1)), scene.duration);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, scene.duration]);

  useEffect(() => {
    setStampVisible(false);
    if (audioActive) { audioManager.configure(preferences); audioManager.setScene(sceneLoops(scene.id)); }
    if (scene.id === 'newspapers' && audioActive) { audioManager.play('paper'); audioManager.play('typewriter'); }
    const stampTimer = scene.id === 'congress' ? window.setTimeout(() => { setStampVisible(true); if (audioActive) audioManager.play('stamp'); }, 1800) : null;
    const telegramTimer = scene.id === 'opposition' && audioActive ? window.setTimeout(() => audioManager.play('telegram'), 1300) : null;
    if (scene.id === 'title' && audioActive) audioManager.play('titleCue');
    return () => { if (stampTimer) window.clearTimeout(stampTimer); if (telegramTimer) window.clearTimeout(telegramTimer); };
  }, [audioActive, preferences, scene.id]);

  useEffect(() => () => audioManager.cleanup(), []);

  if (reducedMotion) return <main className={styles.staticIntro}>
    <section className={styles.staticContent}><FactionMark/><p className={styles.eyebrow}>March 1921 · reduced-motion introduction</p><h1>YOU LEAD THE WORKERS’ OPPOSITION</h1><p>A Bolshevik current rooted in trade unions and industrial labor. Its leaders demand a greater role for organized workers in governing the economy. The Party has ordered it to dissolve.</p><div className={styles.staticLeaders}>{LEADERS.map(leader => <LeaderCard key={leader.initials} {...leader}/>)}</div><blockquote>“The resolution has passed. What remains of the organization must decide tonight.”</blockquote><button className="primary" onClick={finish}>Continue to title screen</button></section>
  </main>;

  return <main className={styles.intro} role="region" aria-label="Introduction cinematic" data-scene={scene.id}>
    <div className={styles.filmGrain}/><button className={styles.skipBtn} onClick={finish}>Skip introduction</button>{!audioActive && <button className={styles.audioBtn} onClick={enableAudio}>Enable cinematic audio</button>}
    {scene.id === 'old-order' && <section className={`${styles.scene} ${styles.oldOrder}`}><EmpireMap/><div className={styles.sceneCopy}><p className={styles.eyebrow}>Petrograd · November 1917</p><h1>1917. The old order fell.</h1><p>Telegraph wires carried decrees faster than the state could enforce them.</p></div></section>}
    {scene.id === 'civil-war' && <section className={`${styles.scene} ${styles.civilWar}`}><EmpireMap conflict/><div className={styles.civilCopy}>{CIVIL_LINES.map((line,index)=><p key={line} style={{'--line-index':index} as CSSProperties}>{line}</p>)}</div></section>}
    {scene.id === 'newspapers' && <section className={`${styles.scene} ${styles.montage}`}><div className={styles.paperDesk}>{PAPERS.map((paper,index)=><article key={paper.masthead} className={`${styles.paper} ${styles[paper.className]}`} style={{'--paper-index':index} as CSSProperties}><header>{paper.masthead}</header><small>{paper.meta}</small><div className={styles.paperColumns}><div className={styles.halftone}/><div><h2>{paper.headline}</h2><p>{paper.deck}</p><span>Continued on reverse →</span></div></div></article>)}</div></section>}
    {scene.id === 'congress' && <section className={`${styles.scene} ${styles.congress}`}><img src="/assets/illustrations/congress-hall-reconstruction.png" alt="Original artistic reconstruction of a crowded 1921 political congress hall, with a central dais and delegates raising papers"/><div className={styles.congressShade}/><div className={`${styles.resolution} ${stampVisible ? styles.resolutionStamped : ''}`}><small>RESOLUTION ON PARTY UNITY · TENTH CONGRESS</small><strong>ORGANIZED FACTIONS<br/>ARE HEREBY DISSOLVED</strong><span>Adopted · Moscow · March 1921</span></div><p className={styles.reconstructionLabel}>Original artistic reconstruction</p></section>}
    {scene.id === 'opposition' && <section className={`${styles.scene} ${styles.opposition}`}><div className={styles.meetingLight}/><div className={styles.identity}><FactionMark/><p className={styles.eyebrow}>Private meeting · Moscow</p><h1>YOU LEAD THE<br/>WORKERS’ OPPOSITION</h1><p>A Bolshevik current rooted in trade unions and industrial labor.</p><p>Its leaders demand a greater role for organized workers in governing the economy.</p><p className={styles.ban}>The Party has now ordered it to dissolve.</p></div><div className={styles.leaderDossiers}>{LEADERS.map(leader => <LeaderCard key={leader.initials} {...leader}/>)}</div><div className={styles.tableEvidence}><span>UNION LEDGER</span><span>CONCEALED PLATE</span><span>SECURITY FILE</span><span>RAIL MAP</span></div><blockquote className={styles.telegram}>“The resolution has passed. What remains of the organization must decide tonight.”</blockquote></section>}
    {scene.id === 'title' && <section className={`${styles.scene} ${styles.titleScene}`}><EmpireMap conflict/><div className={styles.titleVeil}/><FactionMark/><h1>APRIL THESIS</h1><h2>The Revolution After Victory</h2><blockquote>“The revolution was won once. Now it must decide what it has become.”</blockquote><button className="primary" onClick={finish}>Enter the campaign</button></section>}
    <div className={styles.progress} aria-hidden="true">{SCENES.map((item,index)=><i key={item.id} className={index<=sceneIndex ? styles.progressActive : ''}/>)}</div><div className={styles.captions} aria-live="polite">{audioActive ? scene.caption : '[Audio is off. Enable audio to hear this scene.]'}</div>
  </main>;
}

function FactionMark() { return <svg viewBox="0 0 72 72" className={styles.factionMark} aria-label="Original Workers’ Opposition game symbol" role="img"><circle cx="36" cy="36" r="30"/><path d="M36 9V18M36 54V63M9 36H18M54 36H63M17 17L23 23M49 49L55 55M55 17L49 23M23 49L17 55"/><circle cx="36" cy="36" r="18"/><path d="M27 46V29L32 25V37L37 34V42L43 38V46Z"/></svg>; }

function LeaderCard({ initials, name, role }: { initials:string; name:string; role:string }) { return <article className={styles.leaderCard}><div className={styles.portraitFallback}><span>{initials}</span><svg viewBox="0 0 80 100" aria-hidden="true"><circle cx="40" cy="30" r="18"/><path d="M14 96Q16 55 40 54Q64 55 66 96Z"/></svg></div><div><strong>{name}</strong><span>{role}</span><small>Designed dossier silhouette · no historical photograph claimed</small></div></article>; }
