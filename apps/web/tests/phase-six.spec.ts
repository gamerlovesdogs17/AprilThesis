import { expect, test, type Page } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function launchCampaign(page:Page){
  await page.addInitScript(()=>localStorage.setItem('april-thesis-preferences',JSON.stringify({introViewed:true,muted:true,reducedMotion:true,beginnerHintMode:'off',situationBoardEnabled:true})));
  await page.goto('/');
  await page.getByRole('button',{name:'New Campaign'}).click();
  await page.getByLabel('Guided opening').uncheck();
  const launch=page.getByRole('button',{name:'Open your faction dossier'});await launch.click();
  if(!(await page.getByTestId('geographic-map').isVisible())&&await launch.isVisible())await launch.click();
  await expect(page.getByTestId('geographic-map')).toBeVisible();
  const close=page.getByRole('button',{name:'Close Situation Board'});if(await close.count())await close.click();
}

async function choose(page:Page,name:RegExp){
  await page.getByRole('button',{name}).click();
  const back=page.getByRole('button',{name:'Return to map'});if(await back.count()&&await back.isVisible())await back.click();
}

async function resolveOpening(page:Page){
  for(const name of [/Remain silent on Kronstadt/,/Lobby delegates quietly/,/Accept the resolution publicly/,/Publicly comply while continuing informally/,/Trade-Union Mobilization/])await choose(page,name);
}

async function resolveVisibleDecisions(page:Page){
  for(let attempt=0;attempt<4;attempt+=1){
    const minimized=page.getByTestId('event-minimized');
    if(await minimized.count()&&await minimized.isVisible())await minimized.click();
    const dossier=page.getByTestId('event-dossier');
    if(!(await dossier.count())||!(await dossier.isVisible()))break;
    const choice=dossier.locator('header ~ div > button:enabled').first();
    if(!(await choice.count()))break;
    await choice.click();
  }
}

async function selectProvince(page:Page,id:string){
  await page.getByLabel('Select historical province').selectOption(id);
  await page.getByTestId('enter-province').click();
  await expect(page.getByTestId('province-detail-view')).toHaveAttribute('data-province-id',id);
}

test('Phase Six national GIS surfaces and derived boundaries behave independently',async({page})=>{
  await launchCampaign(page);await resolveOpening(page);
  const provinces=page.getByTestId('province-surface-layer').locator('path[data-province-id]');
  await expect(provinces).toHaveCount(93);
  const shapes=await provinces.evaluateAll(paths=>paths.map(path=>path.getAttribute('d')??''));
  expect(shapes.every(path=>(path.match(/[ML]/g)?.length??0)>4)).toBe(true);
  expect(await page.locator('[id^="aggregate-clip-"]').count()).toBe(0);

  await page.getByTestId('toggle-province-borders').uncheck();
  await expect(page.getByTestId('province-boundary-layer')).toHaveClass(/noBorders/);
  await page.getByTestId('toggle-formal-boundaries').click();
  await expect(page.getByTestId('toggle-formal-boundaries')).toHaveAttribute('aria-pressed','false');
  await expect(page.getByTestId('formal-boundary-layer')).toHaveCount(0);
  await page.getByTestId('toggle-formal-boundaries').click();
  await expect(page.getByTestId('formal-boundary-layer').locator('path')).toHaveCount(14);
  await page.getByTestId('toggle-strategic-aggregates').click();
  await expect(page.getByTestId('strategic-aggregate-layer').locator('path')).toHaveCount(28);
  expect(await page.getByTestId('strategic-aggregate-layer').locator('title').allTextContents()).toEqual(expect.arrayContaining([expect.stringMatching(/generated province dissolve/)]));
});

test('province atlases use assigned cities, real districts, and clipped transport',async({page})=>{
  await launchCampaign(page);await resolveOpening(page);
  await selectProvince(page,'moscow-governorate');
  await expect(page.getByTestId('local-district-layer').locator('path')).toHaveCount(13);
  await expect(page.getByTestId('local-railway-layer').locator('path')).toHaveCount(4);
  expect(await page.getByTestId('local-river-layer').locator('title').allTextContents()).toContain('Moskva River');
  await expect(page.getByTestId('local-city-layer').locator('[data-city-id]')).toHaveCount(1);
  await expect(page.getByTestId('local-city-layer').locator('[data-city-id="moscow-city"]')).toHaveCount(1);

  await page.getByTestId('reset-map').click();await page.getByLabel('Select historical province').selectOption('petrograd-governorate');await page.getByTestId('enter-province').click();
  await expect(page.getByTestId('province-detail-view')).toHaveAttribute('data-province-id','petrograd-governorate');
  await page.getByTestId('reset-map').click();await page.getByLabel('Select historical province').selectOption('omsk-governorate');await page.getByTestId('enter-province').click();
  await expect(page.getByTestId('province-detail-view')).toHaveAttribute('data-province-id','omsk-governorate');
});

test('all theaters retain one map and national labels remain restrained',async({page})=>{
  await launchCampaign(page);await resolveOpening(page);
  for(const theater of ['Western Russia','Ukraine and Donbas','Volga and Urals','Caucasus','Central Asia','Siberia','Far East']){
    await page.getByRole('button',{name:theater,exact:true}).click();
    await expect(page.getByLabel('Map zoom')).not.toHaveText('100%');
    await expect(page.getByLabel('National overview indicator')).toBeVisible();
  }
  await page.getByRole('button',{name:'Return to Full Map'}).click();
  const visibleLabels=page.locator('[data-city-id][data-label-visible="true"] text');
  expect(await visibleLabels.count()).toBeLessThanOrEqual(10);
  const boxes=await visibleLabels.evaluateAll(nodes=>nodes.map(node=>{const box=(node as SVGGraphicsElement).getBBox();return{x:box.x,y:box.y,w:box.width,h:box.height};}));
  const overlaps=boxes.flatMap((a,i)=>boxes.slice(i+1).filter(b=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y));
  expect(overlaps.length).toBeLessThanOrEqual(1);
});

test('influence, Situation Board links, and Campaign History links are live',async({page})=>{
  await launchCampaign(page);await resolveOpening(page);
  await expect(page.getByTestId('influence-layer').locator('path')).not.toHaveCount(0);
  await page.getByTestId('toggle-influence').uncheck();await expect(page.getByTestId('influence-layer')).toHaveCount(0);
  await page.getByTestId('toggle-influence').check();

  await page.getByRole('button',{name:'Situation Board'}).click();
  await expect(page.getByTestId('situation-board')).toBeVisible();
  await page.getByRole('button',{name:/Food emergency in Middle Volga/}).click();
  await expect(page.getByLabel('Select historical province')).toHaveValue('penza-governorate');

  await page.getByRole('button',{name:'Campaign History'}).click();
  await expect(page.getByTestId('campaign-history')).toBeVisible();
  const entry=page.getByTestId('campaign-history').locator('button[data-category]').first();await entry.click();
  const reopen=page.getByRole('button',{name:/Reopen related/});await expect(reopen).toBeVisible();await reopen.click();
  await expect(page.getByTestId('campaign-history')).toHaveCount(0);
});

test('Phase Five save imports with additive presentation migration',async({page})=>{
  await launchCampaign(page);await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.getByRole('button',{name:'Saves',exact:true}).click();await page.getByRole('button',{name:'Save management',exact:true}).click();
  const manual=page.getByRole('button',{name:/Manual .* March 1921/}).first();const download=page.waitForEvent('download');await manual.locator('..').getByRole('button',{name:'Export'}).click();
  const path=await (await download).path();expect(path).not.toBeNull();const legacy=JSON.parse(await readFile(path!,'utf8'));legacy.saveVersion=5;delete legacy.campaign.situationBoard;delete legacy.campaign.campaignHistory;delete legacy.checksum;
  await page.getByLabel('Import save file').setInputFiles({name:'phase-five-save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});
  await expect(page.getByRole('alert')).toContainText('Imported phase-five-save.json');
  await page.getByRole('button',{name:/Manual .* March 1921/}).last().click();
  await page.getByRole('button',{name:'Situation Board'}).click();await expect(page.getByTestId('situation-board')).toBeVisible();
});

test('captures the Phase Six cartographic and presentation review matrix',async({page})=>{
  const output=resolve('../../docs/review-screenshots/phase-six-after');await mkdir(output,{recursive:true});
  await page.emulateMedia({reducedMotion:'reduce'});
  const capture=async(name:string)=>{
    await page.waitForTimeout(250);
    await page.evaluate(()=>new Promise<void>(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>done()))));
    await page.screenshot({animations:'disabled'});
    await page.waitForTimeout(100);
    await page.screenshot({path:resolve(output,name),animations:'disabled'});
  };
  await launchCampaign(page);await resolveOpening(page);
  await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
  await capture('full-historical-national-map.png');

  for(const [theater,file] of [
    ['Western Russia','western-russia-theater.png'],['Ukraine and Donbas','ukraine-donbas-theater.png'],['Volga and Urals','volga-urals-theater.png'],
    ['Caucasus','caucasus-theater.png'],['Central Asia','central-asia-theater.png'],['Siberia','siberia-theater.png'],['Far East','far-east-theater.png'],
  ] as const){await page.getByRole('button',{name:theater,exact:true}).click();await capture(file);}
  await page.getByRole('button',{name:'Return to Full Map'}).click();

  await page.getByLabel('Map mode').selectOption('formal_administration');await capture('formal-government-view.png');
  await page.getByLabel('Map appearance preset').selectOption('historical_atlas');await capture('province-border-view.png');
  await page.getByTestId('toggle-strategic-aggregates').click();await capture('strategic-region-overlay.png');await page.getByTestId('toggle-strategic-aggregates').click();
  await page.getByLabel('Map appearance preset').selectOption('political_intelligence');await capture('political-influence-contours.png');

  for(const [province,file] of [
    ['moscow-governorate','moscow-province-detail.png'],['petrograd-governorate','petrograd-province-detail.png'],['kiev-governorate','kiev-province-detail.png'],
    ['tambov-governorate','tambov-province-detail.png'],['omsk-governorate','siberian-province-detail.png'],
  ] as const){await page.getByLabel('Select historical province').selectOption(province);await page.getByTestId('enter-province').click();await capture(file);await page.getByTestId('reset-map').click();}

  await page.getByRole('button',{name:'Settings'}).click();await page.getByLabel('Show all city labels').check();await page.getByRole('button',{name:/Return to campaign/}).click();
  await page.getByRole('button',{name:'Western Russia',exact:true}).click();await capture('city-collision-stress-view.png');await page.getByRole('button',{name:'Return to Full Map'}).click();

  await page.getByRole('button',{name:'Situation Board'}).click();await capture('situation-board.png');await page.getByRole('button',{name:'Close Situation Board'}).click();
  await page.getByRole('button',{name:'Campaign History'}).click();await capture('campaign-history.png');await page.getByRole('button',{name:'Close Campaign History'}).click();

  await page.getByLabel('Select historical province').selectOption('petrograd-governorate');await page.getByRole('button',{name:/Next phase/}).click();await page.getByRole('button',{name:/Next phase/}).click();
  await page.getByRole('button',{name:/Send Organizer 1 turn/}).click();await resolveVisibleDecisions(page);await page.getByTestId('reset-map').click();
  await expect(page.getByTestId('activity-marker-layer').locator('[data-activity-kind="operation"]')).not.toHaveCount(0);
  await page.getByLabel('Map appearance preset').selectOption('historical_atlas');await page.getByRole('button',{name:'Western Russia',exact:true}).click();await capture('active-operation-markers.png');await page.getByRole('button',{name:'Return to Full Map'}).click();
  await page.getByRole('button',{name:/Next phase/}).click();await page.getByRole('button',{name:/Next phase/}).click();await page.getByRole('button',{name:/Advance month/}).click();
  await page.getByRole('button',{name:'Return to map'}).click();const aprilBoard=page.getByRole('button',{name:'Close Situation Board'});if(await aprilBoard.count())await aprilBoard.click();await resolveVisibleDecisions(page);
  await page.getByLabel('Select historical province').selectOption('akmolinsk-province');await page.getByTestId('enter-province').click();await capture('province-without-district-data.png');
});
