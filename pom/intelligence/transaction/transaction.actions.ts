import type { Page } from '@playwright/test';
import { IntelligencePage } from '../../../support/functions/ui/intelligence/intelligence.page';

export class TransactionActions {
  private readonly pageObject: IntelligencePage;

  constructor(page: Page) {
    this.pageObject = new IntelligencePage(page);
  }

  abrirPorTguid(tguid: string): Promise<void> {
    return this.pageObject.abrirDetalhesDaTransacaoPorTguid(tguid);
  }

  validarCarregada(tguid: string): Promise<void> {
    return this.pageObject.validarDetalhesDaTransacaoCarregados(tguid);
  }

  validarSomenteLeitura(): Promise<void> {
    return this.pageObject.validarAusenciaDeControlesDeEscrita();
  }
}
