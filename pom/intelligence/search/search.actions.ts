import type { Page } from '@playwright/test';
import { IntelligencePage } from '../../../support/functions/ui/intelligence/intelligence.page';

export class SearchActions {
  private readonly pageObject: IntelligencePage;

  constructor(page: Page) {
    this.pageObject = new IntelligencePage(page);
  }

  validarDisponivel(): Promise<void> {
    return this.pageObject.validarBuscaDisponivel();
  }

  validarViewOnly(): Promise<void> {
    return this.pageObject.validarTelaViewOnly();
  }

  abrirRota(): Promise<void> {
    return this.pageObject.abrirRotaBusca();
  }

  abrirRotaComParametros(chave: string, valor: string, kind = 'UUID'): Promise<void> {
    return this.pageObject.abrirRotaBuscaComParametros(chave, valor, kind);
  }
}
