import { expect, test } from '@playwright/test';

import { criarCenarioBDD } from '../../../support/functions/comum/bdd.steps';
import { autenticarIntelligenceApi, obterDetalhesPerfilIntelligence } from '../../../support/functions/api/intelligence/intelligence.client';
import { obterCredenciaisParaPerfilIntelligence } from '../../../support/functions/api/intelligence/resolver-perfil-acesso.flow';
import { obterValorObrigatorioDaMassa } from '../../../support/massas/dados/intelligence.busca.massa';

const RELEASE = '1.13.0';
const TAGS = ['@regression', '@api', '@intelligence'];

test.describe('Intelligence API — perfis', () => {
  test(
    '[CONSULTA-PERFIL-01] Admin consulta perfil por PGUID',
    { tag: [...TAGS, '@positive', '@profile', '@pw-CONSULTA-PERFIL-01'] },
    async ({ request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'CONSULTA-PERFIL-01',
        release: RELEASE,
        objetivo: 'Validar consulta de perfil por admin',
      });

      const pguid = obterValorObrigatorioDaMassa('PGUID', process.env.INT_100_PGUID);

      const sessionGuid = await bdd.dado('existe admin autenticado', () => autenticarIntelligenceApi(request));

      const resposta = await bdd.quando('consulta perfil pela API', () =>
        obterDetalhesPerfilIntelligence(request, pguid, sessionGuid),
      );

      await bdd.entao('retorna dados completos com HTTP 200', () => {
        expect(resposta.response.status()).toBe(200);
        expect(resposta.body).toBeTruthy();
      });
    },
  );

  test(
    '[CONSULTA-PERFIL-02] View-only consulta perfil por PGUID',
    { tag: [...TAGS, '@positive', '@profile', '@viewonly', '@pw-CONSULTA-PERFIL-02'] },
    async ({ request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'CONSULTA-PERFIL-02',
        release: RELEASE,
        objetivo: 'Validar consulta de perfil por view-only',
      });

      const pguid = obterValorObrigatorioDaMassa('PGUID', process.env.INT_100_PGUID);

      const credenciais = await bdd.dado('existe view-only autenticado', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'),
      );

      const sessionGuid = await bdd.e('tem sessão autenticada', () =>
        autenticarIntelligenceApi(request, credenciais),
      );

      const resposta = await bdd.quando('consulta perfil conhecida pela API', () =>
        obterDetalhesPerfilIntelligence(request, pguid, sessionGuid),
      );

      await bdd.entao('retorna dados completos com HTTP 200', () => {
        expect(resposta.response.status()).toBe(200);
        expect(resposta.body).toBeTruthy();
      });
    },
  );

  test(
    '[CONSULTA-PERFIL-03] PGUID inexistente retorna 404',
    { tag: [...TAGS, '@negative', '@profile', '@not-found', '@pw-CONSULTA-PERFIL-03'] },
    async ({ request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'CONSULTA-PERFIL-03',
        release: RELEASE,
        objetivo: 'Validar tratamento de PGUID inexistente',
      });

      const pguidInexistente = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

      const sessionGuid = await bdd.dado('existe usuário autenticado', () => autenticarIntelligenceApi(request));

      const resposta = await bdd.quando('consulta PGUID aleatório', () =>
        obterDetalhesPerfilIntelligence(request, pguidInexistente, sessionGuid),
      );

      await bdd.entao('retorna HTTP 404', () => {
        expect(resposta.response.status()).toBe(404);
      });
    },
  );
});
