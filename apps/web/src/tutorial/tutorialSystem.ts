import type { BeginnerHintMode, CampaignState, TurnPhase } from '@april-thesis/shared-types';

export type TutorialPlacement = 'top' | 'right' | 'bottom' | 'left' | 'center';

export interface TutorialStepDefinition {
  id: string;
  title: string;
  body: string;
  target: string;
  placement: TutorialPlacement;
  requiredMilestone?: string;
}

export const TUTORIAL_STEPS: TutorialStepDefinition[] = [
  { id:'identify-faction', title:'The current you lead', body:'You lead the Workers’ Opposition, a Bolshevik current rooted in unions and industrial labor—not a separate state or army.', target:'faction-identity', placement:'right' },
  { id:'organizer-role', title:'You are an organizer', body:'You are a faction organizer, not the ruler of Russia. Institutions and historical leaders keep their own authority and agendas.', target:'faction-identity', placement:'right' },
  { id:'identify-leaders', title:'Know the leadership', body:'Alexandra Kollontai, Alexander Shliapnikov, and Sergei Medvedev are the principal voices around whom this network coheres.', target:'faction-leaders', placement:'right' },
  { id:'faction-ban', title:'The ban changes everything', body:'The Tenth Congress has prohibited factions. Legal persuasion, quiet preservation, and clandestine work now carry different risks.', target:'faction-ban', placement:'right' },
  { id:'national-map', title:'Read the national atlas', body:'Use National atlas to recover the countrywide view. Political reach is organizational influence, never sovereignty.', target:'map-national', placement:'bottom' },
  { id:'select-province', title:'Select a historical province', body:'Choose Petrograd Governorate or another dated administrative unit. Province borders are separate from the 28 simulation aggregates.', target:'province-selector', placement:'bottom', requiredMilestone:'province-selected' },
  { id:'enter-province', title:'Enter the province dossier', body:'Open Province detail. This is a dedicated local atlas with its own boundary, sites, and administrative record—not a magnified national map.', target:'province-detail', placement:'bottom', requiredMilestone:'province-detail-entered' },
  { id:'inspect-city', title:'Inspect a local center', body:'Select a city or industrial site. Tooltips and the site ledger identify what the symbol means without letter markers.', target:'local-site', placement:'left', requiredMilestone:'local-site-inspected' },
  { id:'faction-management', title:'Open faction management', body:'Choose Organization, then Faction. This is where monthly internal work and the organizer roster live.', target:'dock-organization', placement:'top', requiredMilestone:'faction-management-opened' },
  { id:'assign-organizer', title:'Assign an organizer', body:'Assign one available organizer to the selected strategic aggregate. The tutorial begins in Faction Management so this is a real, costed action.', target:'organizer-assignment', placement:'top', requiredMilestone:'organizer-assigned' },
  { id:'regional-operation', title:'Choose regional work', body:'Use Next phase to enter Regional Operations, then commit one operation in the regional dossier.', target:'regional-operations', placement:'left', requiredMilestone:'operation-started' },
  { id:'operation-risk', title:'Read both risks', body:'Success chance estimates effectiveness; detection chance estimates the danger of discovery. An attractive operation can still be unsafe.', target:'risk-readout', placement:'left' },
  { id:'exposure-security', title:'Exposure and security', body:'Exposure attracts surveillance. Security protects cells and communications; neither value guarantees safety.', target:'exposure-meter', placement:'bottom' },
  { id:'character-dossier', title:'Open a character dossier', body:'Choose Characters, then open a historical figure. Offices, agendas, relationships, and red lines make people more than passive bonuses.', target:'characters-view', placement:'top', requiredMilestone:'character-opened' },
  { id:'institution', title:'Inspect an institution', body:'Choose Institutions and inspect attitude, autonomy, pending business, and security penetration.', target:'institutions-view', placement:'top', requiredMilestone:'institution-opened' },
  { id:'policy', title:'Review a policy', body:'Choose Politics, then Laws, and review a proposal’s stage, support, opposition, and known effects before political work begins.', target:'dock-politics', placement:'top', requiredMilestone:'policy-opened' },
  { id:'narrative-event', title:'Resolve a short decision', body:'Return to the active congress dossier and choose one available response. Disabled choices explain unmet requirements.', target:'event-dossier', placement:'left', requiredMilestone:'event-resolved' },
  { id:'advance-phases', title:'Advance through the round', body:'Use Next phase until the tracker reaches Consequences. Briefing, Faction Management, Regional Operations, Party Politics, and Consequences form one round.', target:'advance-phase', placement:'bottom', requiredMilestone:'reached-consequences' },
  { id:'review-consequences', title:'Review March consequences', body:'Read the consequence phase, active-operation record, and changed national metrics before closing the month.', target:'phase-progress', placement:'bottom' },
  { id:'save-campaign', title:'Create a manual save', body:'Use Save now. Tutorial progress, pause state, and campaign state are written together and tutorial saves carry a badge.', target:'save-campaign', placement:'bottom', requiredMilestone:'save-created' },
  { id:'complete-month', title:'Finish the monthly round', body:'Advance month, dismiss the March dispatch, then complete this step. The tutorial may continue as a normal campaign.', target:'phase-progress', placement:'bottom', requiredMilestone:'round-finished' },
];

export function canAdvanceTutorial(campaign: CampaignState, step: TutorialStepDefinition): boolean {
  return !step.requiredMilestone || campaign.tutorialMilestones.includes(step.requiredMilestone);
}

export interface HintDefinition {
  id: string;
  phase?: TurnPhase;
  title: string;
  body: string;
}

export const BEGINNER_HINTS: HintDefinition[] = [
  { id:'briefing-objectives', phase:'briefing', title:'Start with the warnings', body:'Read immediate objectives and emergency telegrams before spending actions.' },
  { id:'map-zoom', phase:'briefing', title:'Map detail changes with scale', body:'The national atlas uses dated administrative provinces. Open Province detail for a separate local site view.' },
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
