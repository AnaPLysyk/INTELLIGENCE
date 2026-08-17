import { expect, test } from '@playwright/test';

import { criarCenarioBDD } from '../../../support/functions/comum/bdd.steps';
import { obterCredenciaisParaPerfilIntelligence } from '../../../support/functions/api/intelligence/resolver-perfil-acesso.flow';
import { IntelligencePage } from '../../../support/functions/ui/intelligence/intelligence.page';
import { obterValorObrigatorioDaMassa } from '../../../support/massas/dados/intelligence.busca.massa';

const RELEASE = '5.5.0.5062';
const TAGS = ['@regression', '@ui', '@intelligence', '@negative', '@release-5.5.0.5062'];

function obterCredenciaisAdministrativas(): { usuario: string; senha: string } {
  const usuario = process.env.INTELLIGENCE_ADMIN_USERNAME?.trim();
  const senha = process.env.INTELLIGENCE_ADMIN_PASSWORD?.trim();
  if (!usuario || !senha) throw new Error('CONFIGURACAO: credenciais administrativas ausentes.');
  return { usuario, senha };
}

test.describe('Intelligence UI — acesso restrito', () => {
  test.setTimeout(120_000);

  test(
    '[UI-NEG-EMPTY-01] Não executa pesquisa com valor vazio',
    { tag: [...TAGS, '@documentation', '@validation'] },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'DOC-INTELLIGENCE-SEARCH', release: RELEASE, objetivo: 'Impedir consulta vazia da base',
      });
      await bdd.dado('um administrador está autenticado na tela de busca', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      const navegacao = await bdd.quando('tenta pesquisar mantendo o valor vazio', () =>
        intelligence.tentarPesquisarComValorVazio());
      await bdd.entao('a aplicação não navega nem submete a busca', () =>
        expect(navegacao.urlDepois).toBe(navegacao.urlAntes));
    },
  );

  test(
    '[UI-DES-XSS-01] Não executa JavaScript informado no campo de pesquisa',
    { tag: [...TAGS, '@destructive', '@security', '@robustness'] },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const payload = '<script>alert("intelligence-xss")</script>';
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'SEC-INTELLIGENCE-XSS', release: RELEASE, objetivo: 'Neutralizar script no campo de busca',
      });
      await bdd.dado('um administrador está autenticado na tela de busca', () =>
        intelligence.autenticarComCredenciais(obterCredenciaisAdministrativas()));
      const resultado = await bdd.quando('pesquisa um valor contendo uma tag script', () =>
        intelligence.submeterEntradaHostilNaBusca(payload));
      await bdd.entao('nenhum diálogo ou script injetado é executado', () => {
        expect(resultado.dialogoAberto).toBe(false);
        expect(resultado.scriptInjetado).toBe(false);
      });
    },
  );

  test(
    '[INT-100-R3] Oculta a busca no acesso somente leitura',
    { tag: [...TAGS, '@int-100', '@viewonly', '@search'] },
    async ({ page, request }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_100_TGUID);
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-100-R3', release: RELEASE, objetivo: 'Remover a busca do perfil somente leitura',
      });
      const credenciais = await bdd.dado('existe uma conta com perfil somente leitura', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'));
      await bdd.e('essa conta está autenticada', () => intelligence.autenticarComCredenciais(credenciais));
      await bdd.quando('abre o deep-link de uma transação', () => intelligence.abrirDetalhesDaTransacaoPorTguid(tguid));
      await bdd.entao('o formulário de busca não está disponível', () => intelligence.validarBuscaIndisponivel());
    },
  );

  test(
    '[INT-100-I8] Nega o deep-link da transação sem permissão',
    { tag: [...TAGS, '@int-100', '@security', '@transaction'] },
    async ({ page, request }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_100_TGUID);
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-100-I8', release: RELEASE, objetivo: 'Impedir exposição da transação sem permissão',
      });
      const credenciais = await bdd.dado('existe uma conta sem acesso ao Intelligence', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'sem-permissao'));
      await bdd.e('essa conta está autenticada', () => intelligence.autenticarComCredenciais(credenciais));
      await bdd.quando('tenta abrir o deep-link da transação', () => intelligence.abrirDetalhesDaTransacaoPorTguid(tguid));
      await bdd.entao('o TGUID solicitado não aparece na página', () => intelligence.validarTransacaoNaoExposta(tguid));
    },
  );
});
