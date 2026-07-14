import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const SAFE_CHOICES:[RegExp,RegExp][]=[
  [/Aftermath of Kronstadt/,/Remain silent/],[/Tenth Congress/,/Lobby delegates quietly/],[/On Party Unity/,/Accept the resolution publicly/],
  [/Meeting Tonight/,/Publicly comply while continuing informally/],[/Opening Strategy/,/Legal Party Reform/],
  [/NEP Debate/,/Accept NEP temporarily/],[/Famine on the Volga/,/Demand expanded state famine relief/],[/Strikes in Petrograd/,/Mediate between workers/],
  [/Cheka Investigation/,/Feed false information/],[/Trade Union Congress/,/Stay quiet and observe/],[/Kollontai's Pamphlet/,/Convince Kollontai/],
  [/Tambov Burning/,/Say nothing/],[/Factory Committees/,/Advise caution/],[/Lenin's Exhaustion/,/Observe the succession/],
  [/Central Committee Vote/,/Encourage abstention/],[/NEPmen on the Streets/,/Cooperate with traders/],[/Famine Deepens/,/Coordinate union volunteers/],
  [/Myasnikov's Manifesto/,/Publicly distance/],[/Security Raid/,/Cut contact with arrested organizers/],
  [/Internal Conference/,/Centralize leadership/],[/Six Months After/,/Continue the struggle/],[/Shliapnikov's Report/,/Be skeptical/],
  [/Letter from Krupskaya/,/Do not reply/],[/Propaganda Theme/,/Bread, Production/],[/Organizer Assignments/,/Focus on Moscow/],
];

async function launchCustom(page:Page, detail:'standard'|'expert', options:{textScale?:number;storedView?:boolean}={}){
  await page.addInitScript(({detail,textScale,storedView})=>{
    localStorage.setItem('april-thesis-preferences',JSON.stringify({
      introViewed:true,muted:true,reducedMotion:true,beginnerHintMode:'off',
      situationBoardEnabled:false,interfaceDetail:detail,textScale:textScale??1,
    }));
    if(storedView){
      sessionStorage.setItem('april-thesis-map-view-v6',JSON.stringify({zoom:4,pan:{x:3000,y:3000}}));
      sessionStorage.setItem('april-thesis-map-view-v7',JSON.stringify({version:7,zoom:4,pan:{x:4000,y:4000},viewport:{width:500,height:350}}));
    }
  },{detail,textScale:options.textScale,storedView:options.storedView});
  await page.goto('/');
  await page.getByRole('button',{name:'New Campaign / Custom Setup'}).click();
  await page.getByRole('radio',{name:new RegExp(`^${detail}`,'i')}).click();
  await page.getByLabel('Guided opening').uncheck();
  const seed=page.getByLabel('Campaign seed');
  if(!(await seed.isVisible())){
    await page.getByText('Advanced campaign rules',{exact:true}).click();
    await expect(seed).toBeVisible();
  }
  await seed.fill('phase-seven-complete-campaign');
  await page.getByRole('button',{name:'Open your faction dossier'}).click();
  await expect(page.getByTestId('geographic-map')).toBeVisible();
}

async function choose(page:Page,name:RegExp){
  await page.getByRole('button',{name}).click();
  const back=page.getByRole('button',{name:'Return to map'});
  if(await back.count()&&await back.isVisible())await back.click();
}

async function resolveOpening(page:Page){
  for(const name of [/Remain silent on Kronstadt/,/Lobby delegates quietly/,/Accept the resolution publicly/,/Publicly comply while continuing informally/,/Trade-Union Mobilization/])await choose(page,name);
}

async function dismissTransientPanels(page:Page){
  const back=page.getByRole('button',{name:'Return to map'});
  if(await back.count()&&await back.isVisible())await back.click();
  const boardClose=page.getByRole('button',{name:'Close Situation Board'});
  if(await boardClose.count()&&await boardClose.isVisible())await boardClose.click();
  const tutorialEnd=page.getByRole('button',{name:/continue campaign/i});
  if(await tutorialEnd.count()&&await tutorialEnd.isVisible())await tutorialEnd.click();
}

async function resolveAllVisibleEvents(page:Page){
  for(let attempt=0;attempt<30;attempt+=1){
    await dismissTransientPanels(page);
    if(await page.getByText(/Chapter outcome/).count())return;
    const minimized=page.getByTestId('event-minimized');
    if(await minimized.count()&&await minimized.isVisible())await minimized.click();
    const dossier=page.getByTestId('event-dossier');
    if(!(await dossier.count())||!(await dossier.isVisible()))return;
    const title=(await dossier.getByRole('heading',{level:2}).textContent())?.trim();
    const choicePattern=SAFE_CHOICES.find(([eventPattern])=>eventPattern.test(title??''))?.[1];
    const choice=choicePattern?dossier.getByRole('button',{name:choicePattern}):dossier.locator('header ~ div > button:enabled').first();
    await expect(choice,`safe choice for ${title}`).toBeEnabled();
    await choice.click();
  }
  throw new Error('Event resolution did not settle after 30 decisions.');
}

async function playThroughAugust(page:Page,detail:'standard'|'expert'){
  await launchCustom(page,detail);
  await resolveAllVisibleEvents(page);
  for(let step=0;step<40;step+=1){
    await resolveAllVisibleEvents(page);
    if(await page.getByText(/Chapter outcome/).count())break;
    const advance=page.getByRole('button',{name:/Next phase|Advance month/});
    await expect(advance,`advance control at campaign step ${step}`).toBeVisible();
    await advance.click();
  }
  await expect(page.getByText(/Chapter outcome/)).toBeVisible();
  await expect(page.getByText(/August 1921/).first()).toBeVisible();
  await expect(page.getByRole('heading',{level:1})).not.toHaveText('The chapter closes');
  await expect(page.getByRole('heading',{name:'Final ledger'})).toBeVisible();
  return (await page.getByRole('heading',{level:1}).textContent())?.trim() ?? '';
}

async function interiorScreenPoint(path:ReturnType<Page['locator']>){
  return path.evaluate(node=>{
    const geometry=node as SVGGeometryElement;
    const box=geometry.getBBox();
    let selected=new DOMPoint(box.x+box.width/2,box.y+box.height/2);
    outer:for(let rows=2;rows<=12;rows+=1){
      for(let y=1;y<rows;y+=1)for(let x=1;x<rows;x+=1){
        const candidate=new DOMPoint(box.x+box.width*x/rows,box.y+box.height*y/rows);
        if(geometry.isPointInFill(candidate)){selected=candidate;break outer;}
      }
    }
    const matrix=geometry.getScreenCTM();
    if(!matrix)throw new Error('Province has no screen transform');
    const screen=selected.matrixTransform(matrix);
    return {x:screen.x,y:screen.y};
  });
}

test('Quick Start launches the simplified Standard experience without changing the simulation surface',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('april-thesis-preferences',JSON.stringify({introViewed:true,muted:true,reducedMotion:true,situationBoardEnabled:false})));
  await page.goto('/');
  await page.getByRole('button',{name:/Quick Start/i}).click();
  await expect(page.getByTestId('geographic-map')).toBeVisible();
  await expect(page.getByLabel('Map appearance preset')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Campaign History'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Situation Board'})).toBeVisible();
  await page.getByRole('button',{name:'Settings'}).click();
  await expect(page.getByLabel('Interface detail')).toHaveValue('standard');
});

test('direct province selection is reliable and a drag never becomes a click',async({page})=>{
  await launchCustom(page,'standard');
  await resolveOpening(page);
  const province=page.locator('path[data-province-id="akmolinsk-province"]').last();
  const point=await interiorScreenPoint(province);
  await page.mouse.click(point.x,point.y);
  await expect(page.getByTestId('province-selection-feedback')).toContainText('Akmolinsk uyezds of Omsk Governorate');
  await expect(province).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Clear'}).click();
  const dragStart=await interiorScreenPoint(province);
  await page.mouse.move(dragStart.x,dragStart.y);
  await page.mouse.down();
  await page.mouse.move(dragStart.x+38,dragStart.y+22,{steps:6});
  await page.mouse.up();
  await expect(page.getByTestId('province-selection-feedback')).toHaveCount(0);
});

test('national fit is centered across supported viewports and rejects incompatible stored views',async({page})=>{
  const output=resolve('../../docs/review-screenshots/phase-seven-after');
  await mkdir(output,{recursive:true});
  const viewports=[{width:1280,height:720},{width:1024,height:768},{width:800,height:600},{width:640,height:720}];
  for(const [index,viewport] of viewports.entries()){
    await page.setViewportSize(viewport);
    if(index===0)await launchCustom(page,'standard',{storedView:true});
    else await page.reload();
    await expect(page.getByTestId('geographic-map')).toBeVisible();
    await page.getByTestId('reset-map').click();
    const geometry=await page.evaluate(()=>{
      const frame=document.querySelector('[data-testid="geographic-map"]')!.getBoundingClientRect();
      const paths=[...document.querySelectorAll('[data-testid="province-surface-layer"] path[data-province-id]')] as SVGGraphicsElement[];
      const boxes=paths.map(path=>path.getBoundingClientRect());
      const minX=Math.min(...boxes.map(box=>box.left)),maxX=Math.max(...boxes.map(box=>box.right));
      const minY=Math.min(...boxes.map(box=>box.top)),maxY=Math.max(...boxes.map(box=>box.bottom));
      return {pageWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth,frame:{left:frame.left,right:frame.right,top:frame.top,bottom:frame.bottom,width:frame.width,height:frame.height},land:{left:minX,right:maxX,top:minY,bottom:maxY,width:maxX-minX,height:maxY-minY}};
    });
    expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.innerWidth+1);
    expect(geometry.frame.width).toBeGreaterThan(300);
    expect(geometry.frame.height).toBeGreaterThan(145);
    expect(geometry.land.left).toBeGreaterThanOrEqual(geometry.frame.left-2);
    expect(geometry.land.right).toBeLessThanOrEqual(geometry.frame.right+2);
    expect(Math.abs((geometry.land.left+geometry.land.right)/2-(geometry.frame.left+geometry.frame.right)/2)).toBeLessThan(geometry.frame.width*.08);
    expect(Math.abs((geometry.land.top+geometry.land.bottom)/2-(geometry.frame.top+geometry.frame.bottom)/2)).toBeLessThan(geometry.frame.height*.1);
    await page.screenshot({path:resolve(output,`standard-${viewport.width}x${viewport.height}.png`)});
  }
  expect(await page.evaluate(()=>sessionStorage.getItem('april-thesis-map-view-v6'))).toBeNull();
  expect(await page.getByLabel('Map zoom').textContent()).not.toBe('400%');
});

test('enlarged text remains contained at the compact supported viewport',async({page})=>{
  await page.setViewportSize({width:800,height:600});
  await launchCustom(page,'standard',{textScale:1.35});
  await expect(page.getByTestId('geographic-map')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(801);
  await expect(page.getByRole('button',{name:/Next phase/})).toBeVisible();
});

for(const detail of ['standard','expert'] as const){
  test(`complete March-August playthrough reaches a deterministic ending in ${detail} mode`,async({page})=>{
    test.setTimeout(60_000);
    const endingTitle=await playThroughAugust(page,detail);
    expect(endingTitle).toBe('Reformist Victory');
  });
}
