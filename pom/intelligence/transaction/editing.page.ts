import { expect, type Page } from '@playwright/test';

export class TransactionEditingPage {
  constructor(private readonly page: Page) {}

  private camposDataVisiveis() {
    return this.page.locator('input[type="date"]:visible');
  }

  async validarAlgumCampoDataPreenchido(): Promise<void> {
    const campos = this.camposDataVisiveis();
    const quantidade = await campos.count();

    expect(
      quantidade,
      'A edição da transação deve disponibilizar ao menos um campo do tipo data para validar o INT-40.',
    ).toBeGreaterThan(0);

    const valores = await campos.evaluateAll((elementos) =>
      elementos.map((elemento) => String((elemento as HTMLInputElement).value || '').trim()),
    );

    expect(
      valores.some((valor) => valor.length > 0),
      `Ao menos um campo de data deve preservar o valor atual ao abrir a edição. Valores=${JSON.stringify(valores)}`,
    ).toBe(true);
  }

  async validarAlgumCampoDataComCalendario(): Promise<void> {
    const campos = this.camposDataVisiveis();
    const quantidade = await campos.count();

    expect(
      quantidade,
      'A edição da transação deve disponibilizar ao menos um input type=date para validar o calendário do INT-32.',
    ).toBeGreaterThan(0);

    for (let indice = 0; indice < quantidade; indice += 1) {
      await expect(
        campos.nth(indice),
        'O controle de data deve permanecer habilitado para interação.',
      ).toBeEnabled();
    }
  }
}
