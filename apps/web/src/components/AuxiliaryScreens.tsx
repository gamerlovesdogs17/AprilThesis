import { useEffect, useState } from 'react';
import { getEndingById } from '@april-thesis/content';
import { deleteSaveSlot, duplicateSaveSlot, exportSaveToFile, importSaveFromFile, loadFromSlot, quarantineImport, saveToSlot } from '@april-thesis/simulation';
import { formatGameDate } from '@april-thesis/shared-types';
import { useGameStore } from '../store/gameStore';
import { audioManager } from '../audio/audioManager';
import styles from './Shell.module.css';

function BackButton() {
  const closeAuxiliary = useGameStore(s => s.closeAuxiliary);
  const overlayScreen = useGameStore(s => s.overlayScreen);
  return <button onClick={closeAuxiliary}>← {overlayScreen ? 'Return to campaign' : 'Back'}</button>;
}

function useAuxiliaryEscape() {
  const closeAuxiliary = useGameStore(s => s.closeAuxiliary);
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') closeAuxiliary(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeAuxiliary]);
}

export function ArchiveScreen() {
  useAuxiliaryEscape();
  const content = useGameStore(s => s.content);
  const researchMode = useGameStore(s => s.preferences.researchMode);
  return <main className={styles.page}><article className={styles.paperPanel}>
    <p className={styles.eyebrow}>Historical archive</p><h1>March–August 1921</h1>
    <p className={styles.lead}>Documents distinguish recorded history from plausible or composite game scenes. Raw citation identifiers appear only when Research Mode is enabled.</p>
    {content.events.slice().sort((a,b) => (a.month ?? '').localeCompare(b.month ?? '')).map(event => <section className={styles.section} key={event.id}>
      <h2>{event.title}</h2><p>{event.description}</p>
      <p><strong>{event.historical.classification.replaceAll('_', ' ')}</strong> · {event.historical.historicalDate ?? 'undated'}{researchMode ? ` · ${event.historical.sourceIds.join(', ')}` : ''}</p>
    </section>)}
    <div className={styles.actionRow}><BackButton /></div>
  </article></main>;
}

export function SettingsScreen() {
  useAuxiliaryEscape();
  const preferences = useGameStore(s => s.preferences);
  const updatePreferences = useGameStore(s => s.updatePreferences);
  const campaign = useGameStore(s => s.campaign);
  const overlayScreen = useGameStore(s => s.overlayScreen);
  const campaignDirty = useGameStore(s => s.campaignDirty);
  const saveGame = useGameStore(s => s.saveGame);
  const returnToTitle = useGameStore(s => s.returnToTitle);
  const restartTutorial = useGameStore(s => s.restartTutorial);
  const resetHints = useGameStore(s => s.resetHints);
  const leaveCampaign = () => {
    if (campaign && campaignDirty && !campaign.settings.ironman && !window.confirm('Return to the title without saving the latest campaign changes? The campaign is not deleted.')) return;
    returnToTitle();
  };
  const saveAndLeave = async () => {
    if (!campaign) return;
    await saveGame('manual-1', `Manual · ${formatGameDate(campaign.currentDate)}`);
    returnToTitle();
  };
  return <main className={styles.page}><section className={styles.paperPanel}>
    <p className={styles.eyebrow}>{overlayScreen ? 'Campaign paused · no state discarded' : 'Accessibility and sound'}</p><h1>Settings</h1>
    <div className={styles.section}>
      <label className={styles.statLine}>Reduced motion <input type="checkbox" checked={preferences.reducedMotion} onChange={e => updatePreferences({ reducedMotion:e.target.checked })}/></label>
      <label className={styles.statLine}>Colorblind patterns <input type="checkbox" checked={preferences.colorblindMode} onChange={e => updatePreferences({ colorblindMode:e.target.checked })}/></label>
      <label className={styles.statLine}>Mute audio <input type="checkbox" checked={preferences.muted} onChange={e => { const updated={...preferences,muted:e.target.checked}; updatePreferences({ muted:e.target.checked }); audioManager.configure(updated); }}/></label>
      <label className={styles.statLine}>Text scale <input type="range" min="0.85" max="1.35" step="0.05" value={preferences.textScale} onChange={e => { const textScale=Number(e.target.value); document.documentElement.style.fontSize=`${14*textScale}px`; updatePreferences({textScale}); }}/></label>
      <label className={styles.statLine}>Master volume <input type="range" min="0" max="1" step="0.05" value={preferences.masterVolume} onChange={e => updatePreferences({masterVolume:Number(e.target.value)})}/></label>
      <label className={styles.statLine}>Music volume <input type="range" min="0" max="1" step="0.05" value={preferences.musicVolume} onChange={e => updatePreferences({musicVolume:Number(e.target.value)})}/></label>
      <label className={styles.statLine}>Ambience volume <input type="range" min="0" max="1" step="0.05" value={preferences.ambienceVolume} onChange={e => updatePreferences({ambienceVolume:Number(e.target.value)})}/></label>
      <label className={styles.statLine}>Interface volume <input type="range" min="0" max="1" step="0.05" value={preferences.interfaceVolume} onChange={e => updatePreferences({interfaceVolume:Number(e.target.value)})}/></label>
      <label className={styles.statLine}>Enhanced influence surface <input type="checkbox" checked={preferences.enhancedInfluence} onChange={e => updatePreferences({enhancedInfluence:e.target.checked})}/></label>
      <label className={styles.statLine}>Map animation <input type="checkbox" checked={preferences.mapAnimation} onChange={e => updatePreferences({mapAnimation:e.target.checked})}/></label>
      <label className={styles.statLine}>Ambient visual effects <input type="checkbox" checked={preferences.ambientVisualEffects} onChange={e => updatePreferences({ambientVisualEffects:e.target.checked})}/></label>
      <label className={styles.statLine}>Beginner hints <select value={preferences.beginnerHintMode} onChange={e => updatePreferences({beginnerHintMode:e.target.value as 'off'|'first_campaign'|'every_campaign'})}><option value="off">Off</option><option value="first_campaign">First campaign only</option><option value="every_campaign">Every new campaign</option></select></label>
      <label className={styles.statLine}>Show all city labels <input type="checkbox" checked={preferences.allCityLabels} onChange={e => updatePreferences({allCityLabels:e.target.checked})}/></label>
      <label className={styles.statLine}>Monthly Situation Board <input type="checkbox" checked={preferences.situationBoardEnabled} onChange={e => updatePreferences({situationBoardEnabled:e.target.checked})}/></label>
      <label className={styles.statLine}>Research mode <input type="checkbox" checked={preferences.researchMode} onChange={e => updatePreferences({researchMode:e.target.checked})}/></label>
      <label className={styles.statLine}>Audio preload <select value={preferences.audioPreload} onChange={e => updatePreferences({audioPreload:e.target.value as 'minimal'|'full'})}><option value="minimal">Minimal</option><option value="full">Full local score</option></select></label>
      <div className={styles.checkRow}><button onClick={() => { audioManager.activate(preferences); audioManager.play('stamp',{restart:true}); }}>Test stamp sound</button><button onClick={resetHints}>Restore beginner hints</button>{campaign && <button onClick={restartTutorial}>Restart tutorial</button>}</div>
      <p>All meaningful audio has captions; the campaign is fully playable while muted.</p>
    </div>
    <div className={styles.actionRow}><BackButton />{overlayScreen && campaign && <><button onClick={leaveCampaign}>Return to title (campaign kept)</button><button className="primary" onClick={() => void saveAndLeave()}>Save and return to title</button></>}</div>
  </section></main>;
}

export function CreditsScreen() {
  useAuxiliaryEscape();
  return <main className={styles.page}><article className={styles.paperPanel}>
    <p className={styles.eyebrow}>Credits and method</p><h1>April Thesis</h1>
    <section className={styles.section}><h2>Design and assets</h2><p>An original browser strategy game. Research found no verified independent Workers’ Opposition emblem, so the former invented circular mark was removed. `WO` appears only as a neutral interface abbreviation. Faction identity uses Alexandra Kollontai’s public-domain 1921 <i>The Workers Opposition in Russia</i> title page and clearly dated leader portraits; the facsimile is a historical faction document, never an official logo. Geographic context is derived from public-domain Natural Earth data. Medvedev and Myasnikov retain labeled designed fallbacks rather than uncertain portraits. The congress scene is an original artistic reconstruction, not a historical photograph.</p></section>
    <section className={styles.section}><h2>Historical framing</h2><p>The player is fictional. Historical characters, institutions, and crises are date-scoped. Counterfactual outcomes are labeled internally and the archive exposes each scene’s classification.</p></section>
    <section className={styles.section}><h2>Content note</h2><p>The game depicts famine, political repression, warfare, incarceration, and state violence through text and abstract graphics.</p></section>
    <div className={styles.actionRow}><BackButton /></div>
  </article></main>;
}

export function EndingScreen() {
  const campaign = useGameStore(s => s.campaign);
  const setScreen = useGameStore(s => s.setScreen);
  const ending = campaign?.endingId ? getEndingById(campaign.endingId) : undefined;
  useEffect(() => {
    const context=campaign?.endingId==='ending_purge'||campaign?.endingId==='ending_collapse'?'ending_defeat':campaign?.endingId==='ending_reform'||campaign?.endingId==='ending_union_power'?'ending_hopeful':'ending_ambiguous';
    audioManager.setMusicContext(context);
  },[campaign?.endingId]);
  return <main className={styles.page}><article className={styles.paperPanel}>
    <p className={styles.eyebrow}>Chapter outcome · {campaign ? formatGameDate(campaign.currentDate) : '1921'}</p>
    <h1>{ending?.title ?? 'The chapter closes'}</h1>
    <p className={styles.lead}>{ending?.epilogue ?? 'The organization leaves no simple record of what survived.'}</p>
    {campaign && <section className={styles.section}><h2>Final ledger</h2><p>Worker support {campaign.resources.workerSupport} · Political influence {campaign.resources.politicalInfluence} · Security {campaign.resources.security} · Exposure {campaign.resources.exposure}</p><p>{campaign.decisions.length} decisions recorded; {campaign.completedEventIds.length} events resolved.</p></section>}
    <div className={styles.actionRow}><button onClick={() => setScreen('title')}>Return to title</button><button className="primary" onClick={() => setScreen('setup')}>New campaign</button></div>
  </article></main>;
}

export function SaveArchivePanel() {
  const refreshSaveSlots = useGameStore(s => s.refreshSaveSlots);
  const saveSlots = useGameStore(s => s.saveSlots);
  const loadCampaign = useGameStore(s => s.loadCampaign);
  const [message, setMessage] = useState('');
  useEffect(() => { void refreshSaveSlots(); }, [refreshSaveSlots]);
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const envelope = await importSaveFromFile(file);
      await saveToSlot(`import-${Date.now()}`, envelope); await refreshSaveSlots(); setMessage(`Imported ${file.name}.`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Invalid save'; await quarantineImport(file, reason); setMessage(`${reason}. Original placed in quarantine.`);
    }
  };
  return <div><div className={styles.actionRow}><label>Import save <input aria-label="Import save file" type="file" accept="application/json,.json" onChange={e => void importFile(e.target.files?.[0])}/></label></div>{!saveSlots.length ? <p>No local saves yet. Manual saves and three rotating autosaves use IndexedDB.</p> : <div className={styles.menuList}>{saveSlots.slice().sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).map(slot => <div key={slot.id} className={styles.saveRow}><button onClick={async () => {
    try { const save = await loadFromSlot(slot.id); if (save) loadCampaign(save); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load save'); }
  }}><strong>{slot.name}</strong>{slot.tutorial&&<b className={styles.tutorialBadge}>Tutorial</b>}<br/><span>{formatGameDate(slot.date)} · Turn {slot.turnNumber}{slot.ironman ? ' · Ironman' : ''}</span></button><button onClick={async () => { const save=await loadFromSlot(slot.id); if (save) exportSaveToFile(save); }}>Export</button><button disabled={slot.ironman} onClick={async () => { await duplicateSaveSlot(slot.id,`copy-${Date.now()}`,`${slot.name} · copy`); await refreshSaveSlots(); }}>Duplicate</button><button disabled={slot.ironman} onClick={async () => { await deleteSaveSlot(slot.id); await refreshSaveSlots(); }}>Delete</button></div>)}</div>}{message && <p role="alert">{message}</p>}</div>;
}
