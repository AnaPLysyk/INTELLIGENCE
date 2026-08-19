import { expect, test } from '@playwright/test';

import { criarCenarioBDD } from '../../../support/functions/comum/bdd.steps';
import { obterCredenciaisParaPerfilIntelligence } from '../../../support/functions/api/intelligence/resolver-perfil-acesso.flow';
import { IntelligencePage } from '../../../support/functions/ui/intelligence/intelligence.page';
import { obterValorObrigatorioDaMassa } from '../../../support/massas/dados/intelligence.busca.massa';


const RELEASE = '5.5.0.5062';
const TAGS = ['@regression', '@ui', '@intelligence', '@negative', '@release-5.5.0.5062'];

const RELEASE_INT_100 = 'SEM-FIX-VERSION';
const TAGS_INT_100 = [
  '@regression',
  '@ui',
  '@intelligence',
  '@negative',
  '@release-unassigned',
];

function obterCredenciaisAdministrativas(): { usuario: string; senha: string } {
  const usuario = process.env.INTELLIGENCE_ADMIN_USERNAME?.trim();
  const senha = process.env.INTELLIGENCE_ADMIN_PASSWORD?.trim();
  if (!usuario || !senha) throw new Error('CONFIGURACAO: credenciais administrativas ausentes.');
  return { usuario, senha };
}

function obterCredenciaisSemPermissao(): { usuario: string; senha: string } {
  const usuario =
    process.env.INT_100_SEM_PERMISSAO_USERNAME?.trim();

  const senha =
    process.env.INT_100_SEM_PERMISSAO_PASSWORD?.trim();

  if (!usuario || !senha) {
    throw new Error(
      'CONFIGURACAO: credenciais da conta sem permissao ausentes.'
    );
  }

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
    '[INT-100-R3] Bloqueia as rotas de busca no acesso somente leitura',
    { tag: [...TAGS_INT_100, '@int-100', '@viewonly', '@search'] },
    async ({ page, request }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      await intelligence.instalarMonitorBuscaTransitoriaViewOnly();
      const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_100_TGUID);

      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-100-R3', release: RELEASE_INT_100, objetivo: 'Bloquear a raiz e as rotas de busca para o perfil somente leitura',
      });
      const credenciais = await bdd.dado('existe uma conta com perfil somente leitura', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'));
      await bdd.e('essa conta está autenticada na raiz', () => intelligence.autenticarComCredenciais(credenciais));
      await bdd.entao('a raiz apresenta o aviso de acesso somente por URL', () => intelligence.validarTelaViewOnly());
      await bdd.e('a busca não aparece nem transitoriamente durante o login', () =>
        intelligence.validarAusenciaDeFlashDaBusca('o login do view-only'));

      await intelligence.limparEventosBuscaTransitoriaViewOnly();

      await bdd.quando('recarrega a página', () => page.reload({ waitUntil: 'domcontentloaded' }));
      await bdd.entao('o aviso continua visível após o F5', () => intelligence.validarTelaViewOnly());
      await bdd.e('a busca não aparece nem transitoriamente após o F5', () =>
        intelligence.validarAusenciaDeFlashDaBusca('o reload da tela view-only'));

      await bdd.quando('tenta abrir diretamente a rota de busca', () => intelligence.abrirRotaBusca());
      await bdd.entao('a rota de busca também apresenta o aviso view-only', () => intelligence.validarTelaViewOnly());

      await bdd.quando('tenta abrir diretamente a URL real de resultados com parâmetros', () =>
        intelligence.abrirRotaBuscaComParametros('TGUID', tguid));
      await bdd.entao('a URL parametrizada de resultados também apresenta o aviso view-only', () =>
        intelligence.validarTelaViewOnly());
    },
  );

  test(
    '[INT-100-I7] Retorna da página 404 para a tela informativa',
    { tag: [...TAGS_INT_100, '@int-100', '@viewonly', '@navigation', '@not-found'] },
    async ({ page, request }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-100-I7', release: RELEASE_INT_100, objetivo: 'Garantir que Voltar na pagina 404 retorne o view-only para a tela informativa',
      });
      const credenciais = await bdd.dado('existe uma conta com perfil somente leitura', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'));
      await bdd.e('essa conta está autenticada', () => intelligence.autenticarComCredenciais(credenciais));
      await bdd.quando('acessa uma rota inexistente', () => intelligence.abrirPaginaNaoEncontrada());
      await bdd.e('seleciona Voltar na página não encontrada', () => intelligence.voltarDaPaginaNaoEncontrada());
      await bdd.entao('a aplicação retorna para a tela informativa do modo somente leitura', () =>
        intelligence.validarTelaViewOnly());
    },
  );

  test(
    '[INT-100-I3] Redireciona perfil inexistente para a tela informativa',
    { tag: [...TAGS_INT_100, '@int-100', '@viewonly', '@profile', '@not-found'] },
    async ({ page, request }, testInfo) => {
      const intelligence = new IntelligencePage(page);
      const pguidInexistente = crypto.randomUUID().toUpperCase();

      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-100-I3', release: RELEASE_INT_100, objetivo: 'Tratar o deep-link de perfil inexistente no modo somente leitura',
      });
      const credenciais = await bdd.dado('existe uma conta com perfil somente leitura e um PGUID inexistente', async () => {
        await testInfo.attach('pguid-inexistente.json', {
          body: JSON.stringify({ pguid: pguidInexistente, origem: 'UUID aleatorio gerado para o cenario' }, null, 2),
          contentType: 'application/json',
        });
        return obterCredenciaisParaPerfilIntelligence(request, 'view-only');
      });
      await bdd.e('essa conta está autenticada', () => intelligence.autenticarComCredenciais(credenciais));
      await bdd.quando('tenta abrir diretamente um perfil inexistente pelo PGUID', async () => {
        const respostaPerfil = page.waitForResponse(
          (response) =>
            response.request().method() === 'GET'
            && response.url().includes(`/service/profile/person/${pguidInexistente}`),
          { timeout: 30_000 },
        );
        await intelligence.abrirDetalhesDoPerfilPorPguid(pguidInexistente);
        await respostaPerfil;
      });

      await bdd.entao('a aplicação retorna para a tela informativa do modo somente leitura', async () => {
        await expect.soft(
          page.getByText(/a busca n[aã]o est[aá] dispon[ií]vel para o seu usu[aá]rio/i).first(),
          'O perfil inexistente deve retornar para a tela informativa view-only.',
        ).toBeVisible({ timeout: 10_000 });

        await expect.soft(
          page.getByText(/acesse transa[cç][oõ]es e perfis diretamente pela url/i).first(),
          'A orientação de acesso direto por URL deve permanecer visível.',
        ).toBeVisible({ timeout: 10_000 });
      });

      await bdd.e('a indicação de perfil não encontrado é preservada', async () => {
        await expect.soft(
          page.getByText(/perfil.*n[aã]o encontrado|n[aã]o encontrado|nenhum resultado encontrado|not found/i).first(),
          'O deep-link inexistente deve preservar uma indicação de que o perfil não foi encontrado.',
        ).toBeVisible({ timeout: 10_000 });
      });
    },
  );
  test(
    '[UI-NEG-AUTH-NOACCESS-01] Nega login para conta sem permissão do Intelligence',
    {
      tag: [
        '@regression',
        '@ui',
        '@intelligence',
        '@negative',
        '@security',
        '@authentication',
        '@no-access',
        '@release-unassigned',
      ],
    },
    async ({ page }, testInfo) => {
      const intelligence = new IntelligencePage(page);

      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'DOC-INTELLIGENCE-AUTH',
        release: 'SEM-FIX-VERSION',
        objetivo: 'Impedir sessão para uma conta sem permissão do Intelligence',
      });

      const credenciais = await bdd.dado(
        'existe uma conta LDAP sem permissão do Intelligence',
        () => obterCredenciaisSemPermissao(),
      );

      await bdd.quando(
        'essa conta tenta autenticar na aplicação',
        () =>
          intelligence.validarAutenticacaoNegadaComCredenciais(
            credenciais
          ),
      );

      await bdd.entao(
        'nenhuma sessão do Intelligence é criada',
        async () => {},
      );
    },
  );

  test(
    '[INT-33-SPEC-01] Exige critérios verificáveis para padronização e validação de campos',
    { tag: ['@ui', '@intelligence', '@negative', '@int-33', '@introduced-in-1.8.1', '@coverage-gap', '@specification'] },
    async ({}, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-33', release: '1.8.1', objetivo: 'Não inventar regra de padronização sem critérios observáveis',
      });
      await bdd.dado('que o ticket não informa os campos nem as regras de validação', async () => {
        throw new Error(
          'BLOQUEADO: INT-33 não informa quais campos devem ser convertidos para maiúsculas nem quais validações são esperadas.',
        );
      });
    },
  );

  test(
    '[INT-30-NIST-02] Exige regra do tipo de imagem para validar o NIST exportado',
    { tag: ['@ui', '@intelligence', '@negative', '@int-30', '@introduced-in-2.0.0', '@coverage-gap', '@export', '@nist'] },
    async ({}, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-30', release: '2.0.0', objetivo: 'Validar o tipo de imagem interno do arquivo NIST exportado',
      });
      await bdd.dado('que a Release Note exige exportar NIST com o tipo correto de imagem', async () => {
        throw new Error(
          'BLOQUEADO: INT-30 não informa no Jira qual tipo de imagem deve existir no NIST nem a regra de inspeção do arquivo.',
        );
      });
    },
  );
});
