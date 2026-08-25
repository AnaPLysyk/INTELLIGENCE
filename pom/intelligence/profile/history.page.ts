import { expect, type Locator, type Page } from '@playwright/test';

export class ProfileHistoryPage {
  constructor(private readonly page: Page) {}

  private async escopoHistorico(pguidsEsperados: string[]): Promise<Locator> {
    const titulo = this.page.getByText(/hist[oó]rico de perfis anteriores/i).first();
    await expect(
      titulo,
      'Quando previousHistory possui dados, a UI deve exibir o bloco Histórico de perfis anteriores.',
    ).toBeVisible({ timeout: 30_000 });

    const esperados = pguidsEsperados.map((pguid) => pguid.toUpperCase());
    let escopo = titulo.locator('xpath=..');
    let ultimoEscopo = escopo;

    for (let nivel = 0; nivel < 7; nivel += 1) {
      ultimoEscopo = escopo;
      const texto = (await escopo.textContent().catch(() => '') || '').toUpperCase();
      if (esperados.some((pguid) => texto.includes(pguid))) return escopo;
      escopo = escopo.locator('xpath=..');
    }

    // Retorna o maior escopo inspecionado para que os asserts abaixo gerem
    // uma falha funcional clara caso o bloco exista mas não liste os PGUIDs.
    return ultimoEscopo;
  }

  async validarPreviousHistory(pguidsEsperados: string[]): Promise<void> {
    const unicos = [...new Set(pguidsEsperados.map((pguid) => pguid.toUpperCase()))];
    expect(
      unicos.length,
      'O contrato do INT-24 exige previousHistory não vazio para validar o histórico completo.',
    ).toBeGreaterThan(0);

    const escopo = await this.escopoHistorico(unicos);

    for (const pguid of unicos) {
      await expect(
        escopo,
        `O bloco Histórico de perfis anteriores deve listar o PGUID ${pguid} recebido em previousHistory.`,
      ).toContainText(pguid, { ignoreCase: true, timeout: 30_000 });
    }
  }
}
