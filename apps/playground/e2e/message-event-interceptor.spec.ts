import { test, expect } from '@playwright/test';

test.describe('Message Event Interceptor Synchronization Test', () => {
  const pageUri = '/messageEventInterceptor';

  test('should synchronize user overriding it', async ({ page }) => {
    await page.goto(pageUri);

    const page2 = await page.context().newPage();
    await page2.goto(pageUri);

    await expect(page.locator('[data-testid="user-value"]')).toHaveText('override');
    await expect(page2.locator('[data-testid="user-value"]')).toHaveText('');

    await page2.locator('[data-testid="user-input"]').fill('user');
    await page2.locator('[data-testid="user-submit"]').click();

    await expect(page.locator('[data-testid="user-value"]')).toHaveText('override');
    await expect(page2.locator('[data-testid="user-value"]')).toHaveText('user');

    await page2.close();
  });

  test('should synchronize isAdmin overriding it', async ({ page }) => {
    await page.goto(pageUri);

    const page2 = await page.context().newPage();
    await page2.goto(pageUri);

    await expect(page.locator('[data-testid="isadmin-value"]')).toHaveText('true');
    await expect(page2.locator('[data-testid="isadmin-value"]')).toHaveText('');

    await page2.locator('[data-testid="isadmin-submit"]').click();

    await expect(page.locator('[data-testid="isadmin-value"]')).toHaveText('true');
    await expect(page2.locator('[data-testid="isadmin-value"]')).toHaveText('false');

    await page2.close();
  });

  test('should display broadcast channel name', async ({ page }) => {
    await page.goto(pageUri);

    const page2 = await page.context().newPage();
    await page2.goto(pageUri);

    await expect(page.locator('[data-testid="channel-value"]')).toHaveText('messageEventInterceptor');
    await expect(page2.locator('[data-testid="channel-value"]')).toHaveText('messageEventInterceptor');

    await page2.close();
  });

  test('should synchronize initial state on page reload', async ({ page }) => {
    await page.goto(pageUri);

    const page2 = await page.context().newPage();
    await page2.goto(pageUri);

    await page2.locator('[data-testid="user-input"]').fill('user');
    await page2.locator('[data-testid="user-submit"]').click();
    await page2.locator('[data-testid="isadmin-submit"]').click();

    await expect(page.locator('[data-testid="user-value"]')).toHaveText('override');
    await expect(page.locator('[data-testid="isadmin-value"]')).toHaveText('true');
    await expect(page2.locator('[data-testid="user-value"]')).toHaveText('user');
    await expect(page2.locator('[data-testid="isadmin-value"]')).toHaveText('false');

    page2.reload();

    await expect(page.locator('[data-testid="user-value"]')).toHaveText('override');
    await expect(page.locator('[data-testid="isadmin-value"]')).toHaveText('true');
    await expect(page2.locator('[data-testid="user-value"]')).toHaveText('');
    await expect(page2.locator('[data-testid="isadmin-value"]')).toHaveText('');

    await page2.close();
  });

  test('should execute messageEventInterceptor and display log', async ({ page }) => {
    await page.goto(pageUri);

    const page2 = await page.context().newPage();
    await page2.goto(pageUri);

    const logs: string[] = [];
    page.on('console', async (msg) => {
      const firstArg = await msg.args()[0].jsonValue();
      if (firstArg === 'message') {
        logs.push(msg.text());
      }
    });

    const logs2: string[] = [];
    page2.on('console', async (msg) => {
      const firstArg = await msg.args()[0].jsonValue();
      if (firstArg === 'message') {
        logs2.push(msg.text());
      }
    });

    await page2.locator('[data-testid="isadmin-submit"]').click();
    await page2.locator('[data-testid="isadmin-submit"]').click();

    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs2.length).toBe(0);

    await page2.close();
  });
});
