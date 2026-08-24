import { expect, test } from '@playwright/test';

import { criarCenarioBDD } from '../../../support/functions/comum/bdd.steps';
import { autenticarIntelligenceApi, buscarPerfisIntelligence } from '../../../support/functions/api/intelligence/intelligence.client';
import { obterCredenciaisParaPerfilIntelligence } from '../../../support/functions/api/intelligence/resolver-perfil-acesso.flow';
import { payloadDaMassa } from '../../../support/functions/api/intelligence/intelligence.client';

const RELEASE = '1.13.0';
const TAGS = ['@regression', '@api', '@intelligence', '@negative', '@transacoes'];

const PAYLOAD_BUSCA = {
  name: 'cpf',
  value: '00000000000',
  kind: 'KEY' as const,
};

test.describe('Intelligence API — transações negativo', () => {
  test(
    '[BUSCA-TRANSACAO-03] Busca é bloqueada para view-only',
    { tag: [...TAGS, '@search', '@viewonly', '@pw-BUSCA-TRANSACAO-03'] },
    async ({ request }, testInfo) => {
      const bdd = await criarCenarioBDD(testInfo, {
        ticket: 'BUSCA-TRANSACAO-03',
        release: RELEASE,
        objetivo: 'Validar que view-only não pode buscar transações',
      });

      const credenciais = await bdd.dado('existe view-only autenticado', () =>
        obterCredenciaisParaPerfilIntelligence(request, 'view-only'),
      );

      const sessionGuid = await bdd.e('tem sessão autenticada', () =>
        autenticarIntelligenceApi(request, credenciais),
      );

      const resultado = await bdd.quando('chama a API de busca', () =>
        buscarPerfisIntelligence(request, PAYLOAD_BUSCA, sessionGuid),
      );

      await bdd.entao('retorna HTTP 403 (acesso negado)', () => {
        expect(resultado.count.response.status()).toBe(403);
        expect(resultado.list.response.status()).toBe(403);
      });
    },
  );
});
