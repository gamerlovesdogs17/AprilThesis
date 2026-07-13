import { expect, test } from '@playwright/test';

test('starts a campaign, resolves the opening, uses the map, and saves', async ({ page }) => {
  await page.goto('/');
  const skip = page.getByRole('button', { name: 'Skip introduction' });
  if (await skip.isVisible()) await skip.click();
  await expect(page.getByRole('heading', { name: 'APRIL THESIS' })).toBeVisible();
  await page.getByRole('button', { name: 'New Campaign' }).click();
  await page.getByRole('button', { name: 'Open the March dossier' }).click();

  await page.getByRole('button', { name: /Remain silent on Kronstadt/ }).click();
  await page.getByRole('button', { name: 'Return to map' }).click();
  await page.getByRole('button', { name: 'Lobby delegates quietly on the congress floor' }).click();
  await page.getByRole('button', { name: 'Return to map' }).click();
  await page.getByRole('button', { name: 'Accept the resolution publicly' }).click();
  await page.getByRole('button', { name: 'Return to map' }).click();
  await page.getByRole('button', { name: 'Publicly comply while continuing informally' }).click();
  await page.getByRole('button', { name: 'Return to map' }).click();
  await page.getByRole('button', { name: 'Trade-Union Mobilization — rebuild through the unions' }).click();
  await page.getByRole('button', { name: 'Return to map' }).click();

  await page.getByRole('button', { name: 'Petrograd: 30' }).click();
  await expect(page.getByRole('heading', { name: 'Petrograd' })).toBeVisible();
  await page.getByLabel('Map mode').selectOption('famine_disease');
  await expect(page.getByText('Famine severity and disease burden')).toBeVisible();
  await page.getByRole('button', { name: /Send Organizer 1 turn/ }).click();
  await expect(page.getByText('Petrograd · 1 turn(s)')).toBeVisible();

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
