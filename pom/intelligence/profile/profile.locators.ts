import type { Page } from '@playwright/test';

export function profileLocators(page: Page) {
  return {
    body: page.locator('body'),
    editButton: page.getByRole('button', { name: /editar/i }).first(),
  };
}
