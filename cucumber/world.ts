import { World, setWorldConstructor, type IWorldOptions } from '@cucumber/cucumber';
import {
  chromium,
  request,
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';

import '../config/environment';
import { validarAmbienteIntegracao } from '../config/environment';
import { IntelligencePage, type CredenciaisIntelligence } from '../pom/intelligence/core/intelligence.page';
import { obterCredenciaisParaPerfilIntelligence } from '../utils/auth/intelligence';
import { gerarMassaDeBuscaComDadosDoSmart } from '../utils/provisioning/intelligence';
import { lerMassaBusca, type ArquivoMassaBusca } from '../utils/data/intelligence';

export type PerfilCucumber = 'admin' | 'view-only' | 'sem-permissao';

let navegadorCompartilhado: Browser | undefined;
let massaDaExecucao: Promise<ArquivoMassaBusca> | undefined;

async function navegador(): Promise<Browser> {
  if (!navegadorCompartilhado) {
    const headless = !['0', 'false', 'no'].includes(String(process.env.PW_HEADLESS || 'true').toLowerCase());
    navegadorCompartilhado = await chromium.launch({ headless });
  }
  return navegadorCompartilhado;
}

function deveReutilizarMassa(): boolean {
  return ['1', 'true', 'yes', 'sim'].includes(
    String(process.env.INTELLIGENCE_REUTILIZAR_MASSA || '').trim().toLowerCase(),
  );
}

export class IntelligenceWorld extends World {
  perfil?: PerfilCucumber;
  caseId?: string;
  page?: Page;
  private context?: BrowserContext;
  private requestContext?: APIRequestContext;
  private pageObject?: IntelligencePage;
  readonly state = new Map<string, unknown>();

  constructor(options: IWorldOptions) {
    super(options);
  }

  async api(): Promise<APIRequestContext> {
    this.requestContext ??= await request.newContext();
    return this.requestContext;
  }

  async pagina(): Promise<Page> {
    if (!this.page) {
      this.context = await (await navegador()).newContext();
      this.page = await this.context.newPage();
    }
    return this.page;
  }

  async intelligence(): Promise<IntelligencePage> {
    this.pageObject ??= new IntelligencePage(await this.pagina());
    return this.pageObject;
  }

  async garantirMassa(): Promise<ArquivoMassaBusca> {
    if (!massaDaExecucao) {
      validarAmbienteIntegracao();
      if (deveReutilizarMassa()) {
        const massaExistente = lerMassaBusca(true);
        if (!massaExistente) {
          throw new Error(
            'BLOQUEADO: INTELLIGENCE_REUTILIZAR_MASSA=true, mas o arquivo de massa nao existe. '
            + 'A fase admin precisa gerar a massa antes das fases view-only/no-access.',
          );
        }
        console.log('INTELLIGENCE_MASSA|mode=reuse|source=file');
        massaDaExecucao = Promise.resolve(massaExistente);
      } else {
        massaDaExecucao = gerarMassaDeBuscaComDadosDoSmart(await this.api());
      }
    }
    return massaDaExecucao;
  }

  credenciaisAdmin(): CredenciaisIntelligence {
    const usuario = process.env.INTELLIGENCE_ADMIN_USERNAME?.trim();
    const senha = process.env.INTELLIGENCE_ADMIN_PASSWORD?.trim();
    if (!usuario || !senha) throw new Error('CONFIGURACAO: credenciais administrativas ausentes.');
    return { usuario, senha };
  }

  async credenciaisViewOnly(): Promise<CredenciaisIntelligence> {
    return obterCredenciaisParaPerfilIntelligence(await this.api(), 'view-only');
  }

  credenciaisSemPermissao(): CredenciaisIntelligence {
    const usuario = process.env.INT_100_SEM_PERMISSAO_USERNAME?.trim();
    const senha = process.env.INT_100_SEM_PERMISSAO_PASSWORD?.trim();
    if (!usuario || !senha) throw new Error('CONFIGURACAO: credenciais da conta sem permissao ausentes.');
    return { usuario, senha };
  }

  guardar<T>(chave: string, valor: T): void {
    this.state.set(chave, valor);
  }

  obter<T>(chave: string): T {
    if (!this.state.has(chave)) throw new Error(`AUTOMATION ERROR: estado '${chave}' nao foi preparado pelo cenário.`);
    return this.state.get(chave) as T;
  }

  async registrarCaso(id: string, objetivo: string): Promise<void> {
    this.caseId = id;
    await this.attach(JSON.stringify({ id, objetivo }, null, 2), 'application/json');
  }

  async encerrarCenario(): Promise<void> {
    await this.context?.close().catch(() => undefined);
    await this.requestContext?.dispose().catch(() => undefined);
    this.context = undefined;
    this.requestContext = undefined;
    this.page = undefined;
    this.pageObject = undefined;
    this.state.clear();
  }
}

export async function encerrarNavegadorCompartilhado(): Promise<void> {
  await navegadorCompartilhado?.close().catch(() => undefined);
  navegadorCompartilhado = undefined;
}

setWorldConstructor(IntelligenceWorld);
