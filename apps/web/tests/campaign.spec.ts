import { expect, test, type Page } from '@playwright/test';

async function launchCampaign(page: Page, background?: string) {
  await page.addInitScript(() => localStorage.setItem('april-thesis-preferences', JSON.stringify({ introViewed: true, muted: true, reducedMotion: true })));
  await page.goto('/');
  await page.getByRole('button', { name: 'New Campaign' }).click();
  if (background) await page.getByRole('radio', { name: new RegExp(background, 'i') }).click();
  await page.getByRole('button', { name: 'Open the March dossier' }).click();
}

async function chooseAndDismiss(page: Page, name: RegExp | string) {
  await page.getByRole('button', { name }).click();
  const dismiss = page.getByRole('button', { name: 'Return to map' });
  if (await dismiss.isVisible()) await dismiss.click();
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
  await page.getByRole('button', { name: /Petrograd: 30/ }).click();
  await expect(page.getByRole('heading', { name: 'Petrograd' })).toBeVisible();
  await page.getByLabel('Map mode').selectOption('famine_disease');
  await expect(page.getByText('Famine severity and disease burden')).toBeVisible();
  await page.getByRole('button', { name: /Next phase/ }).click();
  await page.getByRole('button', { name: /Next phase/ }).click();
  await page.getByRole('button', { name: /Send Organizer 1 turn/ }).click();
  await expect(page.getByText(/Petrograd · 1 turn/)).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.getByRole('button', { name: /Manual · March 1921/ })).toBeVisible();
});

test('reduced-motion introduction remains skippable without audio', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('april-thesis-preferences', JSON.stringify({ reducedMotion: true, introViewed: false, muted: true })));
  await page.goto('/');
  await expect(page.getByText('March 1921. The Tenth Party Congress has banned organized factions.')).toBeVisible();
  await page.getByRole('button', { name: 'Continue to Title Screen' }).click();
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
  await page.getByRole('button', { name: /Petrograd: 30/ }).click();
  await page.getByRole('button', { name: /Next phase/ }).click();
  await page.getByRole('button', { name: 'Faction', exact: true }).click();
  const anna = page.locator('article').filter({ hasText: 'Anna Sokolova' });
  await anna.getByRole('button', { name: 'Assign to selected region' }).click();
  await expect(anna).toContainText('Assigned');
  await expect(page.getByText('1 action(s) remaining')).toBeVisible();
});

test('party workspace exposes all named delegates and imperfect estimates', async ({ page }) => {
  await launchCampaign(page); await resolveOpening(page);
  await page.getByRole('button', { name: 'Party', exact: true }).click();
  await expect(page.getByText('Union Consultation and Factory Voice Resolution')).toBeVisible();
  await expect(page.getByText('Vladimir Lenin', { exact: true })).toBeVisible();
  await expect(page.getByText('Alexandra Kollontai', { exact: true })).toBeVisible();
  await expect(page.locator('article[data-stance]')).toHaveCount(28);
});

test('party-politics phase permits a logged delegate lobbying action', async ({ page }) => {
  await launchCampaign(page); await resolveOpening(page);
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /Next phase/ }).click();
  await page.getByRole('button', { name: 'Party', exact: true }).click();
  const kamenev = page.locator('article').filter({ hasText: 'Lev Kamenev' });
  await kamenev.getByRole('button', { name: 'Meet' }).click();
  await expect(kamenev).toContainText('Approaches: private meeting');
  await expect(page.getByText(/lobbying actions 1/)).toBeVisible();
});

test('laws panel lets the player introduce and campaign for a proposal', async ({ page }) => {
  await launchCampaign(page); await resolveOpening(page);
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /Next phase/ }).click();
  await page.getByRole('button', { name: 'Laws', exact: true }).click();
  const factory = page.locator('article').filter({ hasText: 'Factory Committee Co-Management' });
  await factory.getByRole('button', { name: 'Introduce proposal' }).click();
  await expect(factory).toContainText('Campaigning');
  await factory.getByRole('button', { name: /Campaign in/ }).click();
  await expect(page.getByText('0 political action(s) remaining')).toBeVisible();
});

test('institution approach changes contacts and consumes political action', async ({ page }) => {
  await launchCampaign(page); await resolveOpening(page);
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /Next phase/ }).click();
  await page.getByRole('button', { name: 'Institutions', exact: true }).click();
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
  await page.getByRole('button', { name: 'Newspapers', exact: true }).click();
  await expect(page.getByText(/WHAT THE OFFICIAL COMMUNIQUÉ OMITS/)).toBeVisible();
  await expect(page.getByText(/contradicts another clipping/)).toBeVisible();
  await page.getByRole('button', { name: 'Factional', exact: true }).click();
  await expect(page.locator('article').filter({ hasText: 'Opposition Circular' })).toBeVisible();
});

test('save manager can duplicate and export a manual slot', async ({ page }) => {
  await launchCampaign(page);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  const manual = page.getByRole('button', { name: /Manual · March 1921/ });
  const row = manual.locator('..');
  await row.getByRole('button', { name: 'Duplicate' }).click();
  await expect(page.getByRole('button', { name: /copy/ })).toBeVisible();
  const download = page.waitForEvent('download');
  await row.getByRole('button', { name: 'Export' }).click();
  expect((await download).suggestedFilename()).toMatch(/april-thesis-save/);
});
