// Core type definitions for APRIL THESIS

export type SimulationMode = 'historical' | 'plausible' | 'unbound';
export type Difficulty = 'lenient' | 'standard' | 'severe' | 'historical_hardship';
export type PlayerBackground =
  | 'trade_union_organizer'
  | 'factory_committee_delegate'
  | 'party_administrator'
  | 'red_army_political_worker'
  | 'underground_printer'
  | 'socialist_feminist_organizer';

export type OpeningStrategy =
  | 'legal_party_reform'
  | 'trade_union_mobilization'
  | 'underground_preservation'
  | 'nep_worker_safeguards'
  | 'anti_bureaucratic_coalition'
  | 'regional_soviet_strategy';

export type FactionResponse =
  | 'formal_dissolve'
  | 'public_comply_informal'
  | 'secret_organization'
  | 'open_resist';

export type TurnPhase =
  | 'briefing'
  | 'faction_management'
  | 'regional_operations'
  | 'party_politics'
  | 'consequences';

export type MapMode =
  | 'political_influence'
  | 'formal_administration'
  | 'party_organization'
  | 'trade_union_strength'
  | 'factory_committee_strength'
  | 'local_soviet_autonomy'
  | 'security_surveillance'
  | 'red_army_loyalty'
  | 'economic_output'
  | 'food_supply'
  | 'famine_disease'
  | 'unrest_strikes'
  | 'nationality_movements'
  | 'railway_infrastructure'
  | 'propaganda_reach'
  | 'intelligence_confidence';

export type HistoricalClassification =
  | 'historical'
  | 'historically_plausible'
  | 'counterfactual'
  | 'fictional_composite';

export interface HistoricalMetadata {
  classification: HistoricalClassification;
  sourceIds: string[];
  historicalDate?: string;
  divergenceRequirements?: string[];
  designerNotes?: string;
}

export interface CharacterPositionPeriod {
  startDate: string;
  endDate?: string;
  offices: string[];
  issuePositions: Record<string, number | string>;
  alliances: string[];
  conflicts: string[];
  confidence: 'high' | 'medium' | 'low';
  sourceIds: string[];
}

export interface FactionResources {
  organizationalCapacity: number;
  politicalInfluence: number;
  workerSupport: number;
  partyLegitimacy: number;
  revolutionaryCredibility: number;
  publicLegitimacy: number;
  cadreMorale: number;
  security: number;
  treasury: number;
  intelligence: number;
  exposure: number;
}

export interface NationalStatistics {
  industrialProduction: number;
  agriculturalProduction: number;
  grainReserves: number;
  urbanFoodSupply: number;
  inflation: number;
  stateRevenue: number;
  foreignTrade: number;
  blackMarketActivity: number;
  unemployment: number;
  workerDiscipline: number;
  workerMorale: number;
  peasantCompliance: number;
  peasantUnrest: number;
  famineSeverity: number;
  disease: number;
  childHomelessness: number;
  infrastructure: number;
  railwayCapacity: number;
  administrativeCapacity: number;
  corruption: number;
  politicalRepression: number;
  partyUnity: number;
  sovietParticipation: number;
  redArmyReadiness: number;
  nationalityTensions: number;
  publicExhaustion: number;
  revolutionaryEnthusiasm: number;
  internationalIsolation: number;
  regimeStability: number;
}

export interface RegionInfluence {
  centralCommittee: number;
  secretariat: number;
  workersOpposition: number;
  trotsky: number;
  zinoviev: number;
  leftCommunist: number;
  democraticCentralist: number;
  srUnderground: number;
  menshevikUnderground: number;
  anarchist: number;
}

export interface RegionState {
  id: string;
  formalGovernment: string;
  administrativeCapacity: number;
  influence: RegionInfluence;
  peasantResistance: number;
  nationalMovementStrength: number;
  whiteActivity: number;
  localSovietAutonomy: number;
  tradeUnionOrganization: number;
  factoryCommitteeOrganization: number;
  chekaPresence: number;
  redArmyLoyalty: number;
  industrialProduction: number;
  agriculturalProduction: number;
  foodSupply: number;
  famineSeverity: number;
  infrastructure: number;
  railwayAccess: number;
  publicUnrest: number;
  strikeActivity: number;
  urbanPopulation: number;
  ruralPopulation: number;
  workerSupport: number;
  partyMembership: number;
  intelligenceReliability: number;
  intelligenceAge: number;
}

export interface CharacterState {
  id: string;
  trust: number;
  fear: number;
  respect: number;
  health: number;
  factionAlignment: string;
  memory: string[];
  isAlive: boolean;
  isArrested: boolean;
  isExiled: boolean;
}

export interface InstitutionState {
  id: string;
  factionInfluence: number;
  playerContacts: number;
  securityPenetration: number;
  bureaucratization: number;
  corruption: number;
}

export interface ActiveOperation {
  id: string;
  regionId: string;
  operationId: string;
  turnsRemaining: number;
  organizerId?: string;
  startedTurn: number;
}

export interface DecisionRecord {
  turn: number;
  date: string;
  type: string;
  description: string;
  choiceId?: string;
  effects?: Record<string, number>;
}

export interface NewspaperArticle {
  id: string;
  publicationId: string;
  headline: string;
  body: string;
  date: string;
  regionId?: string;
  characterId?: string;
  bias: string;
  reliability: number;
}

export interface CampaignSettings {
  simulationMode: SimulationMode;
  difficulty: Difficulty;
  background: PlayerBackground;
  tutorialEnabled: boolean;
  seed: string;
  ironman: boolean;
  reducedMotion: boolean;
  glossaryEnabled: boolean;
  contentWarnings: boolean;
  autosaveFrequency: number;
}

export interface CampaignState {
  settings: CampaignSettings;
  currentDate: string;
  turnNumber: number;
  phase: TurnPhase;
  resources: FactionResources;
  nationalStats: NationalStatistics;
  regions: Record<string, RegionState>;
  characters: Record<string, CharacterState>;
  institutions: Record<string, InstitutionState>;
  activeOperations: ActiveOperation[];
  completedEventIds: string[];
  pendingEventIds: string[];
  currentEventId: string | null;
  laws: Record<string, number>;
  propagandaTheme: string | null;
  openingStrategy: OpeningStrategy | null;
  factionResponse: FactionResponse | null;
  internalCohesion: number;
  objectives: string[];
  decisions: DecisionRecord[];
  newspapers: NewspaperArticle[];
  tutorialStep: number;
  tutorialComplete: boolean;
  gameOver: boolean;
  endingId: string | null;
  rngState: number;
  organizerAssignments: Record<string, string>;
  monthlyBudget: Record<string, number>;
  voteState: VoteState | null;
  flags: Record<string, boolean | number | string>;
}

export interface VoteState {
  id: string;
  declaredSupporters: number;
  declaredOpponents: number;
  undecided: number;
  unreliableSupporters: number;
  playerLobbying: number;
  confidence: number;
  resolved: boolean;
  passed: boolean | null;
}

export interface SaveEnvelope {
  saveVersion: number;
  gameVersion: string;
  contentVersion: string;
  seed: string;
  createdAt: string;
  updatedAt: string;
  checksum?: string;
  campaign: CampaignState;
  slotName?: string;
}

export interface UserPreferences {
  masterVolume: number;
  musicVolume: number;
  ambienceVolume: number;
  interfaceVolume: number;
  muted: boolean;
  reducedMotion: boolean;
  textScale: number;
  introViewed: boolean;
  colorblindMode: boolean;
}

export const GAME_VERSION = '0.1.0';
export const CONTENT_VERSION = '0.1.0';
export const SAVE_VERSION = 1;
export const CAMPAIGN_START_DATE = '1921-03';
export const CAMPAIGN_END_DATE = '1924-04';
export const VERTICAL_SLICE_END = '1921-08';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function formatGameDate(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function advanceDate(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number);
  if (month === 12) return `${year + 1}-01`;
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}
