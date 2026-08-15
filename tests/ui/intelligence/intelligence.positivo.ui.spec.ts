import { expect, test } from '@playwright/test';

import { criarCenarioBDD } from '../../../support/functions/comum/bdd.steps';
import { obterCredenciaisParaPerfilIntelligence } from '../../../support/functions/api/intelligence/resolver-perfil-acesso.flow';
import { IntelligencePage, type CredenciaisIntelligence } from '../../../support/functions/ui/intelligence/intelligence.page';
import { lerMassaBusca, obterValorObrigatorioDaMassa } from '../../../support/massas/dados/intelligence.busca.massa';

const RELEASE = '5.5.0.5062';
const TAGS = ['@regression', '@ui', '@intelligence', '@positive', '@int-100', '@release-5.5.0.5062'];

function obterCredenciaisAdministrativas(): CredenciaisIntelligence {
  const usuario = process.env.INTELLIGENCE_ADMIN_USERNAME?.trim();
  const senha = process.env.INTELLIGENCE_ADMIN_PASSWORD?.trim();
  if (!usuario || !senha) throw new Error('CONFIGURACAO: credenciais administrativas ausentes.');
  return { usuario, senha };
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
    { tag: [...TAGS, '@smoke', '@admin', '@search'] },
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
    { tag: [...TAGS, '@smoke', '@admin', '@deeplink', '@transaction'] },
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
    { tag: [...TAGS, '@viewonly', '@readonly', '@transaction'] },
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
    { tag: [...TAGS, '@viewonly', '@readonly', '@profile'] },
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
});
