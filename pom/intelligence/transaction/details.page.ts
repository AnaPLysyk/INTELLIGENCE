import { expect, type Page } from '@playwright/test';

export class TransactionDetailsPage {
  constructor(private readonly page: Page) {}

  async validarEdicaoDisponivel(): Promise<void> {
    const editar = this.page.getByRole('button', { name: /editar/i }).first();
    await expect(
      editar,
      'Uma transação usada como baseline de acesso completo deve disponibilizar o controle Editar.',
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      editar,
      'O controle Editar da transação deve estar habilitado para o administrador.',
    ).toBeEnabled();
  }
}
