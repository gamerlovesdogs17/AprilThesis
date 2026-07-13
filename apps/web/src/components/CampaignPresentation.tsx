import { useState } from 'react';
import type { CampaignHistoryEntry, CampaignObjectLink, SituationBoardCategory } from '@april-thesis/shared-types';
import { formatGameDate } from '@april-thesis/shared-types';
import { useGameStore } from '../store/gameStore';
import styles from './CampaignPresentation.module.css';

const CATEGORY_LABELS:Record<SituationBoardCategory,string>={crisis:'Urgent crises',opportunity:'Political opportunities',movement:'Political movement'};
const HISTORY_ICONS:Record<string,string>={decision:'D',vote:'V',policy:'P',law:'L',security:'S',organizer:'O',strike:'!',famine:'F',character:'C',institution:'I',operation:'↗',press:'N'};

function followCampaignLink(link:CampaignObjectLink,onClose:()=>void){
  const state=useGameStore.getState();
  if(state.bottomWorkspaceCollapsed)state.toggleBottomWorkspace();
  if(link.kind==='province'){state.selectProvince(link.provinceId??link.id);}
  if(link.kind==='character'){state.selectCharacter(link.id);state.setBottomGroup('organization','characters');}
  if(link.kind==='institution'){state.setBottomGroup('organization','institutions');}
  if(link.kind==='event')state.triggerEvent(link.id);
  if(link.kind==='law'){state.setBottomGroup('politics','laws');}
  if(link.kind==='operation'){
    if(link.provinceId)state.selectProvince(link.provinceId);
    state.setBottomGroup('situation','regional');
  }
  if(link.kind==='newspaper')state.setBottomGroup('press','newspapers');
  onClose();
}

export function SituationBoardOverlay({open,onClose}:{open:boolean;onClose:()=>void}){
  const campaign=useGameStore(state=>state.campaign);
  const dismiss=useGameStore(state=>state.dismissSituationBoard);
  const pin=useGameStore(state=>state.pinSituationBoardItem);
  if(!open||!campaign)return null;
  const board=campaign.situationBoard;
  return <div className={styles.boardBackdrop} role="presentation">
    <section className={styles.situationBoard} role="dialog" aria-modal="true" aria-label={`Situation Board for ${formatGameDate(board.month)}`} data-testid="situation-board">
      <header><div><p>Monthly intelligence briefing</p><h2>Situation Board · {formatGameDate(board.month)}</h2></div><button aria-label="Close Situation Board" onClick={onClose}>×</button></header>
      <div className={styles.boardColumns}>{(['crisis','opportunity','movement'] as const).map(category=><section key={category} data-category={category}><h3>{CATEGORY_LABELS[category]}</h3>{board.items.filter(item=>item.category===category).map(item=><article key={item.id} className={board.pinnedItemId===item.id?styles.pinned:''}><button className={styles.itemLink} onClick={()=>followCampaignLink(item.link,onClose)}><strong>{item.title}</strong><span>{item.detail}</span><small>Open {item.link.kind}</small></button><button className={styles.pinButton} aria-pressed={board.pinnedItemId===item.id} onClick={()=>pin(board.pinnedItemId===item.id?null:item.id)}>{board.pinnedItemId===item.id?'Unpin':'Pin objective'}</button></article>)}</section>)}</div>
      <footer><span>Selected from live campaign values and recorded actions · no decorative alerts</span><button onClick={()=>{dismiss();onClose();}}>Dismiss for {formatGameDate(board.month)}</button></footer>
    </section>
  </div>;
}

function HistoryEntryButton({entry,onOpen}:{entry:CampaignHistoryEntry;onOpen:(entry:CampaignHistoryEntry)=>void}){
  return <button className={styles.historyEntry} data-category={entry.category} onClick={()=>onOpen(entry)}><i aria-hidden="true">{HISTORY_ICONS[entry.category]??'·'}</i><time>{formatGameDate(entry.date)}</time><strong>{entry.title}</strong><small>{entry.historicalClassification.replaceAll('_',' ')}</small></button>;
}

export function CampaignHistoryStrip({open,onClose}:{open:boolean;onClose:()=>void}){
  const campaign=useGameStore(state=>state.campaign);
  const [selected,setSelected]=useState<CampaignHistoryEntry|null>(null);
  if(!open||!campaign)return null;
  const entries=campaign.campaignHistory.entries.slice().reverse();
  return <section className={styles.historyStrip} role="dialog" aria-label="Campaign History" data-testid="campaign-history">
    <header><div><p>Compact campaign record</p><h2>Campaign History</h2></div><button aria-label="Close Campaign History" onClick={onClose}>×</button></header>
    <div className={styles.historyRail}>{entries.length?entries.map(entry=><HistoryEntryButton key={entry.id} entry={entry} onOpen={setSelected}/>):<p>No major campaign actions have been recorded yet.</p>}</div>
    {selected&&<div className={styles.historyDetail}><div><strong>{selected.title}</strong><span>{selected.knownConsequences.join(' · ')||'No known consequence recorded.'}</span></div><button onClick={()=>followCampaignLink(selected.link,onClose)}>Reopen related {selected.link.kind}</button></div>}
  </section>;
}
