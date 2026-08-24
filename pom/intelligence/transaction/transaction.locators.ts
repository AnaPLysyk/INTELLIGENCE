import type { Page } from '@playwright/test';

export function transactionLocators(page: Page) {
  return {
    body: page.locator('body'),
    transactionData: page.getByText(/dados da transa[cç][aã]o/i).first(),
    editButton: page.getByRole('button', { name: /editar/i }).first(),
  };
}
