import { useMemo, useState } from 'react';
import type { CampaignSettings, Difficulty, InterfaceDetailMode, PlayerBackground, SimulationMode } from '@april-thesis/shared-types';
import { useGameStore } from '../store/gameStore';
import styles from './Shell.module.css';

const BACKGROUNDS: { id: PlayerBackground; name: string; detail: string }[] = [
  { id: 'trade_union_organizer', name: 'Trade-Union Organizer', detail: 'Strong worker networks; visible to party officials.' },
  { id: 'factory_committee_delegate', name: 'Factory Committee Delegate', detail: 'Deep shop-floor trust; weak institutional access.' },
  { id: 'party_administrator', name: 'Party Administrator', detail: 'Political contacts and intelligence; suspect among militants.' },
  { id: 'red_army_political_worker', name: 'Red Army Political Worker', detail: 'Security experience; compromised revolutionary credibility.' },
  { id: 'underground_printer', name: 'Underground Printer', detail: 'Clandestine skill and cash; little party legitimacy.' },
  { id: 'socialist_feminist_organizer', name: 'Socialist Feminist Organizer', detail: 'High morale and public legitimacy; limited formal influence.' },
];

export function CampaignSetup() {
  const startCampaign = useGameStore(s => s.startCampaign);
  const setScreen = useGameStore(s => s.setScreen);
  const preferences = useGameStore(s => s.preferences);
  const updatePreferences = useGameStore(s => s.updatePreferences);
  const [background, setBackground] = useState<PlayerBackground>('trade_union_organizer');
  const [difficulty, setDifficulty] = useState<Difficulty>('standard');
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('plausible');
  const [tutorialEnabled, setTutorialEnabled] = useState(true);
  const [ironman, setIronman] = useState(false);
  const [interfaceDetail, setInterfaceDetail] = useState<InterfaceDetailMode>(preferences.interfaceDetail);
  const [advancedOpen, setAdvancedOpen] = useState(preferences.interfaceDetail === 'expert');
  const suggestedSeed = useMemo(() => `march-1921-${new Date().toISOString().slice(0, 10)}`, []);
  const [seed, setSeed] = useState(suggestedSeed);

  const launch = () => {
    updatePreferences({ interfaceDetail });
    const settings: CampaignSettings = {
      simulationMode,
      difficulty,
      background,
      tutorialEnabled,
      tutorialMode: tutorialEnabled ? 'guided_opening' : 'none',
      seed: seed.trim() || suggestedSeed,
      ironman,
      reducedMotion: preferences.reducedMotion,
      glossaryEnabled: true,
      contentWarnings: true,
      autosaveFrequency: 1,
    };
    startCampaign(settings);
  };

  return (
    <main className={styles.page}>
      <section className={styles.paperPanel}>
        <p className={styles.eyebrow}>Campaign dossier · March 1921</p>
        <h1>Choose the organizer you were before the ban</h1>
        <p className={styles.lead}>You are a fictional senior member of the Workers’ Opposition. Historical leaders retain their own agendas and may refuse you.</p>

        <div className={styles.experienceChoice} role="radiogroup" aria-label="Interface detail">
          <button type="button" role="radio" aria-checked={interfaceDetail === 'standard'} className={interfaceDetail === 'standard' ? styles.selectedCard : styles.choiceCard} onClick={() => setInterfaceDetail('standard')}><strong>Standard · recommended</strong><span>Focused map, essential indicators, and contextual guidance. The full political simulation remains active.</span></button>
          <button type="button" role="radio" aria-checked={interfaceDetail === 'expert'} className={interfaceDetail === 'expert' ? styles.selectedCard : styles.choiceCard} onClick={() => { setInterfaceDetail('expert'); setAdvancedOpen(true); }}><strong>Expert</strong><span>All map layers, statistics, and documentary controls remain visible.</span></button>
        </div>

        <details className={styles.factionOverview} aria-label="Workers' Opposition campaign overview">
          <summary>Campaign context and historical faction dossier</summary>
          <figure className={styles.factionDocument}><img src="/assets/documents/workers-opposition-1921-title-page.jpg" alt="Title page of Alexandra Kollontai's 1921 pamphlet The Workers Opposition in Russia"/><figcaption>Historical faction document · 1921 English IWW edition · public domain · publication month uncertain, shown as documentary framing</figcaption></figure>
          <div><p className={styles.eyebrow}>Your faction</p><h2 className={styles.factionWordmark}>Workers’<br/>Opposition</h2><p>A Bolshevik current rooted in trade unions and industrial labor. You are a senior organizer—not the ruler of Soviet Russia—and your personal background changes how you work inside this one faction.</p><blockquote>“The management of the national economy must be entrusted to the producers.” <small>Platform summary after Kollontai; interface paraphrase</small></blockquote><div className={styles.leaderStrip}><figure><img src="/assets/portraits/kollontai.jpg" alt="Historical portrait of Alexandra Kollontai"/><figcaption>Alexandra Kollontai · portrait dated 1923 · documentary only</figcaption></figure><figure><img src="/assets/portraits/shliapnikov.jpg" alt="Historical portrait of Alexander Shliapnikov"/><figcaption>Alexander Shliapnikov · period photograph</figcaption></figure><div><b>Sergei Medvedev</b><span>Metalworkers’ organizer · no uncertain portrait substituted</span></div></div><div className={styles.factionBrief}><span><b>Principal leaders</b>Kollontai · Shliapnikov · Medvedev</span><span><b>Starting strength</b>Militant workers, unions, factory committees</span><span><b>Starting weakness</b>Formal authority, security, party legitimacy</span><span><b>Institutional position</b>Condemned at the Tenth Congress; faction activity prohibited</span><span><b>Main dilemma</b>Comply, preserve informal networks, organize secretly, or resist</span></div></div>
        </details>

        <div className={styles.cardGrid} role="radiogroup" aria-label="Player background">
          {BACKGROUNDS.map(item => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={background === item.id}
              className={background === item.id ? styles.selectedCard : styles.choiceCard}
              onClick={() => setBackground(item.id)}
            >
              <strong>{item.name}</strong><span>{item.detail}</span>
            </button>
          ))}
        </div>

        <div className={styles.formGrid}>
          <label>Difficulty
            <select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}>
              <option value="lenient">Lenient</option>
              <option value="standard">Standard</option>
              <option value="severe">Severe</option>
              <option value="historical_hardship">Historical hardship</option>
            </select>
          </label>
        </div>

        <div className={styles.checkRow}>
          <label><input type="checkbox" checked={tutorialEnabled} onChange={e => setTutorialEnabled(e.target.checked)} /> Guided Opening <small>Light contextual guidance in an ordinary campaign—not the structured main-menu tutorial.</small></label>
        </div>

        <section className={styles.advancedSetup}>
          <button type="button" className={styles.advancedToggle} aria-expanded={advancedOpen} onPointerDown={event => { event.preventDefault(); setAdvancedOpen(open => !open); }} onClick={event => event.preventDefault()} onKeyDown={event => { if(event.key==='Enter'||event.key===' '){event.preventDefault();setAdvancedOpen(open=>!open);} }}>Advanced campaign rules</button>
          {advancedOpen && <div className={styles.advancedSetupBody}>
          <div className={styles.formGrid}>
            <label>Historical constraint
              <select value={simulationMode} onChange={e => setSimulationMode(e.target.value as SimulationMode)}>
                <option value="historical">Historical rails</option>
                <option value="plausible">Plausible divergence</option>
                <option value="unbound">Unbound counterfactual</option>
              </select>
            </label>
            <label>Campaign seed
              <input value={seed} onChange={e => setSeed(e.target.value)} spellCheck={false} />
            </label>
          </div>
          <div className={styles.checkRow}><label><input type="checkbox" checked={ironman} onChange={e => setIronman(e.target.checked)} /> Ironman rules</label></div>
          </div>}
        </section>

        <div className={styles.actionRow}>
          <button onClick={() => setScreen('title')}>Return</button>
          <button className="primary" onClick={launch}>Open your faction dossier</button>
        </div>
      </section>
    </main>
  );
}
