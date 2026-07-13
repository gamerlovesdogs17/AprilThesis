import { describe, expect, it } from 'vitest';
import type { CampaignState } from '@april-thesis/shared-types';
import { TUTORIAL_STEPS, canAdvanceTutorial, clampTutorialStep, isHintModeEligible, nextHintForCampaign, tutorialProgress } from './tutorialSystem';

const campaign = {
  turnNumber: 1,
  phase: 'briefing',
  dismissedHintIds: [],
} as unknown as CampaignState;

describe('Phase Five onboarding rules', () => {
  it('defines and clamps the complete persisted tutorial sequence', () => {
    expect(TUTORIAL_STEPS).toHaveLength(21);
    expect(clampTutorialStep(-2)).toBe(0);
    expect(clampTutorialStep(99)).toBe(20);
    expect(tutorialProgress(20)).toBe(100);
  });

  it('supports first-campaign, every-campaign, and off hint modes', () => {
    expect(isHintModeEligible('off', 0)).toBe(false);
    expect(isHintModeEligible('first_campaign', 1)).toBe(true);
    expect(isHintModeEligible('first_campaign', 2)).toBe(false);
    expect(isHintModeEligible('every_campaign', 9)).toBe(true);
  });

  it('gates required interactions by persisted milestones', () => {
    const provinceStep = TUTORIAL_STEPS.find(step => step.id === 'select-province')!;
    expect(canAdvanceTutorial({ ...campaign, tutorialMilestones:[] }, provinceStep)).toBe(false);
    expect(canAdvanceTutorial({ ...campaign, tutorialMilestones:['province-selected'] }, provinceStep)).toBe(true);
    expect(canAdvanceTutorial({ ...campaign, tutorialMilestones:[] }, TUTORIAL_STEPS[0])).toBe(true);
  });

  it('respects campaign dismissal and permanent opt-out state', () => {
    expect(nextHintForCampaign(campaign, 'every_campaign', 1, [])?.id).toBe('briefing-objectives');
    expect(nextHintForCampaign({ ...campaign, dismissedHintIds:['briefing-objectives'] }, 'every_campaign', 1, ['map-zoom'])?.id).toBe('disabled-events');
    expect(nextHintForCampaign({ ...campaign, turnNumber:2 }, 'every_campaign', 1, [])).toBeNull();
  });
});
