import { describe, expect, it } from 'vitest';
import { getContentBundle } from '@april-thesis/content';
import type { CampaignSettings } from '@april-thesis/shared-types';
import { SeededRng } from './rng';
import { createCampaign } from './campaign';
import { advanceMonth, applyEffects, evaluateEndings, resolveOperations } from './turns';
import { createSaveEnvelope, migrateSave, validateSaveEnvelope } from './save';
import { appendCampaignSnapshot, deriveNationalChartSeries } from './history';
import { beginPolicyCampaign, campaignForProposal, isEventChoiceEligible, lobbyDelegate, performFactionAction, resolveVote, runPoliticalMonth } from './politics';

const settings: CampaignSettings = {
  simulationMode: 'plausible', difficulty: 'standard', background: 'trade_union_organizer',
  tutorialEnabled: false, seed: 'test-seed', ironman: false, reducedMotion: true,
  glossaryEnabled: true, contentWarnings: true, autosaveFrequency: 1,
};

function campaign() {
  const content = getContentBundle();
  return createCampaign(settings, content);
}

describe('deterministic simulation', () => {
  it('replays the same random sequence from a seed', () => {
    const a = new SeededRng('april');
    const b = new SeededRng('april');
    expect([a.next(), a.next(), a.nextInt(1, 20)]).toEqual([b.next(), b.next(), b.nextInt(1, 20)]);
  });

  it('creates all strategic regions and date-specific institutions', () => {
    const state = campaign();
    expect(Object.keys(state.regions)).toHaveLength(28);
    expect(state.currentDate).toBe('1921-03');
    expect(state.institutions.cheka).toBeDefined();
    expect(state.historySnapshots).toHaveLength(1);
    expect(state.historySnapshots[0].date).toBe('1921-03');
  });

  it('captures real monthly history for visual dashboards without altering determinism', () => {
    const state = campaign();
    const april = advanceMonth(state);
    april.nationalStats.industrialProduction = 31;
    const withApril = appendCampaignSnapshot(april);
    const replacement = appendCampaignSnapshot({ ...withApril, nationalStats: { ...withApril.nationalStats, industrialProduction: 34 } });
    expect(replacement.historySnapshots.map(snapshot => snapshot.date)).toEqual(['1921-03', '1921-04']);
    expect(deriveNationalChartSeries(replacement.historySnapshots).at(-1)?.industrialProduction).toBe(34);
  });

  it('migrates earlier saves with a compatible history snapshot', () => {
    const envelope = createSaveEnvelope(campaign(), 'Legacy');
    envelope.saveVersion = 2;
    delete (envelope.campaign as Partial<typeof envelope.campaign>).historySnapshots;
    delete envelope.checksum;
    const migrated = migrateSave(envelope);
    expect(migrated.saveVersion).toBe(3);
    expect(migrated.campaign.historySnapshots).toHaveLength(1);
    expect(migrated.campaign.currentDate).toBe('1921-03');
  });

  it('applies nested regional influence and relationship effects', () => {
    const state = campaign();
    const next = applyEffects(state, {
      'region:petrograd:influence.workersOpposition': 7,
      'character:lenin:trust': -5,
      workerSupport: 4,
    });
    expect(next.regions.petrograd.influence.workersOpposition).toBe(37);
    expect(next.characters.lenin.trust).toBe(25);
    expect(next.resources.workerSupport).toBe(59);
    expect(state.regions.petrograd.influence.workersOpposition).toBe(30);
  });

  it('resolves an operation only after its duration and changes the target', () => {
    const content = getContentBundle();
    const state = campaign();
    state.activeOperations.push({ id: 'op-1', regionId: 'petrograd', operationId: 'send_organizer', turnsRemaining: 1, startedTurn: 1 });
    const result = resolveOperations(state, content.operations);
    expect(result.completed).toEqual(['op-1']);
    expect(result.state.activeOperations).toHaveLength(0);
    expect(result.state.regions.petrograd.influence.workersOpposition).toBe(35);
  });

  it('advances months and ages intelligence reports', () => {
    const next = advanceMonth(campaign());
    expect(next.currentDate).toBe('1921-04');
    expect(next.turnNumber).toBe(2);
    expect(next.regions.moscow.intelligenceAge).toBe(1);
  });

  it('selects a specific chapter ending before the survival fallback', () => {
    const content = getContentBundle();
    const state = campaign();
    state.currentDate = '1921-08'; state.turnNumber = 6; state.flags.chapter_one_complete = true;
    state.resources.partyLegitimacy = 70; state.resources.workerSupport = 70; state.resources.politicalInfluence = 60;
    expect(evaluateEndings(state, content.endings)?.id).toBe('ending_reform');
  });

  it('detects save corruption without mutating the campaign', () => {
    const envelope = createSaveEnvelope(campaign(), 'Test');
    expect(validateSaveEnvelope(envelope).slotName).toBe('Test');
    const corrupt = structuredClone(envelope);
    corrupt.campaign.turnNumber = 99;
    expect(() => validateSaveEnvelope(corrupt)).toThrow(/checksum mismatch/i);
  });

  it('initializes a named political world instead of aggregate placeholders', () => {
    const state = campaign();
    expect(Object.keys(state.organizers)).toHaveLength(8);
    expect(Object.keys(state.factionBlocs)).toHaveLength(8);
    expect(state.voteState?.delegates).toHaveLength(28);
    expect(Object.keys(state.policyProposals)).toHaveLength(3);
  });

  it('spends a limited faction action and assigns a named organizer', () => {
    const state = campaign(); state.phase = 'faction_management';
    const next = performFactionAction(state, 'assign_region', 'anna_sokolova', 'petrograd');
    expect(next.factionActionsRemaining).toBe(state.factionActionsRemaining - 1);
    expect(next.organizers.anna_sokolova.assignedRegionId).toBe('petrograd');
    expect(next.regions.petrograd.influence.workersOpposition).toBeGreaterThan(state.regions.petrograd.influence.workersOpposition);
  });

  it('enforces phase-gated delegate lobbying and records the actual contact', () => {
    const blocked = lobbyDelegate(campaign(), 'kamenev', 'private_meeting');
    expect(blocked.voteState?.log).toHaveLength(0);
    const state = campaign(); state.phase = 'party_politics';
    const next = lobbyDelegate(state, 'kamenev', 'private_meeting');
    expect(next.voteState?.log[0].delegateId).toBe('kamenev');
    expect(next.voteState?.actionsRemaining).toBe(1);
  });

  it('resolves every delegate deterministically and stores a named tally', () => {
    const a = campaign(); const b = campaign(); a.currentDate = '1921-06'; b.currentDate = '1921-06';
    const resolvedA = resolveVote(a); const resolvedB = resolveVote(b);
    expect(resolvedA.voteState?.tally).toEqual(resolvedB.voteState?.tally);
    expect(resolvedA.voteState?.delegates.every(delegate => delegate.resolvedVote)).toBe(true);
    expect(resolvedA.decisions.at(-1)?.type).toBe('named_delegate_vote');
  });

  it('runs proposal introduction and institutional campaigning as direct player actions', () => {
    const state = campaign(); state.phase = 'party_politics';
    const introduced = beginPolicyCampaign(state, 'factory_voice_campaign');
    const campaigned = campaignForProposal(introduced, 'factory_voice_campaign');
    expect(introduced.policyProposals.factory_voice_campaign.stage).toBe('campaigning');
    expect(campaigned.policyProposals.factory_voice_campaign.support).toBeGreaterThan(introduced.policyProposals.factory_voice_campaign.support);
    expect(campaigned.politicalActionsRemaining).toBe(0);
  });

  it('applies institution effect paths and date-appropriate regional governments', () => {
    const state = campaign();
    const next = applyEffects(state, { 'institution:vtssps:playerContacts': 9 });
    expect(next.institutions.vtssps.playerContacts).toBe(state.institutions.vtssps.playerContacts + 9);
    expect(state.regions.georgia.formalGovernment).toBe('Georgian SSR');
    expect(state.regions.far_east.formalGovernment).toContain('Far Eastern Republic');
  });

  it('enforces background-only event choices and renews monthly action economies', () => {
    const state = campaign();
    const opening = getContentBundle().events.find(event => event.id === 'opening_strategy_choice')!;
    expect(isEventChoiceEligible(state, opening, 'underground').eligible).toBe(false);
    state.settings.background = 'underground_printer';
    expect(isEventChoiceEligible(state, opening, 'underground').eligible).toBe(true);
    state.factionActionsRemaining = 0; state.politicalActionsRemaining = 0;
    const next = runPoliticalMonth(state);
    expect(next.factionActionsRemaining).toBe(2);
    expect(next.politicalActionsRemaining).toBe(2);
  });
});
