import type { Page } from '@playwright/test';
import { IntelligencePage, type CredenciaisIntelligence } from '../../../support/functions/ui/intelligence/intelligence.page';

export class LoginActions {
  private readonly pageObject: IntelligencePage;

  constructor(page: Page) {
    this.pageObject = new IntelligencePage(page);
  }

  autenticar(credenciais: CredenciaisIntelligence): Promise<void> {
    return this.pageObject.autenticarComCredenciais(credenciais);
  }

  validarAcessoNegado(credenciais: CredenciaisIntelligence): Promise<void> {
    return this.pageObject.validarAutenticacaoNegadaComCredenciais(credenciais);
  }
}
