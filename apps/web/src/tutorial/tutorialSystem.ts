import type { BeginnerHintMode, CampaignState, TurnPhase } from '@april-thesis/shared-types';

export type TutorialPlacement = 'top' | 'right' | 'bottom' | 'left' | 'center';

export interface TutorialStepDefinition {
  id: string;
  title: string;
  body: string;
  target: string;
  placement: TutorialPlacement;
}

export const TUTORIAL_STEPS: TutorialStepDefinition[] = [
  { id:'identify-faction', title:'Your faction', body:'This is the Workers’ Opposition: a Bolshevik current rooted in unions and industrial labor.', target:'faction-identity', placement:'right' },
  { id:'organizer-role', title:'Your role', body:'You are a faction organizer, not the ruler of Soviet Russia. Formal power belongs to institutions and historical leaders.', target:'faction-identity', placement:'right' },
  { id:'turn-phases', title:'One month, five phases', body:'Briefing, faction management, regional operations, party politics, and consequences make one monthly round.', target:'phase-progress', placement:'bottom' },
  { id:'select-region', title:'Select a region', body:'Choose a strategic region to open its dossier and local connections.', target:'region-selector', placement:'bottom' },
  { id:'zoom-pan', title:'Read the operational map', body:'Zoom with these controls or the wheel. Drag the map precisely; focus never changes political outcomes.', target:'map-navigation', placement:'bottom' },
  { id:'map-mode', title:'Map modes and legend', body:'Every mode answers a different question. The legend reports the active scale and uncertainty.', target:'map-mode', placement:'bottom' },
  { id:'faction-management', title:'Open Organization', body:'Organization contains faction work, organizers, characters, and institutions.', target:'dock-organization', placement:'top' },
  { id:'assign-organizer', title:'Assign an organizer', body:'Select a region first, then assign an available organizer whose skills fit the work.', target:'organizer-assignment', placement:'top' },
  { id:'regional-operation', title:'Order regional work', body:'Operations show their costs, success chance, and detection chance before you commit.', target:'regional-operations', placement:'left' },
  { id:'exposure-security', title:'Exposure and security', body:'Exposure attracts surveillance. Security protects cells; neither guarantees safety.', target:'exposure-meter', placement:'bottom' },
  { id:'character-dossier', title:'Character dossiers', body:'Historical figures have offices, agendas, relationships, and red lines. They are not passive bonuses.', target:'characters-view', placement:'top' },
  { id:'institution', title:'Institutions act independently', body:'Inspect attitude, autonomy, pending business, and security penetration before approaching an institution.', target:'institutions-view', placement:'top' },
  { id:'policy', title:'Policy proposals', body:'A proposal shows its stage, support, opposition, and known effects before political work begins.', target:'laws-view', placement:'top' },
  { id:'political-actions', title:'Limited political actions', body:'Lobbying, proposals, and institutional approaches share a monthly political-action allowance.', target:'politics-view', placement:'top' },
  { id:'narrative-event', title:'Resolve the active dossier', body:'Disabled choices explain unmet requirements. Hidden consequences remain hidden.', target:'event-dossier', placement:'left' },
  { id:'advance-phase', title:'Advance deliberately', body:'When the current work is complete, advance to the next phase. The top tracker always shows where you are.', target:'advance-phase', placement:'bottom' },
  { id:'save-campaign', title:'Secure the record', body:'Manual saves and rotating autosaves are local. Ironman campaigns keep one protected slot.', target:'save-campaign', placement:'bottom' },
  { id:'complete-month', title:'Complete the first month', body:'Reach consequences and advance the month. Your tutorial progress and campaign state are persisted together.', target:'phase-progress', placement:'bottom' },
];

export interface HintDefinition {
  id: string;
  phase?: TurnPhase;
  title: string;
  body: string;
}

export const BEGINNER_HINTS: HintDefinition[] = [
  { id:'briefing-objectives', phase:'briefing', title:'Start with the warnings', body:'Read immediate objectives and emergency telegrams before spending actions.' },
  { id:'map-zoom', phase:'briefing', title:'Map detail changes with zoom', body:'National view shows only essential hubs. Focus a province to reveal local cities, branches, and sites.' },
  { id:'organizer-idle', phase:'faction_management', title:'Idle organizers can help', body:'Assign organizers deliberately; exposure, health, and skill change the risk of regional work.' },
  { id:'operation-odds', phase:'regional_operations', title:'Compare both chances', body:'Success and detection are separate rolls. A successful operation may still expose the network.' },
  { id:'political-limit', phase:'party_politics', title:'Political actions are shared', body:'Lobbying delegates, campaigning for laws, and approaching institutions use the same monthly allowance.' },
  { id:'disabled-events', title:'Locked choices explain why', body:'Focus or hover a disabled decision to read its unmet background, flag, or resource requirement.' },
  { id:'consequences-summary', phase:'consequences', title:'Review before advancing', body:'Consequences resolve operations and autonomous politics. The monthly report records what changed.' },
  { id:'save-rules', title:'Saves remain local', body:'Three autosaves rotate by month. Ironman uses one slot and disables duplicate/delete actions.' },
];

export function clampTutorialStep(step: number): number {
  return Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, Math.trunc(step)));
}

export function tutorialProgress(step: number): number {
  return Math.round(((clampTutorialStep(step) + 1) / TUTORIAL_STEPS.length) * 100);
}

export function isHintModeEligible(mode: BeginnerHintMode, campaignsStarted: number): boolean {
  return mode === 'every_campaign' || (mode === 'first_campaign' && campaignsStarted <= 1);
}

export function nextHintForCampaign(
  campaign: CampaignState,
  mode: BeginnerHintMode,
  campaignsStarted: number,
  hiddenHintIds: string[],
): HintDefinition | null {
  if (campaign.turnNumber !== 1 || !isHintModeEligible(mode, campaignsStarted)) return null;
  const unavailable = new Set([...campaign.dismissedHintIds, ...hiddenHintIds]);
  return BEGINNER_HINTS.find(hint => !unavailable.has(hint.id) && (!hint.phase || hint.phase === campaign.phase)) ?? null;
}

