import { expect, test } from '@playwright/test';

import { criarCenarioBDD } from '../../../support/functions/comum/bdd.steps';
import { obterCredenciaisParaPerfilIntelligence } from '../../../support/functions/api/intelligence/resolver-perfil-acesso.flow';
import { IntelligencePage, type CredenciaisIntelligence } from '../../../support/functions/ui/intelligence/intelligence.page';
import { lerMassaBusca, obterValorObrigatorioDaMassa } from '../../../support/massas/dados/intelligence.busca.massa';

const RELEASE = '5.5.0.5062';
const TAGS = ['@regression', '@ui', '@intelligence', '@positive', '@release-5.5.0.5062'];

function obterCredenciaisAdministrativas(): CredenciaisIntelligence {
  const usuario = process.env.INTELLIGENCE_ADMIN_USERNAME?.trim();
  const senha = process.env.INTELLIGENCE_ADMIN_PASSWORD?.trim();
  if (!usuario || !senha) throw new Error('CONFIGURACAO: credenciais administrativas ausentes.');
  return { usuario, senha };
}

function envObrigatoria(nome: string): string {
  const valor = process.env[nome]?.trim();
  if (!valor) throw new Error(`BLOQUEADO: configure ${nome} com a massa especifica do ticket.`);
  return valor;
}

test.describe('Intelligence UI — acesso permitido', () => {
  test.setTimeout(120_000);

  test(
    '[UI-POS-FIELDS-01] Exibe opções de pesquisa sem rótulos duplicados',
    { tag: [...TAGS, '@documentation', '@int-23', '@int-98', '@fields'] },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-23, INT-98', release: RELEASE, objetivo: 'Evitar opções ambíguas no catálogo visual de busca',
      });
      await bdd.dado('um administrador está autenticado', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      const opcoes = await bdd.quando('lê as opções visíveis do seletor de busca', () =>
        intelligence.lerOpcoesDoSeletorDeBusca());
      await bdd.entao('TGUID, PGUID e os rótulos de campo aparecem uma única vez', () => {
        const normalizar = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const rotulos = opcoes.map((opcao) => normalizar(opcao.rotulo)).filter(Boolean);
        expect(new Set(rotulos).size, 'O usuário não deve ver opções de busca com o mesmo rótulo.').toBe(rotulos.length);
        expect(opcoes.some((opcao) => normalizar(`${opcao.valor} ${opcao.rotulo}`).includes('tguid'))).toBe(true);
        expect(opcoes.some((opcao) => normalizar(`${opcao.valor} ${opcao.rotulo}`).includes('pguid'))).toBe(true);
      });
    },
  );

  test(
    '[INT-100-I5] Mantém a busca disponível para acesso completo',
    { tag: [...TAGS, '@int-100', '@smoke', '@admin', '@search'] },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-100-I5', release: RELEASE, objetivo: 'Preservar a busca para acesso completo',
      });
      await bdd.dado('um administrador está autenticado', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      await bdd.entao('o seletor Chave e o botão Pesquisar estão habilitados', () =>
        intelligence.validarBuscaDisponivel());
    },
  );

  test(
    '[INT-100-BASELINE] Abre os detalhes da transação pelo TGUID',
    { tag: [...TAGS, '@int-100', '@smoke', '@admin', '@deeplink', '@transaction'] },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_100_TGUID);
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-100-BASELINE', release: RELEASE, objetivo: 'Resolver o deep-link administrativo por TGUID',
      });
      await bdd.dado('um administrador está autenticado', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      await bdd.quando('abre o deep-link da transação pelo TGUID', () =>
        intelligence.abrirDetalhesDaTransacaoPorTguid(tguid));
      await bdd.entao('a página exibe Dados da transação e o TGUID solicitado', () =>
        intelligence.validarDetalhesDaTransacaoCarregados(tguid));
    },
  );

  test(
    '[INT-17-PGUID-UI] Abre pelo PGUID o perfil vinculado à transação',
    { tag: [...TAGS, '@documentation', '@int-17', '@admin', '@deeplink', '@profile'] },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const transacao = lerMassaBusca().buscas.TGUID;
      if (!transacao?.valor || !transacao.esperado.pguid) {
        throw new Error('BLOQUEADO: a massa de TGUID não informa o PGUID vinculado.');
      }
      const tguid = transacao.valor;
      const pguid = transacao.esperado.pguid;
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-17', release: RELEASE, objetivo: 'Navegar da transação para o perfil pelo link do PGUID',
      });
      await bdd.dado('um administrador está autenticado', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      await bdd.quando('abre a transação e seleciona o link do PGUID vinculado', () =>
        intelligence.abrirPerfilVinculadoNaTransacao(tguid, pguid));
      await bdd.entao('a navegação reconhece o perfil ou o estado documentado sem resultados', () =>
        intelligence.validarNavegacaoDoPerfilReconhecida());
    },
  );

  test(
    '[INT-100-I1] Exibe a transação sem controles de escrita',
    { tag: [...TAGS, '@int-100', '@viewonly', '@readonly', '@transaction'] },
    async ({ page, request }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_100_TGUID);
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-100-I1', release: RELEASE, objetivo: 'Abrir transação em modo somente leitura',
      });
      const credenciais = await bdd.dado('existe uma conta com perfil somente leitura', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'));
      await bdd.e('essa conta está autenticada', () => intelligence.autenticarComCredenciais(credenciais));
      await bdd.quando('abre os detalhes da transação', () => intelligence.abrirDetalhesDaTransacaoPorTguid(tguid));
      await bdd.entao('nenhum controle de escrita está habilitado', () =>
        intelligence.validarAusenciaDeControlesDeEscrita());
    },
  );

  test(
    '[INT-100-I2] Exibe o perfil sem controles de escrita',
    { tag: [...TAGS, '@int-100', '@viewonly', '@readonly', '@profile'] },
    async ({ page, request }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const pguid = obterValorObrigatorioDaMassa('PGUID', process.env.INT_100_PGUID);
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-100-I2', release: RELEASE, objetivo: 'Abrir perfil em modo somente leitura',
      });
      const credenciais = await bdd.dado('existe uma conta com perfil somente leitura', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'));
      await bdd.e('essa conta está autenticada', () => intelligence.autenticarComCredenciais(credenciais));
      await bdd.quando('abre os detalhes do perfil', () => intelligence.abrirDetalhesDoPerfilPorPguid(pguid));
      await bdd.entao('nenhum controle de escrita está habilitado', () =>
        intelligence.validarAusenciaDeControlesDeEscrita());
    },
  );

  test(
    '[INT-31-UI-01] Não disponibiliza campos de chave para edição da transação',
    { tag: [...TAGS, '@int-31', '@introduced-in-1.8.1', '@editing', '@biographics'] },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_31_TGUID);
      const chave = envObrigatoria('INT_31_KEY_FIELD_LABEL');
      const biografico = envObrigatoria('INT_31_BIOGRAPHIC_FIELD_LABEL');
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-31', release: '1.8.1', objetivo: 'Renderizar na edição somente campos biográficos',
      });
      await bdd.dado('um administrador está autenticado', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      await bdd.e('uma transação válida está aberta', async () => {
        await intelligence.abrirDetalhesDaTransacaoPorTguid(tguid);
        await intelligence.validarDetalhesDaTransacaoCarregados(tguid);
      });
      await bdd.quando('abre a edição da transação', () => intelligence.abrirEdicaoAtual());
      await bdd.entao('o campo de chave não está disponível para edição', () =>
        intelligence.validarCampoNaoDisponivelParaEdicao(chave));
      await bdd.e('um campo biográfico continua disponível para edição', () =>
        intelligence.validarCampoDisponivelParaEdicao(biografico));
    },
  );

  test(
    '[INT-40-UI-01] Mantém o valor do campo de data ao editar uma transação',
    { tag: [...TAGS, '@int-40', '@introduced-in-1.8.2', '@editing', '@date'] },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_40_TGUID);
      const campoData = envObrigatoria('INT_40_DATE_FIELD_LABEL');
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-40', release: '1.8.2', objetivo: 'Preservar o valor atual do biográfico de data na transação',
      });
      await bdd.dado('um administrador está autenticado', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      await bdd.e('uma transação com campo biográfico de data está aberta', async () => {
        await intelligence.abrirDetalhesDaTransacaoPorTguid(tguid);
        await intelligence.validarDetalhesDaTransacaoCarregados(tguid);
      });
      await bdd.quando('abre a edição da transação', () => intelligence.abrirEdicaoAtual());
      await bdd.entao('o campo de data permanece preenchido', () =>
        intelligence.validarCampoDataPreenchidoNaEdicao(campoData));
    },
  );

  test(
    '[INT-40-UI-02] Mantém o valor do campo de data ao editar um perfil',
    { tag: [...TAGS, '@int-40', '@introduced-in-1.8.2', '@editing', '@date', '@profile'] },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const pguid = obterValorObrigatorioDaMassa('PGUID', process.env.INT_40_PGUID);
      const campoData = envObrigatoria('INT_40_DATE_FIELD_LABEL');
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-40', release: '1.8.2', objetivo: 'Preservar o valor atual do biográfico de data no perfil',
      });
      await bdd.dado('um administrador está autenticado', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      await bdd.e('um perfil com campo biográfico de data está aberto', () =>
        intelligence.abrirDetalhesDoPerfilPorPguid(pguid));
      await bdd.quando('abre a edição do perfil', () => intelligence.abrirEdicaoAtual());
      await bdd.entao('o campo de data permanece preenchido', () =>
        intelligence.validarCampoDataPreenchidoNaEdicao(campoData));
    },
  );

  test(
    '[INT-32-UI-01] Oferece calendário para editar campo biográfico de data',
    { tag: [...TAGS, '@int-32', '@release-unassigned', '@editing', '@date'] },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_32_TGUID);
      const campoData = envObrigatoria('INT_32_DATE_FIELD_LABEL');
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-32', release: 'UNASSIGNED', objetivo: 'Disponibilizar calendário no biográfico de data',
      });
      await bdd.dado('um administrador está autenticado', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      await bdd.e('uma transação com campo biográfico de data está aberta', async () => {
        await intelligence.abrirDetalhesDaTransacaoPorTguid(tguid);
        await intelligence.validarDetalhesDaTransacaoCarregados(tguid);
      });
      await bdd.quando('abre a edição da transação', () => intelligence.abrirEdicaoAtual());
      await bdd.entao('o campo de data usa um controle com calendário', () =>
        intelligence.validarCampoDataComCalendarioNaEdicao(campoData));
    },
  );

  test(
    '[INT-24-UI-01] Exibe histórico de perfis anteriores quando previousHistory existe',
    { tag: [...TAGS, '@int-24', '@introduced-in-2.0.0', '@history', '@profile'] },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const pguid = obterValorObrigatorioDaMassa('PGUID', process.env.INT_24_PGUID);
      const pguidAnterior = envObrigatoria('INT_24_PREVIOUS_PGUID');
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-24', release: '2.0.0', objetivo: 'Exibir perfis anteriores que compõem o PGUID atual',
      });
      await bdd.dado('um administrador está autenticado', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      await bdd.quando('abre um perfil cuja resposta possui previousHistory', () =>
        intelligence.abrirDetalhesDoPerfilPorPguid(pguid));
      await bdd.entao('o histórico exibe o PGUID anterior esperado', () =>
        intelligence.validarHistoricoDePerfisAnteriores(pguidAnterior));
    },
  );

  test(
    '[INT-30-UI-01] Exporta o NIST da transação sem falha no navegador',
    { tag: [...TAGS, '@int-30', '@introduced-in-2.0.0', '@export', '@nist'] },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_30_TGUID);
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-30', release: '2.0.0', objetivo: 'Provar que a ação de exportação NIST gera um download',
      });
      await bdd.dado('um administrador está autenticado', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      await bdd.e('uma transação exportável está aberta', async () => {
        await intelligence.abrirDetalhesDaTransacaoPorTguid(tguid);
        await intelligence.validarDetalhesDaTransacaoCarregados(tguid);
      });
      const download = await bdd.quando('aciona a exportação NIST', () => intelligence.exportarNistDaTelaAtual());
      await bdd.entao('o navegador recebe um arquivo de exportação', () =>
        expect(download.suggestedFilename().trim().length).toBeGreaterThan(0));
    },
  );
});
