import { expect, test } from '@playwright/test';

import { cenario } from '../../support/functions/cenario';
import {
  autenticarIntelligenceApi,
  buscarPerfisIntelligence,
  payloadDaMassa,
  type PayloadBuscaIntelligence,
} from '../../support/functions/intelligence/intelligence.api';
import { lerMassaBusca } from '../../support/functions/massa/massa-busca';
import {
  bloquearTeste,
  urlApiIntelligenceConfigurada,
} from '../../support/functions/intelligence/intelligence.precondicoes';

const REL = '5.5.0.5062';
const PAYLOAD_SEM_DADO_REAL: PayloadBuscaIntelligence = {
  name: 'cpf',
  value: '00000000000',
  kind: 'KEY',
};

function esperarStatus(resultado: Awaited<ReturnType<typeof buscarPerfisIntelligence>>, status: number): void {
  expect(resultado.count.response.status(), 'status inesperado em /profile/list/count').toBe(status);
  expect(resultado.list.response.status(), 'status inesperado em /profile/list').toBe(status);
}

test.describe('INTELLIGENCE | API (negativo)', () => {
  test('@api @intelligence @search @security @negative @release-5.5.0.5062 | API-NEG-COMMON-04 - busca sem token retorna 401', async ({ request }, testInfo) => {
    if (!urlApiIntelligenceConfigurada()) {
      bloquearTeste(testInfo, 'informe INTELLIGENCE_API_URL ou uma INTELLIGENCE_UI_URL terminando em /react.');
    }

    const passo = await cenario(testInfo, {
      ticket: 'API-NEG-COMMON-04',
      release: REL,
      objetivo: 'Impedir acesso anonimo aos endpoints de busca',
    });

    const resultado = await passo.quando('chama count e list sem Authorization', () =>
      buscarPerfisIntelligence(request, PAYLOAD_SEM_DADO_REAL));
    await passo.entao('os dois endpoints recusam a chamada sem expor dados', () => esperarStatus(resultado, 401));
  });

  test('@api @intelligence @search @security @negative @release-5.5.0.5062 | API-NEG-COMMON-05 - busca com token invalido retorna 401', async ({ request }, testInfo) => {
    if (!urlApiIntelligenceConfigurada()) {
      bloquearTeste(testInfo, 'informe INTELLIGENCE_API_URL ou uma INTELLIGENCE_UI_URL terminando em /react.');
    }

    const passo = await cenario(testInfo, {
      ticket: 'API-NEG-COMMON-05',
      release: REL,
      objetivo: 'Rejeitar token invalido nos endpoints de busca',
    });

    const resultado = await passo.quando('chama count e list com um token invalido', () =>
      buscarPerfisIntelligence(request, PAYLOAD_SEM_DADO_REAL, 'token-invalido'));
    await passo.entao('os dois endpoints recusam a chamada sem expor dados', () => esperarStatus(resultado, 401));
  });

  test('@api @intelligence @int-100 @search @viewonly @security @negative @release-5.5.0.5062 | API-NEG-COMMON-06 - usuario view-only nao pode buscar', async ({ request }, testInfo) => {
    const usuario = process.env.INT_100_VIEWONLY_USERNAME?.trim();
    const senha = process.env.INT_100_VIEWONLY_PASSWORD?.trim();
    if (process.env.INT_100_FRONT_EM_QA !== 'true' || !usuario || !senha) {
      bloquearTeste(testInfo, 'requer INT_100_FRONT_EM_QA=true e credenciais do usuário view-only.');
    }
    if (!urlApiIntelligenceConfigurada()) {
      bloquearTeste(testInfo, 'informe INTELLIGENCE_API_URL ou uma INTELLIGENCE_UI_URL terminando em /react.');
    }
    const massa = lerMassaBusca(true);
    const entrada = ['cpf', 'EXTERNAL.ID', 'birthdate', 'name', 'cib']
      .map((tipo) => massa?.buscas[tipo])
      .find((item) => item?.kind);
    if (!entrada) {
      bloquearTeste(testInfo, 'nenhuma massa compatível com /profile/list foi gerada. Execute npm run massa:smart.');
    }
    const passo = await cenario(testInfo, {
      ticket: 'INT-100',
      release: REL,
      objetivo: 'R3: bloquear a API de busca para o usuario view-only',
    });

    const token = await passo.dado('um usuario view-only autenticado na API', () =>
      autenticarIntelligenceApi(request, { usuario, senha }));
    const resultado = await passo.quando('tenta chamar count e list diretamente', () =>
      buscarPerfisIntelligence(request, payloadDaMassa(entrada), token));
    await passo.entao('o backend nega os dois endpoints', () => esperarStatus(resultado, 403));
  });
});
