import { expect, test } from '@playwright/test';

import { criarCenarioBDD } from '../../../support/functions/comum/bdd.steps';
import {
  autenticarIntelligenceApi,
  buscarPerfisIntelligence,
  contemValor,
  extrairCamposBusca,
  extrairContagem,
  extrairItens,
  listarCamposBuscaIntelligence,
  obterDetalhesPerfilIntelligence,
  obterDetalhesTransacaoIntelligence,
  payloadDaMassa,
} from '../../../support/functions/api/intelligence/intelligence.client';
import { obterCredenciaisParaPerfilIntelligence } from '../../../support/functions/api/intelligence/resolver-perfil-acesso.flow';
import { lerMassaBusca, obterValorObrigatorioDaMassa } from '../../../support/massas/dados/intelligence.busca.massa';

const RELEASE = '5.5.0.5062';
const TAGS = ['@regression', '@api', '@intelligence', '@positive', '@search', '@release-5.5.0.5062'];

const RELEASE_INT_100 = 'SEM-FIX-VERSION';
const TAGS_INT_100 = ['@regression', '@api', '@intelligence', '@positive', '@release-unassigned'];
const CASOS = [
  { id: 'API-POS-CPF-01', tipo: 'cpf', descricao: 'CPF' },
  { id: 'API-POS-EXTERNAL-01', tipo: 'EXTERNAL.ID', descricao: 'ID externo' },
  { id: 'API-POS-BIRTHDATE-01', tipo: 'birthdate', descricao: 'data de nascimento' },
  { id: 'API-POS-NAME-01', tipo: 'name', descricao: 'nome' },
  { id: 'API-POS-CIB-01', tipo: 'cib', descricao: 'CIB' },
] as const;

test.describe('Intelligence API — buscas com resultado', () => {
  for (const caso of CASOS) {
    test(
      `[${caso.id}] Retorna perfil ao buscar por ${caso.descricao}`,
      { tag: [...TAGS, ...(caso.tipo === 'cpf' ? ['@smoke'] : [])] },
      async ({ request }, testInfo) => {
        const entrada = lerMassaBusca().buscas[caso.tipo];
        if (!entrada) throw new Error(`BLOQUEADO: nao existe massa pesquisavel para ${caso.tipo}.`);

        const bdd = await criarCenarioBDD(testInfo, {
          ticket: caso.id,
          release: RELEASE,
          objetivo: `Validar count e list da busca por ${caso.descricao}`,
        });
        const sessionGuid = await bdd.dado('um administrador possui uma sessão autenticada', () =>
          autenticarIntelligenceApi(request));
        const resultado = await bdd.quando(`a API pesquisa o valor real de ${caso.descricao}`, () =>
          buscarPerfisIntelligence(request, payloadDaMassa(entrada), sessionGuid));
        await bdd.entao('count e list respondem com sucesso e retornam o valor consultado', () => {
          expect(resultado.count.response.ok(), `count retornou ${resultado.count.response.status()}`).toBe(true);
          expect(resultado.list.response.ok(), `list retornou ${resultado.list.response.status()}`).toBe(true);
          const total = extrairContagem(resultado.count.body);
          const itens = extrairItens(resultado.list.body);
          expect(total, 'A contagem deve ser maior que zero.').toBeGreaterThan(0);
          expect(itens.length, 'A lista deve conter pelo menos um perfil.').toBeGreaterThan(0);
          expect(total, 'A contagem não pode ser menor que a página retornada.').toBeGreaterThanOrEqual(itens.length);
          expect(contemValor(itens, entrada.valor), 'O resultado deve conter o valor pesquisado.').toBe(true);
        });
      },
    );
  }

  test(
    '[API-POS-FIELDS-01] Lista os campos configurados disponíveis para pesquisa',
    { tag: [...TAGS, '@documentation', '@int-23', '@fields'] },
    async ({ request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-23', release: RELEASE, objetivo: 'Validar o contrato do catálogo de campos de busca',
      });
      const sessionGuid = await bdd.dado('um administrador possui uma sessão autenticada', () =>
        autenticarIntelligenceApi(request));
      const resposta = await bdd.quando('consulta a API fields/list', () =>
        listarCamposBuscaIntelligence(request, sessionGuid));
      await bdd.entao('a API retorna campos com name, kind e type', () => {
        expect(resposta.response.status(), 'fields/list deve responder com sucesso.').toBe(200);
        const campos = extrairCamposBusca(resposta.body);
        expect(campos.length, 'O catálogo deve possuir ao menos um campo configurado.').toBeGreaterThan(0);
        expect(
          new Set(campos.map((campo) => campo.name.toLocaleLowerCase())).size,
          'Os nomes técnicos dos campos devem ser únicos.',
        ).toBe(campos.length);
      });
    },
  );

  test(
    '[API-POS-PAGINATION-01] Respeita o tamanho solicitado na página de resultados',
    { tag: [...TAGS, '@documentation', '@pagination'] },
    async ({ request }, testInfo) => {
      const entrada = lerMassaBusca().buscas.cpf;
      if (!entrada) throw new Error('BLOQUEADO: não existe massa pesquisável por CPF.');
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'DOC-INTELLIGENCE-INTEGRATION', release: RELEASE, objetivo: 'Validar a paginação de profile/list',
      });
      const sessionGuid = await bdd.dado('um administrador possui uma sessão autenticada', () =>
        autenticarIntelligenceApi(request));
      const resultado = await bdd.quando('solicita a primeira página com tamanho igual a um', () =>
        buscarPerfisIntelligence(request, payloadDaMassa(entrada), sessionGuid, { first: 0, size: 1 }));
      await bdd.entao('a lista retorna no máximo um item sem divergir da contagem', () => {
        expect(resultado.count.response.ok()).toBe(true);
        expect(resultado.list.response.ok()).toBe(true);
        const total = extrairContagem(resultado.count.body);
        const itens = extrairItens(resultado.list.body);
        expect(itens.length).toBeLessThanOrEqual(1);
        expect(total).toBeGreaterThanOrEqual(itens.length);
      });
    },
  );

  test(
    '[API-POS-TGUID-01] Retorna os detalhes da transação consultada por TGUID',
    { tag: [...TAGS, '@documentation', '@int-17', '@transaction'] },
    async ({ request }, testInfo) => {
      const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_100_TGUID);
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-17', release: RELEASE, objetivo: 'Validar a visualização de uma transação pela API',
      });
      const sessionGuid = await bdd.dado('um administrador possui uma sessão autenticada', () =>
        autenticarIntelligenceApi(request));
      const resposta = await bdd.quando('consulta os detalhes pelo TGUID conhecido', () =>
        obterDetalhesTransacaoIntelligence(request, tguid, sessionGuid));
      await bdd.entao('a API retorna sucesso e mantém o TGUID na resposta', () => {
        expect(resposta.response.status()).toBe(200);
        expect(contemValor(resposta.body, tguid), 'Os detalhes devem conter o TGUID consultado.').toBe(true);
      });
    },
  );

  test(
    '[API-POS-PROFILE-VIEWONLY-01] Permite ao perfil somente leitura consultar o perfil por PGUID',
    { tag: [...TAGS_INT_100, '@int-100', '@viewonly', '@profile'] },
    async ({ request }, testInfo) => {
      const pguid = obterValorObrigatorioDaMassa('PGUID', process.env.INT_100_PGUID);
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-100-I2', release: RELEASE_INT_100, objetivo: 'Permitir a leitura do perfil para o usuario view-only',
      });
      const credenciais = await bdd.dado('existe uma conta com perfil somente leitura', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'));
      const sessionGuid = await bdd.e('essa conta possui uma sessão autenticada', () =>
        autenticarIntelligenceApi(request, credenciais));
      const resposta = await bdd.quando('consulta o perfil pelo PGUID conhecido', () =>
        obterDetalhesPerfilIntelligence(request, pguid, sessionGuid));
      await bdd.entao('a API carrega o perfil solicitado para o usuario view-only', () => {
        expect(resposta.response.status(), 'O backend deve carregar o perfil solicitado para o usuario view-only.').toBe(200);
      });
    },
  );
});
