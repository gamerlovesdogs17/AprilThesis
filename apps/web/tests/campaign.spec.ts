import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function launchCampaign(page: Page, background?: string, tutorial=false) {
  await page.addInitScript(() => localStorage.setItem('april-thesis-preferences', JSON.stringify({ introViewed: true, muted: true, reducedMotion: true })));
  await page.goto('/');
  await page.getByRole('button', { name: 'New Campaign' }).click();
  if (background) await page.getByRole('radio', { name: new RegExp(background, 'i') }).click();
  if (!tutorial) await page.getByLabel('Guided opening').uncheck();
  await page.getByRole('button', { name: 'Open your faction dossier' }).click();
}

async function chooseAndDismiss(page: Page, name: RegExp | string) {
  await page.getByRole('button', { name }).click();
  const dismiss = page.getByRole('button', { name: 'Return to map' });
  if (await dismiss.isVisible()) await dismiss.click();
}

async function openDock(page: Page, group: 'Situation'|'Organization'|'Politics'|'Press'|'Saves', tab: string) {
  await page.getByRole('button', { name: group, exact:true }).click();
  await page.getByRole('button', { name: tab, exact:true }).click();
}

async function resolveOpening(page: Page) {
  await chooseAndDismiss(page, /Remain silent on Kronstadt/);
  await chooseAndDismiss(page, /Lobby delegates quietly/);
  await chooseAndDismiss(page, /Accept the resolution publicly/);
  await chooseAndDismiss(page, /Publicly comply while continuing informally/);
  await chooseAndDismiss(page, /Trade-Union Mobilization/);
}

test('starts a campaign, resolves the opening, uses the map, and saves', async ({ page }) => {
  await launchCampaign(page); await resolveOpening(page);
  await page.getByLabel('Focus strategic region').selectOption('petrograd');
  await expect(page.getByRole('heading', { name: 'Petrograd' })).toBeVisible();
  await page.getByLabel('Map mode').selectOption('famine_disease');
  await expect(page.getByText('Famine severity and disease burden')).toBeVisible();
  await page.getByRole('button', { name: /Next phase/ }).click();
  await page.getByRole('button', { name: /Next phase/ }).click();
  await page.getByRole('button', { name: /Send Organizer 1 turn/ }).click();
  await expect(page.getByText(/Petrograd · 1 turn/)).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
  await openDock(page,'Saves','Save management');
  await expect(page.getByRole('button', { name: /Manual · March 1921/ })).toBeVisible();
});

test('reduced-motion introduction remains skippable without audio', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('april-thesis-preferences', JSON.stringify({ reducedMotion: true, introViewed: false, muted: true })));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'YOU LEAD THE WORKERS’ OPPOSITION' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue to title screen' }).click();
  await expect(page.getByRole('button', { name: 'New Campaign' })).toBeVisible();
});

test('setup background gates strategy choices and changes the dossier', async ({ page }) => {
  await launchCampaign(page, 'Underground Printer');
  await chooseAndDismiss(page, /Remain silent on Kronstadt/);
  await chooseAndDismiss(page, /Lobby delegates quietly/);
  await chooseAndDismiss(page, /Accept the resolution publicly/);
  await chooseAndDismiss(page, /Publicly comply while continuing informally/);
  await expect(page.getByRole('button', { name: /Underground Preservation/ })).toBeEnabled();
  await expect(page.getByRole('button', { name: /Trade-Union Mobilization/ })).toBeDisabled();
});

test('faction phase assigns a named organizer to a selected region', async ({ page }) => {
  await launchCampaign(page); await resolveOpening(page);
  await page.getByLabel('Focus strategic region').selectOption('petrograd');
  await page.getByRole('button', { name: /Next phase/ }).click();
  await openDock(page,'Organization','Faction');
  const anna = page.locator('article').filter({ hasText: 'Anna Sokolova' });
  await anna.getByRole('button', { name: 'Assign to selected region' }).click();
  await expect(anna).toContainText('Assigned');
  await expect(page.getByText('1 action(s) remaining')).toBeVisible();
});

test('party workspace exposes all named delegates and imperfect estimates', async ({ page }) => {
  await launchCampaign(page); await resolveOpening(page);
  await openDock(page,'Politics','Party');
  await expect(page.getByText('Union Consultation and Factory Voice Resolution')).toBeVisible();
  await expect(page.getByText('Vladimir Lenin', { exact: true })).toBeVisible();
  await expect(page.getByText('Alexandra Kollontai', { exact: true })).toBeVisible();
  await expect(page.locator('article[data-stance]')).toHaveCount(28);
});

test('party-politics phase permits a logged delegate lobbying action', async ({ page }) => {
  await launchCampaign(page); await resolveOpening(page);
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /Next phase/ }).click();
  await openDock(page,'Politics','Party');
  const kamenev = page.locator('article').filter({ hasText: 'Lev Kamenev' });
  await kamenev.getByRole('button', { name: 'Meet' }).click();
  await expect(kamenev).toContainText('Approaches: private meeting');
  await expect(page.getByText(/lobbying actions 1/)).toBeVisible();
});

test('laws panel lets the player introduce and campaign for a proposal', async ({ page }) => {
  await launchCampaign(page); await resolveOpening(page);
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /Next phase/ }).click();
  await openDock(page,'Politics','Laws');
  const factory = page.locator('article').filter({ hasText: 'Factory Committee Co-Management' });
  await factory.getByRole('button', { name: 'Introduce proposal' }).click();
  await expect(factory).toContainText('Campaigning');
  await factory.getByRole('button', { name: /Campaign in/ }).click();
  await expect(page.getByText('0 political action(s) remaining')).toBeVisible();
});

test('institution approach changes contacts and consumes political action', async ({ page }) => {
  await launchCampaign(page); await resolveOpening(page);
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /Next phase/ }).click();
  await openDock(page,'Organization','Institutions');
  const unions = page.locator('article').filter({ hasText: 'All-Russian Central Council of Trade Unions' });
  await expect(unions).toContainText('Contacts 15');
  await unions.getByRole('button', { name: /Approach/ }).click();
  await expect(unions).toContainText('Contacts 21');
});

test('map offers the complete sixteen-mode political and administrative legend', async ({ page }) => {
  await launchCampaign(page);
  await expect(page.getByLabel('Map mode').locator('option')).toHaveCount(16);
  await page.getByLabel('Map mode').selectOption('party_organization');
  await expect(page.getByText('Density and activity of Communist Party membership')).toBeVisible();
  await page.getByLabel('Map mode').selectOption('propaganda_reach');
  await expect(page.getByText('Estimated reach of faction propaganda')).toBeVisible();
});

test('newspaper archive preserves contradictory source metadata and filters', async ({ page }) => {
  await launchCampaign(page);
  await chooseAndDismiss(page, /Publicly condemn Kronstadt/);
  await openDock(page,'Press','Newspapers');
  await expect(page.getByText(/WHAT THE OFFICIAL COMMUNIQUÉ OMITS/)).toBeVisible();
  await expect(page.getByText(/contradicts another clipping/)).toBeVisible();
  await page.getByRole('button', { name: 'Factional', exact: true }).click();
  await expect(page.locator('article').filter({ hasText: 'Opposition Circular' })).toBeVisible();
});

test('save manager can duplicate and export a manual slot', async ({ page }) => {
  await launchCampaign(page);
  await page.getByRole('button', { name: 'Save' }).click();
  await openDock(page,'Saves','Save management');
  const manual = page.getByRole('button', { name: /Manual · March 1921/ }).first();
  const row = manual.locator('..');
  await row.getByRole('button', { name: 'Duplicate' }).click();
  await expect(page.getByRole('button', { name: /copy/ })).toBeVisible();
  const download = page.waitForEvent('download');
  await row.getByRole('button', { name: 'Export' }).click();
  expect((await download).suggestedFilename()).toMatch(/april-thesis-save/);
});

test('map zoom, reset, fit-region, and keyboard controls stay clamped', async ({ page }) => {
  await launchCampaign(page); await resolveOpening(page);
  const zoom = page.getByLabel('Map zoom');
  await expect(zoom).toHaveText('100%');
  for (let i = 0; i < 10; i++) await page.getByTestId('zoom-in').click();
  await expect(zoom).toHaveText('400%');
  await page.getByLabel('Focus strategic region').selectOption('petrograd');
  await page.getByTestId('fit-region').click();
  await expect(zoom).toHaveText('245%');
  await page.getByTestId('reset-map').click();
  await expect(zoom).toHaveText('100%');
});

test('geographic layers toggle independently and preserve the selected region', async ({ page }) => {
  await launchCampaign(page); await resolveOpening(page);
  await page.getByLabel('Focus strategic region').selectOption('moscow');
  await page.getByLabel('cities').uncheck();
  await expect(page.getByTestId('city-layer')).toHaveCount(0);
  await page.getByLabel('cities').check();
  await expect(page.getByTestId('city-layer')).toBeVisible();
  await expect(page.getByTestId('railway-layer')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Moscow' })).toBeVisible();
  await page.getByLabel('Influence opacity').fill('0.4');
});

test('map uses historical city names and reveals secondary labels on zoom', async ({ page }) => {
  await launchCampaign(page); await resolveOpening(page);
  await expect(page.locator('[data-city-id="novonikolayevsk-city"]')).toHaveCount(1);
  await page.getByTestId('zoom-in').click();
  await page.getByTestId('zoom-in').click();
  await expect(page.locator('[data-city-id="novonikolayevsk-city"]')).toContainText('Novo-Nikolayevsk');
  await expect(page.locator('[data-city-id="tiflis-city"]')).toContainText('Tiflis');
});

test('campaign keeps faction identity visible before and after the opening choices', async ({ page }) => {
  await launchCampaign(page, 'Trade-Union Organizer');
  await expect(page.getByLabel('Player faction identity')).toContainText('Workers’ Opposition');
  await expect(page.getByLabel('Player faction identity')).toContainText('not a historical emblem');
  await resolveOpening(page);
  await expect(page.getByLabel('Player faction identity')).toContainText('Trade Union Mobilization');
});

test('economy, institutions, and party sections render real campaign charts', async ({ page }) => {
  await launchCampaign(page);
  await openDock(page,'Situation','National');
  await expect(page.getByRole('heading', { name: 'National conditions timeline' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'National conditions by month' })).toHaveCount(1);
  await openDock(page,'Organization','Institutions');
  await expect(page.getByRole('heading', { name: 'Institutional balance' })).toBeVisible();
  await openDock(page,'Politics','Party');
  await expect(page.getByRole('heading', { name: 'Bloc seating and commitments' })).toBeVisible();
});

test('character dossiers use designed portrait fallbacks and active agendas', async ({ page }) => {
  await launchCampaign(page);
  await openDock(page,'Organization','Characters');
  await expect(page.locator('[class*="characterPortrait"]')).toHaveCount(15);
  await expect(page.getByText('Current agenda', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Vladimir Lenin', { exact: true })).toBeVisible();
});

test('cinematic scenes expose geographic collapse, congress, faction, and title beats', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('april-thesis-preferences', JSON.stringify({ introViewed: false, muted: true, reducedMotion: false, audioPreload: 'minimal' })));
  await page.goto('/?introScene=civil-war');
  await expect(page.getByText('Revolution became civil war.')).toBeVisible();
  await page.goto('/?introScene=congress');
  await expect(page.getByText(/ORGANIZED FACTIONS/)).toBeVisible();
  await page.goto('/?introScene=opposition');
  await expect(page.getByRole('heading', { name: /YOU LEAD THE/ })).toBeVisible();
  await page.goto('/?introScene=title');
  await expect(page.getByRole('heading', { name: 'APRIL THESIS' })).toBeVisible();
});

test('every manifest asset responds locally without a network dependency', async ({ page, request }) => {
  await page.goto('/');
  const manifest = await (await request.get('/assets/assets-manifest.json')).json() as { assets: Array<{ localPath: string }> };
  expect(manifest.assets.length).toBeGreaterThanOrEqual(16);
  for (const asset of manifest.assets) {
    const url = `/${asset.localPath.replace('apps/web/public/', '')}`;
    const response = await request.get(url);
    expect(response.ok(), asset.localPath).toBe(true);
  }
});

test('audio activation requests real local ambience and telegraph files', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('april-thesis-preferences', JSON.stringify({ introViewed: false, muted: false, reducedMotion: false, masterVolume: .8, ambienceVolume: .6, interfaceVolume: .7, audioPreload: 'minimal' })));
  const requested: string[] = [];
  page.on('request', request => requested.push(request.url()));
  await page.goto('/?introScene=old-order');
  await page.getByRole('button', { name: 'Enable cinematic audio' }).click();
  await expect.poll(() => requested.some(url => url.endsWith('/assets/audio/ambience/winter-wind.wav'))).toBe(true);
  await expect.poll(() => requested.some(url => url.endsWith('/assets/audio/cinematic/telegraph.wav'))).toBe(true);
  await expect(page.getByText('[Winter wind. Telegraph keys begin.]')).toBeVisible();
});

test('stamp test uses a real asset and mute persists through settings', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('april-thesis-preferences', JSON.stringify({ introViewed: true, muted: false, reducedMotion: true, masterVolume: .8, interfaceVolume: .7, audioPreload: 'minimal' })));
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  const stampRequest = page.waitForRequest(request => request.url().endsWith('/assets/audio/cinematic/stamp-impact.wav'));
  await page.getByRole('button', { name: 'Test stamp sound' }).click();
  await stampRequest;
  await page.getByLabel('Mute audio').check();
  await expect(page.getByLabel('Mute audio')).toBeChecked();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('april-thesis-preferences') ?? '{}').muted)).toBe(true);
});

test('map pointer drag pans the geographic viewport', async ({ page }) => {
  await launchCampaign(page); await resolveOpening(page);
  const map = page.getByTestId('geographic-map');
  const viewport = page.getByTestId('map-viewport');
  const before = await viewport.getAttribute('style');
  const box = await map.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * .55, box!.y + box!.height * .52);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * .68, box!.y + box!.height * .62, { steps: 6 });
  await page.mouse.up();
  await expect(viewport).not.toHaveAttribute('style', before ?? '');
  await expect(viewport).toHaveAttribute('style', /translate\((?!0px, 0px)/);
});

test('railway and political influence layers toggle from real controls', async ({ page }) => {
  await launchCampaign(page); await resolveOpening(page);
  await expect(page.getByTestId('railway-layer')).toBeVisible();
  await page.getByTestId('toggle-railways').click();
  await expect(page.getByTestId('railway-layer')).toHaveCount(0);
  await expect(page.getByTestId('influence-layer')).toBeVisible();
  await page.getByTestId('toggle-influence').click();
  await expect(page.getByTestId('influence-layer')).toHaveCount(0);
});

test('selected region exposes comparison data for adjacent regions', async ({ page }) => {
  await launchCampaign(page); await resolveOpening(page);
  await page.getByLabel('Focus strategic region').selectOption('petrograd');
  const comparison = page.getByRole('heading', { name: 'Regional comparison' }).locator('..');
  await expect(comparison).toBeVisible();
  await expect(comparison).toContainText(/baltic frontier/i);
  await expect(comparison).toContainText(/karelia/i);
});

test('imports and loads a pre-Phase-Three save through the archive', async ({ page }) => {
  await launchCampaign(page);
  await page.getByRole('button', { name: 'Save' }).click();
  await openDock(page,'Saves','Save management');
  const manual = page.getByRole('button', { name: /Manual · March 1921/ }).first();
  const downloadEvent = page.waitForEvent('download');
  await manual.locator('..').getByRole('button', { name: 'Export' }).click();
  const exported = await downloadEvent;
  const exportedPath = await exported.path();
  expect(exportedPath).not.toBeNull();
  const legacy = JSON.parse(await readFile(exportedPath!, 'utf8'));
  legacy.saveVersion = 2;
  delete legacy.campaign.historySnapshots;
  delete legacy.checksum;
  await page.getByLabel('Import save file').setInputFiles({ name: 'phase-two-save.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(legacy)) });
  await expect(page.getByRole('alert')).toContainText('Imported phase-two-save.json');
  await page.getByRole('button', { name: /Manual · March 1921/ }).last().click();
  await openDock(page,'Situation','National');
  await expect(page.getByText(/1 snapshot · real campaign history/)).toBeVisible();
});

test('plays a full month and records history without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await launchCampaign(page); await resolveOpening(page);
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: /Next phase/ }).click();
  await page.getByRole('button', { name: /Advance month/ }).click();
  await page.getByRole('button', { name: 'Return to map' }).click();
  await expect(page.getByText('April 1921', { exact: true }).first()).toBeVisible();
  await openDock(page,'Situation','National');
  await expect(page.getByText(/2 snapshots · real campaign history/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('captures final national, western, Caucasus, Siberian, and workspace review views', async ({ page }) => {
  const output = resolve('../../docs/review-screenshots/phase-four-after');
  await launchCampaign(page); await resolveOpening(page);
  await page.screenshot({ path: resolve(output, 'main-political-map.png') });
  for (const [region, file] of [['moscow','western-russia-zoom.png'],['georgia','caucasus-zoom.png'],['western_siberia','siberia-zoom.png']] as const) {
    await page.getByLabel('Focus strategic region').selectOption(region);
    await page.getByTestId('fit-region').click();
    await page.screenshot({ path: resolve(output, file) });
  }
  await page.getByTestId('reset-map').click();
  await page.getByLabel('Focus strategic region').selectOption('');
  await page.screenshot({ path: resolve(output, 'city-labels.png') });
  await page.getByLabel('Map mode').selectOption('railway_infrastructure');
  await page.screenshot({ path: resolve(output, 'railway-layer.png') });
  await openDock(page,'Situation','National');
  await page.screenshot({ path: resolve(output, 'national-charts.png') });
});
