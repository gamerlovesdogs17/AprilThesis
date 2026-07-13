import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useGameStore } from '../store/gameStore';
import { nextHintForCampaign, TUTORIAL_STEPS, tutorialProgress } from '../tutorial/tutorialSystem';
import styles from './GuidedOverlays.module.css';

interface TargetRect { top:number; left:number; width:number; height:number }

export function TutorialOverlay() {
  const campaign = useGameStore(s => s.campaign)!;
  const next = useGameStore(s => s.nextTutorialStep);
  const back = useGameStore(s => s.previousTutorialStep);
  const pause = useGameStore(s => s.pauseTutorial);
  const skip = useGameStore(s => s.skipTutorial);
  const setBottomGroup = useGameStore(s => s.setBottomGroup);
  const selectRegion = useGameStore(s => s.selectRegion);
  const leftCollapsed = useGameStore(s => s.leftSidebarCollapsed);
  const bottomCollapsed = useGameStore(s => s.bottomWorkspaceCollapsed);
  const toggleLeft = useGameStore(s => s.toggleLeftSidebar);
  const toggleBottom = useGameStore(s => s.toggleBottomWorkspace);
  const [rect, setRect] = useState<TargetRect | null>(null);
  const step = TUTORIAL_STEPS[campaign.tutorialStep] ?? TUTORIAL_STEPS[0];

  useEffect(() => {
    const views: Record<string, [string,string]> = {
      'faction-management':['organization','faction'], 'assign-organizer':['organization','faction'],
      'character-dossier':['organization','characters'], 'institution':['organization','institutions'],
      'policy':['politics','laws'], 'political-actions':['politics','party'],
    };
    const view = views[step.id]; if (view) setBottomGroup(view[0], view[1]);
    if (view && bottomCollapsed) toggleBottom();
    if (['identify-faction','organizer-role'].includes(step.id) && leftCollapsed) toggleLeft();
    if (['assign-organizer','regional-operation'].includes(step.id) && !useGameStore.getState().selectedRegionId) selectRegion('petrograd');
    if (step.id==='narrative-event') document.querySelector<HTMLElement>('[data-testid="event-minimized"]')?.click();
  }, [bottomCollapsed,leftCollapsed,selectRegion,setBottomGroup,step.id,toggleBottom,toggleLeft]);

  useEffect(() => {
    const update = () => {
      const element = document.querySelector<HTMLElement>(`[data-tutorial="${step.target}"]`);
      document.querySelectorAll('.tutorial-target').forEach(item => item.classList.remove('tutorial-target'));
      if (!element || !element.offsetParent) { setRect(null); return; }
      element.classList.add('tutorial-target');
      const box = element.getBoundingClientRect();
      setRect({ top:box.top, left:box.left, width:box.width, height:box.height });
    };
    const timer = window.setTimeout(update, 40);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.clearTimeout(timer); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); document.querySelectorAll('.tutorial-target').forEach(item => item.classList.remove('tutorial-target')); };
  }, [step.target]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') pause(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pause]);

  const calloutStyle = useMemo(() => {
    if (!rect) return { left:'50%', top:'50%', transform:'translate(-50%,-50%)' } as CSSProperties;
    const margin = 14;
    if (step.placement === 'right') return { left:Math.min(window.innerWidth - 330, rect.left + rect.width + margin), top:Math.max(12, rect.top) };
    if (step.placement === 'left') return { left:Math.max(12, rect.left - 326), top:Math.max(12, rect.top) };
    if (step.placement === 'top') return { left:Math.max(12, Math.min(window.innerWidth - 330, rect.left)), top:Math.max(12, rect.top - 176) };
    return { left:Math.max(12, Math.min(window.innerWidth - 330, rect.left)), top:Math.min(window.innerHeight - 180, rect.top + rect.height + margin) };
  }, [rect, step.placement]);

  const finalStep = campaign.tutorialStep === TUTORIAL_STEPS.length - 1;
  return <div className={styles.tutorialLayer} aria-live="polite">
    {rect && <div className={styles.spotlight} style={{ top:rect.top-6, left:rect.left-6, width:rect.width+12, height:rect.height+12 }}/>} 
    <section className={styles.callout} style={calloutStyle} role="dialog" aria-label={`Tutorial step ${campaign.tutorialStep + 1} of ${TUTORIAL_STEPS.length}`}>
      <div className={styles.progressLine}><span style={{width:`${tutorialProgress(campaign.tutorialStep)}%`}}/></div>
      <p>Step {campaign.tutorialStep + 1} of {TUTORIAL_STEPS.length}</p><h2>{step.title}</h2><p>{step.body}</p>
      {finalStep && campaign.turnNumber === 1 && <small>Advance from consequences into April to finish this step.</small>}
      <div className={styles.calloutActions}><button onClick={pause}>Close</button><button onClick={skip}>Skip tutorial</button><button disabled={campaign.tutorialStep === 0} onClick={back}>Back</button><button className="primary" disabled={finalStep && campaign.turnNumber === 1} onClick={next}>{finalStep ? 'Complete' : 'Next'}</button></div>
    </section>
  </div>;
}

export function BeginnerHint() {
  const campaign = useGameStore(s => s.campaign)!;
  const preferences = useGameStore(s => s.preferences);
  const dismissHint = useGameStore(s => s.dismissHint);
  const [visible, setVisible] = useState(true);
  const [neverAgain, setNeverAgain] = useState(false);
  useEffect(() => { setVisible(true); setNeverAgain(false); }, [campaign.phase, campaign.turnNumber]);
  const hint = nextHintForCampaign(campaign, preferences.beginnerHintMode, preferences.campaignsStarted, preferences.hiddenHintIds);
  if (!visible || !hint || (campaign.settings.tutorialEnabled && !campaign.tutorialComplete)) return null;
  return <aside className={styles.hint} role="status" data-testid="beginner-hint"><p>Beginner hint</p><strong>{hint.title}</strong><span>{hint.body}</span><label><input type="checkbox" checked={neverAgain} onChange={event => setNeverAgain(event.target.checked)}/> Do not show this again.</label><button onClick={() => { dismissHint(hint.id, neverAgain); setVisible(false); }}>Dismiss</button></aside>;
}
