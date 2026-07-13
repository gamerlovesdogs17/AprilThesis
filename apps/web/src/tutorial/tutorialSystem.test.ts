import { describe, expect, it } from 'vitest';
import type { CampaignState } from '@april-thesis/shared-types';
import { TUTORIAL_STEPS, clampTutorialStep, isHintModeEligible, nextHintForCampaign, tutorialProgress } from './tutorialSystem';

const campaign = {
  turnNumber: 1,
  phase: 'briefing',
  dismissedHintIds: [],
} as unknown as CampaignState;

describe('Phase Four onboarding rules', () => {
  it('defines and clamps the complete persisted tutorial sequence', () => {
    expect(TUTORIAL_STEPS).toHaveLength(18);
    expect(clampTutorialStep(-2)).toBe(0);
    expect(clampTutorialStep(99)).toBe(17);
    expect(tutorialProgress(17)).toBe(100);
  });

  it('supports first-campaign, every-campaign, and off hint modes', () => {
    expect(isHintModeEligible('off', 0)).toBe(false);
    expect(isHintModeEligible('first_campaign', 1)).toBe(true);
    expect(isHintModeEligible('first_campaign', 2)).toBe(false);
    expect(isHintModeEligible('every_campaign', 9)).toBe(true);
  });

  it('respects campaign dismissal and permanent opt-out state', () => {
    expect(nextHintForCampaign(campaign, 'every_campaign', 1, [])?.id).toBe('briefing-objectives');
    expect(nextHintForCampaign({ ...campaign, dismissedHintIds:['briefing-objectives'] }, 'every_campaign', 1, ['map-zoom'])?.id).toBe('disabled-events');
    expect(nextHintForCampaign({ ...campaign, turnNumber:2 }, 'every_campaign', 1, [])).toBeNull();
  });
});
