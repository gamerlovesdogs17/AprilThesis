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
  type ContentBundle,
  type SaveSlot,
} from '@april-thesis/simulation';
import type { EventDefinition } from '@april-thesis/content-schema';
import { getContentBundle, getEventById } from '@april-thesis/content';

export type Screen = 'intro' | 'title' | 'setup' | 'game' | 'archive' | 'settings' | 'credits' | 'ending';

interface GameStore {
  screen: Screen;
  campaign: CampaignState | null;
  content: ReturnType<typeof getContentBundle>;
  selectedRegionId: string | null;
  selectedCharacterId: string | null;
  mapMode: MapMode;
  leftSidebarCollapsed: boolean;
  bottomTab: string;
  preferences: UserPreferences;
  saveSlots: SaveSlot[];
  turnSummary: string[] | null;
  audioEnabled: boolean;
  pendingNewspaper: { headline: string; publication: string } | null;

  setScreen: (screen: Screen) => void;
  startCampaign: (settings: CampaignSettings) => void;
  loadCampaign: (envelope: { campaign: CampaignState }) => void;
  setPhase: (phase: TurnPhase) => void;
  advancePhase: () => void;
  selectRegion: (id: string | null) => void;
  selectCharacter: (id: string | null) => void;
  setMapMode: (mode: MapMode) => void;
  toggleLeftSidebar: () => void;
  setBottomTab: (tab: string) => void;
  resolveEventChoice: (eventId: string, choiceId: string) => void;
  startOperation: (regionId: string, operationId: string) => void;
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
  ...loadPreferences() as Partial<UserPreferences>,
};

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
  screen: defaultPrefs.introViewed ? 'title' : 'intro',
  campaign: null,
  content: getContentBundle(),
  selectedRegionId: null,
  selectedCharacterId: null,
  mapMode: 'political_influence',
  leftSidebarCollapsed: false,
  bottomTab: 'economy',
  preferences: defaultPrefs,
  saveSlots: [],
  turnSummary: null,
  audioEnabled: false,
  pendingNewspaper: null,

  setScreen: (screen) => set({ screen }),

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
    set({ campaign, screen: 'game' });
  },

  loadCampaign: (envelope) => {
    set({ campaign: envelope.campaign, screen: 'game' });
  },

  setPhase: (phase) => {
    const { campaign } = get();
    if (!campaign) return;
    set({ campaign: { ...campaign, phase } });
  },

  advancePhase: () => {
    const { campaign, content } = get();
    if (!campaign) return;
    const nextPhase = getNextPhase(campaign.phase);
    if (nextPhase === 'advance_month') {
      get().endTurn();
      return;
    }
    let next = { ...campaign, phase: nextPhase };
    next = queueMonthEvents(next, content.events);
    next = processPendingEvent(next);
    set({ campaign: next });
  },

  selectRegion: (id) => set({ selectedRegionId: id, selectedCharacterId: null }),
  selectCharacter: (id) => set({ selectedCharacterId: id, selectedRegionId: null }),
  setMapMode: (mode) => set({ mapMode: mode }),
  toggleLeftSidebar: () => set(s => ({ leftSidebarCollapsed: !s.leftSidebarCollapsed })),
  setBottomTab: (tab) => set({ bottomTab: tab }),

  resolveEventChoice: (eventId, choiceId) => {
    const { campaign, content } = get();
    if (!campaign) return;
    const event = getEventById(eventId);
    if (!event) return;
    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) return;

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
      next.newspapers.push({
        id: `article-${next.turnNumber}-${next.newspapers.length}`,
        publicationId,
        headline: event.title.toUpperCase(),
        body: official
          ? `Party organs report that the matter has been settled in the interests of unity. The adopted course — ${choice.text.toLowerCase()} — is presented as necessary discipline.`
          : `Reports circulating among organizers describe the decision: ${choice.text}. Accounts remain incomplete, and officials dispute its political significance.`,
        date: next.currentDate,
        bias: publication?.bias ?? 'unknown',
        reliability: publication?.reliability ?? 40,
      });
      set({ pendingNewspaper: { headline: event.title, publication: 'pravda' } });
    }

    next = queueMonthEvents(next, content.events);
    next = processPendingEvent(next);

    const ending = evaluateEndings(next, content.endings);
    if (ending) {
      next.gameOver = true;
      next.endingId = ending.id;
      set({ campaign: next, screen: 'ending' });
      return;
    }

    set({ campaign: next, turnSummary: headlines.length ? headlines : null });
  },

  startOperation: (regionId, operationId) => {
    const { campaign, content } = get();
    if (!campaign) return;
    const opDef = content.operations.find(o => o.id === operationId);
    if (!opDef) return;

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
      startedTurn: next.turnNumber,
    });

    set({ campaign: next });
  },

  updatePreferences: (prefs) => {
    const updated = { ...get().preferences, ...prefs };
    savePreferences(updated as Record<string, unknown>);
    set({ preferences: updated });
    if (prefs.reducedMotion !== undefined) {
      document.documentElement.dataset.reducedMotion = String(prefs.reducedMotion);
    }
  },

  saveGame: async (slotId, name) => {
    const { campaign } = get();
    if (!campaign) return;
    const envelope = createSaveEnvelope(campaign, name);
    await saveToSlot(slotId, envelope);
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
    next = queueMonthEvents(next, content.events);
    next = processPendingEvent(next);

    const headlines = completed.length > 0
      ? [`${completed.length} operation(s) completed`]
      : [`Month advanced to ${next.currentDate}`];

    const ending = evaluateEndings(next, content.endings);
    if (ending) {
      next.gameOver = true;
      next.endingId = ending.id;
      set({ campaign: next, screen: 'ending', turnSummary: headlines });
      const envelope = createSaveEnvelope(next, `Autosave · ${next.currentDate}`);
      void saveToSlot(`autosave-${next.turnNumber % 3}`, envelope).then(() => get().refreshSaveSlots());
      return;
    }

    set({ campaign: next, turnSummary: headlines });
    const envelope = createSaveEnvelope(next, `Autosave · ${next.currentDate}`);
    void saveToSlot(`autosave-${next.turnNumber % 3}`, envelope).then(() => get().refreshSaveSlots());
  },

  triggerEvent: (eventId) => {
    const { campaign } = get();
    if (!campaign) return;
    set({ campaign: { ...campaign, currentEventId: eventId } });
  },

  dismissTurnSummary: () => set({ turnSummary: null, pendingNewspaper: null }),
  setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
}));
