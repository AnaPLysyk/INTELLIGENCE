import { expect, type Locator, type Page } from '@playwright/test';

type ControleInterativo = {
  tag: string;
  role: string;
  text: string;
  ariaLabel: string;
  title: string;
  testId: string;
  href: string;
};

export class TransactionDetailsPage {
  constructor(private readonly page: Page) {}

  private candidatosEdicao(): Locator[] {
    return [
      this.page.getByRole('button', { name: /editar/i }).first(),
      this.page.getByRole('link', { name: /editar/i }).first(),
      this.page.locator(
        '[aria-label*="editar" i], [title*="editar" i], '
          + '[aria-label="edit" i], [title="edit" i], '
          + '[data-testid^="edit" i], [data-testid*="-edit" i], [data-testid*="edit-" i]',
      ).first(),
    ];
  }

  private async diagnosticoInterativos(): Promise<ControleInterativo[]> {
    return this.page
      .locator('button, a, [role="button"], [aria-label], [title], [data-testid]')
      .evaluateAll((elementos) => elementos
        .map((elemento) => {
          const html = elemento as HTMLElement;
          const ancora = elemento as HTMLAnchorElement;
          return {
            tag: elemento.tagName.toLowerCase(),
            role: elemento.getAttribute('role') || '',
            text: (html.innerText || elemento.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160),
            ariaLabel: elemento.getAttribute('aria-label') || '',
            title: elemento.getAttribute('title') || '',
            testId: elemento.getAttribute('data-testid') || '',
            href: ancora.href || elemento.getAttribute('href') || '',
          };
        })
        .filter((item) => item.text || item.ariaLabel || item.title || item.testId || item.href)
        .slice(0, 80));
  }

  async validarEdicaoDisponivel(): Promise<void> {
    for (const candidato of this.candidatosEdicao()) {
      if (await candidato.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(
          candidato,
          'O controle Editar da transação deve estar habilitado para o administrador.',
        ).toBeEnabled();
        return;
      }
    }

    const diagnostico = await this.diagnosticoInterativos();
    throw new Error(
      'A transação usada como baseline de acesso completo não disponibiliza nenhum controle de edição '
        + 'semanticamente identificável como Editar. '
        + `URL=${this.page.url()} interativos=${JSON.stringify(diagnostico).slice(0, 6000)}`,
    );
  }
}
