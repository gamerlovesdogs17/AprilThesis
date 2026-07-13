import { useGameStore } from './store/gameStore';
import { IntroCinematic } from './components/IntroCinematic';
import { TitleScreen } from './components/TitleScreen';
import { CampaignSetup } from './components/CampaignSetup';
import { GameScreen } from './components/GameScreen';
import { ArchiveScreen } from './components/ArchiveScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { CreditsScreen } from './components/CreditsScreen';
import { EndingScreen } from './components/EndingScreen';

export default function App() {
  const screen = useGameStore(s => s.screen);
  const reducedMotion = useGameStore(s => s.preferences.reducedMotion);

  return (
    <div data-reduced-motion={reducedMotion}>
      {screen === 'intro' && <IntroCinematic />}
      {screen === 'title' && <TitleScreen />}
      {screen === 'setup' && <CampaignSetup />}
      {screen === 'game' && <GameScreen />}
      {screen === 'archive' && <ArchiveScreen />}
      {screen === 'settings' && <SettingsScreen />}
      {screen === 'credits' && <CreditsScreen />}
      {screen === 'ending' && <EndingScreen />}
    </div>
  );
}
