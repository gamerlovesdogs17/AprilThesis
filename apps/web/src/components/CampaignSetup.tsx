import { useMemo, useState } from 'react';
import type { CampaignSettings, Difficulty, PlayerBackground, SimulationMode } from '@april-thesis/shared-types';
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
  const [background, setBackground] = useState<PlayerBackground>('trade_union_organizer');
  const [difficulty, setDifficulty] = useState<Difficulty>('standard');
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('plausible');
  const [tutorialEnabled, setTutorialEnabled] = useState(true);
  const [ironman, setIronman] = useState(false);
  const suggestedSeed = useMemo(() => `march-1921-${new Date().toISOString().slice(0, 10)}`, []);
  const [seed, setSeed] = useState(suggestedSeed);

  const launch = () => {
    const settings: CampaignSettings = {
      simulationMode,
      difficulty,
      background,
      tutorialEnabled,
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
          <label>Historical constraint
            <select value={simulationMode} onChange={e => setSimulationMode(e.target.value as SimulationMode)}>
              <option value="historical">Historical rails</option>
              <option value="plausible">Plausible divergence</option>
              <option value="unbound">Unbound counterfactual</option>
            </select>
          </label>
          <label>Difficulty
            <select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}>
              <option value="lenient">Lenient</option>
              <option value="standard">Standard</option>
              <option value="severe">Severe</option>
              <option value="historical_hardship">Historical hardship</option>
            </select>
          </label>
          <label>Campaign seed
            <input value={seed} onChange={e => setSeed(e.target.value)} spellCheck={false} />
          </label>
        </div>

        <div className={styles.checkRow}>
          <label><input type="checkbox" checked={tutorialEnabled} onChange={e => setTutorialEnabled(e.target.checked)} /> Guided opening</label>
          <label><input type="checkbox" checked={ironman} onChange={e => setIronman(e.target.checked)} /> Ironman rules</label>
        </div>

        <div className={styles.actionRow}>
          <button onClick={() => setScreen('title')}>Return</button>
          <button className="primary" onClick={launch}>Open the March dossier</button>
        </div>
      </section>
    </main>
  );
}
