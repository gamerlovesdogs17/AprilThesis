import { describe, expect, it } from 'vitest';
import { getContentBundle } from '@april-thesis/content';
import type { CampaignSettings } from '@april-thesis/shared-types';
import { SeededRng } from './rng';
import { createCampaign } from './campaign';
import { advanceMonth, applyEffects, evaluateEndings, resolveOperations } from './turns';
import { createSaveEnvelope, validateSaveEnvelope } from './save';

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
});
