import type { Page } from '@playwright/test';
import { IntelligencePage } from '../../../support/functions/ui/intelligence/intelligence.page';

export class ProfileActions {
  private readonly pageObject: IntelligencePage;

  constructor(page: Page) {
    this.pageObject = new IntelligencePage(page);
  }

  abrirPorPguid(pguid: string): Promise<void> {
    return this.pageObject.abrirDetalhesDoPerfilPorPguid(pguid);
  }

  validarCarregado(pguid: string): Promise<void> {
    return this.pageObject.validarDetalhesDoPerfilCarregados(pguid);
  }

  validarSomenteLeitura(): Promise<void> {
    return this.pageObject.validarAusenciaDeControlesDeEscrita();
  }
}
