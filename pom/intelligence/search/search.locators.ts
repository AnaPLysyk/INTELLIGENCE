import type { Page } from '@playwright/test';

export function searchLocators(page: Page) {
  return {
    keySelect: page.locator('select').first(),
    valueInput: page.locator('input:visible').first(),
    searchButton: page.getByRole('button', { name: /pesquisar/i }),
    viewOnlyMessage: page.getByText(/a busca n[aã]o est[aá] dispon[ií]vel para o seu usu[aá]rio/i).first(),
  };
}
