import { create } from 'zustand';
import type {
  CampaignState,
  CampaignSettings,
  MapMode,
  TurnPhase,
  UserPreferences,
} from '@april-thesis/shared-types';
import {
  createCampaign,
  applyEffects,
  applyFlags,
  getNextPhase,
  advanceMonth,
  getEligibleEvents,
  resolveOperations,
  evaluateEndings,
  createSaveEnvelope,
  saveToSlot,
  listSaveSlots,
  loadPreferences,
  savePreferences,
  performFactionAction,
  lobbyDelegate,
  resolveVote,
  beginPolicyCampaign,
  campaignForProposal,
  influenceInstitution,
  runPoliticalMonth,
  isEventChoiceEligible,
  getOperationEligibility,
  appendCampaignSnapshot,
  type ContentBundle,
  type SaveSlot,
  type FactionActionId,
  type LobbyAction,
} from '@april-thesis/simulation';
import type { EventDefinition } from '@april-thesis/content-schema';
import { getContentBundle, getEventById } from '@april-thesis/content';
import { audioManager } from '../audio/audioManager';
import { canAdvanceTutorial, clampTutorialStep, TUTORIAL_STEPS } from '../tutorial/tutorialSystem';

export type Screen = 'intro' | 'title' | 'setup' | 'game' | 'archive' | 'settings' | 'credits' | 'ending';
export type AuxiliaryScreen = 'archive' | 'settings' | 'credits';

interface GameStore {
  screen: Screen;
  overlayScreen: AuxiliaryScreen | null;
  returnScreen: Screen;
  campaign: CampaignState | null;
  content: ReturnType<typeof getContentBundle>;
  selectedRegionId: string | null;
  selectedCharacterId: string | null;
  mapMode: MapMode;
  leftSidebarCollapsed: boolean;
  bottomWorkspaceCollapsed: boolean;
  bottomGroup: string;
  bottomTab: string;
  preferences: UserPreferences;
  saveSlots: SaveSlot[];
  turnSummary: string[] | null;
  audioEnabled: boolean;
  pendingNewspaper: { headline: string; publication: string } | null;
  campaignDirty: boolean;

  setScreen: (screen: Screen) => void;
  openAuxiliary: (screen: AuxiliaryScreen) => void;
  closeAuxiliary: () => void;
  returnToTitle: () => void;
  startCampaign: (settings: CampaignSettings) => void;
  startGuidedTutorial: () => void;
  loadCampaign: (envelope: { campaign: CampaignState }) => void;
  setPhase: (phase: TurnPhase) => void;
  advancePhase: () => void;
  selectRegion: (id: string | null) => void;
  selectCharacter: (id: string | null) => void;
  setMapMode: (mode: MapMode) => void;
  toggleLeftSidebar: () => void;
  toggleBottomWorkspace: () => void;
  setBottomGroup: (group: string, tab?: string) => void;
  setBottomTab: (tab: string) => void;
  setTutorialStep: (step: number) => void;
  nextTutorialStep: () => void;
  previousTutorialStep: () => void;
  pauseTutorial: () => void;
  skipTutorial: () => void;
  restartTutorial: () => void;
  recordTutorialMilestone: (milestone: string) => void;
  dismissTutorialEnd: () => void;
  dismissHint: (hintId: string, permanently?: boolean) => void;
  resetHints: () => void;
  resolveEventChoice: (eventId: string, choiceId: string) => void;
  startOperation: (regionId: string, operationId: string, organizerId?: string) => void;
  performFactionAction: (action: FactionActionId, organizerId?: string, targetId?: string) => void;
  lobbyDelegate: (delegateId: string, action: LobbyAction) => void;
  resolvePoliticalVote: () => void;
  beginPolicyCampaign: (proposalId: string) => void;
  campaignForProposal: (proposalId: string) => void;
  approachInstitution: (institutionId: string) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  saveGame: (slotId: string, name?: string) => Promise<void>;
  refreshSaveSlots: () => Promise<void>;
  endTurn: () => void;
  triggerEvent: (eventId: string) => void;
  dismissTurnSummary: () => void;
  setAudioEnabled: (enabled: boolean) => void;
}

const defaultPrefs: UserPreferences = {
  masterVolume: 0.7,
  musicVolume: 0.5,
  ambienceVolume: 0.6,
  interfaceVolume: 0.8,
  muted: false,
  reducedMotion: false,
  textScale: 1,
  introViewed: false,
  colorblindMode: false,
  enhancedInfluence: true,
  mapAnimation: true,
  ambientVisualEffects: true,
  audioPreload: 'full',
  beginnerHintMode: 'first_campaign',
  hiddenHintIds: [],
  campaignsStarted: 0,
  researchMode: false,
  allCityLabels: false,
  ...loadPreferences() as Partial<UserPreferences>,
};

const ACTIVE_SESSION_KEY = 'april-thesis-active-session-v4';
export const GUIDED_TUTORIAL_SEED = 'april-thesis-guided-tutorial-march-1921-v1';

function addTutorialMilestone(campaign: CampaignState, milestone: string): CampaignState {
  if (campaign.settings.tutorialMode !== 'guided_tutorial' || campaign.tutorialMilestones.includes(milestone)) return campaign;
  return { ...campaign, tutorialMilestones:[...campaign.tutorialMilestones,milestone] };
}

interface ActiveSession {
  campaign: CampaignState;
  wasActive: boolean;
  selectedRegionId: string | null;
  selectedCharacterId: string | null;
  mapMode: MapMode;
  bottomGroup: string;
  bottomTab: string;
  leftSidebarCollapsed: boolean;
  bottomWorkspaceCollapsed: boolean;
}

function loadActiveSession(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as ActiveSession;
    if (!session.wasActive || !session.campaign?.settings?.seed) return null;
    session.campaign.tutorialPaused ??= false;
    session.campaign.tutorialMilestones ??= [];
    session.campaign.tutorialEndPanelDismissed ??= false;
    session.campaign.settings.tutorialMode ??= session.campaign.settings.tutorialEnabled ? 'guided_opening' : 'none';
    session.campaign.dismissedHintIds ??= [];
    return session;
  } catch {
    return null;
  }
}

const activeSession = loadActiveSession();

function queueMonthEvents(state: CampaignState, events: EventDefinition[]): CampaignState {
  const next = structuredClone(state);
  const openingUnresolved = next.currentDate === '1921-03' && !next.flags.opening_strategy;
  const phaseEvents = events.filter(event =>
    (openingUnresolved && event.priority >= 96) || !event.phase || event.phase === next.phase,
  );
  const eligible = getEligibleEvents(next, phaseEvents, next.currentDate);
  for (const event of eligible) {
    if (!next.pendingEventIds.includes(event.id) && !next.completedEventIds.includes(event.id)) {
      next.pendingEventIds.push(event.id);
    }
  }
  return next;
}

function processPendingEvent(state: CampaignState): CampaignState {
  const next = structuredClone(state);
  if (next.currentEventId) return next;
  const pending = next.pendingEventIds.filter(id => !next.completedEventIds.includes(id));
  if (pending.length > 0) {
    next.currentEventId = pending[0];
  }
  return next;
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: activeSession ? 'game' : defaultPrefs.introViewed ? 'title' : 'intro',
  overlayScreen: null,
  returnScreen: 'title',
  campaign: activeSession?.campaign ?? null,
  content: getContentBundle(),
  selectedRegionId: activeSession?.selectedRegionId ?? null,
  selectedCharacterId: activeSession?.selectedCharacterId ?? null,
  mapMode: activeSession?.mapMode ?? 'political_influence',
  leftSidebarCollapsed: activeSession?.leftSidebarCollapsed ?? false,
  bottomWorkspaceCollapsed: activeSession?.bottomWorkspaceCollapsed ?? false,
  bottomGroup: activeSession?.bottomGroup ?? 'situation',
  bottomTab: activeSession?.bottomTab ?? 'economy',
  preferences: defaultPrefs,
  saveSlots: [],
  turnSummary: null,
  audioEnabled: false,
  pendingNewspaper: null,
  campaignDirty: Boolean(activeSession),

  setScreen: (screen) => {
    const state = get();
    if (state.screen === 'game' && state.campaign && ['archive','settings','credits'].includes(screen)) {
      state.openAuxiliary(screen as AuxiliaryScreen);
      return;
    }
    set({ screen, overlayScreen:null, returnScreen:state.screen });
  },

  openAuxiliary: (screen) => {
    const state = get();
    if (state.screen === 'game' && state.campaign) {
      if (typeof history !== 'undefined') history.pushState({ aprilThesisOverlay:screen }, '', location.href);
      set({ overlayScreen:screen, returnScreen:'game' });
      return;
    }
    set({ screen, overlayScreen:null, returnScreen:state.screen });
  },

  closeAuxiliary: () => {
    const state = get();
    if (state.overlayScreen) {
      if (typeof history !== 'undefined' && history.state?.aprilThesisOverlay) history.back();
      set({ overlayScreen:null });
      return;
    }
    set({ screen:state.returnScreen, returnScreen:'title' });
  },

  returnToTitle: () => set({ screen:'title', overlayScreen:null, returnScreen:'title' }),

  startCampaign: (settings) => {
    const content = get().content;
    const bundle: ContentBundle = {
      regions: content.regions,
      characters: content.characters,
      institutions: content.institutions,
      laws: content.laws,
    };
    let campaign = createCampaign(settings, bundle);
    campaign = queueMonthEvents(campaign, content.events);
    campaign = processPendingEvent(campaign);
    const preferences = { ...get().preferences, campaignsStarted:get().preferences.campaignsStarted + 1 };
    savePreferences(preferences as unknown as Record<string, unknown>);
    set({ campaign, preferences, screen:'game', overlayScreen:null, selectedRegionId:null, selectedCharacterId:null, bottomGroup:'situation', bottomTab:'economy', campaignDirty:true });
  },

  startGuidedTutorial: () => {
    const preferences = get().preferences;
    get().startCampaign({
      simulationMode:'historical', difficulty:'standard', background:'trade_union_organizer',
      tutorialEnabled:true, tutorialMode:'guided_tutorial', seed:GUIDED_TUTORIAL_SEED,
      ironman:false, reducedMotion:preferences.reducedMotion, glossaryEnabled:true,
      contentWarnings:true, autosaveFrequency:1,
    });
    const campaign = get().campaign;
    if (!campaign) return;
    const nextPreferences = { ...get().preferences, beginnerHintMode:'every_campaign' as const };
    savePreferences(nextPreferences as unknown as Record<string, unknown>);
    set({
      campaign:{ ...campaign, phase:'faction_management', objectives:['Complete the guided March round','Learn the province atlas','Secure a manual save'] },
      preferences:nextPreferences,
    });
  },

  loadCampaign: (envelope) => {
    envelope.campaign.tutorialPaused ??= false;
    envelope.campaign.tutorialMilestones ??= [];
    envelope.campaign.tutorialEndPanelDismissed ??= false;
    envelope.campaign.settings.tutorialMode ??= envelope.campaign.settings.tutorialEnabled ? 'guided_opening' : 'none';
    envelope.campaign.dismissedHintIds ??= [];
    set({ campaign:envelope.campaign, screen:'game', overlayScreen:null, campaignDirty:false });
  },

  setPhase: (phase) => {
    const { campaign } = get();
    if (!campaign) return;
    set({ campaign: { ...campaign, phase }, campaignDirty:true });
  },

  advancePhase: () => {
    const { campaign, content } = get();
    if (!campaign) return;
    let current = campaign;
    if (campaign.phase === 'party_politics' && campaign.voteState && !campaign.voteState.resolved && campaign.currentDate >= campaign.voteState.scheduledDate) {
      current = resolveVote(campaign);
    }
    const nextPhase = getNextPhase(current.phase);
    if (nextPhase === 'advance_month') {
      get().endTurn();
      return;
    }
    let next = { ...current, phase: nextPhase };
    if (nextPhase === 'consequences') next = addTutorialMilestone(next,'reached-consequences');
    next = queueMonthEvents(next, content.events);
    next = processPendingEvent(next);
    set({ campaign: next, campaignDirty:true });
  },

  selectRegion: (id) => set({ selectedRegionId: id, selectedCharacterId: null }),
  selectCharacter: (id) => {
    const campaign=get().campaign;
    set({ selectedCharacterId:id, selectedRegionId:null, ...(campaign&&id?{campaign:addTutorialMilestone(campaign,'character-opened'),campaignDirty:true}:{}) });
  },
  setMapMode: (mode) => set({ mapMode: mode }),
  toggleLeftSidebar: () => set(s => ({ leftSidebarCollapsed: !s.leftSidebarCollapsed })),
  toggleBottomWorkspace: () => set(s => ({ bottomWorkspaceCollapsed:!s.bottomWorkspaceCollapsed })),
  setBottomGroup: (group, tab) => set({ bottomGroup:group, ...(tab ? { bottomTab:tab } : {}) }),
  setBottomTab: (tab) => set({ bottomTab:tab }),

  setTutorialStep: (step) => {
    const campaign = get().campaign; if (!campaign) return;
    set({ campaign:{ ...campaign, tutorialStep:clampTutorialStep(step), tutorialPaused:false }, campaignDirty:true });
  },

  nextTutorialStep: () => {
    const campaign = get().campaign; if (!campaign || campaign.tutorialComplete) return;
    const step=TUTORIAL_STEPS[campaign.tutorialStep];
    if(step&&!canAdvanceTutorial(campaign,step))return;
    if (campaign.tutorialStep >= TUTORIAL_STEPS.length - 1) {
      if (campaign.turnNumber > 1) set({ campaign:{ ...campaign, tutorialStep:TUTORIAL_STEPS.length - 1, tutorialComplete:true, tutorialPaused:false, tutorialEndPanelDismissed:false }, campaignDirty:true });
      return;
    }
    set({ campaign:{ ...campaign, tutorialStep:campaign.tutorialStep + 1, tutorialPaused:false }, campaignDirty:true });
  },

  previousTutorialStep: () => {
    const campaign = get().campaign; if (!campaign || campaign.tutorialComplete) return;
    set({ campaign:{ ...campaign, tutorialStep:clampTutorialStep(campaign.tutorialStep - 1), tutorialPaused:false }, campaignDirty:true });
  },

  pauseTutorial: () => {
    const campaign = get().campaign; if (!campaign || campaign.tutorialComplete) return;
    set({ campaign:{ ...campaign, tutorialPaused:true }, campaignDirty:true });
  },

  skipTutorial: () => {
    const campaign = get().campaign; if (!campaign) return;
    set({ campaign:{ ...campaign, tutorialComplete:true, tutorialPaused:false, tutorialEndPanelDismissed:campaign.settings.tutorialMode==='guided_tutorial' }, campaignDirty:true });
  },

  restartTutorial: () => {
    const campaign = get().campaign; if (!campaign) return;
    if (campaign.settings.tutorialMode === 'guided_tutorial') { get().startGuidedTutorial(); return; }
    set({ campaign:{ ...campaign, settings:{ ...campaign.settings, tutorialEnabled:true }, tutorialStep:0, tutorialComplete:false, tutorialPaused:false }, campaignDirty:true });
  },

  recordTutorialMilestone: (milestone) => {
    const campaign=get().campaign; if(!campaign)return;
    const next=addTutorialMilestone(campaign,milestone);
    if(next!==campaign)set({campaign:next,campaignDirty:true});
  },

  dismissTutorialEnd: () => {
    const campaign=get().campaign;if(!campaign)return;
    set({campaign:{...campaign,tutorialEndPanelDismissed:true},campaignDirty:true});
  },

  dismissHint: (hintId, permanently=false) => {
    const state = get(); const campaign = state.campaign; if (!campaign) return;
    const dismissedHintIds = Array.from(new Set([...campaign.dismissedHintIds, hintId]));
    if (permanently) {
      const preferences = { ...state.preferences, hiddenHintIds:Array.from(new Set([...state.preferences.hiddenHintIds, hintId])) };
      savePreferences(preferences as unknown as Record<string, unknown>);
      set({ campaign:{ ...campaign, dismissedHintIds }, preferences, campaignDirty:true });
      return;
    }
    set({ campaign:{ ...campaign, dismissedHintIds }, campaignDirty:true });
  },

  resetHints: () => {
    const state = get();
    const preferences = { ...state.preferences, hiddenHintIds:[] };
    savePreferences(preferences as unknown as Record<string, unknown>);
    set({ preferences, ...(state.campaign ? { campaign:{ ...state.campaign, dismissedHintIds:[] }, campaignDirty:true } : {}) });
  },

  resolveEventChoice: (eventId, choiceId) => {
    const { campaign, content } = get();
    if (!campaign) return;
    const event = getEventById(eventId);
    if (!event) return;
    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) return;
    if (!isEventChoiceEligible(campaign, event, choiceId).eligible) return;

    let next = structuredClone(campaign);
    if (choice.effects) {
      next = applyEffects(next, choice.effects as Record<string, number | string | boolean>);
    }
    if (choice.flags) {
      next = applyFlags(next, choice.flags);
      if (typeof choice.flags.opening_strategy === 'string') {
        next.openingStrategy = choice.flags.opening_strategy as CampaignState['openingStrategy'];
      }
      if (typeof choice.flags.faction_response === 'string') {
        next.factionResponse = choice.flags.faction_response as CampaignState['factionResponse'];
      }
    }
    Object.keys(choice.effects ?? {}).forEach(key => {
      if (!key.startsWith('character:')) return;
      const characterId = key.split(':')[1];
      const character = next.characters[characterId];
      if (character) character.memory.push(`${next.currentDate}: ${event.title} — ${choice.text}`);
    });
    next.decisions.push({
      turn: next.turnNumber,
      date: next.currentDate,
      type: 'event',
      description: `${event.title}: ${choice.text}`,
      choiceId: choice.id,
    });
    next.completedEventIds.push(eventId);
    next = addTutorialMilestone(next,'event-resolved');
    next.pendingEventIds = next.pendingEventIds.filter(id => id !== eventId);
    next.currentEventId = null;

    if (choice.nextEventId) {
      next.pendingEventIds.push(choice.nextEventId);
    }

    const headlines: string[] = [];
    if (event.priority >= 70) {
      headlines.push(event.title);
      const official = choice.effects?.partyLegitimacy && Number(choice.effects.partyLegitimacy) > 0;
      const publicationId = official ? 'pravda' : next.resources.exposure > 55 ? 'cheka_digest' : 'wo_circular';
      const publication = content.publications.find(item => item.id === publicationId);
      const primaryId = `article-${next.turnNumber}-${next.newspapers.length}`;
      next.newspapers.push({
        id: primaryId,
        publicationId,
        headline: event.title.toUpperCase(),
        body: official
          ? `Party organs report that the matter has been settled in the interests of unity. The adopted course — ${choice.text.toLowerCase()} — is presented as necessary discipline.`
          : `Reports circulating among organizers describe the decision: ${choice.text}. Accounts remain incomplete, and officials dispute its political significance.`,
        date: next.currentDate,
        bias: publication?.bias ?? 'unknown',
        reliability: publication?.reliability ?? 40,
        template: publicationId === 'pravda' ? 'official' : publicationId === 'cheka_digest' ? 'security' : 'factional',
        linkedCharacterIds: Object.keys(choice.effects ?? {}).filter(key => key.startsWith('character:')).map(key => key.split(':')[1]),
      });
      const counterPublicationId = publicationId === 'pravda' ? 'wo_circular' : 'pravda';
      const counter = content.publications.find(item => item.id === counterPublicationId);
      next.newspapers.push({
        id: `article-${next.turnNumber}-${next.newspapers.length}`,
        publicationId: counterPublicationId,
        headline: publicationId === 'pravda' ? `WHAT THE OFFICIAL COMMUNIQUÉ OMITS: ${event.title}` : `PARTY STATEMENT ON ${event.title}`,
        body: publicationId === 'pravda'
          ? `A restricted circular disputes the official account. Delegates report that “${choice.text}” produced resistance, private bargaining, and unresolved workplace consequences.`
          : `The central press describes ${choice.text.toLowerCase()} as an orderly application of party policy and denies reports of a political rupture.`,
        date: next.currentDate, bias: counter?.bias ?? 'unknown', reliability: counter?.reliability ?? 45,
        suppressed: counterPublicationId === 'wo_circular' && next.resources.exposure > 65,
        contradictsArticleId: primaryId, template: counterPublicationId === 'pravda' ? 'official' : 'factional',
      });
      set({ pendingNewspaper: { headline: event.title, publication: 'pravda' } });
    }

    next = queueMonthEvents(next, content.events);
    next = processPendingEvent(next);

    const ending = evaluateEndings(next, content.endings);
    if (ending) {
      next.gameOver = true;
      next.endingId = ending.id;
      set({ campaign: next, screen: 'ending', campaignDirty:true });
      return;
    }

    set({ campaign: next, turnSummary: headlines.length ? headlines : null, campaignDirty:true });
  },

  startOperation: (regionId, operationId, organizerId) => {
    const { campaign, content } = get();
    if (!campaign) return;
    const opDef = content.operations.find(o => o.id === operationId);
    if (!opDef) return;
    const eligibility = getOperationEligibility(campaign, opDef, regionId, organizerId);
    if (!eligibility.eligible) return;

    const next = structuredClone(campaign);
    if (next.activeOperations.filter(op => op.startedTurn === next.turnNumber).length >= 2) return;
    for (const [key, value] of Object.entries(opDef.cost)) {
      if (key in next.resources && typeof value === 'number') {
        const resources = next.resources as unknown as Record<string, number>;
        if (resources[key] < value) return;
        resources[key] -= value;
      }
    }

    next.activeOperations.push({
      id: `op-${next.turnNumber}-${next.activeOperations.length}-${regionId}`,
      regionId,
      operationId,
      turnsRemaining: opDef.duration,
      organizerId,
      startedTurn: next.turnNumber,
      successChance: eligibility.successChance,
      detectionChance: eligibility.detectionChance,
    });
    if (organizerId && next.organizers[organizerId]) {
      const organizer = next.organizers[organizerId];
      organizer.status = 'assigned'; organizer.assignedRegionId = regionId; organizer.assignment = opDef.name;
      next.organizerAssignments[organizerId] = regionId;
    }

    set({ campaign:addTutorialMilestone(next,'operation-started'), campaignDirty:true });
  },

  performFactionAction: (action, organizerId, targetId) => {
    const campaign = get().campaign; if (!campaign) return;
    let next=performFactionAction(campaign, action, organizerId, targetId);
    if(next!==campaign&&action==='assign_region')next=addTutorialMilestone(next,'organizer-assigned');
    set({ campaign:next, campaignDirty:true });
  },

  lobbyDelegate: (delegateId, action) => {
    const campaign = get().campaign; if (!campaign) return;
    set({ campaign: lobbyDelegate(campaign, delegateId, action), campaignDirty:true });
  },

  resolvePoliticalVote: () => {
    const campaign = get().campaign; if (!campaign) return;
    set({ campaign: resolveVote(campaign), campaignDirty:true });
  },

  beginPolicyCampaign: (proposalId) => {
    const campaign = get().campaign; if (!campaign) return;
    set({ campaign: beginPolicyCampaign(campaign, proposalId), campaignDirty:true });
  },

  campaignForProposal: (proposalId) => {
    const campaign = get().campaign; if (!campaign) return;
    set({ campaign: campaignForProposal(campaign, proposalId), campaignDirty:true });
  },

  approachInstitution: (institutionId) => {
    const campaign = get().campaign; if (!campaign) return;
    set({ campaign: influenceInstitution(campaign, institutionId), campaignDirty:true });
  },

  updatePreferences: (prefs) => {
    const updated = { ...get().preferences, ...prefs };
    savePreferences(updated as Record<string, unknown>);
    audioManager.configure(updated);
    set({ preferences: updated });
    if (prefs.reducedMotion !== undefined) {
      document.documentElement.dataset.reducedMotion = String(prefs.reducedMotion);
    }
  },

  saveGame: async (slotId, name) => {
    let { campaign } = get();
    if (!campaign) return;
    campaign=addTutorialMilestone(campaign,'save-created');
    set({campaign});
    const effectiveSlot = campaign.settings.ironman ? 'ironman-campaign' : slotId;
    const envelope = createSaveEnvelope(campaign, campaign.settings.ironman ? `Ironman · ${campaign.settings.seed}` : name);
    await saveToSlot(effectiveSlot, envelope);
    set({ campaignDirty:false });
    await get().refreshSaveSlots();
  },

  refreshSaveSlots: async () => {
    const slots = await listSaveSlots();
    set({ saveSlots: slots });
  },

  endTurn: () => {
    const { campaign, content } = get();
    if (!campaign) return;

    let next = structuredClone(campaign);
    const { state: afterOps, completed } = resolveOperations(next, content.operations);
    next = afterOps;

    next = advanceMonth(next);
    next = addTutorialMilestone(next,'round-finished');
    next = runPoliticalMonth(next);
    next = appendCampaignSnapshot(next);
    next = queueMonthEvents(next, content.events);
    next = processPendingEvent(next);

    const headlines = completed.length > 0
      ? [`${completed.length} operation(s) completed`]
      : [`Month advanced to ${next.currentDate}`];

    const ending = evaluateEndings(next, content.endings);
    if (ending) {
      next.gameOver = true;
      next.endingId = ending.id;
      set({ campaign: next, screen: 'ending', turnSummary: headlines, campaignDirty:true });
      const envelope = createSaveEnvelope(next, `Autosave · ${next.currentDate}`);
      void saveToSlot(`autosave-${next.turnNumber % 3}`, envelope).then(() => get().refreshSaveSlots());
      return;
    }

    set({ campaign: next, turnSummary: headlines, campaignDirty:true });
    const envelope = createSaveEnvelope(next, `Autosave · ${next.currentDate}`);
    void saveToSlot(`autosave-${next.turnNumber % 3}`, envelope).then(() => get().refreshSaveSlots());
  },

  triggerEvent: (eventId) => {
    const { campaign } = get();
    if (!campaign) return;
    set({ campaign: { ...campaign, currentEventId: eventId }, campaignDirty:true });
  },

  dismissTurnSummary: () => {
    const campaign=get().campaign;
    set({ turnSummary:null, pendingNewspaper:null, ...(campaign?{campaign:addTutorialMilestone(campaign,'monthly-consequences-reviewed')}:{}) });
  },
  setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
}));

if (typeof window !== 'undefined') {
  useGameStore.subscribe(state => {
    if (!state.campaign) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      return;
    }
    const session: ActiveSession = {
      campaign:state.campaign,
      wasActive:state.screen === 'game',
      selectedRegionId:state.selectedRegionId,
      selectedCharacterId:state.selectedCharacterId,
      mapMode:state.mapMode,
      bottomGroup:state.bottomGroup,
      bottomTab:state.bottomTab,
      leftSidebarCollapsed:state.leftSidebarCollapsed,
      bottomWorkspaceCollapsed:state.bottomWorkspaceCollapsed,
    };
    try { localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session)); }
    catch { /* Indexed saves remain available when session storage is full or disabled. */ }
  });
}
