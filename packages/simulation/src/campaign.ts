import type {
  CampaignState,
  CampaignSettings,
  FactionResources,
  NationalStatistics,
  RegionState,
  RegionInfluence,
  Difficulty,
  PlayerBackground,
} from '@april-thesis/shared-types';
import { CAMPAIGN_START_DATE } from '@april-thesis/shared-types';
import type { RegionDefinition, CharacterDefinition, InstitutionDefinition, LawDefinition } from '@april-thesis/content-schema';
import { SeededRng } from './rng';

const DIFFICULTY_MODIFIERS: Record<Difficulty, Partial<FactionResources>> = {
  lenient: { treasury: 15, security: 10, intelligence: 10, partyLegitimacy: 5 },
  standard: {},
  severe: { treasury: -15, security: -10, exposure: 10, organizationalCapacity: -10 },
  historical_hardship: { treasury: -25, security: -15, exposure: 15, workerSupport: -10 },
};

const BACKGROUND_MODIFIERS: Record<PlayerBackground, {
  advantage: Partial<FactionResources>;
  liability: Partial<FactionResources>;
  characterTrust: Record<string, number>;
}> = {
  trade_union_organizer: {
    advantage: { workerSupport: 15, organizationalCapacity: 5 },
    liability: { partyLegitimacy: -5, exposure: 5 },
    characterTrust: { tomsky: 10, shliapnikov: 15, medvedev: 10 },
  },
  factory_committee_delegate: {
    advantage: { workerSupport: 20, revolutionaryCredibility: 10 },
    liability: { politicalInfluence: -10, security: -5 },
    characterTrust: { myasnikov: 15, kollontai: 10 },
  },
  party_administrator: {
    advantage: { politicalInfluence: 15, partyLegitimacy: 10, intelligence: 10 },
    liability: { revolutionaryCredibility: -10, workerSupport: -5 },
    characterTrust: { rykov: 10, kamenev: 5, stalin: 5 },
  },
  red_army_political_worker: {
    advantage: { security: 10, publicLegitimacy: 5 },
    liability: { exposure: 10, revolutionaryCredibility: -5 },
    characterTrust: { trotsky: 10, dzerzhinsky: -10 },
  },
  underground_printer: {
    advantage: { security: 15, treasury: 10 },
    liability: { partyLegitimacy: -15, exposure: 10 },
    characterTrust: { kollontai: 5 },
  },
  socialist_feminist_organizer: {
    advantage: { publicLegitimacy: 10, cadreMorale: 10 },
    liability: { politicalInfluence: -5 },
    characterTrust: { kollontai: 20, krupskaya: 15 },
  },
};

function defaultResources(): FactionResources {
  return {
    organizationalCapacity: 45,
    politicalInfluence: 25,
    workerSupport: 40,
    partyLegitimacy: 35,
    revolutionaryCredibility: 50,
    publicLegitimacy: 30,
    cadreMorale: 55,
    security: 40,
    treasury: 35,
    intelligence: 30,
    exposure: 25,
  };
}

function defaultNationalStats(): NationalStatistics {
  return {
    industrialProduction: 25,
    agriculturalProduction: 30,
    grainReserves: 15,
    urbanFoodSupply: 20,
    inflation: 65,
    stateRevenue: 20,
    foreignTrade: 10,
    blackMarketActivity: 40,
    unemployment: 55,
    workerDiscipline: 40,
    workerMorale: 30,
    peasantCompliance: 25,
    peasantUnrest: 45,
    famineSeverity: 60,
    disease: 50,
    childHomelessness: 55,
    infrastructure: 30,
    railwayCapacity: 35,
    administrativeCapacity: 35,
    corruption: 40,
    politicalRepression: 45,
    partyUnity: 40,
    sovietParticipation: 25,
    redArmyReadiness: 50,
    nationalityTensions: 40,
    publicExhaustion: 70,
    revolutionaryEnthusiasm: 20,
    internationalIsolation: 75,
    regimeStability: 35,
  };
}

function buildRegionState(def: RegionDefinition): RegionState {
  const inf = def.initialState.influence;
  const influence: RegionInfluence = {
    centralCommittee: inf.centralCommittee ?? 50,
    secretariat: inf.secretariat ?? 30,
    workersOpposition: inf.workersOpposition ?? 15,
    trotsky: inf.trotsky ?? 25,
    zinoviev: inf.zinoviev ?? 20,
    leftCommunist: inf.leftCommunist ?? 10,
    democraticCentralist: inf.democraticCentralist ?? 8,
    srUnderground: inf.srUnderground ?? 5,
    menshevikUnderground: inf.menshevikUnderground ?? 5,
    anarchist: inf.anarchist ?? 3,
  };
  return {
    id: def.id,
    formalGovernment: 'RSFSR',
    administrativeCapacity: def.initialState.administrativeCapacity,
    influence,
    peasantResistance: def.initialState.peasantResistance,
    nationalMovementStrength: def.initialState.nationalMovementStrength,
    whiteActivity: def.initialState.whiteActivity,
    localSovietAutonomy: def.initialState.localSovietAutonomy,
    tradeUnionOrganization: def.initialState.tradeUnionOrganization,
    factoryCommitteeOrganization: def.initialState.factoryCommitteeOrganization,
    chekaPresence: def.initialState.chekaPresence,
    redArmyLoyalty: def.initialState.redArmyLoyalty,
    industrialProduction: def.initialState.industrialProduction,
    agriculturalProduction: def.initialState.agriculturalProduction,
    foodSupply: def.initialState.foodSupply,
    famineSeverity: def.initialState.famineSeverity,
    infrastructure: def.initialState.infrastructure,
    railwayAccess: def.initialState.railwayAccess,
    publicUnrest: def.initialState.publicUnrest,
    strikeActivity: def.initialState.strikeActivity,
    urbanPopulation: def.urbanPopulation,
    ruralPopulation: def.ruralPopulation,
    workerSupport: def.initialState.workerSupport,
    partyMembership: def.initialState.partyMembership,
    intelligenceReliability: def.initialState.intelligenceReliability,
    intelligenceAge: 0,
  };
}

export interface ContentBundle {
  regions: RegionDefinition[];
  characters: CharacterDefinition[];
  institutions: InstitutionDefinition[];
  laws: LawDefinition[];
}

export function createCampaign(
  settings: CampaignSettings,
  content: ContentBundle,
): CampaignState {
  const rng = new SeededRng(settings.seed);
  let resources = { ...defaultResources() };
  const diffMods = DIFFICULTY_MODIFIERS[settings.difficulty];
  for (const [k, v] of Object.entries(diffMods)) {
    if (v !== undefined) (resources as Record<string, number>)[k] += v;
  }
  const bgMods = BACKGROUND_MODIFIERS[settings.background];
  for (const [k, v] of Object.entries(bgMods.advantage)) {
    (resources as Record<string, number>)[k] += v;
  }
  for (const [k, v] of Object.entries(bgMods.liability)) {
    (resources as Record<string, number>)[k] += v;
  }
  resources = clampResources(resources);

  const regions: Record<string, RegionState> = {};
  for (const def of content.regions) {
    regions[def.id] = buildRegionState(def);
  }

  const characters: CampaignState['characters'] = {};
  for (const def of content.characters) {
    let trust = def.initialState.trust;
    if (bgMods.characterTrust[def.id]) trust += bgMods.characterTrust[def.id];
    characters[def.id] = {
      id: def.id,
      trust: clamp(trust, 0, 100),
      fear: def.initialState.fear,
      respect: def.initialState.respect,
      health: def.initialState.health,
      factionAlignment: def.initialState.factionAlignment,
      memory: [],
      isAlive: true,
      isArrested: false,
      isExiled: false,
    };
  }

  const institutions: CampaignState['institutions'] = {};
  for (const def of content.institutions) {
    institutions[def.id] = {
      id: def.id,
      factionInfluence: def.initialState.factionInfluence,
      playerContacts: def.initialState.playerContacts,
      securityPenetration: def.initialState.securityPenetration,
      bureaucratization: def.initialState.bureaucratization,
      corruption: def.initialState.corruption,
    };
  }

  const laws: Record<string, number> = {};
  for (const law of content.laws) {
    laws[law.id] = law.currentLevel;
  }

  return {
    settings,
    currentDate: CAMPAIGN_START_DATE,
    turnNumber: 1,
    phase: 'briefing',
    resources,
    nationalStats: defaultNationalStats(),
    regions,
    characters,
    institutions,
    activeOperations: [],
    completedEventIds: [],
    pendingEventIds: ['opening_kronstadt_aftermath', 'tenth_congress_final_days'],
    currentEventId: null,
    laws,
    propagandaTheme: null,
    openingStrategy: null,
    factionResponse: null,
    internalCohesion: 60,
    objectives: ['Survive the faction ban', 'Maintain worker connections', 'Navigate the NEP transition'],
    decisions: [],
    newspapers: [],
    tutorialStep: settings.tutorialEnabled ? 0 : -1,
    tutorialComplete: !settings.tutorialEnabled,
    gameOver: false,
    endingId: null,
    rngState: rng.getState(),
    organizerAssignments: {},
    monthlyBudget: {},
    voteState: null,
    flags: {
      kronstadt_suppressed: true,
      faction_ban_passed: false,
      nep_proposed: true,
      famine_active: true,
    },
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function clampResources(r: FactionResources): FactionResources {
  const result = { ...r };
  for (const key of Object.keys(result) as (keyof FactionResources)[]) {
    result[key] = clamp(result[key], 0, 100);
  }
  return result;
}

export { clamp, clampResources };
