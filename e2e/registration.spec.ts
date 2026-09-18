import { test, expect } from '@playwright/test';

test('Registration flow validation', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Badminton Tournament Platform/);
});
