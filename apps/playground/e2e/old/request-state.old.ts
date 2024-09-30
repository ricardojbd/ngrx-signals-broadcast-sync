import { test, expect } from '@playwright/test';

test.describe('Request State Synchronization Test', () => {
  const pageUri = '/requestState';

  test('should synchronize user', async ({ page }) => {
    await page.goto(pageUri);

    const page2 = await page.context().newPage();
    await page2.goto(pageUri);

    await expect(page.locator('[data-testid="user-value"]')).toHaveText('');
    await expect(page2.locator('[data-testid="user-value"]')).toHaveText('');

    await page.locator('[data-testid="user-input"]').fill('user');
    await page.locator('[data-testid="user-submit"]').click();

    await expect(page.locator('[data-testid="user-value"]')).toHaveText('user');
    await expect(page2.locator('[data-testid="user-value"]')).toHaveText('user');

    await page2.close();
  });

  test('should synchronize isAdmin', async ({ page }) => {
    await page.goto(pageUri);

    const page2 = await page.context().newPage();
    await page2.goto(pageUri);

    await expect(page.locator('[data-testid="isadmin-value"]')).toHaveText('');
    await expect(page2.locator('[data-testid="isadmin-value"]')).toHaveText('');

    await page.locator('[data-testid="isadmin-submit"]').click();

    await expect(page.locator('[data-testid="isadmin-value"]')).toHaveText('false');
    await expect(page2.locator('[data-testid="isadmin-value"]')).toHaveText('false');

    await page2.close();
  });

  test('should display broadcast channel name', async ({ page }) => {
    await page.goto(pageUri);

    const page2 = await page.context().newPage();
    await page2.goto(pageUri);

    await expect(page.locator('[data-testid="channel-value"]')).toHaveText('requestState');
    await expect(page2.locator('[data-testid="channel-value"]')).toHaveText('requestState');

    await page2.close();
  });

  test('should synchronize current state on page reload', async ({ page }) => {
    await page.goto(pageUri);

    const page2 = await page.context().newPage();
    await page2.goto(pageUri);

    await page.locator('[data-testid="user-input"]').fill('user');
    await page.locator('[data-testid="user-submit"]').click();
    await page.locator('[data-testid="isadmin-submit"]').click();

    await expect(page.locator('[data-testid="user-value"]')).toHaveText('user');
    await expect(page.locator('[data-testid="isadmin-value"]')).toHaveText('false');
    await expect(page2.locator('[data-testid="user-value"]')).toHaveText('user');
    await expect(page2.locator('[data-testid="isadmin-value"]')).toHaveText('false');

    page2.reload();

    await expect(page.locator('[data-testid="user-value"]')).toHaveText('user');
    await expect(page.locator('[data-testid="isadmin-value"]')).toHaveText('false');
    await expect(page2.locator('[data-testid="user-value"]')).toHaveText('user');
    await expect(page2.locator('[data-testid="isadmin-value"]')).toHaveText('false');

    await page2.close();
  });
});
