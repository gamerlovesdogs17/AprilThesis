import type {
  CampaignHistoryEntry,
  CampaignHistoryState,
  CampaignObjectLink,
  CampaignState,
  SituationBoardItem,
  SituationBoardState,
} from '@april-thesis/shared-types';

export const REGION_PROVINCE_LINKS:Record<string,string>={
  armenia:'armenian-ssr',azerbaijan:'azerbaijan-ssr',baltic_frontier:'estonia-republic',belarus:'smolensk-governorate',
  central_industrial:'cherepovets-governorate',central_siberia:'yeniseisk-governorate',central_ukraine:'kiev-governorate',
  crimea:'crimean-revcom',don_basin:'don-oblast',donbas:'donetsk-governorate',far_east:'transbaikal-oblast-fer',
  georgia:'georgian-ssr',karelia:'karelian-labour-commune',kazakhstan:'orenburg-governorate',kuban:'kuban-black-sea-oblast',
  lower_volga:'tsaritsyn-governorate',middle_volga:'penza-governorate',moscow:'moscow-governorate',
  northern_caucasus:'stavropol-governorate',northern_russia:'arkhangelsk-governorate',petrograd:'petrograd-governorate',
  tambov:'tambov-governorate',tula:'kaluga-governorate',turkestan:'transcaspian-oblast',
  upper_volga:'nizhny-novgorod-governorate',urals:'perm-governorate',western_siberia:'tyumen-governorate',
  western_ukraine:'volhynia-governorate',
};

function humanize(value:string){return value.replaceAll('_',' ').replaceAll('-',' ').replace(/\b\w/g,letter=>letter.toUpperCase());}

function provinceLink(regionId:string):CampaignObjectLink{
  return {kind:'province',id:REGION_PROVINCE_LINKS[regionId]??'moscow-governorate',provinceId:REGION_PROVINCE_LINKS[regionId]??'moscow-governorate',regionId};
}

function boardItem(category:SituationBoardItem['category'],priority:number,title:string,detail:string,link:CampaignObjectLink,index:number):SituationBoardItem{
  return {id:`board-${category}-${link.kind}-${link.id}-${index}`,category,priority,title,detail,link};
}

/** Selects briefing items only from live campaign values and recorded actions. */
export function buildSituationBoard(campaign:CampaignState,previous?:CampaignState):SituationBoardState{
  const regions=Object.values(campaign.regions);
  const famine=regions.slice().sort((a,b)=>b.famineSeverity-a.famineSeverity)[0];
  const strikes=regions.slice().sort((a,b)=>b.strikeActivity-a.strikeActivity)[0];
  const security=regions.slice().sort((a,b)=>b.chekaPresence-a.chekaPresence)[0];
  const unionOpportunity=regions.slice().sort((a,b)=>(b.tradeUnionOrganization+b.workerSupport)-(a.tradeUnionOrganization+a.workerSupport))[0];
  const infrastructureOpportunity=regions.slice().sort((a,b)=>(b.railwayAccess+b.infrastructure)-(a.railwayAccess+a.infrastructure))[0];
  const bestCharacter=Object.values(campaign.characters).filter(character=>character.availability==='active').sort((a,b)=>(b.trust+b.respect)-(a.trust+a.respect))[0];
  const bestInstitution=Object.values(campaign.institutions).sort((a,b)=>(b.attitude+b.playerContacts)-(a.attitude+a.playerContacts))[0];
  const crises=[
    boardItem('crisis',famine.famineSeverity,`Food emergency in ${humanize(famine.id)}`,`Famine severity ${Math.round(famine.famineSeverity)}; food supply ${Math.round(famine.foodSupply)}.`,provinceLink(famine.id),0),
    boardItem('crisis',strikes.strikeActivity,`Strike escalation in ${humanize(strikes.id)}`,`Strike activity ${Math.round(strikes.strikeActivity)}; public unrest ${Math.round(strikes.publicUnrest)}.`,provinceLink(strikes.id),1),
    boardItem('crisis',security.chekaPresence,`Security pressure in ${humanize(security.id)}`,`Security presence ${Math.round(security.chekaPresence)}; intelligence confidence ${Math.round(security.intelligenceReliability)}.`,provinceLink(security.id),2),
  ].sort((a,b)=>b.priority-a.priority).slice(0,3);
  const opportunities=[
    boardItem('opportunity',unionOpportunity.tradeUnionOrganization,`Union opening in ${humanize(unionOpportunity.id)}`,`Union organization ${Math.round(unionOpportunity.tradeUnionOrganization)} and worker support ${Math.round(unionOpportunity.workerSupport)} create a usable base.`,provinceLink(unionOpportunity.id),0),
    boardItem('opportunity',bestCharacter.trust,`${humanize(bestCharacter.id)} may be approachable`,`Trust ${Math.round(bestCharacter.trust)}; respect ${Math.round(bestCharacter.respect)}; current agenda: ${bestCharacter.currentAgenda}.`,{kind:'character',id:bestCharacter.id},1),
    bestInstitution
      ? boardItem('opportunity',bestInstitution.attitude,`${humanize(bestInstitution.id)} offers an institutional route`,`Attitude ${Math.round(bestInstitution.attitude)}; player contacts ${Math.round(bestInstitution.playerContacts)}; ${bestInstitution.activeAgenda}.`,{kind:'institution',id:bestInstitution.id},2)
      : boardItem('opportunity',infrastructureOpportunity.infrastructure,`Transport opening in ${humanize(infrastructureOpportunity.id)}`,`Rail access ${Math.round(infrastructureOpportunity.railwayAccess)}; infrastructure ${Math.round(infrastructureOpportunity.infrastructure)}.`,provinceLink(infrastructureOpportunity.id),2),
  ].sort((a,b)=>b.priority-a.priority).slice(0,3);

  const previousRegions=previous?.regions;
  const changedRegion=regions.map(region=>{
    const old=previousRegions?.[region.id];
    const change=old?Math.abs(region.foodSupply-old.foodSupply)+Math.abs(region.publicUnrest-old.publicUnrest)+Math.abs(region.influence.workersOpposition-old.influence.workersOpposition):0;
    return {region,change};
  }).sort((a,b)=>b.change-a.change)[0];
  const activeCharacter=Object.values(campaign.characters).find(character=>character.lastAction!=='No autonomous action recorded.')??bestCharacter;
  const activeInstitution=Object.values(campaign.institutions).find(institution=>institution.lastAction!=='No institutional approach recorded.')??bestInstitution;
  const vote=campaign.voteState;
  const proposal=vote?campaign.policyProposals[vote.proposalId]:Object.values(campaign.policyProposals).find(item=>item.stage!=='available');
  const movements:SituationBoardItem[]=[
    boardItem('movement',80,`${humanize(activeCharacter.id)}: ${activeCharacter.lastAction}`,activeCharacter.currentAgenda,{kind:'character',id:activeCharacter.id},0),
    boardItem('movement',76,`${humanize(activeInstitution.id)}: ${activeInstitution.lastAction}`,activeInstitution.activeAgenda,{kind:'institution',id:activeInstitution.id},1),
    boardItem('movement',72,`${humanize(changedRegion.region.id)} moved most`,`Food ${Math.round(changedRegion.region.foodSupply)}; unrest ${Math.round(changedRegion.region.publicUnrest)}; Workers’ Opposition influence ${Math.round(changedRegion.region.influence.workersOpposition)}.`,provinceLink(changedRegion.region.id),2),
  ];
  if(proposal)movements.push(boardItem('movement',70,proposal.title,`${humanize(proposal.stage)} · support ${Math.round(proposal.support)} / opposition ${Math.round(proposal.opposition)}.`,{kind:'law',id:proposal.lawId},3));
  else if(campaign.currentEventId)movements.push(boardItem('movement',70,`Pending event: ${humanize(campaign.currentEventId)}`,'An unresolved campaign event requires attention.',{kind:'event',id:campaign.currentEventId},3));

  return {schemaVersion:1,month:campaign.currentDate,generatedTurn:campaign.turnNumber,dismissed:false,items:[...crises,...opportunities,...movements]};
}

export function emptyCampaignHistory():CampaignHistoryState{return {schemaVersion:1,entries:[]};}

export function appendCampaignHistoryEntry(campaign:CampaignState,entry:CampaignHistoryEntry):CampaignState{
  if(campaign.campaignHistory.entries.some(existing=>existing.id===entry.id))return campaign;
  const next=structuredClone(campaign);
  next.campaignHistory.entries=[...next.campaignHistory.entries,entry].slice(-120);
  return next;
}

export function historyEntry(input:Omit<CampaignHistoryEntry,'id'>&{idSuffix:string}):CampaignHistoryEntry{
  const {idSuffix,...entry}=input;
  return {...entry,id:`history-${entry.date}-${entry.category}-${idSuffix}`};
}

/** Derive compact month-boundary references; never stores campaign snapshots. */
export function appendMonthlyCampaignHistory(previous:CampaignState,nextState:CampaignState,completedOperationIds:string[]):CampaignState{
  let next=nextState;
  for(const operationId of completedOperationIds){
    const operation=previous.activeOperations.find(item=>item.id===operationId);
    if(!operation)continue;
    const provinceId=REGION_PROVINCE_LINKS[operation.regionId];
    next=appendCampaignHistoryEntry(next,historyEntry({idSuffix:operation.id,date:next.currentDate,icon:'operation',title:`${humanize(operation.operationId)} completed`,category:'operation',link:{kind:'operation',id:operation.operationId,provinceId,regionId:operation.regionId},relatedObjectIds:[operation.id,operation.operationId,operation.regionId],knownConsequences:next.operationHistory.slice(-1),historicalClassification:'counterfactual'}));
  }
  for(const [characterId,character] of Object.entries(next.characters)){
    const old=previous.characters[characterId];
    if(!old||old.availability===character.availability&&old.lastAction===character.lastAction)continue;
    next=appendCampaignHistoryEntry(next,historyEntry({idSuffix:`character-${characterId}-${next.turnNumber}`,date:next.currentDate,icon:'character',title:`${humanize(characterId)}: ${character.lastAction}`,category:'character',link:{kind:'character',id:characterId},relatedObjectIds:[characterId],knownConsequences:[`Availability: ${humanize(character.availability)}`],historicalClassification:'counterfactual'}));
  }
  for(const [institutionId,institution] of Object.entries(next.institutions)){
    const old=previous.institutions[institutionId];
    if(!old||old.lastAction===institution.lastAction)continue;
    next=appendCampaignHistoryEntry(next,historyEntry({idSuffix:`institution-${institutionId}-${next.turnNumber}`,date:next.currentDate,icon:'institution',title:institution.lastAction,category:'institution',link:{kind:'institution',id:institutionId},relatedObjectIds:[institutionId],knownConsequences:[`Attitude ${Math.round(institution.attitude)}; contacts ${Math.round(institution.playerContacts)}.`],historicalClassification:'counterfactual'}));
  }
  for(const [lawId,level] of Object.entries(next.laws))if(previous.laws[lawId]!==level){
    next=appendCampaignHistoryEntry(next,historyEntry({idSuffix:`law-${lawId}-${level}`,date:next.currentDate,icon:'law',title:`${humanize(lawId)} changed to level ${level}`,category:'law',link:{kind:'law',id:lawId},relatedObjectIds:[lawId],knownConsequences:[`Previous level ${previous.laws[lawId]}; current level ${level}.`],historicalClassification:'counterfactual'}));
  }
  const changedRegions=Object.values(next.regions).map(region=>{const old=previous.regions[region.id];return {region,old,change:old?Math.abs(region.famineSeverity-old.famineSeverity)+Math.abs(region.strikeActivity-old.strikeActivity)+Math.abs(region.publicUnrest-old.publicUnrest):0};}).sort((a,b)=>b.change-a.change);
  const changed=changedRegions[0];
  if(changed&&changed.change>0){
    const category=changed.region.famineSeverity>=changed.region.strikeActivity?'famine':'strike';
    next=appendCampaignHistoryEntry(next,historyEntry({idSuffix:`region-${changed.region.id}-${next.turnNumber}`,date:next.currentDate,icon:category,title:`${humanize(changed.region.id)} conditions shifted`,category,link:provinceLink(changed.region.id),relatedObjectIds:[changed.region.id,REGION_PROVINCE_LINKS[changed.region.id]],knownConsequences:[`Famine ${Math.round(changed.region.famineSeverity)}; strike activity ${Math.round(changed.region.strikeActivity)}; unrest ${Math.round(changed.region.publicUnrest)}.`],historicalClassification:'historically_plausible'}));
  }
  return next;
}
