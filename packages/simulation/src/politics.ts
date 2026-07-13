import type {
  CampaignState,
  DelegateState,
  FactionBlocState,
  OrganizerState,
  PlayerBackground,
  PolicyProposalState,
  VoteState,
} from '@april-thesis/shared-types';
import type { EventDefinition, OperationDefinition } from '@april-thesis/content-schema';
import { SeededRng } from './rng';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function meetsRequirements(state: CampaignState, requirements?: Record<string, number | string | boolean>): boolean {
  if (!requirements) return true;
  return Object.entries(requirements).every(([key, value]) => {
    if (key.startsWith('flag:')) return state.flags[key.slice(5)] === value;
    if (key in state.resources && typeof value === 'number') return (state.resources as unknown as Record<string, number>)[key] >= value;
    if (key in state.nationalStats && typeof value === 'number') return (state.nationalStats as unknown as Record<string, number>)[key] >= value;
    return true;
  });
}

function applyNumericEffects(state: CampaignState, effects: Record<string, number>): CampaignState {
  const next = structuredClone(state);
  for (const [key, value] of Object.entries(effects)) {
    if (key in next.resources) (next.resources as unknown as Record<string, number>)[key] = clamp((next.resources as unknown as Record<string, number>)[key] + value, 0, 100);
    else if (key in next.nationalStats) (next.nationalStats as unknown as Record<string, number>)[key] = clamp((next.nationalStats as unknown as Record<string, number>)[key] + value, 0, 100);
  }
  return next;
}

const organizer = (
  id: string, name: string, background: string,
  skills: OrganizerState['skills'], traits: string[], knowledge: string[],
): OrganizerState => ({
  id, name, background, skills, traits, regionKnowledge: Object.fromEntries(knowledge.map(regionId => [regionId, 85])),
  loyalty: 62, morale: 68, exposure: 18, health: 88, status: 'available',
  assignedRegionId: null, assignedInstitutionId: null, assignment: null, cooldown: 0,
});

export function createOrganizerRoster(): Record<string, OrganizerState> {
  const roster = [
    organizer('anna_sokolova', 'Anna Sokolova', 'Petrograd metalworker and strike delegate', { organizing: 84, security: 46, persuasion: 72, intelligence: 51 }, ['shop-floor trusted', 'impatient'], ['petrograd']),
    organizer('mikhail_baranov', 'Mikhail Baranov', 'Moscow railway-union secretary', { organizing: 76, security: 58, persuasion: 61, intelligence: 69 }, ['railway contacts', 'methodical'], ['moscow', 'central_industrial']),
    organizer('sofia_levina', 'Sofia Levina', 'Clandestine printer and courier', { organizing: 56, security: 88, persuasion: 64, intelligence: 79 }, ['forger', 'cautious'], ['petrograd', 'moscow']),
    organizer('ivan_korotkov', 'Ivan Korotkov', 'Donbas mine committee veteran', { organizing: 81, security: 49, persuasion: 59, intelligence: 44 }, ['miners trust him', 'stubborn'], ['donbas', 'ukraine']),
    organizer('nina_tereshchenko', 'Nina Tereshchenko', 'Textile organizer and relief coordinator', { organizing: 73, security: 61, persuasion: 82, intelligence: 55 }, ['relief network', 'coalition builder'], ['moscow', 'volga']),
    organizer('arsen_melikov', 'Arsen Melikov', 'Caucasus party courier', { organizing: 62, security: 78, persuasion: 58, intelligence: 83 }, ['multilingual', 'mountain routes'], ['caucasus', 'georgia', 'armenia']),
    organizer('pavel_dudin', 'Pavel Dudin', 'Demobilized political worker', { organizing: 59, security: 72, persuasion: 54, intelligence: 66 }, ['army contacts', 'battle fatigue'], ['western_front', 'belarus']),
    organizer('vera_antonova', 'Vera Antonova', 'Factory inspector and committee advocate', { organizing: 71, security: 52, persuasion: 77, intelligence: 71 }, ['knows regulations', 'plain speaker'], ['ural', 'central_industrial']),
  ];
  return Object.fromEntries(roster.map(item => [item.id, item]));
}

const bloc = (id: string, name: string, leaderId: string, preferences: string[], redLines: string[], underground: number, weight: number): FactionBlocState => ({
  id, name, leaderId, preferences, redLines, undergroundWillingness: underground,
  internalWeight: weight, support: 56, satisfaction: 58, splitRisk: 12, lastReaction: 'Awaiting a concrete line after the Congress.',
});

export function createFactionBlocs(): Record<string, FactionBlocState> {
  const blocs = [
    bloc('industrial_unionists', 'Industrial Unionists', 'shliapnikov', ['union_independence', 'legal organizing'], ['abandon unions'], 32, 18),
    bloc('factory_radicals', 'Factory-Committee Radicals', 'myasnikov', ['factory_committees', 'strike support'], ['one-man management'], 71, 13),
    bloc('legal_loyalists', 'Legal Party Loyalists', 'medvedev', ['party access', 'careful amendments'], ['open defiance'], 18, 15),
    bloc('underground_network', 'Underground Preservationists', 'lutovinov', ['secure cells', 'illegal press'], ['membership lists exposed'], 88, 12),
    bloc('feminist_organizers', 'Socialist Feminist Organizers', 'kollontai', ['relief work', 'women delegates'], ['silencing worker women'], 54, 11),
    bloc('regional_autonomists', 'Regional Soviet Autonomists', 'sapronov', ['local_soviet_autonomy', 'regional cadres'], ['Moscow appointments'], 49, 10),
    bloc('party_democrats', 'Anti-Bureaucratic Party Democrats', 'osinsky', ['elected administration', 'open debate'], ['secretariat control'], 43, 12),
    bloc('exhausted_moderates', 'Exhausted Moderates', 'tomsky', ['relief', 'organizational survival'], ['avoidable arrests'], 12, 9),
  ];
  return Object.fromEntries(blocs.map(item => [item.id, item]));
}

const delegateSeed: Array<[string, string, string, string, number, number, string[]]> = [
  ['lenin', 'Vladimir Lenin', 'Central leadership', 'central', -34, 94, ['party unity', 'state capacity']],
  ['trotsky', 'Leon Trotsky', 'Military and transport', 'discipline', -62, 87, ['labor discipline', 'production']],
  ['stalin', 'Joseph Stalin', 'Secretariat', 'apparatus', -48, 72, ['appointments', 'unity']],
  ['zinoviev', 'Grigory Zinoviev', 'Petrograd', 'central', -41, 74, ['Petrograd', 'party unity']],
  ['kamenev', 'Lev Kamenev', 'Moscow', 'central', -18, 78, ['coalition', 'administration']],
  ['bukharin', 'Nikolai Bukharin', 'Central press', 'left', 4, 65, ['theory', 'party debate']],
  ['tomsky', 'Mikhail Tomsky', 'Trade unions', 'union', 28, 76, ['union consultation', 'production']],
  ['rykov', 'Alexei Rykov', 'Economic administration', 'pragmatist', -8, 73, ['recovery', 'implementation']],
  ['dzerzhinsky', 'Felix Dzerzhinsky', 'Security apparatus', 'security', -72, 92, ['security', 'illegal factions']],
  ['molotov', 'Vyacheslav Molotov', 'Secretariat', 'apparatus', -45, 79, ['discipline', 'appointments']],
  ['krestinsky', 'Nikolai Krestinsky', 'Secretariat', 'apparatus', -21, 61, ['procedure', 'unity']],
  ['radek', 'Karl Radek', 'Comintern', 'left', -2, 52, ['international optics', 'rhetoric']],
  ['preobrazhensky', 'Yevgeni Preobrazhensky', 'Economic commission', 'left', 7, 63, ['planning', 'worker control']],
  ['rakovsky', 'Christian Rakovsky', 'Ukrainian delegation', 'regional', 13, 71, ['republic autonomy', 'coalition']],
  ['frunze', 'Mikhail Frunze', 'Red Army', 'military', -24, 81, ['army readiness', 'stability']],
  ['kalinin', 'Mikhail Kalinin', 'Soviet executive', 'pragmatist', 9, 68, ['peasant opinion', 'public legitimacy']],
  ['shliapnikov', 'Alexander Shliapnikov', 'Workers’ Opposition', 'opposition', 78, 91, ['union power', 'industrial workers']],
  ['kollontai', 'Alexandra Kollontai', 'Workers’ Opposition', 'opposition', 84, 89, ['worker democracy', 'women workers']],
  ['medvedev', 'Sergei Medvedev', 'Metalworkers', 'opposition', 69, 82, ['union mandate', 'faction survival']],
  ['lozovsky', 'Solomon Lozovsky', 'Trade unions', 'union', 31, 59, ['union administration', 'international labor']],
  ['sapronov', 'Timofei Sapronov', 'Democratic Centralists', 'party_democrat', 41, 68, ['elected bodies', 'bureaucracy']],
  ['osinsky', 'Valerian Osinsky', 'Democratic Centralists', 'party_democrat', 35, 66, ['administrative reform', 'debate']],
  ['lutovinov', 'Yuri Lutovinov', 'Industrial delegation', 'opposition', 72, 76, ['factory committees', 'industrial militants']],
  ['mikhailov', 'Vasily Mikhailov', 'Moscow apparatus', 'apparatus', -27, 54, ['appointments', 'Moscow discipline']],
  ['yaroslavsky', 'Yemelyan Yaroslavsky', 'Party Control', 'central', -39, 72, ['discipline', 'precedent']],
  ['rudzutak', 'Jānis Rudzutaks', 'Trade unions', 'union', 16, 64, ['administration', 'union consultation']],
  ['andreyev', 'Andrei Andreyev', 'Railway unions', 'union', 22, 58, ['railway labor', 'implementation']],
  ['ordzhonikidze', 'Sergo Ordzhonikidze', 'Caucasus bureau', 'regional', -31, 78, ['regional control', 'security']],
];

export function createDelegateRoster(intelligence: number): DelegateState[] {
  return delegateSeed.map(([id, name, delegation, blocName, lean, reliability, concerns]) => ({
    id, name, delegation, characterId: id, bloc: blocName,
    publicStance: lean >= 35 ? 'support' : lean <= -35 ? 'oppose' : 'undecided',
    estimatedLean: lean + Math.round((50 - intelligence) / 10),
    intelligenceConfidence: clamp(Math.round((intelligence + reliability) / 2), 20, 96),
    reliability, concerns, lobbying: 0, promises: [], resolvedVote: null,
  }));
}

function createJuneVote(intelligence: number): VoteState {
  const vote: VoteState = {
    id: 'june_union_consultation_vote',
    title: 'Union Consultation and Factory Voice Resolution',
    description: 'A composite June 1921 party ballot on mandatory union consultation, factory-committee advisory rights, and limits on administrative labor discipline.',
    scheduledDate: '1921-06', institutionId: 'central_committee', proposalId: 'union_consultation_campaign', threshold: 15,
    actionsRemaining: 2, delegates: createDelegateRoster(intelligence), log: [],
    declaredSupporters: 0, declaredOpponents: 0, undecided: 0, unreliableSupporters: 0,
    playerLobbying: 0, confidence: intelligence, resolved: false, passed: null, tally: null,
  };
  return refreshVoteEstimate(vote);
}

export function createPolicyProposals(): Record<string, PolicyProposalState> {
  const proposals: PolicyProposalState[] = [
    { id: 'union_consultation_campaign', lawId: 'union_independence', title: 'Mandatory Union Consultation', targetLevel: 1, stage: 'campaigning', support: 34, opposition: 51, institutionId: 'central_committee', immediateEffects: { workerSupport: 4, politicalInfluence: 2 }, ongoingEffects: { workerMorale: 2, partyUnity: -1 }, history: ['Placed on the June composite agenda.'] },
    { id: 'factory_voice_campaign', lawId: 'factory_committees', title: 'Factory Committee Co-Management', targetLevel: 2, stage: 'available', support: 27, opposition: 58, institutionId: 'vtssps', immediateEffects: { workerSupport: 6, organizationalCapacity: -2 }, ongoingEffects: { workerMorale: 3, industrialProduction: -1 }, history: [] },
    { id: 'party_press_campaign', lawId: 'press_restrictions', title: 'Protected Internal Party Press', targetLevel: 1, stage: 'available', support: 23, opposition: 63, institutionId: 'central_committee', immediateEffects: { intelligence: 4, exposure: 3 }, ongoingEffects: { sovietParticipation: 2, partyUnity: -1 }, history: [] },
  ];
  return Object.fromEntries(proposals.map(item => [item.id, item]));
}

export function initializePoliticalSystems(intelligence: number) {
  return {
    organizers: createOrganizerRoster(), factionBlocs: createFactionBlocs(),
    policyProposals: createPolicyProposals(), voteState: createJuneVote(intelligence),
  };
}

export function refreshVoteEstimate(vote: VoteState): VoteState {
  const next = structuredClone(vote);
  next.declaredSupporters = next.delegates.filter(d => d.publicStance === 'support').length;
  next.declaredOpponents = next.delegates.filter(d => d.publicStance === 'oppose').length;
  next.undecided = next.delegates.length - next.declaredSupporters - next.declaredOpponents;
  next.unreliableSupporters = next.delegates.filter(d => d.publicStance === 'support' && d.reliability < 70).length;
  next.playerLobbying = next.delegates.reduce((sum, d) => sum + d.lobbying, 0);
  return next;
}

export type FactionActionId = 'assign_region' | 'protect_cells' | 'print_material' | 'internal_meeting' | 'institution_contact' | 'rest_organizer' | 'allocate_budget';

export function performFactionAction(state: CampaignState, action: FactionActionId, organizerId?: string, targetId?: string): CampaignState {
  if (state.phase !== 'faction_management' || state.factionActionsRemaining <= 0) return state;
  const next = structuredClone(state);
  const org = organizerId ? next.organizers[organizerId] : undefined;
  if (org && (org.status === 'arrested' || org.status === 'missing')) return state;
  const costs: Partial<Record<FactionActionId, number>> = { protect_cells: 5, print_material: 6, institution_contact: 3, allocate_budget: 5 };
  const cost = costs[action] ?? 0;
  if (next.resources.treasury < cost) return state;
  next.resources.treasury -= cost;
  next.factionActionsRemaining -= 1;
  if (action === 'assign_region' && org && targetId && next.regions[targetId]) {
    org.status = 'assigned'; org.assignedRegionId = targetId; org.assignedInstitutionId = null; org.assignment = 'regional organization';
    next.organizerAssignments[org.id] = targetId;
    next.regions[targetId].influence.workersOpposition = clamp(next.regions[targetId].influence.workersOpposition + Math.round(org.skills.organizing / 20), 0, 100);
  } else if (action === 'protect_cells') {
    next.resources.security = clamp(next.resources.security + 8, 0, 100); next.resources.exposure = clamp(next.resources.exposure - 5, 0, 100);
    Object.values(next.factionBlocs).forEach(b => { if (b.id === 'underground_network') b.satisfaction = clamp(b.satisfaction + 9, 0, 100); });
  } else if (action === 'print_material') {
    next.propagandaTheme = targetId ?? 'worker democracy'; next.resources.workerSupport = clamp(next.resources.workerSupport + 5, 0, 100); next.resources.exposure = clamp(next.resources.exposure + 4, 0, 100);
  } else if (action === 'internal_meeting') {
    next.internalCohesion = clamp(next.internalCohesion + 7, 0, 100);
    Object.values(next.factionBlocs).forEach(b => { b.satisfaction = clamp(b.satisfaction + 3, 0, 100); b.splitRisk = clamp(b.splitRisk - 3, 0, 100); });
  } else if (action === 'institution_contact' && targetId && next.institutions[targetId]) {
    const institution = next.institutions[targetId]; institution.playerContacts = clamp(institution.playerContacts + 7, 0, 100); institution.attitude = clamp(institution.attitude + 4, 0, 100);
    if (org) { org.status = 'assigned'; org.assignedInstitutionId = targetId; org.assignedRegionId = null; org.assignment = 'institutional contact'; }
  } else if (action === 'rest_organizer' && org) {
    org.status = 'resting'; org.health = clamp(org.health + 10, 0, 100); org.morale = clamp(org.morale + 8, 0, 100); org.exposure = clamp(org.exposure - 8, 0, 100);
  } else if (action === 'allocate_budget' && targetId) {
    next.monthlyBudget[targetId] = (next.monthlyBudget[targetId] ?? 0) + 5;
    if (targetId === 'security') next.resources.security = clamp(next.resources.security + 4, 0, 100);
    if (targetId === 'press') next.resources.workerSupport = clamp(next.resources.workerSupport + 3, 0, 100);
    if (targetId === 'relief') next.resources.publicLegitimacy = clamp(next.resources.publicLegitimacy + 4, 0, 100);
  }
  next.decisions.push({ turn: next.turnNumber, date: next.currentDate, type: 'faction_action', description: `${action.replaceAll('_', ' ')}${org ? ` — ${org.name}` : ''}` });
  return next;
}

export type LobbyAction = 'private_meeting' | 'union_mandate' | 'policy_concession' | 'expose_contradiction';
const lobbyCosts: Record<LobbyAction, Record<string, number>> = {
  private_meeting: { politicalInfluence: 3 }, union_mandate: { organizationalCapacity: 3 },
  policy_concession: { politicalInfluence: 5, treasury: 2 }, expose_contradiction: { intelligence: 4, exposure: 3 },
};

export function lobbyDelegate(state: CampaignState, delegateId: string, action: LobbyAction): CampaignState {
  const vote = state.voteState;
  if (!vote || vote.resolved || vote.actionsRemaining <= 0 || state.phase !== 'party_politics') return state;
  const next = structuredClone(state);
  const delegate = next.voteState!.delegates.find(d => d.id === delegateId);
  if (!delegate) return state;
  const costs = lobbyCosts[action] as Record<string, number>;
  for (const [key, value] of Object.entries(costs)) {
    if (key === 'exposure') continue;
    const resources = next.resources as unknown as Record<string, number>;
    if ((resources[key] ?? 0) < value) return state;
  }
  for (const [key, value] of Object.entries(costs)) {
    const resources = next.resources as unknown as Record<string, number>;
    if (key === 'exposure') resources.exposure = clamp(resources.exposure + value, 0, 100); else resources[key] -= value;
  }
  const relationship = delegate.characterId ? next.characters[delegate.characterId]?.trust ?? 50 : 50;
  const base = { private_meeting: 11, union_mandate: 14, policy_concession: 18, expose_contradiction: 9 }[action];
  const gain = clamp(Math.round(base + (relationship - 50) / 10), 4, 22);
  delegate.lobbying += gain;
  delegate.promises.push(action.replaceAll('_', ' '));
  if (delegate.estimatedLean + delegate.lobbying >= 35) delegate.publicStance = 'support';
  next.voteState!.actionsRemaining -= 1;
  next.voteState!.log.push({ turn: next.turnNumber, delegateId, action, result: `${delegate.name} shifted ${gain} points`, cost: costs });
  next.voteState = refreshVoteEstimate(next.voteState!);
  return next;
}

export function resolveVote(state: CampaignState, force = false): CampaignState {
  if (!state.voteState || state.voteState.resolved || (!force && state.currentDate < state.voteState.scheduledDate)) return state;
  const next = structuredClone(state);
  const vote = next.voteState!;
  const rng = new SeededRng(next.rngState);
  let forVotes = 0, against = 0, abstain = 0;
  for (const delegate of vote.delegates) {
    const trust = delegate.characterId ? next.characters[delegate.characterId]?.trust ?? 50 : 50;
    const uncertainty = Math.round((100 - delegate.reliability) / 3);
    const score = delegate.estimatedLean + delegate.lobbying + Math.round((trust - 50) / 4) + rng.nextInt(-uncertainty, uncertainty);
    delegate.resolvedVote = score >= 10 ? 'for' : score <= -8 ? 'against' : 'abstain';
    if (delegate.resolvedVote === 'for') forVotes++; else if (delegate.resolvedVote === 'against') against++; else abstain++;
  }
  vote.tally = { for: forVotes, against, abstain };
  vote.passed = forVotes >= vote.threshold;
  vote.resolved = true;
  vote.log.push({ turn: next.turnNumber, action: 'resolve_ballot', result: `${forVotes}–${against}, ${abstain} abstaining` });
  const proposal = next.policyProposals[vote.proposalId];
  if (proposal) {
    proposal.stage = vote.passed ? 'passed' : 'failed'; proposal.history.push(`Ballot ${forVotes}–${against}; ${abstain} abstained.`);
    if (vote.passed) {
      next.laws[proposal.lawId] = proposal.targetLevel;
      Object.assign(next, applyNumericEffects(next, proposal.immediateEffects));
    } else next.resources.politicalInfluence = clamp(next.resources.politicalInfluence - 5, 0, 100);
  }
  next.decisions.push({ turn: next.turnNumber, date: next.currentDate, type: 'named_delegate_vote', description: `${vote.title}: ${vote.passed ? 'passed' : 'defeated'} ${forVotes}–${against} (${abstain} abstentions)` });
  next.rngState = rng.getState();
  return next;
}

export function beginPolicyCampaign(state: CampaignState, proposalId: string): CampaignState {
  const proposal = state.policyProposals[proposalId];
  if (!proposal || proposal.stage !== 'available' || state.politicalActionsRemaining <= 0 || state.phase !== 'party_politics') return state;
  const next = structuredClone(state);
  const target = next.policyProposals[proposalId];
  target.stage = 'campaigning'; target.support = clamp(target.support + 8, 0, 100); target.history.push(`${next.currentDate}: proposal formally introduced.`);
  next.politicalActionsRemaining -= 1;
  next.resources.politicalInfluence = clamp(next.resources.politicalInfluence - 4, 0, 100);
  next.decisions.push({ turn: next.turnNumber, date: next.currentDate, type: 'policy_proposal', description: `Introduced ${target.title}` });
  return next;
}

export function campaignForProposal(state: CampaignState, proposalId: string): CampaignState {
  const proposal = state.policyProposals[proposalId];
  if (!proposal || proposal.stage !== 'campaigning' || state.politicalActionsRemaining <= 0 || state.phase !== 'party_politics') return state;
  const next = structuredClone(state);
  const target = next.policyProposals[proposalId];
  const institution = next.institutions[target.institutionId];
  const gain = Math.round(5 + (institution?.playerContacts ?? 0) / 12);
  target.support = clamp(target.support + gain, 0, 100); target.opposition = clamp(target.opposition - Math.round(gain / 2), 0, 100);
  target.history.push(`${next.currentDate}: institutional campaign gained ${gain} support.`);
  next.politicalActionsRemaining -= 1;
  return next;
}

export function influenceInstitution(state: CampaignState, institutionId: string): CampaignState {
  if (state.phase !== 'party_politics' || state.politicalActionsRemaining <= 0 || !state.institutions[institutionId]) return state;
  const next = structuredClone(state);
  const inst = next.institutions[institutionId];
  if (next.resources.politicalInfluence < 3) return state;
  next.resources.politicalInfluence -= 3; next.politicalActionsRemaining -= 1;
  inst.playerContacts = clamp(inst.playerContacts + 6, 0, 100); inst.attitude = clamp(inst.attitude + 5, 0, 100); inst.lastAction = `Delegation received in ${next.currentDate}`;
  next.institutionHistory.push(`${next.currentDate}: approached ${institutionId}; contacts now ${inst.playerContacts}.`);
  return next;
}

export function runPoliticalMonth(state: CampaignState): CampaignState {
  let next = structuredClone(state);
  const rng = new SeededRng(next.rngState);
  next.factionActionsRemaining = next.settings.difficulty === 'lenient' ? 3 : 2;
  next.politicalActionsRemaining = next.settings.difficulty === 'historical_hardship' ? 1 : 2;
  if (next.voteState && !next.voteState.resolved) next.voteState.actionsRemaining = next.settings.difficulty === 'lenient' ? 3 : 2;
  next.monthlyBudget = {};
  Object.values(next.organizers).forEach(org => {
    if (org.cooldown > 0) org.cooldown--;
    if (org.status === 'resting') org.status = 'available';
    if (org.status === 'assigned') { org.morale = clamp(org.morale - 2, 0, 100); org.exposure = clamp(org.exposure + 2, 0, 100); }
  });
  Object.values(next.factionBlocs).forEach(blocState => {
    const pressure = Math.max(0, next.resources.exposure - 55) / 10;
    blocState.splitRisk = clamp(blocState.splitRisk + pressure - next.internalCohesion / 40, 0, 100);
    blocState.support = clamp(blocState.support + (blocState.satisfaction - 50) / 20, 0, 100);
  });
  for (const [id, char] of Object.entries(next.characters)) {
    if (char.availability !== 'active') continue;
    const roll = rng.nextInt(0, 4);
    if (roll === 0) { char.currentAgenda = 'Build an institutional coalition'; char.trust = clamp(char.trust + (id === 'kollontai' ? 2 : -1), 0, 100); }
    else if (roll === 1) { char.currentAgenda = 'Enforce the unity resolution'; next.resources.exposure = clamp(next.resources.exposure + (id === 'dzerzhinsky' ? 3 : 1), 0, 100); }
    else if (roll === 2) { char.currentAgenda = 'Secure appointments and reports'; next.institutions.secretariat.playerContacts = clamp(next.institutions.secretariat.playerContacts - 1, 0, 100); }
    else { char.currentAgenda = 'Watch the economic transition'; }
    char.lastAction = `${next.currentDate}: ${char.currentAgenda}`;
    if (['kollontai', 'shliapnikov', 'lenin', 'tomsky'].includes(id)) next.characterCommunications.push(`${next.currentDate}: ${id} — ${char.currentAgenda}. Trust ${char.trust}.`);
    if (char.health < 35 && rng.chance(.25)) { char.availability = 'ill'; char.lastAction = `${next.currentDate}: unavailable through illness.`; }
  }
  for (const [id, institution] of Object.entries(next.institutions)) {
    const agendas: Record<string, string> = {
      politburo: 'Coordinate famine, labor, and party-unity directives', central_committee: 'Prepare cadre reports and the June labor ballot', secretariat: 'Review regional appointments',
      vtssps: 'Reconcile production demands with union consultation', cheka: 'Map illegal faction networks', sovnarkom: 'Implement tax-in-kind and relief administration',
      factory_committees: 'Defend advisory authority at the enterprise level', local_soviets: 'Negotiate local implementation of central decrees',
    };
    institution.activeAgenda = agendas[id] ?? institution.activeAgenda;
    institution.lastAction = `${next.currentDate}: ${institution.activeAgenda}.`;
    institution.attitude = clamp(institution.attitude + (institution.factionInfluence - institution.securityPenetration) / 40, 0, 100);
  }
  if (next.resources.exposure > 78 && rng.chance(.35)) {
    const targets = Object.values(next.organizers).filter(org => ['available', 'assigned'].includes(org.status));
    if (targets.length) {
      const target = rng.pick(targets); target.status = 'arrested'; target.assignment = null; target.assignedRegionId = null;
      next.operationHistory.push(`${next.currentDate}: the Cheka arrested ${target.name} in a network sweep.`);
      next.characters.dzerzhinsky.lastAction = `${next.currentDate}: authorized a faction-network sweep.`;
    }
  }
  for (const proposal of Object.values(next.policyProposals)) {
    if (proposal.stage !== 'passed') continue;
    next = applyNumericEffects(next, proposal.ongoingEffects);
  }
  next.rngState = rng.getState();
  return next;
}

export function isEventChoiceEligible(state: CampaignState, event: EventDefinition, choiceId: string): { eligible: boolean; reason: string } {
  const choice = event.choices.find(c => c.id === choiceId);
  if (!choice) return { eligible: false, reason: 'Choice not found.' };
  if (choice.backgroundOnly?.length && !choice.backgroundOnly.includes(state.settings.background)) return { eligible: false, reason: `Requires background: ${choice.backgroundOnly.join(', ').replaceAll('_', ' ')}` };
  if (!meetsRequirements(state, choice.requirements as Record<string, number | string | boolean> | undefined)) return { eligible: false, reason: 'Requirements are not met.' };
  if (state.settings.simulationMode === 'historical' && event.historical.classification === 'counterfactual') return { eligible: false, reason: 'Unavailable on Historical Rails.' };
  return { eligible: true, reason: '' };
}

export function getOperationEligibility(state: CampaignState, operation: OperationDefinition, regionId: string, organizerId?: string): { eligible: boolean; reason: string; successChance: number; detectionChance: number } {
  const org = organizerId ? state.organizers[organizerId] : undefined;
  if (state.phase !== 'regional_operations') return { eligible: false, reason: 'Available during Regional Operations.', successChance: 0, detectionChance: 0 };
  if (state.operationCooldowns[operation.id] > 0) return { eligible: false, reason: `Cooldown: ${state.operationCooldowns[operation.id]} month(s).`, successChance: 0, detectionChance: 0 };
  if (organizerId && (!org || !['available', 'assigned'].includes(org.status))) return { eligible: false, reason: 'Organizer is unavailable.', successChance: 0, detectionChance: 0 };
  if (operation.requirements && !meetsRequirements(state, operation.requirements as Record<string, number | string | boolean>)) return { eligible: false, reason: 'Requirements are not met.', successChance: 0, detectionChance: 0 };
  const region = state.regions[regionId];
  const skill = org ? (org.skills.organizing + org.skills.security + (org.regionKnowledge[regionId] ?? 25)) / 3 : 42;
  const successChance = clamp(Math.round(38 + skill * .42 + state.resources.intelligence * .12 - region.chekaPresence * .18), 15, 94);
  const detectionChance = clamp(Math.round((operation.risks?.arrestChance ?? 0) * 100 + region.chekaPresence * .25 + state.resources.exposure * .2 - (org?.skills.security ?? 35) * .25), 2, 85);
  return { eligible: true, reason: '', successChance, detectionChance };
}

export function applyBackgroundBlocEffects(blocs: Record<string, FactionBlocState>, background: PlayerBackground) {
  const next = structuredClone(blocs);
  const favored: Partial<Record<PlayerBackground, string>> = {
    trade_union_organizer: 'industrial_unionists', factory_committee_delegate: 'factory_radicals', party_administrator: 'legal_loyalists',
    red_army_political_worker: 'exhausted_moderates', underground_printer: 'underground_network', socialist_feminist_organizer: 'feminist_organizers',
  };
  const id = favored[background];
  if (id) { next[id].support += 10; next[id].satisfaction += 8; }
  return next;
}
