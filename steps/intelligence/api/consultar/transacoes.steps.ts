import { expect } from '@playwright/test';

import {
  autenticarIntelligenceApi,
  contemValor,
  obterDetalhesTransacaoIntelligence,
} from '../../../../utils/api/intelligence';
import { registrarCaso } from '../../../../utils/common/case-registry';
import { obterValorObrigatorioDaMassa } from '../../../../utils/data/intelligence';

registrarCaso('API-POS-TGUID-01', async (world) => {
  await world.garantirMassa();
  const tguid = obterValorObrigatorioDaMassa('TGUID', process.env.INT_100_TGUID);
  const request = await world.api();
  const sessionGuid = await autenticarIntelligenceApi(request);
  const resposta = await obterDetalhesTransacaoIntelligence(request, tguid, sessionGuid);
  expect(resposta.response.status()).toBe(200);
  expect(contemValor(resposta.body, tguid)).toBe(true);
});

registrarCaso('API-NEG-TRANSACTION-AUTH-01', async (world) => {
  const massa = await world.garantirMassa();
  const tguid = process.env.INT_100_TGUID?.trim() || massa.buscas.TGUID?.valor;
  if (!tguid) throw new Error('BLOQUEADO: a massa não possui TGUID.');
  expect(
    (await obterDetalhesTransacaoIntelligence(await world.api(), tguid)).response.status(),
  ).toBe(401);
});

registrarCaso('API-NEG-TGUID-01', async (world) => {
  const request = await world.api();
  const sessionGuid = await autenticarIntelligenceApi(request);
  const resposta = await obterDetalhesTransacaoIntelligence(
    request,
    'tguid-invalido',
    sessionGuid,
  );
  expect(
    resposta.response.status(),
    'profile/transaction nao deve provocar erro interno para TGUID invalido.',
  ).toBeLessThan(500);
});
