import { useEffect, useState } from 'react';
import { getEndingById } from '@april-thesis/content';
import { deleteSaveSlot, duplicateSaveSlot, exportSaveToFile, importSaveFromFile, loadFromSlot, quarantineImport, saveToSlot } from '@april-thesis/simulation';
import { formatGameDate } from '@april-thesis/shared-types';
import { useGameStore } from '../store/gameStore';
import { audioManager } from '../audio/audioManager';
import styles from './Shell.module.css';

function BackButton() {
  const setScreen = useGameStore(s => s.setScreen);
  return <button onClick={() => setScreen('title')}>← Main menu</button>;
}

export function ArchiveScreen() {
  const content = useGameStore(s => s.content);
  return <main className={styles.page}><article className={styles.paperPanel}>
    <p className={styles.eyebrow}>Historical archive</p><h1>March–August 1921</h1>
    <p className={styles.lead}>Documents distinguish recorded history from plausible or composite game scenes. Source identifiers are cross-referenced in the research notes.</p>
    {content.events.slice().sort((a,b) => (a.month ?? '').localeCompare(b.month ?? '')).map(event => <section className={styles.section} key={event.id}>
      <h2>{event.title}</h2><p>{event.description}</p>
      <p><strong>{event.historical.classification.replaceAll('_', ' ')}</strong> · {event.historical.historicalDate ?? 'undated'} · {event.historical.sourceIds.join(', ')}</p>
    </section>)}
    <div className={styles.actionRow}><BackButton /></div>
  </article></main>;
}

export function SettingsScreen() {
  const preferences = useGameStore(s => s.preferences);
  const updatePreferences = useGameStore(s => s.updatePreferences);
  return <main className={styles.page}><section className={styles.paperPanel}>
    <p className={styles.eyebrow}>Accessibility and sound</p><h1>Settings</h1>
    <div className={styles.section}>
      <label className={styles.statLine}>Reduced motion <input type="checkbox" checked={preferences.reducedMotion} onChange={e => updatePreferences({ reducedMotion: e.target.checked })}/></label>
      <label className={styles.statLine}>Colorblind patterns <input type="checkbox" checked={preferences.colorblindMode} onChange={e => updatePreferences({ colorblindMode: e.target.checked })}/></label>
      <label className={styles.statLine}>Mute audio <input type="checkbox" checked={preferences.muted} onChange={e => { const updated={...preferences,muted:e.target.checked}; updatePreferences({ muted:e.target.checked }); audioManager.configure(updated); }}/></label>
      <label className={styles.statLine}>Text scale <input type="range" min="0.85" max="1.35" step="0.05" value={preferences.textScale} onChange={e => { const textScale = Number(e.target.value); document.documentElement.style.fontSize = `${14 * textScale}px`; updatePreferences({ textScale }); }}/></label>
      <label className={styles.statLine}>Master volume <input type="range" min="0" max="1" step="0.05" value={preferences.masterVolume} onChange={e => updatePreferences({ masterVolume: Number(e.target.value) })}/></label>
      <label className={styles.statLine}>Music volume <input type="range" min="0" max="1" step="0.05" value={preferences.musicVolume} onChange={e => updatePreferences({ musicVolume:Number(e.target.value) })}/></label>
      <label className={styles.statLine}>Ambience volume <input type="range" min="0" max="1" step="0.05" value={preferences.ambienceVolume} onChange={e => updatePreferences({ ambienceVolume:Number(e.target.value) })}/></label>
      <label className={styles.statLine}>Interface volume <input type="range" min="0" max="1" step="0.05" value={preferences.interfaceVolume} onChange={e => updatePreferences({ interfaceVolume:Number(e.target.value) })}/></label>
      <label className={styles.statLine}>Enhanced influence surface <input type="checkbox" checked={preferences.enhancedInfluence} onChange={e => updatePreferences({enhancedInfluence:e.target.checked})}/></label>
      <label className={styles.statLine}>Map animation <input type="checkbox" checked={preferences.mapAnimation} onChange={e => updatePreferences({mapAnimation:e.target.checked})}/></label>
      <label className={styles.statLine}>Ambient visual effects <input type="checkbox" checked={preferences.ambientVisualEffects} onChange={e => updatePreferences({ambientVisualEffects:e.target.checked})}/></label>
      <label className={styles.statLine}>Audio preload <select value={preferences.audioPreload} onChange={e => updatePreferences({audioPreload:e.target.value as 'minimal'|'full'})}><option value="minimal">Minimal</option><option value="full">Full cinematic set</option></select></label>
      <button onClick={() => { audioManager.activate(preferences); audioManager.play('stamp',{restart:true}); }}>Test stamp sound</button>
      <p>All meaningful audio has captions; the campaign is fully playable while muted.</p>
    </div>
    <div className={styles.actionRow}><BackButton /></div>
  </section></main>;
}

export function CreditsScreen() {
  return <main className={styles.page}><article className={styles.paperPanel}>
    <p className={styles.eyebrow}>Credits and method</p><h1>April Thesis</h1>
    <section className={styles.section}><h2>Design and assets</h2><p>An original browser strategy game. Strategic boundaries, interface graphics, patterns, the Workers’ Opposition symbol, and generated PCM audio are project-created. Geographic context is derived from public-domain Natural Earth data. The congress scene is an original artistic reconstruction, not a historical photograph.</p></section>
    <section className={styles.section}><h2>Historical framing</h2><p>The player is fictional. Historical characters, institutions, and crises are date-scoped. Counterfactual outcomes are labeled internally and the archive exposes each scene’s classification.</p></section>
    <section className={styles.section}><h2>Content note</h2><p>The game depicts famine, political repression, warfare, incarceration, and state violence through text and abstract graphics.</p></section>
    <div className={styles.actionRow}><BackButton /></div>
  </article></main>;
}

export function EndingScreen() {
  const campaign = useGameStore(s => s.campaign);
  const setScreen = useGameStore(s => s.setScreen);
  const ending = campaign?.endingId ? getEndingById(campaign.endingId) : undefined;
  return <main className={styles.page}><article className={styles.paperPanel}>
    <p className={styles.eyebrow}>Chapter outcome · {campaign ? formatGameDate(campaign.currentDate) : '1921'}</p>
    <h1>{ending?.title ?? 'The chapter closes'}</h1>
    <p className={styles.lead}>{ending?.epilogue ?? 'The organization leaves no simple record of what survived.'}</p>
    {campaign && <section className={styles.section}>
      <h2>Final ledger</h2>
      <p>Worker support {campaign.resources.workerSupport} · Political influence {campaign.resources.politicalInfluence} · Security {campaign.resources.security} · Exposure {campaign.resources.exposure}</p>
      <p>{campaign.decisions.length} decisions recorded; {campaign.completedEventIds.length} events resolved.</p>
    </section>}
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
  }}><strong>{slot.name}</strong><br/><span>{formatGameDate(slot.date)} · Turn {slot.turnNumber}{slot.ironman ? ' · Ironman' : ''}</span></button><button onClick={async () => { const save = await loadFromSlot(slot.id); if (save) exportSaveToFile(save); }}>Export</button><button disabled={slot.ironman} onClick={async () => { await duplicateSaveSlot(slot.id, `copy-${Date.now()}`, `${slot.name} · copy`); await refreshSaveSlots(); }}>Duplicate</button><button disabled={slot.ironman} onClick={async () => { await deleteSaveSlot(slot.id); await refreshSaveSlots(); }}>Delete</button></div>)}</div>}{message && <p role="alert">{message}</p>}</div>;
}
