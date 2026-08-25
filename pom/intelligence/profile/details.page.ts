import { expect, type Page } from '@playwright/test';

export class ProfileDetailsPage {
  constructor(private readonly page: Page) {}

  async validarPerfilExistente(pguid: string): Promise<void> {
    await expect.poll(
      () => decodeURIComponent(this.page.url()),
      {
        message: 'A URL deve permanecer no perfil solicitado pelo PGUID.',
        timeout: 30_000,
      },
    ).toContain(`/person/${pguid}`);

    const corpo = this.page.locator('body');

    await expect(
      corpo,
      'Um cenário positivo de perfil não pode terminar em estado de recurso inexistente.',
    ).not.toContainText(
      /p[aá]gina n[aã]o encontrada|nenhum resultado encontrado|perfil n[aã]o encontrado|not found/i,
      { timeout: 30_000 },
    );

    await expect(
      corpo,
      'A tela de um PGUID válido deve apresentar conteúdo identificável de perfil.',
    ).toContainText(
      /perfil|dados biogr[aá]ficos/i,
      { timeout: 30_000 },
    );
  }
}
