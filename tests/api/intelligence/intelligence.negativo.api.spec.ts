import { expect, test } from '@playwright/test';

import { criarCenarioBDD } from '../../../support/functions/comum/bdd.steps';
import {
  autenticarIntelligenceApi,
  buscarPerfisIntelligence,
  buscarPerfisIntelligenceComPayloadLivre,
  extrairContagem,
  extrairItens,
  listarCamposBuscaIntelligence,
  obterDetalhesPerfilIntelligence,
  obterDetalhesTransacaoIntelligence,
  payloadDaMassa,
  solicitarSessaoIntelligenceApi,
  type PayloadBuscaIntelligence,
} from '../../../support/functions/api/intelligence/intelligence.client';
import { obterCredenciaisParaPerfilIntelligence } from '../../../support/functions/api/intelligence/resolver-perfil-acesso.flow';
import { lerMassaBusca } from '../../../support/massas/dados/intelligence.busca.massa';

const RELEASE = '5.5.0.5062';
const TAGS = ['@regression', '@api', '@intelligence', '@negative', '@security', '@release-5.5.0.5062'];

const RELEASE_INT_100 = 'SEM-FIX-VERSION';
const TAGS_INT_100 = [
  '@regression',
  '@api',
  '@intelligence',
  '@negative',
  '@security',
  '@release-unassigned',
];
const PAYLOAD_SEM_DADO_REAL: PayloadBuscaIntelligence = {
  name: 'cpf',
  value: '00000000000',
  kind: 'KEY',
};

function validarStatusDaBusca(
  resultado: Awaited<ReturnType<typeof buscarPerfisIntelligence>>,
  statusEsperado: number,
): void {
  expect(resultado.count.response.status(), 'Status incorreto no endpoint count.').toBe(statusEsperado);
  expect(resultado.list.response.status(), 'Status incorreto no endpoint list.').toBe(statusEsperado);
}

function validarRespostaSemErroInterno(status: number, contexto: string): void {
  expect(status, `${contexto} nao deve provocar erro interno.`).toBeLessThan(500);
}

function validarBuscaHostilSemExposicao(
  resultado: Awaited<ReturnType<typeof buscarPerfisIntelligenceComPayloadLivre>>,
): void {
  validarRespostaSemErroInterno(resultado.count.response.status(), 'count');
  validarRespostaSemErroInterno(resultado.list.response.status(), 'list');
  if (resultado.count.response.ok()) expect(extrairContagem(resultado.count.body)).toBe(0);
  if (resultado.list.response.ok()) expect(extrairItens(resultado.list.body)).toHaveLength(0);
}

test.describe('Intelligence API — autorização da busca', () => {
  test(
    '[API-NEG-NOTFOUND-01] Retorna conjunto vazio para um valor inexistente',
    { tag: [...TAGS, '@documentation', '@search'] },
    async ({ request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'DOC-INTELLIGENCE-SEARCH', release: RELEASE, objetivo: 'Tratar busca autenticada sem resultados',
      });
      const sessionGuid = await bdd.dado('um administrador possui uma sessão autenticada', () =>
        autenticarIntelligenceApi(request));
      const resultado = await bdd.quando('pesquisa um CPF reservado como inexistente', () =>
        buscarPerfisIntelligence(request, PAYLOAD_SEM_DADO_REAL, sessionGuid));
      await bdd.entao('count e list respondem com sucesso e sem resultados', () => {
        validarStatusDaBusca(resultado, 200);
        expect(extrairContagem(resultado.count.body)).toBe(0);
        expect(extrairItens(resultado.list.body)).toHaveLength(0);
      });
    },
  );

  test(
    '[API-NEG-COMMON-04] Rejeita busca sem sessão autenticada',
    { tag: [...TAGS, '@smoke'] },
    async ({ request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'API-NEG-COMMON-04', release: RELEASE, objetivo: 'Impedir acesso anonimo à busca',
      });
      const resultado = await bdd.quando('count e list são chamados sem session-guid', () =>
        buscarPerfisIntelligence(request, PAYLOAD_SEM_DADO_REAL));
      await bdd.entao('os dois endpoints respondem 401', () => validarStatusDaBusca(resultado, 401));
    },
  );

  test(
    '[API-NEG-COMMON-05] Rejeita busca com sessão inválida',
    { tag: [...TAGS, '@smoke'] },
    async ({ request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'API-NEG-COMMON-05', release: RELEASE, objetivo: 'Rejeitar session-guid inválido',
      });
      const resultado = await bdd.quando('count e list recebem um session-guid inválido', () =>
        buscarPerfisIntelligence(request, PAYLOAD_SEM_DADO_REAL, 'session-guid-invalido'));
      await bdd.entao('os dois endpoints respondem 401', () => validarStatusDaBusca(resultado, 401));
    },
  );

  test(
    '[API-NEG-COMMON-06] Nega busca ao perfil somente leitura',
    { tag: [...TAGS_INT_100, '@viewonly', '@int-100'] },
    async ({ request }, testInfo) => {
      const entrada = ['cpf', 'EXTERNAL.ID', 'birthdate', 'name', 'cib']
        .map((tipo) => lerMassaBusca().buscas[tipo])
        .find((item) => item?.kind);
      if (!entrada) throw new Error('BLOQUEADO: nenhuma massa compativel com profile/list foi gerada.');

      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-100', release: RELEASE_INT_100, objetivo: 'Bloquear a busca para o perfil somente leitura',
      });
      const credenciais = await bdd.dado('existe uma conta com perfil somente leitura', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'));
      const sessionGuid = await bdd.e('essa conta possui uma sessão autenticada', () =>
        autenticarIntelligenceApi(request, credenciais));
      const resultado = await bdd.quando('a conta chama count e list diretamente', () =>
        buscarPerfisIntelligence(request, payloadDaMassa(entrada), sessionGuid));
      await bdd.entao('os dois endpoints respondem 403', () => validarStatusDaBusca(resultado, 403));
    },
  );

  test(
    '[API-NEG-PROFILE-NOTFOUND-01] Trata PGUID inexistente do perfil somente leitura sem erro interno',
    { tag: [...TAGS_INT_100, '@viewonly', '@int-100', '@profile', '@not-found'] },
    async ({ request }, testInfo) => {
      const pguidInexistente = crypto.randomUUID().toUpperCase();
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-100-I3', release: RELEASE_INT_100, objetivo: 'Tratar PGUID inexistente sem expor erro interno ao usuario view-only',
      });
      const credenciais = await bdd.dado('existe uma conta com perfil somente leitura', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'));
      const sessionGuid = await bdd.e('essa conta possui uma sessão autenticada', () =>
        autenticarIntelligenceApi(request, credenciais));
      const resposta = await bdd.quando('consulta um PGUID inexistente', () =>
        obterDetalhesPerfilIntelligence(request, pguidInexistente, sessionGuid));
      await bdd.entao('a API trata o perfil inexistente sem responder 500', () => {
        validarRespostaSemErroInterno(resposta.response.status(), 'profile/person');
      });
    },
  );

  test(
    '[API-NEG-LOGIN-01] Rejeita credenciais inválidas sem criar sessão',
    { tag: [...TAGS, '@authentication', '@documentation'] },
    async ({ request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'DOC-INTELLIGENCE-AUTH', release: RELEASE, objetivo: 'Rejeitar login com credenciais inválidas',
      });
      const resposta = await bdd.quando('envia usuário e senha deliberadamente inválidos', () =>
        solicitarSessaoIntelligenceApi(request, {
          username: `usuario-inexistente-${Date.now()}`,
          password: 'senha-invalida-regressao',
        }));
      await bdd.entao('a API responde com erro de autenticação controlado', () => {
        expect([400, 401, 403]).toContain(resposta.response.status());
      });
    },
  );

  test(
    '[API-NEG-LOGIN-02] Rejeita autenticação com campos vazios',
    { tag: [...TAGS, '@authentication', '@documentation'] },
    async ({ request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'DOC-INTELLIGENCE-AUTH', release: RELEASE, objetivo: 'Validar campos obrigatórios do login',
      });
      const resposta = await bdd.quando('envia usuário e senha vazios', () =>
        solicitarSessaoIntelligenceApi(request, { username: '', password: '' }));
      await bdd.entao('a API rejeita a entrada sem erro interno', () => {
        expect([400, 401, 403]).toContain(resposta.response.status());
      });
    },
  );

  test(
    '[API-NEG-FIELDS-AUTH-01] Protege o catálogo de campos sem sessão',
    { tag: [...TAGS, '@authentication', '@documentation', '@int-23'] },
    async ({ request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-23', release: RELEASE, objetivo: 'Exigir sessão para consultar fields/list',
      });
      const resposta = await bdd.quando('consulta fields/list sem session-guid', () =>
        listarCamposBuscaIntelligence(request));
      await bdd.entao('a API responde 401', () => expect(resposta.response.status()).toBe(401));
    },
  );

  test(
    '[API-NEG-FIELDS-AUTH-02] Protege o catálogo de campos com sessão inválida',
    { tag: [...TAGS, '@authentication', '@documentation', '@int-23'] },
    async ({ request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-23', release: RELEASE, objetivo: 'Rejeitar sessão inválida em fields/list',
      });
      const resposta = await bdd.quando('consulta fields/list com session-guid inválido', () =>
        listarCamposBuscaIntelligence(request, 'session-guid-invalido'));
      await bdd.entao('a API responde 401', () => expect(resposta.response.status()).toBe(401));
    },
  );

  test(
    '[API-NEG-TRANSACTION-AUTH-01] Protege os detalhes da transação sem sessão',
    { tag: [...TAGS, '@authentication', '@documentation', '@int-17'] },
    async ({ request }, testInfo) => {
      const tguid = process.env.INT_100_TGUID?.trim() || lerMassaBusca().buscas.TGUID?.valor;
      if (!tguid) throw new Error('BLOQUEADO: a massa não possui TGUID.');
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-17', release: RELEASE, objetivo: 'Impedir leitura anônima dos detalhes da transação',
      });
      const resposta = await bdd.quando('consulta a transação sem session-guid', () =>
        obterDetalhesTransacaoIntelligence(request, tguid));
      await bdd.entao('a API responde 401', () => expect(resposta.response.status()).toBe(401));
    },
  );

  test(
    '[API-NEG-TGUID-01] Trata TGUID malformado sem erro interno',
    { tag: [...TAGS, '@documentation', '@robustness'] },
    async ({ request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'DOC-INTELLIGENCE-TRANSACTION', release: RELEASE, objetivo: 'Validar identificador de transação',
      });
      const sessionGuid = await bdd.dado('um administrador possui uma sessão autenticada', () =>
        autenticarIntelligenceApi(request));
      const resposta = await bdd.quando('consulta um TGUID malformado', () =>
        obterDetalhesTransacaoIntelligence(request, 'tguid-invalido', sessionGuid));
      await bdd.entao('a API trata a entrada sem responder 500', () => {
        validarRespostaSemErroInterno(resposta.response.status(), 'profile/transaction');
      });
    },
  );

  const PAYLOADS_INVALIDOS = [
    { id: 'API-NEG-PAYLOAD-NAME-01', titulo: 'Rejeita busca sem nome do campo', payload: { value: '123', kind: 'KEY' } },
    { id: 'API-NEG-PAYLOAD-VALUE-01', titulo: 'Não expõe a base em busca com valor vazio', payload: { name: 'cpf', value: '', kind: 'KEY' } },
    { id: 'API-NEG-PAYLOAD-KIND-01', titulo: 'Rejeita busca com tipo de campo desconhecido', payload: { name: 'cpf', value: '123', kind: 'INVALID_KIND' } },
  ] as const;

  for (const caso of PAYLOADS_INVALIDOS) {
    test(
      `[${caso.id}] ${caso.titulo}`,
      { tag: [...TAGS, '@validation', '@documentation'] },
      async ({ request }, testInfo) => {
        const bdd = await criarCenarioBDD(testInfo, {
          ticket: caso.id, release: RELEASE, objetivo: caso.titulo,
        });
        const sessionGuid = await bdd.dado('um administrador possui uma sessão autenticada', () =>
          autenticarIntelligenceApi(request));
        const resultado = await bdd.quando('envia o payload inválido para count e list', () =>
          buscarPerfisIntelligenceComPayloadLivre(request, caso.payload, sessionGuid));
        await bdd.entao('a API trata a entrada sem erro interno nem exposição de perfis', () =>
          validarBuscaHostilSemExposicao(resultado));
      },
    );
  }

  const ENTRADAS_HOSTIS = [
    { id: 'API-DES-SQLI-01', titulo: 'Neutraliza tentativa de SQL injection', valor: "' OR '1'='1' --" },
    { id: 'API-DES-XSS-01', titulo: 'Neutraliza payload de script na busca', valor: '<script>alert(1)</script>' },
    { id: 'API-DES-PATH-01', titulo: 'Neutraliza tentativa de path traversal', valor: '../../../../etc/passwd' },
    { id: 'API-DES-OVERSIZE-01', titulo: 'Trata entrada excessivamente longa', valor: '9'.repeat(4096) },
  ] as const;

  for (const caso of ENTRADAS_HOSTIS) {
    test(
      `[${caso.id}] ${caso.titulo}`,
      { tag: [...TAGS, '@destructive', '@security', '@robustness'] },
      async ({ request }, testInfo) => {
        const bdd = await criarCenarioBDD(testInfo, {
          ticket: caso.id, release: RELEASE, objetivo: caso.titulo,
        });
        const sessionGuid = await bdd.dado('um administrador possui uma sessão autenticada', () =>
          autenticarIntelligenceApi(request));
        const resultado = await bdd.quando('envia a entrada hostil como valor de CPF', () =>
          buscarPerfisIntelligenceComPayloadLivre(
            request,
            { name: 'cpf', value: caso.valor, kind: 'KEY' },
            sessionGuid,
            { first: 0, size: 1 },
          ));
        await bdd.entao('a API não apresenta erro interno nem retorna perfis', () =>
          validarBuscaHostilSemExposicao(resultado));
      },
    );
  }

  test(
    '[API-NEG-PAGINATION-01] Trata índice de página negativo sem erro interno',
    { tag: [...TAGS, '@pagination', '@documentation', '@robustness'] },
    async ({ request }, testInfo) => {
      const entrada = lerMassaBusca().buscas.cpf;
      if (!entrada) throw new Error('BLOQUEADO: não existe massa pesquisável por CPF.');
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'DOC-INTELLIGENCE-INTEGRATION', release: RELEASE, objetivo: 'Validar limite inferior da paginação',
      });
      const sessionGuid = await bdd.dado('um administrador possui uma sessão autenticada', () =>
        autenticarIntelligenceApi(request));
      const resultado = await bdd.quando('solicita a posição inicial negativa com página unitária', () =>
        buscarPerfisIntelligence(request, payloadDaMassa(entrada), sessionGuid, { first: -1, size: 1 }));
      await bdd.entao('count e list não apresentam erro interno nem retornam mais de um item', () => {
        validarRespostaSemErroInterno(resultado.count.response.status(), 'count');
        validarRespostaSemErroInterno(resultado.list.response.status(), 'list');
        if (resultado.list.response.ok()) expect(extrairItens(resultado.list.body).length).toBeLessThanOrEqual(1);
      });
    },
  );

  test(
    '[INT-100-WRITE-ENDPOINTS-01] Exige o contrato dos endpoints de escrita para validar o bloqueio ao perfil somente leitura',
    { tag: ['@api', '@intelligence', '@negative', '@security', '@int-100', '@viewonly', '@coverage-gap', '@release-unassigned'] },
    async ({}, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'INT-100', release: RELEASE_INT_100, objetivo: 'Não inventar metodo/corpo de requisicao para os endpoints de escrita do perfil',
      });
      await bdd.dado(
        'o comentario de Rodrigo Giolo no INT-100 lista os endpoints que devem negar intelligence_view_only, sem informar metodo HTTP nem corpo da requisicao',
        async () => {
          throw new Error(
            'BLOQUEADO: INT-100 nao documenta o contrato (metodo, path params e body) de '
            + 'profile/consolidate/{pguid}, profile/consolidate/{pguid}/add/{tguid}, '
            + 'profile/consolidate/{pguid}/addTguids, profile/consolidate/{pguid}/minus/{tguid}, '
            + 'profile/updateBio/{pguid}/{tguid} e profile/people/{pguid}/keys. '
            + 'Chamar esses endpoints de escrita adivinhando o contrato arrisca mutar dados reais caso a '
            + 'autorizacao esteja quebrada (ja confirmado em profile/person e profile/list/count). '
            + 'Peca ao time de dev o metodo HTTP e o payload de cada endpoint para automatizar com seguranca.',
          );
        },
      );
    },
  );
});
