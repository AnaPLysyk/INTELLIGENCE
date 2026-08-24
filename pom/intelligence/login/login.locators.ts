import type { Page } from '@playwright/test';

export function loginLocators(page: Page) {
  return {
    username: page.locator('input[name="username"]'),
    password: page.locator('input[name="password"]'),
    accessButton: page.getByRole('button', { name: /acessar/i }),
  };
}
