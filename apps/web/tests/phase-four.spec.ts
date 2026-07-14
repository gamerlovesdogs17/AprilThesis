import { expect, test, type Page } from '@playwright/test';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function startCampaign(page:Page,tutorial=false,hints=false){
  await page.addInitScript((showHints)=>localStorage.setItem('april-thesis-preferences',JSON.stringify({introViewed:true,muted:true,reducedMotion:true,beginnerHintMode:showHints?'first_campaign':'off',campaignsStarted:0,interfaceDetail:'expert'})),hints);
  await page.goto('/');
  if(tutorial){await page.getByRole('button',{name:/GUIDED TUTORIAL/}).click();return;}
  await page.getByRole('button',{name:'New Campaign'}).click();
  if(!tutorial){const guidedOpening=page.getByLabel('Guided opening');await guidedOpening.uncheck();await expect(guidedOpening).not.toBeChecked();}
  const launch=page.getByRole('button',{name:'Open your faction dossier'});await launch.click();
  if(!(await page.getByTestId('geographic-map').isVisible())&&await launch.isVisible())await launch.click();
  await expect(page.getByTestId('geographic-map')).toBeVisible();
  const boardClose=page.getByRole('button',{name:'Close Situation Board'});if(await boardClose.count())await boardClose.click();
}

async function resolveOpening(page:Page){
  for(const choice of [/Remain silent on Kronstadt/,/Lobby delegates quietly/,/Accept the resolution publicly/,/Publicly comply while continuing informally/,/Trade-Union Mobilization/])await page.getByRole('button',{name:choice}).click();
}

async function openDock(page:Page,group:string,tab:string){await page.getByRole('button',{name:group,exact:true}).click();await page.getByRole('button',{name:tab,exact:true}).click();}

test('guided tutorial starts the fixed scenario and gates its province interaction',async({page})=>{
  await startCampaign(page,true);
  await expect(page.getByRole('dialog',{name:'Tutorial step 1 of 21'})).toBeVisible();
  await expect(page.getByText('Trade Union Organizer',{exact:true})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>{const campaign=JSON.parse(localStorage.getItem('april-thesis-active-session-v7')??'{}').campaign;return {date:campaign?.currentDate,phase:campaign?.phase,seed:campaign?.settings?.seed,mode:campaign?.settings?.tutorialMode,ironman:campaign?.settings?.ironman};})).toEqual({date:'1921-03',phase:'faction_management',seed:'april-thesis-guided-tutorial-march-1921-v1',mode:'guided_tutorial',ironman:false});
  for(let step=1;step<6;step+=1)await page.getByRole('button',{name:'Next',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Tutorial step 6 of 21'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Next',exact:true})).toBeDisabled();
  await page.getByLabel('Select historical province').selectOption('petrograd-governorate');
  await expect(page.getByRole('button',{name:'Next',exact:true})).toBeEnabled();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('april-thesis-active-session-v7')??'{}').campaign?.tutorialMilestones)).toContain('province-selected');
});

test('skip, close, resume, and restart tutorial remain distinct actions',async({page})=>{
  await startCampaign(page,true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:/Resume tutorial at step 1/})).toBeVisible();
  await page.getByRole('button',{name:/Resume tutorial at step 1/}).click();
  await page.getByRole('button',{name:'Skip tutorial'}).click();
  await expect(page.getByRole('dialog',{name:/Tutorial step/})).toHaveCount(0);
  await page.getByRole('button',{name:'Settings'}).click();
  await page.getByRole('button',{name:'Restart tutorial'}).click();
  await expect(page.getByRole('dialog',{name:'Tutorial step 1 of 21'})).toBeVisible();
});

test('tutorial progress survives reload and restores its target',async({page})=>{
  await startCampaign(page,true);
  for(let i=0;i<4;i+=1)await page.getByRole('button',{name:'Next',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Tutorial step 5 of 21'})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('dialog',{name:'Tutorial step 5 of 21'})).toBeVisible();
  await expect(page.locator('.tutorial-target')).toHaveCount(1);
});

test('permanently dismissed beginner hints stay hidden',async({page})=>{
  await startCampaign(page,false,true);
  const hint=page.getByTestId('beginner-hint');await expect(hint).toBeVisible();
  await hint.getByLabel('Do not show this again.').check();await hint.getByRole('button',{name:'Dismiss'}).click();
  await expect(hint).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('april-thesis-preferences')??'{}').hiddenHintIds?.length)).toBeGreaterThan(0);
});

test('settings overlay returns to the exact map and workspace state',async({page})=>{
  await startCampaign(page,false);await resolveOpening(page);
  await page.getByLabel('Select historical province').selectOption('petrograd-governorate');await page.getByLabel('Map mode').selectOption('food_supply');await page.getByTestId('zoom-in').click();
  await openDock(page,'Organization','Characters');const zoomBefore=await page.getByLabel('Map zoom').textContent();
  await page.getByRole('button',{name:'Settings'}).click();await expect(page.getByText('Campaign paused · no state discarded')).toBeVisible();
  await page.getByRole('button',{name:/Return to campaign/}).click();
  await expect(page.getByLabel('Map zoom')).toHaveText(zoomBefore??'');await expect(page.getByLabel('Map mode')).toHaveValue('food_supply');await expect(page.getByRole('button',{name:'Characters',exact:true})).toHaveClass(/activeTab/);
});

test('browser Back closes an auxiliary overlay before leaving the campaign',async({page})=>{
  await startCampaign(page,false);await page.getByRole('button',{name:'Settings'}).click();await expect(page.getByRole('heading',{name:'Settings'})).toBeVisible();
  await page.goBack();await expect(page.getByRole('heading',{name:'Settings'})).toHaveCount(0);await expect(page.getByTestId('geographic-map')).toBeVisible();
});

test('grouped command dock fits, supports keyboard movement, and collapses',async({page})=>{
  await startCampaign(page,false);
  const nav=page.getByRole('navigation',{name:'Campaign command groups'});expect(await nav.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
  await page.getByRole('button',{name:'Situation',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('button',{name:'Organization',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByTestId('toggle-command-dock').click();await expect(page.getByRole('button',{name:'Expand workspace'})).toBeVisible();await page.keyboard.press('Alt+b');await expect(page.getByRole('button',{name:'Collapse workspace'})).toBeVisible();
});

test('event dossier is compact, expandable, minimizable, and hides sources by default',async({page})=>{
  await startCampaign(page,false);const dossier=page.getByTestId('event-dossier');await expect(dossier).toBeVisible();await expect(dossier).not.toContainText('Sources:');
  await page.getByRole('button',{name:'Expand decision dossier'}).click();await expect(dossier).toContainText('Known context');await expect(dossier).not.toContainText('Sources:');
  await page.getByRole('button',{name:'Minimize active decision'}).click();await expect(page.getByTestId('event-minimized')).toBeVisible();await expect(page.getByTestId('geographic-map')).toBeVisible();
  await page.getByTestId('event-minimized').click();await expect(dossier).toBeVisible();
});

test('research mode alone exposes raw archive identifiers',async({page})=>{
  await startCampaign(page,false);await page.getByRole('button',{name:'Settings'}).click();await page.getByLabel('Research mode').check();await page.getByRole('button',{name:/Return to campaign/}).click();
  await page.getByRole('button',{name:'Expand decision dossier'}).click();await page.getByText('Research notes').click();await expect(page.getByTestId('event-dossier')).toContainText('Sources:');
});

test('national labels stay restrained while province view reveals local detail',async({page})=>{
  await startCampaign(page,false);await resolveOpening(page);
  const fittedZoom=await page.getByLabel('Map zoom').textContent();
  const national=await page.locator('[data-city-id][data-label-visible="true"]').count();expect(national).toBeGreaterThanOrEqual(8);expect(national).toBeLessThanOrEqual(12);
  await page.getByLabel('Select historical province').selectOption('petrograd-governorate');await page.getByTestId('enter-province').click();
  await expect(page.getByTestId('province-detail-view')).toBeVisible();await expect(page.getByRole('img',{name:'Geographic province atlas of Petrograd Governorate'})).toBeVisible();await page.getByTestId('reset-map').click();await expect(page.getByLabel('Map zoom')).toHaveText(fittedZoom??'');
});

test('all-label preference is opt-in and collision suppression remains the default',async({page})=>{
  await startCampaign(page,false);const before=await page.locator('[data-city-id]').count();
  await page.getByRole('button',{name:'Settings'}).click();await page.getByLabel('Show all city labels').check();await page.getByRole('button',{name:/Return to campaign/}).click();
  await expect(page.locator('[data-city-id]')).toHaveCount(36);expect(before).toBeLessThan(36);
});

test('selecting, focusing, and dragging do not create text selection or accidental region changes',async({page})=>{
  await startCampaign(page,false);await resolveOpening(page);await page.getByLabel('Select historical province').selectOption('moscow-governorate');
  const map=page.getByTestId('geographic-map');const box=await map.boundingBox();expect(box).not.toBeNull();
  await page.mouse.move(box!.x+box!.width*.45,box!.y+box!.height*.45);await page.mouse.down();await page.mouse.move(box!.x+box!.width*.7,box!.y+box!.height*.6,{steps:6});await page.mouse.up();
  await expect(page.getByRole('heading',{name:'Moscow'})).toBeVisible();expect(await page.evaluate(()=>getSelection()?.toString()??'')).toBe('');
});

test('historical portrait or explicit fallback renders for every major character',async({page})=>{
  await startCampaign(page,false);await openDock(page,'Organization','Characters');
  await expect(page.locator('img[class*="characterPortraitImage"]')).toHaveCount(13);await expect(page.locator('[role="img"][aria-label^="Designed portrait fallback"]')).toHaveCount(2);
  await page.getByText('Vladimir Lenin',{exact:true}).click();await expect(page.getByTestId('character-dossier').getByAltText('Historical portrait of Vladimir Lenin')).toBeVisible();
});

test('canonical asset manifest includes sustained music and every portrait',async({request})=>{
  const manifest=await (await request.get('/assets/assets-manifest.json')).json() as {canonical:boolean;assets:Array<{kind:string;localPath:string}>};
  expect(manifest.canonical).toBe(true);expect(manifest.assets.filter(asset=>asset.kind==='music')).toHaveLength(7);expect(manifest.assets.filter(asset=>asset.kind==='historical-portrait')).toHaveLength(13);
  await expect(access(resolve('../../public/assets/assets-manifest.json'))).rejects.toThrow();
  const sources=JSON.parse(await readFile(resolve('public/assets/portraits/sources.json'),'utf8')) as {items:unknown[];fallbacks:unknown[]};expect(sources.items).toHaveLength(13);expect(sources.fallbacks).toHaveLength(2);
});

test('intro core scenes stay inside required desktop and mobile viewports',async({page})=>{
  for(const viewport of [{width:1440,height:900},{width:1280,height:720},{width:1024,height:768},{width:390,height:844}]){
    await page.setViewportSize(viewport);await page.goto('/?introScene=opposition');const heading=page.getByRole('heading',{name:/YOU LEAD THE/});await expect(heading).toBeVisible();const box=await heading.boundingBox();expect(box).not.toBeNull();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(viewport.width);expect(box!.y+box!.height).toBeLessThanOrEqual(viewport.height);
  }
});
