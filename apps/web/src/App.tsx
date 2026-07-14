import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { IntroCinematic } from './components/IntroCinematic';
import { TitleScreen } from './components/TitleScreen';
import { CampaignSetup } from './components/CampaignSetup';
import { GameScreen } from './components/GameScreen';
import { ArchiveScreen } from './components/ArchiveScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { CreditsScreen } from './components/CreditsScreen';
import { EndingScreen } from './components/EndingScreen';
import { audioManager } from './audio/audioManager';

export default function App() {
  const screen = useGameStore(s => s.screen);
  const overlayScreen = useGameStore(s => s.overlayScreen);
  const preferences = useGameStore(s => s.preferences);
  const { reducedMotion, interfaceDetail, textScale } = preferences;

  useEffect(() => {
    const onBack = () => {
      if (useGameStore.getState().overlayScreen) useGameStore.setState({ overlayScreen:null });
    };
    window.addEventListener('popstate', onBack);
    return () => window.removeEventListener('popstate', onBack);
  }, []);

  useEffect(() => {
    const activate=()=>audioManager.activate(useGameStore.getState().preferences);
    window.addEventListener('pointerdown',activate,{once:true});window.addEventListener('keydown',activate,{once:true});
    return ()=>{window.removeEventListener('pointerdown',activate);window.removeEventListener('keydown',activate);};
  }, []);

  useEffect(() => {
    const scale = Math.min(1.35, Math.max(.85, textScale));
    document.documentElement.style.setProperty('--font-size-base', `${14 * scale}px`);
    return () => { document.documentElement.style.removeProperty('--font-size-base'); };
  }, [textScale]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  const auxiliary = overlayScreen === 'settings' ? <SettingsScreen /> : overlayScreen === 'archive' ? <ArchiveScreen /> : overlayScreen === 'credits' ? <CreditsScreen /> : null;

  return (
    <div data-reduced-motion={reducedMotion} data-interface-detail={interfaceDetail}>
      {screen === 'intro' && <IntroCinematic />}
      {screen === 'title' && <TitleScreen />}
      {screen === 'setup' && <CampaignSetup />}
      {screen === 'game' && <GameScreen />}
      {screen === 'archive' && <ArchiveScreen />}
      {screen === 'settings' && <SettingsScreen />}
      {screen === 'credits' && <CreditsScreen />}
      {screen === 'ending' && <EndingScreen />}
      {overlayScreen && <div className="auxiliary-overlay" role="dialog" aria-modal="true" aria-label={`${overlayScreen} campaign overlay`}>{auxiliary}</div>}
    </div>
  );
}
