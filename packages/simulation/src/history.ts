import type { CampaignHistorySnapshot, CampaignState } from '@april-thesis/shared-types';

export function captureCampaignSnapshot(campaign: CampaignState): CampaignHistorySnapshot {
  const regionHighlights = Object.values(campaign.regions)
    .slice()
    .sort((a, b) => (b.famineSeverity + b.publicUnrest) - (a.famineSeverity + a.publicUnrest))
    .slice(0, 5)
    .map(region => ({
      regionId: region.id,
      foodSupply: region.foodSupply,
      unrest: region.publicUnrest,
      influence: region.influence.workersOpposition,
    }));
  return {
    date: campaign.currentDate,
    industrialProduction: campaign.nationalStats.industrialProduction,
    foodSupply: campaign.nationalStats.urbanFoodSupply,
    famineSeverity: campaign.nationalStats.famineSeverity,
    regimeStability: campaign.nationalStats.regimeStability,
    partyUnity: campaign.nationalStats.partyUnity,
    workerSupport: campaign.resources.workerSupport,
    partyLegitimacy: campaign.resources.partyLegitimacy,
    revolutionaryCredibility: campaign.resources.revolutionaryCredibility,
    publicLegitimacy: campaign.resources.publicLegitimacy,
    exposure: campaign.resources.exposure,
    security: campaign.resources.security,
    regionHighlights,
  };
}

export function appendCampaignSnapshot(campaign: CampaignState): CampaignState {
  const next = structuredClone(campaign);
  const snapshot = captureCampaignSnapshot(next);
  const existing = next.historySnapshots ?? [];
  next.historySnapshots = [...existing.filter(item => item.date !== snapshot.date), snapshot].slice(-24);
  return next;
}

export function deriveNationalChartSeries(history: CampaignHistorySnapshot[]) {
  return history.map(snapshot => ({
    date: snapshot.date,
    industrialProduction: snapshot.industrialProduction,
    foodSupply: snapshot.foodSupply,
    famineSeverity: snapshot.famineSeverity,
    regimeStability: snapshot.regimeStability,
  }));
}
