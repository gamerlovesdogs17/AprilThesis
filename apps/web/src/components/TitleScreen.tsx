import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { loadFromSlot } from '@april-thesis/simulation';
import { audioManager } from '../audio/audioManager';
import styles from './TitleScreen.module.css';

export function TitleScreen() {
  const setScreen = useGameStore(s => s.setScreen);
  const refreshSaveSlots = useGameStore(s => s.refreshSaveSlots);
  const saveSlots = useGameStore(s => s.saveSlots);
  const loadCampaign = useGameStore(s => s.loadCampaign);
  const preferences = useGameStore(s => s.preferences);
  useEffect(() => {
    refreshSaveSlots();
  }, [refreshSaveSlots]);
  useEffect(() => { audioManager.configure(preferences); audioManager.setScene([]); audioManager.setMusicContext('title'); }, [preferences]);

  const handleContinue = async () => {
    if (saveSlots.length > 0) {
      const latest = saveSlots.slice().sort((a,b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      const envelope = await loadFromSlot(latest.id);
      if (envelope) loadCampaign(envelope);
    }
  };

  return (
    <div className={styles.titleScreen}>
      <div className={styles.bgPattern} aria-hidden="true" />
      <header className={styles.header}>
        <h1 className={styles.title}>APRIL THESIS</h1>
        <p className={styles.subtitle}>The Revolution After Victory</p>
        <p className={styles.campaignLine}>Lead the Workers’ Opposition through the crisis of 1921.</p>
        <blockquote className={styles.quote}>
          &ldquo;The revolution was won once. Now it must decide what it has become.&rdquo;
        </blockquote>
      </header>

      <nav className={styles.menu} aria-label="Main menu">
        <button className={`primary ${styles.menuBtn}`} onClick={() => setScreen('setup')}>
          New Campaign
        </button>
        <button
          className={styles.menuBtn}
          onClick={handleContinue}
          disabled={saveSlots.length === 0}
        >
          Continue {saveSlots.length > 0 ? `(${saveSlots.slice().sort((a,b) => b.updatedAt.localeCompare(a.updatedAt))[0].name})` : ''}
        </button>
        <button className={styles.menuBtn} onClick={() => setScreen('archive')}>
          Archive
        </button>
        <button className={styles.menuBtn} onClick={() => setScreen('settings')}>
          Settings
        </button>
        <button className={styles.menuBtn} onClick={() => setScreen('credits')}>
          Credits
        </button>
        <button className={styles.menuBtn} onClick={() => setScreen('intro')}>
          Replay Introduction
        </button>
      </nav>

      <footer className={styles.footer}>
        <p>Playable chapter · March–August 1921 · Soviet Russia</p>
        <p className={styles.note}>
          The historical &ldquo;April Theses&rdquo; were presented by Lenin in 1917.
          This game begins in 1921, after civil war victory.
        </p>
      </footer>
    </div>
  );
}
