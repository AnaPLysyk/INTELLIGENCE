import { expect, type Page } from '@playwright/test';

type ControlePerfil = {
  type: string;
  name: string;
  placeholder: string;
  ariaLabel: string;
  className: string;
  value: string;
};

export class ProfileEditingPage {
  constructor(private readonly page: Page) {}

  private async controlesVisiveis(): Promise<ControlePerfil[]> {
    return this.page
      .locator('input:visible, textarea:visible, select:visible')
      .evaluateAll((elementos) => elementos.map((elemento) => {
        const campo = elemento as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        const labels = 'labels' in campo && campo.labels
          ? Array.from(campo.labels).map((label) => label.textContent || '').join(' ')
          : '';

        return {
          type: elemento.getAttribute('type') || elemento.tagName.toLowerCase(),
          name: elemento.getAttribute('name') || '',
          placeholder: elemento.getAttribute('placeholder') || '',
          ariaLabel: [elemento.getAttribute('aria-label') || '', labels].filter(Boolean).join(' ').trim(),
          className: elemento.getAttribute('class') || '',
          value: 'value' in campo ? String(campo.value || '').trim() : '',
        };
      }));
  }

  private pareceData(controle: ControlePerfil): boolean {
    if (controle.type.toLowerCase() === 'date') return true;

    const metadados = [
      controle.name,
      controle.placeholder,
      controle.ariaLabel,
      controle.className,
    ].join(' ').toLowerCase();

    if (/\b(date|data|birth|nasc)\w*/i.test(metadados)) return true;

    return /^(?:\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})$/.test(controle.value);
  }

  async validarAlgumCampoDataPreenchido(): Promise<void> {
    const controles = await this.controlesVisiveis();
    const candidatos = controles.filter((controle) => this.pareceData(controle));

    if (candidatos.length === 0) {
      throw new Error(
        'BLOQUEADO: a edição do perfil abriu, mas nenhum controle de data foi identificado para validar o INT-40. '
        + `Controles=${JSON.stringify(controles).slice(0, 6000)}`,
      );
    }

    expect(
      candidatos.some((controle) => controle.value.length > 0),
      `Ao menos um campo de data do perfil deve preservar o valor atual ao abrir a edição. Candidatos=${JSON.stringify(candidatos)}`,
    ).toBe(true);
  }
}
