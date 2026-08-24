import type { Page } from '@playwright/test';
import { IntelligencePage } from '../core/intelligence.page';

export class SettingsActions {
  private readonly pageObject: IntelligencePage;

  constructor(page: Page) {
    this.pageObject = new IntelligencePage(page);
  }

  abrirPeloHeader(): Promise<void> {
    return this.pageObject.abrirConfiguracoesPeloHeader();
  }

  validarDisponivelParaViewOnly(): Promise<void> {
    return this.pageObject.validarConfiguracoesDisponiveisViewOnly();
  }
}
