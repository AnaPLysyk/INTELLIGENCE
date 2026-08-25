import { expect, type Page } from '@playwright/test';

type ControleFormulario = {
  indice: number;
  tag: string;
  type: string;
  name: string;
  placeholder: string;
  ariaLabel: string;
  title: string;
  testId: string;
  className: string;
  value: string;
  disabled: boolean;
  readOnly: boolean;
};

export class TransactionEditingPage {
  constructor(private readonly page: Page) {}

  private controles() {
    return this.page.locator('input:visible, textarea:visible, select:visible');
  }

  private async lerControles(): Promise<ControleFormulario[]> {
    return this.controles().evaluateAll((elementos) => elementos.map((elemento, indice) => {
      const campo = elemento as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      const labels = 'labels' in campo && campo.labels
        ? Array.from(campo.labels).map((label) => label.textContent || '').join(' ')
        : '';

      return {
        indice,
        tag: elemento.tagName.toLowerCase(),
        type: elemento.getAttribute('type') || elemento.tagName.toLowerCase(),
        name: elemento.getAttribute('name') || '',
        placeholder: elemento.getAttribute('placeholder') || '',
        ariaLabel: elemento.getAttribute('aria-label') || '',
        title: elemento.getAttribute('title') || '',
        testId: elemento.getAttribute('data-testid') || '',
        className: elemento.getAttribute('class') || '',
        value: 'value' in campo ? String(campo.value || '').trim() : '',
        disabled: Boolean(campo.disabled),
        readOnly: 'readOnly' in campo ? Boolean(campo.readOnly) : false,
        labels,
      };
    })).then((controles) => controles.map((controle) => ({
      indice: controle.indice,
      tag: controle.tag,
      type: controle.type,
      name: controle.name,
      placeholder: controle.placeholder,
      ariaLabel: [controle.ariaLabel, controle.labels].filter(Boolean).join(' ').trim(),
      title: controle.title,
      testId: controle.testId,
      className: controle.className,
      value: controle.value,
      disabled: controle.disabled,
      readOnly: controle.readOnly,
    })));
  }

  private pareceData(controle: ControleFormulario): boolean {
    if (controle.type.toLowerCase() === 'date') return true;

    const metadados = [
      controle.name,
      controle.placeholder,
      controle.ariaLabel,
      controle.title,
      controle.testId,
      controle.className,
    ].join(' ').toLowerCase();

    if (/\b(date|data|birth|nasc)\w*/i.test(metadados)) return true;

    return /^(?:\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})$/.test(controle.value);
  }

  private diagnostico(controles: ControleFormulario[]): string {
    return JSON.stringify(controles.map((controle) => ({
      indice: controle.indice,
      tag: controle.tag,
      type: controle.type,
      name: controle.name,
      placeholder: controle.placeholder,
      ariaLabel: controle.ariaLabel,
      title: controle.title,
      testId: controle.testId,
      className: controle.className.slice(0, 200),
      value: controle.value,
      disabled: controle.disabled,
      readOnly: controle.readOnly,
    }))).slice(0, 8000);
  }

  async validarAlgumCampoDataPreenchido(): Promise<void> {
    const controles = await this.lerControles();
    const candidatos = controles.filter((controle) => this.pareceData(controle));

    if (candidatos.length === 0) {
      throw new Error(
        'BLOQUEADO: a edição abriu, mas a automação não identificou nenhum controle de data para validar o INT-40. '
        + `Controles=${this.diagnostico(controles)}`,
      );
    }

    expect(
      candidatos.some((controle) => controle.value.length > 0),
      `Ao menos um campo de data deve preservar o valor atual ao abrir a edição. Candidatos=${this.diagnostico(candidatos)}`,
    ).toBe(true);
  }

  async validarAlgumCampoDataComCalendario(): Promise<void> {
    const controles = await this.lerControles();
    const candidatos = controles.filter((controle) => this.pareceData(controle));

    if (candidatos.length === 0) {
      throw new Error(
        'BLOQUEADO: a edição abriu, mas a automação não identificou nenhum controle de data para validar o INT-32. '
        + `Controles=${this.diagnostico(controles)}`,
      );
    }

    for (const candidato of candidatos) {
      const campo = this.controles().nth(candidato.indice);
      if (candidato.disabled || candidato.readOnly) continue;

      if (candidato.type.toLowerCase() === 'date') {
        await expect(campo, 'O campo de data nativo deve permanecer habilitado para interação.').toBeEnabled();
        return;
      }

      await campo.click().catch(() => undefined);

      const calendario = this.page.locator([
        '[role="grid"]:visible',
        '[class*="calendar" i]:visible',
        '[class*="datepicker" i]:visible',
        '[aria-label*="calendar" i]:visible',
        '[aria-label*="calend" i]:visible',
        '[title*="calendar" i]:visible',
        '[title*="calend" i]:visible',
        '[data-testid*="calendar" i]:visible',
        '[data-testid*="date-picker" i]:visible',
      ].join(', ')).first();

      if (await calendario.isVisible({ timeout: 2_000 }).catch(() => false)) {
        return;
      }

      await this.page.keyboard.press('Escape').catch(() => undefined);
    }

    const sinais = await this.page
      .locator('button:visible, [role="button"]:visible, [aria-label]:visible, [title]:visible, [data-testid]:visible')
      .evaluateAll((elementos) => elementos.slice(0, 80).map((elemento) => ({
        tag: elemento.tagName.toLowerCase(),
        text: (elemento.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
        ariaLabel: elemento.getAttribute('aria-label') || '',
        title: elemento.getAttribute('title') || '',
        testId: elemento.getAttribute('data-testid') || '',
        className: (elemento.getAttribute('class') || '').slice(0, 180),
      })));

    throw new Error(
      'O INT-32 exige um calendário para campos de data, mas nenhum datepicker reconhecível foi aberto pelos controles candidatos. '
      + `Candidatos=${this.diagnostico(candidatos)} Sinais=${JSON.stringify(sinais).slice(0, 8000)}`,
    );
  }
}
